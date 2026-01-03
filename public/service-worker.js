/**
 * P5.1 & P5.3 - Service Worker for 3D Spatial Viewer
 * Handles caching, offline support, and background sync
 * Built with Workbox for production-grade PWA support
 */

/* global self, caches, clients */

console.log('[ServiceWorker] Loading service worker');

// Service worker version for cache invalidation
const SW_VERSION = 'v1.0.0';
const CACHE_NAME = `genhub-spatial-${SW_VERSION}`;

// Cache strategies
const STATIC_CACHE = `${CACHE_NAME}-static`;
const MODEL_CACHE = `${CACHE_NAME}-models`;
const MARKER_CACHE = `${CACHE_NAME}-markers`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;

// Debug: Log install event
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing:', SW_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Pre-cache critical static assets
        const staticCache = await caches.open(STATIC_CACHE);

        console.log('[ServiceWorker] Caching static assets');

        // Cache xeokit SDK and viewer scripts
        await staticCache.addAll([
          '/',
          '/manifest.json',
          '/icon-192.png',
          '/icon-512.png',
          // Note: xeokit SDK is loaded from CDN or node_modules
          // We cache it on first load instead of pre-caching
        ]);

        console.log('[ServiceWorker] Static assets cached');

        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[ServiceWorker] Install failed:', error);
      }
    })()
  );
});

// Debug: Log activate event
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating:', SW_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        console.log('[ServiceWorker] Existing caches:', cacheNames);

        await Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('genhub-spatial-') && cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );

        // Claim all clients
        await self.clients.claim();
        console.log('[ServiceWorker] Activated and claimed clients');
      } catch (error) {
        console.error('[ServiceWorker] Activate failed:', error);
      }
    })()
  );
});

// Debug: Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  console.log('[ServiceWorker] Fetch:', url.pathname);

  // Strategy: Cache-first for XKT models
  if (url.pathname.endsWith('.xkt')) {
    event.respondWith(cacheFirstStrategy(request, MODEL_CACHE));
    return;
  }

  // Strategy: Network-first for marker data (API calls)
  if (url.pathname.includes('/api/') && url.pathname.includes('marker')) {
    event.respondWith(networkFirstStrategy(request, MARKER_CACHE));
    return;
  }

  // Strategy: Cache-first for static assets
  if (
    url.pathname.includes('/static/') ||
    url.pathname.includes('/_next/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Default: Network-first with runtime cache
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

/**
 * Cache-first strategy
 * Check cache first, fall back to network, update cache
 */
async function cacheFirstStrategy(request, cacheName) {
  console.log('[ServiceWorker] Cache-first:', request.url);

  try {
    // Try cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Cache hit:', request.url);
      return cachedResponse;
    }

    // Cache miss - fetch from network
    console.log('[ServiceWorker] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('[ServiceWorker] Cached response:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first failed:', error);

    // Try cache as last resort
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Serving stale cache due to network error');
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Network-first strategy
 * Try network first, fall back to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
  console.log('[ServiceWorker] Network-first:', request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[ServiceWorker] Cached network response:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.warn('[ServiceWorker] Network failed, trying cache:', error);

    // Network failed - try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    console.error('[ServiceWorker] Network and cache both failed');
    throw error;
  }
}

/**
 * P5.3 - Background Sync Handler
 * Sync offline-created markers when connection restored
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-markers') {
    event.waitUntil(syncPendingMarkers());
  }
});

/**
 * Sync pending markers with server
 * Notifies all clients to trigger sync manager
 */
async function syncPendingMarkers() {
  console.log('[ServiceWorker] Starting marker sync');

  try {
    // Get all clients (browser tabs)
    const allClients = await clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    });

    if (allClients.length === 0) {
      console.warn('[ServiceWorker] No clients available for sync');
      return;
    }

    // Notify clients to start sync
    for (const client of allClients) {
      client.postMessage({
        type: 'SYNC_MARKERS_START',
        timestamp: Date.now(),
      });
    }

    console.log('[ServiceWorker] Sync notification sent to clients');
  } catch (error) {
    console.error('[ServiceWorker] Marker sync failed:', error);
    throw error;
  }
}

/**
 * Clear model cache
 */
async function clearModelCache() {
  console.log('[ServiceWorker] Clearing model cache');
  try {
    const cache = await caches.open(MODEL_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.map((request) => cache.delete(request)));
    console.log('[ServiceWorker] Model cache cleared');
  } catch (error) {
    console.error('[ServiceWorker] Failed to clear model cache:', error);
    throw error;
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  console.log('[ServiceWorker] Clearing all caches');
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[ServiceWorker] All caches cleared');
  } catch (error) {
    console.error('[ServiceWorker] Failed to clear all caches:', error);
    throw error;
  }
}

/**
 * Message handler for cache invalidation and controls
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_MODEL_CACHE') {
    event.waitUntil(
      clearModelCache().then(() => {
        console.log('[ServiceWorker] Model cache cleared via message');
        event.ports[0]?.postMessage({ success: true });
      }).catch((error) => {
        console.error('[ServiceWorker] Model cache clear failed:', error);
        event.ports[0]?.postMessage({ success: false, error: error.message });
      })
    );
  }

  if (event.data?.type === 'CLEAR_ALL_CACHE') {
    event.waitUntil(
      clearAllCaches().then(() => {
        console.log('[ServiceWorker] All caches cleared via message');
        event.ports[0]?.postMessage({ success: true });
      }).catch((error) => {
        console.error('[ServiceWorker] All cache clear failed:', error);
        event.ports[0]?.postMessage({ success: false, error: error.message });
      })
    );
  }
});

console.log('[ServiceWorker] Service worker loaded successfully');
