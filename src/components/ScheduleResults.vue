<template>
  <div>
    <!-- No Results State -->
    <div v-if="!hasResults" class="bg-white rounded-lg shadow-sm border p-8 text-center">
      <div class="text-6xl mb-4">💃🕺</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Ready to Plan Your Dance Schedule?</h3>
      <p class="text-gray-600">
        Select your preferred courses and set your constraints to find the perfect combination!
      </p>
    </div>

    <!-- Results -->
    <div v-else>
      <!-- Results Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="relative">
          <h2 class="text-xl font-semibold text-gray-900">
            📋 Generated Schedules
          </h2>
          <!-- Dancing Loading Indicator -->
          <div v-if="generating" class="absolute -right-10 top-0 flex items-center">
            <div class="animate-bounce text-2xl" style="animation-duration: 0.8s;">💃🕺</div>
          </div>
        </div>
        <div class="text-sm text-gray-600">
          <span v-if="generating" class="animate-pulse">Computing schedules...</span>
          <span v-else>Found {{ schedules.length }} possible schedule{{ schedules.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- No Solutions -->
      <div v-if="schedules.length === 0" class="space-y-4">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div class="flex">
            <div class="text-yellow-400">⚠️</div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">No Valid Schedules Found</h3>
              <p class="mt-1 text-sm text-yellow-700">
                Your current constraints are too restrictive. Try one of the suggestions below:
              </p>
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <div v-if="suggestions && suggestions.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div class="flex items-start">
            <div class="text-blue-400">💡</div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-blue-800 mb-3">Suggested Changes</h3>
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
          @share="$emit('schedule-share', $event)"
          @toggle-highlight="$emit('toggle-highlight', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ScheduleSolution from './ScheduleSolution.vue'

export default {
  name: 'ScheduleResults',
  components: {
    ScheduleSolution
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
    }
  },
  emits: ['schedule-share', 'apply-suggestion', 'toggle-highlight'],
  methods: {
    getSuggestionTypeLabel(type) {
      const labels = {
        increaseGap: 'Allow more time between courses',
        addTimeSlot: 'Add more available times',
        addPerDayTimeSlot: 'Add specific time slot',
        addAllDayTimeSlots: 'Add all time slots for day',
        enableDayTimeSlots: 'Enable time slots for day',
        removeCourse: 'Reduce course selection'
      }
      return labels[type] || 'Adjust constraints'
    }
  }
}
</script>
