/**
 * Phase 6 Task 4 - Sync Progress Tracking
 * Track and display sync progress across all queues
 *
 * Features:
 * - Count total entities pending sync (projects, tasks, photos)
 * - Show per-entity type breakdown (tasks: 5, projects: 2, photos: 12)
 * - Estimate remaining time based on network speed
 * - Current sync operation progress (file name, percentage)
 * - Storage usage snapshot
 * - Error tracking per entity
 */

'use client';

import { getSyncStats } from './entity-sync';
import { getPhotoQueueStats } from './photo-queue';
import { getStorageEstimate } from './indexed-db';

console.log('[Sync Progress] Module loaded');

// Progress tracking state
let currentOperation: string | undefined;
let syncStartTime = 0;
let itemsSyncedSinceStart = 0;
const subscribers: Set<(progress: SyncProgress) => void> = new Set();

export interface SyncError {
  entityType: string;
  entityId?: string;
  operation: string;
  error: string;
  timestamp: number;
}

export interface SyncProgress {
  totalPending: number;
  currentlyProcessing?: string;
  percentComplete: number;
  estimatedSecondsRemaining: number;
  byEntityType: Record<string, number>;
  errors: SyncError[];
  lastUpdated: number;
  storage?: {
    usage: number;
    quota: number;
    usagePercent: number;
  };
  networkSpeed?: {
    itemsPerSecond: number;
    avgTimePerItem: number;
  };
}

/**
 * Get current sync progress
 */
