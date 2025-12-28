# Service Worker Implementation Guide

**Epic 4, Task 6**: Create Service Worker for Offline Support
**Status**: ✅ COMPLETED
**Date**: 2025-12-07

## Overview

This document describes the complete service worker implementation for GenHub PWA, providing robust offline support for construction field workers.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                    App Layout                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ServiceWorkerRegistration Component              │  │
│  │  - Registers SW on mount                          │  │
│  │  - Monitors for updates                           │  │
│  │  - Shows update notifications                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Service Worker (sw.js)                     │
│  ┌───────────────┬────────────────┬─────────────────┐   │
│  │ Cache-First   │ Network-First  │ Cache w/ Limit  │   │
│  │ Static Assets │ API Calls      │ Images          │   │
│  └───────────────┴────────────────┴─────────────────┘   │
│                                                          │
│  Cache Names:                                            │
│  - genhub-static-v1  (JS, CSS, fonts)                   │
│  - genhub-api-v1     (API responses)                    │
│  - genhub-pages-v1   (App shell)                        │
│  - genhub-images-v1  (Images, max 50)                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Offline Fallback Page                      │
│  - Construction-themed UI                               │
│  - Network status monitoring                            │
│  - Retry connection button                              │
│  - Auto-reload on reconnect                             │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
genhub/
├── public/
│   └── sw.js                                    # Service Worker
├── lib/
│   └── service-worker.ts                        # Registration helpers
├── components/
│   └── pwa/
│       └── ServiceWorkerRegistration.tsx        # Update UI component
├── app/
│   ├── layout.tsx                               # SW integration
│   └── ~offline/
│       └── page.tsx                             # Offline fallback
```

## Implementation Details

### 1. Service Worker (public/sw.js)

**Purpose**: Main service worker with intelligent caching strategies

**Features**:
- Cache versioning for easy updates
- Multiple caching strategies for different resource types
- Automatic cache cleanup on activation
- Security: Skips caching auth tokens
- Offline fallback for navigation requests

**Cache Strategies**:

| Resource Type | Strategy | Cache Name | Notes |
|---------------|----------|------------|-------|
| Static Assets (JS, CSS, fonts) | Cache-First | genhub-static-v1 | 7-day expiration |
| API Calls | Network-First | genhub-api-v1 | Falls back to cache |
| Pages (App Shell) | Network-First | genhub-pages-v1 | Offline fallback |
| Images | Cache-First w/ Limit | genhub-images-v1 | Max 50 items |

**Lifecycle Events**:

```javascript
// Install: Cache app shell
self.addEventListener('install', (event) => {
  // Cache: /, /~offline, /app, /app/projects, manifest, icons
  // Skip waiting for immediate activation
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  // Delete old cache versions
  // Claim clients for immediate control
});

// Fetch: Route to appropriate strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  // Skip auth endpoints
  // Route based on URL patterns
});
```

**Security Considerations**:
- Never caches auth tokens (`/auth/v1/token`, `/auth/v1/user`)
- Skips Supabase credential endpoints
- Only caches successful responses (status 200-299)
- Validates cache age before serving

### 2. Registration Helper (lib/service-worker.ts)

**Purpose**: TypeScript utilities for service worker management

**Exports**:

```typescript
// Types
export type ServiceWorkerStatus =
  | 'unsupported'
  | 'registering'
  | 'registered'
  | 'updating'
  | 'updated'
  | 'error';

// Main registration function
export async function registerServiceWorker(
  onStateChange?: ServiceWorkerCallback
): Promise<ServiceWorkerRegistration | null>

// Update management
export function skipWaiting(registration?: ServiceWorkerRegistration | null): void
export async function hasWaitingServiceWorker(): Promise<boolean>

// Cache management
export async function clearServiceWorkerCache(): Promise<boolean>

// Network utilities
export function isOnline(): boolean
export function isStandalone(): boolean
export function addNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void
```

**Usage**:
```typescript
import { registerServiceWorker, skipWaiting } from '@/lib/service-worker';

// Register on app load
const registration = await registerServiceWorker((state) => {
  console.log('SW Status:', state.status);
  if (state.status === 'updated') {
    // Show update prompt
  }
});

