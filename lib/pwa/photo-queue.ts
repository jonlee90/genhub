/**
 * Phase 6 Task 2 - Photo Upload Queue (Enhanced)
 * Queue photos for upload when online with compression
 *
 * Features:
 * - Queue photos with metadata
 * - Automatic compression before queueing
 * - Retry failed uploads with exponential backoff (3s → 6s → 12s)
 * - Store file blobs in IndexedDB
 * - Background upload processing (3 concurrent)
 * - Upload progress tracking
 * - Max retries: 5 attempts per photo
 * - Persistent queue survives app reload
 */

'use client';

import { getDB } from './indexed-db';
import { compressImage, getCompressionStats } from './photo-compression';

console.log('[Photo Queue] Module loaded');

// Upload configuration
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BACKOFF_MS = 3000;
const UPLOAD_BATCH_SIZE = 3; // Upload 3 photos at a time
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

export interface PhotoMetadata {
  userId: string;
  companyId: string;
  projectId?: string;
  caption?: string;
  originalFileName?: string;
  originalSize?: number;
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
  };
}

export interface QueuedPhoto {
  id: string;
  entityType: string;
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
  metadata: PhotoMetadata;
}

export interface UploadProgress {
  total: number;
  uploaded: number;
  failed: number;
  pending: number;
  currentFile?: string;
  percentComplete: number;
}

export interface UploadStats {
  total: number;
  uploaded: number;
  failed: number;
  errors: string[];
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Queue photo for upload (NEW: with automatic compression)
 */
export async function queuePhotoForUpload(params: {
  entityType: string;
  entityId: string;
  file: File;
  metadata: PhotoMetadata;
}): Promise<string> {
  console.log('[Photo Queue] Queueing photo for upload:', {
    entityType: params.entityType,
    fileName: params.file.name,
    size: params.file.size,
  });

  // Validate file size (before compression)
  if (params.file.size > MAX_PHOTO_SIZE) {
    throw new Error(
      `File size ${(params.file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_PHOTO_SIZE / 1024 / 1024}MB`
    );
  }

  // Validate file type
  if (!params.file.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${params.file.type}. Only images are supported.`);
  }

  const db = await getDB();
  const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Compress image before queueing
    console.log('[Photo Queue] Compressing image before queueing');
    const originalSize = params.file.size;
    const compressedBlob = await compressImage(params.file, { quality: 'medium' });

    // Get compression stats
    const img = await loadImageFromFile(params.file);
    const compressionStats = getCompressionStats(
      params.file,
      compressedBlob,
      img.width,
      img.height,
      'medium'
    );

    console.log('[Photo Queue] Compression complete:', {
      original: originalSize,
      compressed: compressedBlob.size,
      savings: compressionStats.reductionPercent.toFixed(2) + '%',
    });

    const queuedPhoto: QueuedPhoto = {
      id,
      entityType: params.entityType,
      entityId: params.entityId,
      fileName: params.file.name,
      fileBlob: compressedBlob,
      fileSize: compressedBlob.size,
      mimeType: compressedBlob.type,
      status: 'pending',
      attempts: 0,
      lastAttemptAt: null,
      error: null,
      createdAt: Date.now(),
      metadata: {
        ...params.metadata,
        originalFileName: params.file.name,
        originalSize: originalSize,
        compressionStats: {
          originalSize: compressionStats.originalSize,
          compressedSize: compressionStats.compressedSize,
          reductionPercent: compressionStats.reductionPercent,
        },
      },
    };

    await db.put('photo_queue', queuedPhoto);

    console.log('[Photo Queue] Photo queued:', {
      id,
      fileName: params.file.name,
    });

    // Trigger upload if online
    if (navigator.onLine) {
      setTimeout(() => processUploadQueue(), 500);
    }

    return id;
  } catch (error) {
    console.error('[Photo Queue] Failed to queue photo:', error);
    throw error;
  }
}

/**
 * Queue photo for upload (legacy, without compression)
 */
export async function queuePhoto(params: {
  entityType: string;
  entityId: string;
  file: File;
  metadata: {
    userId: string;
    companyId: string;
    projectId?: string;
    caption?: string;
  };
}): Promise<string> {
  console.log('[Photo Queue] Queueing photo (legacy):', {
    entityType: params.entityType,
    fileName: params.file.name,
    size: params.file.size,
  });

  // Validate file size
  if (params.file.size > MAX_PHOTO_SIZE) {
    throw new Error(
      `File size ${(params.file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_PHOTO_SIZE / 1024 / 1024}MB`
    );
  }

  // Validate file type
  if (!params.file.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${params.file.type}. Only images are supported.`);
  }

  const db = await getDB();
  const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const queuedPhoto: QueuedPhoto = {
      id,
      entityType: params.entityType,
      entityId: params.entityId,
      fileName: params.file.name,
      fileBlob: params.file,
      fileSize: params.file.size,
      mimeType: params.file.type,
      status: 'pending',
      attempts: 0,
      lastAttemptAt: null,
      error: null,
      createdAt: Date.now(),
      metadata: params.metadata,
    };

    await db.put('photo_queue', queuedPhoto);

    console.log('[Photo Queue] Photo queued:', {
      id,
      fileName: params.file.name,
    });

    // Trigger upload if online
    if (navigator.onLine) {
      setTimeout(() => processPhotoQueue(), 500);
    }

    return id;
  } catch (error) {
    console.error('[Photo Queue] Failed to queue photo:', error);
    throw error;
  }
}

