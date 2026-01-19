/**
 * Phase 1 - Enhanced IndexedDB Schema
 * Foundation infrastructure layer for offline support
 *
 * Extends existing spatial IndexedDB with:
 * - Generic entity caching (projects, tasks)
 * - Form draft persistence
 * - Photo upload queue
 * - Generic sync queue for any entity type
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

console.log('[PWA IndexedDB] Module loaded');

// Database configuration
const DB_NAME = 'genhub-pwa';
const DB_VERSION = 2; // Incremented for new stores

// Storage limits
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_PHOTO_QUEUE_SIZE = 100;
const STORAGE_QUOTA_WARNING = 50 * 1024 * 1024; // 50MB

/**
 * Enhanced IndexedDB Schema
 */
interface GenHubPWADB extends DBSchema {
  // Project list cache (for offline browsing)
  projects_cache: {
    key: string; // projectId
    value: {
      id: string;
      name: string;
      status: string;
      address: string | null;
      companyId: string;
      managerId: string | null;
      cachedAt: number;
      data: any; // Full project data
    };
    indexes: { 'by-company': string; 'by-cached': number };
  };

  // Task list cache (for offline task management)
  tasks_cache: {
    key: string; // taskId
    value: {
      id: string;
      projectId: string;
      title: string;
      status: string;
      priority: string;
      assigneeId: string | null;
      dueDate: string | null;
      cachedAt: number;
      data: any; // Full task data
      hasPendingMutation: boolean; // Flag for offline changes
    };
    indexes: {
      'by-project': string;
      'by-status': string;
      'by-pending': number;
      'by-cached': number;
    };
  };

  // Form draft persistence (auto-save)
  form_drafts: {
    key: string; // formId (e.g., "create-task-{projectId}")
    value: {
      formId: string;
      formType: string; // 'task', 'expense', 'project', etc.
      data: any; // Form field values
      savedAt: number;
      expiresAt: number;
    };
    indexes: { 'by-type': string; 'by-expires': number };
  };

  // Photo upload queue
  photo_queue: {
    key: string; // queueId
    value: {
      id: string;
      entityType: string; // 'task', 'marker', 'expense', etc.
      entityId: string;
      fileName: string;
      fileBlob: Blob;
      fileSize: number;
      mimeType: string;
      status: 'pending' | 'uploading' | 'uploaded' | 'failed';
      attempts: number;
      lastAttemptAt: number | null;
      error: string | null;
      createdAt: number;
      metadata: any; // Additional context
    };
    indexes: {
      'by-status': string;
      'by-entity': string;
      'by-created': number;
    };
  };

  // Generic entity sync queue (replaces spatial-specific queue)
  entity_sync_queue: {
    key: string; // queueId
    value: {
      id: string;
      entityType: string; // 'task', 'project', 'expense', 'marker', etc.
      operation: 'create' | 'update' | 'delete';
      entityId: string | null; // Null for create operations
      data: any;
      status: 'pending' | 'syncing' | 'synced' | 'error';
      priority: number; // Higher = more important (0-10)
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
    };
    indexes: {
      'by-status': string;
      'by-priority': number;
      'by-entity-type': string;
      'by-created': number;
    };
  };
}

// Singleton database instance
let dbInstance: IDBPDatabase<GenHubPWADB> | null = null;

/**
 * Get or create IndexedDB connection
 */
