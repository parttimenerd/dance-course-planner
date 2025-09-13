<template>
  <div 
    class="bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer"
    :class="{ 'ring-2 ring-green-500 bg-green-50 border-green-300': highlighted }"
    @click="handleScheduleClick"
  >
    <div class="bg-gray-50 px-4 py-3 border-b">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900">
          {{ t('Schedule') }} {{ index + 1 }}
        </h3>
        <div class="flex items-center space-x-4">
          <ShareButton 
            type="schedule" 
            :config="config"
            :schedule="{ ...schedule, index }" 
            @share="handleShare"
          />
        </div>
      </div>
    </div>

    <div class="p-4">
      <!-- Weekly Schedule Grid -->
      <div class="mb-4 hidden md:block">
        <h4 class="text-xs font-medium text-gray-700 mb-2">{{ t('Weekly Overview') }}</h4>
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <!-- Day headers -->
          <div class="grid grid-cols-8 gap-0">
            <div class="bg-gray-100 text-gray-700 text-xs font-medium py-2 px-2 border-b border-r border-gray-200">
              {{ t('Time') }}
            </div>
            <div v-for="day in weekDays" :key="day" 
                 :class="[
                   'text-center font-medium py-2 px-2 border-b border-r border-gray-200 last:border-r-0',
                   dayHasCourses(day) ? [getDayColors(day).bg, getDayColors(day).text] : ['bg-gray-100', 'text-gray-400', 'opacity-50']
                 ]">
              {{ day }}
            </div>
          </div>
          <!-- Time slot rows -->
          <div v-for="timeSlot in allTimeSlots" :key="timeSlot" class="grid grid-cols-8 gap-0">
            <!-- Time label -->
            <div class="bg-gray-50 text-gray-600 text-xs py-2 px-2 border-b border-r border-gray-200 font-mono">
              {{ formatTime(timeSlot) }}
            </div>
            <!-- Course cells for each day -->
            <div v-for="day in weekDays" :key="`${timeSlot}-${day}`" 
                 :class="getTimeSlotCellClasses(day, timeSlot)">
              <template v-if="getCourseForDayAndTime(day, timeSlot)">
                <div class="bg-primary-100 text-primary-800 rounded m-1 px-1 py-1 text-xs leading-tight">
                  <div class="font-medium text-center break-words">
                    {{ getCourseForDayAndTime(day, timeSlot).name }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Course Details -->
      <div class="space-y-3">
        <div
          v-for="course in schedule.courses"
          :key="course.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <span :class="getDayBadgeClasses(course.day)">
                {{ translateDayCode(course.day) }}
              </span>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ course.name }}
                </p>
                <p class="text-xs text-gray-600">
                  {{ course.type }}
                  <span v-if="course.teacher" class="ml-2">• {{ course.teacher }}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900">
              {{ formatTime(course.startTime) }} - {{ formatTime(course.endTime) }}
            </p>
            <p v-if="course.room" class="text-xs text-gray-600">{{ course.room }}</p>
          </div>
        </div>
      </div>

      <!-- Gap Warning (only if gaps exist) -->
      <div v-if="hasGaps" class="mt-2 pt-2 border-t border-gray-200">
        <div class="flex items-center justify-center text-xs text-orange-600">
          <span>⚠️ {{ averageGap }}h {{ t('average gap between courses') }}</span>
        </div>
      </div>

      <!-- Export Options -->
      <div class="mt-4 pt-3 border-t border-gray-200">
        <div class="flex justify-center space-x-2">
          <button
            @click="exportToCalendar"
            class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            📅 {{ t('Export to Calendar') }}
          </button>
          <button
            @click="printSchedule"
            class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            🖨️ {{ t('Print') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import ShareButton from './ShareButton.vue'

export default {
  name: 'ScheduleSolution',
  components: {
    ShareButton
  },
  props: {
    schedule: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    config: {
      type: Object,
      required: true
    },
    highlighted: {
      type: Boolean,
      default: false
    }
  },
  emits: ['share', 'toggle-highlight'],
  setup(props, { emit }) {
    const { t, dayNames, formatTime, translateDayCode, getDayColors } = useI18n()
    
    const daysWithCourses = computed(() => {
      const days = new Set(props.schedule.courses.map(course => course.day))
      return Array.from(days).sort()
    })

    const totalHours = computed(() => {
      let total = 0
      for (const course of props.schedule.courses) {
        const duration = (course.endTime - course.startTime) / (1000 * 60 * 60)
        total += duration
      }
      return total.toFixed(1)
    })

    const averageGap = computed(() => {
      const coursesByDay = new Map()
      
      // Group courses by day
      for (const course of props.schedule.courses) {
        if (!coursesByDay.has(course.day)) {
          coursesByDay.set(course.day, [])
        }
        coursesByDay.get(course.day).push(course)
      }

      let totalGaps = 0
      let gapCount = 0

      // Calculate gaps for each day
      for (const [day, courses] of coursesByDay) {
        if (courses.length < 2) continue

        const sortedCourses = courses.sort((a, b) => a.startTime - b.startTime)
        
        for (let i = 1; i < sortedCourses.length; i++) {
          const gap = (sortedCourses[i].startTime - sortedCourses[i-1].endTime) / (1000 * 60 * 60)
          totalGaps += gap
          gapCount++
        }
      }

      return gapCount > 0 ? (totalGaps / gapCount).toFixed(1) : '0'
    })

    const hasGaps = computed(() => {
      return parseFloat(averageGap.value) > 0.2 // Only show warning for gaps > 0.2h (12 minutes)
    })

    const weekDays = computed(() => dayNames.value.map(day => day.short))

    // Get all unique time slots across all courses for the grid
    const allTimeSlots = computed(() => {
      const timeSlots = new Set()
      props.schedule.courses.forEach(course => {
        // Ensure we're working with Date objects
        const startTime = new Date(course.startTime)
        timeSlots.add(startTime.getTime())
      })
      return Array.from(timeSlots)
        .map(time => new Date(time))
        .sort((a, b) => a.getHours() - b.getHours() || a.getMinutes() - b.getMinutes())
    })

    const getCoursesForDay = (displayDayCode) => {
      // Convert display day code back to data day code for filtering
      // For German, displayDayCode is the same as data day code
      // For English, we need to map back: MON->MO, TUE->DI, etc.
      let dataDayCode = displayDayCode
      if (displayDayCode === 'MON') dataDayCode = 'MO'
      else if (displayDayCode === 'TUE') dataDayCode = 'DI'
      else if (displayDayCode === 'WED') dataDayCode = 'MI'
      else if (displayDayCode === 'THU') dataDayCode = 'DO'
      else if (displayDayCode === 'FRI') dataDayCode = 'FR'
      else if (displayDayCode === 'SAT') dataDayCode = 'SA'
      else if (displayDayCode === 'SUN') dataDayCode = 'SO'
      
      return props.schedule.courses
        .filter(course => course.day === dataDayCode)
        .sort((a, b) => a.startTime - b.startTime)
    }

    const dayHasCourses = (displayDayCode) => {
      return getCoursesForDay(displayDayCode).length > 0
    }

    const getDayBadgeClasses = (dayCode) => {
      const dayName = translateDayCode(dayCode)
      const colors = getDayColors(dayName)
      return `inline-flex items-center justify-center w-8 h-8 ${colors.bg} ${colors.text} text-xs font-bold rounded-full`
    }

    const getLocalDayColumnClasses = (day, coursesForDay) => {
      // Create column classes with day-specific colors and muted empty styling
      const colors = getDayColors(day)
      const hasContent = coursesForDay && coursesForDay.length > 0
      
      return [
        'border rounded-b min-h-[90px] p-1 border-t-0',
        colors.border,
        hasContent ? 'bg-white' : 'bg-gray-50 opacity-60'
      ].join(' ')
    }

    // Get course for a specific day and time slot
    const getCourseForDayAndTime = (displayDayCode, timeSlot) => {
      const coursesForDay = getCoursesForDay(displayDayCode)
      return coursesForDay.find(course => {
        return course.startTime.getTime() === timeSlot.getTime()
      })
    }

    // Get CSS classes for time slot cells
    const getTimeSlotCellClasses = (day, timeSlot) => {
      const colors = getDayColors(day)
      const hasCourse = getCourseForDayAndTime(day, timeSlot) !== undefined
      const dayHasAnyCourses = dayHasCourses(day)
      
      if (!dayHasAnyCourses) {
        // Entire day has no courses - make it really muted
        return [
          'min-h-[40px] py-1 px-1 border-b border-r border-gray-200 last:border-r-0',
          'bg-gray-100 text-gray-300 opacity-30 border-gray-300'
        ].join(' ')
      }
      
      return [
        'min-h-[40px] py-1 px-1 border-b border-r border-gray-200 last:border-r-0',
        colors.border,
        hasCourse ? 'bg-white' : 'bg-gray-50 opacity-60'
      ].join(' ')
    }

    const hasSignificantGap = (courses, index) => {
      if (index === 0) return false
      const prevCourse = courses[index - 1]
      const currentCourse = courses[index]
      const gapMinutes = (currentCourse.startTime - prevCourse.endTime) / (1000 * 60)
      return gapMinutes > 12 // Show gap if more than 12 minutes (0.2h)
    }

    const formatGap = (prevCourse, currentCourse) => {
      const gapMinutes = (currentCourse.startTime - prevCourse.endTime) / (1000 * 60)
      const hours = Math.floor(gapMinutes / 60)
      const minutes = Math.round(gapMinutes % 60)
      
      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m gap` : `${hours}h gap`
      }
      return `${minutes}m gap`
    }

    const handleShare = (shareData) => {
      emit('share', shareData)
    }

    const handleScheduleClick = () => {
      // Toggle highlighting - emit the schedule index to toggle
      emit('toggle-highlight', props.highlighted ? null : props.index)
    }

    const exportToCalendar = () => {
      // Generate ICS file
      const icsContent = generateICS()
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `dance-schedule-${props.index + 1}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    const generateICS = () => {
      const now = new Date()
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Dance Course Planner//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ]

      for (const course of props.schedule.courses) {
        const startDate = formatICSDate(course.startTime)
        const endDate = formatICSDate(course.endTime)
        
        lines.push(
          'BEGIN:VEVENT',
          `UID:${course.id}@dance-course-planner`,
          `DTSTART:${startDate}`,
          `DTEND:${endDate}`,
          `SUMMARY:${course.name}`,
          `DESCRIPTION:${course.type} - ${course.level}\\nTeacher: ${course.teacher}`,
          `LOCATION:${course.location} ${course.room ? '- ' + course.room : ''}`,
          'END:VEVENT'
        )
      }

      lines.push('END:VCALENDAR')
      return lines.join('\r\n')
    }

    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const printSchedule = () => {
      // Create a print-friendly version
      const printWindow = window.open('', '_blank')
      const printContent = generatePrintHTML()
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }

    const generatePrintHTML = () => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dance Schedule ${props.index + 1}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .course { margin: 10px 0; padding: 10px; border-left: 4px solid #4F46E5; }
            .time { font-weight: bold; }
            .details { color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>Dance Schedule ${props.index + 1}</h1>
          <p>Total: ${props.schedule.totalCourses} courses • ${totalHours.value} hours • ${daysWithCourses.value.length} days</p>
          ${props.schedule.courses.map(course => `
            <div class="course">
              <div class="time">${translateDayCode(course.day)} ${formatTime(course.startTime)} - ${formatTime(course.endTime)}</div>
              <div><strong>${course.name}</strong> ${course.level ? '(' + course.level + ')' : ''}</div>
              <div class="details">${course.type} • ${course.location} ${course.room ? '- ' + course.room : ''}</div>
              ${course.teacher ? `<div class="details">Teacher: ${course.teacher}</div>` : ''}
            </div>
          `).join('')}
        </body>
        </html>
      `
    }

    return {
      t,
      daysWithCourses,
      totalHours,
      averageGap,
      hasGaps,
      weekDays,
      allTimeSlots,
      getCoursesForDay,
      dayHasCourses,
      getDayBadgeClasses,
      getLocalDayColumnClasses,
      getCourseForDayAndTime,
      getTimeSlotCellClasses,
      getDayColors,
      hasSignificantGap,
      formatGap,
      formatTime,
      translateDayCode,
      handleShare,
      handleScheduleClick,
      exportToCalendar,
      printSchedule
    }
  }
}
</script>
