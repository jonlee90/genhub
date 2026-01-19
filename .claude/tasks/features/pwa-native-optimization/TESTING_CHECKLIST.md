# Phase 1 Testing Checklist

## Pre-Testing Setup

- [ ] Install dependencies: `npm install` (idb should already be installed)
- [ ] Build project: `npm run build`
- [ ] Verify no TypeScript errors
- [ ] Verify service worker registration works
- [ ] Open browser DevTools (Application tab)

---

## 1. IndexedDB Schema Tests

### Database Creation
- [ ] Open IndexedDB in DevTools (Application > Storage > IndexedDB)
- [ ] Verify `genhub-pwa` database exists with version 2
- [ ] Verify all 5 stores exist:
  - [ ] `projects_cache`
  - [ ] `tasks_cache`
  - [ ] `form_drafts`
  - [ ] `photo_queue`
  - [ ] `entity_sync_queue`

### Indexes
- [ ] `projects_cache` has indexes: `by-company`, `by-cached`
- [ ] `tasks_cache` has indexes: `by-project`, `by-status`, `by-pending`, `by-cached`
- [ ] `form_drafts` has indexes: `by-type`, `by-expires`
- [ ] `photo_queue` has indexes: `by-status`, `by-entity`, `by-created`
- [ ] `entity_sync_queue` has indexes: `by-status`, `by-priority`, `by-entity-type`, `by-created`

### Basic Operations
```javascript
// In browser console
import { cacheProjects, getCachedProjects } from '@/lib/pwa';

// Test cache project
await cacheProjects([{
  id: 'test-1',
  name: 'Test Project',
  status: 'active',
  address: '123 Main St',
  companyId: 'company-1',
  managerId: 'user-1',
  data: {},
}]);

// Test retrieve
const projects = await getCachedProjects('company-1');
console.log('Projects:', projects); // Should show 1 project
```

- [ ] Cache operations work
- [ ] Retrieve operations work
- [ ] Company filtering works
- [ ] Storage estimate returns values

---

## 2. Entity Sync Tests

### Queue Operations
```javascript
import { enqueueSync, getQueuedEntities, SYNC_PRIORITY } from '@/lib/pwa';

// Test enqueue
const syncId = await enqueueSync({
  entityType: 'task',
  operation: 'create',
  data: { title: 'Test Task' },
  priority: SYNC_PRIORITY.HIGH,
  metadata: {
    userId: 'user-1',
    companyId: 'company-1',
  },
});
console.log('Sync ID:', syncId);

// Test retrieve
const entities = await getQueuedEntities({ status: 'pending' });
console.log('Queued entities:', entities);
```

- [ ] Enqueue creates entry in IndexedDB
- [ ] Priority sorting works (high priority first)
- [ ] Status filtering works
- [ ] Entity type filtering works

### Sync Processing
```javascript
import { processSyncQueue } from '@/lib/pwa';

// Test sync (will fail without server, but should try)
const progress = await processSyncQueue((p) => {
  console.log('Progress:', p);
});
console.log('Final:', progress);
```

- [ ] Batch processing works
- [ ] Progress callbacks fire
- [ ] Retry logic works (check attempts in IndexedDB)
- [ ] Failed items marked as 'error'

### Offline Awareness
```javascript
import { isOfflineAware } from '@/lib/pwa';

console.log('task:', isOfflineAware('task')); // true
console.log('unknown:', isOfflineAware('unknown')); // false
```

- [ ] Returns true for supported types
- [ ] Returns false for unsupported types

---

## 3. Form Persistence Tests

### Save and Load
```javascript
import { saveFormDraft, loadFormDraft } from '@/lib/pwa';

// Test save
await saveFormDraft('test-form-1', 'task', {
  title: 'Test Task',
  description: 'Test description',
}, { immediate: true });

// Test load
const draft = await loadFormDraft('test-form-1');
console.log('Draft:', draft);
```

- [ ] Save creates entry in `form_drafts`
- [ ] Load retrieves correct data
- [ ] Immediate save bypasses debounce
- [ ] Debounced save delays by 1 second

### Expiry and Cleanup
```javascript
import { listFormDrafts, cleanupExpiredDrafts } from '@/lib/pwa';

// Create expired draft (modify expiresAt in IndexedDB manually)
// Then run cleanup
const deleted = await cleanupExpiredDrafts();
console.log('Deleted:', deleted);
```

- [ ] List shows all drafts
- [ ] Expired drafts filtered out (unless `includeExpired: true`)
- [ ] Cleanup removes expired drafts
- [ ] Type filtering works

