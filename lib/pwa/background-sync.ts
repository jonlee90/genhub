/**
 * Phase 6 Task 3 - Background Sync Registration
 * Register sync events with service worker
 *
 * Features:
 * - Periodic sync: Every 15 minutes when online
 * - Event-triggered sync: On 'online' event
 * - Background Sync API registration (with fallback)
 * - Handles unsupported browsers gracefully
 * - Coordinates with existing entity-sync.ts queue
 */

'use client';

import { processSyncQueue, getSyncStats } from './entity-sync';
import { processUploadQueue, getPhotoQueueStats } from './photo-queue';

console.log('[Background Sync] Module loaded');

// Sync configuration
const DEFAULT_MIN_INTERVAL = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_INTERVAL = 60 * 60 * 1000; // 60 minutes
const SYNC_TAG = 'genhub-sync';

// State
let syncInterval: NodeJS.Timeout | null = null;
let isRegistered = false;
let lastSyncTime = 0;
let isSyncing = false;

export interface BackgroundSyncStatus {
  isSupported: boolean;
  isRegistered: boolean;
  lastSyncTime: number;
  nextSyncTime: number;
  isSyncing: boolean;
  pendingEntities: number;
  pendingPhotos: number;
}

export interface BackgroundSyncOptions {
  minInterval?: number; // ms between syncs
  maxInterval?: number; // max time between syncs
  onSyncStart?: () => void;
  onSyncComplete?: (stats: SyncStats) => void;
  onSyncError?: (error: Error) => void;
}

export interface SyncStats {
  entitiesSynced: number;
  photosSynced: number;
  errors: string[];
  duration: number;
}

/**
 * Register background sync with service worker
 */
export async function registerBackgroundSync(
  options?: BackgroundSyncOptions
): Promise<void> {
  console.log('[Background Sync] Registering background sync');

  if (isRegistered) {
    console.log('[Background Sync] Already registered');
    return;
  }

  const minInterval = options?.minInterval || DEFAULT_MIN_INTERVAL;
  const maxInterval = options?.maxInterval || DEFAULT_MAX_INTERVAL;

  try {
    // Check if Background Sync API is supported
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
      console.log('[Background Sync] Background Sync API supported');

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Register sync event with service worker
      await (registration as any).sync.register(SYNC_TAG);

      console.log('[Background Sync] Sync registered with service worker');
    } else {
      console.warn('[Background Sync] Background Sync API not supported, using fallback');
    }

    // Set up periodic sync (works regardless of API support)
    setupPeriodicSync(minInterval, options);

    // Set up event-triggered sync
    setupEventSync(minInterval, options);

    isRegistered = true;

    console.log('[Background Sync] Background sync registered successfully');
  } catch (error) {
    console.error('[Background Sync] Failed to register background sync:', error);
    throw error;
  }
}

/**
 * Set up periodic sync interval
 */
function setupPeriodicSync(
  interval: number,
  options?: BackgroundSyncOptions
): void {
  console.log('[Background Sync] Setting up periodic sync:', {
    intervalMs: interval,
    intervalMinutes: Math.round(interval / 60000),
  });

  // Clear existing interval if any
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // Set up periodic sync
  syncInterval = setInterval(async () => {
    console.log('[Background Sync] Periodic sync triggered');

    // Only sync if online
    if (!navigator.onLine) {
      console.log('[Background Sync] Device offline, skipping sync');
      return;
    }

    // Only sync if enough time has passed since last sync
    const timeSinceLastSync = Date.now() - lastSyncTime;
    if (timeSinceLastSync < interval) {
      console.log('[Background Sync] Too soon since last sync, skipping');
      return;
    }

    await performSync(options);
  }, interval);

  console.log('[Background Sync] Periodic sync enabled');
}

/**
 * Set up event-triggered sync (on 'online' event)
 */
function setupEventSync(minInterval: number, options?: BackgroundSyncOptions): void {
  console.log('[Background Sync] Setting up event-triggered sync');

  // Listen for online event
  const handleOnline = async () => {
    console.log('[Background Sync] Device came online, triggering sync');

    // Check if enough time has passed since last sync
    const timeSinceLastSync = Date.now() - lastSyncTime;
    if (timeSinceLastSync < minInterval) {
      console.log('[Background Sync] Too soon since last sync, skipping');
      return;
    }

    await performSync(options);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }

  console.log('[Background Sync] Event-triggered sync enabled');
}

/**
 * Perform sync operation
 */
