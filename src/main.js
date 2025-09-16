import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

console.log('main.js: Starting application...')

try {
  const app = createApp(App)
  console.log('main.js: App created, mounting...')
  app.mount('#app')
  console.log('main.js: App mounted successfully')
} catch (error) {
  console.error('main.js: Failed to create or mount app:', error)
}

// Only register service worker in production to avoid development conflicts
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      // First, unregister any existing service workers from different scopes
      const existingRegistrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of existingRegistrations) {
        const scope = registration.scope
        const currentScope = `${window.location.origin}${import.meta.env.BASE_URL}`
        
        // Unregister if the scope doesn't match our current base path
        if (scope !== currentScope && scope !== `${currentScope}/`) {
          console.log('Unregistering old service worker from scope:', scope)
          await registration.unregister()
        }
      }
      
      // Now register the service worker with correct scope
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        { scope: import.meta.env.BASE_URL }
      )
      console.log('Service worker registered:', registration)
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  })
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // In development, unregister any existing service workers to avoid conflicts
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        console.log('Unregistering service worker for development')
        await registration.unregister()
      }
      
      // Clear all caches in development
      const cacheNames = await caches.keys()
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName)
      }
    } catch (error) {
      console.warn('Failed to clean up service workers:', error)
    }
  })
}