### Draft Age
```javascript
import { getDraftAge } from '@/lib/pwa';

const age = getDraftAge(Date.now() - 5 * 60 * 1000); // 5 minutes ago
console.log('Age:', age); // "5 minutes ago"
```

- [ ] Age calculation accurate
- [ ] Human-readable format correct

---

## 4. Service Worker Tests

### Registration
- [ ] Service worker registered at `/sw.js` (check DevTools > Application > Service Workers)
- [ ] Status shows "activated and running"
- [ ] Version shows 2.0.0

### Cache Strategy
```javascript
// Make API request
const response = await fetch('/api/projects');

// Check cache
const cache = await caches.open('genhub-data-v2');
const cached = await cache.match('/api/projects');
console.log('Cached:', cached);
```

- [ ] Static assets cached (check Cache Storage)
- [ ] API responses cached
- [ ] Data cache exists (`genhub-data-v2`)
- [ ] Stale-while-revalidate works (serve cached, fetch fresh)

### Navigation Preload
- [ ] Check Network tab for preload requests
- [ ] Navigation requests should be fast

### Background Sync
```javascript
// Trigger background sync
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-entities');
}
```

- [ ] Background sync registration works
- [ ] Service worker receives sync event
- [ ] Message sent to clients

### Message Handlers
```javascript
// Test cache clear
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'CLEAR_DATA_CACHE',
  });
}
```

- [ ] SKIP_WAITING message works
- [ ] CLEAR_CACHE message works
- [ ] CLEAR_DATA_CACHE message works

---

## 5. Photo Queue Tests

### Queue Photos
```javascript
import { queuePhoto } from '@/lib/pwa';

// Create test file
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

// Queue photo
const photoId = await queuePhoto({
  entityType: 'task',
  entityId: 'task-1',
  file,
  metadata: {
    userId: 'user-1',
    companyId: 'company-1',
  },
});
console.log('Photo ID:', photoId);
```

- [ ] Photo queued successfully
- [ ] Entry created in `photo_queue`
- [ ] File blob stored correctly
- [ ] File size validation works (try >10MB)
- [ ] File type validation works (try non-image)

### Process Queue
```javascript
import { processPhotoQueue } from '@/lib/pwa';

// Test upload (will fail without endpoint, but should try)
const progress = await processPhotoQueue((p) => {
  console.log('Upload progress:', p);
});
console.log('Final:', progress);
```

- [ ] Batch processing works (3 at a time)
- [ ] Progress callbacks fire
- [ ] Retry logic works
- [ ] Failed photos marked as 'failed'

### Retry Failed
```javascript
import { retryFailedPhotos } from '@/lib/pwa';

const progress = await retryFailedPhotos();
console.log('Retry result:', progress);
```

- [ ] Failed photos reset to 'pending'
- [ ] Upload attempted again
- [ ] Exponential backoff works

### Auto-upload on Reconnect
- [ ] Go offline (DevTools > Network > Offline)
- [ ] Queue a photo
- [ ] Go online
- [ ] Photo should auto-upload

---

## 6. Offline Hydration Tests

### Initialize
```javascript
import { initializeOfflineSupport } from '@/lib/pwa';

const result = await initializeOfflineSupport({
  companyId: 'company-1',
  autoSync: true,
  onOnline: () => console.log('Online!'),
  onOffline: () => console.log('Offline!'),
});
console.log('Hydration:', result.hydration);
console.log('Status:', result.status);
```

- [ ] Hydration loads cached projects
- [ ] Hydration loads cached tasks
- [ ] Status accurate
- [ ] Cleanup function works

### Connectivity Monitoring
- [ ] Go offline (DevTools > Network > Offline)
- [ ] Verify `onOffline` callback fires
- [ ] Go online
- [ ] Verify `onOnline` callback fires
- [ ] Auto-sync triggers when online

### Background Sync
```javascript
import { startBackgroundSync } from '@/lib/pwa';

const stop = startBackgroundSync('company-1', {
  syncInterval: 10000, // 10 seconds for testing
});

// Wait 10 seconds, verify sync runs
setTimeout(() => {
  console.log('Stopping background sync');
  stop();
}, 30000);
```

- [ ] Periodic sync runs every interval
- [ ] Periodic cleanup runs every hour
- [ ] Stop function halts timers

### Force Sync
```javascript
import { forceSync } from '@/lib/pwa';

const result = await forceSync('company-1', {
  onEntityProgress: (p) => console.log('Entity:', p),
  onPhotoProgress: (p) => console.log('Photo:', p),
});
console.log('Sync result:', result);
```

