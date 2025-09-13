<template>
  <div class="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">
        📋 Preferences & Constraints
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
      availableCourses,
      handleShare,
      updateConstraints,
      handleLocationChanged,
      handleCourseSelectionChanged
    }
  }
}
</script>
