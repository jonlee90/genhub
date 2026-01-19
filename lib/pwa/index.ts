/**
 * Phase 6 - PWA Native App Optimization (Photo & Sync Queue)
 * Central export for all PWA offline support modules
 */

// IndexedDB
export {
  getDB,
  closeDB,
  cacheProjects,
  getCachedProjects,
  cacheTasks,
  getCachedTasks,
  markTaskAsPending,
  getStorageEstimate,
  cleanupExpiredData,
  clearAllCaches,
  isStorageNearLimit,
  PWA_DB_CONFIG,
} from './indexed-db';

// Entity Sync
export {
  enqueueSync,
  dequeueSynced,
  getQueuedEntities,
  isOfflineAware,
  updateSyncStatus,
  processSyncQueue,
  getSyncStats,
  clearCompletedSyncs,
  SYNC_PRIORITY,
  type SyncEntity,
  type SyncResult,
  type SyncProgress,
} from './entity-sync';

// Form Persistence
export {
  saveFormDraft,
  loadFormDraft,
  clearFormDraft,
  listFormDrafts,
  cleanupExpiredDrafts,
  getDraftAge,
  hasDraft,
  getDraftStats,
  clearAllDrafts,
  useFormDraft,
  FORM_DRAFT_CONFIG,
  type FormDraft,
  type DraftMetadata,
} from './form-persistence';

// Photo Compression (NEW - Phase 6 Task 1)
export {
  compressImage,
  getCompressionStats,
  compressImageWithStats,
  compressImageInWorker,
  compressImages,
  estimateCompressionSize,
  shouldCompress,
  PHOTO_COMPRESSION_CONFIG,
  type CompressionQuality,
  type CompressionFormat,
  type CompressionOptions,
  type CompressionStats,
  type CompressionResult,
} from './photo-compression';

// Photo Queue (ENHANCED - Phase 6 Task 2)
export {
  queuePhotoForUpload,
  queuePhoto,
  getQueuedPhotos,
  markPhotoUploaded,
  processUploadQueue,
  processPhotoQueue,
  retryFailedPhotos,
  getPhotoQueueStats,
  clearUploadedPhotos,
  deleteQueuedPhoto,
  PHOTO_QUEUE_CONFIG,
  type PhotoMetadata,
  type QueuedPhoto,
  type UploadProgress,
  type UploadStats,
  type UploadProgressCallback,
} from './photo-queue';

// Background Sync (NEW - Phase 6 Task 3)
export {
  registerBackgroundSync,
  getBackgroundSyncStatus,
  getBackgroundSyncStatusAsync,
  triggerManualSync,
  unregisterBackgroundSync,
  isSyncNeeded,
  getTimeUntilNextSync,
  formatTimeUntilNextSync,
  BACKGROUND_SYNC_CONFIG,
  type BackgroundSyncStatus,
  type BackgroundSyncOptions,
  type SyncStats,
} from './background-sync';

// Sync Progress (NEW - Phase 6 Task 4)
export {
  getSyncProgress,
  subscribeSyncProgress,
  startSyncTracking,
  updateCurrentOperation,
  recordSyncedItem,
  recordSyncError,
  endSyncTracking,
  clearSyncErrors,
  formatSyncProgress,
  getSyncStatistics,
  isSyncInProgress,
  getSyncDuration,
  formatSyncDuration,
  monitorSyncProgress,
  getStorageBreakdown,
  SYNC_PROGRESS_CONFIG,
  type SyncError,
  type SyncProgress as SyncProgressType,
} from './sync-progress';

// Offline Hydration
export {
  hydrateOfflineData,
  syncOnlineData,
  watchConnectivity,
  getOfflineDataStatus,
  startBackgroundSync,
  forceSync,
  hasStaleData,
  getCacheFreshness,
  initializeOfflineSupport,
  getConnectivityState,
  OFFLINE_HYDRATION_CONFIG,
  type OfflineDataStatus,
  type HydrationResult,
  type SyncResult as OnlineSyncResult,
} from './offline-hydration';
