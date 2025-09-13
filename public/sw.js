// Service Worker for Dance Course Planner - TEMPORARILY DISABLED
// Provides offline functionality and PWA capabilities

// CLEAR ALL CACHES AND DISABLE CACHING
const CACHE_NAME = 'dance-planner-v1.2.0' // Version bump to clear old caches
const STATIC_CACHE = 'static-v1.2.0'

// Install event - clear all old caches
self.addEventListener('install', (event) => {
  console.log('Service Worker installing - clearing all caches...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
    }).then(() => {
      console.log('All caches cleared')
      self.skipWaiting()
    })
  )
})

// Activate event - take control and clear more caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating - ensuring cache cleanup...')
  
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Deleting remaining cache:', cacheName)
            return caches.delete(cacheName)
          })
        )
      })
    ])
  )
})

// Fetch event - NO CACHING, always use network
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Always fetch from network, no caching
  event.respondWith(
    fetch(request).catch((error) => {
      console.error('Network request failed:', error)
      throw error
    })
  )
})

// End of service worker

// Network first strategy - good for dynamic content
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
    
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Stale while revalidate - good for API data
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch((error) => {
    console.log('Network update failed:', error)
    return null
  })
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update in background
    fetchPromise
    return cachedResponse
  }
  
  // No cached version, wait for network
  return fetchPromise
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered')
    // Could implement offline constraint saving here
  }
})

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    }
    
    event.waitUntil(
      self.registration.showNotification('Dance Course Planner', options)
    )
  }
})
