import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'dance-course-planner-saved-solutions'
const VISIBILITY_COOKIE_KEY = 'dance-course-planner-saved-section-visible'

// Global reactive state for saved solutions
const savedSolutions = ref([])
const isSavedSectionVisible = ref(true)

// Helper functions for cookie management
const setCookie = (name, value, days = 365) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const getCookie = (name) => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

// Utility: stable fingerprint of a schedule's content (course identity + time)
const toMinutes = (d) => {
  try {
    const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d
    return date.getHours() * 60 + date.getMinutes()
  } catch {
    return 0
  }
}

const fingerprintSchedule = (schedule) => {
  if (!schedule || !Array.isArray(schedule.courses)) return 'empty'
  const items = schedule.courses.map((c) => {
    // Prefer stable identifiers when available
    const id = c.id ?? c.name ?? 'unknown'
    // Support both slot (minutes) and Date-based startTime
    const day = c.day ?? (c.timeSlots && c.timeSlots[0] && c.timeSlots[0].day) ?? 'NA'
    const slot = (typeof c.slot === 'number')
      ? c.slot
      : (c.startTime ? toMinutes(c.startTime) : (c.timeSlots && c.timeSlots[0] ? (c.timeSlots[0].hour * 60 + (c.timeSlots[0].minute || 0)) : 0))
    return `${id}|${day}|${slot}`
  })
  items.sort()
  return items.join('||')
}

// Load saved solutions from localStorage on module import
const loadSavedSolutions = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      // Backward compatibility: normalize to new shape if needed
      savedSolutions.value = (data.solutions || []).map((s) => {
        if (s.savedId && s.fingerprint) return s
        const schedule = s.schedule || s
        return {
          savedId: `migrated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          savedAt: s.savedAt || new Date().toISOString(),
          fingerprint: fingerprintSchedule(schedule),
          schedule
        }
      })
    }
    
    // Load visibility state from cookie
    const visibilityCookie = getCookie(VISIBILITY_COOKIE_KEY)
    if (visibilityCookie !== null) {
      isSavedSectionVisible.value = visibilityCookie === 'true'
    }
  } catch (error) {
    console.error('Failed to load saved solutions:', error)
    savedSolutions.value = []
  }
}

// Save solutions to localStorage
const saveSolutionsToStorage = () => {
  try {
    const data = {
      solutions: savedSolutions.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save solutions to localStorage:', error)
  }
}

// Save visibility state to cookie
const saveVisibilityToCookie = () => {
  setCookie(VISIBILITY_COOKIE_KEY, isSavedSectionVisible.value.toString())
}

// Initialize from localStorage and cookies
loadSavedSolutions()

// Watch for changes and auto-save
watch(savedSolutions, saveSolutionsToStorage, { deep: true })
watch(isSavedSectionVisible, saveVisibilityToCookie)

export function useSavedSolutions() {
  // Check if a solution is saved (by content, not by transient id)
  const isSolutionSaved = (schedule) => {
    const fp = fingerprintSchedule(schedule)
    return savedSolutions.value.some(saved => saved.fingerprint === fp)
  }

  // Save a solution as an immutable snapshot
  const saveSolution = (schedule, metadata = {}) => {
    // Don't save if already saved
    if (isSolutionSaved(schedule)) return

    // Create deep-cloned snapshot to decouple from live UI state
    const snapshot = JSON.parse(JSON.stringify(schedule))

    const savedEntry = {
      savedId: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
      fingerprint: fingerprintSchedule(snapshot),
      // Optional metadata: constraints snapshot, app version, etc.
      ...('constraintsSnapshot' in metadata ? { constraintsSnapshot: metadata.constraintsSnapshot } : {}),
      schedule: snapshot
    }

    savedSolutions.value.unshift(savedEntry)
    
    // Limit to 10 saved solutions
    if (savedSolutions.value.length > 10) {
      savedSolutions.value = savedSolutions.value.slice(0, 10)
    }
  }

  // Remove a saved solution
  const removeSavedSolution = (scheduleOrSaved) => {
    // Allow removing by passing either a live schedule or a saved entry
    const fp = scheduleOrSaved && scheduleOrSaved.fingerprint
      ? scheduleOrSaved.fingerprint
      : fingerprintSchedule(scheduleOrSaved)
    
    savedSolutions.value = savedSolutions.value.filter(saved => saved.fingerprint !== fp)
  }

  // Toggle a solution's saved state
  const toggleSavedSolution = (schedule) => {
    if (isSolutionSaved(schedule)) {
      removeSavedSolution(schedule)
    } else {
      saveSolution(schedule)
    }
  }

  // Clear all saved solutions
  const clearAllSavedSolutions = () => {
    savedSolutions.value = []
  }

  // Toggle saved section visibility
  const toggleSavedSectionVisibility = () => {
    isSavedSectionVisible.value = !isSavedSectionVisible.value
  }

  // Computed properties
  const hasSavedSolutions = computed(() => savedSolutions.value.length > 0)
  
  const savedSchedules = computed(() => 
    savedSolutions.value.map(saved => saved.schedule)
  )

  return {
    // State
    savedSolutions,
    savedSchedules,
    hasSavedSolutions,
    isSavedSectionVisible,
    
    // Methods
    isSolutionSaved,
    saveSolution,
    removeSavedSolution,
    toggleSavedSolution,
    clearAllSavedSolutions,
    toggleSavedSectionVisibility
  }
}
