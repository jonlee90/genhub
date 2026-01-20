# PWA Optimization Reference

> Service workers, caching, offline support, and performance for GenHub PWA

---

## PWA Setup for Next.js 15

### Install Serwist (Recommended for Next.js)

```bash
npm install @serwist/next serwist
```

### Configuration

```ts
// next.config.ts
import withSerwist from "@serwist/next"

const nextConfig = {
  // ... your Next.js config
}

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
})(nextConfig)
```

### Service Worker

```ts
// app/sw.ts
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry } from "serwist"
import { Serwist } from "serwist"

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[]
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

### Web App Manifest

```json
// public/manifest.json
{
  "name": "GenHub - Construction Management",
  "short_name": "GenHub",
  "description": "Construction project management for general contractors",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#001B51",
  "theme_color": "#001B51",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-dashboard.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["business", "productivity"],
  "prefer_related_applications": false
}
```

### Metadata in Layout

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'GenHub',
  description: 'Construction project management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GenHub',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#001B51',
}
```

---

## Caching Strategies

### Strategy Overview

| Strategy | Use Case | Behavior |
|----------|----------|----------|
| **Cache First** | Static assets, fonts | Check cache, fallback to network |
| **Network First** | API data, user content | Try network, fallback to cache |
| **Stale While Revalidate** | Semi-dynamic content | Return cache, update in background |
| **Network Only** | Auth, real-time data | Always fetch from network |
| **Cache Only** | Offline-critical assets | Only serve from cache |

### Implementing Custom Caching

```ts
// app/sw.ts
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from "serwist"

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    // Static assets - Cache First
    {
      matcher: ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font',
      handler: new CacheFirst({
        cacheName: 'static-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },

    // Images - Cache First with limit
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new CacheFirst({
        cacheName: 'images',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },

    // API calls - Stale While Revalidate
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new StaleWhileRevalidate({
        cacheName: 'api-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          }),
        ],
      }),
    },

    // Supabase API - Network First
    {
      matcher: ({ url }) =>
        url.hostname.includes('supabase.co'),
      handler: new NetworkFirst({
        cacheName: 'supabase-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60, // 1 minute
          }),
        ],
      }),
    },

    // App shell pages - Stale While Revalidate
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new StaleWhileRevalidate({
        cacheName: 'pages',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
  ],
})
```

---

## Offline-First Patterns

### 1. Offline Detection Hook

```tsx
// lib/hooks/useOnlineStatus.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      if (!isOnline) {
        setWasOffline(true)
        // Auto-hide "back online" message after 3s
        setTimeout(() => setWasOffline(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  return { isOnline, wasOffline }
}
```

### 2. Offline Banner Component

```tsx
// components/mobile/OfflineBanner.tsx
'use client'

import { WifiOff, Wifi } from 'lucide-react'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()

  if (isOnline && !wasOffline) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100]",
        "pt-[env(safe-area-inset-top)]",
        "transition-all duration-300",
        isOnline
          ? "bg-[#059669] translate-y-0"
          : "bg-[#DC2626] translate-y-0"
      )}
    >
      <div className="flex items-center justify-center gap-2 py-2 px-4">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              Back online - syncing changes...
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              You are offline - changes will sync later
            </span>
          </>
        )}
      </div>
    </div>
  )
}
```

### 3. Offline Queue for Mutations

```tsx
// lib/offline/syncQueue.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface SyncQueueDB extends DBSchema {
  'pending-mutations': {
    key: string
    value: {
      id: string
      action: string
      payload: Record<string, unknown>
      createdAt: number
      retryCount: number
    }
  }
}

class SyncQueue {
  private db: IDBPDatabase<SyncQueueDB> | null = null

  async init() {
    if (this.db) return

    this.db = await openDB<SyncQueueDB>('genhub-sync', 1, {
      upgrade(db) {
        db.createObjectStore('pending-mutations', { keyPath: 'id' })
      },
    })
  }

  async add(action: string, payload: Record<string, unknown>) {
    await this.init()

    const mutation = {
      id: crypto.randomUUID(),
      action,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    }

    await this.db!.put('pending-mutations', mutation)
    return mutation.id
  }

  async getAll() {
    await this.init()
    return this.db!.getAll('pending-mutations')
  }

  async remove(id: string) {
    await this.init()
    await this.db!.delete('pending-mutations', id)
  }

  async processQueue(handlers: Record<string, (payload: any) => Promise<boolean>>) {
    const mutations = await this.getAll()

    for (const mutation of mutations) {
      const handler = handlers[mutation.action]
      if (!handler) continue

      try {
        const success = await handler(mutation.payload)
        if (success) {
          await this.remove(mutation.id)
        } else {
          // Increment retry count
          mutation.retryCount++
          await this.db!.put('pending-mutations', mutation)
        }
      } catch (error) {
        console.error(`Failed to process ${mutation.action}:`, error)
        mutation.retryCount++
        await this.db!.put('pending-mutations', mutation)
      }
    }
  }
}

export const syncQueue = new SyncQueue()
```

