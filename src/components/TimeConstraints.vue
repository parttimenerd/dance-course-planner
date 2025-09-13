<template>
  <div class="mb-6">
    <h3 class="text-sm font-medium text-gray-700 mb-3">⏰ {{ t('Time Constraints') }}</h3>
    


    <!-- Gap Settings -->
    <div class="mb-6">
      <label class="block text-xs text-gray-600 mb-1">
        {{ t('Maximum empty slots between courses') }}
      </label>
      <div class="flex gap-1">
        <button
          v-for="slots in [0, 1, 2]"
          :key="slots"
          @click="updateMaxGapSlots(slots)"
          :class="[
            'px-3 py-1 text-xs rounded border transition-colors',
            localConstraints.maxTimeBetweenCourses === slots
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          ]"
        >
          {{ slots }} {{ slots === 1 ? t('slot') : t('slots') }}
        </button>
      </div>
    </div>

    <!-- Per-Day Time Slots -->
    <div v-if="availableDays.length > 0" class="mb-6">
      <div class="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div v-for="day in availableDays" :key="day.short" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-700">{{ day.long }}</span>
            <div class="flex gap-1">
              <button
                @click="selectAllSlotsForDay(day.short)"
                class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {{ t('All') }}
              </button>
              <button
                @click="clearAllSlotsForDay(day.short)"
                class="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {{ t('None') }}
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-5 gap-1">
            <button
              v-for="slot in getAvailableSlotsForDay(day.short)"
              :key="`${day.short}-${slot.value}`"
              @click="toggleDayTimeSlot(day.short, slot.value)"
              :class="[
                'px-2 py-1 text-xs rounded border transition-colors min-w-[2.5rem]',
                isDayTimeSlotSelected(day.short, slot.value)
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              ]"
            >
              {{ slot.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'TimeConstraints',
  props: {
    modelValue: {
      type: Object,
      required: true
    },
    availableCourses: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t, dayNames, translateDayCode, getDayColors } = useI18n()
    
    // Define time slots (8 AM to 10 PM)
    const timeSlots = ref([
      { value: 8, label: '8:00' },
      { value: 9, label: '9:00' },
      { value: 10, label: '10:00' },
      { value: 11, label: '11:00' },
      { value: 12, label: '12:00' },
      { value: 13, label: '13:00' },
      { value: 14, label: '14:00' },
      { value: 15, label: '15:00' },
      { value: 16, label: '16:00' },
      { value: 17, label: '17:00' },
      { value: 18, label: '18:00' },
      { value: 19, label: '19:00' },
      { value: 20, label: '20:00' },
      { value: 21, label: '21:00' },
      { value: 22, label: '22:00' }
    ])

    const localConstraints = ref({
      maxTimeBetweenCourses: props.modelValue.maxTimeBetweenCourses || 0,
      perDayTimeSlots: props.modelValue.perDayTimeSlots || {}
    })

    // Get days where selected courses are available
    const availableDays = computed(() => {
      if (!props.availableCourses || props.availableCourses.length === 0) return []
      
      const daysWithCourses = new Set()
      props.availableCourses.forEach(course => {
        // Translate data day code to display day code
        daysWithCourses.add(translateDayCode(course.day))
      })
      
      return dayNames.value.filter(day => daysWithCourses.has(day.short))
    })

    const getAvailableSlotsForDay = (dayShort) => {
      // Get unique time slots for courses on this day using actual start times
      // Convert display day code back to data day code for filtering
      let dataDayCode = dayShort
      if (dayShort === 'MON') dataDayCode = 'MO'
      else if (dayShort === 'TUE') dataDayCode = 'DI'
      else if (dayShort === 'WED') dataDayCode = 'MI'
      else if (dayShort === 'THU') dataDayCode = 'DO'
      else if (dayShort === 'FRI') dataDayCode = 'FR'
      else if (dayShort === 'SAT') dataDayCode = 'SA'
      else if (dayShort === 'SUN') dataDayCode = 'SO'
      
      const coursesForDay = props.availableCourses.filter(course => course.day === dataDayCode)
      const availableSlots = new Map()
      
      coursesForDay.forEach(course => {
        const startTime = course.startTime
        const hours = startTime.getHours()
        const minutes = startTime.getMinutes()
        const timeKey = hours * 60 + minutes // Convert to minutes for unique key
        const label = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        
        availableSlots.set(timeKey, {
          value: timeKey,
          label: label,
          hour: hours,
          minute: minutes
        })
      })
      
      // Return sorted array of actual time slots
      return Array.from(availableSlots.values()).sort((a, b) => a.value - b.value)
    }

    const updateConstraints = () => {
      emit('update:modelValue', {
        ...props.modelValue,
        maxTimeBetweenCourses: localConstraints.value.maxTimeBetweenCourses,
        perDayTimeSlots: localConstraints.value.perDayTimeSlots
      })
    }

    const updateMaxGapSlots = (slots) => {
      localConstraints.value.maxTimeBetweenCourses = slots
      updateConstraints()
    }

    // Per-day time slot methods
    const isDayTimeSlotSelected = (dayShort, slotValue) => {
      if (!localConstraints.value.perDayTimeSlots[dayShort]) {
        // Initialize with all available slots for this day when first accessed
        const availableSlots = getAvailableSlotsForDay(dayShort).map(slot => slot.value)
        localConstraints.value.perDayTimeSlots[dayShort] = [...availableSlots]
        updateConstraints()
      }
      return localConstraints.value.perDayTimeSlots[dayShort]?.includes(slotValue) ?? false
    }

    const toggleDayTimeSlot = (dayShort, slotValue) => {
      if (!localConstraints.value.perDayTimeSlots[dayShort]) {
        localConstraints.value.perDayTimeSlots[dayShort] = []
      }
      
      const daySlots = localConstraints.value.perDayTimeSlots[dayShort]
      const index = daySlots.indexOf(slotValue)
      
      if (index > -1) {
        daySlots.splice(index, 1)
      } else {
        daySlots.push(slotValue)
        daySlots.sort((a, b) => a - b)
      }
      
      updateConstraints()
    }

    const selectAllSlotsForDay = (dayShort) => {
      const availableSlots = getAvailableSlotsForDay(dayShort).map(slot => slot.value)
      localConstraints.value.perDayTimeSlots[dayShort] = [...availableSlots]
      updateConstraints()
    }

    const clearAllSlotsForDay = (dayShort) => {
      localConstraints.value.perDayTimeSlots[dayShort] = []
      updateConstraints()
    }

    // Watch for external changes
    watch(() => props.modelValue, (newValue) => {
      localConstraints.value.maxTimeBetweenCourses = newValue.maxTimeBetweenCourses || 0
      localConstraints.value.perDayTimeSlots = newValue.perDayTimeSlots || {}
    }, { deep: true })

    // Initialize per-day slots when available courses change
    watch(() => props.availableCourses, (newCourses) => {
      if (newCourses && newCourses.length > 0) {
        const daysWithCourses = new Set()
        newCourses.forEach(course => {
          // Translate data day code to display day code
          daysWithCourses.add(translateDayCode(course.day))
        })
        
        // Initialize slots for new days that don't have configuration yet
        // And add new slots to existing days
        let hasChanges = false
        for (const day of daysWithCourses) {
          const availableSlots = getAvailableSlotsForDay(day).map(slot => slot.value)
          
          if (!localConstraints.value.perDayTimeSlots[day]) {
            // New day - initialize with all available slots
            localConstraints.value.perDayTimeSlots[day] = [...availableSlots]
            hasChanges = true
          } else {
            // Existing day - check for new slots and add them
            const currentSlots = localConstraints.value.perDayTimeSlots[day]
            const newSlots = availableSlots.filter(slot => !currentSlots.includes(slot))
            
            if (newSlots.length > 0) {
              // Add new slots to existing selection
              localConstraints.value.perDayTimeSlots[day] = [...currentSlots, ...newSlots].sort((a, b) => a - b)
              hasChanges = true
            }
          }
        }
        
        if (hasChanges) {
          updateConstraints()
        }
      }
    }, { deep: true, immediate: true })

    // Get day-specific colors from centralized system
    const getDayHeaderClasses = (day) => {
      const colors = getDayColors()
      const dayColors = colors[day.name.toLowerCase()]
      return `text-xs font-medium px-2 py-1 rounded ${dayColors}`
    }

    return {
      t,
      timeSlots,
      localConstraints,
      availableDays,
      getDayHeaderClasses,
      updateConstraints,
      updateMaxGapSlots,
      getAvailableSlotsForDay,
      isDayTimeSlotSelected,
      toggleDayTimeSlot,
      selectAllSlotsForDay,
      clearAllSlotsForDay
    }
  }
}
</script>
