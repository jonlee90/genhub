# EST-P3-003: Offline Mode

**Parent Task:** `EST-P3-003` in `tasks-phase3-phase4.md`
**Priority:** P2 - Future
**Total Effort:** ~4.5 days
**Dependencies:** None (PWA infrastructure — no upstream estimate tasks required)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P3-003-A | Service worker | frontend-engineer | 1.0d | — |
| P3-003-B | Sync manager (IndexedDB) | frontend-engineer | 1.0d | — |
| P3-003-C | Conflict resolver | frontend-engineer | 0.5d | P3-003-B |
| P3-003-D | OfflineBanner + SyncStatus | frontend-engineer | 0.5d | — |
| P3-003-E | syncOfflineChanges server action | backend-engineer | 0.5d | — |
| P3-003-F | Layout registration + TabClient wire-up | frontend-engineer | 0.5d | P3-003-A, P3-003-C, P3-003-D, P3-003-E |

---

## P3-003-A: Service Worker

**Agent:** frontend-engineer
**Effort:** 1.0 days

**Files:**
- `public/sw.js` (new)

**Task:**
Vanilla JS service worker (no React). Two caching strategies:

**Network-first (API routes + Server Actions):**
- `/api/**` — try network, fall back to cache for GET requests
- `/_next/data/**` — try network, fall back to cache

**Cache-first (static assets + images):**
- `/_next/static/**` — cache first, serve instantly
- `/uploads/**`, `/storage/**` — cache first (plan images)

Cache names: `genhub-api-v1`, `genhub-static-v1`, `genhub-images-v1`

Background Sync for uploads:
```javascript
// Register sync tag when upload fails offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-plans') {
    event.waitUntil(replayQueuedUploads())
  }
})
```

Activate: claim clients immediately, delete old caches on activate.

**Acceptance Criteria:**
- [ ] Static assets served from cache when offline
- [ ] API responses cached for last-accessed estimates
- [ ] Background Sync tag `upload-plans` registered
- [ ] Old cache versions cleaned on SW activate
- [ ] No TypeScript (plain JS — service worker environment)

---

## P3-003-B: Sync Manager (IndexedDB)

**Agent:** frontend-engineer
**Effort:** 1.0 days

**Files:**
- `lib/offline/sync-manager.ts` (new)

**Task:**
IndexedDB wrapper using `idb` package (3KB, Promise-based API).

**IndexedDB schema:**
```typescript
interface OfflineDB {
  edits: {
    key: string                   // `${estimateId}:${itemId}:${field}`
    value: {
      estimateId: string
      itemId: string
      field: string
      value: unknown
      timestamp: number
      synced: boolean
    }
  }
  uploads: {
    key: string                   // UUID
    value: {
      id: string
      estimateId: string
      fileBlob: Blob
      filename: string
      timestamp: number
      synced: boolean
    }
  }
  deletions: {
    key: string                   // itemId
    value: {
      itemId: string
      estimateId: string
      timestamp: number
      synced: boolean
    }
  }
}
```

**Exported functions:**
```typescript
export async function queueEdit(edit: EditRecord): Promise<void>
export async function queueUpload(upload: UploadRecord): Promise<void>
export async function queueDeletion(deletion: DeletionRecord): Promise<void>
export async function getPendingChanges(): Promise<{ edits: EditRecord[]; uploads: UploadRecord[]; deletions: DeletionRecord[] }>
export async function markSynced(type: 'edit' | 'upload' | 'deletion', key: string): Promise<void>
export async function clearSynced(): Promise<void>
```

**Skills Applied:**
- `async-parallel` — parallel `Promise.all` for batch mark-synced

**Acceptance Criteria:**
- [ ] Data persists across browser tab close/reopen
- [ ] `getPendingChanges` returns only un-synced items
- [ ] `markSynced` updates `synced: true` without deleting
- [ ] `clearSynced` removes all `synced: true` records

---

## P3-003-C: Conflict Resolver

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P3-003-B

**Files:**
- `lib/offline/conflict-resolver.ts` (new)

**Task:**
Timestamp-based conflict resolution for syncing queued edits against server state.

```typescript
export interface SyncConflict {
  itemId: string
  field: string
  localValue: unknown
  localTimestamp: number
  serverValue: unknown
  serverTimestamp: number
  resolution: 'local_wins' | 'server_wins'
}

export function resolveEditConflicts(
  localEdits: EditRecord[],
  serverUpdates: Array<{ itemId: string; field: string; value: unknown; updatedAt: string }>
): {
  toApply: EditRecord[]       // local edits that won
  conflicts: SyncConflict[]   // conflicts where server won
}
```