### 4. Using the Sync Queue

```tsx
// app/actions/tasks.ts (modified for offline support)
'use server'

import { createClient } from '@/utils/supabase/server'

export async function createTaskAction(data: TaskInput) {
  const supabase = await createClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return task
}

// Client-side wrapper with offline support
// lib/actions/offlineAwareActions.ts
'use client'

import { syncQueue } from '@/lib/offline/syncQueue'
import { createTaskAction } from '@/app/actions/tasks'

export async function createTask(data: TaskInput) {
  if (!navigator.onLine) {
    // Queue for later
    await syncQueue.add('createTask', data)

    // Return optimistic result
    return {
      ...data,
      id: `temp-${Date.now()}`,
      _pending: true,
    }
  }

  return createTaskAction(data)
}

// Sync handler (run when back online)
export async function processSyncQueue() {
  await syncQueue.processQueue({
    createTask: async (payload) => {
      try {
        await createTaskAction(payload)
        return true
      } catch {
        return false
      }
    },
  })
}
```

### 5. Background Sync Registration

```ts
// In service worker (app/sw.ts)
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncMutations())
  }
})

async function syncMutations() {
  // This runs in service worker context
  // Send message to client to process queue
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_MUTATIONS' })
  })
}

// Register sync in client
// lib/offline/registerSync.ts
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register('sync-mutations')
  }
}
```

---

## Performance Optimization

### 1. Core Web Vitals Targets

| Metric | Target | Construction Context |
|--------|--------|---------------------|
| **LCP** | < 2.5s | Fast load on job site 4G |
| **FID** | < 100ms | Instant tap response |
| **CLS** | < 0.1 | No layout jumps |
| **INP** | < 200ms | Smooth interactions |
| **TTFB** | < 800ms | Server response |

### 2. Image Optimization

```tsx
// Always use next/image for automatic optimization
import Image from 'next/image'

// Project thumbnail - responsive with placeholder
<div className="relative aspect-video rounded-lg overflow-hidden">
  <Image
    src={project.thumbnail}
    alt={project.name}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
    placeholder="blur"
    blurDataURL={project.thumbnailBlur}
    priority={isAboveFold}
  />
</div>

// Avatar with fallback
<div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
  {user.avatar ? (
    <Image
      src={user.avatar}
      alt={user.name}
      fill
      sizes="40px"
      className="object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <User className="w-5 h-5 text-gray-400" />
    </div>
  )}
</div>
```

### 3. Code Splitting

```tsx
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

// Load heavy chart component only when needed
const ProjectChart = dynamic(
  () => import('@/components/charts/ProjectChart'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false
  }
)

// Load 3D viewer only on demand
const SpatialViewer = dynamic(
  () => import('@/components/spatial/SpatialViewer'),
  {
    loading: () => <SpatialViewerSkeleton />,
    ssr: false
  }
)
```

### 4. Prefetching Strategy

```tsx
// Prefetch likely next pages
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProjectCard({ project }) {
  const router = useRouter()

  // Prefetch detail page on hover/focus
  const handleFocus = () => {
    router.prefetch(`/projects/${project.id}`)
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      onFocus={handleFocus}
      onMouseEnter={handleFocus}
      className="..."
    >
      {/* Card content */}
    </Link>
  )
}
```

### 5. Bundle Size Monitoring

```tsx
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
    ],
  },
}
```

