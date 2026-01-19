/**
 * Phase 6 Task 1 - Photo Compression Pipeline
 * Client-side image compression before upload
 *
 * Features:
 * - WebP format with JPEG fallback (Safari)
 * - AVIF format for modern browsers (ultra-compressed)
 * - Configurable quality levels: high (0.8), medium (0.6), low (0.4)
 * - Target: < 500KB per photo
 * - Preserve EXIF data for dimensions
 * - Handle various input formats (JPG, PNG, HEIC on iOS)
 */

'use client';

console.log('[Photo Compression] Module loaded');

// Compression configuration
const QUALITY_PRESETS = {
  high: 0.8,
  medium: 0.6,
  low: 0.4,
} as const;

const TARGET_SIZE_KB = 500;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;

export type CompressionQuality = 'high' | 'medium' | 'low';
export type CompressionFormat = 'webp' | 'avif' | 'jpeg';

export interface CompressionOptions {
  quality?: CompressionQuality;
  format?: CompressionFormat;
  maxWidth?: number;
  maxHeight?: number;
  targetSizeKB?: number;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  originalFormat: string;
  compressedFormat: string;
  compressionRatio: number;
  reductionPercent: number;
  width: number;
  height: number;
  quality: CompressionQuality;
}

export interface CompressionResult {
  blob: Blob;
  stats: CompressionStats;
}

/**
 * Compress image with automatic format selection
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<Blob> {
  console.log('[Photo Compression] Starting compression:', {
    fileName: file.name,
    size: file.size,
    type: file.type,
    options,
  });

  try {
    // Validate input
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Only images are supported.`);
    }

    // Load image
    const img = await loadImage(file);
    console.log('[Photo Compression] Image loaded:', {
      width: img.width,
      height: img.height,
    });

    // Calculate dimensions
    const dimensions = calculateDimensions(
      img.width,
      img.height,
      options?.maxWidth || MAX_WIDTH,
      options?.maxHeight || MAX_HEIGHT
    );

    console.log('[Photo Compression] Target dimensions:', dimensions);

    // Get quality
    const quality = QUALITY_PRESETS[options?.quality || 'medium'];

    // Determine best format
    const format = options?.format || (await getBestFormat());

    console.log('[Photo Compression] Using format:', { format, quality });

    // Compress with selected format
    let compressed: Blob;

    if (format === 'avif' && supportsFormat('image/avif')) {
      compressed = await compressToFormat(img, dimensions, 'image/avif', quality);
    } else if (format === 'webp' && supportsFormat('image/webp')) {
      compressed = await compressToFormat(img, dimensions, 'image/webp', quality);
    } else {
      // Fallback to JPEG
      compressed = await compressToFormat(img, dimensions, 'image/jpeg', quality);
    }

    console.log('[Photo Compression] Compression complete:', {
      originalSize: file.size,
      compressedSize: compressed.size,
      ratio: ((1 - compressed.size / file.size) * 100).toFixed(2) + '%',
    });

    // If still too large, try lower quality
    const targetSize = (options?.targetSizeKB || TARGET_SIZE_KB) * 1024;
    if (compressed.size > targetSize && quality > 0.3) {
      console.log('[Photo Compression] Still too large, reducing quality');
      const lowerQuality = Math.max(0.3, quality - 0.2);
      compressed = await compressToFormat(
        img,
        dimensions,
        `image/${format}` as any,
        lowerQuality
      );
    }

    return compressed;
  } catch (error) {
    console.error('[Photo Compression] Compression failed:', error);
    throw error;
  }
}

/**
 * Get compression statistics
 */
export function getCompressionStats(
  original: File,
  compressed: Blob,
  width: number,
  height: number,
  quality: CompressionQuality = 'medium'
): CompressionStats {
  const compressionRatio = compressed.size / original.size;
  const reductionPercent = (1 - compressionRatio) * 100;

  const stats: CompressionStats = {
    originalSize: original.size,
    compressedSize: compressed.size,
    originalFormat: original.type,
    compressedFormat: compressed.type,
    compressionRatio,
    reductionPercent,
    width,
    height,
    quality,
  };

  console.log('[Photo Compression] Compression stats:', stats);

  return stats;
}

/**
 * Compress image and get detailed stats
 */
