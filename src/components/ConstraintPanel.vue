<template>
  <div class="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {{ t('Preferences') }}
      </h2>
      <div class="flex items-center space-x-2">
        <ShareButton 
          :config="constraints" 
          type="config" 
          @share="handleShare" 
        />
      </div>
    </div>

    <!-- Location Selector -->
    <LocationSelector 
      :model-value="constraints.selectedLocation"
      :schedule-data="scheduleData"
      @location-changed="handleLocationChanged"
    />

    <!-- Course Selection -->
    <CourseSelector 
      :model-value="constraints.selectedCourseNames"
      :course-groups="courseGroups"
      @update:modelValue="handleCourseSelectionChanged"
    />

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

export default {
  name: 'ConstraintPanel',
  components: {
    LocationSelector,
    CourseSelector,
    TimeConstraints,
    DayConstraints,
    ShareButton
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

    return {
      t,
      availableCourses,
      handleShare,
      updateConstraints,
      handleLocationChanged,
      handleCourseSelectionChanged
    }
  }
}
</script>
