<template>
  <div 
    class="bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer"
    :class="{ 'ring-2 ring-green-500 bg-green-50': highlighted }"
    @click="handleScheduleClick"
  >
    <div class="bg-gray-50 px-4 py-3 border-b">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900">
          {{ t('Schedule') }} {{ index + 1 }}
        </h3>
        <div class="flex items-center space-x-2">
          <!-- Star Button for Saving -->
          <button
            @click.stop="handleToggleSaved"
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
              isSaved ? 
                'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 
                'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-yellow-500'
            ]"
            :title="isSaved ? t('Remove from saved') : t('Save schedule')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" :fill="isSaved ? 'currentColor' : 'none'" :stroke="isSaved ? 'none' : 'currentColor'" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          
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
          <div class="grid gap-0" style="grid-template-columns: 60px repeat(7, 1fr);">
            <div class="bg-gray-100 text-gray-700 text-xs font-medium py-2 px-1 border-b border-r border-gray-200">
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
          <div v-for="timeSlot in allTimeSlots" :key="timeSlot" class="grid gap-0" style="grid-template-columns: 60px repeat(7, 1fr);">
            <!-- Time label -->
            <div class="bg-gray-50 text-gray-600 text-xs py-2 px-1 border-b border-r border-gray-200 font-mono">
              {{ formatTime(timeSlot) }}
            </div>
            <!-- Course cells for each day -->
            <div v-for="day in weekDays" :key="`${timeSlot}-${day}`" 
                 :class="getTimeSlotCellClasses(day, timeSlot)">
              <!-- Show course if there's one at this time -->
              <template v-if="getCourseForDayAndTime(day, timeSlot)">
                <div class="bg-primary-100 text-primary-800 rounded m-1 px-1 py-1 text-xs leading-tight w-full overflow-hidden">
                  <div class="font-medium text-center break-words overflow-hidden text-ellipsis">
                    {{ getCourseForDayAndTime(day, timeSlot).name }}<PairIcon :show="!!safeIsPairOnlyCourse(getCourseForDayAndTime(day, timeSlot).id)" />
                  </div>
                </div>
              </template>
              <!-- Show gap slot if this is a gap between courses -->
              <template v-else-if="isGapSlot(day, timeSlot)">
                <div class="bg-yellow-50 border border-yellow-200 rounded m-1 px-1 py-1 text-xs leading-tight w-full overflow-hidden">
                  <div class="font-medium text-center text-yellow-700 overflow-hidden text-ellipsis">
                    ⏰ {{ t('Free Time') }}
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
                <p class="text-sm font-medium text-gray-900 break-words">
                  {{ course.name }}<PairIcon :show="!!safeIsPairOnlyCourse(course.id)" custom-class="ml-2" />
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
            
            <!-- Registration Button (only show if logged into Nimbuscloud) -->
            <div v-if="nimbusIsLoggedIn && hasValidCustomerId" class="mt-2">
              <RegistrationButton
                :course-id="course.id"
                :date-id="course.id"
                :course-date="course.startTime"
                :course-name="course.name"
                :is-registered="isRegisteredForCourse(course.id, course.id)"
                :in-progress="isRegistrationInProgress(course.id, course.id)"
                :availability-info="getAvailabilityInfo(course)"
                @register="handleRegister"
                @unregister="handleUnregister"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Gap Warning (only if gaps exist) -->
      <div v-if="hasGaps" class="mt-2 pt-2 border-t border-gray-200">
        <div class="flex items-center justify-center text-xs text-orange-600">
          <span>⚠️ {{ averageGap }}h {{ t('average gap between courses') }}</span>
        </div>
      </div>

      <!-- Export and Registration Options -->
      <div class="mt-4 pt-3 border-t border-gray-200">
        <div class="flex flex-wrap justify-center gap-2">
          <!-- Export Options -->
          <button
            @click="exportToCalendar"
            class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            📅 {{ t('Export to Calendar') }}
          </button>

          <!-- Registration Options (only if logged into Nimbuscloud) -->
          <template v-if="nimbusIsLoggedIn && hasValidCustomerId">
            <button
              @click="registerToAllCourses"
              :disabled="isBulkRegistering || !hasUnregisteredCourses"
              class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isBulkRegistering">{{ t('Registering to all courses...') }}</span>
              <span v-else>✅ {{ t('Register to All Courses') }}</span>
            </button>
            <button
              @click="unregisterFromAllCourses"
              :disabled="isBulkRegistering || !hasRegisteredCourses"
              class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isBulkRegistering">{{ t('Unregistering from all courses...') }}</span>
              <span v-else>❌ {{ t('Unregister All') }}</span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useNimbuscloud } from '../composables/useNimbuscloud.js'
