<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-14 sm:h-16">
          <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate mr-2">
            {{ t('Dance Course Planner') }}
          </h1>
          <div class="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <WeekSelector
              v-if="nimbusIsLoggedIn && nimbusAvailableWeeks.length > 0"
              :selected-week="nimbusSelectedWeek"
              :available-weeks="nimbusAvailableWeeks"
              @week-changed="handleWeekChange"
              class="hidden sm:block"
            />
            <LanguageSwitcher />
            <!-- Mobile refresh button -->
            <button
              v-if="nimbusIsLoggedIn && !isAppLoading"
              @click="handleRefresh"
              class="sm:hidden inline-flex items-center px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-md transition-all duration-200 ease-in-out touch-manipulation"
              :title="t('Refresh data')"
              :disabled="loading"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              @click="showAboutModal = true"
              class="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
              :title="t('About')"
            >
              <span class="hidden sm:inline">{{ t('About') }}</span>
              <span class="sm:hidden">ℹ️</span>
            </button>
          </div>
        </div>
        
        <!-- Mobile Week Selector - shown below header on mobile -->
        <div v-if="nimbusIsLoggedIn && nimbusAvailableWeeks.length > 0" class="pb-3 sm:hidden">
          <WeekSelector
            :selected-week="nimbusSelectedWeek"
            :available-weeks="nimbusAvailableWeeks"
            @week-changed="handleWeekChange"
          />
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <!-- Dancing Woman - Shown during initial load, login, and schedule loading) -->
      <div v-if="isAppLoading" class="text-center py-8 sm:py-12">
        <div class="relative">
          <!-- Main Dancing Woman with rotation -->
          <div class="text-4xl sm:text-6xl mb-4 inline-block transform hover:scale-110 transition-transform duration-300">
            💃
          </div>
          
          <!-- Music notes floating around -->
          <div class="absolute -top-1 sm:-top-2 -left-6 sm:-left-8 text-lg sm:text-2xl animate-pulse opacity-70" style="animation-delay: 0s;">🎵</div>
          <div class="absolute -top-2 sm:-top-4 right-2 sm:right-4 text-base sm:text-xl animate-pulse opacity-60" style="animation-delay: 0.8s;">🎶</div>
          <div class="absolute top-6 sm:top-8 -right-4 sm:-right-6 text-sm sm:text-lg animate-pulse opacity-50" style="animation-delay: 1.2s;">♪</div>
        </div>
        
        <div class="space-y-3">
          <p class="text-base sm:text-lg font-medium text-gray-800 px-4">
            {{ currentLoadingMessage }}
          </p>
        </div>
      </div>


      <!-- Error State (only for actual errors, not login prompts) -->
      <div v-else-if="error && nimbusIsLoggedIn && !isAppLoading" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <div class="text-red-400">⚠️</div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">{{ t('Error loading schedule') }}</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Main Content (only show when fully loaded and logged in) -->
      <div v-else-if="!isAppLoading && nimbusIsLoggedIn" class="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
        <!-- Constraints Panel -->
        <div class="lg:col-span-1 space-y-4 sm:space-y-6">
          <!-- Logged-in user panel and registered courses -->
          <NimbusLogin
            :is-logged-in="nimbusIsLoggedIn"
            :credentials="nimbusCredentials"
            :user-data="nimbusUserData"
            :is-logging-in="nimbusLoggingIn"
            :login-error="nimbusLoginError"
            :registrations="nimbusRegistrations"
            :schedule-data="scheduleData"
            @login-attempt="handleNimbusLogin"
            @logout="handleNimbusLogout"
            @clear-error="nimbusClearLoginError"
            @unregister="handleNimbusUnregister"
          />
          
          <ConstraintPanel
            :constraints="constraints"
            :schedule-data="scheduleData"
            :course-groups="courseGroups"
            :app-config="appConfig"
            @location-changed="handleLocationChange"
            @update:constraints="handleConstraintsUpdate"
          />
        </div>

        <!-- Results Panel -->
        <div class="lg:col-span-2 min-w-0 schedule-results">
          <ScheduleResults
            :schedules="displaySchedules"
            :suggestions="suggestions"
            :has-results="hasGeneratedSchedules"
            :config="constraints"
            :highlighted-schedule="highlightedSchedule"
            :generating="generating"
            :show-login-hint="!nimbusIsLoggedIn"
            :course-duration-minutes="constraints.courseDurationMinutes"
            @schedule-share="handleScheduleShare"
            @apply-suggestion="handleApplySuggestion"
            @toggle-highlight="handleToggleHighlight"
          />
        </div>
      </div>

      <!-- Login Interface (show when not loading and not logged in) -->
      <div v-else-if="!isAppLoading && !nimbusIsLoggedIn" class="max-w-md mx-auto">
        <NimbusLogin
          :is-logged-in="nimbusIsLoggedIn"
          :credentials="nimbusCredentials"
          :user-data="nimbusUserData"
          :is-logging-in="nimbusLoggingIn"
          :login-error="nimbusLoginError"
          :registrations="nimbusRegistrations"
          :schedule-data="scheduleData"
          @login-attempt="handleNimbusLogin"
          @logout="handleNimbusLogout"
          @clear-error="nimbusClearLoginError"
          @unregister="handleNimbusUnregister"
        />
      </div>
    </div>
    <AppFooter />
    
    <!-- About Modal -->
    <AboutModal :show="showAboutModal" @close="showAboutModal = false" />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, onErrorCaptured } from 'vue'
