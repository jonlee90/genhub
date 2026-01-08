# Task 0004: Photo Components (Gallery, Uploader, Lightbox)

## Status
- **Phase**: 4 - Frontend Photos
- **Agent**: agent-frontend-engineer
- **Estimated Effort**: 4-5 hours
- **Dependencies**: Task 0003 (Core Components)
- **Approved**: DRAFT

---

## Overview

Build photo-specific UI components: gallery section, photo uploader with camera support, lightbox with EXIF display, and receipt badges for task/expense integration.

---

## Objectives

1. Create `PhotoGallerySection` with responsive grid and selection
2. Create `ProjectPhotoUploader` adapted from spatial PhotoUploader
3. Create `PhotoLightbox` with EXIF metadata display
4. Create `ReceiptPhotoBadge` for receipt source identification
5. Implement lazy loading for photo thumbnails
6. Add mobile camera capture support

---

## Requirements Reference

- **REQ-1**: Photo Upload & Capture
- **REQ-2**: Photo Gallery & Organization
- **REQ-3**: Photo Categorization & Tagging
- **REQ-10**: Mobile-Optimized Upload & Gallery
- **REQ-14**: Receipt Image Aggregation from Tasks & Expenses

---

## Files to Create

### Component 1: PhotoGallerySection
- **Path**: `components/projects/files/PhotoGallerySection.tsx`
- **Type**: Client Component
- **Purpose**: Grid gallery with selection, empty state, upload CTA

### Component 2: ProjectPhotoUploader
- **Path**: `components/projects/files/ProjectPhotoUploader.tsx`
- **Type**: Client Component
- **Purpose**: Photo upload with camera capture, category selection

### Component 3: PhotoLightbox
- **Path**: `components/projects/files/PhotoLightbox.tsx`
- **Type**: Client Component
- **Purpose**: Full-screen photo viewer with EXIF metadata

### Component 4: ReceiptPhotoBadge
- **Path**: `components/projects/files/ReceiptPhotoBadge.tsx`
- **Type**: Client Component
- **Purpose**: Badge showing receipt source (task/expense)

---

## Implementation Details

### Existing Pattern Reference

**Reuse from**: `components/projects/spatial/PhotoUploader.tsx`
- File validation logic (validatePhoto function)
- Progress bar UI with percentage
- Camera capture button (mobile only)
- Drag-and-drop zone styling

**Reuse from**: `components/projects/spatial/PhotoGallery.tsx`
- Grid layout (2 cols mobile, 3 cols desktop)
- Thumbnail hover overlay
- Lightbox modal pattern
- EXIF metadata display

### Component 1: PhotoGallerySection.tsx

