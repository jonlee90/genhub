/**
 * Phase 1 - Offline Data Hydration
 * Load cached data on app start and sync when online
 *
 * Features:
 * - Hydrate app with cached data on startup
 * - Sync with server when connection available
 * - Monitor connectivity state
 * - Provide cache freshness info
 * - Integrate with background sync manager
 */

'use client';

import {
  getDB,
  getCachedProjects,
  getCachedTasks,
  cacheProjects,
  cacheTasks,
  getStorageEstimate,
  cleanupExpiredData,
} from './indexed-db';
import {
  processSyncQueue,
  getSyncStats,
  clearCompletedSyncs,
  type SyncProgress,
} from './entity-sync';
import {
  processPhotoQueue,
  getPhotoQueueStats,
  type UploadProgress,
} from './photo-queue';

console.log('[Offline Hydration] Module loaded');

// Connectivity state
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let lastSyncTimestamp = 0;
let isHydrating = false;
let isSyncing = false;

// Sync intervals
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export interface OfflineDataStatus {
  isOnline: boolean;
  lastSyncAt: number;
  cacheAge: number;
  isFresh: boolean;
  storage: {
    usage: number;
    quota: number;
    available: number;
    usagePercent: number;
  };
  syncQueue: {
    total: number;
    pending: number;
    failed: number;
  };
  photoQueue: {
    total: number;
    pending: number;
    failed: number;
    totalSize: number;
  };
}

export interface HydrationResult {
  success: boolean;
  projectCount: number;
  taskCount: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  entitiesSynced: number;
  photosSynced: number;
  errors: string[];
}

/**
 * Hydrate app with offline data on startup
 */
export async function hydrateOfflineData(companyId: string): Promise<HydrationResult> {
  if (isHydrating) {
    console.warn('[Offline Hydration] Hydration already in progress');
    return { success: false, projectCount: 0, taskCount: 0, error: 'Already hydrating' };
  }

  isHydrating = true;
  console.log('[Offline Hydration] Starting offline data hydration:', { companyId });

  try {
    // Get cached projects
    const projects = await getCachedProjects(companyId);
    console.log('[Offline Hydration] Projects loaded from cache:', {
      count: projects.length,
    });

    // Get cached tasks (aggregate from all projects)
    let allTasks: any[] = [];
    for (const project of projects) {
      const tasks = await getCachedTasks(project.id);
      allTasks = allTasks.concat(tasks);
    }
    console.log('[Offline Hydration] Tasks loaded from cache:', {
      count: allTasks.length,
    });

    // Clean up expired data in background
    setTimeout(() => cleanupExpiredData(), 1000);

    isHydrating = false;

    console.log('[Offline Hydration] Hydration complete');

    return {
      success: true,
      projectCount: projects.length,
      taskCount: allTasks.length,
    };
  } catch (error) {
    console.error('[Offline Hydration] Hydration failed:', error);
    isHydrating = false;

    return {
      success: false,
      projectCount: 0,
      taskCount: 0,
      error: error instanceof Error ? error.message : 'Hydration failed',
    };
  }
}

/**
 * Sync online data when connection available
 */
export async function syncOnlineData(params: {
  companyId: string;
  onEntityProgress?: (progress: SyncProgress) => void;
  onPhotoProgress?: (progress: UploadProgress) => void;
}): Promise<SyncResult> {
  if (isSyncing) {
    console.warn('[Offline Hydration] Sync already in progress');
    return {
      success: false,
      entitiesSynced: 0,
      photosSynced: 0,
      errors: ['Sync already in progress'],
    };
  }

  if (!isOnline) {
    console.warn('[Offline Hydration] Cannot sync while offline');
    return {
      success: false,
      entitiesSynced: 0,
      photosSynced: 0,
      errors: ['Device is offline'],
    };
  }

  isSyncing = true;
  console.log('[Offline Hydration] Starting online sync');

  const errors: string[] = [];
  let entitiesSynced = 0;
  let photosSynced = 0;

  try {
    // Sync entity queue
    try {
      console.log('[Offline Hydration] Syncing entity queue');
      const entityProgress = await processSyncQueue(params.onEntityProgress);
      entitiesSynced = entityProgress.synced;

      if (entityProgress.failed > 0) {
        errors.push(`${entityProgress.failed} entities failed to sync`);
      }

      // Clear completed syncs
      await clearCompletedSyncs();
    } catch (error) {
      console.error('[Offline Hydration] Entity sync failed:', error);
      errors.push('Entity sync failed');
    }

    // Upload photos
    try {
      console.log('[Offline Hydration] Uploading photos');
      const photoProgress = await processPhotoQueue(params.onPhotoProgress);
      photosSynced = photoProgress.uploaded;

      if (photoProgress.failed > 0) {
        errors.push(`${photoProgress.failed} photos failed to upload`);
      }
    } catch (error) {
      console.error('[Offline Hydration] Photo upload failed:', error);
      errors.push('Photo upload failed');
    }

    // Fetch fresh data from server
    try {
      console.log('[Offline Hydration] Fetching fresh data from server');
      await fetchAndCacheOnlineData(params.companyId);
    } catch (error) {
      console.error('[Offline Hydration] Failed to fetch fresh data:', error);
      errors.push('Failed to fetch fresh data');
    }

    lastSyncTimestamp = Date.now();
    isSyncing = false;

    console.log('[Offline Hydration] Sync complete:', {
      entitiesSynced,
      photosSynced,
      errors: errors.length,
    });

    return {
      success: errors.length === 0,
      entitiesSynced,
      photosSynced,
      errors,
    };
  } catch (error) {
    console.error('[Offline Hydration] Sync failed:', error);
    isSyncing = false;

    return {
      success: false,
      entitiesSynced,
      photosSynced,
      errors: [...errors, error instanceof Error ? error.message : 'Sync failed'],
    };
  }
}

