/**
 * GenHub PWA Service Worker - Enhanced for Phase 1
 *
 * Provides offline support for the GenHub construction management PWA
 * with intelligent caching strategies for different resource types.
 *
 * Caching Strategies:
 * - Cache-First: Static assets (JS, CSS, images, fonts, icons)
 * - Network-First: API calls and dynamic content
 * - Stale-While-Revalidate: Project/task data for instant loading
 * - App Shell: Core app routes for offline access
 * - Offline Fallback: Serves offline page when network unavailable
 *
 * Phase 1 Enhancements:
 * - Navigation preload for instant HTML delivery
 * - Stale-while-revalidate for project/task data
 * - Background sync for entity queue
 * - Cache versioning for schema updates
 *
 * @version 2.0.0
 */

// Cache version - increment to invalidate old caches
const CACHE_VERSION = '2';
const CACHE_PREFIX = 'genhub';

// Cache names
const CACHE_NAMES = {
  static: `${CACHE_PREFIX}-static-v${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}-api-v${CACHE_VERSION}`,
  pages: `${CACHE_PREFIX}-pages-v${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}-images-v${CACHE_VERSION}`,
  data: `${CACHE_PREFIX}-data-v${CACHE_VERSION}`, // New: For project/task data
};

// All cache names for cleanup
const ALL_CACHES = Object.values(CACHE_NAMES);

// App shell URLs to cache for offline access
const APP_SHELL_URLS = [
  '/',
  '/~offline',
  '/app',
  '/app/projects',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Static asset patterns (cache-first strategy)
const STATIC_ASSET_PATTERNS = [
  /\/_next\/static\/.*/,
  /\.(?:js|css|woff|woff2|ttf|otf|eot)$/,
  /\/icon-.*\.png$/,
  /\/apple-.*\.png$/,
];

// API patterns (network-first strategy)
const API_PATTERNS = [
  /\/api\/.*/,
  /https:\/\/.*\.supabase\.co\/.*/,
];

// Image patterns (cache-first with expiration)
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
];

// Data patterns (stale-while-revalidate for instant loading)
const DATA_PATTERNS = [
  /\/api\/projects$/,
  /\/api\/projects\/[^/]+\/tasks$/,
  /\/api\/tasks$/,
];

// Maximum cache age (7 days in milliseconds)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

// Data cache age (5 minutes for stale-while-revalidate)
const DATA_CACHE_AGE = 5 * 60 * 1000;

// Maximum number of items in image cache
const MAX_IMAGE_CACHE_SIZE = 50;

/**
 * Install Event - Cache app shell and static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing service worker...');

  event.waitUntil(
    (async () => {
      try {
        // Cache app shell
        const pagesCache = await caches.open(CACHE_NAMES.pages);
        await pagesCache.addAll(APP_SHELL_URLS);
        console.log('[Service Worker] App shell cached');

        // Skip waiting to activate immediately
        await self.skipWaiting();
        console.log('[Service Worker] Installation complete');
      } catch (error) {
        console.error('[Service Worker] Installation failed:', error);
      }
    })()
  );
});

/**
 * Activate Event - Clean up old caches and enable navigation preload
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating service worker...');

  event.waitUntil(
    (async () => {
      try {
        // Delete old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX) && !ALL_CACHES.includes(name))
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );

        // Enable navigation preload for instant HTML delivery
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
          console.log('[Service Worker] Navigation preload enabled');
        }

        // Claim clients to take control immediately
        await self.clients.claim();
        console.log('[Service Worker] Activation complete');
      } catch (error) {
        console.error('[Service Worker] Activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event - Route requests to appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
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

  // Skip Supabase auth requests (never cache credentials)
  if (url.pathname.includes('/auth/v1/token') || url.pathname.includes('/auth/v1/user')) {
    return;
  }

  // Route to appropriate strategy
  if (matchesPattern(url, DATA_PATTERNS)) {
    // Stale-while-revalidate for project/task data (instant loading)
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.data));
  } else if (matchesPattern(url, API_PATTERNS)) {
    // Network-first for API calls
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
  } else if (matchesPattern(url, IMAGE_PATTERNS)) {
    // Cache-first for images with size limit
    event.respondWith(cacheFirstWithLimit(request, CACHE_NAMES.images, MAX_IMAGE_CACHE_SIZE));
  } else if (matchesPattern(url, STATIC_ASSET_PATTERNS)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  } else if (url.origin === self.location.origin) {
    // Network-first for same-origin requests (HTML pages)
    // Use navigation preload if available
    event.respondWith(navigationWithPreload(event, request, CACHE_NAMES.pages));
  }
});

/**
 * Check if URL matches any of the patterns
 */
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url.href) || pattern.test(url.pathname));
}

