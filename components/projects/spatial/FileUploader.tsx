/**
 * FileUploader Component - P3.6
 * - Batch upload with individual progress bars
 * - Supports PDF, DOC/DOCX, XLS/XLSX, DWG, DXF, images, ZIP (max 50MB)
 * - Client-side validation
 * - Optimistic UI
 */

'use client'

import { useState, useRef } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Upload from 'lucide-react/icons/upload';
import X from 'lucide-react/icons/x';
import Loader2 from 'lucide-react/icons/loader-2';
import AlertCircle from 'lucide-react/icons/alert-circle';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import FileText from 'lucide-react/icons/file-text';
import { cn } from '@/lib/utils'
import { validateFile, formatFileSize } from '@/lib/file-processing'
import { toast } from 'sonner'

interface FileUploadItem {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  contentId?: number
}

interface FileUploaderProps {
  markerId: string
  onUploadComplete: (files: { id: number; url: string }[]) => void
  onCancel?: () => void
}

export function FileUploader({ markerId, onUploadComplete, onCancel }: FileUploaderProps) {
  console.log('[FileUploader] Rendering for marker:', markerId)

  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    console.log('[FileUploader] Files selected:', selectedFiles.length)

    // Validate and create upload items
    const newFiles: FileUploadItem[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const validation = validateFile(file)

      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`)
        continue
      }

      newFiles.push({
        file,
        id: crypto.randomUUID(),
        status: 'pending',
        progress: 0,
      })
    }

    setFiles((prev) => [...prev, ...newFiles])

    // Start uploading
    await uploadFiles(newFiles)
  }

  const uploadFiles = async (filesToUpload: FileUploadItem[]) => {
    console.log('[FileUploader] Uploading files:', filesToUpload.length)
    setUploading(true)

    const uploadedFiles: { id: number; url: string }[] = []

    // Upload files in parallel (max 3 concurrent)
    const concurrency = 3
    const chunks = []
    for (let i = 0; i < filesToUpload.length; i += concurrency) {
      chunks.push(filesToUpload.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (fileItem) => {
          try {
            // Update status to uploading
            setFiles((prev) =>
              prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'uploading' } : f))
            )

            // Simulate progress
            const progressInterval = setInterval(() => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileItem.id ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
                )
              )
            }, 200)

            // Upload file
            const formData = new FormData()
            formData.append('file', fileItem.file)
            formData.append('markerId', markerId.toString())

            const response = await fetch('/api/spatial/upload-file', {
              method: 'POST',
              body: formData,
            })

            clearInterval(progressInterval)

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Upload failed')
            }

            const result = await response.json()

            // Update status to success
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id
                  ? { ...f, status: 'success', progress: 100, contentId: result.content.id }
                  : f
              )
            )

            uploadedFiles.push({ id: result.content.id, url: result.content.url })

            toast.success(`${fileItem.file.name} uploaded`)
          } catch (err) {
            console.error('[FileUploader] Upload error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'

            // Update status to error
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, status: 'error', error: errorMessage } : f
              )
            )

            toast.error(`${fileItem.file.name}: ${errorMessage}`)
          }
        })
      )
    }

    setUploading(false)

    // Call callback with uploaded files
    if (uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles)
    }
  }

  const handleRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const allComplete = files.length > 0 && files.every((f) => f.status === 'success')

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.dxf,.jpg,.jpeg,.png,.webp,.gif,.svg,.zip,.rar,.7z,.txt,.csv"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Upload zone */}
      {files.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-8',
            'hover:border-construction-blue hover:bg-gray-50 transition-colors',
            'cursor-pointer'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 rounded-lg bg-construction-blue/10">
              <Upload className="w-6 h-6 text-construction-blue" />
            </div>
            <div className="text-center">
              <p className="font-bold text-construction-blue mb-1">UPLOAD FILES</p>
              <p className="text-sm text-gray-500">Click or drag files here</p>
            </div>
            <p className="text-xs text-gray-400 text-center">
              PDF, Word, Excel, CAD, Images, Archives • Max 50MB per file
            </p>
          </div>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {files.map((fileItem) => (
              <motion.div
                key={fileItem.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2',
                  fileItem.status === 'success' && 'border-green-200 bg-green-50',
                  fileItem.status === 'error' && 'border-red-200 bg-red-50',
                  (fileItem.status === 'pending' || fileItem.status === 'uploading') &&
                    'border-gray-200 bg-white'
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {fileItem.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-construction-blue animate-spin" />
                  )}
                  {fileItem.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {fileItem.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  {fileItem.status === 'pending' && <FileText className="w-5 h-5 text-gray-400" />}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>

                  {/* Progress bar */}
                  {fileItem.status === 'uploading' && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                      <motion.div
                        className="h-full bg-construction-blue"
                        initial={{ width: 0 }}
                        animate={{ width: `${fileItem.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  {/* Error message */}
                  {fileItem.status === 'error' && fileItem.error && (
                    <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                  )}
                </div>

                {/* Remove button */}
                {(fileItem.status === 'pending' || fileItem.status === 'error') && (
                  <button
                    onClick={() => handleRemove(fileItem.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add more files button */}
      {files.length > 0 && !uploading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
            'border-2 border-dashed border-gray-300 text-gray-700 font-medium',
            'hover:border-construction-blue hover:bg-gray-50 transition-colors'
          )}
        >
          <Upload className="w-4 h-4" />
          Add More Files
        </button>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={uploading}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'border border-gray-300 text-gray-700 font-medium',
              'hover:bg-gray-50 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {allComplete ? 'Close' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  )
}
