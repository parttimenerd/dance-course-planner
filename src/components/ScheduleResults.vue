<template>
  <div>
    <!-- No Results State -->
    <EmptyState
      v-if="!hasResults"
      :show-login-hint="showLoginHint"
    />

    <!-- Results -->
    <div v-else>
      <!-- Saved Schedules Section -->
      <div v-if="hasSavedSolutions" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div 
            class="flex items-center space-x-3 cursor-pointer hover:opacity-75 transition-opacity"
            @click="toggleSavedSectionVisibility"
          >
            <h2 class="text-xl font-semibold text-gray-900 flex items-center">
              ⭐ {{ getSavedSchedulesHeaderText }}
            </h2>
            <div
              :class="[
                'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
              :title="isSavedSectionVisible ? t('Hide saved schedules') : t('Show saved schedules')"
            >
              <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isSavedSectionVisible }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="clearAllSavedSolutions"
              class="text-xs text-red-600 hover:text-red-700 underline"
              :title="t('Clear all saved')"
            >
              {{ t('Clear all') }}
            </button>
          </div>
        </div>
        
        <!-- Saved Schedules List -->
        <div v-if="isSavedSectionVisible" class="space-y-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <ScheduleSolution
            v-for="(schedule, index) in savedSchedules"
            :key="`saved-${schedule.id}-${index}`"
            :schedule="schedule"
            :index="index"
            :config="config"
            :highlighted="false"
            :course-duration-minutes="courseDurationMinutes"
            @share="$emit('schedule-share', $event)"
            @toggle-highlight="() => {}"
          />
          <div v-if="savedSchedules.length === 0" class="text-center text-gray-500 py-4">
            {{ t('No saved schedules') }}
          </div>
        </div>
      </div>

      <!-- Results Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="relative">
          <h2 class="text-xl font-semibold text-gray-900">
            📋 {{ t('Generated Schedules') }}
          </h2>
          <!-- Dancing Loading Indicator -->
          <div v-if="generating" class="absolute -right-10 top-0 flex items-center">
            <div class="text-2xl">💃🕺</div>
          </div>
        </div>
        <div class="text-sm text-gray-600">
          <span v-if="generating" class="animate-pulse">{{ t('Computing schedules...') }}</span>
          <span v-else>{{ getScheduleCountText(schedules.length) }}</span>
        </div>
      </div>

      <!-- No Solutions -->
      <div v-if="schedules.length === 0" class="space-y-4">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div class="flex">
            <div class="text-yellow-400">⚠️</div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">{{ t('No Valid Schedules Found') }}</h3>
              <p class="mt-1 text-sm text-yellow-700">
                <span v-if="suggestions && suggestions.length > 0">
                  {{ t('Your current constraints are too restrictive. Try one of the suggestions below:') }}
                </span>
                <span v-else>
                  {{ t('Your current constraints are too restrictive.') }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <div v-if="suggestions && suggestions.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div class="flex items-start">
            <div class="text-blue-400">💡</div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-blue-800 mb-3">{{ t('Suggested Changes') }}</h3>
              <div class="space-y-2">
                <button
                  v-for="suggestion in suggestions"
                  :key="suggestion.type"
                  @click="$emit('apply-suggestion', suggestion)"
                  class="w-full text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div class="text-sm font-medium text-blue-900">{{ suggestion.description }}</div>
                  <div class="text-xs text-blue-600 mt-1">
                    {{ getSuggestionTypeLabel(suggestion.type) }}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule List -->
      <div v-else class="space-y-6">
        <ScheduleSolution
          v-for="(schedule, index) in schedules"
          :key="index"
          :schedule="schedule"
          :index="index"
          :config="config"
          :highlighted="highlightedSchedule === index"
          :course-duration-minutes="courseDurationMinutes"
          @share="$emit('schedule-share', $event)"
          @toggle-highlight="$emit('toggle-highlight', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import ScheduleSolution from './ScheduleSolution.vue'
import EmptyState from './EmptyState.vue'
import { useI18n } from '../composables/useI18n.js'
import { useSavedSolutions } from '../composables/useSavedSolutions.js'

export default {
  name: 'ScheduleResults',
  components: {
    ScheduleSolution,
    EmptyState
  },
  props: {
    schedules: {
      type: Array,
      default: () => []
    },
    suggestions: {
      type: Array,
      default: () => []
    },
    hasResults: {
      type: Boolean,
      default: false
    },
    config: {
      type: Object,
      required: true
    },
    highlightedSchedule: {
      type: Number,
      default: null
    },
    generating: {
      type: Boolean,
      default: false
    },
    showLoginHint: {
      type: Boolean,
      default: false
    },
    courseDurationMinutes: {
      type: Number,
      default: 70 // Default: 60min class + 10min break
    }
  },
  emits: ['schedule-share', 'apply-suggestion', 'toggle-highlight'],
  setup() {
    const { t, language } = useI18n()
    const { 
      savedSchedules,
      hasSavedSolutions,
      isSavedSectionVisible,
      toggleSavedSectionVisibility,
      clearAllSavedSolutions 
    } = useSavedSolutions()

    const getScheduleCountText = (count) => {
      if (language.value === 'de') {
        if (count === 1) {
          return 'Ein möglicher Stundenplan gefunden'
        } else {
          return `${count} mögliche Stundenpläne gefunden`
        }
      } else {
        if (count === 1) {
          return 'Found 1 possible schedule'
        } else {
          return `Found ${count} possible schedules`
        }
      }
    }

    const getSavedSchedulesHeaderText = computed(() => {
      const count = savedSchedules.value.length
      
      if (language.value === 'de') {
        const numberNames = {
          1: 'Ein gespeicherter',
          2: 'Zwei gespeicherte', 
          3: 'Drei gespeicherte',
          4: 'Vier gespeicherte',
          5: 'Fünf gespeicherte'
        }
        
        if (count <= 5) {
          return `${numberNames[count]} Stundenplan${count > 1 ? 'e' : ''}`
        } else {
          return `${count} gespeicherte Stundenpläne`
        }
      } else {
        if (count === 1) {
          return 'One Saved Schedule'
        } else if (count === 2) {
          return 'Two Saved Schedules'  
        } else if (count === 3) {
          return 'Three Saved Schedules'
        } else if (count === 4) {
          return 'Four Saved Schedules'
        } else if (count === 5) {
          return 'Five Saved Schedules'
        } else {
          return `${count} Saved Schedules`
        }
      }
    })

    return {
      t,
      getScheduleCountText,
      getSavedSchedulesHeaderText,
      // Saved solutions
      savedSchedules,
      hasSavedSolutions,
      isSavedSectionVisible,
      toggleSavedSectionVisibility,
      clearAllSavedSolutions
    }
  },
  methods: {
    getSuggestionTypeLabel(type) {
      const labels = {
        increaseGap: this.t('Allow more time between courses'),
        addTimeSlot: this.t('Add more available times'),
        addPerDayTimeSlot: this.t('Add specific time slot'),
        addAllDayTimeSlots: this.t('Add all time slots for day'),
        enableDayTimeSlots: this.t('Enable time slots for day'),
        removeCourse: this.t('Reduce course selection')
      }
      return labels[type] || this.t('Adjust constraints')
    }
  }
}
</script>