/**
 * Cache-First Strategy
 * Check cache first, fall back to network if not found
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      // Check if cache is stale
      const cacheDate = cached.headers.get('sw-cache-date');
      if (cacheDate && Date.now() - parseInt(cacheDate) > MAX_CACHE_AGE) {
        console.log('[Service Worker] Cache stale, fetching fresh:', request.url);
        // Cache is stale, fetch fresh in background
        fetchAndCache(request, cacheName);
      }
      return cached;
    }

    // Not in cache, fetch from network
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      await cacheResponse(cache, request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[Service Worker] Cache-first failed:', error);
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAMES.pages);
      return cache.match('/~offline') || new Response('Offline', { status: 503 });
    }
    throw error;
  }
}

/**
 * Cache-First with Size Limit Strategy
 * Limits cache size by removing oldest entries
 */
async function cacheFirstWithLimit(request, cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Not in cache, fetch from network
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      // Enforce cache size limit
      const keys = await cache.keys();
      if (keys.length >= maxSize) {
        // Delete oldest entry (first in the list)
        await cache.delete(keys[0]);
      }

      await cacheResponse(cache, request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[Service Worker] Cache-first with limit failed:', error);
    throw error;
  }
}

/**
 * Network-First Strategy
 * Try network first, fall back to cache if offline
 */
async function networkFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);

    try {
      // Try network first
      const response = await fetch(request);

      // Cache successful responses
      if (response.ok) {
        await cacheResponse(cache, request, response.clone());
      }

      return response;
    } catch (networkError) {
      // Network failed, try cache
      const cached = await cache.match(request);

      if (cached) {
        console.log('[Service Worker] Network failed, serving from cache:', request.url);
        return cached;
      }

      // No cache available, return offline page for navigation
      if (request.mode === 'navigate') {
        return cache.match('/~offline') || new Response('Offline', { status: 503 });
      }

      throw networkError;
    }
  } catch (error) {
    console.error('[Service Worker] Network-first failed:', error);
    throw error;
  }
}

/**
 * Cache response with metadata
 */
async function cacheResponse(cache, request, response) {
  // Don't modify opaque responses (CORS requests)
  // Opaque responses can't have headers modified
  if (response.type === 'opaque') {
    await cache.put(request, response);
    return;
  }

  // Add cache date to response headers
  const headers = new Headers(response.headers);
  headers.set('sw-cache-date', Date.now().toString());

  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  await cache.put(request, modifiedResponse);
}

/**
 * Fetch and cache in background (fire and forget)
 */
async function fetchAndCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const response = await fetch(request);

    if (response.ok) {
      await cacheResponse(cache, request, response.clone());
    }
  } catch (error) {
    // Silent fail for background updates
    console.log('[Service Worker] Background fetch failed:', error.message);
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Serve cached version immediately, fetch fresh in background
 */
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Fetch fresh version in background
    const fetchPromise = fetch(request).then(async (response) => {
      if (response.ok) {
        await cacheResponse(cache, request, response.clone());
      }
      return response;
    });

    // Return cached version immediately if available
    if (cached) {
      console.log('[Service Worker] Serving stale data, revalidating:', request.url);

      // Check cache age
      const cacheDate = cached.headers.get('sw-cache-date');
      if (cacheDate && Date.now() - parseInt(cacheDate) < DATA_CACHE_AGE) {
        return cached;
      }

      // Cache is old, wait for fresh data
      return fetchPromise;
    }

    // No cache, wait for network
    return fetchPromise;
  } catch (error) {
    console.error('[Service Worker] Stale-while-revalidate failed:', error);

    // Try cache as fallback
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    throw error;
  }
}

/**
 * Navigation with Preload Strategy
 * Use navigation preload for instant HTML delivery
 */
async function navigationWithPreload(event, request, cacheName) {
  try {
    // Try to use preloaded response
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      console.log('[Service Worker] Using preloaded response:', request.url);
      return preloadResponse;
    }

    // Fallback to network-first
    return await networkFirst(request, cacheName);
  } catch (error) {
    console.error('[Service Worker] Navigation with preload failed:', error);
    return await networkFirst(request, cacheName);
  }
}

/**
 * Background Sync Event - Process entity sync queue
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-entities') {
    event.waitUntil(
      (async () => {
        try {
          // Notify clients to process sync queue
          const clients = await self.clients.matchAll();
          for (const client of clients) {
            client.postMessage({
              type: 'SYNC_ENTITIES_START',
              timestamp: Date.now(),
            });
          }

          console.log('[Service Worker] Entity sync notification sent');
        } catch (error) {
          console.error('[Service Worker] Background sync failed:', error);
        }
      })()
    );
  }

  // Legacy marker sync support
  if (event.tag === 'sync-markers') {
    event.waitUntil(
      (async () => {
        try {
          const clients = await self.clients.matchAll();
          for (const client of clients) {
            client.postMessage({
              type: 'SYNC_MARKERS_START',
              timestamp: Date.now(),
            });
          }

          console.log('[Service Worker] Marker sync notification sent');
        } catch (error) {
          console.error('[Service Worker] Marker sync failed:', error);
        }
      })()
    );
  }
});

/**
 * Message handler for SW updates and cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing all caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX))
            .map((name) => caches.delete(name))
        );
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_DATA_CACHE') {
    console.log('[Service Worker] Clearing data cache');
    event.waitUntil(caches.delete(CACHE_NAMES.data));
  }
});

console.log('[Service Worker] Service worker loaded');