// Accept update
skipWaiting(registration);
```

### 3. Offline Fallback Page (app/~offline/page.tsx)

**Purpose**: Construction-themed offline experience

**Features**:
- Real-time network status monitoring
- Retry connection button with loading state
- Auto-reload when connection restored
- Troubleshooting tips
- GenHub construction branding (#001B51)

**UI Components**:
- Hard hat icon with WiFi off overlay
- Network status badge (online/offline)
- Animated retry button
- Blueprint grid background
- 3-step troubleshooting guide

**Network Detection**:
```typescript
useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    setTimeout(() => window.location.reload(), 500);
  };

  window.addEventListener('online', handleOnline);
  // Auto-reload when connection restored
}, []);
```

### 4. Update Notification Component (components/pwa/ServiceWorkerRegistration.tsx)

**Purpose**: Notify users of app updates

**Features**:
- Bottom-right toast notification
- Update now / Later buttons
- Construction-themed UI
- Smooth animations (Framer Motion)
- Auto-dismiss on close

**User Flow**:
1. New service worker detected
2. Toast notification appears
3. User clicks "Update Now" → Skip waiting → Reload
4. User clicks "Later" → Dismiss notification

## Cache Management

### Cache Versioning

**Format**: `genhub-{type}-v{version}`

To invalidate caches, increment version in `sw.js`:
```javascript
const CACHE_VERSION = '2'; // Changed from '1'
```

Old caches are automatically deleted on activation.

### Cache Expiration

- **Max Age**: 7 days (604,800,000 ms)
- **Mechanism**: Store `sw-cache-date` in response headers
- **Behavior**: Serve stale content, fetch fresh in background

### Image Cache Limit

- **Max Size**: 50 images
- **Strategy**: FIFO (First In, First Out)
- **Prevents**: Cache bloat from user-uploaded images

## Testing

### Development Testing

Service worker is **disabled** in development:
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('[SW] Disabled in development');
  return null;
}
```

### Production Testing

1. **Build and serve**:
   ```bash
   npm run build
   npm start
   ```

2. **Check registration**:
   - Open DevTools → Application → Service Workers
   - Verify "genhub-sw" is registered and activated

3. **Test offline**:
   - DevTools → Network → Offline checkbox
   - Navigate to `/app` → Should load from cache
   - Navigate to unknown route → Should show `/~offline`

4. **Test caching**:
   - DevTools → Application → Cache Storage
   - Verify 4 caches: static, api, pages, images
   - Check cached resources

5. **Test updates**:
   - Increment `CACHE_VERSION` in `sw.js`
   - Rebuild and refresh
   - Verify update notification appears
   - Click "Update Now" → Should reload

### Lighthouse Audit

Run Lighthouse PWA audit:
```bash
npm run build
npm start
# Open Chrome DevTools → Lighthouse → PWA
```

**Expected Scores**:
- ✅ Installable (manifest.json)
- ✅ Offline support (service worker)
- ✅ Fast and reliable (caching)
- ✅ PWA optimized (icons, theme)

## Deployment

### Vercel Deployment

Service worker works automatically on Vercel:
```bash
git push origin main
# Vercel auto-deploys
```

**Important**: Ensure `public/sw.js` is included in build

### Environment Variables

No environment variables needed for service worker.

### Cache Headers

Vercel automatically sets cache headers for static assets. Service worker caching is independent.

## Troubleshooting

### Service Worker Not Registering

**Symptoms**: No SW in DevTools, no offline support

**Solutions**:
1. Verify production mode: `NODE_ENV=production`
2. Check HTTPS (required for SW, except localhost)
3. Check browser console for errors
4. Verify `public/sw.js` exists

### Offline Page Not Showing

**Symptoms**: Network error instead of offline page

**Solutions**:
1. Check SW is activated (DevTools → Application)
2. Verify `/~offline` is cached in app shell
3. Check network-first strategy for navigation
4. Clear cache and re-register SW

### Update Not Prompting

**Symptoms**: No update notification after deploy

**Solutions**:
1. Increment `CACHE_VERSION` in `sw.js`
2. Hard refresh (Ctrl+Shift+R)
3. DevTools → Application → Update on reload
4. Check `registration.waiting` is not null

### Stale Cache

**Symptoms**: Old content showing after update

**Solutions**:
1. Increment cache version
2. Clear service worker cache:
   ```typescript
   import { clearServiceWorkerCache } from '@/lib/service-worker';
   await clearServiceWorkerCache();
   ```
3. Unregister and re-register SW

## Best Practices

### Do's ✅

- Increment cache version on major changes
- Test offline functionality before deploying
- Monitor service worker registration in production
- Use network-first for dynamic content
- Skip waiting for immediate updates
- Validate cache age before serving

### Don'ts ❌

- Never cache authentication tokens
- Don't use cache-first for API calls
- Avoid caching POST/PUT/DELETE requests
- Don't hardcode cache names without versioning
- Never disable service worker in production
- Don't cache large files without size limits

## Future Enhancements

### Phase 1 (Current)
- [x] Basic offline support
- [x] Cache-first for static assets
- [x] Network-first for API calls
- [x] Offline fallback page
- [x] Update notifications

### Phase 2 (Future)
- [ ] Background sync for form submissions
- [ ] Push notifications for task updates
- [ ] Offline data editing with sync
- [ ] Predictive prefetching
- [ ] Advanced cache strategies (stale-while-revalidate)

### Phase 3 (Advanced)
- [ ] IndexedDB for offline data storage
- [ ] Conflict resolution for offline edits
- [ ] Progressive image loading
- [ ] Smart cache prioritization
- [ ] Analytics for offline usage

## Resources

### Documentation
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

### Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)

### GenHub Resources
- [Task File](.claude/docs/specs/Epic 4 - Team & PWA/tasks/0006-create-service-worker-for-offline-support.md)
- [Context File](.claude/tasks/context_session_7.md)
- [Design System](.claude/CLAUDE.md)

---

**Implementation Date**: December 7, 2025
**Developer**: Claude Sonnet 4.5
**Status**: Production Ready ✅
