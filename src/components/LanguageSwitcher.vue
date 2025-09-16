<template>
  <div class="flex items-center">
    <button
      @click="toggleLanguage"
      class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors"
      :title="language === 'en' ? 'Switch to German' : 'Zu Englisch wechseln'"
    >
      <span class="text-xs font-medium mr-1">{{ switchText }}</span>
      <span class="w-4 h-4">{{ targetLanguageFlag }}</span>
    </button>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { language, setLanguage } = useI18n()

    const switchText = computed(() => {
      return language.value === 'en' ? 'Switch to' : 'Wechsel zu'
    })

    const targetLanguageFlag = computed(() => {
      return language.value === 'en' ? '🇩🇪' : '🇺🇸'
    })

    const toggleLanguage = () => {
      const newLanguage = language.value === 'en' ? 'de' : 'en'
      setLanguage(newLanguage)
    }

    return {
      language,
      switchText,
      targetLanguageFlag,
      toggleLanguage
    }
  }
}
</script>
