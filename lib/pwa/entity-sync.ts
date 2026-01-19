/**
 * Phase 1 - Generic Entity Sync Module
 * Handles offline operations for any entity type
 *
 * Provides a unified sync queue system that works with:
 * - Tasks
 * - Projects
 * - Expenses
 * - Spatial markers
 * - Photos
 * - Any other entity requiring offline support
 */

'use client';

import { getDB } from './indexed-db';

console.log('[Entity Sync] Module loaded');

// Sync configuration
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 5000;
const SYNC_BATCH_SIZE = 10;
const HIGH_PRIORITY = 8;
const NORMAL_PRIORITY = 5;
const LOW_PRIORITY = 2;

export interface SyncEntity {
  id: string;
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  entityId: string | null;
  data: any;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  priority: number;
  attempts: number;
  maxRetries: number;
  createdAt: number;
  lastAttemptAt: number | null;
  error: string | null;
  metadata: {
    userId: string;
    companyId: string;
    projectId?: string;
  };
}

export interface SyncResult {
  success: boolean;
  entityId?: string;
  error?: string;
}

export interface SyncProgress {
  total: number;
  synced: number;
  failed: number;
  pending: number;
}

/**
 * Enqueue an entity for background sync
 */
export async function enqueueSync(params: {
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  entityId?: string | null;
  data: any;
  priority?: number;
  maxRetries?: number;
  metadata: {
    userId: string;
    companyId: string;
    projectId?: string;
  };
}): Promise<string> {
  console.log('[Entity Sync] Enqueueing sync:', {
    entityType: params.entityType,
    operation: params.operation,
  });

  const db = await getDB();
  const id = `${params.entityType}-${params.operation}-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    const entity: SyncEntity = {
      id,
      entityType: params.entityType,
      operation: params.operation,
      entityId: params.entityId || null,
      data: params.data,
      status: 'pending',
      priority: params.priority || NORMAL_PRIORITY,
      attempts: 0,
      maxRetries: params.maxRetries || DEFAULT_MAX_RETRIES,
      createdAt: Date.now(),
      lastAttemptAt: null,
      error: null,
      metadata: params.metadata,
    };

    await db.put('entity_sync_queue', entity);

    console.log('[Entity Sync] Entity enqueued:', { id, entityType: params.entityType });

    // Trigger background sync if available
    await triggerBackgroundSync();

    return id;
  } catch (error) {
    console.error('[Entity Sync] Failed to enqueue entity:', error);
    throw error;
  }
}

/**
 * Remove entity from sync queue after successful sync
 */
export async function dequeueSynced(syncId: string): Promise<boolean> {
  console.log('[Entity Sync] Dequeuing synced entity:', { syncId });

  const db = await getDB();

  try {
    await db.delete('entity_sync_queue', syncId);
    console.log('[Entity Sync] Entity dequeued successfully');
    return true;
  } catch (error) {
    console.error('[Entity Sync] Failed to dequeue entity:', error);
    return false;
  }
}

/**
 * Get all queued entities
 */
export async function getQueuedEntities(
  filters?: {
    entityType?: string;
    status?: 'pending' | 'syncing' | 'synced' | 'error';
    priority?: number;
  }
): Promise<SyncEntity[]> {
  console.log('[Entity Sync] Getting queued entities:', filters);

  const db = await getDB();

  try {
    let entities: SyncEntity[];

    if (filters?.status) {
      entities = await db.getAllFromIndex(
        'entity_sync_queue',
        'by-status',
        filters.status
      );
    } else if (filters?.entityType) {
      entities = await db.getAllFromIndex(
        'entity_sync_queue',
        'by-entity-type',
        filters.entityType
      );
    } else {
      entities = await db.getAll('entity_sync_queue');
    }

    // Apply additional filters
    if (filters?.priority !== undefined) {
      entities = entities.filter((e) => e.priority >= filters.priority!);
    }

    // Sort by priority (desc) then created (asc)
    entities.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.createdAt - b.createdAt; // Older first
    });

    console.log('[Entity Sync] Queued entities retrieved:', {
      count: entities.length,
    });

    return entities;
  } catch (error) {
    console.error('[Entity Sync] Failed to get queued entities:', error);
    return [];
  }
}

/**
 * Check if entity type supports offline operations
 */
export function isOfflineAware(entityType: string): boolean {
  const offlineAwareTypes = [
    'task',
    'marker',
    'expense',
    'photo',
    'project',
    'note',
    'comment',
  ];

  const isAware = offlineAwareTypes.includes(entityType);

  console.log('[Entity Sync] Offline awareness check:', {
    entityType,
    isOfflineAware: isAware,
  });

  return isAware;
}

/**
 * Update sync entity status
 */
export async function updateSyncStatus(
  syncId: string,
  status: 'pending' | 'syncing' | 'synced' | 'error',
  error?: string
): Promise<void> {
  console.log('[Entity Sync] Updating sync status:', { syncId, status, error });

  const db = await getDB();

  try {
    const entity = await db.get('entity_sync_queue', syncId);
    if (!entity) {
      console.warn('[Entity Sync] Sync entity not found:', { syncId });
      return;
    }

    await db.put('entity_sync_queue', {
      ...entity,
      status,
      attempts: entity.attempts + 1,
      lastAttemptAt: Date.now(),
      error: error || null,
    });

    console.log('[Entity Sync] Sync status updated');
  } catch (error) {
    console.error('[Entity Sync] Failed to update sync status:', error);
    throw error;
  }
}

/**
 * Process sync queue
 */
export async function processSyncQueue(
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncProgress> {
  console.log('[Entity Sync] Processing sync queue');

  const pendingEntities = await getQueuedEntities({ status: 'pending' });

  if (pendingEntities.length === 0) {
    console.log('[Entity Sync] No pending entities to sync');
    return { total: 0, synced: 0, failed: 0, pending: 0 };
  }

  const progress: SyncProgress = {
    total: pendingEntities.length,
    synced: 0,
    failed: 0,
    pending: pendingEntities.length,
  };

  // Notify initial progress
  onProgress?.(progress);

  // Process in batches
  for (let i = 0; i < pendingEntities.length; i += SYNC_BATCH_SIZE) {
    const batch = pendingEntities.slice(i, i + SYNC_BATCH_SIZE);

    console.log('[Entity Sync] Processing batch:', {
      batchIndex: i / SYNC_BATCH_SIZE,
      batchSize: batch.length,
    });

    await Promise.all(
      batch.map(async (entity) => {
        try {
          // Mark as syncing
          await updateSyncStatus(entity.id, 'syncing');

          // Sync entity
          const result = await syncEntityWithRetry(entity);

          if (result.success) {
            // Mark as synced
            await updateSyncStatus(entity.id, 'synced');
            progress.synced++;
          } else {
            // Mark as error
            await updateSyncStatus(entity.id, 'error', result.error);
            progress.failed++;
          }

          progress.pending--;

          // Notify progress
          onProgress?.({ ...progress });
        } catch (error) {
          console.error('[Entity Sync] Failed to sync entity:', entity.id, error);

          await updateSyncStatus(
            entity.id,
            'error',
            error instanceof Error ? error.message : 'Sync failed'
          );

          progress.failed++;
          progress.pending--;
          onProgress?.({ ...progress });
        }
      })
    );
  }

  console.log('[Entity Sync] Sync queue processed:', progress);
  return progress;
}

/**
 * Sync entity with retry logic
 */
async function syncEntityWithRetry(entity: SyncEntity): Promise<SyncResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= entity.maxRetries; attempt++) {
    try {
      console.log('[Entity Sync] Sync attempt:', {
        entityId: entity.id,
        attempt,
        maxRetries: entity.maxRetries,
      });

      const result = await syncEntity(entity);

      if (result.success) {
        // Auto-dequeue if synced successfully
        await dequeueSynced(entity.id);
        return result;
      }

      lastError = new Error(result.error || 'Sync failed');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Sync failed');
      console.warn('[Entity Sync] Sync attempt failed:', {
        entityId: entity.id,
        attempt,
        error: lastError.message,
      });
    }

    // Don't retry on last attempt
    if (attempt < entity.maxRetries) {
      const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.log('[Entity Sync] Retrying after delay:', { delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Sync failed after retries',
  };
}

/**
 * Sync individual entity
 */
async function syncEntity(entity: SyncEntity): Promise<SyncResult> {
  console.log('[Entity Sync] Syncing entity:', {
    entityType: entity.entityType,
    operation: entity.operation,
  });

  try {
    // Build API endpoint based on entity type
    const endpoint = getEntityEndpoint(entity.entityType, entity.operation, entity.entityId);

    // Determine HTTP method
    const method = getHttpMethod(entity.operation);

    // Make API request
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'DELETE' ? JSON.stringify(entity.data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to sync ${entity.entityType}: ${response.statusText} - ${errorText}`
      );
    }

    // Parse response for create operations
    let entityId = entity.entityId;
    if (entity.operation === 'create') {
      const data = await response.json();
      entityId = data.id || data.data?.id;
    }

    console.log('[Entity Sync] Entity synced successfully:', {
      entityType: entity.entityType,
      entityId,
    });

    return { success: true, entityId: entityId || undefined };
  } catch (error) {
    console.error('[Entity Sync] Failed to sync entity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

/**
 * Get API endpoint for entity type
 */
function getEntityEndpoint(
  entityType: string,
  operation: 'create' | 'update' | 'delete',
  entityId: string | null
): string {
  const baseEndpoints: Record<string, string> = {
    task: '/api/tasks',
    project: '/api/projects',
    expense: '/api/expenses',
    marker: '/api/projects/spatial/markers',
    photo: '/api/photos',
    note: '/api/notes',
    comment: '/api/comments',
  };

  const base = baseEndpoints[entityType] || `/api/${entityType}s`;

  if (operation === 'create') {
    return base;
  }

  return `${base}/${entityId}`;
}

/**
 * Get HTTP method for operation
 */
function getHttpMethod(operation: 'create' | 'update' | 'delete'): string {
  const methods: Record<string, string> = {
    create: 'POST',
    update: 'PATCH',
    delete: 'DELETE',
  };

  return methods[operation];
}

/**
 * Trigger background sync via service worker
 */
async function triggerBackgroundSync(): Promise<void> {
  console.log('[Entity Sync] Triggering background sync');

  try {
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-entities');
      console.log('[Entity Sync] Background sync registered');
    } else {
      console.warn('[Entity Sync] Background sync not supported');
      // Fallback to immediate sync
      setTimeout(() => processSyncQueue(), 1000);
    }
  } catch (error) {
    console.error('[Entity Sync] Failed to trigger background sync:', error);
  }
}

/**
 * Get sync queue statistics
 */
export async function getSyncStats(): Promise<{
  total: number;
  pending: number;
  syncing: number;
  failed: number;
  byEntityType: Record<string, number>;
}> {
  console.log('[Entity Sync] Getting sync stats');

  const db = await getDB();

  try {
    const allEntities = await db.getAll('entity_sync_queue');

    const stats = {
      total: allEntities.length,
      pending: 0,
      syncing: 0,
      failed: 0,
      byEntityType: {} as Record<string, number>,
    };

    for (const entity of allEntities) {
      if (entity.status === 'pending') stats.pending++;
      if (entity.status === 'syncing') stats.syncing++;
      if (entity.status === 'error') stats.failed++;

      stats.byEntityType[entity.entityType] =
        (stats.byEntityType[entity.entityType] || 0) + 1;
    }

    console.log('[Entity Sync] Sync stats:', stats);
    return stats;
  } catch (error) {
    console.error('[Entity Sync] Failed to get sync stats:', error);
    return {
      total: 0,
      pending: 0,
      syncing: 0,
      failed: 0,
      byEntityType: {},
    };
  }
}

/**
 * Clear completed sync operations
 */
export async function clearCompletedSyncs(): Promise<number> {
  console.log('[Entity Sync] Clearing completed syncs');

  const db = await getDB();
  let cleared = 0;

  try {
    const syncedEntities = await db.getAllFromIndex(
      'entity_sync_queue',
      'by-status',
      'synced'
    );

    for (const entity of syncedEntities) {
      await db.delete('entity_sync_queue', entity.id);
      cleared++;
    }

    console.log('[Entity Sync] Completed syncs cleared:', { count: cleared });
    return cleared;
  } catch (error) {
    console.error('[Entity Sync] Failed to clear completed syncs:', error);
    return 0;
  }
}

// Export priority constants
export const SYNC_PRIORITY = {
  HIGH: HIGH_PRIORITY,
  NORMAL: NORMAL_PRIORITY,
  LOW: LOW_PRIORITY,
} as const;
