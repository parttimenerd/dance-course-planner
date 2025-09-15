import { ref } from 'vue'
import { HintingSolver } from '../hintingSolver.js'

export function useConstraintSolver() {
  const scheduleData = ref(null)
  const courseGroups = ref(new Map())
  const schedules = ref([])
  const generating = ref(false)
  const error = ref(null)
  const suggestions = ref([])

  const initializeScheduler = (data) => {
    if (data) {
      scheduleData.value = data
      
      // Create course groups map from the data
      const groups = new Map()
      if (data.courses) {
        for (const course of data.courses) {
          if (!groups.has(course.name)) {
            groups.set(course.name, [])
          }
          groups.get(course.name).push(course)
        }
      }
      courseGroups.value = groups
    }
  }

  const generateSchedules = async (constraints) => {
    if (!scheduleData.value || generating.value) return []

    try {
      generating.value = true
      error.value = null
      suggestions.value = []
      
      // Prepare input for HintingSolver
      const selectedCourses = {}
      const existingCourses = {}
      
      // Convert selected courses to the format expected by HintingSolver
      for (const courseName of constraints.selectedCourseNames || []) {
        const courseGroup = courseGroups.value.get(courseName)
        if (courseGroup) {
          // Filter out pair courses if disabled
          let availableCourses = courseGroup
          if (constraints.disablePairCourses) {
            availableCourses = courseGroup.filter(course => !course.pairOnly)
          }
          
          // Convert courses to time slots format
          const timeSlots = availableCourses.map(course => ({
            day: course.day,
            slot: course.startTime.getHours() * 60 + course.startTime.getMinutes()
          }))
          
          selectedCourses[courseName] = timeSlots
          existingCourses[courseName] = timeSlots // For now, same as selected (all enabled)
        }
      }
      
      // Prepare constraints for solver
      const solverInput = {
        selectedCourses,
        existingCourses,
        maxCoursesPerDay: constraints.maxCoursesPerDay,
        courseMultiplicity: {}
      }

      // Only include multiplicity for selected courses
      const multiplicity = constraints.courseMultiplicity || {}
      for (const name of Object.keys(selectedCourses)) {
        if (multiplicity[name] && multiplicity[name] > 1) {
          solverInput.courseMultiplicity[name] = multiplicity[name]
        }
      }
      
      // Add time constraints if specified
      if (constraints.maxTimeBetweenCourses !== undefined && constraints.maxTimeBetweenCourses >= 0) {
        // Convert slot-based constraint to hours:
        // 0 slots = max 20 minutes (0.33 hours) gap
        // 1 slot = max 50 minutes (0.83 hours) gap  
        // 2 slots = max 80 minutes (1.33 hours) gap
        // Formula: maxHours = (slots * 0.5) + 0.33
        const maxHours = (constraints.maxTimeBetweenCourses * 0.5) + 0.33
        solverInput.maxEmptySlotsBetweenCourses = maxHours
      }
      
      // Use HintingSolver
      const hintingSolver = new HintingSolver()
      
      // Set course duration if specified
      if (constraints.courseDurationMinutes) {
        hintingSolver.setCourseDuration(constraints.courseDurationMinutes)
      }
      
      const result = hintingSolver.solve(solverInput, 20) // Get up to 20 solutions
      
      if (result.success) {
        // Convert solver results back to display format
        const convertedSchedules = result.schedules.map((schedule, index) => ({
          id: index,
          courses: Object.entries(schedule.schedule).map(([courseName, slots]) => ({
            name: courseName,
            timeSlots: slots.map(slot => ({
              day: slot.day,
              hour: Math.floor(slot.slot / 60),
              minute: slot.slot % 60
            }))
          })),
          stats: {
            days: schedule.days,
            coursesOnBusiestDay: schedule.coursesOnBusiestDay,
            maxGapBetweenCourses: schedule.maxGapBetweenCourses,
            score: schedule.score
          }
        }))
        
        schedules.value = convertedSchedules
        return convertedSchedules
      } else {
        // No solution found - show hints and alternatives
        schedules.value = []
        
        // Convert hints to suggestions format
        const hintSuggestions = (result.hints || []).map(hint => ({
          type: 'hint',
          message: hint.description,
          action: hint.type,
          data: hint.modification
        }))
        
        // Convert alternatives to suggestions format
        const alternativeSuggestions = (result.alternatives || []).map(alternative => ({
          type: 'alternative',
          message: alternative.description,
          action: 'use_alternative',
          schedules: alternative.schedules.length
        }))
        
        suggestions.value = [...hintSuggestions, ...alternativeSuggestions]
        return []
      }
    } catch (err) {
      console.error('Failed to generate schedules:', err)
      error.value = 'Failed to generate schedules. Please try again.'
      throw err
    } finally {
      generating.value = false
    }
  }

  const getCourseGroups = () => {
    return courseGroups.value
  }

  const getCourseNames = () => {
    return Array.from(courseGroups.value.keys())
  }

  return {
    scheduleData,
    schedules,
    generating,
    error,
    suggestions,
    initializeScheduler,
    generateSchedules,
    getCourseGroups,
    getCourseNames
  }
}
