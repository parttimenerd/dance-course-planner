<template>
  <div class="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:sticky lg:top-8" data-preferences>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {{ t('Preferences') }}
      </h2>
      <div class="flex items-center space-x-2">
        <!-- Mobile: Jump to solutions button -->
        <button
          @click="scrollToSolutions"
          class="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors touch-manipulation"
          :title="t('Jump to solutions')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        <ShareButton 
          :config="constraints" 
          type="config" 
          @share="handleShare" 
        />
      </div>
    </div>

    <!-- Location Selector (conditional based on config) -->
    <LocationSelector 
      v-if="appConfig?.locationSelector?.showLocationSelector !== false"
      :model-value="constraints.selectedLocation"
      :schedule-data="scheduleData"
      @location-changed="handleLocationChanged"
    />

    <!-- Course Selection -->
    <CourseSelector 
      :model-value="constraints.selectedCourseNames"
      :course-groups="courseGroups"
      :constraints="constraints"
      @update:modelValue="handleCourseSelectionChanged"
      @update:constraints="updateConstraints"
    />

    <!-- Disable Pair Courses -->
    <div class="mt-2 p-3 mb-4">
      <div>
        <label class="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            :checked="constraints.disablePairCourses"
            @change="handleDisablePairCoursesChanged"
            class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {{ t('Disable Pair Courses') }} 💃🕺
        </label>
        <p class="text-xs text-gray-500 mt-1 ml-5">
          {{ t('Exclude courses that require a dance partner') }}
        </p>
      </div>
    </div>

    <!-- Time Constraints -->
    <TimeConstraints 
      :model-value="constraints"
      :available-courses="availableCourses"
      @update:modelValue="updateConstraints"
    />

    <!-- Day Constraints -->
    <DayConstraints 
      :model-value="constraints"
      @update:modelValue="updateConstraints"
    />

    <!-- Advanced Settings (Collapsible) -->
    <div class="mt-4">
      <CollapsibleSection
        :initial-expanded="false"
        :header-classes="'mb-2'"
        class="p-3 bg-gray-50 rounded-lg border"
      >
        <template #header>
          <h4 class="text-sm font-medium text-gray-700 flex items-center">
            <svg class="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ t('Advanced Settings') }}
          </h4>
        </template>
        
        <template #content>
          <div class="space-y-4">
            <!-- Course Duration Setting -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('Course Duration (minutes)') }}
              </label>
              <div class="flex items-center space-x-3">
                <input
                  type="number"
                  :value="constraints.courseDurationMinutes"
                  @input="handleCourseDurationChanged"
                  min="30"
                  max="120"
                  step="5"
                  class="block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <span class="text-sm text-gray-600">
                  {{ t('minutes (for gap calculations)') }}
                </span>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                {{ t('Duration of each course including break time. Default: 70 minutes (60min class + 10min break)') }}
              </p>
            </div>

            <!-- Course Multiplicity/Frequency Setting -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                📅 {{ t('Course Frequency') }}
              </h4>
              <p class="text-xs text-gray-500 mb-3">
                {{ t('Configure how many times each course should appear in the schedule') }}
              </p>
              
                            <div v-if="constraints.selectedCourseNames && constraints.selectedCourseNames.length > 0" class="space-y-3">
                <div 
                  v-for="courseName in constraints.selectedCourseNames" 
                  :key="courseName" 
                  class="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <span class="text-sm text-gray-700 flex-1 mr-3">{{ courseName }}</span>
                  <div class="flex items-center space-x-2">
                    <button
                      @click="decreaseMultiplicity(courseName)"
                      :disabled="getCourseMultiplicity(courseName) <= 1"
                      class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-600 text-xs font-medium flex items-center justify-center"
                    >
                      −
                    </button>
                    <span class="w-8 text-center text-sm font-medium">
                      {{ getCourseMultiplicity(courseName) }}
                    </span>
                    <button
                      @click="increaseMultiplicity(courseName)"
                      class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-medium flex items-center justify-center"
                    >
                      +
                    </button>
                    <span class="text-xs text-gray-500 ml-2">
                      {{ getCourseMultiplicity(courseName) === 1 ? t('time/week') : t('times/week') }}
                    </span>
                  </div>
                </div>
                
                <div class="text-xs text-gray-600">
                  💡 {{ t('Set how many times per week each course should be scheduled') }}
                </div>
              </div>
              <div v-else class="text-sm text-gray-500 italic">
                {{ t('Select courses to configure multiplicity') }}
              </div>
            </div>
          </div>
        </template>
      </CollapsibleSection>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import LocationSelector from './LocationSelector.vue'
