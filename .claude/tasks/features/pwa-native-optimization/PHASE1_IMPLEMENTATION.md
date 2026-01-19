# Phase 1 Implementation - PWA Native App Optimization

**Status:** ✅ Complete
**Date:** 2026-01-19
**Implemented by:** Backend Engineer Agent

---

## Summary

Phase 1 of the PWA Native App Optimization plan has been successfully implemented. This phase establishes the foundation infrastructure layer for offline support across GenHub.

## Files Created

### 1. Enhanced IndexedDB Schema
**File:** `/lib/pwa/indexed-db.ts` (540 lines)

**New Stores:**
- `projects_cache` - Cached project list and details with company indexing
- `tasks_cache` - Cached task list with offline mutation tracking
- `form_drafts` - Form state persistence with auto-expiry
- `photo_queue` - Photos pending upload with retry logic
- `entity_sync_queue` - Generic sync queue for any entity type

**Key Features:**
- Schema versioning (v2) with migration logic
- Proper indexes for common queries (by-company, by-project, by-status, by-priority)
- Storage quota monitoring
- Auto-cleanup of expired data (>7 days)
- Type-safe TypeScript interfaces
- Transaction-based writes for data integrity

### 2. Generic Entity Sync Module
**File:** `/lib/pwa/entity-sync.ts` (530 lines)

**Core Functions:**
- `enqueueSync()` - Add entity to sync queue with priority
- `dequeueSynced()` - Remove after successful sync
- `getQueuedEntities()` - Get all pending syncs with filters
- `isOfflineAware()` - Check if entity supports offline
- `processSyncQueue()` - Process sync queue with batch processing
- `getSyncStats()` - Get sync queue statistics

**Supported Entities:**
- Tasks
- Projects
- Expenses
- Spatial markers
- Photos
- Notes
- Comments
- Any future entity type

**Features:**
- Priority-based sync (HIGH=8, NORMAL=5, LOW=2)
- Exponential backoff retry (3 attempts by default)
- Batch processing (10 items per batch)
- Background sync integration
- Configurable max retries per entity

### 3. Form Draft Persistence Service
**File:** `/lib/pwa/form-persistence.ts` (390 lines)

**Core Functions:**
- `saveFormDraft()` - Auto-save to IndexedDB (debounced 1 second)
- `loadFormDraft()` - Restore from IndexedDB
- `clearFormDraft()` - Delete draft after submit
- `listFormDrafts()` - Get all saved drafts with filters
- `cleanupExpiredDrafts()` - Remove drafts >7 days old
- `getDraftStats()` - Statistics about draft usage

**Features:**
- Auto-save with 1-second debounce
- 7-day expiry for drafts
- Draft age tracking (human-readable)
- Type filtering (task, expense, project, etc.)
- React hook wrapper: `useFormDraft()`

### 4. Service Worker Enhancements
**File:** `/public/sw.js` (Enhanced existing file)

**New Features:**
- **Navigation Preload** - Instant HTML delivery
- **Stale-While-Revalidate** - For project/task data (5-minute freshness)
- **Background Sync** - Entity queue sync events
- **Cache Versioning** - v2 with new data cache
- **Message Handlers** - CLEAR_DATA_CACHE support

**New Strategies:**
- `staleWhileRevalidate()` - Serve cached, revalidate in background
- `navigationWithPreload()` - Use preloaded HTML responses
- `sync` event handler - Process entity/marker sync queues

**Data Patterns:**
- `/api/projects` - Stale-while-revalidate
- `/api/projects/:id/tasks` - Stale-while-revalidate
- `/api/tasks` - Stale-while-revalidate

### 5. Photo Queue Service
**File:** `/lib/pwa/photo-queue.ts` (530 lines)

**Core Functions:**
- `queuePhoto()` - Add photo to upload queue
- `getQueuedPhotos()` - List pending uploads
- `markPhotoUploaded()` - Remove from queue after success
- `retryFailedPhotos()` - Retry with exponential backoff
- `processPhotoQueue()` - Upload photos in batches
- `getPhotoQueueStats()` - Queue statistics

**Features:**
- File blob storage in IndexedDB
- 10MB max photo size validation
- Image type validation
- Batch uploads (3 photos at a time)
- 5 retry attempts with exponential backoff
- Progress callbacks for UI updates
- Auto-upload on reconnection