/**
 * Fetch and cache fresh data from server
 */
async function fetchAndCacheOnlineData(companyId: string): Promise<void> {
  console.log('[Offline Hydration] Fetching fresh data:', { companyId });

  try {
    // Fetch projects
    const projectsResponse = await fetch('/api/projects');
    if (projectsResponse.ok) {
      const { data: projects } = await projectsResponse.json();
      if (projects && Array.isArray(projects)) {
        await cacheProjects(
          projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            address: p.address,
            companyId: p.company_id,
            managerId: p.manager_id,
            data: p,
          }))
        );
        console.log('[Offline Hydration] Projects cached:', { count: projects.length });
      }
    }

    // Fetch tasks for each project
    const projects = await getCachedProjects(companyId);
    for (const project of projects) {
      try {
        const tasksResponse = await fetch(`/api/projects/${project.id}/tasks`);
        if (tasksResponse.ok) {
          const { data: tasks } = await tasksResponse.json();
          if (tasks && Array.isArray(tasks)) {
            await cacheTasks(
              tasks.map((t: any) => ({
                id: t.id,
                projectId: t.project_id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                assigneeId: t.assignee_id,
                dueDate: t.due_date,
                data: t,
              }))
            );
          }
        }
      } catch (error) {
        console.error(
          '[Offline Hydration] Failed to fetch tasks for project:',
          project.id,
          error
        );
      }
    }

    console.log('[Offline Hydration] Fresh data cached');
  } catch (error) {
    console.error('[Offline Hydration] Failed to fetch fresh data:', error);
    throw error;
  }
}

/**
 * Watch connectivity state
 */
