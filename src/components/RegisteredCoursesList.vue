<template>
  <div>
    <!-- Registered courses list -->
    <div v-if="registeredCourses.length > 0" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <h4 class="text-sm font-medium text-gray-900 mb-3">
      {{ t('Registered Courses') }}
    </h4>
    
    <div class="space-y-2">
      <div 
        v-for="registration in registeredCourses" 
        :key="`registration-${registration.courseId}`"
        class="flex items-center justify-between text-sm bg-white p-2 rounded border"
      >
        <div class="flex-1">
          <div class="font-medium text-gray-900">{{ registration.courseName }}</div>
          <div class="text-xs text-gray-500">
            {{ registration.date }} · {{ registration.time }}
          </div>
          <div class="text-xs text-gray-500">
            {{ registration.teacher }} · {{ registration.location }}
          </div>
        </div>
        
        <button
          v-if="hasValidCustomerId"
          @click="() => showUnregisterConfirmation(registration)"
          :disabled="unregistering.has(registration.courseId)"
          class="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          <svg v-if="unregistering.has(registration.courseId)" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>{{ t('Remove') }}</span>
        </button>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <ConfirmationModal
      v-if="shouldShowModal"
      :show="showConfirmation"
      :title="t('Unregister for date')"
      :message="confirmationMessage"
      :confirm-text="t('Remove')"
      :cancel-text="t('Cancel')"
      type="danger"
      @confirm="confirmUnregister"
      @cancel="cancelUnregister"
    />
  </div>
  
  <!-- Empty state message - only show when not registered to any courses -->
  <div v-if="shouldShowEmptyState" class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
    <div class="text-sm text-gray-500 italic text-center">
      {{ t('No pre-registered courses found') }}
    </div>
  </div>
  </div>
</template>

<script>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useNimbuscloud } from '../composables/useNimbuscloud.js'
import ConfirmationModal from './ConfirmationModal.vue'