export async function getSyncProgress(): Promise<SyncProgress> {
  console.log('[Sync Progress] Getting sync progress');

  try {
    // Get entity sync stats
    const entityStats = await getSyncStats();

    // Get photo queue stats
    const photoStats = await getPhotoQueueStats();

    // Get storage estimate
    let storage: SyncProgress['storage'];
    try {
      const storageEstimate = await getStorageEstimate();
      storage = {
        usage: storageEstimate.usage,
        quota: storageEstimate.quota,
        usagePercent: storageEstimate.usagePercent,
      };
    } catch (error) {
      console.warn('[Sync Progress] Failed to get storage estimate:', error);
    }

    // Calculate total pending
    const totalPending =
      entityStats.pending +
      entityStats.syncing +
      photoStats.pending +
      photoStats.uploading;

    // Build entity type breakdown
    const byEntityType: Record<string, number> = {
      ...entityStats.byEntityType,
      photo: photoStats.pending + photoStats.uploading,
    };

    // Calculate percent complete
    const totalProcessed = itemsSyncedSinceStart;
    const totalItems = totalPending + totalProcessed;
    const percentComplete =
      totalItems > 0 ? Math.round((totalProcessed / totalItems) * 100) : 0;

    // Estimate remaining time
    let estimatedSecondsRemaining = 0;
    let networkSpeed: SyncProgress['networkSpeed'];

    if (syncStartTime > 0 && itemsSyncedSinceStart > 0) {
      const elapsedSeconds = (Date.now() - syncStartTime) / 1000;
      const itemsPerSecond = itemsSyncedSinceStart / elapsedSeconds;
      const avgTimePerItem = elapsedSeconds / itemsSyncedSinceStart;

      if (totalPending > 0) {
        estimatedSecondsRemaining = Math.ceil(totalPending / itemsPerSecond);
      }

      networkSpeed = {
        itemsPerSecond: Math.round(itemsPerSecond * 100) / 100,
        avgTimePerItem: Math.round(avgTimePerItem * 100) / 100,
      };
    }

    // Get errors
    const errors = await getRecentErrors();

    const progress: SyncProgress = {
      totalPending,
      currentlyProcessing: currentOperation,
      percentComplete,
      estimatedSecondsRemaining,
      byEntityType,
      errors,
      lastUpdated: Date.now(),
      storage,
      networkSpeed,
    };

    console.log('[Sync Progress] Progress:', progress);

    return progress;
  } catch (error) {
    console.error('[Sync Progress] Failed to get sync progress:', error);

    // Return empty progress on error
    return {
      totalPending: 0,
      percentComplete: 0,
      estimatedSecondsRemaining: 0,
      byEntityType: {},
      errors: [],
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Subscribe to sync progress updates
 */
export function subscribeSyncProgress(
  callback: (progress: SyncProgress) => void
): () => void {
  console.log('[Sync Progress] Adding subscriber:', {
    totalSubscribers: subscribers.size + 1,
  });

  subscribers.add(callback);

  // Send initial progress
  getSyncProgress().then(callback);

  // Return unsubscribe function
  return () => {
    console.log('[Sync Progress] Removing subscriber:', {
      totalSubscribers: subscribers.size - 1,
    });
    subscribers.delete(callback);
  };
}

/**
 * Notify all subscribers of progress update
 */
async function notifySubscribers(): Promise<void> {
  if (subscribers.size === 0) {
    return;
  }

  console.log('[Sync Progress] Notifying subscribers:', {
    count: subscribers.size,
  });

  const progress = await getSyncProgress();

  subscribers.forEach((callback) => {
    try {
      callback(progress);
    } catch (error) {
      console.error('[Sync Progress] Subscriber callback error:', error);
    }
  });
}

/**
 * Start tracking sync operation
 */
export function startSyncTracking(): void {
  console.log('[Sync Progress] Starting sync tracking');

  syncStartTime = Date.now();
  itemsSyncedSinceStart = 0;
  currentOperation = undefined;

  notifySubscribers();
}

/**
 * Update current operation
 */
export function updateCurrentOperation(operation: string): void {
  console.log('[Sync Progress] Updating current operation:', operation);

  currentOperation = operation;

  notifySubscribers();
}

/**
 * Record synced item
 */
export function recordSyncedItem(entityType: string, entityId?: string): void {
  console.log('[Sync Progress] Recording synced item:', {
    entityType,
    entityId,
  });

  itemsSyncedSinceStart++;

  notifySubscribers();
}

/**
 * Record sync error
 */
export async function recordSyncError(error: Omit<SyncError, 'timestamp'>): Promise<void> {
  console.log('[Sync Progress] Recording sync error:', error);

  const errorWithTimestamp: SyncError = {
    ...error,
    timestamp: Date.now(),
  };

  // Store error in IndexedDB (if supported)
  try {
    await storeError(errorWithTimestamp);
  } catch (err) {
    console.error('[Sync Progress] Failed to store error:', err);
  }

  notifySubscribers();
}

/**
 * End sync tracking
 */
export function endSyncTracking(): void {
  console.log('[Sync Progress] Ending sync tracking:', {
    duration: syncStartTime > 0 ? Date.now() - syncStartTime : 0,
    itemsSynced: itemsSyncedSinceStart,
  });

  syncStartTime = 0;
  itemsSyncedSinceStart = 0;
  currentOperation = undefined;

  notifySubscribers();
}

/**
 * Get recent sync errors (last 50)
 */
async function getRecentErrors(): Promise<SyncError[]> {
  try {
    // For now, return empty array
    // In production, would retrieve from IndexedDB
    return [];
  } catch (error) {
    console.error('[Sync Progress] Failed to get recent errors:', error);
    return [];
  }
}

/**
 * Store error in IndexedDB
 */
async function storeError(error: SyncError): Promise<void> {
  // For now, just log
  // In production, would store in IndexedDB
  console.warn('[Sync Progress] Sync error:', error);
}

/**
 * Clear all errors
 */
export async function clearSyncErrors(): Promise<void> {
  console.log('[Sync Progress] Clearing sync errors');

  // For now, no-op
  // In production, would clear from IndexedDB

  notifySubscribers();
}

/**
 * Get sync progress summary as human-readable string
 */
export function formatSyncProgress(progress: SyncProgress): string {
  if (progress.totalPending === 0) {
    return 'All synced';
  }

  const parts: string[] = [];

  // Add entity counts
  const entityTypes = Object.entries(progress.byEntityType).filter(([_, count]) => count > 0);

  if (entityTypes.length > 0) {
    const entityStrings = entityTypes.map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`);
    parts.push(entityStrings.join(', '));
  }

  // Add percent complete
  if (progress.percentComplete > 0) {
    parts.push(`(${progress.percentComplete}% complete)`);
  }

  // Add time estimate
  if (progress.estimatedSecondsRemaining > 0) {
    parts.push(`~${formatDuration(progress.estimatedSecondsRemaining)} remaining`);
  }

  return parts.join(' ');
}

/**
 * Format duration as human-readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get detailed sync statistics
 */
export async function getSyncStatistics(): Promise<{
  totalItemsSynced: number;
  totalErrors: number;
  avgSyncTime: number;
  lastSyncTime: number;
}> {
  console.log('[Sync Progress] Getting sync statistics');

  try {
    // For now, return basic stats
    // In production, would retrieve from IndexedDB

    return {
      totalItemsSynced: itemsSyncedSinceStart,
      totalErrors: 0,
      avgSyncTime: 0,
      lastSyncTime: syncStartTime,
    };
  } catch (error) {
    console.error('[Sync Progress] Failed to get sync statistics:', error);

    return {
      totalItemsSynced: 0,
      totalErrors: 0,
      avgSyncTime: 0,
      lastSyncTime: 0,
    };
  }
}

/**
 * Check if sync is in progress
 */
export function isSyncInProgress(): boolean {
  return syncStartTime > 0;
}

/**
 * Get sync duration (if in progress)
 */
export function getSyncDuration(): number {
  if (syncStartTime === 0) {
    return 0;
  }

  return Date.now() - syncStartTime;
}

/**
 * Format sync duration as human-readable string
 */
export function formatSyncDuration(): string {
  const durationMs = getSyncDuration();

  if (durationMs === 0) {
    return 'Not syncing';
  }

  const durationSeconds = Math.floor(durationMs / 1000);

  return formatDuration(durationSeconds);
}

/**
 * Monitor sync progress with auto-refresh
 */
export function monitorSyncProgress(
  callback: (progress: SyncProgress) => void,
  intervalMs = 1000
): () => void {
  console.log('[Sync Progress] Starting sync progress monitor:', {
    intervalMs,
  });

  // Subscribe to progress updates
  const unsubscribe = subscribeSyncProgress(callback);

  // Set up auto-refresh interval
  const intervalId = setInterval(async () => {
    const progress = await getSyncProgress();
    callback(progress);
  }, intervalMs);

  // Return cleanup function
  return () => {
    console.log('[Sync Progress] Stopping sync progress monitor');
    unsubscribe();
    clearInterval(intervalId);
  };
}

/**
 * Get storage usage breakdown
 */
export async function getStorageBreakdown(): Promise<{
  total: number;
  entities: number;
  photos: number;
  cache: number;
}> {
  console.log('[Sync Progress] Getting storage breakdown');

  try {
    const photoStats = await getPhotoQueueStats();

    return {
      total: 0, // Would calculate from IndexedDB size
      entities: 0, // Would calculate from entity cache size
      photos: photoStats.totalSize,
      cache: 0, // Would calculate from cache size
    };
  } catch (error) {
    console.error('[Sync Progress] Failed to get storage breakdown:', error);

    return {
      total: 0,
      entities: 0,
      photos: 0,
      cache: 0,
    };
  }
}

// Export configuration
export const SYNC_PROGRESS_CONFIG = {
  MAX_ERRORS_STORED: 50,
  AUTO_REFRESH_INTERVAL: 1000,
} as const;