import { useSavedSolutions } from '../composables/useSavedSolutions.js'
import ShareButton from './ShareButton.vue'
import RegistrationButton from './RegistrationButton.vue'
import PairIcon from './PairIcon.vue'
import { isWithinRegistrationWindow } from '../utils/dateUtils.js'

export default {
  name: 'ScheduleSolution',
  components: {
    ShareButton,
    RegistrationButton,
    PairIcon
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
    },
    courseDurationMinutes: {
      type: Number,
      default: 70 // Default: 60min class + 10min break
    }
  },
  emits: ['share', 'toggle-highlight'],
  setup(props, { emit }) {
    const { t, dayNames, formatTime, translateDayCode, getDayColors } = useI18n()
    const { 
      isLoggedIn: nimbusIsLoggedIn,
      registerForCourse,
      unregisterFromCourse,
      isRegisteredForCourse,
      isRegistrationInProgress,
      isPairOnlyCourse,
      fetchSchedule,
      selectedWeek,
      hasValidCustomerId
    } = useNimbuscloud()
    
    const { 
      isSolutionSaved, 
      toggleSavedSolution 
    } = useSavedSolutions()
    
    // Log the schedule structure for debugging
    // (Removed verbose logging)
    
    // Bulk registration state
    const isBulkRegistering = ref(false)
    
    // Check if this schedule is saved
    const isSaved = computed(() => isSolutionSaved(props.schedule))
    
    // Safe pair course checker with fallback
    const safeIsPairOnlyCourse = computed(() => {
      return (courseId) => {
        try {
          // First, try to find the course in our schedule and check its pairOnly property
          const course = props.schedule.courses.find(c => c.id === courseId)
          if (course) {
            // Check multiple possible property names for pair courses
            const isPair = !!(course.pairOnly || 
                          course.isPairOnly || 
                          course.pair_only ||
                          course.requiresPartner ||
                          course.type === 'pair' ||
                          course.courseType === 'pair' ||
                          (course.name && course.name.toLowerCase().includes('pair')))
            
            return isPair
          }
          
          // Fallback to nimbus cloud function if course not found in schedule
          if (typeof isPairOnlyCourse === 'function') {
            return !!(isPairOnlyCourse(courseId))
          }
          
          return false
        } catch (error) {
          console.warn('Error checking pair course status:', error)
          return false
        }
      }
    })
    
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

    // Check if there are unregistered courses in this schedule (within registration window)
    const hasUnregisteredCourses = computed(() => {
      return props.schedule.courses.some(course => 
        isWithinRegistrationWindow(course.startTime) && !isRegisteredForCourse(course.id, course.id)
      )
    })

    // Check if there are registered courses in this schedule (within registration window)
    const hasRegisteredCourses = computed(() => {
      return props.schedule.courses.some(course => 
        isWithinRegistrationWindow(course.startTime) && isRegisteredForCourse(course.id, course.id)
      )
    })

    const weekDays = computed(() => dayNames.value.map(day => day.short))

    // Get all unique time slots including gaps between courses
    const allTimeSlots = computed(() => {
      console.log('🔍 [GAP SLOTS] Computing allTimeSlots for schedule:', {
        scheduleIndex: props.index,
        totalCourses: props.schedule.courses.length,
        courseTimes: props.schedule.courses.map(c => ({
          name: c.name.substring(0, 20) + '...',
          day: c.day,
          start: new Date(c.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          end: new Date(c.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        }))
      })
      
      const timeSlots = new Set()
      
      // Get all course start times first
      props.schedule.courses.forEach(course => {
        const startTime = new Date(course.startTime)
        const startTimeKey = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`
        timeSlots.add(startTimeKey)
      })
      
      // Find the earliest and latest time slots for any day
      const timeSlotsByDay = new Map()
      props.schedule.courses.forEach(course => {
        if (!timeSlotsByDay.has(course.day)) {
          timeSlotsByDay.set(course.day, [])
        }
        timeSlotsByDay.get(course.day).push(new Date(course.startTime))
      })
      
      // For each day, add all time slots between first and last
      for (const [day, dayTimes] of timeSlotsByDay) {
        const sortedTimes = dayTimes.sort((a, b) => a - b)
        const firstTime = sortedTimes[0]
        const lastTime = sortedTimes[sortedTimes.length - 1]
        
        // Find all course start times from the entire schedule that fall between first and last for this day
        props.schedule.courses.forEach(course => {
          const courseStart = new Date(course.startTime)
          if (courseStart >= firstTime && courseStart <= lastTime) {
            const timeKey = `${courseStart.getHours().toString().padStart(2, '0')}:${courseStart.getMinutes().toString().padStart(2, '0')}`
            timeSlots.add(timeKey)
          }
        })
      }
      
      console.log('🔍 [GAP SLOTS] All time slots (course start times only):', Array.from(timeSlots).sort())
      
      // Convert to sorted array of Date objects
      const sortedSlots = Array.from(timeSlots)
        .map(timeKey => {
          const [hours, minutes] = timeKey.split(':').map(Number)
          // Create a consistent base date for all time slots (just for display)
          const date = new Date(2023, 0, 1, hours, minutes)
          return date
        })
        .sort((a, b) => a.getHours() - b.getHours() || a.getMinutes() - b.getMinutes())
      
      console.log('🔍 [GAP SLOTS] Final sorted slots:', sortedSlots.map(slot => 
        slot.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      ))
      
      return sortedSlots
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
      
      const coursesForDay = props.schedule.courses
        .filter(course => course.day === dataDayCode)
        .sort((a, b) => a.startTime - b.startTime)
      
      return coursesForDay
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
        const courseStartTime = new Date(course.startTime)
        
        // Only match if the time slot exactly matches the course start time
        return courseStartTime.getHours() === timeSlot.getHours() &&
               courseStartTime.getMinutes() === timeSlot.getMinutes()
      })
    }

    // Check if a time slot is a gap slot (between two courses)
    const isGapSlot = (displayDayCode, timeSlot) => {
      const coursesForDay = getCoursesForDay(displayDayCode)
      if (coursesForDay.length < 2) return false
      
      const sortedCourses = coursesForDay.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      
      // Check if this time slot falls between two courses and represents an existing slot
      for (let i = 0; i < sortedCourses.length - 1; i++) {
        const currentEnd = new Date(sortedCourses[i].endTime)
        const nextStart = new Date(sortedCourses[i + 1].startTime)
        
        // Check if timeSlot falls between current course end and next course start
        if (timeSlot > currentEnd && timeSlot < nextStart) {
          // Only show as gap slot if this timeSlot corresponds to an existing course start time
          // from the entire schedule (i.e., it's a valid slot that could be scheduled)
          const isExistingSlot = props.schedule.courses.some(course => {
            const courseStart = new Date(course.startTime)
            return courseStart.getHours() === timeSlot.getHours() &&
                   courseStart.getMinutes() === timeSlot.getMinutes()
          })
          
          // It's a gap slot only if it's an existing course slot that fits in the gap
          return isExistingSlot
        }
      }
      return false
    }

    // Get CSS classes for time slot cells
    const getTimeSlotCellClasses = (day, timeSlot) => {
      const colors = getDayColors(day)
      const hasCourse = getCourseForDayAndTime(day, timeSlot) !== undefined
      const dayHasAnyCourses = dayHasCourses(day)
      
      // Base classes that ensure consistent cell sizing with explicit width constraints
      // Use flex-shrink-0 and explicit width to prevent content from affecting cell size
      const baseClasses = 'min-h-[40px] py-1 px-1 border-b border-r border-gray-200 last:border-r-0 flex-shrink-0 w-full overflow-hidden'
      
      if (!dayHasAnyCourses) {
        // Entire day has no courses - make it really muted but keep same size
        return `${baseClasses} bg-gray-100 text-gray-300 opacity-30 border-gray-300`
      }
      
      // Apply day-specific colors but maintain consistent sizing
      return `${baseClasses} ${colors.border} ${hasCourse ? 'bg-white' : 'bg-gray-50 opacity-60'}`
    }

    const hasSignificantGap = (courses, index) => {
      if (index === 0) return false
      const prevCourse = courses[index - 1]
      const currentCourse = courses[index]
      
      // Calculate gap between end of previous course and start of current course
      const prevCourseEnd = new Date(prevCourse.startTime).getTime() + (props.courseDurationMinutes * 60 * 1000)
      const currentCourseStart = new Date(currentCourse.startTime).getTime()
      const gapMinutes = (currentCourseStart - prevCourseEnd) / (1000 * 60)
      
      // Only show gap if it's at least one slot duration (significant gap)
      return gapMinutes >= props.courseDurationMinutes
    }

    const formatGap = (prevCourse, currentCourse) => {
      // Calculate gap between end of previous course and start of current course
      const prevCourseEnd = new Date(prevCourse.startTime).getTime() + (props.courseDurationMinutes * 60 * 1000)
      const currentCourseStart = new Date(currentCourse.startTime).getTime()
      const gapMinutes = (currentCourseStart - prevCourseEnd) / (1000 * 60)
      
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

    const handleToggleSaved = () => {
      toggleSavedSolution(props.schedule)
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

    // Registration handlers
    const handleRegister = async ({ courseId, dateId }) => {
      try {
        await registerForCourse(courseId, dateId)
        // Registration successful
      } catch (error) {
        console.error('Registration failed:', error)
        // Could emit an error event or show notification here
      }
    }

    const handleUnregister = async ({ courseId, dateId }) => {
      try {
        await unregisterFromCourse(courseId, dateId)
        // Unregistration successful
      } catch (error) {
        console.error('Unregistration failed:', error)
        // Could emit an error event or show notification here
      }
    }

    // Bulk registration functions
    const registerToAllCourses = async () => {
      if (isBulkRegistering.value) return
      
      isBulkRegistering.value = true
      try {
        // Only register for courses that aren't already registered AND are within registration window
        const unregisteredCourses = props.schedule.courses.filter(course => 
          isWithinRegistrationWindow(course.startTime) && !isRegisteredForCourse(course.id, course.id)
        )
        
        console.log(`Registering for ${unregisteredCourses.length} unregistered courses (within 6-day window)`)
        
        // Register for each unregistered course
        for (const course of unregisteredCourses) {
          try {
            await registerForCourse(course.id, course.id)
            console.log(`Successfully registered for ${course.name}`)
          } catch (error) {
            console.error(`Failed to register for ${course.name}:`, error)
            // Continue with other courses even if one fails
          }
        }
      } catch (error) {
        console.error('Bulk registration failed:', error)
      } finally {
        isBulkRegistering.value = false
      }
    }

    const unregisterFromAllCourses = async () => {
      if (isBulkRegistering.value) return
      
      isBulkRegistering.value = true
      try {
        // Only unregister from courses that are already registered AND are within registration window
        const registeredCourses = props.schedule.courses.filter(course => 
          isWithinRegistrationWindow(course.startTime) && isRegisteredForCourse(course.id, course.id)
        )
        
        console.log(`Unregistering from ${registeredCourses.length} registered courses (within 6-day window)`)
        
        // Unregister from each registered course
        for (const course of registeredCourses) {
          try {
            await unregisterFromCourse(course.id, course.id)
            console.log(`Successfully unregistered from ${course.name}`)
          } catch (error) {
            console.error(`Failed to unregister from ${course.name}:`, error)
            // Continue with other courses even if one fails
          }
        }
      } catch (error) {
        console.error('Bulk unregistration failed:', error)
      } finally {
        isBulkRegistering.value = false
      }
    }

    // Get availability info for registration button
    const getAvailabilityInfo = (course) => {
      // Check if this is a pair course
      const isPairCourse = isPairOnlyCourse(course.id) || course.pairOnly
      
      // For pair courses, show pair indicator instead of availability numbers
      if (isPairCourse) {
        return {
          isPairCourse: true,
          showPairIndicator: true
        }
      }
      
      // Don't show availability info - return null
      return null
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
      isGapSlot,
      getTimeSlotCellClasses,
      getDayColors,
      hasSignificantGap,
      formatGap,
      formatTime,
      translateDayCode,
      handleShare,
      handleScheduleClick,
      handleToggleSaved,
      // Saved solutions
      isSaved,
      // Pair course checking
      safeIsPairOnlyCourse,
      // Registration functions
      nimbusIsLoggedIn,
      isRegisteredForCourse,
      isRegistrationInProgress,
      handleRegister,
      handleUnregister,
      getAvailabilityInfo,
      // Bulk registration
      isBulkRegistering,
      hasUnregisteredCourses,
      hasRegisteredCourses,
      registerToAllCourses,
      unregisterFromAllCourses,
      exportToCalendar,
      // Expose for template conditions
      hasValidCustomerId
    }
  }
}
</script>