export async function getDB(): Promise<IDBPDatabase<GenHubPWADB>> {
  console.log('[PWA IndexedDB] Getting database connection');

  if (dbInstance) {
    console.log('[PWA IndexedDB] Reusing existing connection');
    return dbInstance;
  }

  console.log('[PWA IndexedDB] Opening new connection:', { DB_NAME, DB_VERSION });

  try {
    dbInstance = await openDB<GenHubPWADB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log('[PWA IndexedDB] Upgrading database:', {
          oldVersion,
          newVersion,
        });

        // Create projects_cache store
        if (!db.objectStoreNames.contains('projects_cache')) {
          const projectsStore = db.createObjectStore('projects_cache', {
            keyPath: 'id',
          });
          projectsStore.createIndex('by-company', 'companyId');
          projectsStore.createIndex('by-cached', 'cachedAt');
          console.log('[PWA IndexedDB] Created projects_cache store');
        }

        // Create tasks_cache store
        if (!db.objectStoreNames.contains('tasks_cache')) {
          const tasksStore = db.createObjectStore('tasks_cache', {
            keyPath: 'id',
          });
          tasksStore.createIndex('by-project', 'projectId');
          tasksStore.createIndex('by-status', 'status');
          tasksStore.createIndex('by-pending', 'hasPendingMutation');
          tasksStore.createIndex('by-cached', 'cachedAt');
          console.log('[PWA IndexedDB] Created tasks_cache store');
        }

        // Create form_drafts store
        if (!db.objectStoreNames.contains('form_drafts')) {
          const draftsStore = db.createObjectStore('form_drafts', {
            keyPath: 'formId',
          });
          draftsStore.createIndex('by-type', 'formType');
          draftsStore.createIndex('by-expires', 'expiresAt');
          console.log('[PWA IndexedDB] Created form_drafts store');
        }

        // Create photo_queue store
        if (!db.objectStoreNames.contains('photo_queue')) {
          const photoStore = db.createObjectStore('photo_queue', {
            keyPath: 'id',
          });
          photoStore.createIndex('by-status', 'status');
          photoStore.createIndex('by-entity', 'entityType');
          photoStore.createIndex('by-created', 'createdAt');
          console.log('[PWA IndexedDB] Created photo_queue store');
        }

        // Create entity_sync_queue store
        if (!db.objectStoreNames.contains('entity_sync_queue')) {
          const syncStore = db.createObjectStore('entity_sync_queue', {
            keyPath: 'id',
          });
          syncStore.createIndex('by-status', 'status');
          syncStore.createIndex('by-priority', 'priority');
          syncStore.createIndex('by-entity-type', 'entityType');
          syncStore.createIndex('by-created', 'createdAt');
          console.log('[PWA IndexedDB] Created entity_sync_queue store');
        }
      },
    });

    console.log('[PWA IndexedDB] Database opened successfully');
    return dbInstance;
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to open database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[PWA IndexedDB] Database connection closed');
  }
}

/**
 * Store projects in cache
 */
export async function cacheProjects(
  projects: Array<{
    id: string;
    name: string;
    status: string;
    address: string | null;
    companyId: string;
    managerId: string | null;
    data: any;
  }>
): Promise<void> {
  console.log('[PWA IndexedDB] Caching projects:', { count: projects.length });

  const db = await getDB();
  const tx = db.transaction('projects_cache', 'readwrite');

  try {
    await Promise.all(
      projects.map((project) =>
        tx.store.put({
          ...project,
          cachedAt: Date.now(),
        })
      )
    );

    await tx.done;
    console.log('[PWA IndexedDB] Projects cached successfully');
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to cache projects:', error);
    throw error;
  }
}

/**
 * Get cached projects by company
 */
export async function getCachedProjects(companyId: string) {
  console.log('[PWA IndexedDB] Getting cached projects:', { companyId });

  const db = await getDB();

  try {
    const projects = await db.getAllFromIndex(
      'projects_cache',
      'by-company',
      companyId
    );

    console.log('[PWA IndexedDB] Cached projects retrieved:', {
      count: projects.length,
    });
    return projects;
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to get cached projects:', error);
    return [];
  }
}

/**
 * Cache tasks for a project
 */
export async function cacheTasks(
  tasks: Array<{
    id: string;
    projectId: string;
    title: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    dueDate: string | null;
    data: any;
  }>
): Promise<void> {
  console.log('[PWA IndexedDB] Caching tasks:', { count: tasks.length });

  const db = await getDB();
  const tx = db.transaction('tasks_cache', 'readwrite');

  try {
    await Promise.all(
      tasks.map((task) =>
        tx.store.put({
          ...task,
          cachedAt: Date.now(),
          hasPendingMutation: false,
        })
      )
    );

    await tx.done;
    console.log('[PWA IndexedDB] Tasks cached successfully');
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to cache tasks:', error);
    throw error;
  }
}

/**
 * Get cached tasks by project
 */
export async function getCachedTasks(projectId: string) {
  console.log('[PWA IndexedDB] Getting cached tasks:', { projectId });

  const db = await getDB();

  try {
    const tasks = await db.getAllFromIndex(
      'tasks_cache',
      'by-project',
      projectId
    );

    console.log('[PWA IndexedDB] Cached tasks retrieved:', {
      count: tasks.length,
    });
    return tasks;
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to get cached tasks:', error);
    return [];
  }
}

/**
 * Mark task as having pending mutations
 */
