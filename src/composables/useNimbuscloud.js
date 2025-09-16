import { ref, onMounted, computed, triggerRef, nextTick } from 'vue'
import { nimbuscloudClient } from '../services/nimbuscloud.js'
import { useI18n } from './useI18n.js'

export function useNimbuscloud() {
  const { formatDate } = useI18n()
  const isLoggedIn = ref(false)
  const credentials = ref(null)
  const userData = ref(null) // Store user data including name
  const selectedWeek = ref(null)
  const availableWeeks = ref([])
  const isLoggingIn = ref(false)
  const loginError = ref('')
  const isDiscoveringWeeks = ref(false) // Track week discovery state
  
  // Initialize available weeks (will be updated dynamically)
  availableWeeks.value = nimbuscloudClient.getAvailableWeeks()
  selectedWeek.value = availableWeeks.value[0] // Default to current week
  
  // Auto-login on mount if credentials exist
  onMounted(async () => {
    await attemptAutoLogin()
    // After login, discover available weeks dynamically
    if (isLoggedIn.value) {
      await discoverAvailableWeeks()
    }
  })
  
  const discoverAvailableWeeks = async () => {
    if (!isLoggedIn.value) return
    
    console.log('[useNimbuscloud] Discovering available weeks...')
    isDiscoveringWeeks.value = true
    
    try {
      const dynamicWeeks = []
      const now = new Date()
      
      // Check up to 8 weeks ahead
      for (let i = 0; i < 8; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() + (i * 7))
        
        // Get Monday of that week
        const monday = new Date(date)
        const dayOfWeek = date.getDay()
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        monday.setDate(date.getDate() - daysFromMonday)
        
        try {
          console.log(`[useNimbuscloud] Checking week ${i} starting ${monday.toLocaleDateString()}`)
          const data = await nimbuscloudClient.fetchSchedule(monday)
          
          // Check if this week has any courses
          if (data && data.courses && data.courses.length > 0) {
            dynamicWeeks.push({
              value: i,
              label: i === 0 ? 'Current Week' : i === 1 ? 'Next Week' : `${formatDate(monday)}`,
              translationKey: i === 0 ? 'Current Week' : i === 1 ? 'Next Week' : 'Week of',
              date: monday,
              isoString: monday.toISOString().split('T')[0]
            })
            console.log(`[useNimbuscloud] Week ${i} has ${data.courses.length} courses - added`)
          } else {
            console.log(`[useNimbuscloud] Week ${i} has no courses - stopping discovery`)
            break // Stop at first week with no data
          }
        } catch (error) {
          console.warn(`[useNimbuscloud] Failed to check week ${i}:`, error)
          break // Stop on first error
        }
      }
      
      if (dynamicWeeks.length > 0) {
        const previousSelectedWeek = selectedWeek.value
        availableWeeks.value = dynamicWeeks
        console.log(`[useNimbuscloud] Discovered ${dynamicWeeks.length} available weeks`)
        
        // Try to preserve the current selection by finding a week with the same value
        if (previousSelectedWeek) {
          const matchingWeek = dynamicWeeks.find(w => w.value === previousSelectedWeek.value)
          if (matchingWeek) {
            // Update to the new week object but preserve the same value
            selectedWeek.value = matchingWeek
            console.log(`[useNimbuscloud] Preserved selected week:`, selectedWeek.value)
          } else {
            // Fallback: try to preserve the same week type (current vs next vs later)
            let fallbackWeek = null
            if (previousSelectedWeek.value === 0) {
              // Was "Current Week", try to keep current week
              fallbackWeek = dynamicWeeks.find(w => w.value === 0)
            } else if (previousSelectedWeek.value === 1) {
              // Was "Next Week", try to keep next week  
              fallbackWeek = dynamicWeeks.find(w => w.value === 1)
            } else {
              // Was a later week, try to find a similar one or default to next week
              fallbackWeek = dynamicWeeks.find(w => w.value === 1) || dynamicWeeks[0]
            }
            
            if (fallbackWeek) {
              selectedWeek.value = fallbackWeek
              console.log(`[useNimbuscloud] Selected fallback week:`, selectedWeek.value)
            } else {
              selectedWeek.value = dynamicWeeks[0]
              console.log(`[useNimbuscloud] Selected first available week:`, selectedWeek.value)
            }
          }
        } else {
          // No previous selection, default to current week (index 0) if available, otherwise first available week
          selectedWeek.value = dynamicWeeks.find(w => w.value === 0) || dynamicWeeks[0]
          console.log(`[useNimbuscloud] Selected default week (current):`, selectedWeek.value)
        }
      }
    } catch (error) {
      console.error('[useNimbuscloud] Error discovering available weeks:', error)
    } finally {
      isDiscoveringWeeks.value = false
      console.log('[useNimbuscloud] Week discovery completed')
    }
  }
  
  const attemptAutoLogin = async () => {
    const storedCredentials = localStorage.getItem('nimbuscloud-credentials')
    if (!storedCredentials) return
    
    try {
      const parsedCredentials = JSON.parse(storedCredentials)
      console.log('[useNimbuscloud] Attempting auto-login...')
      
      nimbuscloudClient.setCredentials(parsedCredentials)
      
      // Test authentication and get user data
      const authResult = await nimbuscloudClient.testAuthentication()
      
      if (authResult) {
        credentials.value = parsedCredentials
        isLoggedIn.value = true
        
        // Store user data if available
        if (typeof authResult === 'object') {
          console.log('[useNimbuscloud] Auto-login received user data:', authResult)
          console.log('[useNimbuscloud] Current userData.value before update:', userData.value)
          userData.value = authResult
          console.log('[useNimbuscloud] Auto-login stored userData.value:', userData.value)
          // Force reactivity update
          userData.value = { ...userData.value }
          console.log('[useNimbuscloud] Forced reactivity update, final userData.value:', userData.value)
        }
        
        // Fetch and integrate precheckins data after successful auto-login
        try {
          await fetchAndIntegratePreCheckins()
        } catch (error) {
          console.warn('[useNimbuscloud] Failed to load precheckins during auto-login:', error)
          // Don't fail auto-login if we can't load precheckins
        }
        
        console.log('[useNimbuscloud] Auto-login successful')
      } else {
        console.log('[useNimbuscloud] Auto-login failed - removing stored credentials')
        localStorage.removeItem('nimbuscloud-credentials')
        nimbuscloudClient.clearCredentials()
      }
    } catch (error) {
      console.error('[useNimbuscloud] Auto-login error:', error)
      localStorage.removeItem('nimbuscloud-credentials')
      nimbuscloudClient.clearCredentials()
    }
  }
  
  // Helper function to enrich schedule data with course metadata from pre-checkin API
  const enrichScheduleWithMetadata = (scheduleData) => {
    if (!scheduleData?.courses) return scheduleData

    console.log('[useNimbuscloud] Enriching schedule data with metadata...')
    console.log('[useNimbuscloud] Available metadata for courses:', Array.from(courseMetadata.value.keys()))
    console.log('[useNimbuscloud] Schedule courses to enrich:', scheduleData.courses.map(c => c.id))

    const enrichedCourses = scheduleData.courses.map(course => {
      const metadata = courseMetadata.value.get(course.id)
      console.log(`[useNimbuscloud] Course ${course.id}: metadata found = ${!!metadata}, pairOnly = ${metadata?.pairOnly}`)
      
      let enrichedCourse = { ...course }
      
      if (metadata) {
        // Merge the pairOnly and other metadata from API into the course
        enrichedCourse.pairOnly = metadata.pairOnly || false
        enrichedCourse.visitExists = metadata.visitExists || false
        console.log(`[useNimbuscloud] Enriched course ${course.id} from API metadata:`, { id: course.id, name: course.name, pairOnly: enrichedCourse.pairOnly, visitExists: enrichedCourse.visitExists })
      } else {
        // Check persistent cache for pair-only patterns
        const isPairFromCache = checkPairOnlyCache(course.name)
        if (isPairFromCache) {
          enrichedCourse.pairOnly = true
          console.log(`[useNimbuscloud] Course ${course.id} marked as pair-only from persistent cache:`, course.name)
        } else {
          // Fallback: detect pair courses by name patterns
          const isPairCourse = detectPairCourseByName(course.name)
          enrichedCourse.pairOnly = isPairCourse
          console.log(`[useNimbuscloud] Fallback detection for course ${course.id}:`, { id: course.id, name: course.name, pairOnly: isPairCourse })
        }
      }
      
      return enrichedCourse
    })

    const pairCoursesCount = enrichedCourses.filter(c => c.pairOnly).length
    const registeredCoursesCount = enrichedCourses.filter(c => c.visitExists).length
    console.log('[useNimbuscloud] Enrichment completed. Courses with pairOnly=true:', pairCoursesCount)
    console.log('[useNimbuscloud] Enrichment completed. Courses with visitExists=true:', registeredCoursesCount)
    
    // Log some examples of pair courses found
    const pairCourses = enrichedCourses.filter(c => c.pairOnly).slice(0, 3)
    console.log('[useNimbuscloud] Sample pair courses:', pairCourses.map(c => ({ id: c.id, name: c.name, pairOnly: c.pairOnly })))
    
    return {
      ...scheduleData,
      courses: enrichedCourses
    }
  }

  // Function to check if a course name matches cached pair-only patterns
  const checkPairOnlyCache = (courseName) => {
    if (!courseName) return false
    
    const name = courseName.toLowerCase().trim()
    return pairOnlyCache.value.has(name)
  }

  // Fallback function to detect pair courses by name patterns
  const detectPairCourseByName = (courseName) => {
    if (!courseName) return false
    
    const name = courseName.toLowerCase()
    
    // Common patterns for pair-only courses
    const pairPatterns = [
      'paar',          // German for "pair"
      'pair',          // English
      'nur paar',      // "only pair" in German
      'only pair',     // English
      'paare',         // Plural in German
      'für paare',     // "for pairs" in German
      'for pairs',     // English
      'couple',        // English
      'couples'        // English plural
    ]
    
    const isPair = pairPatterns.some(pattern => name.includes(pattern))
    
    if (isPair) {
      console.log(`[useNimbuscloud] Detected pair course by name pattern: "${courseName}"`)
    }
    
    return isPair
  }

  const fetchSchedule = async (week) => {
    if (!isLoggedIn.value) {
      throw new Error('Not logged in to Nimbuscloud')
    }
    
    if (!week) {
      throw new Error('Invalid week selected')
    }

    try {
      console.log(`🔍 [GAP SLOTS] useNimbuscloud: Fetching schedule for week starting ${week.date.toLocaleDateString()}`)
      
      // Use the Nimbuscloud client to fetch schedule data first
      const data = await nimbuscloudClient.fetchSchedule(week.date)
      console.log('🔍 [GAP SLOTS] useNimbuscloud: Received data from nimbuscloudClient:', {
        totalCourses: data.courses?.length || 0,
        locations: data.locations || [],
        sampleCourse: data.courses?.[0] ? {
          name: data.courses[0].name,
          day: data.courses[0].day,
          startTime: new Date(data.courses[0].startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date(data.courses[0].endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        } : 'No courses found'
      })
      
      // Update registration status from the fetched data (if available)
      updateRegistrationStatusFromData(data)
      
      // Try to fetch pre-checkin courses to get metadata (including pairOnly) - non-blocking
      try {
        console.log('[useNimbuscloud] Fetching course metadata from pre-checkin API...')
        await getPreCheckinCourses()
        console.log('[useNimbuscloud] Course metadata loaded from pre-checkin API')
      } catch (regError) {
        console.warn('[useNimbuscloud] Failed to fetch course metadata from pre-checkin API (likely CORS issue):', regError.message)
        console.log('[useNimbuscloud] Continuing with fallback pair course detection...')
      }
      
      // Enrich schedule data with metadata from pre-checkin API or fallback detection
      const enrichedData = enrichScheduleWithMetadata(data)
      
      console.log('🔍 [GAP SLOTS] useNimbuscloud: Enriched schedule data ready for components:', {
        totalCourses: enrichedData.courses?.length || 0,
        coursesByDay: enrichedData.courses?.reduce((acc, course) => {
          acc[course.day] = (acc[course.day] || 0) + 1
          return acc
        }, {}) || {}
      })
      
      console.log('[useNimbuscloud] Successfully fetched and enriched schedule from Nimbuscloud')
      console.log('[useNimbuscloud] Final enriched data contains', enrichedData.courses?.length || 0, 'courses')
      
      // Log course names to help debug missing courses
      if (enrichedData.courses) {
        const courseNames = enrichedData.courses.map(c => c.name)
        console.log('[useNimbuscloud] All course names:', courseNames)
        
        const standardLateinCourses = enrichedData.courses.filter(c => c.name.includes('Standard & Latein'))
        console.log('[useNimbuscloud] Standard & Latein courses found:', standardLateinCourses.length)
        standardLateinCourses.forEach(course => {
          console.log(`[useNimbuscloud] - ${course.name} (pairOnly: ${course.pairOnly})`)
        })
        
        const level3Courses = enrichedData.courses.filter(c => c.name.includes('Level 3') || c.name.includes('Medaillenstufe'))
        console.log('[useNimbuscloud] Level 3/Medaillenstufe courses found:', level3Courses.length)
        level3Courses.forEach(course => {
          console.log(`[useNimbuscloud] - ${course.name} (pairOnly: ${course.pairOnly})`)
        })
      }
      
      // Fetch and integrate precheckins data (non-blocking)
      try {
        await fetchAndIntegratePreCheckins()
      } catch (precheckinError) {
        console.warn('[useNimbuscloud] Failed to fetch precheckins (non-critical):', precheckinError.message)
      }
      
      return enrichedData
      
    } catch (error) {
      console.error('[useNimbuscloud] Failed to fetch schedule from Nimbuscloud:', error)
      throw error
    }
  }

  // Helper function to update registration status from fetched data
  const updateRegistrationStatusFromData = (data) => {
    if (!data?.courses) return
    
    data.courses.forEach(course => {
      if (course.visitExists !== undefined) {
        const registrationKey = course.id  // Use simple key format
        registrations.value.set(registrationKey, {
          registered: course.visitExists,
          timestamp: new Date(),
          attendanceStatus: course.attendanceStatus
        })
        console.log(`[useNimbuscloud] Updated registration status from schedule data: ${course.id} -> ${course.visitExists}`)
      }
    })
    
    // Force reactivity update after all registrations are updated
    forceRegistrationsUpdate()
  }

  // Function to fetch and integrate precheckins data
  const fetchAndIntegratePreCheckins = async () => {
    if (!isLoggedIn.value) {
      console.log('[useNimbuscloud] Not logged in, skipping precheckins fetch')
      return
    }

    try {
      console.log('[useNimbuscloud] Fetching precheckins data...')
      const preCheckinsData = await nimbuscloudClient.getMyPreCheckins()
      
      if (preCheckinsData?.processedEvents && Array.isArray(preCheckinsData.processedEvents)) {
        console.log(`[useNimbuscloud] Processing ${preCheckinsData.processedEvents.length} precheckin events`)
        
        preCheckinsData.processedEvents.forEach(event => {
          // Only process confirmed precheckins
          if (event.preCheckinConfirmed) {
            const registrationKey = event.eventId
            
            // Add or update the registration in our map
            registrations.value.set(registrationKey, {
              registered: true,
              timestamp: new Date(),
              source: 'precheckin',
              isToday: event.isToday,
              startsSoon: event.startsSoon,
              eventData: {
                id: event.eventId,
                name: event.name,
                location: event.location,
                room: event.room,
                startTime: event.startTime,
                endTime: event.endTime,
                customerId: event.customerId,
                customerName: event.customerName
              }
            })
            
            console.log(`[useNimbuscloud] Added precheckin registration: ${event.name} (${event.eventId})`)
          }
        })
        
        // Force reactivity update
        forceRegistrationsUpdate()
        
        console.log(`[useNimbuscloud] Integrated ${preCheckinsData.processedEvents.filter(e => e.preCheckinConfirmed).length} confirmed precheckins`)
      } else {
        console.log('[useNimbuscloud] No processed events found in precheckins data')
      }
    } catch (error) {
      console.error('[useNimbuscloud] Failed to fetch precheckins:', error)
      // Don't throw - this is supplementary data, not critical
    }
  }

  const login = async (loginCredentials) => {
    isLoggingIn.value = true
    loginError.value = ''
    
    try {
      // Validate input
      if (!loginCredentials?.username || !loginCredentials?.password) {
        throw new Error('Please enter both email and password')
      }
      
      // Set credentials in the client
      nimbuscloudClient.setCredentials(loginCredentials)
      
      // Test authentication and get user data
      const authResult = await nimbuscloudClient.testAuthentication()
      
      if (!authResult) {
        throw new Error('Invalid username or password. Please check your credentials and try again.')
      }
      
      // Store credentials and update state
      credentials.value = loginCredentials
      isLoggedIn.value = true
      
      // Store user data if available
      if (typeof authResult === 'object') {
        console.log('[useNimbuscloud] Login received user data:', authResult)
        console.log('[useNimbuscloud] Current userData.value before update:', userData.value)
        userData.value = authResult
        console.log('[useNimbuscloud] Login stored userData.value:', userData.value)
        // Force reactivity update
        userData.value = { ...userData.value }
        console.log('[useNimbuscloud] Forced reactivity update, final userData.value:', userData.value)
      }
      
      localStorage.setItem('nimbuscloud-credentials', JSON.stringify(loginCredentials))
      
      // Load initial registration status
      try {
        await getPreCheckinCourses()
      } catch (error) {
        console.warn('[useNimbuscloud] Failed to load initial registration status:', error)
        // Don't fail login if we can't load registration status
      }
      
      // Fetch and integrate precheckins data
      try {
        await fetchAndIntegratePreCheckins()
      } catch (error) {
        console.warn('[useNimbuscloud] Failed to load precheckins data:', error)
        // Don't fail login if we can't load precheckins
      }
      
      // Discover available weeks after successful login
      try {
        await discoverAvailableWeeks()
      } catch (error) {
        console.warn('[useNimbuscloud] Failed to discover available weeks:', error)
        // Don't fail login if we can't discover weeks
      }
      
      console.log('[useNimbuscloud] Login successful')
      loginError.value = ''
      return true
      
    } catch (error) {
      console.error('[useNimbuscloud] Login failed:', error)
      nimbuscloudClient.clearCredentials()
      
      // Set user-friendly error messages
      if (error.message.includes('fetch')) {
        loginError.value = 'Unable to connect to Nimbuscloud. Please check your internet connection and try again.'
      } else if (error.message.includes('Authentication failed') || error.message.includes('Invalid username')) {
        loginError.value = 'Invalid username or password. Please check your credentials and try again.'
      } else if (error.message.includes('username') && error.message.includes('password')) {
        loginError.value = error.message
      } else {
        loginError.value = 'Login failed. Please try again or contact support if the problem persists.'
      }
      
      throw error
    } finally {
      isLoggingIn.value = false
    }
  }
  
  const logout = () => {
    console.log('[useNimbuscloud] Logging out...')
    
    credentials.value = null
    userData.value = null
    isLoggedIn.value = false
    loginError.value = ''
    registrations.value.clear()
    courseMetadata.value.clear()
    forceRegistrationsUpdate()
    localStorage.removeItem('nimbuscloud-credentials')
    nimbuscloudClient.clearCredentials()
  }

  const clearLoginError = () => {
    loginError.value = ''
  }
  
  const setSelectedWeek = async (weekValue) => {
    console.log('[useNimbuscloud] setSelectedWeek called with:', weekValue)
    console.log('[useNimbuscloud] Available weeks:', availableWeeks.value.map(w => ({ value: w.value, label: w.label })))
    
    // Find the week with the matching value, not by array index
    const targetWeek = availableWeeks.value.find(week => week.value === weekValue)
    console.log('[useNimbuscloud] Found target week:', targetWeek)
    
    if (targetWeek) {
      console.log('[useNimbuscloud] Setting selectedWeek from:', selectedWeek.value, 'to:', targetWeek)
      selectedWeek.value = targetWeek
      console.log('[useNimbuscloud] selectedWeek after setting:', selectedWeek.value)
      
      // Force reactivity by waiting for next tick to ensure all watchers are triggered
      await nextTick()
      console.log('[useNimbuscloud] Reactivity update complete')
    } else {
      console.warn(`[useNimbuscloud] Week with value ${weekValue} not found`)
    }
  }

  // Registration functionality
  const registrations = ref(new Map()) // courseId -> registration status
  const registrationInProgress = ref(new Set()) // track ongoing registrations
  const courseMetadata = ref(new Map()) // courseId -> { pairOnly, visitExists, etc. }
  
  // Persistent cache for pair-only course patterns (survives week changes)
  const pairOnlyCache = ref(new Map()) // course name pattern -> boolean

  // Whether we have a valid customer id (not '0')
  const hasValidCustomerId = computed(() => {
    const id = nimbuscloudClient.selectedCustomer || userData.value?.customernr
    return !!id && String(id) !== '0'
  })

  // Helper function to force reactivity trigger after Map updates
  const forceRegistrationsUpdate = () => {
    triggerRef(registrations)
    console.log('[useNimbuscloud] Forced registrations reactivity update')
  }

  const toBool = (v) => v === true || v === 1 || v === '1' || v === 'true'

  const getPreCheckinCourses = async () => {
    try {
      const result = await nimbuscloudClient.getPreCheckinCourses()
      console.log('[useNimbuscloud] Pre-checkin courses response structure:', {
        hasPayload: !!result.payload,
        payloadLength: result.payload?.length,
        firstCourse: result.payload?.[0]
      })
      
      // Clear previous course metadata to avoid stale information
      // Don't clear registrations as they may contain valuable state
      courseMetadata.value.clear()
      
      // Update registration status and course metadata based on the response
      if (result.payload && Array.isArray(result.payload)) {
        let registeredCount = 0
        console.log(`[useNimbuscloud] Processing ${result.payload.length} courses from pre-checkin API`)
        
        result.payload.forEach(course => {
          const courseId = course.event || course.id
          console.log(`[useNimbuscloud] Processing course: id=${course.id}, event=${course.event}, pairOnly=${course.pairOnly}, visitExists=${course.visitExists}, name=${course.name}`)
          
          if (courseId) {
            const isRegistered = toBool(course.visitExists)
            const isPairOnly = toBool(course.pairOnly)
            
            // Store course metadata including pairOnly information
            courseMetadata.value.set(courseId, {
              pairOnly: isPairOnly,
              visitExists: isRegistered,
              name: course.name,
              // Store other relevant metadata for fallback display
              start_date: course.start_date,
              start_time: course.start_time,
              teacherName: course.teacherName || course.teacher,
              location: course.location,
              room: course.room,
              ...course
            })
            
            // Cache pair-only patterns for cross-week persistence
            if (isPairOnly && course.name) {
              const pattern = course.name.toLowerCase().trim()
              pairOnlyCache.value.set(pattern, true)
            }
            
            if (isRegistered) {
              const registrationKey = courseId
              registrations.value.set(registrationKey, {
                registered: true,
                timestamp: new Date(),
                result: {
                  ...course,
                  // Ensure we have the necessary data for display
                  name: course.name,
                  start_date: course.start_date,
                  start_time: course.start_time,
                  teacherName: course.teacherName || course.teacher,
                  location: course.location,
                  room: course.room
                }
              })
              registeredCount++
            }
          } else {
            console.warn('[useNimbuscloud] Course has no valid ID:', course)
          }
        })
        console.log('[useNimbuscloud] Loaded', registeredCount, 'registered courses')
        console.log('[useNimbuscloud] Total registrations in Map:', registrations.value.size)
        console.log('[useNimbuscloud] Loaded metadata for', courseMetadata.value.size, 'courses')
        
        // Force reactivity update after all registrations are processed
        forceRegistrationsUpdate()
        
        // Log current registrations for debugging
        console.log('[useNimbuscloud] Current registrations:', Array.from(registrations.value.entries()))
        
        // Log some sample metadata
        const sampleMetadata = Array.from(courseMetadata.value.entries()).slice(0, 3)
        console.log('[useNimbuscloud] Sample metadata entries:', sampleMetadata)
      }
      
      return result
    } catch (error) {
      // Enhanced error handling for CORS and network issues
      if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
        console.warn('[useNimbuscloud] CORS or network error when fetching pre-checkin courses - this is expected when running from localhost:', error.message)
        throw new Error('CORS_ERROR: Pre-checkin API blocked by browser security policy')
      } else {
        console.error('[useNimbuscloud] Failed to get pre-checkin courses:', error)
        throw error
      }
    }
  }

  const registerForCourse = async (courseId, dateId) => {
    const registrationKey = courseId  // Use simple key format
    registrationInProgress.value.add(registrationKey)
    
    // Do not attempt registration if customer id is missing or '0'
    if (!nimbuscloudClient.selectedCustomer || String(nimbuscloudClient.selectedCustomer) === '0') {
      console.warn('[useNimbuscloud] Registration blocked: customer id is missing or 0')
      registrationInProgress.value.delete(registrationKey)
      throw new Error('CUSTOMER_ID_MISSING: Please reload login so we can fetch your customer id.')
    }
    
    // Get current registration state before toggling
    const currentlyRegistered = isRegisteredForCourse(courseId, dateId)
    
    try {
      // Use the toggle API which will register if not registered, or unregister if registered
      const result = await nimbuscloudClient.togglePreCheckin(courseId, nimbuscloudClient.selectedCustomer)
      
      // Since it's a toggle, if we were not registered, we should now be registered
      const newState = !currentlyRegistered
      
      registrations.value.set(registrationKey, { 
        registered: newState, 
        timestamp: new Date(),
        result 
      })
      
      forceRegistrationsUpdate()
      console.log(`[useNimbuscloud] Toggled registration for ${courseId}: ${currentlyRegistered} -> ${newState}`)
      return result
    } catch (error) {
      console.error('[useNimbuscloud] Failed to register for course:', error)
      throw error
    } finally {
      registrationInProgress.value.delete(registrationKey)
    }
  }

  const unregisterFromCourse = async (courseId, dateId) => {
    const registrationKey = courseId  // Use simple key format
    registrationInProgress.value.add(registrationKey)

    // Do not attempt unregistration if customer id is missing or '0'
    if (!nimbuscloudClient.selectedCustomer || String(nimbuscloudClient.selectedCustomer) === '0') {
      console.warn('[useNimbuscloud] Unregistration blocked: customer id is missing or 0')
      registrationInProgress.value.delete(registrationKey)
      throw new Error('CUSTOMER_ID_MISSING: Please reload login so we can fetch your customer id.')
    }
    
    // Get current registration state before toggling
    const currentlyRegistered = isRegisteredForCourse(courseId, dateId)
    
    try {
      // Use the toggle API which will register if not registered, or unregister if registered
      const result = await nimbuscloudClient.togglePreCheckin(courseId, nimbuscloudClient.selectedCustomer)
      
      // Since it's a toggle, if we were registered, we should now be unregistered
      const newState = !currentlyRegistered
      
      registrations.value.set(registrationKey, { 
        registered: newState, 
        timestamp: new Date(),
        result 
      })
      
      forceRegistrationsUpdate()
      console.log(`[useNimbuscloud] Toggled registration for ${courseId}: ${currentlyRegistered} -> ${newState}`)
      return result
    } catch (error) {
      console.error('[useNimbuscloud] Failed to unregister from course:', error)
      throw error
    } finally {
      registrationInProgress.value.delete(registrationKey)
    }
  }

  const isRegisteredForCourse = (courseId, dateId) => {
    // Try the new simple key format first (just courseId)
    let registration = registrations.value.get(courseId)
    
    // Fall back to the old compound key format for compatibility
    if (!registration) {
      const oldRegistrationKey = `${courseId}-${dateId}`
      registration = registrations.value.get(oldRegistrationKey)
    }
    
    const result = registration?.registered || false
    console.log(`[useNimbuscloud] isRegisteredForCourse(${courseId}, ${dateId}) = ${result}`)
    return result
  }

  const isRegistrationInProgress = (courseId, dateId) => {
    // Check both key formats
    const simpleKey = courseId
    const compoundKey = `${courseId}-${dateId}`
    return registrationInProgress.value.has(simpleKey) || registrationInProgress.value.has(compoundKey)
  }

  const isPairOnlyCourse = (courseId) => {
    const metadata = courseMetadata.value.get(courseId)
    return metadata?.pairOnly || false
  }

  // Function to set selected week from URL parameters
  const setSelectedWeekFromUrl = (weekValue) => {
    if (weekValue !== null && weekValue !== undefined) {
      // Find the matching week in available weeks
      const matchingWeek = availableWeeks.value.find(w => w.value === weekValue)
      if (matchingWeek) {
        selectedWeek.value = matchingWeek
        console.log(`[useNimbuscloud] Set selected week from URL:`, selectedWeek.value)
      } else {
        console.warn(`[useNimbuscloud] Week ${weekValue} from URL not found in available weeks`)
      }
    }
  }

  return {
    isLoggedIn,
    credentials,
    userData,
    selectedWeek,
    availableWeeks,
    isLoggingIn,
    isDiscoveringWeeks,
    loginError,
    fetchSchedule,
    login,
    logout,
    clearLoginError,
    setSelectedWeek,
    attemptAutoLogin,
    discoverAvailableWeeks,
    setSelectedWeekFromUrl,
    // Registration functionality
    registrations,
    registrationInProgress,
    courseMetadata,
    getPreCheckinCourses,
    registerForCourse,
    unregisterFromCourse,
    isRegisteredForCourse,
    isRegistrationInProgress,
    isPairOnlyCourse,
    hasValidCustomerId,
    fetchAndIntegratePreCheckins
  }
}
