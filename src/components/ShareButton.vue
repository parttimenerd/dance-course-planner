<template>
  <button
    @click="share"
    :disabled="sharing"
    class="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 transition-colors"
    :class="buttonClass"
  >
    <svg v-if="!sharing" class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
    <div v-else class="w-3 h-3 mr-1 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
    {{ sharing ? t('Sharing...') : shareText }}
  </button>
</template>

<script>
import { ref, computed } from 'vue'
import { useUrlState } from '../composables/useUrlState.js'
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'ShareButton',
  props: {
    type: {
      type: String,
      required: true,
      validator: (value) => ['config', 'schedule'].includes(value)
    },
    config: {
      type: Object,
      default: null
    },
    schedule: {
      type: Object,
      default: null
    }
  },
  emits: ['share'],
  setup(props, { emit }) {
    const sharing = ref(false)
    const { generateShareUrl } = useUrlState()
    const { t } = useI18n()

    const shareText = computed(() => {
      return props.type === 'config' ? t('Share') : t('Share Schedule')
    })

    const buttonClass = computed(() => {
      return props.type === 'config' 
        ? 'text-blue-600 border-blue-300 hover:bg-blue-50'
        : 'text-green-600 border-green-300 hover:bg-green-50'
    })

    const share = async () => {
      try {
        sharing.value = true
        
        const shareUrl = props.type === 'config' 
          ? generateShareUrl(props.config)
          : generateShareUrl(props.config, props.schedule)

        // Try native Web Share API first
        if (navigator.share) {
          await navigator.share({
            title: `${t('Dance Course Planner')} - ${props.type === 'config' ? t('Configuration') : t('Schedule')}`,
            text: `${t('Check out this dance course')} ${props.type}!`,
            url: shareUrl
          })
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareUrl)
          
          // Show toast notification
          showNotification(t('Link copied to clipboard!'))
        }

        emit('share', {
          type: props.type,
          url: shareUrl,
          data: props.type === 'config' ? props.config : props.schedule
        })

      } catch (error) {
        console.error('Share failed:', error)
        showNotification(t('Failed to share. Please try again.'), 'error')
      } finally {
        sharing.value = false
      }
    }

    const showNotification = (message, type = 'success') => {
      // Simple toast notification
      const toast = document.createElement('div')
      toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 transition-all transform ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      }`
      toast.textContent = message
      document.body.appendChild(toast)

      // Animate in
      setTimeout(() => toast.classList.add('translate-x-0'), 10)
      
      // Remove after 3 seconds
      setTimeout(() => {
        toast.classList.add('translate-x-full')
        setTimeout(() => document.body.removeChild(toast), 300)
      }, 3000)
    }

    return {
      sharing,
      shareText,
      buttonClass,
      share
    }
  }
}
</script>
