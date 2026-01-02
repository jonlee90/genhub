/**
 * File Processing Utilities for Spatial Viewer
 * - File type detection
 * - File validation
 * - MIME type to icon mapping
 */

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': { ext: '.pdf', name: 'PDF' },
  'application/msword': { ext: '.doc', name: 'Word Document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: '.docx',
    name: 'Word Document',
  },
  'application/vnd.ms-excel': { ext: '.xls', name: 'Excel Spreadsheet' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    ext: '.xlsx',
    name: 'Excel Spreadsheet',
  },
  'application/vnd.ms-powerpoint': { ext: '.ppt', name: 'PowerPoint' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    ext: '.pptx',
    name: 'PowerPoint',
  },

  // CAD files
  'application/acad': { ext: '.dwg', name: 'AutoCAD Drawing' },
  'application/dxf': { ext: '.dxf', name: 'AutoCAD DXF' },
  'image/vnd.dwg': { ext: '.dwg', name: 'AutoCAD Drawing' },
  'image/vnd.dxf': { ext: '.dxf', name: 'AutoCAD DXF' },

  // Images
  'image/jpeg': { ext: '.jpg', name: 'JPEG Image' },
  'image/png': { ext: '.png', name: 'PNG Image' },
  'image/webp': { ext: '.webp', name: 'WebP Image' },
  'image/gif': { ext: '.gif', name: 'GIF Image' },
  'image/svg+xml': { ext: '.svg', name: 'SVG Image' },

  // Archives
  'application/zip': { ext: '.zip', name: 'ZIP Archive' },
  'application/x-zip-compressed': { ext: '.zip', name: 'ZIP Archive' },
  'application/x-rar-compressed': { ext: '.rar', name: 'RAR Archive' },
  'application/x-7z-compressed': { ext: '.7z', name: '7-Zip Archive' },

  // Text
  'text/plain': { ext: '.txt', name: 'Text File' },
  'text/csv': { ext: '.csv', name: 'CSV File' },
}

/**
 * Client-side validation for file uploads
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  console.log('[validateFile] Validating:', file.name, file.type, file.size)

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    }
  }

  // Check if file type is allowed
  const isAllowed = Object.keys(ALLOWED_FILE_TYPES).includes(file.type)
  if (!isAllowed) {
    return {
      valid: false,
      error: `File type not supported: ${file.type}`,
    }
  }

  return { valid: true }
}

/**
 * Get file type category from MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation'
  if (mimeType.includes('dwg') || mimeType.includes('dxf')) return 'cad'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z'))
    return 'archive'
  if (mimeType.startsWith('text/')) return 'text'
  return 'file'
}

/**
 * Get file type display name from MIME type
 */
export function getFileTypeName(mimeType: string): string {
  const typeInfo = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES]
  return typeInfo?.name || 'Unknown File'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