```tsx
/**
 * PhotoGallerySection Component
 * - Responsive photo grid (2 cols mobile, 3 cols desktop)
 * - Checkbox selection for bulk actions
 * - Lazy loading for thumbnails
 * - Empty state with upload CTA
 * - Receipt badge overlay for task/expense photos
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Upload, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectPhotoUploader } from './ProjectPhotoUploader';
import { PhotoLightbox } from './PhotoLightbox';
import { ReceiptPhotoBadge } from './ReceiptPhotoBadge';
import { BaseModal } from '@/components/ui/modal';

interface PhotoGallerySectionProps {
  photos: any[];
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
  onRefresh: () => void;
  projectId: string;
}

export function PhotoGallerySection({
  photos,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  onRefresh,
  projectId,
}: PhotoGallerySectionProps) {
  console.log('[PhotoGallerySection] Rendering with photos:', photos.length);

  const [showUploader, setShowUploader] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="p-4 bg-construction-blue/10 rounded-full mb-4">
          <Image className="h-12 w-12 text-construction-blue" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Photos Yet</h3>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
          Start documenting site progress, safety conditions, and inspections by uploading your
          first photo.
        </p>
        <Button onClick={() => setShowUploader(true)} className="bg-construction-blue">
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>

        {/* Uploader modal */}
        <BaseModal
          isOpen={showUploader}
          onClose={() => setShowUploader(false)}
          title="Upload Photo"
        >
          <ProjectPhotoUploader
            projectId={projectId}
            onComplete={() => {
              setShowUploader(false);
              onRefresh();
            }}
            onCancel={() => setShowUploader(false)}
          />
        </BaseModal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with select all and upload */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedIds.size === photos.length}
            onCheckedChange={onSelectAll}
            id="select-all-photos"
          />
          <label
            htmlFor="select-all-photos"
            className="text-sm text-gray-600 cursor-pointer"
          >
            Showing {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </label>
        </div>

        <Button onClick={() => setShowUploader(true)} className="bg-construction-blue">
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'relative group rounded-lg overflow-hidden border-2 aspect-square bg-gray-100',
              selectedIds.has(photo.id)
                ? 'border-construction-blue ring-2 ring-construction-blue/30'
                : 'border-gray-200'
            )}
          >
            {/* Thumbnail image */}
            <img
              src={photo.thumbnail_url || photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxPhoto(photo)}
              loading="lazy"
            />

            {/* Selection checkbox overlay */}
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedIds.has(photo.id)}
                onCheckedChange={() => onSelectToggle(photo.id)}
                className="bg-white shadow-md"
              />
            </div>

            {/* Receipt badge overlay */}
            {(photo.source === 'task_receipt' || photo.source === 'expense_receipt') && (
              <div className="absolute top-2 right-2 z-10">
                <ReceiptPhotoBadge
                  source={photo.source}
                  sourceTitle={photo.source_title}
                  sourceId={photo.source_id}
                />
              </div>
            )}

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setLightboxPhoto(photo)}
                className="mr-2"
              >
                View
              </Button>
              {photo.source === 'upload' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    // Delete handler (to be implemented)
                    console.log('Delete photo:', photo.id);
                  }}
                >
                  Delete
                </Button>
              )}
              {(photo.source === 'task_receipt' || photo.source === 'expense_receipt') && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    // Navigate to source (to be implemented)
                    console.log('View source:', photo.source_id);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Uploader modal */}
      <BaseModal
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        title="Upload Photo"
      >
        <ProjectPhotoUploader
          projectId={projectId}
          onComplete={() => {
            setShowUploader(false);
            onRefresh();
          }}
          onCancel={() => setShowUploader(false)}
        />
      </BaseModal>

      {/* Lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          photos={photos}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={(newPhoto) => setLightboxPhoto(newPhoto)}
          onDelete={(photoId) => {
            // Delete and close lightbox
            setLightboxPhoto(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
```

### Component 2: ProjectPhotoUploader.tsx

```tsx
/**
 * ProjectPhotoUploader Component
 * - Adapted from spatial/PhotoUploader
 * - Camera capture on mobile (capture="environment")
 * - Category selection dropdown
 * - Client-visible checkbox
 * - Upload to /api/project-photos/upload
 */

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CategorySelector } from './CategorySelector';
import { validatePhoto } from '@/lib/image-processing';
import { toast } from 'sonner';

interface ProjectPhotoUploaderProps {
  projectId: string;
  onComplete: (photoUrl: string) => void;
  onCancel?: () => void;
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
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
  };

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

      // Simulate progress
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

      // Reset state
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

      {/* Category selector */}
      {!preview && (
        <CategorySelector type="photo" value={category} onChange={setCategory} />
      )}

      {/* Client visible checkbox */}
      {!preview && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="client-visible"
            checked={clientVisible}
            onCheckedChange={(checked) => setClientVisible(checked as boolean)}
          />
          <label htmlFor="client-visible" className="text-sm text-gray-700 cursor-pointer">
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
            <img src={preview} alt="Preview" className="w-full h-auto" />

            {/* Progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <div className="w-3/4 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-construction-blue"
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
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-8',
            'hover:border-construction-blue hover:bg-gray-50 transition-colors',
            'cursor-pointer'
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
              {/* File picker button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-construction-blue text-white font-bold',
                  'hover:bg-[#002B71] transition-colors'
                )}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">CHOOSE FILE</span>
              </button>

              {/* Camera button (mobile only) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-construction-accent text-white font-bold',
                  'hover:bg-[#4C4C4C] transition-colors',
                  'md:hidden' // Only show on mobile
                )}
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">CAMERA</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              or drag and drop your photo here
            </p>
            <p className="text-xs text-gray-400 text-center">JPEG, PNG, WebP • Max 10MB</p>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && !uploading && (
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'w-full px-4 py-2 rounded-lg',
            'border border-gray-300 text-gray-700 font-medium',
            'hover:bg-gray-50 transition-colors'
          )}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
```

