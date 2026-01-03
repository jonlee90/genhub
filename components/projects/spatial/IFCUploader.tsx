'use client';

import { useState, useCallback } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { uploadIFCFile } from '@/app/actions/spatial';

export interface IFCUploaderProps {
  projectId: string;
  onUploadComplete?: (modelId: string) => void;
  className?: string;
}

export function IFCUploader({ projectId, onUploadComplete, className }: IFCUploaderProps) {
  console.log('[IFCUploader] Rendering', { projectId });

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    console.log('[IFCUploader] Validating file', { name: file.name, size: file.size });

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      setError('Only .IFC files are supported');
      return false;
    }

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 500MB');
      return false;
    }

    setError(null);
    return true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && validateFile(files[0])) {
        setSelectedFile(files[0]);
      }
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && validateFile(files[0])) {
        setSelectedFile(files[0]);
      }
    },
    [validateFile]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    console.log('[IFCUploader] Starting upload', { fileName: selectedFile.name });
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress (actual upload doesn't report progress yet)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file
      const result = await uploadIFCFile(projectId, formData);

      clearInterval(progressInterval);

      if ('error' in result) {
        setError(result.error);
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      // Success
      setUploadProgress(100);
      console.log('[IFCUploader] Upload successful:', result.data?.id);

      // Wait a moment to show 100% progress, then notify parent
      // Conversion is now complete (handled by server action)
      setTimeout(() => {
        setIsUploading(false);
        if (result.data?.id) {
          onUploadComplete?.(result.data.id);
          // Refresh the page to show the new model
          window.location.reload();
        }
      }, 1000); // Increased delay to show completion state
    } catch (err) {
      console.error('[IFCUploader] Upload failed', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, projectId, onUploadComplete]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  }, []);

  return (
    <Card
      className={cn(
        'border-2 border-gray-200 shadow-construction overflow-hidden',
        'bg-white relative',
        className
      )}
    >
      {/* Blueprint corner markers */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#001B51]" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#001B51]" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#001B51]" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#001B51]" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight mb-2">
            Upload IFC Model
          </h3>
          <p className="text-sm text-gray-600">
            Import BIM/IFC files to enable 3D spatial coordination
          </p>
        </div>

        {!selectedFile ? (
          /* Drop Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-lg transition-all',
              'p-8 md:p-12 text-center cursor-pointer',
              'hover:border-[#001B51] hover:bg-blue-50/30',
              isDragging
                ? 'border-[#001B51] bg-blue-50/50 scale-[1.02]'
                : 'border-gray-300 bg-gray-50/50'
            )}
          >
            {/* Technical grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #001B51 1px, transparent 1px),
                  linear-gradient(to bottom, #001B51 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />

            <input
              type="file"
              accept=".ifc"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-lg flex items-center justify-center transition-all',
                  'border-2',
                  isDragging
                    ? 'bg-[#001B51] border-[#001B51] scale-110'
                    : 'bg-white border-gray-200'
                )}
              >
                <Upload
                  className={cn(
                    'w-8 h-8 transition-colors',
                    isDragging ? 'text-white' : 'text-gray-400'
                  )}
                />
              </div>

              <div>
                <p className="text-base font-semibold text-gray-900 mb-1">
                  {isDragging ? 'Drop IFC file here' : 'Drag & drop IFC file'}
                </p>
                <p className="text-sm text-gray-500">
                  or <span className="text-[#001B51] font-medium">browse files</span>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                <span>.IFC</span>
                <span>•</span>
                <span>MAX 500MB</span>
              </div>
            </div>
          </div>
        ) : (
          /* File Preview & Upload */
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="p-2 bg-white border-2 border-[#001B51] rounded">
                <FileCheck className="w-5 h-5 text-[#001B51]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {!isUploading && (
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Processing...</span>
                  <span className="text-[#001B51] font-bold font-mono">{uploadProgress}%</span>
                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#001B51] transition-all duration-300 relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {/* Animated scan line */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Upload Button */}
            {!isUploading && (
              <button
                onClick={handleUpload}
                className={cn(
                  'w-full py-3 px-6 rounded-lg font-semibold uppercase tracking-wide',
                  'bg-[#001B51] text-white',
                  'hover:bg-[#002666] transition-colors',
                  'border-2 border-[#001B51]',
                  'flex items-center justify-center gap-2'
                )}
              >
                <Upload className="w-5 h-5" />
                Upload & Process
              </button>
            )}

            {isUploading && (
              <div className="flex items-center justify-center gap-3 py-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Processing model...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