```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

---

## Install Prompt

### Custom Install Banner

```tsx
// components/mobile/InstallPrompt.tsx
'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show custom prompt after delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
  }

  if (!showPrompt || isInstalled) return null

  return (
    <div className="
      fixed bottom-24 left-4 right-4 z-50
      bg-white rounded-xl shadow-xl
      border border-gray-200
      p-4
      animate-in slide-in-from-bottom duration-300
    ">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>

      <div className="flex items-start gap-4">
        <div className="
          w-12 h-12 rounded-xl
          bg-[#001B51] flex items-center justify-center
          flex-shrink-0
        ">
          <Download className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#001B51]">
            Install GenHub
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Add to home screen for quick access and offline support
          </p>

          <button
            onClick={handleInstall}
            className="
              mt-3 px-4 py-2
              bg-[#001B51] text-white
              text-sm font-semibold
              rounded-lg
              active:scale-95
              transition-transform
            "
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Push Notifications

### Setup (using Firebase Cloud Messaging)

```tsx
// lib/notifications/fcm.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission()

  if (permission === 'granted') {
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    })

    // Send token to backend
    await saveTokenToServer(token)

    return token
  }

  return null
}

export function onForegroundMessage(callback: (payload: any) => void) {
  const messaging = getMessaging(app)
  return onMessage(messaging, callback)
}
```

### Notification Permission Request

```tsx
// components/mobile/NotificationPrompt.tsx
'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/notifications/fcm'

export function NotificationPrompt() {
  const [show, setShow] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)

  const handleEnable = async () => {
    setIsRequesting(true)
    try {
      await requestNotificationPermission()
    } finally {
      setIsRequesting(false)
      setShow(false)
    }
  }

  if (!show) return null

  return (
    <div className="
      bg-blue-50 border-l-4 border-l-[#001B51]
      p-4 rounded-r-lg mx-4 my-4
    ">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-[#001B51] mt-0.5" />

        <div className="flex-1">
          <h4 className="font-semibold text-[#001B51]">
            Stay updated
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Get notified about task assignments and project updates
          </p>

          <div className="flex gap-3 mt-3">
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="
                px-4 py-2
                bg-[#001B51] text-white
                text-sm font-medium rounded-lg
                disabled:opacity-50
              "
            >
              {isRequesting ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={() => setShow(false)}
              className="
                px-4 py-2
                text-gray-600 text-sm
              "
            >
              Not now
            </button>
          </div>
        </div>

        <button onClick={() => setShow(false)}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  )
}
```

---

## Testing & Debugging

### Lighthouse PWA Audit

```bash
# Run Lighthouse PWA audit
npx lighthouse http://localhost:3000 --only-categories=pwa --view

# Key checks:
# - Installable
# - Service worker registered
# - Works offline
# - HTTPS (in production)
# - Web app manifest
```

### Service Worker Debugging

```ts
// Debug service worker in browser DevTools
// Application > Service Workers

// Force update during development
self.skipWaiting()

// Log cache operations
caches.keys().then(names => console.log('Caches:', names))
```

### Offline Testing

1. Chrome DevTools > Network > Offline checkbox
2. Or Application > Service Workers > Offline
3. Test all critical user flows offline
4. Verify sync queue processes when back online

### Performance Monitoring

```tsx
// Report Web Vitals
// app/layout.tsx
import { reportWebVitals } from '@/lib/analytics/vitals'

export function generateMetadata() {
  return {
    other: {
      'report-vitals': 'true',
    },
  }
}

// lib/analytics/vitals.ts
export function reportWebVitals(metric: {
  id: string
  name: string
  value: number
}) {
  // Send to analytics
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
    })
  }
}
```

---

## Checklist

### PWA Requirements

- [ ] manifest.json with all required fields
- [ ] Icons: 192px and 512px (plus maskable)
- [ ] Service worker registered and active
- [ ] HTTPS enabled (production)
- [ ] Viewport meta tag configured
- [ ] theme-color meta tag set

### Offline Support

- [ ] App shell cached
- [ ] Critical assets precached
- [ ] API responses cached (stale-while-revalidate)
- [ ] Offline fallback page
- [ ] Sync queue for mutations
- [ ] Offline indicator UI

### Performance

- [ ] LCP < 2.5s on 4G
- [ ] First load JS < 200KB
- [ ] Images optimized with next/image
- [ ] Code splitting for routes
- [ ] Font optimization (system fonts preferred)
