<template>
  <div class="space-y-2">
    <!-- Registration Button - only show if within registration window -->
    <button
      v-if="isWithinRegistrationWindow"
      @click="handleClick"
      :disabled="inProgress"
      :class="buttonClasses"
      class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
    >
      <span v-if="inProgress" class="flex items-center space-x-1">
        <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isRegistered ? t('Unregistering...') : t('Registering...') }}</span>
      </span>
      <span v-else>
        {{ isRegistered ? t('Unregister for date') : t('Register for date') }}
        <span v-if="formattedDate" class="ml-1">({{ formattedDate }})</span>
      </span>
    </button>
    
    <!-- Registration Window Warning -->
    <div v-if="!isWithinRegistrationWindow && formattedDate" class="text-xs text-gray-500 italic">
      🔒 {{ t('Registration only available within 6 days') }}
      <div class="text-gray-400">{{ t('Course date') }}: {{ formattedDate }}</div>
    </div>

    <!-- Availability Info -->
    <div v-if="availabilityInfo && !availabilityInfo.isPairCourse && !availabilityInfo.showPairIndicator" class="text-xs text-gray-500">
      <!-- Regular Availability Info -->
      <div v-if="availabilityInfo.isFull" class="text-red-600 font-medium">
        {{ t('Full') }}
      </div>
      <div v-else-if="availabilityInfo.available !== undefined" class="space-y-1">
        <div>{{ t('Available spots') }}: {{ availabilityInfo.available }}/{{ availabilityInfo.limit }}</div>
        <div v-if="availabilityInfo.showMaleFemale" class="flex space-x-2 text-xs">
          <span v-if="availabilityInfo.male !== '0'">{{ t('Male') }}: {{ availabilityInfo.male }}</span>
          <span v-if="availabilityInfo.female !== '0'">{{ t('Female') }}: {{ availabilityInfo.female }}</span>
          <span v-if="availabilityInfo.diverse !== '0'">{{ t('Diverse') }}: {{ availabilityInfo.diverse }}</span>
        </div>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="showConfirmation"
      :title="confirmationTitle"
      :message="confirmationMessage"
      :confirm-text="confirmationConfirmText"
      :cancel-text="t('Cancel')"
      :type="isRegistered ? 'danger' : 'question'"
      @confirm="performAction"
      @cancel="showConfirmation = false"
    />
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import ConfirmationModal from './ConfirmationModal.vue'
import { isWithinRegistrationWindow as checkRegistrationWindow } from '../utils/dateUtils.js'

export default {
  name: 'RegistrationButton',
  components: {
    ConfirmationModal
  },
  props: {
    courseId: {
      type: String,
      required: true
    },
    dateId: {
      type: String,
      required: true
    },
    courseDate: {
      type: [String, Date],
      default: null
    },
    courseName: {
      type: String,
      default: ''
    },
    isRegistered: {
      type: Boolean,
      default: false
    },
    inProgress: {
      type: Boolean,
      default: false
    },
    availabilityInfo: {
      type: Object,
      default: null
    }
  },
  emits: ['register', 'unregister'],
  setup(props, { emit }) {
    const { t, language } = useI18n()
    
    const showConfirmation = ref(false)
    
    // Check if course is within registration window (6 days)
    const isWithinRegistrationWindow = computed(() => {
      return checkRegistrationWindow(props.courseDate)
    })
    
    const formattedDate = computed(() => {
      if (!props.courseDate) return ''
      
      const date = props.courseDate instanceof Date ? props.courseDate : new Date(props.courseDate)
      
      if (isNaN(date.getTime())) {
        console.warn('[RegistrationButton] Invalid date:', props.courseDate)
        return ''
      }
      
      // Use current language from useI18n hook for reactivity
      const locale = language.value === 'de' ? 'de-DE' : 'en-US'
      return date.toLocaleDateString(locale, { 
        weekday: 'short',
        day: '2-digit', 
        month: '2-digit'
      })
    })
    
    const buttonClasses = computed(() => {
      const baseClasses = 'focus:ring-blue-500'
      
      if (props.inProgress) {
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`
      }
      
      if (props.isRegistered) {
        return `${baseClasses} bg-red-100 text-red-700 hover:bg-red-200`
      } else {
        return `${baseClasses} bg-green-100 text-green-700 hover:bg-green-200`
      }
    })
    
    const confirmationTitle = computed(() => {
      return props.isRegistered ? t('Unregister for date') : t('Register for date')
    })
    
    const confirmationMessage = computed(() => {
      const action = props.isRegistered ? t('unregister from') : t('register for')
      const courseName = props.courseName || t('this course')
      const dateText = formattedDate.value ? ` ${t('on')} ${formattedDate.value}` : ''
      
      return t('Are you sure you want to {action} {courseName}{date}?', {
        action,
        courseName,
        date: dateText
      })
    })
    
    const confirmationConfirmText = computed(() => {
      return props.isRegistered ? t('Unregister for date') : t('Register for date')
    })
    
    const handleClick = async () => {
      if (props.inProgress) return
      showConfirmation.value = true
    }
    
    const performAction = () => {
      showConfirmation.value = false
      
      if (props.isRegistered) {
        emit('unregister', { courseId: props.courseId, dateId: props.dateId })
      } else {
        emit('register', { courseId: props.courseId, dateId: props.dateId })
      }
    }
    
    return {
      t,
      formattedDate,
      buttonClasses,
      showConfirmation,
      confirmationTitle,
      confirmationMessage,
      confirmationConfirmText,
      handleClick,
      performAction,
      isWithinRegistrationWindow
    }
  }
}
</script>