export function watchConnectivity(callbacks?: {
  onOnline?: () => void;
  onOffline?: () => void;
}): () => void {
  console.log('[Offline Hydration] Starting connectivity watch');

  const handleOnline = () => {
    console.log('[Offline Hydration] Device is online');
    isOnline = true;
    callbacks?.onOnline?.();
  };

  const handleOffline = () => {
    console.log('[Offline Hydration] Device is offline');
    isOnline = false;
    callbacks?.onOffline?.();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  return () => {};
}

/**
 * Get offline data status
 */
export async function getOfflineDataStatus(): Promise<OfflineDataStatus> {
  console.log('[Offline Hydration] Getting offline data status');

  try {
    const storage = await getStorageEstimate();
    const syncStats = await getSyncStats();
    const photoStats = await getPhotoQueueStats();

    const cacheAge = lastSyncTimestamp > 0 ? Date.now() - lastSyncTimestamp : Infinity;
    const isFresh = cacheAge < 10 * 60 * 1000; // Fresh if < 10 minutes

    const status: OfflineDataStatus = {
      isOnline,
      lastSyncAt: lastSyncTimestamp,
      cacheAge,
      isFresh,
      storage,
      syncQueue: {
        total: syncStats.total,
        pending: syncStats.pending,
        failed: syncStats.failed,
      },
      photoQueue: {
        total: photoStats.total,
        pending: photoStats.pending,
        failed: photoStats.failed,
        totalSize: photoStats.totalSize,
      },
    };

    console.log('[Offline Hydration] Status:', status);
    return status;
  } catch (error) {
    console.error('[Offline Hydration] Failed to get status:', error);

    return {
      isOnline,
      lastSyncAt: 0,
      cacheAge: Infinity,
      isFresh: false,
      storage: { usage: 0, quota: 0, available: 0, usagePercent: 0 },
      syncQueue: { total: 0, pending: 0, failed: 0 },
      photoQueue: { total: 0, pending: 0, failed: 0, totalSize: 0 },
    };
  }
}

/**
 * Start automatic background sync
 */
export function startBackgroundSync(
  companyId: string,
  options?: {
    syncInterval?: number;
    cleanupInterval?: number;
  }
): () => void {
  console.log('[Offline Hydration] Starting background sync');

  const syncInterval = options?.syncInterval || SYNC_INTERVAL_MS;
  const cleanupInterval = options?.cleanupInterval || CLEANUP_INTERVAL_MS;

  // Periodic sync
  const syncTimer = setInterval(async () => {
    if (isOnline && !isSyncing) {
      console.log('[Offline Hydration] Running periodic sync');
      await syncOnlineData({ companyId });
    }
  }, syncInterval);

  // Periodic cleanup
  const cleanupTimer = setInterval(async () => {
    console.log('[Offline Hydration] Running periodic cleanup');
    await cleanupExpiredData();
  }, cleanupInterval);

  console.log('[Offline Hydration] Background sync started');

  // Return cleanup function
  return () => {
    clearInterval(syncTimer);
    clearInterval(cleanupTimer);
    console.log('[Offline Hydration] Background sync stopped');
  };
}

/**
 * Force immediate sync
 */
export async function forceSync(
  companyId: string,
  callbacks?: {
    onEntityProgress?: (progress: SyncProgress) => void;
    onPhotoProgress?: (progress: UploadProgress) => void;
  }
): Promise<SyncResult> {
  console.log('[Offline Hydration] Forcing immediate sync');

  if (!isOnline) {
    throw new Error('Cannot sync while offline');
  }

  return await syncOnlineData({
    companyId,
    onEntityProgress: callbacks?.onEntityProgress,
    onPhotoProgress: callbacks?.onPhotoProgress,
  });
}

/**
 * Check if app has stale data
 */
export function hasStaleData(): boolean {
  if (lastSyncTimestamp === 0) {
    return true; // Never synced
  }

  const cacheAge = Date.now() - lastSyncTimestamp;
  const isStale = cacheAge > 10 * 60 * 1000; // Stale if > 10 minutes

  console.log('[Offline Hydration] Stale data check:', {
    cacheAge,
    isStale,
  });

  return isStale;
}

/**
 * Get cache freshness as human-readable string
 */
export function getCacheFreshness(lastSyncAt: number): string {
  if (lastSyncAt === 0) {
    return 'Never synced';
  }

  const ageMs = Date.now() - lastSyncAt;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  const ageHours = Math.floor(ageMinutes / 60);

  if (ageHours > 24) {
    const ageDays = Math.floor(ageHours / 24);
    return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
  } else if (ageHours > 0) {
    return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  } else if (ageMinutes > 0) {
    return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Initialize offline support on app start
 */
export async function initializeOfflineSupport(params: {
  companyId: string;
  autoSync?: boolean;
  onOnline?: () => void;
  onOffline?: () => void;
}): Promise<{
  hydration: HydrationResult;
  status: OfflineDataStatus;
  cleanup?: () => void;
}> {
  console.log('[Offline Hydration] Initializing offline support');

  try {
    // Hydrate with cached data
    const hydration = await hydrateOfflineData(params.companyId);

    // Get status
    const status = await getOfflineDataStatus();

    // Watch connectivity
    const stopWatching = watchConnectivity({
      onOnline: async () => {
        params.onOnline?.();
        // Auto-sync when coming online
        if (params.autoSync !== false) {
          await syncOnlineData({ companyId: params.companyId });
        }
      },
      onOffline: params.onOffline,
    });

    // Start background sync if auto-sync enabled
    let stopBackgroundSync: (() => void) | undefined;
    if (params.autoSync !== false) {
      stopBackgroundSync = startBackgroundSync(params.companyId);
    }

    console.log('[Offline Hydration] Offline support initialized');

    return {
      hydration,
      status,
      cleanup: () => {
        stopWatching();
        stopBackgroundSync?.();
      },
    };
  } catch (error) {
    console.error('[Offline Hydration] Failed to initialize offline support:', error);
    throw error;
  }
}

// Export connectivity state
export function getConnectivityState(): {
  isOnline: boolean;
  lastSyncTimestamp: number;
  isHydrating: boolean;
  isSyncing: boolean;
} {
  return {
    isOnline,
    lastSyncTimestamp,
    isHydrating,
    isSyncing,
  };
}

// Export configuration
export const OFFLINE_HYDRATION_CONFIG = {
  SYNC_INTERVAL_MS,
  CLEANUP_INTERVAL_MS,
} as const;