### Component 3: PhotoLightbox.tsx

```tsx
/**
 * PhotoLightbox Component
 * - Full-screen photo viewer
 * - EXIF metadata display (camera, GPS, timestamp, exposure)
 * - Navigation (prev/next) with keyboard support
 * - Delete action (only for direct uploads)
 * - View source button (for receipts)
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  Camera,
  MapPin,
  Calendar,
  Aperture,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deleteProjectPhoto } from '@/app/actions/project-photos';
import { toast } from 'sonner';

interface PhotoLightboxProps {
  photo: any;
  photos: any[];
  onClose: () => void;
  onNavigate: (photo: any) => void;
  onDelete: (photoId: string) => void;
}

export function PhotoLightbox({ photo, photos, onClose, onNavigate, onDelete }: PhotoLightboxProps) {
  console.log('[PhotoLightbox] Rendering photo:', photo.id);

  const currentIndex = photos.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate(photos[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate(photos[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasPrev, hasNext]);

  const handleDelete = async () => {
    if (!photo.is_deletable) {
      toast.error('Cannot delete from here. Edit the source task/expense to remove.');
      return;
    }

    if (!confirm('Delete this photo? This cannot be undone.')) {
      return;
    }

    console.log('[PhotoLightbox] Deleting photo:', photo.id);
    const result = await deleteProjectPhoto(photo.id);

    if (result.error) {
      toast.error(`Delete failed: ${result.error}`);
    } else {
      toast.success('Photo deleted');
      onDelete(photo.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Navigation buttons */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(photos[currentIndex - 1]);
          }}
          className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(photos[currentIndex + 1]);
          }}
          className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Photo */}
      <div className="max-w-7xl max-h-[80vh] px-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.url}
          alt={photo.filename}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />

        {/* Metadata bar */}
        <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">{photo.filename}</h3>

              {/* EXIF data */}
              {photo.exif_data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white/80 text-sm">
                  {photo.exif_data.timestamp && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(photo.exif_data.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                  {photo.exif_data.camera && (
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span>
                        {photo.exif_data.camera.make} {photo.exif_data.camera.model}
                      </span>
                    </div>
                  )}
                  {photo.exif_data.gps && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {photo.exif_data.gps.latitude.toFixed(4)},{' '}
                        {photo.exif_data.gps.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {photo.exif_data.exposure && (
                    <div className="flex items-center gap-2">
                      <Aperture className="h-4 w-4" />
                      <span>
                        f/{photo.exif_data.exposure.fNumber} ISO{photo.exif_data.exposure.iso}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Receipt source metadata */}
              {(photo.source === 'task_receipt' || photo.source === 'expense_receipt') && (
                <div className="mt-2 flex items-center gap-2 text-white/80 text-sm">
                  <span className="font-medium">
                    {photo.source === 'task_receipt' ? 'Task Receipt:' : 'Expense Receipt:'}
                  </span>
                  <span>{photo.source_title}</span>
                </div>
              )}

              {/* Uploader info */}
              <div className="mt-2 flex items-center gap-2 text-white/60 text-xs">
                <span>
                  Uploaded by {photo.uploaded_by.name} on{' '}
                  {new Date(photo.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {photo.is_deletable && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {(photo.source === 'task_receipt' || photo.source === 'expense_receipt') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Navigate to source (to be implemented)
                    console.log('View source:', photo.source_id);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Source
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

### Component 4: ReceiptPhotoBadge.tsx

```tsx
/**
 * ReceiptPhotoBadge Component
 * - Small badge overlay for receipt photos
 * - Shows "Task" or "Expense" with tooltip
 */