**Supported Entities:**
- Tasks
- Markers
- Expenses
- Projects

### 6. Offline Data Hydration
**File:** `/lib/pwa/offline-hydration.ts` (580 lines)

**Core Functions:**
- `hydrateOfflineData()` - Load caches on app start
- `syncOnlineData()` - Refresh when connection available
- `watchConnectivity()` - Monitor online/offline state
- `getOfflineDataStatus()` - Cache freshness info
- `initializeOfflineSupport()` - Complete setup on app start
- `startBackgroundSync()` - Periodic sync (5 min intervals)

**Features:**
- Complete initialization flow
- Connectivity monitoring
- Periodic sync (5-minute intervals)
- Periodic cleanup (1-hour intervals)
- Cache freshness tracking
- Storage usage monitoring
- Sync progress callbacks
- Auto-sync on reconnection

---

## Technical Specifications

### Database Schema (IndexedDB v2)

```typescript
interface GenHubPWADB {
  projects_cache: {
    key: string; // projectId
    indexes: { 'by-company': string; 'by-cached': number };
  };
  tasks_cache: {
    key: string; // taskId
    indexes: {
      'by-project': string;
      'by-status': string;
      'by-pending': number;
      'by-cached': number;
    };
  };
  form_drafts: {
    key: string; // formId
    indexes: { 'by-type': string; 'by-expires': number };
  };
  photo_queue: {
    key: string; // queueId
    indexes: {
      'by-status': string;
      'by-entity': string;
      'by-created': number;
    };
  };
  entity_sync_queue: {
    key: string; // queueId
    indexes: {
      'by-status': string;
      'by-priority': number;
      'by-entity-type': string;
      'by-created': number;
    };
  };
}
```

### Storage Limits

- **Storage Warning:** 50MB remaining
- **Max Cache Age:** 7 days
- **Data Cache Age:** 5 minutes (stale-while-revalidate)
- **Max Photo Size:** 10MB
- **Max Photo Queue:** 100 photos
- **Draft Expiry:** 7 days

### Sync Configuration

- **Entity Sync Batch Size:** 10 items
- **Photo Upload Batch Size:** 3 photos
- **Max Retry Attempts (Entity):** 3
- **Max Retry Attempts (Photo):** 5
- **Retry Backoff (Entity):** 5s, 10s, 20s (exponential)
- **Retry Backoff (Photo):** 3s, 6s, 12s, 24s, 48s (exponential)
- **Background Sync Interval:** 5 minutes
- **Cleanup Interval:** 1 hour

---

## Integration Points

### Client Components
All modules are marked `'use client'` and safe for client-side use:
- `lib/pwa/indexed-db.ts` - No Supabase SDK
- `lib/pwa/entity-sync.ts` - Client-side only
- `lib/pwa/form-persistence.ts` - Client-side only
- `lib/pwa/photo-queue.ts` - Client-side only
- `lib/pwa/offline-hydration.ts` - Client-side only

### Server Integration
Service Worker enhanced to support:
- Background sync events (`sync-entities`, `sync-markers`)
- Navigation preload for instant page loads
- Stale-while-revalidate for data APIs

### Existing Spatial Module
Fully compatible with existing spatial IndexedDB (`genhub-spatial` database)

---

## Testing Checklist

### IndexedDB
- [x] All stores created with proper indexes
- [x] Schema versioning works (v2)
- [x] Storage estimates accurate
- [x] Cleanup removes expired data
- [x] Type safety enforced

### Entity Sync
- [x] Queue operations work (enqueue/dequeue)
- [x] Priority sorting works
- [x] Batch processing works
- [x] Retry logic with backoff
- [x] Offline awareness checks
- [x] Stats calculation accurate

### Form Persistence
- [x] Auto-save debouncing works
- [x] Drafts restore correctly
- [x] Expiry cleanup works
- [x] Draft age calculation accurate
- [x] Type filtering works

### Service Worker
- [x] Navigation preload enabled
- [x] Stale-while-revalidate works
- [x] Background sync events trigger
- [x] Cache versioning works
- [x] Message handlers respond

### Photo Queue
- [x] Photos queue successfully
- [x] File validation works (size, type)
- [x] Batch uploads work
- [x] Retry logic with backoff
- [x] Progress callbacks fire
- [x] Auto-upload on reconnection

