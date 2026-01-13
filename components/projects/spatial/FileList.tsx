/**
 * FileList Component - P3.6
 * - List view with file type icons
 * - Upload button + FileUploader modal
 * - Download and delete functionality
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  File,
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Archive,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileUploader } from './FileUploader'
import { useMarkerMutations } from '@/hooks/use-marker-mutations'
import { getFileCategory, formatFileSize } from '@/lib/file-processing'
import { format } from 'date-fns'
import type { MarkerContent } from '@/types/db/spatial'

export interface FileListProps {
  markerId: string
  files: MarkerContent[]
}

/**
 * Get icon component for file type
 */
function getFileIcon(mimeType: string) {
  const category = getFileCategory(mimeType)

  switch (category) {
    case 'image':
      return ImageIcon
    case 'pdf':
      return FileText
    case 'document':
      return FileText
    case 'spreadsheet':
      return FileSpreadsheet
    case 'cad':
      return FileCode
    case 'archive':
      return Archive
    default:
      return File
  }
}

/**
 * Get color class for file type
 */
function getFileColor(mimeType: string): string {
  const category = getFileCategory(mimeType)

  switch (category) {
    case 'image':
      return 'text-blue-600 bg-blue-50'
    case 'pdf':
      return 'text-red-600 bg-red-50'
    case 'document':
      return 'text-blue-600 bg-blue-50'
    case 'spreadsheet':
      return 'text-green-600 bg-green-50'
    case 'cad':
      return 'text-purple-600 bg-purple-50'
    case 'archive':
      return 'text-yellow-600 bg-yellow-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * FileList - List view for marker files
 */
export function FileList({ markerId, files }: FileListProps) {
  console.log('[FileList] Rendering', { markerId, fileCount: files.length })

  const [showUploader, setShowUploader] = useState(false)
  const { deleteContent } = useMarkerMutations()

  const handleUploadComplete = (uploadedFiles: { id: number; url: string }[]) => {
    console.log('[FileList] Upload complete:', uploadedFiles.length)
    setShowUploader(false)
    // The mutation hook will handle revalidation
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file?')) return
    console.log('[FileList] Deleting file:', fileId)
    await deleteContent(fileId)
  }

  const handleDownload = (file: MarkerContent) => {
    console.log('[FileList] Downloading file:', file.id)
    if (file.file_url) {
      window.open(file.file_url, '_blank')
    }
  }

  if (files.length === 0 && !showUploader) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
          <File className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="font-bold text-[#001B51] mb-2 uppercase tracking-tight">No Files Yet</h3>
        <p className="text-sm text-gray-600 mb-4">
          Attach documents, drawings, or other files to this marker.
        </p>
        <button
          onClick={() => setShowUploader(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[#001B51] text-white font-bold',
            'hover:bg-[#002B71] transition-colors'
          )}
        >
          <Upload className="w-4 h-4" />
          UPLOAD FILE
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      {!showUploader && (
        <button
          onClick={() => setShowUploader(true)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
            'bg-[#001B51] text-white font-bold',
            'hover:bg-[#002B71] transition-colors'
          )}
        >
          <Upload className="w-4 h-4" />
          ADD FILES
        </button>
      )}

      {/* File uploader */}
      {showUploader && (
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <FileUploader
            markerId={markerId}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.file_mime_type || '')
            const colorClass = getFileColor(file.file_mime_type || '')

            return (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-[#001B51] transition-colors"
              >
                {/* File icon */}
                <div className={cn('flex-shrink-0 p-2 rounded-lg', colorClass)}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#001B51] truncate">
                    {file.file_name || 'Untitled File'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {file.file_size_bytes && <span>{formatFileSize(file.file_size_bytes)}</span>}
                    {file.created_at && (
                      <>
                        <span>•</span>
                        <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(file)}
                    className={cn(
                      'p-2 rounded-lg',
                      'hover:bg-gray-100 transition-colors',
                      'text-gray-600 hover:text-[#001B51]'
                    )}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className={cn(
                      'p-2 rounded-lg',
                      'hover:bg-red-50 transition-colors',
                      'text-gray-600 hover:text-red-600'
                    )}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
