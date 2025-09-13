<template>
  <div 
    class="bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer"
    :class="{ 'ring-2 ring-green-500 bg-green-50 border-green-300': highlighted }"
    @click="handleScheduleClick"
  >
    <div class="bg-gray-50 px-4 py-3 border-b">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900">
          Schedule {{ index + 1 }}
        </h3>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-4 text-xs text-gray-600">
            <span>{{ schedule.totalCourses }} courses</span>
          </div>
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
      <div class="mb-4">
        <h4 class="text-xs font-medium text-gray-700 mb-2">Weekly Overview</h4>
        <div class="grid grid-cols-7 gap-1 text-xs">
          <!-- Day headers -->
          <div v-for="day in weekDays" :key="day" class="text-center font-medium text-gray-600 py-1">
            {{ day }}
          </div>
          <!-- Course slots -->
          <div v-for="day in weekDays" :key="'courses-' + day" class="border border-gray-200 rounded min-h-[90px] p-1">
            <template v-for="(course, index) in getCoursesForDay(day)" :key="course.id">
              <!-- Gap indicator before course (except first) -->
              <div v-if="index > 0 && hasSignificantGap(getCoursesForDay(day), index)" 
                   class="text-center text-xs text-gray-400 py-1 border-t border-dashed border-gray-300 my-1">
                {{ formatGap(getCoursesForDay(day)[index - 1], course) }}
              </div>
              <!-- Course card -->
              <div class="bg-primary-100 text-primary-800 rounded px-1 py-1 mb-1 text-xs leading-tight h-20 flex flex-col justify-center">
                <div class="font-medium text-center break-words">{{ course.name }}</div>
                <div class="text-xs opacity-75 text-center">{{ formatTime(course.startTime) }}</div>
              </div>
            </template>
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
              <span class="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white text-xs font-bold rounded-full">
                {{ course.day }}
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
          <span>⚠️ {{ averageGap }}h average gap between courses</span>
        </div>
      </div>

      <!-- Export Options -->
      <div class="mt-4 pt-3 border-t border-gray-200">
        <div class="flex justify-center space-x-2">
          <button
            @click="exportToCalendar"
            class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            📅 Export to Calendar
          </button>
          <button
            @click="printSchedule"
            class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
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

    const weekDays = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']

    const getCoursesForDay = (day) => {
      return props.schedule.courses
        .filter(course => course.day === day)
        .sort((a, b) => a.startTime - b.startTime)
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

    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
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
              <div class="time">${course.day} ${formatTime(course.startTime)} - ${formatTime(course.endTime)}</div>
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
      daysWithCourses,
      totalHours,
      averageGap,
      hasGaps,
      weekDays,
      getCoursesForDay,
      hasSignificantGap,
      formatGap,
      formatTime,
      handleShare,
      handleScheduleClick,
      exportToCalendar,
      printSchedule
    }
  }
}
</script>