Newer timestamp wins. Server timestamps use `updatedAt` column. Log conflicts for toast display.

**Acceptance Criteria:**
- [ ] Local edit with newer timestamp is applied
- [ ] Server value with newer timestamp causes `server_wins` conflict
- [ ] All conflicts returned for user notification
- [ ] Pure function, no side effects

---

## P3-003-D: OfflineBanner + SyncStatus Components

**Agent:** frontend-engineer
**Effort:** 0.5 days

**Files:**
- `components/estimates/OfflineBanner.tsx` (new)
- `components/estimates/SyncStatus.tsx` (new)

**Task:**

**`OfflineBanner`:**
- Fixed top bar when `!navigator.onLine`
- Yellow background, "You're offline. Changes will sync when connected."
- "Sync Now" button (manual trigger)
- Disappears when back online
- Use ternary, not `&&`

```typescript
interface OfflineBannerProps {
  onSyncNow: () => void
  pendingCount: number
}
```

**`SyncStatus`:**
- Small indicator in estimate header (icon + text)
- States: `idle` | `syncing` | `error` | `synced`
- `idle`: CloudOff icon (gray)
- `syncing`: Loader icon (animate-spin)
- `error`: CloudX icon (red) + retry button
- `synced`: CloudCheck icon (green, fades after 3s)

**Mobile Checks:**
- [ ] Banner is accessible (role="alert", aria-live="polite")
- [ ] "Sync Now" button is `min-h-[44px]`
- [ ] `active:scale-95` on sync button
- [ ] `dark:` variants on banner and status indicator

**Acceptance Criteria:**
- [ ] Banner appears on offline, disappears on online
- [ ] `pendingCount` shows number of queued changes
- [ ] SyncStatus cycles through states correctly

---

## P3-003-E: syncOfflineChanges Server Action

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `app/actions/estimates.ts` (add to existing file)

**Signature:**
```typescript
syncOfflineChanges(payload: {
  edits: Array<{
    itemId: string
    estimateId: string
    field: string
    value: unknown
    timestamp: number
  }>
  deletions: Array<{
    itemId: string
    estimateId: string
    timestamp: number
  }>
}): Promise<{
  applied: string[]           // itemIds successfully applied
  conflicts: SyncConflict[]   // where server was newer
  errors: string[]
}>
```

Logic:
1. For each edit: fetch current `updated_at` from DB
2. If `edit.timestamp > serverUpdatedAt`: apply update
3. If `edit.timestamp <= serverUpdatedAt`: mark as server_wins conflict
4. For deletions: soft-delete if item exists and timestamp > server
5. Return summary for client conflict display

**Acceptance Criteria:**
- [ ] Only applies changes newer than server state
- [ ] Returns conflict list for UI display
- [ ] Validates company_id for all items
- [ ] Transaction-safe: partial success is OK, per-item error isolation

---

## P3-003-F: Layout Registration + TabClient Wire-up

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P3-003-A, P3-003-C, P3-003-D, P3-003-E

**Files:**
- `app/layout.tsx` (modified — SW registration)
- `components/estimates/EstimatesTabClient.tsx` (modified — offline detection + sync trigger)

**Task:**

**`app/layout.tsx`:**
Register the service worker on mount (client-side only):
```typescript
// In a 'use client' component or useEffect in layout
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```
Use a lightweight `ServiceWorkerRegistrar` client component to avoid making layout a client component.

**`EstimatesTabClient.tsx`:**
- `useEffect`: add `window.addEventListener('online', handleSync)` + remove on cleanup
- Track `isOnline = navigator.onLine` with `online`/`offline` events
- `pendingCount` from `getPendingChanges()` count (refresh on change)
- `handleSync`: call `syncOfflineChanges`, show conflict toasts if any
- Render `<OfflineBanner>` and `<SyncStatus>` based on state
- All edits in offline state: queue via `queueEdit` instead of direct server action

**Skills Applied:**
- `rendering-conditional-render` — ternary for offline banner
- `async-parallel` — parallel `getPendingChanges` count refresh

**Acceptance Criteria:**
- [ ] Service worker registers on first load (check DevTools > Application > SW)
- [ ] Edits queued when offline
- [ ] Auto-sync fires on `online` event
- [ ] Manual "Sync Now" triggers sync flow
- [ ] Conflict toast shown for server-wins conflicts
- [ ] Build passes with no TS errors