### Offline Hydration
- [x] Hydration completes successfully
- [x] Sync processes all queues
- [x] Connectivity monitoring works
- [x] Status provides accurate info
- [x] Background sync runs periodically
- [x] Initialization flow complete

---

## Usage Examples

### Initialize Offline Support
```typescript
import { initializeOfflineSupport } from '@/lib/pwa/offline-hydration';

const { hydration, status, cleanup } = await initializeOfflineSupport({
  companyId: 'company-123',
  autoSync: true,
  onOnline: () => console.log('Online!'),
  onOffline: () => console.log('Offline!'),
});

console.log(`Loaded ${hydration.projectCount} projects, ${hydration.taskCount} tasks`);

// Cleanup on unmount
cleanup();
```

### Queue Entity for Sync
```typescript
import { enqueueSync, SYNC_PRIORITY } from '@/lib/pwa/entity-sync';

const syncId = await enqueueSync({
  entityType: 'task',
  operation: 'create',
  data: { title: 'Fix bug', projectId: 'proj-123' },
  priority: SYNC_PRIORITY.HIGH,
  metadata: {
    userId: 'user-123',
    companyId: 'company-123',
    projectId: 'proj-123',
  },
});
```

### Save Form Draft
```typescript
import { saveFormDraft, loadFormDraft } from '@/lib/pwa/form-persistence';

// Auto-save (debounced)
await saveFormDraft('create-task-123', 'task', formState);

// Restore on mount
const draft = await loadFormDraft('create-task-123');
if (draft) {
  setFormState(draft.data);
}
```

### Queue Photo for Upload
```typescript
import { queuePhoto } from '@/lib/pwa/photo-queue';

const photoId = await queuePhoto({
  entityType: 'task',
  entityId: 'task-123',
  file: photoFile,
  metadata: {
    userId: 'user-123',
    companyId: 'company-123',
    caption: 'Progress photo',
  },
});
```

### Monitor Offline Status
```typescript
import { getOfflineDataStatus } from '@/lib/pwa/offline-hydration';

const status = await getOfflineDataStatus();
console.log('Cache freshness:', status.isFresh);
console.log('Pending syncs:', status.syncQueue.pending);
console.log('Pending uploads:', status.photoQueue.pending);
```

---

## Performance Considerations

### IndexedDB
- All operations are async (non-blocking)
- Transactions used for data integrity
- Indexes optimize common queries
- Batch operations reduce overhead

### Storage
- Auto-cleanup prevents quota issues
- Storage monitoring warns at 50MB
- Expired data removed automatically
- Cache versioning invalidates old data

### Sync
- Batch processing reduces API calls
- Priority-based sync for critical data
- Exponential backoff prevents spam
- Background sync for battery efficiency

### Network
- Stale-while-revalidate minimizes wait time
- Navigation preload speeds up HTML delivery
- Photo uploads batched (3 at a time)
- Auto-sync only when online

---

## Next Steps (Future Phases)

### Phase 2: UI Integration
- Offline indicator component
- Sync progress UI
- Photo upload queue viewer
- Form draft recovery prompts
- Storage usage warnings

### Phase 3: Optimization
- Selective field updates (PATCH)
- Conflict resolution UI
- Optimistic UI updates
- Background fetch API
- Periodic background sync

### Phase 4: Advanced Features
- PWA install prompt
- Push notifications
- Share target API
- File handling API
- Badging API

---

## Known Limitations

1. **No Supabase in Client**: All modules use fetch API, not Supabase SDK
2. **No Conflict Resolution**: Last-write-wins for now
3. **No Partial Updates**: Full entity sync only
4. **Photo Limit**: 10MB per photo
5. **Queue Limit**: 100 photos max
6. **Cache Age**: 7 days max

---

## Dependencies

- `idb` (^8.0.0) - IndexedDB wrapper with Promise support
- No additional dependencies required

---

## Security Notes

- All auth handled by existing session
- No credentials stored in IndexedDB
- Photo blobs cleared after upload
- Expired data auto-deleted
- Company isolation via indexes

---

## Documentation References

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)

---

## Conclusion

Phase 1 is **production-ready** and provides a solid foundation for offline support. All modules are:

- ✅ Type-safe (TypeScript)
- ✅ Error-handled (try/catch)
- ✅ Logged (console messages)
- ✅ Client-safe (no Supabase SDK)
- ✅ Tested (integration checks)
- ✅ Documented (inline comments)

Ready for Phase 2 UI integration.
