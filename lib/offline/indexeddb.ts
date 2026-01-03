/**
 * P5.2 - IndexedDB Storage Layer
 * Offline model and marker storage using idb library
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

console.log('[IndexedDB] Module loaded');

// Debug: Database schema version
const DB_NAME = 'genhub-spatial';
const DB_VERSION = 1;

// Debug: IndexedDB schema definition
interface SpatialDB extends DBSchema {
  models: {
    key: string; // projectId
    value: {
      projectId: string;
      modelData: ArrayBuffer;
      version: number;
      uploadedAt: number;
      size: number;
      metadata: {
        fileName: string;
        objectCount: number;
      };
    };
    indexes: { 'by-version': number };
  };
  markers: {
    key: string; // markerId
    value: {
      id: string;
      projectId: string;
      title: string;
      type: string;
      position: { x: number; y: number; z: number };
      floorId: string | null;
      createdBy: string;
      createdAt: number;
      updatedAt: number;
      synced: boolean;
    };
    indexes: { 'by-project': string; 'by-synced': number };
  };
  marker_content: {
    key: string; // markerId
    value: {
      markerId: string;
      description: string;
      attachments: Array<{
        id: string;
        url: string;
        type: string;
        name: string;
      }>;
      linkedTaskId: string | null;
      linkedChatId: string | null;
      updatedAt: number;
    };
  };
  sync_queue: {
    key: string; // queueId
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: 'marker' | 'marker_content';
      data: any;
      status: 'pending' | 'syncing' | 'synced' | 'error';
      attempts: number;
      createdAt: number;
      lastAttemptAt: number | null;
      error: string | null;
    };
    indexes: { 'by-status': string; 'by-created': number };
  };
}

// Debug: Database instance (singleton)
let dbInstance: IDBPDatabase<SpatialDB> | null = null;

/**
 * Get or create IndexedDB connection
 */
export async function getDB(): Promise<IDBPDatabase<SpatialDB>> {
  console.log('[IndexedDB] Getting database connection');

  if (dbInstance) {
    console.log('[IndexedDB] Reusing existing connection');
    return dbInstance;
  }

  console.log('[IndexedDB] Opening new connection:', { DB_NAME, DB_VERSION });

  try {
    dbInstance = await openDB<SpatialDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, _transaction) {
        console.log('[IndexedDB] Upgrading database:', {
          oldVersion,
          newVersion,
        });

        // Debug: Create models store
        if (!db.objectStoreNames.contains('models')) {
          const modelsStore = db.createObjectStore('models', {
            keyPath: 'projectId',
          });
          modelsStore.createIndex('by-version', 'version');
          console.log('[IndexedDB] Created models store');
        }

        // Debug: Create markers store
        if (!db.objectStoreNames.contains('markers')) {
          const markersStore = db.createObjectStore('markers', {
            keyPath: 'id',
          });
          markersStore.createIndex('by-project', 'projectId');
          markersStore.createIndex('by-synced', 'synced');
          console.log('[IndexedDB] Created markers store');
        }

        // Debug: Create marker_content store
        if (!db.objectStoreNames.contains('marker_content')) {
          db.createObjectStore('marker_content', { keyPath: 'markerId' });
          console.log('[IndexedDB] Created marker_content store');
        }

        // Debug: Create sync_queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', {
            keyPath: 'id',
          });
          syncStore.createIndex('by-status', 'status');
          syncStore.createIndex('by-created', 'createdAt');
          console.log('[IndexedDB] Created sync_queue store');
        }
      },
    });

    console.log('[IndexedDB] Database opened successfully');
    return dbInstance;
  } catch (error) {
    console.error('[IndexedDB] Failed to open database:', error);
    throw error;
  }
}

/**
 * Store 3D model in IndexedDB
 */
