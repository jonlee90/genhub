'use client';

/**
 * useOfflineData Hook
 *
 * Subscribes to offline cache updates for entity types.
 * Provides real-time cache status and pending sync information.
 *
 * Features:
 * - Subscribe to cache invalidation events
 * - Track stale data state
 * - Monitor pending sync operations
 * - Entity-level granularity
 * - Works with service worker cache
 *
 * @example
 * ```tsx
 * const { data, isStale, lastUpdated, syncPending } = useOfflineData('tasks');
 *
 * if (isStale) {
 *   return <Banner>Data may be outdated - Sync pending</Banner>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export type EntityType =
  | 'projects'
  | 'tasks'
  | 'materials'
  | 'expenses'
  | 'team'
  | 'chat';

interface OfflineDataState<T = unknown> {
  /** Cached data for entity type */
  data: T | null;
  /** Whether data is stale and needs refresh */
  isStale: boolean;
  /** Last cache update timestamp */
  lastUpdated: Date | null;
  /** Number of pending sync operations */
  syncPending: number;
}

interface CacheEvent {
  entityType: EntityType;
  action: 'update' | 'invalidate' | 'sync';
  timestamp: number;
}

interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
}

const CACHE_EVENT_NAME = 'genhub-cache-update';
const SYNC_QUEUE_KEY = 'genhub-sync-queue';

// Global cache state (in-memory)
const cacheState = new Map<EntityType, OfflineDataState>();

// Global listeners
const listeners = new Map<EntityType, Set<() => void>>();

/**
 * Emit cache update event
 */
export function emitCacheUpdate(entityType: EntityType, action: CacheEvent['action']): void {
  if (typeof window === 'undefined') return;

  const event: CacheEvent = {
    entityType,
    action,
    timestamp: Date.now(),
  };

  // Update in-memory state
  const current = cacheState.get(entityType) || {
    data: null,
    isStale: false,
    lastUpdated: null,
    syncPending: 0,
  };

  if (action === 'invalidate') {
    cacheState.set(entityType, {
      ...current,
      isStale: true,
    });
  } else if (action === 'update') {
    cacheState.set(entityType, {
      ...current,
      isStale: false,
      lastUpdated: new Date(),
    });
  }

  // Notify listeners
  const entityListeners = listeners.get(entityType);
  if (entityListeners) {
    entityListeners.forEach((listener) => listener());
  }

  // Dispatch custom event
  window.dispatchEvent(
    new CustomEvent(CACHE_EVENT_NAME, { detail: event })
  );
}

/**
 * Get pending sync operations from localStorage
 */
function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('[useOfflineData] Failed to read sync queue:', error);
    return [];
  }
}

/**
 * Add item to sync queue
 */
export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const queue = getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    queue.push(newItem);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

    // Notify listeners
    emitCacheUpdate(item.entityType, 'invalidate');
  } catch (error) {
    console.error('[useOfflineData] Failed to add to sync queue:', error);
  }
}

/**
 * Remove item from sync queue
 */
export function removeFromSyncQueue(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const queue = getSyncQueue();
    const filtered = queue.filter((item) => item.id !== id);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[useOfflineData] Failed to remove from sync queue:', error);
  }
}

/**
 * Clear sync queue for entity type
 */
export function clearSyncQueue(entityType: EntityType): void {
  if (typeof window === 'undefined') return;

  try {
    const queue = getSyncQueue();
    const filtered = queue.filter((item) => item.entityType !== entityType);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));

    // Notify listeners
    emitCacheUpdate(entityType, 'sync');
  } catch (error) {
    console.error('[useOfflineData] Failed to clear sync queue:', error);
  }
}

export function useOfflineData<T = unknown>(
  entityType: EntityType
): OfflineDataState<T> {
  const isOnline = useOnlineStatus();

  const [state, setState] = useState<OfflineDataState<T>>(() => {
    const cached = cacheState.get(entityType);
    const queue = getSyncQueue();
    const syncPending = queue.filter((item) => item.entityType === entityType).length;

    return (
      (cached as OfflineDataState<T>) || {
        data: null,
        isStale: !isOnline,
        lastUpdated: null,
        syncPending,
      }
    );
  });

  const updateState = useCallback(() => {
    const cached = cacheState.get(entityType);
    const queue = getSyncQueue();
    const syncPending = queue.filter((item) => item.entityType === entityType).length;

    setState((prev) => ({
      ...(cached as OfflineDataState<T>),
      data: prev.data, // Preserve data
      syncPending,
      isStale: !isOnline || (cached?.isStale ?? false),
    }));
  }, [entityType, isOnline]);

  // Subscribe to cache updates
  useEffect(() => {
    // Register listener
    if (!listeners.has(entityType)) {
      listeners.set(entityType, new Set());
    }
    listeners.get(entityType)!.add(updateState);

    // Listen for custom events
    const handleCacheEvent = (event: Event) => {
      const customEvent = event as CustomEvent<CacheEvent>;
      if (customEvent.detail.entityType === entityType) {
        updateState();
      }
    };

    window.addEventListener(CACHE_EVENT_NAME, handleCacheEvent);

    // Initial update
    updateState();

    // Cleanup
    return () => {
      listeners.get(entityType)?.delete(updateState);
      window.removeEventListener(CACHE_EVENT_NAME, handleCacheEvent);
    };
  }, [entityType, updateState]);

  // Update stale state when online status changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isStale: !isOnline || prev.isStale,
    }));
  }, [isOnline]);

  return state;
}

/**
 * useOfflineSync Hook
 *
 * Monitor and control sync operations across all entity types
 */
export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    const updateQueue = () => {
      setQueue(getSyncQueue());
    };

    // Listen for cache events
    window.addEventListener(CACHE_EVENT_NAME, updateQueue);

    // Initial load
    updateQueue();

    // Cleanup
    return () => {
      window.removeEventListener(CACHE_EVENT_NAME, updateQueue);
    };
  }, []);

  const totalPending = queue.length;

  const syncAll = useCallback(async () => {
    if (!isOnline) {
      console.warn('[useOfflineSync] Cannot sync while offline');
      return;
    }

    // Process each item in queue
    for (const item of queue) {
      try {
        // TODO: Implement actual sync logic based on entity type
        console.log('[useOfflineSync] Syncing:', item);

        // Remove from queue on success
        removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('[useOfflineSync] Sync failed for:', item, error);
      }
    }

    // Update state
    setQueue(getSyncQueue());
  }, [isOnline, queue]);

  return {
    queue,
    totalPending,
    syncAll,
    isOnline,
  };
}