export default {
  name: 'RegisteredCoursesList',
  components: {
    ConfirmationModal
  },
  props: {
    registrations: {
      type: Map,
      default: () => new Map(),
      validator: (value) => {
        return value instanceof Map || value === null || value === undefined
      }
    },
    scheduleData: {
      type: Object,
      default: () => ({ courses: [] }),
      validator: (value) => {
        return value === null || value === undefined || (typeof value === 'object' && !Array.isArray(value))
      }
    }
  },
  emits: ['unregister'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { hasValidCustomerId } = useNimbuscloud()
    
    // Ensure all reactive values are properly initialized
    const unregistering = ref(new Set())
    const showConfirmation = ref(false)
    const selectedRegistration = ref(null)
    
    // Add defensive checks for props
    const safeProps = computed(() => ({
      registrations: props.registrations || new Map(),
      scheduleData: props.scheduleData || { courses: [] }
    }))
    
    const registeredCourses = computed(() => {
      const registered = []
      
      // Guard against null/undefined props using safe props
      const { registrations, scheduleData } = safeProps.value
      if (!registrations || registrations.size === 0) {
        console.log('[RegisteredCoursesList] No registrations to process')
        return registered
      }
      
      console.log('[RegisteredCoursesList] Computing registered courses...')
      console.log('[RegisteredCoursesList] Registrations Map size:', registrations.size)
      console.log('[RegisteredCoursesList] Schedule data courses length:', scheduleData?.courses?.length || 0)
      console.log('[RegisteredCoursesList] Processing registrations:', Array.from(registrations.entries()))
      
      // Go through all registrations and find the ones that are registered
      for (const [key, registration] of registrations.entries()) {
        console.log(`[RegisteredCoursesList] Processing key: ${key}, registered: ${registration.registered}`)
        
        if (registration.registered) {
          // Handle both key formats: simple courseId or courseId-dateId
          const courseId = key.includes('-') ? key.split('-')[0] : key
          console.log(`[RegisteredCoursesList] Extracted courseId: ${courseId}`)
          
          // Find the course details from schedule data
          const course = scheduleData.courses?.find(c => c.id === courseId)
          console.log(`[RegisteredCoursesList] Found course for ${courseId}:`, course ? course.name : 'NOT FOUND')
          
          if (course) {
            // Ensure we have valid data before processing
            let courseDate, formattedDate, formattedTime
            
            try {
              courseDate = course.startTime instanceof Date 
                ? course.startTime 
                : new Date(course.startTime)
              
              if (isNaN(courseDate.getTime())) {
                throw new Error('Invalid date')
              }
              
              formattedDate = courseDate.toLocaleDateString('de-DE', { 
                weekday: 'short',
                day: '2-digit', 
                month: '2-digit' 
              })
              formattedTime = courseDate.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            } catch (dateError) {
              console.warn(`[RegisteredCoursesList] Invalid date for course ${courseId}:`, course.startTime)
              formattedDate = 'Unknown date'
              formattedTime = 'Unknown time'
            }
            
            registered.push({
              courseId: courseId,
              courseName: course.name || `Course ${courseId}`,
              date: formattedDate,
              time: formattedTime,
              teacher: course.teacher || 'Unknown teacher',
              location: course.location || 'Unknown location',
              room: course.room || 'Unknown room'
            })
          } else {
            console.warn(`[RegisteredCoursesList] Course ${courseId} is registered but not found in schedule data - showing with limited info`)
            // Still show the course even if not found in schedule data
            // Use data from the registration if available
            const regData = registration.result || {}
            registered.push({
              courseId: courseId,
              courseName: regData.name || `Course ${courseId}`,
              date: regData.start_date || 'Unknown date',
              time: regData.start_time || 'Unknown time',
              teacher: regData.teacherName || 'Unknown teacher',
              location: regData.location || 'Unknown location',
              room: regData.room || 'Unknown room'
            })
          }
        }
      }
      
      console.log('[RegisteredCoursesList] Final registered courses count:', registered.length)
      console.log('[RegisteredCoursesList] Final registered courses:', registered)
      return registered.sort((a, b) => a.courseName.localeCompare(b.courseName))
    })
    
    
    const confirmationMessage = computed(() => {
      if (!selectedRegistration.value) return ''
      
      return t('Are you sure you want to unregister from {courseName} on {date}?', {
        courseName: selectedRegistration.value.courseName,
        date: selectedRegistration.value.date
      })
    })

    // Computed properties to simplify template conditions and avoid race conditions
    const shouldShowEmptyState = computed(() => {
      return registeredCourses.value.length === 0 && 
             (!safeProps.value.registrations || safeProps.value.registrations.size === 0)
    })

    const shouldShowModal = computed(() => {
      return showConfirmation.value && selectedRegistration.value !== null
    })
    
    const showUnregisterConfirmation = (registration) => {
      selectedRegistration.value = registration
      showConfirmation.value = true
    }
    
    const confirmUnregister = async () => {
      if (!selectedRegistration.value) return
      
      const registration = selectedRegistration.value
      showConfirmation.value = false
      
      unregistering.value.add(registration.courseId)
      
      try {
        emit('unregister', { 
          courseId: registration.courseId, 
          dateId: registration.courseId 
        })
      } finally {
        // Remove from unregistering set after a delay to show the loading state
        setTimeout(() => {
          unregistering.value.delete(registration.courseId)
        }, 1000)
      }
      
      selectedRegistration.value = null
    }
    
    const cancelUnregister = () => {
      showConfirmation.value = false
      selectedRegistration.value = null
    }

    // Watch for changes in registrations to help debug reactivity issues
    // Watch for prop changes with safety checks
    watch(() => safeProps.value.registrations, (newRegistrations, oldRegistrations) => {
      console.log('[RegisteredCoursesList] Registrations prop changed!')
      console.log('[RegisteredCoursesList] New registrations size:', newRegistrations?.size || 0)
      console.log('[RegisteredCoursesList] New registrations entries:', Array.from(newRegistrations?.entries() || []))
    }, { deep: true, immediate: true })

    // Also watch schedule data
    watch(() => safeProps.value.scheduleData, (newScheduleData) => {
      console.log('[RegisteredCoursesList] Schedule data changed!')
      console.log('[RegisteredCoursesList] New schedule courses count:', newScheduleData?.courses?.length || 0)
    }, { deep: true, immediate: true })
    
    // Cleanup on component unmount
    onUnmounted(() => {
      console.log('[RegisteredCoursesList] Component unmounting, cleaning up...')
      showConfirmation.value = false
      selectedRegistration.value = null
      unregistering.value.clear()
    })
    
    return {
      t,
      unregistering,
      showConfirmation,
      selectedRegistration,
      registeredCourses,
      confirmationMessage,
      hasValidCustomerId,
      // Expose computed properties used by template
      shouldShowEmptyState,
      shouldShowModal,
      // Expose handlers
      showUnregisterConfirmation,
      confirmUnregister,
      cancelUnregister
    }
  }
}
</script>
