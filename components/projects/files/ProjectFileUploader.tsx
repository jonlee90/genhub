/**
 * ProjectFileUploader Component
 * - Batch upload supporting multiple files
 * - Category selection dropdown
 * - Client-visible checkbox for portal visibility
 * - Individual progress bars per file in queue
 * - Concurrent upload limit: max 3 files
 * - File validation: max 50MB per file
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Upload from 'lucide-react/icons/upload';
import X from 'lucide-react/icons/x';
import Loader2 from 'lucide-react/icons/loader-2';
import AlertCircle from 'lucide-react/icons/alert-circle';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import FileText from 'lucide-react/icons/file-text';
import File from 'lucide-react/icons/file';
import Image from 'lucide-react/icons/image';
import Archive from 'lucide-react/icons/archive';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CategorySelector } from './CategorySelector';
import { toast } from 'sonner';

// Validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.dwg',
  '.dxf',
  '.svg',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.zip',
  '.rar',
  '.7z',
];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/vnd.dwg',
  'image/vnd.dxf',
  'image/svg+xml',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];
const MAX_CONCURRENT_UPLOADS = 3;

interface FileQueueItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ProjectFileUploaderProps {
  projectId: string;
  category?: string;
  onComplete: () => void;
  onCancel?: () => void;
}

/**
 * Get file icon based on extension/type
 */
function getFileIcon(file: File) {
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) return FileText;
  if (type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => name.endsWith(ext))) return Image;
  if (type.includes('zip') || type.includes('rar') || ['.zip', '.rar', '.7z'].some(ext => name.endsWith(ext))) return Archive;
  return File;
}

