/**
 * P5.3 - Background Sync Manager
 * Handles offline marker creation and background sync
 */

'use client';

import {
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  storeMarkers,
} from './indexeddb';

console.log('[SyncManager] Module loaded');

// Debug: Rate limiting and retry
const SYNC_RATE_LIMIT = 10; // markers per second
const SYNC_BATCH_SIZE = 10;
const SYNC_RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRY_ATTEMPTS = 3;

// Debug: Sync state
let isSyncing = false;
let syncAbortController: AbortController | null = null;

export interface SyncProgress {
  total: number;
  synced: number;
  failed: number;
  pending: number;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

/**
 * Create marker while offline
 * Stores in IndexedDB sync queue for later upload
 */
export async function createMarkerOffline(markerData: {
  projectId: string;
  title: string;
  type: string;
  position: { x: number; y: number; z: number };
  floorId: string | null;
  description?: string;
  createdBy: string;
}): Promise<string> {
  console.log('[SyncManager] Creating marker offline:', markerData);

  try {
    // Add to sync queue
    const queueId = await addToSyncQueue('create', 'marker', markerData);

    // Store marker locally with pending status
    await storeMarkers([
      {
        id: queueId, // Temporary ID
        projectId: markerData.projectId,
        title: markerData.title,
        type: markerData.type,
        position: markerData.position,
        floorId: markerData.floorId,
        createdBy: markerData.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    console.log('[SyncManager] Marker created offline, queued for sync:', queueId);

    // Try to register background sync
    await registerBackgroundSync();

    return queueId;
  } catch (error) {
    console.error('[SyncManager] Failed to create marker offline:', error);
    throw error;
  }
}

/**
 * Update marker while offline
 */
export async function updateMarkerOffline(
  markerId: string,
  updates: Partial<{
    title: string;
    type: string;
    position: { x: number; y: number; z: number };
    description: string;
  }>
): Promise<void> {
  console.log('[SyncManager] Updating marker offline:', { markerId, updates });

  try {
    await addToSyncQueue('update', 'marker', {
      markerId,
      ...updates,
    });

    console.log('[SyncManager] Marker update queued for sync');

    // Try to register background sync
    await registerBackgroundSync();
  } catch (error) {
    console.error('[SyncManager] Failed to update marker offline:', error);
    throw error;
  }
}

/**
 * Delete marker while offline
 */
export async function deleteMarkerOffline(markerId: string): Promise<void> {
  console.log('[SyncManager] Deleting marker offline:', { markerId });

  try {
    await addToSyncQueue('delete', 'marker', { markerId });

    console.log('[SyncManager] Marker deletion queued for sync');

    // Try to register background sync
    await registerBackgroundSync();
  } catch (error) {
    console.error('[SyncManager] Failed to delete marker offline:', error);
    throw error;
  }
}

/**
 * Register background sync with service worker
 */
async function registerBackgroundSync(): Promise<void> {
  console.log('[SyncManager] Registering background sync');

  try {
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-markers');
      console.log('[SyncManager] Background sync registered');
    } else {
      console.warn('[SyncManager] Background sync not supported, will sync manually');
      // Trigger manual sync instead
      setTimeout(() => syncPendingMarkers(), 1000);
    }
  } catch (error) {
    console.error('[SyncManager] Failed to register background sync:', error);
    // Fallback to manual sync
    setTimeout(() => syncPendingMarkers(), 1000);
  }
}

/**
 * Sync pending markers with server
 */
export async function syncPendingMarkers(
  onProgress?: SyncProgressCallback
): Promise<SyncProgress> {
  console.log('[SyncManager] Starting sync of pending markers');

  // Prevent concurrent syncs
  if (isSyncing) {
    console.warn('[SyncManager] Sync already in progress');
    return { total: 0, synced: 0, failed: 0, pending: 0 };
  }

  isSyncing = true;
  syncAbortController = new AbortController();

  try {
    // Get pending items
    const pendingItems = await getPendingSyncItems();
    console.log('[SyncManager] Pending items:', pendingItems.length);

    if (pendingItems.length === 0) {
      console.log('[SyncManager] No pending items to sync');
      isSyncing = false;
      return { total: 0, synced: 0, failed: 0, pending: 0 };
    }

    const progress: SyncProgress = {
      total: pendingItems.length,
      synced: 0,
      failed: 0,
      pending: pendingItems.length,
    };

    // Notify initial progress
    if (onProgress) {
      onProgress(progress);
    }

    // Process items in batches (rate limiting)
    for (let i = 0; i < pendingItems.length; i += SYNC_BATCH_SIZE) {
      const batch = pendingItems.slice(i, i + SYNC_BATCH_SIZE);

      console.log('[SyncManager] Processing batch:', {
        batchIndex: i / SYNC_BATCH_SIZE,
        batchSize: batch.length,
      });

      // Process batch items
      await Promise.all(
        batch.map(async (item) => {
          try {
            // Mark as syncing
            await updateSyncItemStatus(item.id, 'syncing');

            // Sync with exponential backoff retry
            await syncItemWithRetry(item);

            // Mark as synced
            await updateSyncItemStatus(item.id, 'synced');

            progress.synced++;
            progress.pending--;

            console.log('[SyncManager] Item synced successfully:', item.id);
          } catch (error) {
            console.error('[SyncManager] Failed to sync item:', item.id, error);

            // Mark as error
            await updateSyncItemStatus(
              item.id,
              'error',
              error instanceof Error ? error.message : 'Sync failed'
            );

            progress.failed++;
            progress.pending--;
          }

          // Notify progress
          if (onProgress) {
            onProgress({ ...progress });
          }
        })
      );

      // Rate limiting: wait between batches
      if (i + SYNC_BATCH_SIZE < pendingItems.length) {
        const delayMs = (SYNC_BATCH_SIZE / SYNC_RATE_LIMIT) * 1000;
        console.log('[SyncManager] Rate limit delay:', delayMs);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log('[SyncManager] Sync complete:', progress);
    isSyncing = false;
    syncAbortController = null;

    return progress;
  } catch (error) {
    console.error('[SyncManager] Sync failed:', error);
    isSyncing = false;
    syncAbortController = null;
    throw error;
  }
}

/**
 * Retry sync with exponential backoff
 */
async function syncItemWithRetry(item: any): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log('[SyncManager] Sync attempt:', { itemId: item.id, attempt });

      // Sync based on type
      if (item.entity === 'marker') {
        await syncMarkerItem(item);
      } else if (item.entity === 'marker_content') {
        await syncMarkerContentItem(item);
      }

      // Success - return
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Sync failed');
      console.warn('[SyncManager] Sync attempt failed:', {
        itemId: item.id,
        attempt,
        error: lastError.message,
      });

      // Don't retry on last attempt
      if (attempt < MAX_RETRY_ATTEMPTS) {
        // Exponential backoff: 5s, 10s, 20s
        const delay = SYNC_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log('[SyncManager] Retrying after delay:', { delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError || new Error('Sync failed after retries');
}

/**
 * Validate JSON response
 */
async function validateJsonResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Invalid response format: expected JSON');
  }

  try {
    return await response.json();
  } catch (err) {
    throw new Error('Failed to parse response JSON');
  }
}

/**
 * Sync individual marker item
 */
async function syncMarkerItem(item: any): Promise<void> {
  console.log('[SyncManager] Syncing marker:', item);

  const { type, data } = item;

  // Build API endpoint
  const endpoint = '/api/projects/spatial/markers';

  if (type === 'create') {
    // POST to create marker
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: syncAbortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to create marker: ${response.statusText}`);
    }

    // Validate JSON response
    await validateJsonResponse(response);

    console.log('[SyncManager] Marker created on server');
  } else if (type === 'update') {
    // PATCH to update marker
    const response = await fetch(`${endpoint}/${data.markerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: syncAbortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to update marker: ${response.statusText}`);
    }

    console.log('[SyncManager] Marker updated on server');
  } else if (type === 'delete') {
    // DELETE marker
    const response = await fetch(`${endpoint}/${data.markerId}`, {
      method: 'DELETE',
      signal: syncAbortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete marker: ${response.statusText}`);
    }

    console.log('[SyncManager] Marker deleted on server');
  }
}

/**
 * Sync individual marker content item
 */
async function syncMarkerContentItem(item: any): Promise<void> {
  console.log('[SyncManager] Syncing marker content:', item);

  const { type, data } = item;
  const endpoint = `/api/projects/spatial/markers/${data.markerId}/content`;

  if (type === 'create' || type === 'update') {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: syncAbortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to sync marker content: ${response.statusText}`);
    }

    console.log('[SyncManager] Marker content synced on server');
  }
}

/**
 * Cancel ongoing sync
 */
export function cancelSync(): void {
  console.log('[SyncManager] Cancelling sync');

  if (syncAbortController) {
    syncAbortController.abort();
    syncAbortController = null;
  }

  isSyncing = false;
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  isSyncing: boolean;
  pendingCount: number;
}> {
  const pendingItems = await getPendingSyncItems();

  return {
    isSyncing,
    pendingCount: pendingItems.length,
  };
}

/**
 * Listen for service worker sync messages
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[SyncManager] Service worker message:', event.data);

    if (event.data?.type === 'SYNC_MARKERS_START') {
      console.log('[SyncManager] Background sync triggered by service worker');
      syncPendingMarkers();
    }
  });
}