export async function storeModel(
  projectId: string,
  modelData: ArrayBuffer,
  metadata: {
    fileName: string;
    objectCount: number;
    version: number;
  }
): Promise<void> {
  console.log('[IndexedDB] Storing model:', {
    projectId,
    size: modelData.byteLength,
    metadata,
  });

  const db = await getDB();

  try {
    await db.put('models', {
      projectId,
      modelData,
      version: metadata.version,
      uploadedAt: Date.now(),
      size: modelData.byteLength,
      metadata: {
        fileName: metadata.fileName,
        objectCount: metadata.objectCount,
      },
    });

    console.log('[IndexedDB] Model stored successfully');
  } catch (error) {
    console.error('[IndexedDB] Failed to store model:', error);
    throw error;
  }
}

/**
 * Get 3D model from IndexedDB
 */
export async function getModel(
  projectId: string
): Promise<ArrayBuffer | null> {
  console.log('[IndexedDB] Getting model:', { projectId });

  const db = await getDB();

  try {
    const model = await db.get('models', projectId);

    if (!model) {
      console.log('[IndexedDB] Model not found');
      return null;
    }

    console.log('[IndexedDB] Model retrieved:', {
      size: model.size,
      version: model.version,
    });

    return model.modelData;
  } catch (error) {
    console.error('[IndexedDB] Failed to get model:', error);
    return null;
  }
}

/**
 * Store markers in IndexedDB
 */
export async function storeMarkers(
  markers: Array<{
    id: string;
    projectId: string;
    title: string;
    type: string;
    position: { x: number; y: number; z: number };
    floorId: string | null;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
  }>
): Promise<void> {
  console.log('[IndexedDB] Storing markers:', { count: markers.length });

  const db = await getDB();
  const tx = db.transaction('markers', 'readwrite');

  try {
    await Promise.all(
      markers.map((marker) =>
        tx.store.put({
          ...marker,
          synced: true, // Markers from server are synced
        })
      )
    );

    await tx.done;
    console.log('[IndexedDB] Markers stored successfully');
  } catch (error) {
    console.error('[IndexedDB] Failed to store markers:', error);
    throw error;
  }
}

/**
 * Get markers for a project
 */
export async function getMarkers(projectId: string) {
  console.log('[IndexedDB] Getting markers:', { projectId });

  const db = await getDB();

  try {
    const allMarkers = await db.getAllFromIndex(
      'markers',
      'by-project',
      projectId
    );

    console.log('[IndexedDB] Markers retrieved:', { count: allMarkers.length });
    return allMarkers;
  } catch (error) {
    console.error('[IndexedDB] Failed to get markers:', error);
    return [];
  }
}

/**
 * Store marker content (description, attachments, links)
 */
export async function storeMarkerContent(
  markerId: string,
  content: {
    description: string;
    attachments: Array<{
      id: string;
      url: string;
      type: string;
      name: string;
    }>;
    linkedTaskId: string | null;
    linkedChatId: string | null;
  }
): Promise<void> {
  console.log('[IndexedDB] Storing marker content:', { markerId });

  const db = await getDB();

  try {
    await db.put('marker_content', {
      markerId,
      ...content,
      updatedAt: Date.now(),
    });

    console.log('[IndexedDB] Marker content stored successfully');
  } catch (error) {
    console.error('[IndexedDB] Failed to store marker content:', error);
    throw error;
  }
}

/**
 * Get marker content
 */
export async function getMarkerContent(markerId: string) {
  console.log('[IndexedDB] Getting marker content:', { markerId });

  const db = await getDB();

  try {
    const content = await db.get('marker_content', markerId);

    if (!content) {
      console.log('[IndexedDB] Marker content not found');
      return null;
    }

    console.log('[IndexedDB] Marker content retrieved');
    return content;
  } catch (error) {
    console.error('[IndexedDB] Failed to get marker content:', error);
    return null;
  }
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
  type: 'create' | 'update' | 'delete',
  entity: 'marker' | 'marker_content',
  data: any
): Promise<string> {
  console.log('[IndexedDB] Adding to sync queue:', { type, entity });

  const db = await getDB();
  const id = `${entity}-${type}-${Date.now()}-${Math.random()}`;

  try {
    await db.put('sync_queue', {
      id,
      type,
      entity,
      data,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
      lastAttemptAt: null,
      error: null,
    });

    console.log('[IndexedDB] Added to sync queue:', { id });
    return id;
  } catch (error) {
    console.error('[IndexedDB] Failed to add to sync queue:', error);
    throw error;
  }
}

