/**
 * Image Processing Utilities for Spatial Viewer
 * - Thumbnail generation
 * - EXIF extraction
 * - Client-side validation
 */

import sharp from 'sharp'
import exifr from 'exifr'

const MAX_PHOTO_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_THUMBNAIL_WIDTH = 400
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface ExifData {
  gps?: {
    latitude: number
    longitude: number
    altitude?: number
  }
  camera?: {
    make?: string
    model?: string
    lens?: string
  }
  timestamp?: string
  orientation?: number
  exposure?: {
    iso?: number
    fNumber?: number
    exposureTime?: string
    focalLength?: number
  }
}

/**
 * Client-side validation for photo uploads
 */
export function validatePhoto(file: File): { valid: boolean; error?: string } {
  console.log('[validatePhoto] Validating:', file.name, file.type, file.size)

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    }
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_PHOTO_SIZE / 1024 / 1024}MB.`,
    }
  }

  return { valid: true }
}

/**
 * Generate thumbnail from uploaded photo
 * Maintains aspect ratio, max width 400px
 */
export async function generateThumbnail(
  buffer: Buffer
): Promise<{ thumbnail: Buffer; width: number; height: number }> {
  console.log('[generateThumbnail] Generating thumbnail')

  const image = sharp(buffer)
  const metadata = await image.metadata()

  const width = metadata.width || 400
  const height = metadata.height || 400

  // Calculate thumbnail dimensions maintaining aspect ratio
  const thumbWidth = MAX_THUMBNAIL_WIDTH
  const thumbHeight = Math.round((height / width) * MAX_THUMBNAIL_WIDTH)

  const thumbnail = await image
    .resize(thumbWidth, thumbHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer()

  console.log('[generateThumbnail] Generated:', thumbWidth, 'x', thumbHeight)

  return { thumbnail, width: thumbWidth, height: thumbHeight }
}

/**
 * Extract EXIF data from photo buffer
 */
export async function extractExif(buffer: Buffer): Promise<ExifData | null> {
  console.log('[extractExif] Extracting EXIF data')

  try {
    const exif = await exifr.parse(buffer, {
      gps: true,
      tiff: true,
      exif: true,
    })

    if (!exif) {
      console.log('[extractExif] No EXIF data found')
      return null
    }

    const data: ExifData = {}

    // GPS data
    if (exif.latitude && exif.longitude) {
      data.gps = {
        latitude: exif.latitude,
        longitude: exif.longitude,
        altitude: exif.GPSAltitude,
      }
    }

    // Camera data
    if (exif.Make || exif.Model) {
      data.camera = {
        make: exif.Make,
        model: exif.Model,
        lens: exif.LensModel,
      }
    }

    // Timestamp
    if (exif.DateTimeOriginal) {
      data.timestamp = exif.DateTimeOriginal.toISOString()
    }

    // Orientation
    if (exif.Orientation) {
      data.orientation = exif.Orientation
    }

    // Exposure data
    if (exif.ISO || exif.FNumber || exif.ExposureTime || exif.FocalLength) {
      data.exposure = {
        iso: exif.ISO,
        fNumber: exif.FNumber,
        exposureTime: exif.ExposureTime ? `1/${Math.round(1 / exif.ExposureTime)}` : undefined,
        focalLength: exif.FocalLength,
      }
    }

    console.log('[extractExif] Extracted:', Object.keys(data))
    return data
  } catch (error) {
    console.error('[extractExif] Error:', error)
    return null
  }
}

/**
 * Apply EXIF orientation to image buffer
 */
export async function applyOrientation(buffer: Buffer): Promise<Buffer> {
  console.log('[applyOrientation] Applying orientation correction')

  try {
    const image = sharp(buffer)
    const rotated = await image.rotate().toBuffer()
    return rotated
  } catch (error) {
    console.error('[applyOrientation] Error:', error)
    return buffer
  }
}