'use client';

import { FileText, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReceiptPhotoBadgeProps {
  source: 'task_receipt' | 'expense_receipt';
  sourceTitle?: string;
  sourceId?: string;
}

export function ReceiptPhotoBadge({ source, sourceTitle, sourceId }: ReceiptPhotoBadgeProps) {
  const isTask = source === 'task_receipt';

  return (
    <div
      className={cn(
        'px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-md',
        isTask
          ? 'bg-blue-500 text-white'
          : 'bg-green-500 text-white'
      )}
      title={sourceTitle || (isTask ? 'Task Receipt' : 'Expense Receipt')}
    >
      {isTask ? <FileText className="h-3 w-3" /> : <Receipt className="h-3 w-3" />}
      <span>{isTask ? 'Task' : 'Expense'}</span>
    </div>
  );
}
```

---

## Acceptance Criteria

- [x] PhotoGallerySection displays responsive grid (2 cols mobile, 3 cols desktop)
- [x] Empty state shows upload CTA
- [x] Checkbox selection works for bulk actions
- [x] Receipt photos show badge overlay (task/expense)
- [x] ProjectPhotoUploader has camera capture button (mobile only)
- [x] Category selector works for photo categories
- [x] Client-visible checkbox controls portal visibility
- [x] PhotoLightbox displays full-resolution image
- [x] EXIF metadata shown in lightbox (if available)
- [x] Keyboard navigation works (Esc, Arrow keys)
- [x] Delete button only visible for direct uploads (not receipts)
- [x] Receipt photos have "View Source" button in lightbox
- [x] Lazy loading applied to thumbnail images

---

## Testing Checklist

```tsx
// Test empty state
<PhotoGallerySection photos={[]} ... />
// Verify upload CTA displayed

// Test photo grid
<PhotoGallerySection photos={mockPhotos} ... />
// Verify 2 columns on mobile, 3 on desktop

// Test receipt badge
// Upload photo, verify badge shown for task/expense receipts

// Test camera capture (mobile only)
// Click camera button → verify device camera opens (rear camera)

// Test lightbox EXIF display
// Upload photo with EXIF → click to open lightbox → verify metadata shown

// Test keyboard navigation
// Open lightbox → press Esc (closes) → press Arrow keys (navigates)

// Test delete protection
// Try to delete receipt photo → verify error message shown
```

---

## Notes

- **Lazy Loading**: Use `loading="lazy"` on thumbnail images (REQ-11)
- **Mobile Camera**: `capture="environment"` opens rear camera on mobile (REQ-1)
- **EXIF Data**: Display in lightbox metadata bar (REQ-2)
- **Receipt Integration**: Badges and read-only behavior (REQ-14)
- **Responsive Grid**: CSS Grid with `grid-cols-2 md:grid-cols-3` (REQ-10)
- **Thumbnail Priority**: Show thumbnail in grid, full-size in lightbox (NFR-1)

---

## References

- **Existing Pattern**: `components/projects/spatial/PhotoUploader.tsx`
- **Existing Pattern**: `components/projects/spatial/PhotoGallery.tsx`
- **Design Document**: `.claude/docs/design/project-files-upload.md`
- **UI Rules**: `.claude/docs/law/UI_RULES.md`

---

**END OF TASK 0004**
