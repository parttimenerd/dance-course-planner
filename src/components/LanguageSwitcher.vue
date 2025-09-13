<template>
  <div class="flex items-center">
    <button
      @click="toggleLanguage"
      class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors"
      :title="language === 'en' ? 'Switch to German' : 'Zu Englisch wechseln'"
    >
      <span class="w-4 h-4 mr-1">{{ languageFlag }}</span>
      <span class="text-xs font-medium">{{ languageCode }}</span>
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

    const languageFlag = computed(() => {
      return language.value === 'en' ? '🇺🇸' : '🇩🇪'
    })

    const languageCode = computed(() => {
      return language.value === 'en' ? 'EN' : 'DE'
    })

    const toggleLanguage = () => {
      const newLanguage = language.value === 'en' ? 'de' : 'en'
      setLanguage(newLanguage)
    }

    return {
      language,
      languageFlag,
      languageCode,
      toggleLanguage
    }
  }
}
</script>
