# PWA Phase 1 - Quick Reference Guide

## Installation & Setup

```typescript
// In your root layout or app initialization
import { initializeOfflineSupport } from '@/lib/pwa';

const { hydration, status, cleanup } = await initializeOfflineSupport({
  companyId: session.user.companyId,
  autoSync: true,
  onOnline: () => toast.success('Back online!'),
  onOffline: () => toast.info('You are offline'),
});

// Cleanup on unmount
useEffect(() => cleanup, []);
```

---

## Common Operations

### 1. Queue Entity for Offline Sync

```typescript
import { enqueueSync, SYNC_PRIORITY } from '@/lib/pwa';

// Create task offline
const syncId = await enqueueSync({
  entityType: 'task',
  operation: 'create',
  data: {
    title: 'Fix critical bug',
    projectId: 'proj-123',
    priority: 'high',
  },
  priority: SYNC_PRIORITY.HIGH,
  metadata: {
    userId: session.user.id,
    companyId: session.user.companyId,
    projectId: 'proj-123',
  },
});
```

### 2. Save Form Draft (Auto-save)

```typescript
import { saveFormDraft, loadFormDraft } from '@/lib/pwa';

// Auto-save on change (debounced 1 second)
const handleChange = async (formState) => {
  setFormState(formState);
  await saveFormDraft('create-task-' + projectId, 'task', formState);
};

// Restore on mount
useEffect(() => {
  const restoreDraft = async () => {
    const draft = await loadFormDraft('create-task-' + projectId);
    if (draft) {
      setFormState(draft.data);
      setShowDraftPrompt(true);
    }
  };
  restoreDraft();
}, []);
```

### 3. Queue Photo for Upload

```typescript
import { queuePhoto } from '@/lib/pwa';

const handlePhotoSelect = async (file: File) => {
  const photoId = await queuePhoto({
    entityType: 'task',
    entityId: taskId,
    file,
    metadata: {
      userId: session.user.id,
      companyId: session.user.companyId,
      projectId,
      caption: 'Progress update',
    },
  });

  toast.success('Photo queued for upload');
};
```

### 4. Monitor Offline Status

```typescript
import { getOfflineDataStatus } from '@/lib/pwa';

const status = await getOfflineDataStatus();

// Display status
<div>
  <p>Status: {status.isOnline ? 'Online' : 'Offline'}</p>
  <p>Pending syncs: {status.syncQueue.pending}</p>
  <p>Pending uploads: {status.photoQueue.pending}</p>
  <p>Cache age: {getCacheFreshness(status.lastSyncAt)}</p>
</div>
```

### 5. Force Manual Sync

```typescript
import { forceSync } from '@/lib/pwa';

const handleSyncClick = async () => {
  try {
    const result = await forceSync(companyId, {
      onEntityProgress: (progress) => {
        console.log(`Synced ${progress.synced}/${progress.total}`);
      },
      onPhotoProgress: (progress) => {
        console.log(`Uploaded ${progress.uploaded}/${progress.total}`);
      },
    });

    if (result.success) {
      toast.success('Sync complete!');
    } else {
      toast.error('Sync had errors');
    }
  } catch (error) {
    toast.error('Sync failed');
  }
};
```

---

## React Hooks

### useFormDraft Hook

```typescript
import { useFormDraft } from '@/lib/pwa';

const {
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft: checkDraft,
} = useFormDraft('create-task-' + projectId, 'task', formState);

// Save immediately (bypass debounce)
await saveDraft();

// Load on mount
const draft = await loadDraft();

// Clear after submit
await clearDraft();

// Check if draft exists
const exists = await checkDraft();
```

---

## Service Worker Events

### Listen for Background Sync

```typescript
// In your app component
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_ENTITIES_START') {
      console.log('Background sync started by service worker');
      // Update UI to show sync in progress
    }
  });
}
```

### Clear Data Cache

```typescript
// Clear stale data cache
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'CLEAR_DATA_CACHE',
  });
}
```

---

## Error Handling

### Entity Sync Errors

```typescript
import { processSyncQueue } from '@/lib/pwa';

const progress = await processSyncQueue((p) => {
  console.log(`Progress: ${p.synced}/${p.total}`);
});

if (progress.failed > 0) {
  // Get failed items
  const failed = await getQueuedEntities({ status: 'error' });
  console.log('Failed entities:', failed);
}
```

### Photo Upload Errors

```typescript
import { retryFailedPhotos } from '@/lib/pwa';

// Retry all failed photos
const result = await retryFailedPhotos((progress) => {
  console.log(`Retrying: ${progress.uploaded}/${progress.total}`);
});

if (result.failed > 0) {
  toast.error('Some photos still failed after retry');
}
```

---

## Storage Management

### Check Storage Usage

```typescript
import { getStorageEstimate, isStorageNearLimit } from '@/lib/pwa';

const storage = await getStorageEstimate();
console.log(`Using ${storage.usagePercent}% of quota`);

if (await isStorageNearLimit()) {
  toast.warning('Storage is running low. Consider clearing old data.');
}
```

### Cleanup Old Data

