# E4-T6: Create Service Worker for Offline Support

**Epic**: Team & PWA (Week 7-8)
**Effort**: Large
**References**: Req 28 (PWA Offline), Design Section 2.3

## Description

Create and configure service worker with appropriate caching strategies for offline support, registration logic, and offline fallback page.

## Subtasks

### 6.1 Create service worker with caching strategy
- Create `public/sw.js` service worker
- Implement cache-first for static assets (JS, CSS, images)
- Implement network-first for API calls
- Cache app shell for offline access
- **Refs:** Req 28.4-28.5 (Offline Cache), Design Section 2.3
- **Effort:** L
- **Files:** `public/sw.js`

### 6.2 Create service worker registration
- Create `lib/service-worker.ts` registration helper
- Register SW on app load
- Handle SW update prompts
- **Refs:** Req 28 (PWA Setup), Design Section 2.3
- **Effort:** M
- **Files:** `lib/service-worker.ts`

### 6.3 Create offline fallback page
- Create `app/~offline/page.tsx`
- Display friendly offline message
- Show cached data if available
- Retry connection option
- **Refs:** Req 28.9 (Offline Indicator), Design Section 2.3
- **Effort:** S
- **Files:** `app/~offline/page.tsx`

## Acceptance Criteria

- [ ] Service worker caches static assets
- [ ] Network-first strategy for API calls
- [ ] App shell available offline
- [ ] Service worker registration works
- [ ] Update prompts display when new version available
- [ ] Offline page displays when no connection
- [ ] Cached data accessible offline

## Files to Create/Modify

- `public/sw.js`
- `lib/service-worker.ts`
- `app/~offline/page.tsx`
