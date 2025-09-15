import { ref, watch } from 'vue'

/**
 * Cookie-based state management for dance course planner
 * Persists application state in browser cookies with JSON config integration
 */
export function useCookieState() {
  // Cookie utilities
  const setCookie = (name, value, days = 30) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }

  const getCookie = (name) => {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)))
        } catch (error) {
          console.warn('Failed to parse cookie:', name, error)
          return null
        }
      }
    }
    return null
  }

  const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  }

  // Load configuration from JSON file
  const loadAppConfig = async () => {
    try {
      // Use the base path for the application
      const basePath = import.meta.env.BASE_URL || '/'
      const configPath = `${basePath}src/config/app.config.json`
      const response = await fetch(configPath)
      if (response.ok) {
        const config = await response.json()
        console.log('Loaded app configuration:', config)
        return config
      } else {
        console.warn('No app.config.json found, using defaults')
      }
    } catch (error) {
      console.warn('Failed to load app.config.json:', error)
    }
    return null
  }

  // Load state from cookies with JSON config integration
  const loadStateFromCookies = async () => {
    const savedConstraints = getCookie('danceCoursePlannerConstraints')
    
    // Load configuration from JSON file
    const appConfig = await loadAppConfig()
    
    // Build default constraints from app config or hardcoded fallbacks
    const defaultConstraints = {
      selectedLocation: (appConfig?.locationSelector?.defaultLocation) || 'Karlsruhe',
      selectedCourseNames: [],
      courseMultiplicity: {}, // New: multiplicity settings per selected course
      earliestTimeStr: '',
      latestTimeStr: '',
      allowedDays: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'],
      blockedDays: [],
      maxCoursesPerDay: 3,
      maxTimeBetweenCourses: 0,
      noDuplicateCoursesPerDay: true,
      preventOverlaps: true,
      perDayTimeSlots: {},
      highlightSchedule: null,
      disablePairCourses: false,
      courseDurationMinutes: (appConfig?.courseDurationMinutes) || 70 // Default: 60min class + 10min break
    }

    return {
      constraints: savedConstraints ? { ...defaultConstraints, ...savedConstraints } : defaultConstraints,
      appConfig: appConfig // Also return the loaded config for other components to use
    }
  }

  // Synchronous version for immediate use (falls back to defaults)
  const loadStateFromCookiesSync = () => {
    const savedConstraints = getCookie('danceCoursePlannerConstraints')
    
    const defaultConstraints = {
      selectedLocation: 'Karlsruhe',
      selectedCourseNames: [],
      courseMultiplicity: {},
      earliestTimeStr: '',
      latestTimeStr: '',
      allowedDays: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'],
      blockedDays: [],
      maxCoursesPerDay: 3,
      maxTimeBetweenCourses: 0,
      noDuplicateCoursesPerDay: true,
      preventOverlaps: true,
      perDayTimeSlots: {},
      highlightSchedule: null,
      disablePairCourses: false,
      courseDurationMinutes: 70
    }

    return {
      constraints: savedConstraints ? { ...defaultConstraints, ...savedConstraints } : defaultConstraints
    }
  }

  // Save state to cookies
  const saveStateToCookies = (constraints) => {
    // Only save non-default values to keep cookies small
    const constraintsToSave = {}
    const defaults = {
      selectedLocation: 'Karlsruhe',
      selectedCourseNames: [],
      courseMultiplicity: {},
      earliestTimeStr: '',
      latestTimeStr: '',
      allowedDays: ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'],
      blockedDays: [],
      maxCoursesPerDay: 3,
      maxTimeBetweenCourses: 0,
      noDuplicateCoursesPerDay: true,
      preventOverlaps: true,
      disablePairCourses: false,
      courseDurationMinutes: 70
    }

    // Only save values that differ from defaults
    Object.keys(constraints).forEach(key => {
      if (key === 'highlightSchedule') return // Don't persist highlight state
      
      const value = constraints[key]
      const defaultValue = defaults[key]
      
      if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
        constraintsToSave[key] = value
      }
    })

    setCookie('danceCoursePlannerConstraints', constraintsToSave)
  }

  // Clear all saved state
  const clearSavedState = () => {
    deleteCookie('danceCoursePlannerConstraints')
  }

  return {
    loadStateFromCookies, // Async version with config loading
    loadStateFromCookiesSync, // Sync version with defaults
    saveStateToCookies,
    clearSavedState,
    setCookie,
    getCookie,
    deleteCookie
  }
}