/**
 * Validate file for upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  console.log('[validateFile] Checking:', file.name, file.type, file.size);

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    };
  }

  // Check extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.includes(ext);

  // Check MIME type (some browsers don't report accurate MIME types)
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'File type not allowed',
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFileUploader({
  projectId,
  category: defaultCategory,
  onComplete,
  onCancel,
}: ProjectFileUploaderProps) {
  console.log('[ProjectFileUploader] Rendering for project:', projectId);

  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [category, setCategory] = useState(defaultCategory || 'general');
  const [clientVisible, setClientVisible] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(new Set<string>());

  /**
   * Process selected files and add to queue
   */
  const handleFilesSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      console.log('[ProjectFileUploader] Files selected:', files.length);

      const newItems: FileQueueItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file);

        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }

        newItems.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          status: 'pending',
          progress: 0,
        });
      }

      if (newItems.length === 0) {
        return;
      }

      setQueue((prev) => [...prev, ...newItems]);

      // Start uploading
      processQueue([...queue, ...newItems]);
    },
    [queue]
  );

  /**
   * Process upload queue with concurrency limit
   */
  const processQueue = async (items: FileQueueItem[]) => {
    console.log('[ProjectFileUploader] Processing queue, items:', items.length);
    setIsProcessing(true);

    const pending = items.filter(
      (item) => item.status === 'pending' && !uploadingRef.current.has(item.id)
    );
    const currentUploading = uploadingRef.current.size;
    const slotsAvailable = MAX_CONCURRENT_UPLOADS - currentUploading;

    console.log('[ProjectFileUploader] Slots available:', slotsAvailable, 'Pending:', pending.length);

    const toUpload = pending.slice(0, slotsAvailable);

    for (const item of toUpload) {
      uploadFile(item);
    }
  };

  /**
   * Upload a single file
   */
  const uploadFile = async (item: FileQueueItem) => {
    console.log('[ProjectFileUploader] Starting upload:', item.file.name);
    uploadingRef.current.add(item.id);

    // Update status to uploading
    setQueue((prev) =>
      prev.map((qi) => (qi.id === item.id ? { ...qi, status: 'uploading' as const } : qi))
    );

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('projectId', projectId);
      formData.append('category', category);
      formData.append('clientVisible', clientVisible.toString());

      // Simulate progress (since fetch doesn't support progress tracking)
      const progressInterval = setInterval(() => {
        setQueue((prev) =>
          prev.map((qi) =>
            qi.id === item.id && qi.status === 'uploading'
              ? { ...qi, progress: Math.min(qi.progress + 10, 90) }
              : qi
          )
        );
      }, 200);

      const response = await fetch('/api/project-files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      // Success
      console.log('[ProjectFileUploader] Upload success:', item.file.name);
      setQueue((prev) =>
        prev.map((qi) =>
          qi.id === item.id ? { ...qi, status: 'success' as const, progress: 100 } : qi
        )
      );
    } catch (err) {
      console.error('[ProjectFileUploader] Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';

      setQueue((prev) =>
        prev.map((qi) =>
          qi.id === item.id
            ? { ...qi, status: 'error' as const, progress: 0, error: errorMessage }
            : qi
        )
      );
    } finally {
      uploadingRef.current.delete(item.id);

      // Check for more items to upload
      setQueue((prev) => {
        const pendingItems = prev.filter(
          (qi) => qi.status === 'pending' && !uploadingRef.current.has(qi.id)
        );
        if (pendingItems.length > 0 && uploadingRef.current.size < MAX_CONCURRENT_UPLOADS) {
          // Schedule next batch
          setTimeout(() => processQueue(prev), 100);
        }

        // Check if all done
        const allDone = prev.every((qi) => qi.status === 'success' || qi.status === 'error');
        if (allDone && prev.length > 0) {
          const successCount = prev.filter((qi) => qi.status === 'success').length;
          const errorCount = prev.filter((qi) => qi.status === 'error').length;

          if (errorCount === 0) {
            toast.success(`${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully`);
            setTimeout(() => onComplete(), 1000);
          } else if (successCount > 0) {
            toast.warning(`${successCount} uploaded, ${errorCount} failed`);
          }

          setIsProcessing(false);
        }

        return prev;
      });
    }
  };

  /**
   * Remove item from queue
   */
  const removeFromQueue = (itemId: string) => {
    console.log('[ProjectFileUploader] Removing from queue:', itemId);
    setQueue((prev) => prev.filter((qi) => qi.id !== itemId));
  };

  /**
   * Drag and drop handlers
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFilesSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const hasQueueItems = queue.length > 0;
  const hasActiveUploads = queue.some((q) => q.status === 'uploading');

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={(e) => {
          handleFilesSelect(e.target.files);
          e.target.value = ''; // Reset for same file selection
        }}
        className="hidden"
      />

      {/* Category selector - only show before uploads start */}
      {!hasActiveUploads && (
        <CategorySelector type="document" value={category} onChange={setCategory} />
      )}

      {/* Client visible checkbox - only show before uploads start */}
      {!hasActiveUploads && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="client-visible-files"
            checked={clientVisible}
            onCheckedChange={(checked: boolean | 'indeterminate') =>
              setClientVisible(checked === true)
            }
          />
          <label
            htmlFor="client-visible-files"
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            Visible to client in portal
          </label>
        </div>
      )}

      {/* Upload queue */}
      <AnimatePresence mode="popLayout">
        {hasQueueItems && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 max-h-80 overflow-y-auto pr-1"
          >
            {queue.map((item) => {
              const FileIcon = getFileIcon(item.file);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    'border-2 rounded-lg p-3',
                    item.status === 'success' && 'border-green-200 bg-green-50',
                    item.status === 'error' && 'border-red-200 bg-red-50',
                    item.status === 'pending' && 'border-gray-200 bg-gray-50',
                    item.status === 'uploading' && 'border-[#001B51]/30 bg-[#001B51]/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* File icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 p-2 rounded-lg',
                        item.status === 'success' && 'bg-green-100 text-green-600',
                        item.status === 'error' && 'bg-red-100 text-red-600',
                        item.status === 'pending' && 'bg-gray-200 text-gray-500',
                        item.status === 'uploading' && 'bg-[#001B51]/10 text-[#001B51]'
                      )}
                    >
                      <FileIcon className="h-5 w-5" />
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(item.file.size)}</p>
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {item.status === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {item.status === 'uploading' && (
                        <Loader2 className="h-5 w-5 text-[#001B51] animate-spin" />
                      )}
                      {item.status === 'pending' && (
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {item.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-[#001B51]"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{item.progress}%</p>
                    </div>
                  )}

                  {/* Error message */}
                  {item.status === 'error' && item.error && (
                    <p className="text-xs text-red-600 mt-2">{item.error}</p>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone */}
      {!hasActiveUploads && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer',
            isDragOver
              ? 'border-[#001B51] bg-[#001B51]/5 scale-[1.01]'
              : 'border-gray-300 hover:border-[#001B51] hover:bg-gray-50',
            hasQueueItems && 'p-4'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Icon */}
            <div
              className={cn(
                'p-3 rounded-full transition-colors',
                isDragOver ? 'bg-[#001B51]/10' : 'bg-gray-100'
              )}
            >
              <Upload
                className={cn(
                  'w-6 h-6 transition-colors',
                  isDragOver ? 'text-[#001B51]' : 'text-gray-400'
                )}
              />
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {hasQueueItems ? 'Add more files' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, Word, Excel, CAD, Images, Archives - Max 50MB per file
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && !hasActiveUploads && (
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      )}
    </div>
  );
}