import CourseSelector from './CourseSelector.vue'
import TimeConstraints from './TimeConstraints.vue'
import DayConstraints from './DayConstraints.vue'
import ShareButton from './ShareButton.vue'
import CollapsibleSection from './CollapsibleSection.vue'

export default {
  name: 'ConstraintPanel',
  components: {
    LocationSelector,
    CourseSelector,
    TimeConstraints,
    DayConstraints,
    ShareButton,
    CollapsibleSection
  },
  props: {
    constraints: {
      type: Object,
      required: true
    },
    scheduleData: {
      type: Object,
      default: null
    },
    courseGroups: {
      type: Map,
      default: () => new Map()
    },
    appConfig: {
      type: Object,
      default: () => ({
        locationSelector: { showLocationSelector: false }
      })
    }
  },
  emits: ['location-changed', 'update:constraints'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    const availableCourses = computed(() => {
      if (!props.constraints.selectedCourseNames || props.constraints.selectedCourseNames.length === 0) {
        return []
      }
      
      const courses = []
      for (const [courseName, courseInstances] of props.courseGroups) {
        if (props.constraints.selectedCourseNames.includes(courseName)) {
          courses.push(...courseInstances)
        }
      }
      
      return courses
    })

    const handleShare = (shareData) => {
      console.log('Sharing config:', shareData)
    }

    const updateConstraints = (newConstraints) => {
      emit('update:constraints', newConstraints)
    }

    const handleLocationChanged = (location) => {
      emit('location-changed', location)
    }

    const handleCourseSelectionChanged = (courseNames) => {
      const updatedConstraints = { ...props.constraints, selectedCourseNames: courseNames }
      emit('update:constraints', updatedConstraints)
    }

    const handleCourseDurationChanged = (event) => {
      const duration = parseInt(event.target.value, 10)
      if (!isNaN(duration) && duration >= 30 && duration <= 120) {
        const updatedConstraints = { ...props.constraints, courseDurationMinutes: duration }
        emit('update:constraints', updatedConstraints)
      }
    }

    const handleDisablePairCoursesChanged = (event) => {
      const updatedConstraints = { ...props.constraints, disablePairCourses: event.target.checked }
      emit('update:constraints', updatedConstraints)
    }

    // Course Multiplicity/Frequency management
    const getCourseMultiplicity = (courseName) => {
      return props.constraints.courseMultiplicity?.[courseName] || 1
    }

    const updateCourseMultiplicity = (courseName, multiplicity) => {
      const newMultiplicity = { ...props.constraints.courseMultiplicity }
      if (multiplicity === 1) {
        // Remove from multiplicity object if it's the default value
        delete newMultiplicity[courseName]
      } else {
        newMultiplicity[courseName] = multiplicity
      }
      
      // Emit updated constraints
      const updatedConstraints = {
        ...props.constraints,
        courseMultiplicity: newMultiplicity
      }
      emit('update:constraints', updatedConstraints)
    }

    const increaseMultiplicity = (courseName) => {
      const current = getCourseMultiplicity(courseName)
      if (current < 5) { // Max 5 times per week
        updateCourseMultiplicity(courseName, current + 1)
      }
    }

    const decreaseMultiplicity = (courseName) => {
      const current = getCourseMultiplicity(courseName)
      if (current > 1) {
        updateCourseMultiplicity(courseName, current - 1)
      }
    }

    const scrollToSolutions = () => {
      // Find the solutions section and scroll to it
      const solutionsSection = document.querySelector('.schedule-results, [data-solutions]')
      if (solutionsSection) {
        solutionsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    }

    return {
      t,
      availableCourses,
      handleShare,
      updateConstraints,
      handleLocationChanged,
      handleCourseSelectionChanged,
      handleCourseDurationChanged,
      handleDisablePairCoursesChanged,
      getCourseMultiplicity,
      increaseMultiplicity,
      decreaseMultiplicity,
      scrollToSolutions
    }
  }
}
</script>
