/**
 * Date utilities for the dance course planner
 */

/**
 * Check if a date is within the registration window (next 6 days from current date)
 * @param {string|Date|number} courseDate - The course date (can be Date object, ISO string, or timestamp)
 * @returns {boolean} True if the course is within the registration window
 */
export function isWithinRegistrationWindow(courseDate) {
  if (!courseDate) {
    console.warn('[dateUtils] No course date provided to isWithinRegistrationWindow')
    return false
  }

  try {
    // Convert to Date object
    let date
    if (courseDate instanceof Date) {
      date = courseDate
    } else if (typeof courseDate === 'string') {
      // Handle both timestamp strings and ISO date strings
      const parsed = parseInt(courseDate)
      if (!isNaN(parsed) && parsed.toString() === courseDate) {
        // It's a timestamp string
        date = new Date(parsed * 1000) // Convert Unix timestamp to milliseconds
      } else {
        // It's an ISO date string
        date = new Date(courseDate)
      }
    } else if (typeof courseDate === 'number') {
      // Unix timestamp in seconds
      date = new Date(courseDate * 1000)
    } else {
      console.warn('[dateUtils] Invalid course date format:', courseDate)
      return false
    }

    if (isNaN(date.getTime())) {
      console.warn('[dateUtils] Invalid course date:', courseDate)
      return false
    }

    // Get current date at start of day (00:00:00)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Get course date at start of day
    const courseDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Calculate 6 days from today (end of the registration window)
    const sixDaysFromNow = new Date(today)
    sixDaysFromNow.setDate(today.getDate() + 6)
    
    // Course must be today or in the future, and within 6 days
    const isWithinWindow = courseDay >= today && courseDay <= sixDaysFromNow
    
    console.log('[dateUtils] Registration window check:', {
      courseDate: courseDate,
      parsedDate: date.toISOString(),
      courseDay: courseDay.toDateString(),
      today: today.toDateString(),
      sixDaysFromNow: sixDaysFromNow.toDateString(),
      isWithinWindow
    })
    
    return isWithinWindow
  } catch (error) {
    console.error('[dateUtils] Error checking registration window:', error, { courseDate })
    return false
  }
}

/**
 * Get a human-readable description of the registration window restriction
 * @returns {string} Description text for UI
 */
export function getRegistrationWindowDescription() {
  return 'Registration is only available for courses within the next 6 days to prevent accidental future registrations'
}

/**
 * Format a date for display in the registration window warning
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateForWarning(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  })
}
