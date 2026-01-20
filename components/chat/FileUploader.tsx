'use client';

/**
 * FileUploader - File upload interface for chat messages
 *
 * Features:
 * - File picker button with paperclip icon
 * - Drag-and-drop zone (shows on drag hover)
 * - Upload progress indicator
 * - Cancel button for in-progress uploads
 * - Paste image from clipboard support
 * - Error messages for files > 10MB or invalid types
 * - Construction-themed design
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Paperclip, X, Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import { uploadAttachment } from '@/app/actions/chat';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
  messageId: string;
  onUploadComplete?: (attachment: any) => void;
  className?: string;
}

// Debug: Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
];

const MAX_FILE_SIZE = 10485760; // 10MB

// Debug: File uploader component
export function FileUploader({ messageId, onUploadComplete, className }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  console.log('[FileUploader] Rendering for message:', messageId);

  // Debug: Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit (${(file.size / 1048576).toFixed(2)}MB)`;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: images (jpg, png, gif, webp), documents (pdf, doc, docx, xls, xlsx), archives (zip)';
    }

    return null;
  }, []);

  // Debug: Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      console.log('[FileUploader] Starting upload:', file.name, file.size, file.type);

      setError(null);
      setUploadedFile({ name: file.name, size: file.size });

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        console.error('[FileUploader] Validation failed:', validationError);
        setError(validationError);
        toast.error(validationError);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress (since Vercel Blob doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('messageId', messageId);

        const result = await uploadAttachment(formData);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result.success) {
          console.log('[FileUploader] Upload successful:', result.attachment);
          toast.success('File uploaded successfully');
          onUploadComplete?.(result.attachment);

          // Reset after a short delay
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadedFile(null);
          }, 1500);
        } else {
          console.error('[FileUploader] Upload failed:', result.error);
          setError(result.error || 'Failed to upload file');
          toast.error(result.error || 'Failed to upload file');
          setIsUploading(false);
        }
      } catch (err) {
        console.error('[FileUploader] Unexpected error:', err);
        clearInterval(progressInterval);
        setError('An unexpected error occurred');
        toast.error('An unexpected error occurred');
        setIsUploading(false);
      }
    },
    [messageId, validateFile, onUploadComplete]
  );

  // Debug: Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleUpload]
  );

  // Debug: Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  // Debug: Handle paste (for images)
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            console.log('[FileUploader] Image pasted from clipboard');
            handleUpload(file);
            e.preventDefault();
          }
        }
      }
    },
    [handleUpload]
  );

  // Debug: Setup paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Debug: File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={ALLOWED_TYPES.join(',')}
        disabled={isUploading}
      />

      {/* Debug: Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          'p-2.5 rounded-lg transition-all duration-200',
          isUploading
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-600 hover:text-construction-blue'
        )}
        title="Attach file"
        aria-label="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </button>

      {/* Debug: Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'fixed inset-0 z-50',
              'bg-construction-blue/10 backdrop-blur-sm',
              'flex items-center justify-center',
              'border-4 border-dashed border-construction-blue'
            )}
          >
            <div className="flex flex-col items-center gap-4 bg-white border-4 border-construction-blue rounded-xl p-8 shadow-construction-lg">
              <Upload className="h-16 w-16 text-construction-blue animate-bounce" />
              <div className="text-center">
                <p className="text-lg font-black text-construction-blue uppercase tracking-wide mb-1">
                  Drop file here
                </p>
                <p className="text-sm font-mono text-gray-600">
                  Max 10MB • Images, PDFs, Docs, Zip
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Upload progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              'absolute bottom-full mb-2 left-0 right-0',
              'bg-white border-2 border-gray-200 rounded-lg shadow-construction-lg p-3',
              'min-w-[280px]'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {uploadProgress === 100 ? (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 text-construction-blue animate-spin shrink-0" />
              )}
              <span className="text-xs font-mono text-gray-700 truncate flex-1">
                {uploadedFile?.name}
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {uploadedFile ? (uploadedFile.size / 1024).toFixed(0) : 0}KB
              </span>
            </div>

            <Progress value={uploadProgress} className="h-2" />

            <p className="text-[10px] font-mono text-gray-500 mt-1">
              {uploadProgress === 100 ? 'Upload complete!' : `Uploading... ${uploadProgress}%`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Error message */}
      <AnimatePresence>
        {error && !isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              'absolute bottom-full mb-2 left-0 right-0',
              'bg-red-50 border-2 border-red-200 rounded-lg p-3',
              'min-w-[280px]'
            )}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-700">Upload failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="shrink-0">
                <X className="h-4 w-4 text-red-500 hover:text-red-700" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
