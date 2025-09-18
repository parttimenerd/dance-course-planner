<template>
  <div class="bg-white rounded-lg shadow-sm border p-4 sm:p-8 text-center">
    <div class="text-4xl sm:text-6xl mb-4">💃</div>
    <h3 class="text-base sm:text-lg font-medium text-gray-900 mb-2">{{ t(title) }}</h3>
    <p class="text-sm sm:text-base text-gray-600 px-2">{{ t(message) }}</p>
    <p v-if="showLoginHint" class="text-sm text-blue-600 mt-3">
      {{ t('Login to get current data') }}
    </p>
    <slot></slot>
  </div>
</template>

<script>
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'EmptyState',
  props: {
    title: {
      type: String,
      default: 'Ready to Plan Your Dance Schedule?'
    },
    message: {
      type: String,
      default: 'Select your preferred courses and set your constraints to find the perfect combination!'
    },
    showLoginHint: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const { t } = useI18n()
    
    return {
      t
    }
  }
}
</script>