export async function compressImageWithStats(
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> {
  const img = await loadImage(file);
  const compressed = await compressImage(file, options);

  const dimensions = calculateDimensions(
    img.width,
    img.height,
    options?.maxWidth || MAX_WIDTH,
    options?.maxHeight || MAX_HEIGHT
  );

  const stats = getCompressionStats(
    file,
    compressed,
    dimensions.width,
    dimensions.height,
    options?.quality || 'medium'
  );

  return { blob: compressed, stats };
}

/**
 * Load image from file
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate target dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // If already within limits, return as-is
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    // Landscape
    width = maxWidth;
    height = Math.round(maxWidth / aspectRatio);
  } else {
    // Portrait or square
    height = maxHeight;
    width = Math.round(maxHeight * aspectRatio);
  }

  return { width, height };
}

/**
 * Compress image to specific format
 */
async function compressToFormat(
  img: HTMLImageElement,
  dimensions: { width: number; height: number },
  mimeType: 'image/avif' | 'image/webp' | 'image/jpeg',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        mimeType,
        quality
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if browser supports specific image format
 */
function supportsFormat(mimeType: string): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  // Try to create data URL with format
  const dataUrl = canvas.toDataURL(mimeType);

  // Check if browser supports format (if not supported, returns image/png)
  const supported = dataUrl.startsWith(`data:${mimeType}`);

  console.log('[Photo Compression] Format support check:', {
    mimeType,
    supported,
  });

  return supported;
}

/**
 * Get best available compression format
 */
async function getBestFormat(): Promise<CompressionFormat> {
  // Priority: AVIF > WebP > JPEG
  if (supportsFormat('image/avif')) {
    console.log('[Photo Compression] Using AVIF (best compression)');
    return 'avif';
  }

  if (supportsFormat('image/webp')) {
    console.log('[Photo Compression] Using WebP (good compression)');
    return 'webp';
  }

  console.log('[Photo Compression] Using JPEG (fallback)');
  return 'jpeg';
}

/**
 * Compress image in worker thread (for large files > 5MB)
 */
export async function compressImageInWorker(
  file: File,
  options?: CompressionOptions
): Promise<Blob> {
  // Check if file is large enough to warrant worker
  const WORKER_THRESHOLD = 5 * 1024 * 1024; // 5MB

  if (file.size < WORKER_THRESHOLD) {
    // Use main thread for small files
    return compressImage(file, options);
  }

  console.log('[Photo Compression] File is large, using worker thread');

  // Check if Worker is supported
  if (typeof Worker === 'undefined') {
    console.warn('[Photo Compression] Worker not supported, using main thread');
    return compressImage(file, options);
  }

  // For now, fall back to main thread
  // TODO: Implement actual worker in future iteration
  return compressImage(file, options);
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  console.log('[Photo Compression] Batch compression:', {
    count: files.length,
  });

  const compressed: Blob[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    console.log('[Photo Compression] Compressing:', {
      index: i + 1,
      total: files.length,
      fileName: file.name,
    });

    const blob = await compressImage(file, options);
    compressed.push(blob);

    onProgress?.(i + 1, files.length);
  }

  console.log('[Photo Compression] Batch compression complete');
  return compressed;
}

/**
 * Estimate compression size without actually compressing
 */
export function estimateCompressionSize(
  fileSize: number,
  format: CompressionFormat = 'webp',
  quality: CompressionQuality = 'medium'
): number {
  // Rough estimates based on typical compression ratios
  const ratios: Record<CompressionFormat, Record<CompressionQuality, number>> = {
    avif: { high: 0.15, medium: 0.1, low: 0.05 },
    webp: { high: 0.3, medium: 0.2, low: 0.1 },
    jpeg: { high: 0.5, medium: 0.35, low: 0.2 },
  };

  const ratio = ratios[format][quality];
  const estimatedSize = Math.round(fileSize * ratio);

  console.log('[Photo Compression] Estimated size:', {
    original: fileSize,
    format,
    quality,
    estimated: estimatedSize,
    savings: ((1 - ratio) * 100).toFixed(2) + '%',
  });

  return estimatedSize;
}

/**
 * Check if compression is recommended
 */
export function shouldCompress(file: File, targetSizeKB: number = TARGET_SIZE_KB): boolean {
  const targetBytes = targetSizeKB * 1024;
  const shouldCompress = file.size > targetBytes;

  console.log('[Photo Compression] Compression recommendation:', {
    fileSize: file.size,
    targetSize: targetBytes,
    shouldCompress,
    reason: shouldCompress ? 'File exceeds target size' : 'File within target size',
  });

  return shouldCompress;
}

// Export configuration
export const PHOTO_COMPRESSION_CONFIG = {
  QUALITY_PRESETS,
  TARGET_SIZE_KB,
  MAX_WIDTH,
  MAX_HEIGHT,
} as const;
