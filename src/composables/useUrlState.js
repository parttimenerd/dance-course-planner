import { ref, watch } from 'vue'

export function useUrlState() {
  const urlParams = ref(new URLSearchParams(window.location.search))

  const updateUrl = (params) => {
    const newUrl = new URL(window.location)
    newUrl.search = params.toString()
    window.history.replaceState({}, '', newUrl)
  }

  const loadFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    const config = {}

    // Parse URL parameters
    if (params.has('location')) {
      config.selectedLocation = params.get('location')
    }

    if (params.has('courses')) {
      const courseNames = params.get('courses').split(',').filter(Boolean)
      config.selectedCourseNames = courseNames
    }

    if (params.has('earliest')) {
      config.earliestTimeStr = params.get('earliest')
    }

    if (params.has('latest')) {
      config.latestTimeStr = params.get('latest')
    }

    if (params.has('days')) {
      config.allowedDays = params.get('days').split(',').filter(Boolean)
    }

    if (params.has('blocked')) {
      config.blockedDays = params.get('blocked').split(',').filter(Boolean)
    }

    if (params.has('maxPerDay')) {
      config.maxCoursesPerDay = parseInt(params.get('maxPerDay')) || 3
    }

    if (params.has('maxGap')) {
      config.maxTimeBetweenCourses = parseFloat(params.get('maxGap')) || 4
    }

    if (params.has('noDupe')) {
      config.noDuplicateCoursesPerDay = params.get('noDupe') === 'true'
    }

    if (params.has('noOverlap')) {
      config.preventOverlaps = params.get('noOverlap') === 'true'
    }

    // Parse per-day time slots
    if (params.has('timeSlots')) {
      try {
        config.perDayTimeSlots = JSON.parse(decodeURIComponent(params.get('timeSlots')))
      } catch (e) {
        console.warn('Failed to parse timeSlots from URL:', e)
      }
    }

    // Parse selected time slots
    if (params.has('selectedSlots')) {
      config.selectedTimeSlots = params.get('selectedSlots').split(',').filter(Boolean)
    }

    if (params.has('highlightSchedule')) {
      config.highlightSchedule = parseInt(params.get('highlightSchedule'))
    }

    return config
  }

  const saveToUrl = (config, schedule = null) => {
    const params = new URLSearchParams()

    // Save configuration
    if (config.selectedLocation) {
      params.set('location', config.selectedLocation)
    }

    if (config.selectedCourseNames && config.selectedCourseNames.length > 0) {
      params.set('courses', config.selectedCourseNames.join(','))
    }

    if (config.earliestTimeStr) {
      params.set('earliest', config.earliestTimeStr)
    }

    if (config.latestTimeStr) {
      params.set('latest', config.latestTimeStr)
    }

    if (config.allowedDays && config.allowedDays.length > 0 && config.allowedDays.length < 7) {
      params.set('days', config.allowedDays.join(','))
    }

    if (config.blockedDays && config.blockedDays.length > 0) {
      params.set('blocked', config.blockedDays.join(','))
    }

    if (config.maxCoursesPerDay && config.maxCoursesPerDay !== 3) {
      params.set('maxPerDay', config.maxCoursesPerDay.toString())
    }

    if (config.maxTimeBetweenCourses && config.maxTimeBetweenCourses !== 4) {
      params.set('maxGap', config.maxTimeBetweenCourses.toString())
    }

    if (config.noDuplicateCoursesPerDay) {
      params.set('noDupe', 'true')
    }

    if (config.preventOverlaps) {
      params.set('noOverlap', 'true')
    }

    // Save per-day time slots
    if (config.perDayTimeSlots && Object.keys(config.perDayTimeSlots).length > 0) {
      params.set('timeSlots', encodeURIComponent(JSON.stringify(config.perDayTimeSlots)))
    }

    // Save selected time slots
    if (config.selectedTimeSlots && config.selectedTimeSlots.length > 0) {
      params.set('selectedSlots', config.selectedTimeSlots.join(','))
    }

    // Save specific schedule if provided
    if (schedule) {
      const courseIds = schedule.courses.map(c => c.id).join(',')
      params.set('schedule', courseIds)
      // Also set which schedule index to highlight
      if (schedule.index !== undefined) {
        params.set('highlightSchedule', schedule.index.toString())
      }
    }

    updateUrl(params)
    urlParams.value = params
  }

  const generateShareUrl = (config, schedule = null) => {
    const params = new URLSearchParams()
    
    // Same logic as saveToUrl but return full URL
    if (config.selectedLocation) {
      params.set('location', config.selectedLocation)
    }

    if (config.selectedCourseNames && config.selectedCourseNames.length > 0) {
      params.set('courses', config.selectedCourseNames.join(','))
    }

    if (config.earliestTimeStr) {
      params.set('earliest', config.earliestTimeStr)
    }

    if (config.latestTimeStr) {
      params.set('latest', config.latestTimeStr)
    }

    if (config.allowedDays && config.allowedDays.length > 0 && config.allowedDays.length < 7) {
      params.set('days', config.allowedDays.join(','))
    }

    if (config.blockedDays && config.blockedDays.length > 0) {
      params.set('blocked', config.blockedDays.join(','))
    }

    if (config.maxCoursesPerDay && config.maxCoursesPerDay !== 3) {
      params.set('maxPerDay', config.maxCoursesPerDay.toString())
    }

    if (config.maxTimeBetweenCourses && config.maxTimeBetweenCourses !== 4) {
      params.set('maxGap', config.maxTimeBetweenCourses.toString())
    }

    if (config.noDuplicateCoursesPerDay) {
      params.set('noDupe', 'true')
    }

    if (config.preventOverlaps) {
      params.set('noOverlap', 'true')
    }

    // Save per-day time slots
    if (config.perDayTimeSlots && Object.keys(config.perDayTimeSlots).length > 0) {
      params.set('timeSlots', encodeURIComponent(JSON.stringify(config.perDayTimeSlots)))
    }

    // Save selected time slots
    if (config.selectedTimeSlots && config.selectedTimeSlots.length > 0) {
      params.set('selectedSlots', config.selectedTimeSlots.join(','))
    }

    if (schedule) {
      const courseIds = schedule.courses.map(c => c.id).join(',')
      params.set('schedule', courseIds)
      if (schedule.index !== undefined) {
        params.set('highlightSchedule', schedule.index.toString())
      }
    }

    const url = new URL(window.location)
    url.search = params.toString()
    return url.toString()
  }

  const clearUrl = () => {
    const url = new URL(window.location)
    url.search = ''
    window.history.replaceState({}, '', url)
    urlParams.value = new URLSearchParams()
  }

  // Watch for browser back/forward navigation
  const handlePopState = () => {
    urlParams.value = new URLSearchParams(window.location.search)
  }

  window.addEventListener('popstate', handlePopState)

  return {
    urlParams,
    loadFromUrl,
    saveToUrl,
    generateShareUrl,
    clearUrl,
    updateUrl
  }
}
