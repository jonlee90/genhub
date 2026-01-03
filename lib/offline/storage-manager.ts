/**
 * P5.2 - Storage Manager
 * Quota management and storage monitoring
 */

import { getDatabaseSize } from './indexeddb';

console.log('[StorageManager] Module loaded');

// Debug: Storage limits (in bytes)
const STORAGE_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB
const STORAGE_CRITICAL_THRESHOLD = 50 * 1024 * 1024; // 50MB remaining

export interface StorageStatus {
  usage: number;
  quota: number;
  available: number;
  usagePercent: number;
  level: 'ok' | 'warning' | 'critical';
  message: string;
}

/**
 * Check storage quota and return status
 */
export async function checkStorageQuota(): Promise<StorageStatus> {
  console.log('[StorageManager] Checking storage quota');

  try {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      console.warn('[StorageManager] Storage API not available');
      return {
        usage: 0,
        quota: 0,
        available: 0,
        usagePercent: 0,
        level: 'ok',
        message: 'Storage API not available',
      };
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const available = quota - usage;
    const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;

    console.log('[StorageManager] Storage status:', {
      usageMB: (usage / 1024 / 1024).toFixed(2),
      quotaMB: (quota / 1024 / 1024).toFixed(2),
      availableMB: (available / 1024 / 1024).toFixed(2),
      usagePercent: usagePercent.toFixed(2),
    });

    // Determine level
    let level: 'ok' | 'warning' | 'critical' = 'ok';
    let message = 'Storage is healthy';

    if (available < STORAGE_CRITICAL_THRESHOLD) {
      level = 'critical';
      message = `Only ${(available / 1024 / 1024).toFixed(0)}MB remaining. Please clear old data.`;
    } else if (available < STORAGE_WARNING_THRESHOLD) {
      level = 'warning';
      message = `Storage is running low (${(available / 1024 / 1024).toFixed(0)}MB remaining).`;
    }

    return {
      usage,
      quota,
      available,
      usagePercent,
      level,
      message,
    };
  } catch (error) {
    console.error('[StorageManager] Failed to check storage quota:', error);
    return {
      usage: 0,
      quota: 0,
      available: 0,
      usagePercent: 0,
      level: 'ok',
      message: 'Failed to check storage',
    };
  }
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  console.log('[StorageManager] Requesting persistent storage');

  try {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      console.warn('[StorageManager] Persistent storage API not available');
      return false;
    }

    // Check if already persisted
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      console.log('[StorageManager] Storage already persisted');
      return true;
    }

    // Request persistence
    const granted = await navigator.storage.persist();
    console.log('[StorageManager] Persistence request result:', { granted });
    return granted;
  } catch (error) {
    console.error('[StorageManager] Failed to request persistent storage:', error);
    return false;
  }
}

/**
 * Get detailed storage breakdown
 */
export async function getStorageBreakdown(): Promise<{
  total: number;
  indexedDB: number;
  caches: number;
  other: number;
}> {
  console.log('[StorageManager] Getting storage breakdown');

  try {
    const estimate = await navigator.storage.estimate();
    const total = estimate.usage || 0;

    // Get IndexedDB size
    const indexedDB = await getDatabaseSize();

    // Estimate cache storage (if available)
    let caches = 0;
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      console.log('[StorageManager] Cache names:', cacheNames);
      // Note: Can't get exact cache sizes, so this is an approximation
      caches = Math.max(0, total - indexedDB);
    }

    const other = Math.max(0, total - indexedDB - caches);

    console.log('[StorageManager] Storage breakdown:', {
      totalMB: (total / 1024 / 1024).toFixed(2),
      indexedDBMB: (indexedDB / 1024 / 1024).toFixed(2),
      cachesMB: (caches / 1024 / 1024).toFixed(2),
      otherMB: (other / 1024 / 1024).toFixed(2),
    });

    return {
      total,
      indexedDB,
      caches,
      other,
    };
  } catch (error) {
    console.error('[StorageManager] Failed to get storage breakdown:', error);
    return {
      total: 0,
      indexedDB: 0,
      caches: 0,
      other: 0,
    };
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  console.log('[StorageManager] Clearing all caches');

  try {
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      console.log('[StorageManager] Deleting caches:', cacheNames);

      await Promise.all(
        cacheNames.map((cacheName) => window.caches.delete(cacheName))
      );

      console.log('[StorageManager] All caches cleared');
    } else {
      console.warn('[StorageManager] Cache API not available');
    }
  } catch (error) {
    console.error('[StorageManager] Failed to clear caches:', error);
    throw error;
  }
}

/**
 * Monitor storage and warn if low
 */
export async function monitorStorage(
  onWarning?: (status: StorageStatus) => void,
  onCritical?: (status: StorageStatus) => void
): Promise<StorageStatus> {
  console.log('[StorageManager] Monitoring storage');

  const status = await checkStorageQuota();

  if (status.level === 'critical' && onCritical) {
    console.warn('[StorageManager] Critical storage level!', status);
    onCritical(status);
  } else if (status.level === 'warning' && onWarning) {
    console.warn('[StorageManager] Storage warning!', status);
    onWarning(status);
  }

  return status;
}