import { useUrlState } from './composables/useUrlState.js'
import { useCookieState } from './composables/useCookieState.js'
import { useI18n } from './composables/useI18n.js'
import { useNimbuscloud } from './composables/useNimbuscloud.js'
import { HintingSolver } from './hintingSolver.js'
import ConstraintPanel from './components/ConstraintPanel.vue'
import ScheduleResults from './components/ScheduleResults.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import AppFooter from './components/AppFooter.vue'
import NimbusLogin from './components/NimbusLogin.vue'
import WeekSelector from './components/WeekSelector.vue'
import AboutModal from './components/AboutModal.vue'

export default {
  name: 'App',
  components: {
    ConstraintPanel,
    ScheduleResults,
    LanguageSwitcher,
    NimbusLogin,
    WeekSelector,
    AppFooter,
    AboutModal
  },
  setup() {
    // Internationalization
    const { t, dayNames } = useI18n()
    
    // UI state
    const showAboutModal = ref(false)
    
    // URL state management
    const { loadFromUrl, saveToUrl, generateShareUrl } = useUrlState()
    
    // Cookie state management
    const { loadStateFromCookiesSync, loadStateFromCookies, saveStateToCookies } = useCookieState()
    
    // Nimbuscloud integration
    const {
      isLoggedIn: nimbusIsLoggedIn,
      credentials: nimbusCredentials,
      userData: nimbusUserData,
      selectedWeek: nimbusSelectedWeek,
      availableWeeks: nimbusAvailableWeeks,
      isLoggingIn: nimbusLoggingIn,
      isDiscoveringWeeks: nimbusIsDiscoveringWeeks,
      loginError: nimbusLoginError,
      registrations: nimbusRegistrations,
      fetchSchedule: nimbusFetchSchedule,
      login: nimbusLogin,
      logout: nimbusLogout,
      clearLoginError: nimbusClearLoginError,
      setSelectedWeek: nimbusSetSelectedWeek,
      setSelectedWeekFromUrl: nimbusSetSelectedWeekFromUrl,
      unregisterFromCourse: nimbusUnregisterFromCourse
    } = useNimbuscloud()

    // Reactive state
    const loading = ref(false) // Start as false - only set to true when actually loading
    const error = ref(null)
    const generating = ref(false)
    const hasGeneratedSchedules = ref(false)
    const scheduleData = ref(null)

    // Error handling
    onErrorCaptured((err, instance, info) => {
      console.error('[App] Error captured:', err)
      console.error('[App] Component instance:', instance)
      console.error('[App] Error info:', info)
      
      // Set a user-friendly error message
      error.value = 'An error occurred while updating the page. Please refresh and try again.'
      
      // Return false to prevent the error from propagating
      return false
    })
    const scheduler = ref(null)
    const schedules = ref([])
    const displaySchedules = ref([]) // Schedules to display (only updated when generation complete)
    const suggestions = ref([])
    const highlightedSchedule = ref(null)
    const isChangingWeek = ref(false) // Flag to prevent interference during week changes
    
    // App loading states - Start as true to show loading from the beginning
    const isAppInitialized = ref(false) // Track if app has completed initial setup
    const isDiscoveringWeeks = ref(false) // Track week discovery process
    
    // Initialization phase tracking for detailed loading messages
    const initPhase = ref('starting') // 'starting', 'loadingConfig', 'attemptingLogin', 'discoveringWeeks', 'loadingSchedule', 'complete'
    
    // Computed loading state - show dancing woman until everything is ready
    const isAppLoading = computed(() => {
      // Show loading during any of these conditions:
      // 1. Not yet initialized (app startup) - This ensures loading from the very start
      // 2. Currently logging in to Nimbuscloud
      // 3. Loading schedule data
      // 4. Discovering available weeks
      const shouldShowLoading = !isAppInitialized.value || 
                                nimbusLoggingIn.value || 
                                loading.value || 
                                nimbusIsDiscoveringWeeks.value
      
      return shouldShowLoading
    })
    
    // Loading message based on current state - prioritize initialization
    const currentLoadingMessage = computed(() => {
      // Show detailed initialization messages during app startup
      if (!isAppInitialized.value) {
        switch (initPhase.value) {
          case 'starting':
            return t('Starting Dance Course Planner...')
          case 'loadingConfig':
            return t('Loading application configuration...')
          case 'attemptingLogin':
            return t('Attempting to log in with saved credentials...')
          case 'discoveringWeeks':
            return t('Discovering available course weeks...')
          case 'loadingSchedule':
            return t('Loading your course schedule...')
          default:
            return t('Initializing Dance Course Planner...')
        }
      } else if (nimbusLoggingIn.value) {
        return t('Logging in to Nimbuscloud...')
      } else if (nimbusIsDiscoveringWeeks.value) {
        return t('Discovering available weeks...')
      } else if (loading.value) {
        return t('Loading schedule data...')
      }
      return t('Preparing your schedule...')
    })

    // Load initial state from cookies (sync version)
    const initialState = loadStateFromCookiesSync()

    // Constraints - load from cookies first, then override with URL if present
    const constraints = reactive(initialState.constraints)
    
    // App configuration with defaults (matching user requirements)
    const appConfig = ref({
      courseDurationMinutes: 70,
      locationSelector: {
        showLocationSelector: false,
        defaultLocation: 'Karlsruhe'
      }
    })

    // Load async configuration on startup
    const loadConfiguration = async () => {
      try {
        const asyncState = await loadStateFromCookies()
        if (asyncState.appConfig) {
          appConfig.value = asyncState.appConfig
          console.log('Loaded app configuration:', asyncState.appConfig)
          
          // Update constraints with config-based defaults if not already customized
          if (asyncState.appConfig.locationSelector?.defaultLocation && 
              constraints.selectedLocation === 'Karlsruhe') {
            constraints.selectedLocation = asyncState.appConfig.locationSelector.defaultLocation
          }
          if (asyncState.appConfig.courseDurationMinutes && 
              constraints.courseDurationMinutes === 70) {
            constraints.courseDurationMinutes = asyncState.appConfig.courseDurationMinutes
          }
        }
      } catch (error) {
        console.warn('Failed to load async configuration:', error)
      }
    }

    // Computed properties
    const totalCourses = computed(() => {
      return scheduler.value ? getFilteredCourses().length : 0
    })

    const availableCourseNames = computed(() => {
      return scheduler.value ? scheduler.value.getCourseNames() : []
    })

    const courseGroups = computed(() => {
      const groups = scheduler.value ? scheduler.value.getCourseGroups() : new Map()
      return groups
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
    const loadScheduleData = async (useNimbuscloud = false, skipUrlLoading = false) => {
      try {
        loading.value = true
        error.value = null

        let data
        if (useNimbuscloud && nimbusIsLoggedIn.value) {
          // Fetch from Nimbuscloud
          data = await nimbusFetchSchedule(nimbusSelectedWeek.value)
          
          scheduleData.value = data
          
          // Store course data directly instead of using scheduler
          // Create course groups map from the data
          const courseGroups = new Map()
          if (data.courses) {
            for (const course of data.courses) {
              if (!courseGroups.has(course.name)) {
                courseGroups.set(course.name, [])
              }
              courseGroups.get(course.name).push(course)
            }
          }
          
          // Store for accessing via computed properties
          scheduler.value = {
            courses: data.courses || [],
            getCourseGroups: () => courseGroups,
            getCourseNames: () => Array.from(courseGroups.keys())
          }
          
          console.log('[App] Created scheduler with', scheduler.value.courses.length, 'courses')
          const availableCourseGroups = scheduler.value.getCourseGroups()
          console.log('[App] Course groups available:', Array.from(availableCourseGroups.keys()).slice(0, 10))

          // Only load constraints from URL during initial load or when explicitly requested
          if (!skipUrlLoading) {
            console.log('[App] Loading constraints from URL...')
            const urlConstraints = loadFromUrl()
            if (Object.keys(urlConstraints).length > 0) {
              Object.assign(constraints, urlConstraints)
              // Set highlighted schedule if present in URL
              if (urlConstraints.highlightSchedule !== undefined) {
                highlightedSchedule.value = urlConstraints.highlightSchedule
              }
              // Set selected week if present in URL
              if (urlConstraints.selectedWeek !== undefined) {
                nimbusSetSelectedWeekFromUrl(urlConstraints.selectedWeek)
              }
            }
          } else {
            console.log('[App] Skipping URL constraint loading (preserving user selections)')
          }
          
          // Only auto-generate schedules on initial load, not during week switching
          if (!skipUrlLoading && constraints.selectedCourseNames && constraints.selectedCourseNames.length > 0) {
            setTimeout(() => {
              generateSchedules()
            }, 100)
          }
        } else if (!useNimbuscloud) {
          // Not trying to use Nimbuscloud, just return without loading data
          loading.value = false
          return
        } else {
          // User wants to use Nimbuscloud but is not logged in
          throw new Error('Please login with your Nimbuscloud credentials to access course data')
        }
        
      } catch (err) {
        console.error('Failed to load schedule data:', err)
        error.value = err.message || 'Please login with your Nimbuscloud credentials to access course data.'
      } finally {
        loading.value = false
      }
    }

    const generateSchedules = async () => {
      if (!scheduler.value || generating.value) return

      try {
        generating.value = true
        
        console.log('[App] generateSchedules - Current constraints:', {
          selectedCourseNames: constraints.selectedCourseNames,
          courseMultiplicity: constraints.courseMultiplicity,
          disablePairCourses: constraints.disablePairCourses,
          selectedLocation: constraints.selectedLocation
        })
        
        // Prepare input for HintingSolver
        const selectedCourses = {}
        const existingCourses = {}
        
        // Convert selected courses to the format expected by HintingSolver
        for (const courseName of constraints.selectedCourseNames) {
          const courseGroup = scheduler.value.getCourseGroups().get(courseName)
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
        if (constraints.courseMultiplicity) {
          for (const name of Object.keys(selectedCourses)) {
            const count = constraints.courseMultiplicity[name]
            if (count && count > 1) {
              solverInput.courseMultiplicity[name] = count
            }
          }
        }
        
        // Add time constraints if specified
        if (constraints.maxTimeBetweenCourses && constraints.maxTimeBetweenCourses > 0) {
          solverInput.maxEmptySlotsBetweenCourses = constraints.maxTimeBetweenCourses
        }
        
        // Use HintingSolver
        const hintingSolver = new HintingSolver({ 
          courseDurationMinutes: constraints.courseDurationMinutes 
        })
        const result = hintingSolver.solve(solverInput, 20) // Get up to 20 solutions
        
        console.log('[App] HintingSolver result:', result)
        
        if (result.success) {
          // Convert solver results back to display format
          const convertedSchedules = result.schedules.map((schedule, index) => {
            const courses = []
            
            // For each course in the schedule
            Object.entries(schedule.schedule).forEach(([courseName, slots]) => {
              // Get the original course group to access full course data
              const courseGroup = scheduler.value.getCourseGroups().get(courseName)
              
              if (courseGroup) {
                // For each scheduled slot, find the matching course instance
                slots.forEach(slot => {
                  // Find the course instance that matches this day/slot
                  const matchingCourse = courseGroup.find(course => 
                    course.day === slot.day && 
                    (course.startTime.getHours() * 60 + course.startTime.getMinutes()) === slot.slot
                  )
                  
                  if (matchingCourse) {
                    courses.push({
                      ...matchingCourse, // Include all original course properties
                      // Ensure we have the scheduling info too
                      day: slot.day,
                      slot: slot.slot
                    })
                  } else {
                    // Fallback: create a minimal course object if we can't find the original
                    console.warn(`[App] Could not find original course data for ${courseName} on ${slot.day} at slot ${slot.slot}`)
                    courses.push({
                      id: `${courseName}-${slot.day}-${slot.slot}`,
                      name: courseName,
                      type: '',
                      level: '',
                      teacher: '',
                      location: '',
                      room: '',
                      day: slot.day,
                      slot: slot.slot,
                      startTime: new Date(2025, 0, 1, Math.floor(slot.slot / 60), slot.slot % 60),
                      endTime: new Date(2025, 0, 1, Math.floor(slot.slot / 60) + 1, slot.slot % 60),
                      date: '',
                      parsedDate: new Date(),
                      visitExists: false,
                      attendanceStatus: null,
                      pairOnly: false
                    })
                  }
                })
              }
            })
            
            return {
              id: index,
              courses,
              stats: {
                days: schedule.days,
                coursesOnBusiestDay: schedule.coursesOnBusiestDay,
                maxGapBetweenCourses: schedule.maxGapBetweenCourses,
                score: schedule.score
              }
            }
          })
          
          schedules.value = convertedSchedules
          displaySchedules.value = convertedSchedules
          suggestions.value = []
        } else {
          // No solution found - show hints and alternatives
          schedules.value = []
          displaySchedules.value = []
          
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
          console.log('[App] Generated suggestions:', suggestions.value)
        }
        
        hasGeneratedSchedules.value = true

        // Save current state to URL
        saveToUrl(constraints, null, nimbusSelectedWeek.value?.value)

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
      if (isChangingWeek.value) {
        console.log('[App] Ignoring constraint update during week change')
        return
      }
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
      if (isChangingWeek.value) {
        console.log('[App] Skipping selectedCourseNames watcher during week change')
        return
      }
      
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
      perDayTimeSlots: { ...constraints.perDayTimeSlots },
      disablePairCourses: constraints.disablePairCourses
    }), () => {
      if (isChangingWeek.value) {
        console.log('[App] Skipping constraints watcher during week change')
        return
      }
      
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
      if (isChangingWeek.value) {
        console.log('[App] Skipping save watchers during week change')
        return
      }
      
      saveStateToCookies(constraints)
      // Also save to URL whenever constraints change
      saveToUrl(constraints, null, nimbusSelectedWeek.value?.value)
    }, { deep: true })

    // Watch for week selection changes to update URL
    watch(() => nimbusSelectedWeek.value?.value, () => {
      if (isChangingWeek.value) {
        console.log('[App] Skipping week URL save during week change')
        return
      }
      
      // Save current constraints with new week to URL
      saveToUrl(constraints, null, nimbusSelectedWeek.value?.value)
    })

    // Watch for URL changes to handle back/forward navigation
    watch(() => new URLSearchParams(window.location.search).toString(), () => {
      if (isChangingWeek.value) {
        console.log('[App] Skipping URL watcher during week change')
        return
      }
      
      const urlConstraints = loadFromUrl()
      if (Object.keys(urlConstraints).length > 0) {
        Object.assign(constraints, urlConstraints)
        // Update highlighted schedule from URL
        if (urlConstraints.highlightSchedule !== undefined) {
          highlightedSchedule.value = urlConstraints.highlightSchedule
        } else {
          highlightedSchedule.value = null
        }
        // Set selected week from URL
        if (urlConstraints.selectedWeek !== undefined) {
          nimbusSetSelectedWeekFromUrl(urlConstraints.selectedWeek)
        }
      }
    })
    
    // Nimbuscloud event handlers
    const handleNimbusLogin = async (credentials) => {
      try {
        await nimbusLogin(credentials)
        // The watcher will handle loading schedule data after login
      } catch (error) {
        console.error('Login failed:', error)
      }
    }
    
    const handleNimbusLogout = () => {
      nimbusLogout()
      // Clear schedule data on logout
      scheduleData.value = null
      scheduler.value = null
      error.value = 'Please login with your Nimbuscloud credentials to access course data.'
    }
    
    const handleNimbusUnregister = async ({ courseId, dateId }) => {
      try {
        await nimbusUnregisterFromCourse(courseId, dateId)
        // Registration state is already updated in useNimbuscloud composable
        // No need to reload schedule data
        console.log(`[App] Successfully unregistered from course ${courseId}`)
      } catch (error) {
        console.error('Failed to unregister from course:', error)
        // Could show a notification here
      }
    }
    
    const handleWeekChange = async (weekValue) => {
      console.log('[App] handleWeekChange called with weekValue:', weekValue)
      console.log('[App] Current selectedWeek:', nimbusSelectedWeek.value)
      console.log('[App] isLoggedIn:', nimbusIsLoggedIn.value, 'isChangingWeek:', isChangingWeek.value)
      
      if (!nimbusIsLoggedIn.value || isChangingWeek.value) return

      console.log('[App] Starting week change, preserving configuration...')
      isChangingWeek.value = true
      
      // Preserve ALL current state before changing week
      const preservedState = {
        constraints: JSON.parse(JSON.stringify(constraints)), // Deep copy
        highlightedSchedule: highlightedSchedule.value,
        schedules: [...schedules.value],
        displaySchedules: [...displaySchedules.value],
        hasGeneratedSchedules: hasGeneratedSchedules.value
      }

      // Change the selected week using the week value, not index
      console.log('[App] Setting selected week to:', weekValue)
      await nimbusSetSelectedWeek(weekValue)
      console.log('[App] Selected week after setting:', nimbusSelectedWeek.value)

      // Add a small delay to ensure all reactive updates have propagated
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        // Load new week's data without any URL loading
        await loadScheduleData(true, true)
        
        console.log('[App] Data loaded, restoring preserved state...')
        
        // Restore all preserved state
        Object.assign(constraints, preservedState.constraints)
        highlightedSchedule.value = preservedState.highlightedSchedule
        schedules.value = preservedState.schedules
        displaySchedules.value = preservedState.displaySchedules
        hasGeneratedSchedules.value = preservedState.hasGeneratedSchedules

        console.log('[App] State restored, preserved courses:', preservedState.constraints.selectedCourseNames)

        // Only regenerate schedules if we had courses selected and results before
        if (preservedState.constraints.selectedCourseNames && 
            preservedState.constraints.selectedCourseNames.length > 0) {
          console.log('[App] Regenerating schedules with preserved constraints...')
          setTimeout(() => {
            generateSchedules()
          }, 200) // Slightly longer delay to ensure all reactive updates are complete
        }
      } catch (error) {
        console.error('[App] Failed to change week:', error)
        // On error, try to restore what we can
        Object.assign(constraints, preservedState.constraints)
        highlightedSchedule.value = preservedState.highlightedSchedule
      } finally {
        // Clear the flag after a delay to ensure all async operations are complete
        setTimeout(() => {
          isChangingWeek.value = false
          console.log('[App] Week change complete')
        }, 500)
      }
    }

    // Watch for login state changes to load schedule data (for subsequent logins)
    watch(() => nimbusIsLoggedIn.value, (newValue, oldValue) => {
      if (newValue && !oldValue && isAppInitialized.value) {
        // User just logged in after app was already initialized, load data
        loadScheduleData(true)
      } else if (!newValue && oldValue) {
        // User logged out, no need to change initialization state
        // The UI will automatically show login screen based on nimbusIsLoggedIn
      }
    })
    
    // Add haptic feedback simulation for mobile interactions
    const triggerHapticFeedback = (type = 'light') => {
      // Check if the device supports haptic feedback
      if (navigator.vibrate) {
        switch (type) {
          case 'light':
            navigator.vibrate(10)
            break
          case 'medium':
            navigator.vibrate(20)
            break
          case 'heavy':
            navigator.vibrate([30, 10, 30])
            break
        }
      }
    }

    // Add refresh method for mobile
    const handleRefresh = async () => {
      if (!nimbusIsLoggedIn.value || loading.value) return
      
      try {
        console.log('[App] Manual refresh triggered')
        triggerHapticFeedback('light') // Haptic feedback for refresh action
        await loadScheduleData(true, true) // Skip URL loading to preserve current state
        
        // If we have selected courses, regenerate schedules
        if (constraints.selectedCourseNames && constraints.selectedCourseNames.length > 0) {
          setTimeout(() => {
            generateSchedules()
          }, 100)
        }
        
        triggerHapticFeedback('medium') // Success feedback
      } catch (error) {
        console.error('[App] Failed to refresh:', error)
        triggerHapticFeedback('heavy') // Error feedback
      }
    }

    // Initialize
    onMounted(async () => {
      try {
        console.log('[App] Starting app initialization')
        initPhase.value = 'loadingConfig'
        
        // Load configuration from JSON file
        await loadConfiguration()
        console.log('[App] Configuration loaded successfully')
        
        // Add a small delay to ensure the loading screen is visible
        await new Promise(resolve => setTimeout(resolve, 500))
        
        initPhase.value = 'attemptingLogin'
        console.log('[App] Attempting auto-login')
        
        // Wait for the initial auto-login and week discovery to complete
        // This ensures we don't show the login screen prematurely
        let maxWaitTime = 5000 // Maximum 5 seconds
        let waitTime = 0
        const checkInterval = 100
        
        while (waitTime < maxWaitTime) {
          // Check if auto-login process is complete
          // We consider it complete if:
          // 1. User is logged in and week discovery is not running, OR
          // 2. User is not logged in (auto-login failed or no stored credentials)
          if ((nimbusIsLoggedIn.value && !nimbusIsDiscoveringWeeks.value) || 
              (!nimbusIsLoggedIn.value && waitTime > 2000)) {
            break
          }
          
          // Update phase based on what's happening
          if (nimbusIsLoggedIn.value && nimbusIsDiscoveringWeeks.value) {
            initPhase.value = 'discoveringWeeks'
          }
          
          await new Promise(resolve => setTimeout(resolve, checkInterval))
          waitTime += checkInterval
        }
        
        // If user is logged in after auto-login, load schedule data
        if (nimbusIsLoggedIn.value) {
          initPhase.value = 'loadingSchedule'
          console.log('[App] Loading initial schedule data')
          await loadScheduleData(true)
          console.log('[App] Initial schedule data loaded')
        }
        
        initPhase.value = 'complete'
        console.log('[App] App initialization complete')
        
        // Mark app as initialized - this will show the appropriate UI
        isAppInitialized.value = true
      } catch (error) {
        console.error('App initialization error:', error)
        initPhase.value = 'complete'
        // Even on error, mark as initialized to show the error state
        isAppInitialized.value = true
      }
    })

    return {
      // I18n
      t,
      // UI state
      showAboutModal,
      // State
      loading,
      error,
      generating,
      hasGeneratedSchedules,
      schedules,
      displaySchedules,
      suggestions,
      constraints,
      appConfig,
      scheduleData,
      weekDays: dayNames,
      totalCourses,
      courseGroups,
      canGenerate,
      highlightedSchedule,
      // App loading state
      isAppLoading,
      currentLoadingMessage,
      initPhase,
      // Nimbuscloud state
      nimbusIsLoggedIn,
      nimbusCredentials,
      nimbusUserData,
      nimbusSelectedWeek,
      nimbusAvailableWeeks,
      nimbusLoggingIn,
      nimbusLoginError,
      nimbusRegistrations,
      // Methods
      generateSchedules,
      handleLocationChange,
      handleScheduleShare,
      handleConstraintsUpdate,
      handleApplySuggestion,
      handleToggleHighlight,
      // Nimbuscloud methods
      handleNimbusLogin,
      handleNimbusLogout,
      nimbusClearLoginError,
      handleNimbusUnregister,
      handleWeekChange,
      handleRefresh,
      triggerHapticFeedback
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

/* Enhanced loading animations */
@keyframes dance {
  0%, 50%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(5deg);
  }
  75% {
    transform: translateY(-5px) rotate(-5deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* Floating animation for music notes */
.animate-pulse {
  animation: float 3s ease-in-out infinite;
}

/* Gradient background for loading state */
.loading-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Touch-friendly styles for mobile */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}

/* Improved scrollbar for mobile webkit browsers */
@supports (-webkit-appearance: none) and (stroke-color: transparent) {
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }
}
</style>
