'use client';

import { useState, useCallback } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Upload from 'lucide-react/icons/upload';
import Image from 'lucide-react/icons/image';
import FileText from 'lucide-react/icons/file-text';
import X from 'lucide-react/icons/x';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import AlertCircle from 'lucide-react/icons/alert-circle';;
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface FloorPlanUploadResult {
  id: string;
  name: string;
  url: string;
  floorIndex: number;
  fileType: 'png' | 'jpg' | 'pdf';
}

export interface FloorPlanUploaderProps {
  projectId: string;
  onUploadComplete?: (result: FloorPlanUploadResult) => void;
  onUploadError?: (error: string) => void;
  maxFileSizeMB?: number;
  className?: string;
}

/**
 * FloorPlanUploader - Upload floor plans (PNG, JPG, PDF)
 * Supports drag-and-drop and file picker
 */
export function FloorPlanUploader({
  projectId,
  onUploadComplete,
  onUploadError,
  maxFileSizeMB = 50,
  className,
}: FloorPlanUploaderProps) {
  console.log('[FloorPlanUploader] Rendering', { projectId, maxFileSizeMB });

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [floorName, setFloorName] = useState('');
  const [floorIndex, setFloorIndex] = useState(0);

  const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  const acceptedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];

  const validateFile = useCallback(
    (file: File): string | null => {
      console.log('[FloorPlanUploader] Validating file:', file.name);

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        return 'Only PNG, JPG, and PDF files are supported';
      }

      // Check file size
      const maxBytes = maxFileSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        return `File size must be less than ${maxFileSizeMB}MB`;
      }

      return null;
    },
    [maxFileSizeMB]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      console.log('[FloorPlanUploader] File selected:', file.name);

      const error = validateFile(file);
      if (error) {
        console.error('[FloorPlanUploader] Validation error:', error);
        setUploadError(error);
        onUploadError?.(error);
        return;
      }

      setUploadedFile(file);
      setUploadError(null);
      setFloorName(file.name.replace(/\.(png|jpg|jpeg|pdf)$/i, ''));
    },
    [validateFile, onUploadError]
  );

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
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!uploadedFile) return;

    console.log('[FloorPlanUploader] Starting upload:', {
      fileName: uploadedFile.name,
      floorName,
      floorIndex,
    });

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Create FormData
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('projectId', projectId);
      formData.append('floorName', floorName);
      formData.append('floorIndex', floorIndex.toString());

      // Upload to server (TODO: implement actual upload endpoint)
      const response = await fetch('/api/projects/floor-plans/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      setUploadProgress(100);
      console.log('[FloorPlanUploader] Upload complete:', result);

      if (onUploadComplete) {
        onUploadComplete({
          id: result.id,
          name: floorName,
          url: result.url,
          floorIndex,
          fileType: uploadedFile.type.includes('pdf') ? 'pdf' : uploadedFile.type.includes('png') ? 'png' : 'jpg',
        });
      }

      // Reset form
      setTimeout(() => {
        setUploadedFile(null);
        setFloorName('');
        setFloorIndex(0);
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (err: any) {
      console.error('[FloorPlanUploader] Upload error:', err);
      const errorMessage = err.message || 'Upload failed';
      setUploadError(errorMessage);
      onUploadError?.(errorMessage);
      setIsUploading(false);
    }
  }, [uploadedFile, projectId, floorName, floorIndex, onUploadComplete, onUploadError]);

  const handleCancel = useCallback(() => {
    setUploadedFile(null);
    setFloorName('');
    setFloorIndex(0);
    setUploadProgress(0);
    setUploadError(null);
    setIsUploading(false);
  }, []);

  return (
    <Card className={cn('border-2 border-gray-200 shadow-construction bg-white', className)}>
      <div className="border-b-2 border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#001B51] rounded-lg">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-tight text-sm">
              Upload Floor Plan
            </h3>
            <p className="text-xs text-gray-500">PNG, JPG, PDF up to {maxFileSizeMB}MB</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* File Drop Zone */}
        {!uploadedFile && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
              isDragging
                ? 'border-[#001B51] bg-blue-50'
                : 'border-gray-300 hover:border-[#001B51] hover:bg-gray-50'
            )}
          >
            <input
              type="file"
              accept={acceptedExtensions.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              id="floor-plan-upload"
            />
            <label htmlFor="floor-plan-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 mb-1">
                Drag and drop a floor plan or click to browse
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, PDF up to {maxFileSizeMB}MB</p>
            </label>
          </div>
        )}

        {/* File Preview */}
        {uploadedFile && (
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                {uploadedFile.type.includes('pdf') ? (
                  <FileText className="w-6 h-6 text-blue-600" />
                ) : (
                  <Image className="w-6 h-6 text-blue-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {!isUploading && (
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#001B51] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Success State */}
            {uploadProgress === 100 && (
              <div className="mt-4 flex items-center gap-2 text-[#059669]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-semibold">Upload complete!</span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="border-2 border-red-300 bg-red-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-semibold">{uploadError}</span>
            </div>
          </div>
        )}

        {/* Floor Details Form */}
        {uploadedFile && !isUploading && uploadProgress < 100 && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Floor Name
              </label>
              <input
                type="text"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g., Ground Floor, Level 1"
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'border-2 border-gray-200 focus:border-[#001B51] focus:outline-none',
                  'text-sm'
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Floor Index (0 = ground)
              </label>
              <input
                type="number"
                value={floorIndex}
                onChange={(e) => setFloorIndex(parseInt(e.target.value) || 0)}
                min={0}
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'border-2 border-gray-200 focus:border-[#001B51] focus:outline-none',
                  'text-sm'
                )}
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!floorName.trim()}
              className={cn(
                'w-full px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide',
                'bg-[#001B51] text-white hover:bg-[#002666] transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              <Upload className="w-4 h-4" />
              Upload Floor Plan
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
