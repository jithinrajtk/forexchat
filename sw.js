// SpiderForex Service Worker - Apple HIG Compliant PWA
// Version 2.0.0

const CACHE_NAME = 'spiderforex-v2.0.0';
const CACHE_TIMEOUT = 10000; // 10 seconds

// Core app files that should always be cached
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Optional assets that enhance the experience
const OPTIONAL_ASSETS = [
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-167x167.png',
  '/icons/icon-180x180.png',
  '/icons/icon-256x256.png',
  '/icons/icon-384x384.png',
  '/icons/icon-1024x1024.png'
];

// Network-first resources
const NETWORK_FIRST = [
  '/api/',
  'https://api.exchangerate-api.com/',
  'https://api.fixer.io/'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing SpiderForex v2.0.0');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache core assets first
        await cache.addAll(CORE_ASSETS);
        console.log('[SW] Core assets cached successfully');
        
        // Cache optional assets (don't fail if these don't load)
        const optionalPromises = OPTIONAL_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset);
            if (response.ok) {
              await cache.put(asset, response);
            }
          } catch (error) {
            console.warn(`[SW] Failed to cache optional asset: ${asset}`, error);
          }
        });
        
        await Promise.allSettled(optionalPromises);
        console.log('[SW] Optional assets cached');
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
        
      } catch (error) {
        console.error('[SW] Installation failed:', error);
        throw error;
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating SpiderForex v2.0.0');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(name => name.startsWith('spiderforex-') && name !== CACHE_NAME)
          .map(name => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          });
        
        await Promise.all(deletePromises);
        
        // Take control of all clients immediately
        await self.clients.claim();
        
        console.log('[SW] Activation complete');
        
        // Notify clients of successful update
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: '2.0.0'
          });
        });
        
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Choose strategy based on request type
  if (NETWORK_FIRST.some(pattern => url.pathname.startsWith(pattern) || url.href.includes(pattern))) {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/api/') || url.search.includes('_t=')) {
    event.respondWith(networkOnly(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

// Cache-first strategy (for app shell and static assets)
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      // Update cache in background for next time
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetchWithTimeout(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Cache-first failed:', error);
    
    // Fallback to offline page for navigation requests
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/') || new Response('Offline', { status: 200 });
    }
    
    return new Response('Network error', { status: 408 });
  }
}

// Network-first strategy (for dynamic content)
async function networkFirst(request) {
  try {
    const networkResponse = await fetchWithTimeout(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Network-first fallback to cache:', error);
    
    // Fallback to cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content unavailable offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-only strategy (for real-time data)
async function networkOnly(request) {
  try {
    return await fetchWithTimeout(request);
  } catch (error) {
    console.warn('[SW] Network-only failed:', error);
    return new Response('Network required', { status: 503 });
  }
}

// Fetch with timeout
function fetchWithTimeout(request, timeout = CACHE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);
    
    fetch(request)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetchWithTimeout(request);
    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silent fail for background updates
    console.debug('[SW] Background cache update failed:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        type: 'VERSION',
        version: '2.0.0',
        cacheName: CACHE_NAME
      });
      break;
      
    case 'CLEAN_CACHE':
      cleanOldCaches().then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEANED'
        });
      });
      break;
      
    case 'FORCE_UPDATE':
      forceUpdate().then(() => {
        event.ports[0].postMessage({
          type: 'UPDATE_COMPLETE'
        });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Clean old caches
async function cleanOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames
      .filter(name => name.startsWith('spiderforex-') && name !== CACHE_NAME)
      .map(name => caches.delete(name));
    
    await Promise.all(deletePromises);
    console.log('[SW] Old caches cleaned');
  } catch (error) {
    console.error('[SW] Failed to clean old caches:', error);
  }
}

// Force update all cached assets
async function forceUpdate() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Delete current cache
    await caches.delete(CACHE_NAME);
    
    // Re-cache core assets
    const newCache = await caches.open(CACHE_NAME);
    await newCache.addAll(CORE_ASSETS);
    
    console.log('[SW] Force update complete');
  } catch (error) {
    console.error('[SW] Force update failed:', error);
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any queued offline actions
    console.log('[SW] Background sync triggered');
    
    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE'
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'SpiderForex', {
        body: data.body || 'You have a new trading update',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200]
      })
    );
    
  } catch (error) {
    console.error('[SW] Push notification failed:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const { action, data } = event;
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      // Focus existing window if available
      if (clients.length > 0) {
        const client = clients[0];
        await client.focus();
        
        // Send action to client
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action,
          data
        });
        
      } else {
        // Open new window
        const url = data?.url || '/';
        await self.clients.openWindow(url);
      }
    })()
  );
});

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] SpiderForex Service Worker v2.0.0 loaded');