- [ ] Forces immediate sync
- [ ] Entity queue processed
- [ ] Photo queue processed
- [ ] Fresh data fetched from server
- [ ] Progress callbacks fire

### Status Reporting
```javascript
import { getOfflineDataStatus } from '@/lib/pwa';

const status = await getOfflineDataStatus();
console.log('Status:', status);
```

- [ ] isOnline accurate
- [ ] lastSyncAt tracked
- [ ] cacheAge calculated
- [ ] isFresh accurate
- [ ] Storage stats accurate
- [ ] Sync queue stats accurate
- [ ] Photo queue stats accurate

---

## Integration Tests

### End-to-End: Create Task Offline
1. [ ] Go offline
2. [ ] Create task (should queue for sync)
3. [ ] Verify entry in `entity_sync_queue`
4. [ ] Go online
5. [ ] Verify auto-sync triggers
6. [ ] Verify task created on server
7. [ ] Verify queue entry removed

### End-to-End: Save Form Draft
1. [ ] Start filling form
2. [ ] Wait 1 second (debounce)
3. [ ] Verify draft saved in `form_drafts`
4. [ ] Refresh page
5. [ ] Verify draft restored
6. [ ] Submit form
7. [ ] Verify draft cleared

### End-to-End: Upload Photo Offline
1. [ ] Go offline
2. [ ] Select photo (should queue)
3. [ ] Verify entry in `photo_queue`
4. [ ] Verify blob stored
5. [ ] Go online
6. [ ] Verify auto-upload triggers
7. [ ] Verify photo uploaded to server
8. [ ] Verify queue entry removed

### End-to-End: Storage Cleanup
1. [ ] Create old draft (modify expiresAt to past)
2. [ ] Create old cached project (modify cachedAt to >7 days ago)
3. [ ] Run `cleanupExpiredData()`
4. [ ] Verify old data removed
5. [ ] Verify recent data kept

---

## Performance Tests

### Storage Usage
```javascript
import { getStorageEstimate } from '@/lib/pwa';

const storage = await getStorageEstimate();
console.log('Usage:', storage.usagePercent + '%');
```

- [ ] Storage usage reported accurately
- [ ] Warning at 50MB remaining works

### Large Queue Processing
- [ ] Queue 50 entities
- [ ] Process sync queue
- [ ] Verify batch processing (10 at a time)
- [ ] Measure time (should be reasonable)

### Large Photo Upload
- [ ] Queue 10 photos
- [ ] Process photo queue
- [ ] Verify batch processing (3 at a time)
- [ ] Verify progress callbacks accurate

---

## Error Handling Tests

### Invalid Data
- [ ] Try to queue invalid entity type
- [ ] Try to save form with invalid formId
- [ ] Try to upload file >10MB
- [ ] Try to upload non-image file
- [ ] Verify errors caught and logged

### Network Errors
- [ ] Queue entity while online
- [ ] Disconnect network during sync
- [ ] Verify retry logic kicks in
- [ ] Reconnect network
- [ ] Verify sync completes

### Storage Quota
- [ ] Fill storage to near quota
- [ ] Try to cache more data
- [ ] Verify warning shown
- [ ] Run cleanup
- [ ] Verify space freed

---

## Browser Compatibility Tests

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Navigation preload works
- [ ] Background sync works

### Firefox
- [ ] All features work
- [ ] Background sync gracefully degrades
- [ ] Manual sync works

### Safari (iOS)
- [ ] All features work
- [ ] Service worker limitations noted
- [ ] IndexedDB works

---

## Mobile Device Tests

### Android Chrome
- [ ] Install as PWA
- [ ] Test offline mode
- [ ] Test background sync
- [ ] Test photo upload
- [ ] Test connectivity changes

### iOS Safari
- [ ] Install as PWA
- [ ] Test offline mode
- [ ] Test manual sync (no background sync)
- [ ] Test photo upload
- [ ] Test connectivity changes

---

## Cleanup After Testing

```javascript
// Clear all test data
import { clearAllCaches, clearAllDrafts } from '@/lib/pwa';

await clearAllCaches();
await clearAllDrafts();

// Clear photo queue manually
const db = await getDB();
await db.clear('photo_queue');
await db.clear('entity_sync_queue');
```

- [ ] All test data removed
- [ ] IndexedDB cleared
- [ ] Caches cleared

---

## Sign-Off

- [ ] All features tested and working
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Mobile devices tested
- [ ] Documentation accurate

**Tester Name:** _________________
**Date:** _________________
**Signature:** _________________
