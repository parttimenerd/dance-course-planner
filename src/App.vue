<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ t('Dance Course Planner') }}
          </h1>
          <div class="flex items-center space-x-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-gray-600">{{ t('Loading schedule data...') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <div class="text-red-400">⚠️</div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">{{ t('Error loading schedule') }}</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Constraints Panel -->
        <div class="lg:col-span-1">
          <ConstraintPanel
            :constraints="constraints"
            :schedule-data="scheduleData"
            :course-groups="courseGroups"
            @location-changed="handleLocationChange"
            @update:constraints="handleConstraintsUpdate"
          />
        </div>

        <!-- Results Panel -->
                <!-- Results Panel -->
        <div class="lg:col-span-2">
          <ScheduleResults
            :schedules="displaySchedules"
            :suggestions="suggestions"
            :has-results="hasGeneratedSchedules"
            :config="constraints"
            :highlighted-schedule="highlightedSchedule"
            :generating="generating"
            @schedule-share="handleScheduleShare"
            @apply-suggestion="handleApplySuggestion"
            @toggle-highlight="handleToggleHighlight"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUrlState } from './composables/useUrlState.js'
import { useScheduleData } from './composables/useScheduleData.js'
import { useConstraintSolver } from './composables/useConstraintSolver.js'
import { useCookieState } from './composables/useCookieState.js'
import { useI18n } from './composables/useI18n.js'
import { DanceCourseScheduler } from './constraintSolver.js'
import ConstraintPanel from './components/ConstraintPanel.vue'
import ScheduleResults from './components/ScheduleResults.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    ConstraintPanel,
    ScheduleResults,
    LanguageSwitcher
  },
  setup() {
    // Internationalization
    const { t, dayNames } = useI18n()
    
    // URL state management
    const { loadFromUrl, saveToUrl, generateShareUrl } = useUrlState()
    
    // Cookie state management
    const { loadStateFromCookies, saveStateToCookies } = useCookieState()

    // Reactive state
    const loading = ref(true)
    const error = ref(null)
    const generating = ref(false)
    const hasGeneratedSchedules = ref(false)
    const scheduleData = ref(null)
    const scheduler = ref(null)
    const schedules = ref([])
    const displaySchedules = ref([]) // Schedules to display (only updated when generation complete)
    const suggestions = ref([])
    const highlightedSchedule = ref(null)

    // Load initial state from cookies
    const initialState = loadStateFromCookies()

    // Constraints - load from cookies first, then override with URL if present
    const constraints = reactive(initialState.constraints)

    // Computed properties
    const totalCourses = computed(() => {
      return scheduler.value ? getFilteredCourses().length : 0
    })

    const availableCourseNames = computed(() => {
      return scheduler.value ? scheduler.value.getCourseNames() : []
    })

    const courseGroups = computed(() => {
      return scheduler.value ? scheduler.value.getCourseGroups() : new Map()
    })

    const canGenerate = computed(() => {
      return constraints.selectedCourseNames && Array.isArray(constraints.selectedCourseNames) && constraints.selectedCourseNames.length > 0
    })

    // Helper function to filter courses by location
    const getFilteredCourses = () => {
      if (!scheduler.value) return []
      
      let courses = scheduler.value.courses
      
      if (constraints.selectedLocation) {
        courses = courses.filter(course => 
          course.location === constraints.selectedLocation
        )
      }
      
      return courses
    }

    // Methods
    const loadScheduleData = async () => {
      try {
        loading.value = true
        error.value = null

        const response = await fetch(`${import.meta.env.BASE_URL}schedule.json`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        scheduleData.value = data
        scheduler.value = new DanceCourseScheduler(data)

        // Load constraints from URL after scheduler is ready (URL overrides cookies)
        const urlConstraints = loadFromUrl()
        if (Object.keys(urlConstraints).length > 0) {
          Object.assign(constraints, urlConstraints)
          // Set highlighted schedule if present in URL
          if (urlConstraints.highlightSchedule !== undefined) {
            highlightedSchedule.value = urlConstraints.highlightSchedule
          }
        }
        
        // Auto-generate schedules if courses are already selected (from cookies or URL)
        if (constraints.selectedCourseNames && constraints.selectedCourseNames.length > 0) {
          // Small delay to ensure all reactive updates are complete
          setTimeout(() => {
            generateSchedules()
          }, 100)
        }
        
      } catch (err) {
        console.error('Failed to load schedule data:', err)
        error.value = 'Failed to load schedule data. Make sure schedule.json exists and is accessible.'
      } finally {
        loading.value = false
      }
    }

    const generateSchedules = async () => {
      if (!scheduler.value || generating.value) return

      try {
        generating.value = true
        
        // Convert time strings to hours
        const preferences = {
          selectedCourseNames: constraints.selectedCourseNames,
          allowedDays: constraints.allowedDays,
          blockedDays: constraints.blockedDays,
          maxCoursesPerDay: constraints.maxCoursesPerDay,
          maxTimeBetweenCourses: constraints.maxTimeBetweenCourses,
          noDuplicateCoursesPerDay: constraints.noDuplicateCoursesPerDay,
          preventOverlaps: constraints.preventOverlaps,
          selectedTimeSlots: constraints.selectedTimeSlots,
          perDayTimeSlots: constraints.perDayTimeSlots
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
        
        // Only update schedules after generation is complete to prevent flickering
        // Handle new response format with solutions and suggestions
        if (results && typeof results === 'object' && results.solutions !== undefined) {
          schedules.value = results.solutions || []
          displaySchedules.value = results.solutions || []
          suggestions.value = results.suggestions || []
        } else {
          // Backward compatibility - if it returns an array directly
          schedules.value = Array.isArray(results) ? results : []
          displaySchedules.value = Array.isArray(results) ? results : []
          suggestions.value = []
        }
        
        hasGeneratedSchedules.value = true

        // Save current state to URL
        saveToUrl(constraints)

      } catch (err) {
        console.error('Failed to generate schedules:', err)
        error.value = 'Failed to generate schedules. Please try again.'
      } finally {
        generating.value = false
      }
    }

    const handleLocationChange = (location) => {
      constraints.selectedLocation = location
      // Reset selected courses when location changes
      constraints.selectedCourseNames = []
      hasGeneratedSchedules.value = false
      schedules.value = []
      displaySchedules.value = []
    }

    const handleScheduleShare = (shareData) => {
      console.log('Schedule shared:', shareData)
    }

    const handleConstraintsUpdate = (updatedConstraints) => {
      Object.assign(constraints, updatedConstraints)
    }

    const handleApplySuggestion = (suggestion) => {
      // Apply the suggested changes to constraints
      Object.assign(constraints, suggestion.changes)
      
      // Clear suggestions and regenerate
      suggestions.value = []
      setTimeout(() => {
        generateSchedules()
      }, 100)
    }

    const handleToggleHighlight = (scheduleIndex) => {
      // Toggle highlighting and update URL
      highlightedSchedule.value = scheduleIndex
      // Update URL with or without highlighting
      if (scheduleIndex !== null) {
        const urlParams = new URLSearchParams(window.location.search)
        urlParams.set('highlightSchedule', scheduleIndex.toString())
        const newUrl = new URL(window.location)
        newUrl.search = urlParams.toString()
        window.history.replaceState({}, '', newUrl)
      } else {
        // Remove highlighting from URL
        const urlParams = new URLSearchParams(window.location.search)
        urlParams.delete('highlightSchedule')
        const newUrl = new URL(window.location)
        newUrl.search = urlParams.toString()
        window.history.replaceState({}, '', newUrl)
      }
    }

    // Watch for constraint changes to reset results and auto-generate
    watch(() => constraints.selectedCourseNames, () => {
      hasGeneratedSchedules.value = false
      // Don't clear schedules immediately - keep them visible while regenerating
      suggestions.value = []
      
      // Auto-generate if we have courses selected
      if (constraints.selectedCourseNames.length > 0 && !generating.value) {
        // Small delay to allow UI to update
        setTimeout(() => {
          generateSchedules()
        }, 100)
      } else if (constraints.selectedCourseNames.length === 0) {
        // Clear schedules only when no courses are selected
        schedules.value = []
        displaySchedules.value = []
      }
    }, { deep: true })

    // Watch for other constraint changes for auto-generation
    watch(() => ({
      selectedLocation: constraints.selectedLocation,
      earliestTimeStr: constraints.earliestTimeStr,
      latestTimeStr: constraints.latestTimeStr,
      allowedDays: [...constraints.allowedDays],
      blockedDays: [...constraints.blockedDays],
      maxCoursesPerDay: constraints.maxCoursesPerDay,
      maxTimeBetweenCourses: constraints.maxTimeBetweenCourses,
      noDuplicateCoursesPerDay: constraints.noDuplicateCoursesPerDay,
      preventOverlaps: constraints.preventOverlaps,
      perDayTimeSlots: { ...constraints.perDayTimeSlots }
    }), () => {
      // Reset results for any constraint change
      hasGeneratedSchedules.value = false
      // Don't clear schedules immediately - keep them visible while regenerating
      suggestions.value = []
      
      // Auto-generate if we have courses selected
      if (constraints.selectedCourseNames.length > 0 && !generating.value) {
        // Small delay to allow UI to update
        setTimeout(() => {
          generateSchedules()
        }, 100)
      }
    }, { deep: true })

    // Watch for constraint changes to save to cookies and URL
    watch(() => ({ ...constraints }), () => {
      saveStateToCookies(constraints)
      // Also save to URL whenever constraints change
      saveToUrl(constraints)
    }, { deep: true })

    // Watch for URL changes to handle back/forward navigation
    watch(() => new URLSearchParams(window.location.search).toString(), () => {
      const urlConstraints = loadFromUrl()
      if (Object.keys(urlConstraints).length > 0) {
        Object.assign(constraints, urlConstraints)
        // Update highlighted schedule from URL
        if (urlConstraints.highlightSchedule !== undefined) {
          highlightedSchedule.value = urlConstraints.highlightSchedule
        } else {
          highlightedSchedule.value = null
        }
      }
    })

    // Initialize
    onMounted(() => {
      loadScheduleData()
    })

    return {
      // I18n
      t,
      // State
      loading,
      error,
      generating,
      hasGeneratedSchedules,
      schedules,
      displaySchedules,
      suggestions,
      constraints,
      scheduleData,
      weekDays: dayNames,
      totalCourses,
      courseGroups,
      canGenerate,
      highlightedSchedule,
      // Methods
      generateSchedules,
      handleLocationChange,
      handleScheduleShare,
      handleConstraintsUpdate,
      handleApplySuggestion,
      handleToggleHighlight
    }
  }
}
</script>

<style>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