/**
 * Get all queued photos
 */
export async function getQueuedPhotos(
  filters?: {
    status?: 'pending' | 'uploading' | 'uploaded' | 'failed';
    entityType?: string;
    entityId?: string;
  }
): Promise<QueuedPhoto[]> {
  console.log('[Photo Queue] Getting queued photos:', filters);

  const db = await getDB();

  try {
    let photos: QueuedPhoto[];

    if (filters?.status) {
      photos = await db.getAllFromIndex('photo_queue', 'by-status', filters.status);
    } else if (filters?.entityType) {
      photos = await db.getAllFromIndex('photo_queue', 'by-entity', filters.entityType);
    } else {
      photos = await db.getAll('photo_queue');
    }

    // Apply additional filters
    if (filters?.entityId) {
      photos = photos.filter((p) => p.entityId === filters.entityId);
    }

    // Sort by created (oldest first)
    photos.sort((a, b) => a.createdAt - b.createdAt);

    console.log('[Photo Queue] Queued photos retrieved:', {
      count: photos.length,
    });

    return photos;
  } catch (error) {
    console.error('[Photo Queue] Failed to get queued photos:', error);
    return [];
  }
}

/**
 * Mark photo as uploaded
 */
export async function markPhotoUploaded(photoId: string): Promise<void> {
  console.log('[Photo Queue] Marking photo as uploaded:', { photoId });

  const db = await getDB();

  try {
    // Remove from queue after successful upload
    await db.delete('photo_queue', photoId);
    console.log('[Photo Queue] Photo removed from queue');
  } catch (error) {
    console.error('[Photo Queue] Failed to mark photo as uploaded:', error);
    throw error;
  }
}

/**
 * Update photo status
 */
async function updatePhotoStatus(
  photoId: string,
  status: 'pending' | 'uploading' | 'uploaded' | 'failed',
  error?: string
): Promise<void> {
  console.log('[Photo Queue] Updating photo status:', { photoId, status, error });

  const db = await getDB();

  try {
    const photo = await db.get('photo_queue', photoId);
    if (!photo) {
      console.warn('[Photo Queue] Photo not found:', { photoId });
      return;
    }

    await db.put('photo_queue', {
      ...photo,
      status,
      attempts: photo.attempts + 1,
      lastAttemptAt: Date.now(),
      error: error || null,
    });

    console.log('[Photo Queue] Photo status updated');
  } catch (error) {
    console.error('[Photo Queue] Failed to update photo status:', error);
    throw error;
  }
}

/**
 * Process upload queue (NEW: Task 2 signature)
 */