```typescript
import { cleanupExpiredData } from '@/lib/pwa';

const { draftsDeleted, projectsDeleted, tasksDeleted } =
  await cleanupExpiredData();

console.log('Cleaned up:', {
  drafts: draftsDeleted,
  projects: projectsDeleted,
  tasks: tasksDeleted,
});
```

---

## Configuration Constants

```typescript
// Entity Sync
SYNC_PRIORITY.HIGH = 8;
SYNC_PRIORITY.NORMAL = 5;
SYNC_PRIORITY.LOW = 2;

// Form Persistence
FORM_DRAFT_CONFIG.DRAFT_EXPIRY_DAYS = 7;
FORM_DRAFT_CONFIG.AUTO_SAVE_DEBOUNCE_MS = 1000;

// Photo Queue
PHOTO_QUEUE_CONFIG.MAX_RETRY_ATTEMPTS = 5;
PHOTO_QUEUE_CONFIG.MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

// Offline Hydration
OFFLINE_HYDRATION_CONFIG.SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 min
OFFLINE_HYDRATION_CONFIG.CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// IndexedDB
PWA_DB_CONFIG.MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
PWA_DB_CONFIG.STORAGE_QUOTA_WARNING = 50 * 1024 * 1024; // 50MB
```

---

## TypeScript Types

```typescript
import type {
  SyncEntity,
  SyncResult,
  SyncProgress,
  FormDraft,
  DraftMetadata,
  QueuedPhoto,
  UploadProgress,
  OfflineDataStatus,
  HydrationResult,
} from '@/lib/pwa';

// Example usage
const handleSync = (progress: SyncProgress) => {
  console.log(`${progress.synced}/${progress.total} synced`);
};

const status: OfflineDataStatus = await getOfflineDataStatus();
```

---

## Best Practices

### 1. Always Check Online Status
```typescript
if (navigator.onLine) {
  // Try network first
  await syncOnlineData(companyId);
} else {
  // Queue for later
  await enqueueSync({ ... });
}
```

### 2. Provide User Feedback
```typescript
// Show pending syncs in UI
const { syncQueue, photoQueue } = await getOfflineDataStatus();
if (syncQueue.pending > 0) {
  showBadge(syncQueue.pending);
}
```

### 3. Handle Errors Gracefully
```typescript
try {
  await queuePhoto({ ... });
  toast.success('Photo queued');
} catch (error) {
  if (error.message.includes('exceeds maximum')) {
    toast.error('Photo is too large (max 10MB)');
  } else {
    toast.error('Failed to queue photo');
  }
}
```

### 4. Clean Up Resources
```typescript
useEffect(() => {
  const { cleanup } = initializeOfflineSupport({ ... });
  return cleanup; // Clean up on unmount
}, []);
```

### 5. Monitor Storage
```typescript
useEffect(() => {
  const checkStorage = async () => {
    if (await isStorageNearLimit()) {
      setShowStorageWarning(true);
    }
  };
  checkStorage();
}, []);
```

---

## Debugging

### Enable Verbose Logging
All modules log to console with `[Module Name]` prefix:
- `[PWA IndexedDB]`
- `[Entity Sync]`
- `[Form Persistence]`
- `[Photo Queue]`
- `[Offline Hydration]`
- `[Service Worker]`

### Inspect IndexedDB
```javascript
// In browser console
const db = await indexedDB.databases();
console.log(db); // Shows all databases

// Open specific database
const request = indexedDB.open('genhub-pwa', 2);
request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('Stores:', db.objectStoreNames);
};
```

### Check Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log('Registered workers:', registrations);
});

// Check cache
caches.keys().then((keys) => console.log('Caches:', keys));
```

---

## Troubleshooting

### Issue: Drafts not saving
**Solution:** Check debounce timer, use `immediate: true` option

### Issue: Photos not uploading
**Solution:** Check network status, verify endpoint exists, check file size

### Issue: Sync queue growing
**Solution:** Check for failed items, retry with `retryFailedPhotos()`

### Issue: Storage quota exceeded
**Solution:** Run `cleanupExpiredData()`, clear old caches

### Issue: Service worker not activating
**Solution:** Check for errors in sw.js, send SKIP_WAITING message

---

## API Endpoints Required

Ensure these endpoints exist for full functionality:

### Entity Sync
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- Similar for: projects, expenses, markers, notes, comments

### Photo Upload
- `POST /api/tasks/:id/photos` - Upload task photo
- `POST /api/markers/:id/photos` - Upload marker photo
- `POST /api/expenses/:id/photos` - Upload expense photo
- `POST /api/projects/:id/photos` - Upload project photo

### Data Fetch
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id/tasks` - Get project tasks
- `GET /api/tasks` - Get all tasks

---

## Performance Tips

1. **Batch Operations**: Use batch processing for large sync queues
2. **Lazy Load**: Don't hydrate all data on app start
3. **Selective Caching**: Only cache frequently accessed data
4. **Cleanup Regularly**: Run cleanup on app idle
5. **Monitor Storage**: Check quota before large operations

---

## Next Steps

After implementing Phase 1:
1. Create UI components for offline indicator
2. Add sync progress UI
3. Implement draft recovery prompts
4. Add storage usage warnings
5. Test on real devices with intermittent connectivity