export async function markTaskAsPending(taskId: string): Promise<void> {
  console.log('[PWA IndexedDB] Marking task as pending:', { taskId });

  const db = await getDB();

  try {
    const task = await db.get('tasks_cache', taskId);
    if (task) {
      await db.put('tasks_cache', {
        ...task,
        hasPendingMutation: true,
      });
      console.log('[PWA IndexedDB] Task marked as pending');
    }
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to mark task as pending:', error);
    throw error;
  }
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  available: number;
  usagePercent: number;
}> {
  console.log('[PWA IndexedDB] Getting storage estimate');

  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const available = quota - usage;
      const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;

      console.log('[PWA IndexedDB] Storage estimate:', {
        usageMB: (usage / 1024 / 1024).toFixed(2),
        quotaMB: (quota / 1024 / 1024).toFixed(2),
        availableMB: (available / 1024 / 1024).toFixed(2),
        usagePercent: usagePercent.toFixed(2),
      });

      return { usage, quota, available, usagePercent };
    }

    console.warn('[PWA IndexedDB] Storage API not available');
    return { usage: 0, quota: 0, available: 0, usagePercent: 0 };
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to estimate storage:', error);
    return { usage: 0, quota: 0, available: 0, usagePercent: 0 };
  }
}

/**
 * Clean up expired data
 */
export async function cleanupExpiredData(): Promise<{
  draftsDeleted: number;
  projectsDeleted: number;
  tasksDeleted: number;
}> {
  console.log('[PWA IndexedDB] Cleaning up expired data');

  const db = await getDB();
  const now = Date.now();
  let draftsDeleted = 0;
  let projectsDeleted = 0;
  let tasksDeleted = 0;

  try {
    // Delete expired form drafts
    const drafts = await db.getAllFromIndex(
      'form_drafts',
      'by-expires',
      IDBKeyRange.upperBound(now)
    );
    for (const draft of drafts) {
      await db.delete('form_drafts', draft.formId);
      draftsDeleted++;
    }

    // Delete old cached projects (>7 days)
    const projects = await db.getAll('projects_cache');
    for (const project of projects) {
      if (now - project.cachedAt > MAX_CACHE_AGE) {
        await db.delete('projects_cache', project.id);
        projectsDeleted++;
      }
    }

    // Delete old cached tasks (>7 days, not pending)
    const tasks = await db.getAll('tasks_cache');
    for (const task of tasks) {
      if (!task.hasPendingMutation && now - task.cachedAt > MAX_CACHE_AGE) {
        await db.delete('tasks_cache', task.id);
        tasksDeleted++;
      }
    }

    console.log('[PWA IndexedDB] Cleanup complete:', {
      draftsDeleted,
      projectsDeleted,
      tasksDeleted,
    });

    return { draftsDeleted, projectsDeleted, tasksDeleted };
  } catch (error) {
    console.error('[PWA IndexedDB] Cleanup failed:', error);
    return { draftsDeleted: 0, projectsDeleted: 0, tasksDeleted: 0 };
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  console.log('[PWA IndexedDB] Clearing all caches');

  const db = await getDB();
  const tx = db.transaction(
    ['projects_cache', 'tasks_cache', 'form_drafts'],
    'readwrite'
  );

  try {
    await tx.objectStore('projects_cache').clear();
    await tx.objectStore('tasks_cache').clear();
    await tx.objectStore('form_drafts').clear();
    await tx.done;

    console.log('[PWA IndexedDB] All caches cleared');
  } catch (error) {
    console.error('[PWA IndexedDB] Failed to clear caches:', error);
    throw error;
  }
}

/**
 * Check if storage is near quota limit
 */
export async function isStorageNearLimit(): Promise<boolean> {
  const estimate = await getStorageEstimate();
  const isNearLimit = estimate.available < STORAGE_QUOTA_WARNING;

  if (isNearLimit) {
    console.warn('[PWA IndexedDB] Storage near quota limit:', {
      availableMB: (estimate.available / 1024 / 1024).toFixed(2),
      warningThresholdMB: (STORAGE_QUOTA_WARNING / 1024 / 1024).toFixed(2),
    });
  }

  return isNearLimit;
}

// Export configuration constants
export const PWA_DB_CONFIG = {
  DB_NAME,
  DB_VERSION,
  MAX_CACHE_AGE,
  MAX_PHOTO_QUEUE_SIZE,
  STORAGE_QUOTA_WARNING,
} as const;
