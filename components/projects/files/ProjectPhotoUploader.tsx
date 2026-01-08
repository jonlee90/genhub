/**
 * ProjectPhotoUploader Component
 * - Adapted from spatial/PhotoUploader
 * - Camera capture on mobile (capture="environment")
 * - Category selection dropdown
 * - Client-visible checkbox
 * - Upload to /api/project-photos/upload
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader2, AlertCircle, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CategorySelector } from './CategorySelector';
import { toast } from 'sonner';

// Client-side validation constants (matching server)
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ProjectPhotoUploaderProps {
  projectId: string;
  onComplete: (photoUrl: string) => void;
  onCancel?: () => void;
}

/**
 * Client-side photo validation (without importing server-only code)
 */
function validatePhoto(file: File): { valid: boolean; error?: string } {
  console.log('[validatePhoto] Validating:', file.name, file.type, file.size);

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    };
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_PHOTO_SIZE / 1024 / 1024}MB.`,
    };
  }

  return { valid: true };
}

export function ProjectPhotoUploader({
  projectId,
  onComplete,
  onCancel,
}: ProjectPhotoUploaderProps) {
  console.log('[ProjectPhotoUploader] Rendering for project:', projectId);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState('general');
  const [clientVisible, setClientVisible] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    console.log('[ProjectPhotoUploader] File selected:', file.name);
    setError(null);

    // Validate file
    const validation = validatePhoto(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      toast.error(validation.error || 'Invalid file');
      return;
    }

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadFile(file);
  }, []);

  const uploadFile = async (file: File) => {
    console.log('[ProjectPhotoUploader] Uploading file:', file.name);
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('category', category);
      formData.append('clientVisible', clientVisible.toString());

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/project-photos/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      console.log('[ProjectPhotoUploader] Upload success:', result.photo.id);
      toast.success('Photo uploaded successfully');

      // Call callback with photo URL
      onComplete(result.photo.photo_url);

      // Reset state after a short delay
      setTimeout(() => {
        setPreview(null);
        setProgress(0);
        setUploading(false);
      }, 500);
    } catch (err) {
      console.error('[ProjectPhotoUploader] Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Category selector (only show before upload) */}
      {!preview && !uploading && (
        <CategorySelector type="photo" value={category} onChange={setCategory} />
      )}

      {/* Client visible checkbox (only show before upload) */}
      {!preview && !uploading && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="client-visible"
            checked={clientVisible}
            onCheckedChange={(checked: boolean | 'indeterminate') =>
              setClientVisible(checked === true)
            }
          />
          <label
            htmlFor="client-visible"
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            Visible to client in portal
          </label>
        </div>
      )}

      {/* Preview */}
      <AnimatePresence mode="wait">
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative rounded-lg overflow-hidden border-2 border-gray-200"
          >
            <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain" />

            {/* Progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <div className="w-3/4 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#001B51]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-white text-sm mt-2">{progress}%</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Upload buttons */}
      {!uploading && !preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 transition-colors',
            isDragOver
              ? 'border-[#001B51] bg-[#001B51]/5'
              : 'border-gray-300 hover:border-[#001B51] hover:bg-gray-50',
            'cursor-pointer'
          )}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className="p-4 bg-gray-100 rounded-full">
              <ImagePlus className="w-8 h-8 text-gray-400" />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {/* File picker button */}
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#001B51] hover:bg-[#001B51]/90 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                CHOOSE FILE
              </Button>

              {/* Camera button (mobile only) */}
              <Button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                variant="secondary"
                className="bg-[#3C3C3C] hover:bg-[#4C4C4C] text-white font-bold md:hidden"
              >
                <Camera className="w-4 h-4 mr-2" />
                CAMERA
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center">or drag and drop your photo here</p>
            <p className="text-xs text-gray-400 text-center">JPEG, PNG, WebP - Max 10MB</p>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && !uploading && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