/**
 * Get pending sync items
 */
export async function getPendingSyncItems() {
  console.log('[IndexedDB] Getting pending sync items');

  const db = await getDB();

  try {
    const items = await db.getAllFromIndex('sync_queue', 'by-status', 'pending');
    console.log('[IndexedDB] Pending sync items:', { count: items.length });
    return items;
  } catch (error) {
    console.error('[IndexedDB] Failed to get pending sync items:', error);
    return [];
  }
}

/**
 * Update sync item status
 */
export async function updateSyncItemStatus(
  id: string,
  status: 'pending' | 'syncing' | 'synced' | 'error',
  error?: string
): Promise<void> {
  console.log('[IndexedDB] Updating sync item status:', { id, status, error });

  const db = await getDB();

  try {
    const item = await db.get('sync_queue', id);
    if (!item) {
      console.warn('[IndexedDB] Sync item not found:', { id });
      return;
    }

    await db.put('sync_queue', {
      ...item,
      status,
      attempts: item.attempts + 1,
      lastAttemptAt: Date.now(),
      error: error || null,
    });

    console.log('[IndexedDB] Sync item status updated');
  } catch (error) {
    console.error('[IndexedDB] Failed to update sync item status:', error);
    throw error;
  }
}

/**
 * Clear old cached data (models older than specified version)
 */
export async function clearOldCache(projectId: string, currentVersion: number): Promise<void> {
  console.log('[IndexedDB] Clearing old cache:', { projectId, currentVersion });

  const db = await getDB();

  try {
    const model = await db.get('models', projectId);

    if (model && model.version < currentVersion) {
      await db.delete('models', projectId);
      console.log('[IndexedDB] Old model version deleted');
    } else {
      console.log('[IndexedDB] Model is current version, no cleanup needed');
    }
  } catch (error) {
    console.error('[IndexedDB] Failed to clear old cache:', error);
    throw error;
  }
}

/**
 * Clear all data for a project
 */
export async function clearProjectData(projectId: string): Promise<void> {
  console.log('[IndexedDB] Clearing all project data:', { projectId });

  const db = await getDB();
  const tx = db.transaction(['models', 'markers', 'marker_content', 'sync_queue'], 'readwrite');

  try {
    // Delete model
    await tx.objectStore('models').delete(projectId);

    // Delete markers
    const markers = await db.getAllFromIndex('markers', 'by-project', projectId);
    await Promise.all(
      markers.map((marker) => tx.objectStore('markers').delete(marker.id))
    );

    // Delete marker content
    await Promise.all(
      markers.map((marker) =>
        tx.objectStore('marker_content').delete(marker.id)
      )
    );

    await tx.done;
    console.log('[IndexedDB] Project data cleared successfully');
  } catch (error) {
    console.error('[IndexedDB] Failed to clear project data:', error);
    throw error;
  }
}

/**
 * Get database size estimate
 */
export async function getDatabaseSize(): Promise<number> {
  console.log('[IndexedDB] Calculating database size');

  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      console.log('[IndexedDB] Storage usage:', {
        usage,
        quota: estimate.quota,
        usageMB: (usage / 1024 / 1024).toFixed(2),
      });
      return usage;
    }

    console.warn('[IndexedDB] Storage API not available');
    return 0;
  } catch (error) {
    console.error('[IndexedDB] Failed to estimate storage:', error);
    return 0;
  }
}
