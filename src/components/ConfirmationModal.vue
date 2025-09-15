<template>
  <Teleport to="body">
    <div 
      v-if="show"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="cancel"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          <!-- Header -->
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div :class="iconClasses">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      v-if="type === 'danger'"
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                    <path 
                      v-else
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ title }}
                </h3>
              </div>
            </div>
          </div>
          
          <!-- Body -->
          <div class="px-6 pb-4">
            <p class="text-sm text-gray-600">
              {{ message }}
            </p>
          </div>
          
          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button
              @click="cancel"
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {{ cancelText }}
            </button>
            <button
              @click="confirm"
              type="button"
              :class="confirmButtonClasses"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'ConfirmationModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: ''
    },
    cancelText: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'question', // 'question' or 'danger'
      validator: (value) => ['question', 'danger'].includes(value)
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    const iconClasses = computed(() => {
      if (props.type === 'danger') {
        return 'flex items-center justify-center w-12 h-12 bg-red-100 rounded-full'
      }
      return 'flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full'
    })
    
    const confirmButtonClasses = computed(() => {
      const base = 'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2'
      if (props.type === 'danger') {
        return `${base} bg-red-600 hover:bg-red-700 focus:ring-red-500`
      }
      return `${base} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`
    })
    
    const confirm = () => {
      emit('confirm')
    }
    
    const cancel = () => {
      emit('cancel')
    }
    
    return {
      t,
      iconClasses,
      confirmButtonClasses,
      confirm,
      cancel
    }
  }
}
</script>