export async function processUploadQueue(
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadStats> {
  console.log('[Photo Queue] Processing upload queue');

  const pendingPhotos = await getQueuedPhotos({ status: 'pending' });
  const failedPhotos = await getQueuedPhotos({ status: 'failed' });

  const allPhotos = [...pendingPhotos, ...failedPhotos];

  if (allPhotos.length === 0) {
    console.log('[Photo Queue] No photos to upload');
    return { total: 0, uploaded: 0, failed: 0, errors: [] };
  }

  const stats: UploadStats = {
    total: allPhotos.length,
    uploaded: 0,
    failed: 0,
    errors: [],
  };

  const progress: UploadProgress = {
    total: allPhotos.length,
    uploaded: 0,
    failed: 0,
    pending: allPhotos.length,
    percentComplete: 0,
  };

  // Notify initial progress
  onProgress?.(progress);

  // Process in batches (3 concurrent)
  for (let i = 0; i < allPhotos.length; i += UPLOAD_BATCH_SIZE) {
    const batch = allPhotos.slice(i, i + UPLOAD_BATCH_SIZE);

    console.log('[Photo Queue] Processing batch:', {
      batchIndex: i / UPLOAD_BATCH_SIZE,
      batchSize: batch.length,
    });

    await Promise.all(
      batch.map(async (photo) => {
        try {
          progress.currentFile = photo.fileName;
          onProgress?.({ ...progress });

          // Mark as uploading
          await updatePhotoStatus(photo.id, 'uploading');

          // Upload with retry (exponential backoff: 3s → 6s → 12s)
          await uploadPhotoWithRetry(photo);

          // Mark as uploaded and remove from queue
          await markPhotoUploaded(photo.id);

          stats.uploaded++;
          progress.uploaded++;
          progress.pending--;
          progress.percentComplete = Math.round((progress.uploaded / progress.total) * 100);

          console.log('[Photo Queue] Photo uploaded successfully:', photo.fileName);
        } catch (error) {
          console.error('[Photo Queue] Failed to upload photo:', photo.fileName, error);

          const errorMsg = error instanceof Error ? error.message : 'Upload failed';

          await updatePhotoStatus(photo.id, 'failed', errorMsg);

          stats.failed++;
          stats.errors.push(`${photo.fileName}: ${errorMsg}`);
          progress.failed++;
          progress.pending--;
          progress.percentComplete = Math.round(
            ((progress.uploaded + progress.failed) / progress.total) * 100
          );
        }

        progress.currentFile = undefined;
        onProgress?.({ ...progress });
      })
    );
  }

  console.log('[Photo Queue] Upload queue processed:', stats);
  return stats;
}

/**
 * Process photo upload queue (legacy)
 */
export async function processPhotoQueue(
  onProgress?: UploadProgressCallback
): Promise<UploadProgress> {
  console.log('[Photo Queue] Processing photo queue (legacy)');

  const pendingPhotos = await getQueuedPhotos({ status: 'pending' });
  const failedPhotos = await getQueuedPhotos({ status: 'failed' });

  const allPhotos = [...pendingPhotos, ...failedPhotos];

  if (allPhotos.length === 0) {
    console.log('[Photo Queue] No photos to upload');
    return { total: 0, uploaded: 0, failed: 0, pending: 0, percentComplete: 0 };
  }

  const progress: UploadProgress = {
    total: allPhotos.length,
    uploaded: 0,
    failed: 0,
    pending: allPhotos.length,
    percentComplete: 0,
  };

  // Notify initial progress
  onProgress?.(progress);

  // Process in batches
  for (let i = 0; i < allPhotos.length; i += UPLOAD_BATCH_SIZE) {
    const batch = allPhotos.slice(i, i + UPLOAD_BATCH_SIZE);

    console.log('[Photo Queue] Processing batch:', {
      batchIndex: i / UPLOAD_BATCH_SIZE,
      batchSize: batch.length,
    });

    await Promise.all(
      batch.map(async (photo) => {
        try {
          progress.currentFile = photo.fileName;
          onProgress?.({ ...progress });

          // Mark as uploading
          await updatePhotoStatus(photo.id, 'uploading');

          // Upload with retry
          await uploadPhotoWithRetry(photo);

          // Mark as uploaded and remove from queue
          await markPhotoUploaded(photo.id);

          progress.uploaded++;
          progress.pending--;
          progress.percentComplete = Math.round((progress.uploaded / progress.total) * 100);

          console.log('[Photo Queue] Photo uploaded successfully:', photo.fileName);
        } catch (error) {
          console.error('[Photo Queue] Failed to upload photo:', photo.fileName, error);

          await updatePhotoStatus(
            photo.id,
            'failed',
            error instanceof Error ? error.message : 'Upload failed'
          );

          progress.failed++;
          progress.pending--;
          progress.percentComplete = Math.round(
            ((progress.uploaded + progress.failed) / progress.total) * 100
          );
        }

        progress.currentFile = undefined;
        onProgress?.({ ...progress });
      })
    );
  }

  console.log('[Photo Queue] Photo queue processed:', progress);
  return progress;
}

/**
 * Retry failed photos (NEW: Task 2 signature)
 */
export async function retryFailedPhotos(): Promise<UploadStats> {
  console.log('[Photo Queue] Retrying failed photos');

  const failedPhotos = await getQueuedPhotos({ status: 'failed' });

  if (failedPhotos.length === 0) {
    console.log('[Photo Queue] No failed photos to retry');
    return { total: 0, uploaded: 0, failed: 0, errors: [] };
  }

  // Reset status to pending for retry
  const db = await getDB();
  for (const photo of failedPhotos) {
    await db.put('photo_queue', {
      ...photo,
      status: 'pending',
      error: null,
    });
  }

  // Process queue
  return await processUploadQueue();
}

/**
 * Upload photo with retry logic
 */
async function uploadPhotoWithRetry(photo: QueuedPhoto): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log('[Photo Queue] Upload attempt:', {
        photoId: photo.id,
        fileName: photo.fileName,
        attempt,
        maxRetries: MAX_RETRY_ATTEMPTS,
      });

      await uploadPhoto(photo);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');
      console.warn('[Photo Queue] Upload attempt failed:', {
        photoId: photo.id,
        attempt,
        error: lastError.message,
      });

      // Don't retry on last attempt
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.log('[Photo Queue] Retrying after delay:', { delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Upload failed after retries');
}

/**
 * Upload individual photo
 */
async function uploadPhoto(photo: QueuedPhoto): Promise<void> {
  console.log('[Photo Queue] Uploading photo:', {
    entityType: photo.entityType,
    fileName: photo.fileName,
  });

  try {
    // Build FormData
    const formData = new FormData();
    formData.append('file', photo.fileBlob, photo.fileName);
    formData.append('entityType', photo.entityType);
    formData.append('entityId', photo.entityId);

    if (photo.metadata.caption) {
      formData.append('caption', photo.metadata.caption);
    }

    // Determine upload endpoint
    const endpoint = getUploadEndpoint(photo.entityType, photo.entityId);

    // Upload
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload photo: ${response.statusText} - ${errorText}`
      );
    }

    console.log('[Photo Queue] Photo uploaded successfully:', photo.fileName);
  } catch (error) {
    console.error('[Photo Queue] Failed to upload photo:', error);
    throw error;
  }
}

/**
 * Get upload endpoint for entity type
 */
function getUploadEndpoint(entityType: string, entityId: string): string {
  const endpoints: Record<string, string> = {
    task: `/api/tasks/${entityId}/photos`,
    marker: `/api/projects/spatial/markers/${entityId}/photos`,
    expense: `/api/expenses/${entityId}/photos`,
    project: `/api/projects/${entityId}/photos`,
  };

  return endpoints[entityType] || `/api/${entityType}s/${entityId}/photos`;
}

/**
 * Get photo queue statistics
 */
export async function getPhotoQueueStats(): Promise<{
  total: number;
  pending: number;
  uploading: number;
  failed: number;
  totalSize: number;
  byEntityType: Record<string, number>;
}> {
  console.log('[Photo Queue] Getting photo queue stats');

  const db = await getDB();

  try {
    const allPhotos = await db.getAll('photo_queue');

    const stats = {
      total: allPhotos.length,
      pending: 0,
      uploading: 0,
      failed: 0,
      totalSize: 0,
      byEntityType: {} as Record<string, number>,
    };

    for (const photo of allPhotos) {
      if (photo.status === 'pending') stats.pending++;
      if (photo.status === 'uploading') stats.uploading++;
      if (photo.status === 'failed') stats.failed++;

      stats.totalSize += photo.fileSize;

      stats.byEntityType[photo.entityType] =
        (stats.byEntityType[photo.entityType] || 0) + 1;
    }

    console.log('[Photo Queue] Photo queue stats:', stats);
    return stats;
  } catch (error) {
    console.error('[Photo Queue] Failed to get photo queue stats:', error);
    return {
      total: 0,
      pending: 0,
      uploading: 0,
      failed: 0,
      totalSize: 0,
      byEntityType: {},
    };
  }
}

/**
 * Clear uploaded photos from queue
 */
export async function clearUploadedPhotos(): Promise<number> {
  console.log('[Photo Queue] Clearing uploaded photos');

  const db = await getDB();
  let cleared = 0;

  try {
    const uploadedPhotos = await db.getAllFromIndex(
      'photo_queue',
      'by-status',
      'uploaded'
    );

    for (const photo of uploadedPhotos) {
      await db.delete('photo_queue', photo.id);
      cleared++;
    }

    console.log('[Photo Queue] Uploaded photos cleared:', { count: cleared });
    return cleared;
  } catch (error) {
    console.error('[Photo Queue] Failed to clear uploaded photos:', error);
    return 0;
  }
}

/**
 * Delete photo from queue
 */
export async function deleteQueuedPhoto(photoId: string): Promise<boolean> {
  console.log('[Photo Queue] Deleting queued photo:', { photoId });

  const db = await getDB();

  try {
    await db.delete('photo_queue', photoId);
    console.log('[Photo Queue] Photo deleted from queue');
    return true;
  } catch (error) {
    console.error('[Photo Queue] Failed to delete queued photo:', error);
    return false;
  }
}

/**
 * Helper: Load image from file
 */
async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

// Listen for online event to auto-upload
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Photo Queue] Device is online, processing queue');
    processUploadQueue();
  });
}

// Export configuration
export const PHOTO_QUEUE_CONFIG = {
  MAX_RETRY_ATTEMPTS,
  RETRY_BACKOFF_MS,
  UPLOAD_BATCH_SIZE,
  MAX_PHOTO_SIZE,
} as const;
