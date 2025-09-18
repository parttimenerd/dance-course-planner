<template>
  <div class="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
    <div v-if="!isLoggedIn" class="text-center">
      <h3 class="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {{ t('Connect to') }} <a href="https://community.nimbuscloud.at/" target="_blank" rel="noopener noreferrer" 
           class="text-blue-600 hover:text-blue-800 underline">{{ t('Nimbuscloud') }}</a>
      </h3>
      <p class="text-sm text-gray-600 mb-4">
        {{ t('Login to get current schedule data from Nimbuscloud. Your credentials are only stored in your browser and never transferred to any server except Nimbuscloud.') }}
      </p>
      <p class="text-xs text-gray-500 mb-6 text-center">
        <a href="https://community.nimbuscloud.at/" target="_blank" rel="noopener noreferrer" 
           class="text-blue-600 hover:text-blue-800 underline">
          {{ t('Visit Nimbuscloud') }} ↗
        </a>
      </p>
      
      <form @submit.prevent="handleLogin" class="space-y-4" autocomplete="on">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('Username') }}
          </label>
          <input
            id="username"
            v-model="formCredentials.username"
            type="email"
            name="username"
            autocomplete="username"
            required
            :disabled="isLoggingIn"
            @input="$emit('clear-error')"
            class="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 touch-manipulation"
            :placeholder="t('Enter your username')"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('Password') }}
          </label>
          <input
            id="password"
            v-model="formCredentials.password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            :disabled="isLoggingIn"
            @input="$emit('clear-error')"
            class="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 touch-manipulation"
            :placeholder="t('Enter your password')"
          />
        </div>
        
        <div v-if="loginError" class="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-2">
              <h3 class="text-sm font-medium text-red-800">
                {{ t('Login failed') }}
              </h3>
              <div class="mt-1 text-sm text-red-700">
                {{ loginError }}
              </div>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          :disabled="isLoggingIn"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isLoggingIn" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t('Logging in...') }}
          </span>
          <span v-else>{{ t('Login') }}</span>
        </button>
        
        <!-- Privacy notice and disclaimer -->
        <div class="mt-4 pt-3 border-t border-gray-100 space-y-2">
          <p class="text-xs text-gray-500 text-center">
            🔒 {{ t('Your login data is only sent to Nimbuscloud and stored locally in your browser. No data is transferred to any other server.') }}
          </p>
          <p class="text-xs text-orange-600 text-center bg-orange-50 px-2 py-1 rounded">
            ⚠️ {{ t('Use at your own risk') }}
          </p>
        </div>
      </form>
    </div>
    
    <div v-else class="space-y-3">
      <!-- Compact logged-in state -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="bg-green-100 rounded-full p-1.5">
            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <div class="text-left">
            <p class="text-sm font-medium text-gray-900">
              {{ t('Connected to') }} <a href="https://community.nimbuscloud.at/" target="_blank" rel="noopener noreferrer" 
                 class="text-blue-600 hover:text-blue-800 underline">{{ t('Nimbuscloud') }}</a>
            </p>
            <p class="text-xs text-gray-600">
              {{ t('Welcome back') }}, {{ currentUser }}!
            </p>
          </div>
        </div>
        
        <button
          @click="handleLogout"
          class="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          :title="t('Logout')"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span class="ml-1 hidden sm:inline">{{ t('Logout') }}</span>
        </button>
      </div>
      
      <!-- Registered courses list -->
      <RegisteredCoursesList
        :registrations="registrations"
        :schedule-data="scheduleData"
        @unregister="$emit('unregister', $event)"
      />
      
      <!-- Privacy notice for logged-in state -->
      <div class="pt-2 border-t border-gray-100">
        <p class="text-xs text-gray-500 text-center">
          🔒 {{ t('Data stored locally in browser only') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import RegisteredCoursesList from './RegisteredCoursesList.vue'

export default {
  name: 'NimbusLogin',
  components: {
    RegisteredCoursesList
  },
  props: {
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    credentials: {
      type: Object,
      default: () => ({ username: '', password: '' })
    },
    userData: {
      type: Object,
      default: null
    },
    isLoggingIn: {
      type: Boolean,
      default: false
    },
    loginError: {
      type: String,
      default: ''
    },
    registrations: {
      type: Map,
      default: () => new Map()
    },
    scheduleData: {
      type: Object,
      default: () => ({ courses: [] })
    }
  },
  emits: ['login-attempt', 'logout', 'clear-error', 'unregister'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // Internal form credentials state
    const formCredentials = reactive({
      username: props.credentials?.username || '',
      password: props.credentials?.password || ''
    })
    
    // We'll get loginError from the parent through props
    const loginError = computed(() => props.loginError || '')
    
    // Extract username from userData first, then fallback to credentials
    const currentUser = computed(() => {
      console.log('[NimbusLogin] Computing currentUser with userData:', props.userData)
      
      // Try to get name from user data first - only show first name
      if (props.userData?.firstname) {
        console.log('[NimbusLogin] Using firstname from userData:', props.userData.firstname)
        return props.userData.firstname
      }
      
      // Fallback to credentials (either form credentials or props)
      const username = formCredentials.username || props.credentials?.username
      if (username) {
        const fallbackName = username.includes('@') 
          ? username.split('@')[0] 
          : username
        console.log('[NimbusLogin] Using fallback name from credentials:', fallbackName)
        return fallbackName
      }
      
      console.log('[NimbusLogin] No name available')
      return ''
    })
    
    const handleLogin = async () => {
      try {
        await emit('login-attempt', formCredentials)
        // Success will be handled by the parent component
      } catch (err) {
        console.error('Login error:', err)
        // Error will be handled by the parent component through loginError prop
      }
    }
    
    const handleLogout = () => {
      emit('logout')
    }
    
    // Watch for userData changes
    watch(() => props.userData, (newUserData, oldUserData) => {
      console.log('[NimbusLogin] userData prop changed from:', oldUserData, 'to:', newUserData)
      if (newUserData && newUserData.firstname) {
        console.log('[NimbusLogin] User data now has firstname:', newUserData.firstname)
      }
    }, { immediate: true, deep: true })
    
    // Watch for credentials prop changes to update form
    watch(() => props.credentials, (newCredentials) => {
      if (newCredentials) {
        formCredentials.username = newCredentials.username || ''
        formCredentials.password = newCredentials.password || ''
      }
    }, { immediate: true, deep: true })
    
    // Also watch the computed currentUser to see when it updates
    watch(currentUser, (newName, oldName) => {
      console.log('[NimbusLogin] currentUser computed changed from:', oldName, 'to:', newName)
    }, { immediate: true })
    
    return {
      t,
      formCredentials,
      loginError,
      currentUser,
      handleLogin,
      handleLogout
    }
  }
}
</script>
