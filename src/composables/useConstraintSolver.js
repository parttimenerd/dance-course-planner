import { ref } from 'vue'
import { DanceCourseScheduler } from '../constraintSolver.js'

export function useConstraintSolver() {
  const scheduler = ref(null)
  const schedules = ref([])
  const generating = ref(false)
  const error = ref(null)

  const initializeScheduler = (scheduleData) => {
    if (scheduleData) {
      scheduler.value = new DanceCourseScheduler(scheduleData)
    }
  }

  const generateSchedules = async (constraints) => {
    if (!scheduler.value || generating.value) return []

    try {
      generating.value = true
      error.value = null
      
      // Convert time strings to hours
      const preferences = {
        selectedCourseIds: constraints.selectedCourseIds,
        allowedDays: constraints.allowedDays,
        blockedDays: constraints.blockedDays,
        maxCoursesPerDay: constraints.maxCoursesPerDay,
        maxTimeBetweenCourses: constraints.maxTimeBetweenCourses,
        noDuplicateCoursesPerDay: constraints.noDuplicateCoursesPerDay,
        preventOverlaps: constraints.preventOverlaps
      }

      if (constraints.earliestTimeStr) {
        const [hours, minutes] = constraints.earliestTimeStr.split(':').map(Number)
        preferences.earliestTime = hours + minutes / 60
      }

      if (constraints.latestTimeStr) {
        const [hours, minutes] = constraints.latestTimeStr.split(':').map(Number)
        preferences.latestTime = hours + minutes / 60
      }

      // Generate schedules using the CSP solver
      const results = scheduler.value.generateSchedule(preferences)
      schedules.value = results
      
      return results
    } catch (err) {
      console.error('Failed to generate schedules:', err)
      error.value = 'Failed to generate schedules. Please try again.'
      throw err
    } finally {
      generating.value = false
    }
  }

  const getCourseGroups = () => {
    return scheduler.value ? scheduler.value.getCourseGroups() : new Map()
  }

  const getCourseNames = () => {
    return scheduler.value ? scheduler.value.getCourseNames() : []
  }

  return {
    scheduler,
    schedules,
    generating,
    error,
    initializeScheduler,
    generateSchedules,
    getCourseGroups,
    getCourseNames
  }
}
