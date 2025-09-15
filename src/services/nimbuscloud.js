/**
 * Nimbuscloud API Client
 * 
 * This module provides a clean abstraction for interacting with the Nimbuscloud API.
 * It handles authentication, data transformation, and error handling.
 */

export class NimbuscloudClient {
  constructor() {
    this.baseUrl = 'https://community.nimbuscloud.at'
    this.apiVersion = 'v1'
    this.isAuthenticated = false
    this.credentials = null
    this.selectedCustomer = '0' // Default customer ID, can be updated after login

    // Add caching for login requests
    this.authCache = {
      lastAuthTime: null,
      authResult: null,
      cacheDuration: 15 * 60 * 1000 // 15 minutes cache (longer since we validate sessions first)
    }
  }

  /**
   * Set credentials for authentication
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   */
  setCredentials(credentials) {
    this.credentials = credentials
    this.isAuthenticated = true
  }

  /**
   * Clear credentials and logout
   */
  clearCredentials() {
    this.credentials = null
    this.isAuthenticated = false
  }

  /**
   * Test authentication with Nimbuscloud
   * @returns {Promise<boolean>} - True if authentication successful
   */
  async testAuthentication() {
    if (!this.credentials?.username || !this.credentials?.password) {
      return false
    }

    // Check cache first
    const cachedAuth = this.authCache.authResult
    const now = Date.now()
    if (cachedAuth && (now - this.authCache.lastAuthTime) < this.authCache.cacheDuration) {
      console.log('[NimbuscloudClient] Using cached authentication')
      this.isAuthenticated = true
      // Make sure we return the cached user data properly
      if (typeof cachedAuth === 'object' && cachedAuth.firstname) {
        // Restore selected customer from cache if available
        if (cachedAuth.customernr) {
          this.selectedCustomer = cachedAuth.customernr
          console.log('[NimbuscloudClient] Restored customer number from cache:', this.selectedCustomer)
        }
        return cachedAuth
      } else {
        // Clear invalid cache
        this.authCache.authResult = null
        this.authCache.lastAuthTime = null
      }
    }

    // First, try to use existing session cookie by testing with pre-checkin-courses API
    console.log('[NimbuscloudClient] Testing existing session cookie...')
    try {
      this.isAuthenticated = true // Temporarily set to allow getPreCheckinCourses call
      const preCheckinData = await this.getPreCheckinCourses()
      console.log('[NimbuscloudClient] Existing session is valid')
      
      // Try to get user data for a more complete authentication result
      try {
        const userData = await this.getUserBaseData()
        console.log('[NimbuscloudClient] Got user data')
        // Update cache with valid session data
        this.authCache.lastAuthTime = Date.now()
        this.authCache.authResult = userData
        return userData
      } catch (userDataError) {
        console.warn('[NimbuscloudClient] Could not get user base data, but pre-checkin worked:', userDataError)
        // Still valid auth, just return basic info
        const basicAuth = { authenticated: true, username: this.credentials.username }
        this.authCache.lastAuthTime = Date.now()
        this.authCache.authResult = basicAuth
        return basicAuth
      }
      
    } catch (sessionError) {
      console.log('[NimbuscloudClient] Existing session invalid or expired, will authenticate with credentials:', sessionError.message)
      this.isAuthenticated = false
    }

    // If session is invalid, perform fresh authentication
    console.log('[NimbuscloudClient] Performing fresh authentication...')
    try {
      const loginResponse = await fetch('https://community.nimbuscloud.at/api/v1/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'account-email': this.credentials.username,
          'account-password': this.credentials.password,
          'init-system': 'default',
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      // Extract session cookie from response headers
      if (loginResponse.ok) {
        // In browser environment, cookies are automatically handled by the browser
        // We don't need to manually extract them from headers due to CORS restrictions
        // The browser will automatically include them in subsequent requests
        console.log('[NimbuscloudClient] Fresh authentication successful')
        this.isAuthenticated = true
        this.authCache.lastAuthTime = Date.now() // Update cache time
        
        // Get user base data to extract the user's name
        try {
          const userData = await this.getUserBaseData()
          console.log('[NimbuscloudClient] User data obtained after fresh auth')
          this.authCache.authResult = userData // Cache the user data
          return userData
        } catch (userDataError) {
          console.warn('[NimbuscloudClient] Failed to get user data after fresh authentication:', userDataError)
          // Still return some basic info so we know authentication succeeded
          const basicUserData = { 
            authenticated: true, 
            username: this.credentials.username,
            firstname: '', 
            lastname: '' 
          }
          this.authCache.authResult = basicUserData
          return basicUserData
        }
      } else {
        console.error('[NimbuscloudClient] Fresh authentication failed:', loginResponse.status, loginResponse.statusText)
        
        // Get response text for better error handling
        let errorMessage = 'Authentication failed'
        try {
          const responseText = await loginResponse.text()
          console.error('[NimbuscloudClient] Error response:', responseText)
          
          // Parse error response if it's JSON
          try {
            const errorData = JSON.parse(responseText)
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch (e) {
            // Response is not JSON, use status-based error
            if (loginResponse.status === 401) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.'
            } else if (loginResponse.status === 403) {
              errorMessage = 'Access denied. Please check your account status.'
            } else if (loginResponse.status >= 500) {
              errorMessage = 'Nimbuscloud server is currently unavailable. Please try again later.'
            }
          }
        } catch (e) {
          console.error('[NimbuscloudClient] Error reading response:', e)
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Authentication test failed:', error)
      
      // Provide more specific error information
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to Nimbuscloud. Please check your internet connection and try again.')
      } else if (error.status === 401 || error.status === 403) {
        throw new Error('Invalid username or password. Please check your credentials and try again.')
      } else if (error.status >= 500) {
        throw new Error('Nimbuscloud server is currently unavailable. Please try again later.')
      } else {
        throw new Error('Authentication failed. Please try again.')
      }
    }
  }

  /**
   * Get user base data including name
   * @returns {Promise<Object>} User data from Nimbuscloud
   */
  async getUserBaseData() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/user/base-data', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to get user base data: ${response.status}`)
      }

      const userData = await response.json()
      console.log('[NimbuscloudClient] User base data retrieved')
      
      // Extract useful information
      const extractedData = {
        customernr: userData.content?.customer?.customernr,
        firstname: userData.content?.customer?.firstname,
        lastname: userData.content?.customer?.surname, // API returns "surname", not "lastname"
        checkinCode: userData.content?.customer?.checkinCode,
        formattedCheckinCode: userData.content?.customer?.formattedCheckinCode,
        fullData: userData
      }
      
      // Store the customer number for subsequent requests
      if (extractedData.customernr) {
        this.selectedCustomer = extractedData.customernr
        console.log('[NimbuscloudClient] Customer number updated:', this.selectedCustomer)
      }
      
      console.log('[NimbuscloudClient] User firstname obtained:', extractedData.firstname)
      
      return extractedData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get user base data:', error)
      throw error
    }
  }

  /**
   * Fetch schedule data for a specific date
   * @param {Date} date - The date to fetch schedule for (should be Monday of the week)
   * @returns {Promise<Object>} - Schedule data in our expected format
   */
  async fetchSchedule(date) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      // Format date as DD.MM.YYYY for Nimbuscloud API
      const formattedDate = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      console.log(`[NimbuscloudClient] Fetching schedule for ${formattedDate}`)

      const response = await fetch(`https://community.nimbuscloud.at/api/v1/default/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: `date=${formattedDate}`,
        mode: 'cors',
        credentials: 'include' // Include cookies automatically
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const rawData = await response.json()

      // Transform the data to match our expected format
      return this.transformScheduleData(rawData)

    } catch (error) {
      console.error('[NimbuscloudClient] Failed to fetch schedule:', error)
      throw error
    }
  }

  /**
   * Transform Nimbuscloud API response to our expected format
   * @param {Object} rawData - Raw data from Nimbuscloud API
   * @returns {Object} - Transformed data matching our internal format
   */
  transformScheduleData(rawData) {
    console.log('[NimbuscloudClient] Transforming Nimbuscloud API data...')
    
    try {
      // Try different possible API response structures
      let apiContent = null
      
      // Check for the new API structure with content.days[]
      if (rawData?.content?.days && Array.isArray(rawData.content.days)) {
        apiContent = rawData.content
        console.log('[NimbuscloudClient] Using content.days structure (new API format)')
      }
      // Check if it's the nested content.content structure
      else if (rawData?.content?.content?.locations) {
        apiContent = rawData.content.content
        console.log('[NimbuscloudClient] Using nested content.content structure')
      }
      // Check if it's the direct content.locations structure
      else if (rawData?.content?.locations) {
        apiContent = rawData.content
        console.log('[NimbuscloudClient] Using direct content.locations structure')
      }
      // Check if locations are at the root level
      else if (rawData?.locations) {
        apiContent = rawData
        console.log('[NimbuscloudClient] Using root level locations structure')
      }
      else {
        console.warn('[NimbuscloudClient] Unexpected API response structure:', rawData)
        // Return empty structure as fallback
        return {
          courses: [],
          locations: [],
          teachers: [],
          courseTypes: []
        }
      }

      const transformedCourses = []
      
      // Handle new API structure with content.days[]
      if (apiContent.days && Array.isArray(apiContent.days)) {
        console.log('[NimbuscloudClient] Processing days-based API structure')
        
        // Process each day
        apiContent.days.forEach(day => {
          const dayDate = new Date(day.timestamp * 1000) // Convert Unix timestamp to Date
          
          // Process each event (course) for this day
          day.events.forEach(event => {
            if (event.type === 'course') {
              const startTime = new Date(parseInt(event.start) * 1000)
              const endTime = new Date(parseInt(event.end) * 1000)
              
              // Validate the Date objects
              if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.warn(`[NimbuscloudClient] Invalid dates for course ${event.displayName}:`, {
                  eventStart: event.start,
                  eventEnd: event.end,
                  startTime,
                  endTime
                })
                return // Skip this course if dates are invalid
              }
              
              const transformedCourse = {
                id: event.id,
                name: event.displayName,
                type: event.typeName,
                level: event.levelName,
                teacher: event.teacherNames?.join(', ') || '',
                teacherId: null, // Not provided in this API structure
                location: event.location,
                room: event.room,
                day: this.getDayCode(dayDate),
                startTime,
                endTime,
                date: day.dateFull, // German date string like "15.09.2025"
                parsedDate: dayDate,
                // Include registration status
                visitExists: false, // Not provided in this API structure
                // Include availability info for registration buttons
                attendanceStatus: event.attendanceStatus,
                pairOnly: false, // Not provided in this API structure, could be inferred from name
                // Additional metadata
                eveningNumber: null,
                teacherImage: null,
                experiencePoints: 0
              }
              
              transformedCourses.push(transformedCourse)
            }
          })
        })
      }
      // Handle old API structure with locations
      else if (apiContent.locations) {
        console.log('[NimbuscloudClient] Processing locations-based API structure')
        
        // Process each location
        apiContent.locations.forEach(location => {
          // Process each day for this location
          location.days.forEach(day => {
            const dayDate = new Date(day.time * 1000) // Convert Unix timestamp to Date
            
            // Process each course for this day
            day.courses.forEach(course => {
              const transformedCourse = {
                id: course.event, // Using event ID as course ID
                name: course.name,
                type: this.extractCourseType(course.name),
                level: this.extractLevel(course.name),
                teacher: course.teacherName,
                teacherId: course.teacher,
                location: location.name,
                room: course.room,
                day: this.getDayCode(dayDate),
                startTime: this.parseTime(course.start_time, dayDate),
                endTime: this.parseTime(course.end_time, dayDate),
                date: course.start_date, // Keep raw German date string for display
                parsedDate: this.parseGermanDate(course.start_date, dayDate), // Parsed Date object
                // Include registration status
                visitExists: course.visitExists || false,
                // Include availability info for registration buttons
                attendanceStatus: course.attendanceStatusFull,
                pairOnly: course.pairOnly || false,
                // Additional metadata
                eveningNumber: course.eveningNumber,
                teacherImage: course.teacherImage,
                experiencePoints: course.experiencePoints || 0
              }
              
              transformedCourses.push(transformedCourse)
            })
          })
        })
      }
      
      // Extract unique values for filters
      const locations = [...new Set(transformedCourses.map(c => c.location))]
      const teachers = [...new Set(transformedCourses.map(c => c.teacher))]
      const courseTypes = [...new Set(transformedCourses.map(c => c.type))]
      
      const transformedData = {
        courses: transformedCourses,
        locations,
        teachers,
        courseTypes
      }
      
      // 🔍 GAP SLOTS DEBUG: Log available slots per day from Nimbuscloud
      console.log('🔍 [GAP SLOTS] Nimbuscloud transformed data:', {
        totalCourses: transformedData.courses.length,
        locations: transformedData.locations,
        sampleCourse: transformedData.courses[0]
      })
      
      // Group courses by day for gap slot analysis
      const coursesByDay = new Map()
      transformedData.courses.forEach(course => {
        if (!coursesByDay.has(course.day)) {
          coursesByDay.set(course.day, [])
        }
        coursesByDay.get(course.day).push(course)
      })
      
      console.log('🔍 [GAP SLOTS] Available slots per day from Nimbuscloud:')
      coursesByDay.forEach((courses, day) => {
        const sortedCourses = courses.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        console.log(`🔍 [GAP SLOTS] Day ${day}:`, sortedCourses.map(c => ({
          name: c.name.substring(0, 30) + (c.name.length > 30 ? '...' : ''),
          startTime: new Date(c.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date(c.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          duration: Math.round((new Date(c.endTime) - new Date(c.startTime)) / (1000 * 60)) + 'min'
        })))
        
        // Calculate potential gaps
        const gaps = []
        for (let i = 0; i < sortedCourses.length - 1; i++) {
          const currentEnd = new Date(sortedCourses[i].endTime)
          const nextStart = new Date(sortedCourses[i + 1].startTime)
          const gapMinutes = (nextStart - currentEnd) / (1000 * 60)
          if (gapMinutes > 0) {
            gaps.push({
              between: `${sortedCourses[i].name.substring(0, 15)}... → ${sortedCourses[i + 1].name.substring(0, 15)}...`,
              gapTime: `${currentEnd.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}-${nextStart.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
              gapMinutes: gapMinutes + 'min'
            })
          }
        }
        if (gaps.length > 0) {
          console.log(`🔍 [GAP SLOTS] Potential gaps on ${day}:`, gaps)
        } else {
          console.log(`🔍 [GAP SLOTS] No gaps found on ${day}`)
        }
      })
      
      return transformedData

    } catch (error) {
      console.error('[NimbuscloudClient] Error transforming data:', error)
      throw new Error('Failed to transform schedule data')
    }
  }

  // Helper methods for data transformation
  extractCourseType(name) {
    if (name.includes('Standard & Latein')) return 'Standard & Latein'
    if (name.includes('Lindy Hop')) return 'Lindy Hop'
    if (name.includes('West Coast Swing')) return 'West Coast Swing'
    if (name.includes('Salsa')) return 'Salsa'
    if (name.includes('Bachata')) return 'Bachata'
    if (name.includes('Tango Argentino')) return 'Tango Argentino'
    if (name.includes('Discofox')) return 'Discofox'
    if (name.includes('Urban Kiz')) return 'Urban Kiz'
    return 'Other'
  }

  extractLevel(name) {
    if (name.includes('Grundstufe') || name.includes('Level 1') || name.includes('WTP 1')) return 'Beginner'
    if (name.includes('Aufbaustufe') || name.includes('Level 2') || name.includes('WTP 2')) return 'Intermediate'
    if (name.includes('Mittelstufe') || name.includes('Level 3')) return 'Intermediate+'
    if (name.includes('Medaillenstufe') || name.includes('Level 4') || name.includes('Club')) return 'Advanced'
    return 'Unknown'
  }

  getDayCode(date) {
    const days = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA']
    return days[date.getDay()]
  }

  parseTime(timeString, baseDate) {
    // Parse time string like "19:00" and create Date object for the given day
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date(baseDate)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  /**
   * Parse German date format like "MI 17.09." to a proper Date object
   * @param {string} germanDateString - Date string in format "DI 17.09."
   * @param {Date} baseYear - Base date to get the year from (default: current date)
   * @returns {Date} - Parsed Date object
   */
  parseGermanDate(germanDateString, baseYear = new Date()) {
    if (!germanDateString || typeof germanDateString !== 'string') {
      return null
    }
    
    // Extract day and month from format like "MI 17.09."
    const match = germanDateString.match(/\w+\s+(\d+)\.(\d+)\./)
    if (!match) {
      console.warn('[NimbuscloudClient] Could not parse German date string:', germanDateString)
      return null
    }
    
    const day = parseInt(match[1])
    const month = parseInt(match[2]) - 1 // JavaScript months are 0-indexed
    const year = baseYear.getFullYear()
    
    return new Date(year, month, day)
  }

  /**
   * Ensure a valid (non-'0') selected customer is available. Attempts to restore
   * from cache or fetch via base data when necessary.
   * @returns {Promise<string>} - The resolved customer id
   */
  async ensureCustomerSelected() {
    console.log('[NimbuscloudClient] ensureCustomerSelected: Current selectedCustomer:', this.selectedCustomer)
    
    // If we already have a valid customer id, use it
    if (this.selectedCustomer && String(this.selectedCustomer) !== '0') {
      console.log('[NimbuscloudClient] ensureCustomerSelected: Using existing selectedCustomer:', this.selectedCustomer)
      return this.selectedCustomer
    }

    // Try to restore from cached auth result
    const cached = this.authCache?.authResult
    if (cached?.customernr && String(cached.customernr) !== '0') {
      this.selectedCustomer = cached.customernr
      console.log('[NimbuscloudClient] ensureCustomerSelected: Restored customer number from auth cache:', this.selectedCustomer)
      return this.selectedCustomer
    }

    // Try fetching user base data to obtain the customer id
    console.log('[NimbuscloudClient] ensureCustomerSelected: Attempting to fetch base data to get customer ID')
    try {
      const baseData = await this.getUserBaseData()
      console.log('[NimbuscloudClient] ensureCustomerSelected: Base data result:', { customernr: baseData?.customernr, firstname: baseData?.firstname })
      if (baseData?.customernr && String(baseData.customernr) !== '0') {
        this.selectedCustomer = baseData.customernr
        console.log('[NimbuscloudClient] ensureCustomerSelected: Customer number obtained from base data:', this.selectedCustomer)
        return this.selectedCustomer
      }
    } catch (e) {
      console.warn('[NimbuscloudClient] ensureCustomerSelected: failed to fetch base data:', e?.message || e)
    }

    // As a last resort, throw a descriptive error
    console.error('[NimbuscloudClient] ensureCustomerSelected: Failed to resolve customer ID')
    throw new Error('CUSTOMER_ID_MISSING: Unable to resolve customer id. Please login again.')
  }

  /**
   * Get available weeks (current, next, and week after)
   * @returns {Array} - Array of week objects
   */
  getAvailableWeeks() {
    const weeks = []
    const now = new Date()
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + (i * 7))
      
      // Get Monday of that week
      const monday = new Date(date)
      const dayOfWeek = date.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      monday.setDate(date.getDate() - daysFromMonday)
      
      weeks.push({
        value: i,
        label: i === 0 ? 'Current Week' : i === 1 ? 'Next Week' : `Week of ${monday.toLocaleDateString()}`,
        translationKey: i === 0 ? 'Current Week' : i === 1 ? 'Next Week' : 'Week of',
        date: monday,
        isoString: monday.toISOString().split('T')[0]
      })
    }
    
    return weeks
  }

  /**
   * Get courses available for pre-registration
   * @param {string} selectedCustomer - Customer ID (defaults to instance value)
   * @returns {Promise<Object>} Pre-registration data with limits and availability
   */
  async getPreCheckinCourses(selectedCustomer = null) {
    const customerToUse = (selectedCustomer && String(selectedCustomer) !== '0')
      ? selectedCustomer
      : await this.ensureCustomerSelected()

    console.log('[NimbuscloudClient] Making pre-checkin courses request with customer:', customerToUse)
    
    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/pre-checkin-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'selectedCustomer': customerToUse,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include'
      })

      console.log('[NimbuscloudClient] Pre-checkin courses response status:', response.status)
      
      if (!response.ok) {
        console.error('[NimbuscloudClient] Pre-checkin courses request failed:', response.status, response.statusText)
        throw new Error(`Pre-checkin courses request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('[NimbuscloudClient] Pre-checkin courses response received successfully')
      console.log('[NimbuscloudClient] Raw response data:', data)
      console.log('[NimbuscloudClient] Pre-checkin courses response structure:', {
        hasContent: !!data.content,
        hasNestedContent: !!(data.content?.content),
        hasLocations: !!(data.content?.content?.locations),
        payloadLength: data.payload?.length || 0,
        payloadIsArray: Array.isArray(data.payload)
      })
      
      // Normalize into a payload array of course objects from locations/days structure
      if (data.content?.content?.locations && Array.isArray(data.content.content.locations)) {
        const allCourses = []
        const now = new Date()
        
        data.content.content.locations.forEach(location => {
          const locationName = location.name
          location.days?.forEach(day => {
            const dayTimestampSec = day.time // Unix seconds
            const dayDate = new Date(dayTimestampSec * 1000)
            const dayCode = this.getDayCode(dayDate)
            
            day.courses?.forEach(course => {
              // Build parsed start/end Date from the day and the HH:mm strings
              const parsedStart = course.start_time ? this.parseTime(course.start_time, dayDate) : null
              const parsedEnd = course.end_time ? this.parseTime(course.end_time, dayDate) : null

              // Debug each course as we parse it
              console.log(`[NimbuscloudClient] Parsing course ${course.event} "${course.name}" - visitExists: ${course.visitExists}, pairOnly: ${course.pairOnly}`)

              allCourses.push({
                // Identity
                id: course.event,
                event: course.event,
                // Display
                name: course.name,
                location: locationName,
                room: course.room,
                teacher: course.teacher,
                teacherName: course.teacherName,
                teacherImage: course.teacherImage,
                imageUrl: course.imageUrl,
                imagePath: course.imagePath,
                // Constraints/flags
                pairOnly: !!course.pairOnly,
                visitExists: !!course.visitExists,
                withPartner: !!course.withPartner,
                // Attendance status
                attendanceStatus: course.attendanceStatusFull,
                eveningNumber: course.eveningNumber,
                experiencePoints: course.experiencePoints ?? 0,
                // Timing
                start_date: course.start_date,
                start_time: course.start_time,
                end_time: course.end_time,
                dayTimestamp: dayTimestampSec,
                dayCode,
                parsedStart,
                parsedEnd,
                isOver: parsedEnd ? parsedEnd < now : false,
              })
            })
          })
        })
        
        // Debug stats
        const registered = allCourses.filter(c => c.visitExists)
        const upcomingRegistered = registered.filter(c => c.parsedEnd && c.parsedEnd > new Date())
        console.log('[NimbuscloudClient] Extracted courses from locations structure:')
        console.log('[NimbuscloudClient] Total courses found:', allCourses.length)
        console.log('[NimbuscloudClient] Courses with pairOnly=true:', allCourses.filter(c => c.pairOnly).length)
        console.log('[NimbuscloudClient] Courses with visitExists=true:', registered.length)
        
        // Additional debug: Show the customer we used for the request
        console.log('[NimbuscloudClient] Customer ID used for pre-checkin request:', customerToUse)
        console.log('[NimbuscloudClient] Sample of visitExists values from first 10 courses:', 
          allCourses.slice(0, 10).map(c => ({ event: c.event, name: c.name.substring(0, 30), visitExists: c.visitExists })))
        
        if (registered.length > 0) {
          console.log('[NimbuscloudClient] All registered courses (visitExists=true):', registered.map(c => ({
            event: c.event,
            name: c.name,
            location: c.location,
            dayCode: c.dayCode,
            start: c.parsedStart?.toISOString(),
            end: c.parsedEnd?.toISOString(),
            isOver: c.isOver
          })))
        } else {
          console.warn('[NimbuscloudClient] ❌ ISSUE: No registered courses found - all courses have visitExists=false')
          console.warn('[NimbuscloudClient] This suggests either:')
          console.warn('[NimbuscloudClient] 1. User is not actually registered for any courses in this time period')
          console.warn('[NimbuscloudClient] 2. Wrong customer ID is being used (' + customerToUse + ')')
          console.warn('[NimbuscloudClient] 3. API response structure has changed or is missing registration data')
        }
        
        if (upcomingRegistered.length > 0) {
          console.log('[NimbuscloudClient] Upcoming registered courses (not over):', upcomingRegistered.map(c => ({
            event: c.event,
            name: c.name,
            location: c.location,
            dayCode: c.dayCode,
            start: c.parsedStart?.toISOString(),
            end: c.parsedEnd?.toISOString()
          })))
        } else {
          console.warn('[NimbuscloudClient] No upcoming (not over) registered courses found in pre-checkin payload')
        }
        console.log('[NimbuscloudClient] First few extracted courses with visit/pair info:', 
          allCourses.slice(0, 5).map(c => ({ id: c.id, name: c.name, pairOnly: c.pairOnly, visitExists: c.visitExists, start_time: c.start_time, end_time: c.end_time })))

        // Put the normalized list into payload for downstream consumers
        const modifiedResponse = {
          ...data,
          payload: allCourses
        }
        
        return modifiedResponse
        
      } else if (data.payload && Array.isArray(data.payload)) {
        // Ensure booleans are normalized and log stats
        const payload = data.payload.map(c => ({
          ...c,
          pairOnly: !!c.pairOnly,
          visitExists: !!c.visitExists
        }))
        const registered = payload.filter(c => c.visitExists)
        console.log('[NimbuscloudClient] Using payload structure - courses found:', payload.length)
        console.log('[NimbuscloudClient] Courses with visitExists=true:', registered.length)
        console.log('[NimbuscloudClient] First few courses with pairOnly/visitExists info:', 
          payload.slice(0, 5).map(c => ({ id: c.id, name: c.name, pairOnly: c.pairOnly, visitExists: c.visitExists })))
        return { ...data, payload }
      } else {
        console.warn('[NimbuscloudClient] Unexpected response structure - no courses found in payload or locations')
        console.log('[NimbuscloudClient] Available data keys:', Object.keys(data))
        return data
      }
    } catch (error) {
      console.error('[NimbuscloudClient] Pre-checkin courses request error:', error)
      throw error
    }
  }

  /**
   * Toggle registration for a specific course (register if not registered, unregister if registered)
   * @param {string} eventId - Event/course identifier
   * @param {string} selectedCustomer - Customer ID (defaults to instance value)
   * @returns {Promise<Object>} - Toggle response from Nimbuscloud
   */
  async togglePreCheckin(eventId, selectedCustomer = null) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    const customerToUse = (selectedCustomer && String(selectedCustomer) !== '0')
      ? selectedCustomer
      : await this.ensureCustomerSelected()

    console.log('[NimbuscloudClient] Toggling pre-checkin', { eventId, selectedCustomer: customerToUse })

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/toggle-pre-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'event': eventId,
          'selectedCustomer': customerToUse,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        console.error('[NimbuscloudClient] Toggle pre-checkin request failed:', response.status, response.statusText)
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Toggle pre-checkin response:', responseData)
      // Helpful propagation/debug info
      try {
        const changedEventId = responseData?.content?.event || eventId
        const registeredNow = !!(responseData?.content?.visitExists ?? responseData?.content?.registered)
        console.log('[NimbuscloudClient] Registration state changed', { event: changedEventId, visitExists: registeredNow })
      } catch (_) {
        // ignore
      }
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to toggle pre-checkin:', error)
      throw error
    }
  }

  /**
   * Register for a specific course date (deprecated - use togglePreCheckin)
   * @param {string} courseId - Course identifier (the event ID)
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Registration response from Nimbuscloud
   */
  async registerForCourse(courseId, dateId) {
    console.log('[NimbuscloudClient] registerForCourse is deprecated, using togglePreCheckin')
    return await this.togglePreCheckin(courseId)
  }

  /**
   * Unregister from a specific course date (deprecated - use togglePreCheckin)
   * @param {string} courseId - Course identifier (the event ID)  
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Unregistration response from Nimbuscloud
   */
  async unregisterFromCourse(courseId, dateId) {
    console.log('[NimbuscloudClient] unregisterFromCourse is deprecated, using togglePreCheckin')
    return await this.togglePreCheckin(courseId)
  }

  /**
   * Get registration status for a specific course date
   * @param {string} courseId - Course identifier (the event ID)
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Registration status response from Nimbuscloud
   */
  async getRegistrationStatus(courseId, dateId) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'event-id': courseId,
          'date-id': dateId,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Registration status response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get registration status:', error)
      throw error
    }
  }

  /**
   * Get the user's registration data for the current week
   * @returns {Promise<Object>} - Registration data for the week
   */
  async getWeeklyRegistrationData() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      // Get the current week's Monday date
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(now)
      monday.setDate(now.getDate() - daysFromMonday)

      const customerToUse = await this.ensureCustomerSelected()
      
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/weekly-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'start-date': monday.toISOString().split('T')[0],
          'end-date': new Date(monday.getTime() + (6 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          'selectedCustomer': customerToUse,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Weekly registration data response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get weekly registration data:', error)
      throw error
    }
  }

  /**
   * Get the user's registration data for the next week
   * @returns {Promise<Object>} - Registration data for the next week
   */
  async getNextWeekRegistrationData() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      // Get the next week's Monday date
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(now)
      monday.setDate(now.getDate() - daysFromMonday + 7)

      const customerToUse = await this.ensureCustomerSelected()
      
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/weekly-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'start-date': monday.toISOString().split('T')[0],
          'end-date': new Date(monday.getTime() + (6 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          'selectedCustomer': customerToUse,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Next week registration data response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get next week registration data:', error)
      throw error
    }
  }

  /**
   * Get the user's registration data for the week after next
   * @returns {Promise<Object>} - Registration data for the week after next
   */
  async getWeekAfterNextRegistrationData() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      // Get the week after next Monday date
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(now)
      monday.setDate(now.getDate() - daysFromMonday + 14)

      const customerToUse = await this.ensureCustomerSelected()
      
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/weekly-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'start-date': monday.toISOString().split('T')[0],
          'end-date': new Date(monday.getTime() + (6 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          'selectedCustomer': customerToUse,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Week after next registration data response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get week after next registration data:', error)
      throw error
    }
  }

  /**
   * Get the user's registration data for a specific date range
   * @param {Date} startDate - Start date of the range
   * @param {Date} endDate - End date of the range
   * @returns {Promise<Object>} - Registration data for the date range
   */
  async getRegistrationDataByDateRange(startDate, endDate) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const customerToUse = await this.ensureCustomerSelected()
      
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/date-range', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'start-date': startDate.toISOString().split('T')[0],
          'end-date': endDate.toISOString().split('T')[0],
          'selectedCustomer': customerToUse,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Registration data by date range response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get registration data by date range:', error)
      throw error
    }
  }

  /**
   * Get the user's attendance data for a specific course date
   * @param {string} courseId - Course identifier (the event ID)
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Attendance data response from Nimbuscloud
   */
  async getAttendanceData(courseId, dateId) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'event-id': courseId,
          'date-id': dateId,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Attendance data response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get attendance data:', error)
      throw error
    }
  }

  /**
   * Check in for a specific course date
   * @param {string} courseId - Course identifier (the event ID)
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Check-in response from Nimbuscloud
   */
  async checkinForCourse(courseId, dateId) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'event-id': courseId,
          'date-id': dateId,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Check-in response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to check in for course:', error)
      throw error
    }
  }

  /**
   * Check out from a specific course date
   * @param {string} courseId - Course identifier (the event ID)
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Check-out response from Nimbuscloud
   */
  async checkoutFromCourse(courseId, dateId) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'event-id': courseId,
          'date-id': dateId,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Check-out response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to check out from course:', error)
      throw error
    }
  }

  /**
   * Get the check-in status for a specific course date
   * @param {string} courseId - Course identifier (the event ID)
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Check-in status response from Nimbuscloud
   */
  async getCheckinStatus(courseId, dateId) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/checkin-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'event-id': courseId,
          'date-id': dateId,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Check-in status response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get check-in status:', error)
      throw error
    }
  }

  /**
   * Get the check-out status for a specific course date
   * @param {string} courseId - Course identifier (the event ID)
   * @param {string} dateId - Date identifier (same as courseId for individual events)
   * @returns {Promise<Object>} - Check-out status response from Nimbuscloud
   */
  async getCheckoutStatus(courseId, dateId) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/checkout-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: new URLSearchParams({
          'event-id': courseId,
          'date-id': dateId,
          'source': 'browser'
        }),
        mode: 'cors',
        credentials: 'include' // Important: Include cookies in requests
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NimbuscloudClient] Check-out status response:', responseData)
      
      return responseData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get check-out status:', error)
      throw error
    }
  }

  /**
   * Get the user's profile information
   * @returns {Promise<Object>} - User profile data
   */
  async getUserProfile() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/user/profile', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.status}`)
      }

      const profileData = await response.json()
      console.log('[NimbuscloudClient] User profile data:', profileData)
      
      return profileData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to get user profile:', error)
      throw error
    }
  }

  /**
   * Update the user's profile information
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Update response from Nimbuscloud
   */
  async updateUserProfile(profileData) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: JSON.stringify(profileData),
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to update user profile: ${response.status}`)
      }

      const updatedData = await response.json()
      console.log('[NimbuscloudClient] User profile updated:', updatedData)
      
      return updatedData
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to update user profile:', error)
      throw error
    }
  }

  /**
   * Change the user's password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Password change response from Nimbuscloud
   */
  async changePassword(oldPassword, newPassword) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        }),
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to change password: ${response.status}`)
      }

      const result = await response.json()
      console.log('[NimbuscloudClient] Password changed successfully:', result)
      
      return result
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to change password:', error)
      throw error
    }
  }

  /**
   * Delete the user's account
   * @returns {Promise<Object>} - Account deletion response from Nimbuscloud
   */
  async deleteAccount() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/user/account', {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin
        },
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete account: ${response.status}`)
      }

      const result = await response.json()
      console.log('[NimbuscloudClient] Account deleted successfully:', result)
      
      // Clear credentials on account deletion
      this.clearCredentials()
      
      return result
    } catch (error) {
      console.error('[NimbuscloudClient] Failed to delete account:', error)
      throw error
    }
  }

  /**
   * Helper method to check if two dates are on the same day
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} - True if dates are on the same day
   */
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  /**
   * Get my precheckins from the Nimbuscloud API
   * This endpoint provides information about the user's upcoming checkins,
   * including confirmed precheckins, livestream availability, and virtual rooms.
   * Filters out events that have already ended and highlights today's events.
   * @returns {Promise<Object>} - My precheckins response from Nimbuscloud
   */
  async getMyPreCheckins() {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.')
    }

    console.log('[NimbuscloudClient] Fetching my precheckins...')

    try {
      const response = await fetch('https://community.nimbuscloud.at/api/v1/checkin/my-precheckins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': window.location.origin,
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'include' // Important: Include cookies for session authentication
      })

      console.log('[NimbuscloudClient] My precheckins response status:', response.status)
      
      if (!response.ok) {
        console.error('[NimbuscloudClient] My precheckins request failed:', response.status, response.statusText)
        throw new Error(`My precheckins request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('[NimbuscloudClient] My precheckins response received successfully')
      console.log('[NimbuscloudClient] My precheckins data structure:', {
        hasContent: !!data.content,
        hasCustomers: !!(data.content?.customers),
        customersCount: data.content?.customers?.length || 0,
        hasTicketsToday: !!(data.content?.ticketsToday),
        ticketsTodayCount: data.content?.ticketsToday?.length || 0,
        hasLivestream: data.content?.livestream,
        hasVirtualRooms: !!(data.content?.myVirtualRooms),
        virtualRoomsCount: data.content?.myVirtualRooms?.length || 0,
        statuscode: data.statuscode,
        status: data.status
      })

      // Process and normalize the data
      if (data.content && data.content.customers && Array.isArray(data.content.customers)) {
        const allEvents = []
        const now = new Date()
        
        data.content.customers.forEach(customer => {
          customer.events?.forEach(event => {
            // Parse start and end times from unix timestamps
            const startTime = event.start ? new Date(parseInt(event.start) * 1000) : null
            const endTime = event.end ? new Date(parseInt(event.end) * 1000) : null
            
            // Filter out events that have already ended (older than current time)
            if (endTime && endTime < now) {
              console.log(`[NimbuscloudClient] Filtering out past event: ${event.name} (ended at ${endTime.toLocaleString()})`)
              return // Skip this event
            }
            
            // Determine if event is today, upcoming, or starts soon
            const isToday = startTime && this.isSameDay(startTime, now)
            const startsSoon = isToday && startTime && (startTime.getTime() - now.getTime()) <= (2 * 60 * 60 * 1000) // Within 2 hours
            const isUpcoming = startTime && startTime.getTime() > now.getTime()
            
            allEvents.push({
              // Event identity
              eventId: event.event,
              customerId: customer.customer,
              customerName: customer.name,
              
              // Event details
              name: event.name,
              room: event.room,
              location: event.location,
              
              // Timing
              start: event.start,
              end: event.end,
              startTime: startTime,
              endTime: endTime,
              
              // Status flags
              preCheckinConfirmed: !!event.preCheckinConfirmed,
              isToday: isToday, // Highlight today's events
              startsSoon: startsSoon,
              isUpcoming: isUpcoming
            })
          })
        })
        
        console.log('[NimbuscloudClient] Processed my precheckins:', {
          totalEvents: allEvents.length,
          todayEvents: allEvents.filter(e => e.isToday).length,
          upcomingEvents: allEvents.filter(e => e.isUpcoming).length,
          confirmedPrecheckins: allEvents.filter(e => e.preCheckinConfirmed).length
        })
        
        // Add processed events to the response
        const processedResponse = {
          ...data,
          processedEvents: allEvents,
          summary: {
            totalEvents: allEvents.length,
            todayEvents: allEvents.filter(e => e.isToday).length,
            upcomingEvents: allEvents.filter(e => e.isUpcoming).length,
            confirmedPrecheckins: allEvents.filter(e => e.preCheckinConfirmed).length,
            hasLivestream: !!data.content?.livestream,
            hasVirtualRooms: data.content?.myVirtualRooms?.length > 0
          }
        }
        
        return processedResponse
      } else {
        console.warn('[NimbuscloudClient] My precheckins response has unexpected structure')
        return data
      }
    } catch (error) {
      if (error.message.includes('cors') || error.message.includes('CORS')) {
        console.warn('[NimbuscloudClient] CORS or network error when fetching my precheckins - this is expected when running from localhost:', error.message)
        throw new Error('CORS_ERROR: My precheckins API blocked by browser security policy')
      } else {
        console.error('[NimbuscloudClient] Failed to get my precheckins:', error)
        throw error
      }
    }
  }
}

// Export a singleton instance
export const nimbuscloudClient = new NimbuscloudClient()
