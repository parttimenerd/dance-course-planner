import { ref, computed } from 'vue'

export function useScheduleData() {
  const scheduleData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const loadScheduleData = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await fetch('/schedule.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      scheduleData.value = data
      
      return data
    } catch (err) {
      console.error('Failed to load schedule data:', err)
      error.value = 'Failed to load schedule data. Make sure schedule.json exists and is accessible.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const totalCourses = computed(() => {
    if (!scheduleData.value?.content?.days) return 0
    
    let count = 0
    for (const day of scheduleData.value.content.days) {
      for (const event of day.events || []) {
        if (event.type === 'course') {
          count++
        }
      }
    }
    return count
  })

  const getFilteredCourses = (selectedLocation) => {
    if (!scheduleData.value?.content?.days) return []
    
    const courses = []
    for (const day of scheduleData.value.content.days) {
      for (const event of day.events || []) {
        if (event.type === 'course') {
          if (!selectedLocation || event.location === selectedLocation) {
            courses.push({
              id: event.id,
              name: event.displayName,
              day: day.dayShort,
              dayLong: day.dayLong,
              startTime: new Date(parseInt(event.start) * 1000),
              endTime: new Date(parseInt(event.end) * 1000),
              location: event.location,
              room: event.room,
              teacher: event.teacherNames?.join(', ') || '',
              type: event.typeName,
              level: event.levelName,
              attendance: event.attendanceStatus
            })
          }
        }
      }
    }
    
    return courses
  }

  return {
    scheduleData,
    loading,
    error,
    totalCourses,
    loadScheduleData,
    getFilteredCourses
  }
}
