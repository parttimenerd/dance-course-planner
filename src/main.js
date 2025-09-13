import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.mount('#app')

// Only register service worker in production to avoid development conflicts
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
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