async function performSync(options?: BackgroundSyncOptions): Promise<SyncStats> {
  if (isSyncing) {
    console.log('[Background Sync] Sync already in progress');
    return { entitiesSynced: 0, photosSynced: 0, errors: [], duration: 0 };
  }

  isSyncing = true;
  const startTime = Date.now();

  console.log('[Background Sync] Starting sync');

  // Notify sync start
  options?.onSyncStart?.();

  const stats: SyncStats = {
    entitiesSynced: 0,
    photosSynced: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Sync entities
    try {
      console.log('[Background Sync] Syncing entities');
      const entityProgress = await processSyncQueue();
      stats.entitiesSynced = entityProgress.synced;

      if (entityProgress.failed > 0) {
        stats.errors.push(`${entityProgress.failed} entities failed to sync`);
      }
    } catch (error) {
      console.error('[Background Sync] Entity sync failed:', error);
      stats.errors.push('Entity sync failed');
    }

    // Upload photos
    try {
      console.log('[Background Sync] Uploading photos');
      const uploadStats = await processUploadQueue();
      stats.photosSynced = uploadStats.uploaded;

      if (uploadStats.failed > 0) {
        stats.errors.push(`${uploadStats.failed} photos failed to upload`);
      }

      stats.errors.push(...uploadStats.errors);
    } catch (error) {
      console.error('[Background Sync] Photo upload failed:', error);
      stats.errors.push('Photo upload failed');
    }

    lastSyncTime = Date.now();
    stats.duration = Date.now() - startTime;

    console.log('[Background Sync] Sync complete:', stats);

    // Notify sync complete
    options?.onSyncComplete?.(stats);

    return stats;
  } catch (error) {
    console.error('[Background Sync] Sync failed:', error);

    const syncError = error instanceof Error ? error : new Error('Sync failed');
    stats.errors.push(syncError.message);
    stats.duration = Date.now() - startTime;

    // Notify sync error
    options?.onSyncError?.(syncError);

    return stats;
  } finally {
    isSyncing = false;
  }
}

/**
 * Get background sync status
 */
export function getBackgroundSyncStatus(): BackgroundSyncStatus {
  console.log('[Background Sync] Getting status');

  const nextSyncTime = lastSyncTime + DEFAULT_MIN_INTERVAL;

  const status: BackgroundSyncStatus = {
    isSupported: 'serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any),
    isRegistered,
    lastSyncTime,
    nextSyncTime,
    isSyncing,
    pendingEntities: 0,
    pendingPhotos: 0,
  };

  console.log('[Background Sync] Status:', status);

  return status;
}

/**
 * Get detailed background sync status (async)
 */
export async function getBackgroundSyncStatusAsync(): Promise<BackgroundSyncStatus> {
  console.log('[Background Sync] Getting detailed status');

  const status = getBackgroundSyncStatus();

  try {
    // Get pending entity count
    const syncStats = await getSyncStats();
    status.pendingEntities = syncStats.pending;

    // Get pending photo count
    const photoStats = await getPhotoQueueStats();
    status.pendingPhotos = photoStats.pending;

    console.log('[Background Sync] Detailed status:', status);
  } catch (error) {
    console.error('[Background Sync] Failed to get detailed status:', error);
  }

  return status;
}

/**
 * Trigger manual sync
 */
export async function triggerManualSync(): Promise<SyncStats> {
  console.log('[Background Sync] Manual sync triggered');

  if (!navigator.onLine) {
    throw new Error('Cannot sync while offline');
  }

  return await performSync();
}

/**
 * Unregister background sync
 */
export async function unregisterBackgroundSync(): Promise<void> {
  console.log('[Background Sync] Unregistering background sync');

  // Clear periodic sync interval
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  // Unregister from service worker (if supported)
  try {
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
      const registration = await navigator.serviceWorker.ready;
      // Note: There's no official way to unregister a sync tag
      // The sync will be automatically cleared after it completes
      console.log('[Background Sync] Background Sync API cleanup scheduled');
    }
  } catch (error) {
    console.error('[Background Sync] Failed to unregister from service worker:', error);
  }

  isRegistered = false;

  console.log('[Background Sync] Background sync unregistered');
}

/**
 * Check if sync is needed
 */
export async function isSyncNeeded(): Promise<boolean> {
  console.log('[Background Sync] Checking if sync is needed');

  try {
    const syncStats = await getSyncStats();
    const photoStats = await getPhotoQueueStats();

    const needed = syncStats.pending > 0 || photoStats.pending > 0;

    console.log('[Background Sync] Sync needed:', {
      needed,
      pendingEntities: syncStats.pending,
      pendingPhotos: photoStats.pending,
    });

    return needed;
  } catch (error) {
    console.error('[Background Sync] Failed to check if sync is needed:', error);
    return false;
  }
}

/**
 * Get time until next sync
 */
export function getTimeUntilNextSync(): number {
  if (!isRegistered) {
    return -1; // Not registered
  }

  if (lastSyncTime === 0) {
    return 0; // Never synced, should sync now
  }

  const nextSyncTime = lastSyncTime + DEFAULT_MIN_INTERVAL;
  const timeUntil = nextSyncTime - Date.now();

  return Math.max(0, timeUntil);
}

/**
 * Format time until next sync as human-readable string
 */
export function formatTimeUntilNextSync(): string {
  const timeMs = getTimeUntilNextSync();

  if (!isRegistered) {
    return 'Not registered';
  }

  if (timeMs === 0) {
    return 'Now';
  }

  const minutes = Math.ceil(timeMs / (60 * 1000));

  if (minutes < 1) {
    return 'Now';
  } else if (minutes === 1) {
    return '1 minute';
  } else if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }
}

/**
 * Listen to service worker sync events
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    console.log('[Background Sync] Service worker ready, listening for sync events');

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        console.log('[Background Sync] Received sync complete message from service worker');
        lastSyncTime = Date.now();
      }
    });
  });
}

// Export configuration
export const BACKGROUND_SYNC_CONFIG = {
  DEFAULT_MIN_INTERVAL,
  DEFAULT_MAX_INTERVAL,
  SYNC_TAG,
} as const;
