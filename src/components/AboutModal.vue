<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="handleBackdropClick"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2"
      @click.stop
    >
      <div class="p-4 sm:p-6">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6 gap-4">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 flex-1 leading-tight">
            <span class="block sm:inline">💃</span>
            <span class="block sm:inline sm:ml-2">{{ t('aboutTitle') }}</span>
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 text-2xl font-bold flex-shrink-0 p-1"
            :title="t('Close')"
          >
            ×
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-6 text-gray-700">
          <!-- Introduction -->
          <div>
            <p class="leading-relaxed">
              {{ t('aboutIntro') }}
              <a 
                href="https://mostlynerdless.de" 
                target="_blank" 
                class="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Johannes Bechberger</a>
              {{ t('projectOrigin') }}
            </p>
          </div>

          <!-- Disclaimer -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center leading-tight">
              <span class="flex-shrink-0">⚠️</span>
              <span class="ml-2">{{ t('riskTitle') }}</span>
            </h3>
            <p class="leading-relaxed text-sm">
              {{ t('riskDisclaimer') }}
            </p>
          </div>

          <!-- Technical Details -->
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 leading-tight">🔧 {{ t('builtOn') }}</h3>
            <p class="leading-relaxed">
              {{ t('nimbusIntegration') }}
              <a 
                href="https://community.nimbuscloud.at" 
                target="_blank" 
                class="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                NimbusCloud</a>
              {{ t('nimbusDescription') }}
            </p>
          </div>

          <!-- Open Source -->
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 leading-tight">📖 {{ t('openSource') }}</h3>
            <p class="leading-relaxed">
              {{ t('licenseInfo') }}
            </p>
            <a 
              href="https://github.com/parttimenerd/dance-course-planner" 
              target="_blank" 
              class="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 underline text-sm sm:text-base"
            >
              📦 {{ t('viewGitHub') }}
            </a>
          </div>

          <!-- Privacy Information -->
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 leading-tight">🔒 {{ t('privacyTitle') }}</h3>
            <div class="space-y-3 text-sm leading-relaxed">
              <p>{{ t('privacyIntro') }}</p>
              <p class="text-blue-700 font-medium">{{ t('privacyDataPolicy') }}</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>{{ t('privacyBrowser') }}</li>
                <li>{{ t('privacyCredentials') }}</li>
                <li>{{ t('privacyData') }}</li>
                <li>{{ t('privacyStorage') }}</li>
                <li>{{ t('privacyTracking') }}</li>
                <li>{{ t('privacyOffline') }}</li>
              </ul>
            </div>
          </div>

          <!-- Quote -->
          <div class="border-l-4 border-blue-500 bg-blue-50 p-3 sm:p-4 italic">
            <p class="text-gray-700 leading-relaxed mb-2 text-sm sm:text-base">
              "{{ t('DANCE, v.i. To leap about to the sound of tittering music, preferably with arms about your neighbor\'s wife or daughter. There are many kinds of dances, but all those requiring the participation of the two sexes have two characteristics in common: they are conspicuously innocent, and warmly loved by the vicious.') }}"
            </p>
            <p class="text-xs sm:text-sm text-gray-500">
              — Ambrose Bierce,
              <a 
                href="https://www.thedevilsdictionary.com" 
                target="_blank" 
                class="text-blue-600 hover:text-blue-800 underline"
              >
                The Devil's Dictionary
              </a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 sm:mt-8 pt-4 border-t border-gray-200 text-center">
          <button
            @click="$emit('close')"
            class="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            {{ t('Close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from '../composables/useI18n.js'

export default {
  name: 'AboutModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const handleBackdropClick = () => {
      emit('close')
    }

    return {
      t,
      handleBackdropClick
    }
  }
}
</script>
