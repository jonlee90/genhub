/**
 * PhotoLightbox Component
 * - Full-screen photo viewer
 * - EXIF metadata display (camera, GPS, timestamp, exposure)
 * - Navigation (prev/next) with keyboard support (Esc, Arrow keys)
 * - Delete action (only for direct uploads)
 * - View source button (for receipts)
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import X from 'lucide-react/icons/x';
import ChevronLeft from 'lucide-react/icons/chevron-left';
import ChevronRight from 'lucide-react/icons/chevron-right';
import Trash2 from 'lucide-react/icons/trash-2';
import ExternalLink from 'lucide-react/icons/external-link';
import Camera from 'lucide-react/icons/camera';
import MapPin from 'lucide-react/icons/map-pin';
import Calendar from 'lucide-react/icons/calendar';
import Aperture from 'lucide-react/icons/aperture';
import Loader2 from 'lucide-react/icons/loader-2';
import Star from 'lucide-react/icons/star';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deleteProjectPhoto } from '@/app/actions/project-photos';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface UnifiedPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename: string;
  category: string;
  source: 'upload' | 'task_receipt' | 'expense_receipt';
  source_id?: string;
  source_title?: string;
  uploaded_by: { id: string; name: string; avatar_url?: string };
  created_at: string;
  exif_data?: {
    timestamp?: string;
    camera?: { make?: string; model?: string };
    gps?: { latitude: number; longitude: number; altitude?: number };
    exposure?: { iso?: number; fNumber?: number; exposureTime?: string; focalLength?: number };
  };
  is_deletable: boolean;
  is_editable: boolean;
  client_visible?: boolean;
}

interface PhotoLightboxProps {
  photo: UnifiedPhoto;
  photos: UnifiedPhoto[];
  onClose: () => void;
  onNavigate: (photo: UnifiedPhoto) => void;
  onDelete: (photoId: string) => void;
  isPrimary?: boolean;
  onSetPrimary?: (photoUrl: string) => void;
  onRemovePrimary?: () => void;
}

export function PhotoLightbox({
  photo,
  photos,
  onClose,
  onNavigate,
  onDelete,
  isPrimary = false,
  onSetPrimary,
  onRemovePrimary,
}: PhotoLightboxProps) {
  console.log('[PhotoLightbox] Rendering photo:', photo.id, 'isPrimary:', isPrimary);

  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);
  const [isRemovingPrimary, setIsRemovingPrimary] = useState(false);

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleSetPrimary = useCallback(async () => {
    if (!onSetPrimary) return;
    setIsSettingPrimary(true);
    await onSetPrimary(photo.url);
    setIsSettingPrimary(false);
  }, [onSetPrimary, photo.url]);

  const handleRemovePrimary = useCallback(async () => {
    if (!onRemovePrimary) return;
    setIsRemovingPrimary(true);
    await onRemovePrimary();
    setIsRemovingPrimary(false);
  }, [onRemovePrimary]);

  // Performance optimization: Memoize computed values to prevent recalculation on every render
  const currentIndex = useMemo(
    () => photos.findIndex((p) => p.id === photo.id),
    [photos, photo.id]
  );
  const hasPrev = useMemo(() => currentIndex > 0, [currentIndex]);
  const hasNext = useMemo(
    () => currentIndex < photos.length - 1,
    [currentIndex, photos.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[PhotoLightbox] Key pressed:', e.key);

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
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate, photos]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDelete = async () => {
    if (!photo.is_deletable) {
      toast.error('Cannot delete from here. Edit the source task/expense to remove.');
      return;
    }

    if (!confirm('Delete this photo? This cannot be undone.')) {
      return;
    }

    console.log('[PhotoLightbox] Deleting photo:', photo.id);
    setIsDeleting(true);

    const result = await deleteProjectPhoto(photo.id);

    if (result.error) {
      toast.error(`Delete failed: ${result.error}`);
      setIsDeleting(false);
    } else {
      toast.success('Photo deleted');
      onDelete(photo.id);
    }
  };

  const handleViewSource = () => {
    if (!photo.source_id) return;

    console.log('[PhotoLightbox] Navigating to source:', photo.source, photo.source_id);

    if (photo.source === 'task_receipt') {
      router.push(`/app/tasks/${photo.source_id}`);
    } else if (photo.source === 'expense_receipt') {
      router.push(`/app/expenses?highlight=${photo.source_id}`);
    }
  };

  // Format EXIF timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return timestamp;
    }
  };

  return (
    <AnimatePresence>
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
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
          aria-label="Close lightbox"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
            aria-label="Previous photo"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
            aria-label="Next photo"
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        )}

        {/* Photo counter */}
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 rounded-full z-20">
          <span className="text-white text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Photo container */}
        <div
          className="max-w-7xl w-full px-4 md:px-16"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main image */}
          <div className="flex items-center justify-center mb-4">
            <motion.img
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={photo.url}
              alt={photo.filename}
              className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Metadata bar */}
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Current Cover Photo indicator */}
                {isPrimary && photo.source === 'upload' && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1.5 bg-[#001B51] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Current Cover Photo
                    </div>
                  </div>
                )}

                {/* Filename */}
                <h3 className="text-lg font-bold text-white mb-2 truncate">
                  {photo.filename}
                </h3>

                {/* EXIF data (if available) */}
                {photo.exif_data && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-white/80 text-sm mb-3">
                    {photo.exif_data.timestamp && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatTimestamp(photo.exif_data.timestamp)}
                        </span>
                      </div>
                    )}
                    {photo.exif_data.camera && (
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {photo.exif_data.camera.make} {photo.exif_data.camera.model}
                        </span>
                      </div>
                    )}
                    {photo.exif_data.gps && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {photo.exif_data.gps.latitude.toFixed(4)},{' '}
                          {photo.exif_data.gps.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {photo.exif_data.exposure && (
                      <div className="flex items-center gap-2">
                        <Aperture className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {photo.exif_data.exposure.fNumber &&
                            `f/${photo.exif_data.exposure.fNumber} `}
                          {photo.exif_data.exposure.iso && `ISO ${photo.exif_data.exposure.iso}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Receipt source metadata */}
                {(photo.source === 'task_receipt' || photo.source === 'expense_receipt') && (
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-bold',
                        photo.source === 'task_receipt'
                          ? 'bg-[#001B51] text-white'
                          : 'bg-[#059669] text-white'
                      )}
                    >
                      {photo.source === 'task_receipt' ? 'Task Receipt' : 'Expense Receipt'}
                    </span>
                    <span className="truncate">{photo.source_title}</span>
                  </div>
                )}

                {/* Uploader info */}
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <span>
                    Uploaded by {photo.uploaded_by.name} on{' '}
                    {format(new Date(photo.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {/* Set as Cover button (only for direct uploads that are not primary) */}
                {photo.source === 'upload' && !isPrimary && onSetPrimary && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSetPrimary}
                    disabled={isSettingPrimary}
                    className="bg-[#001B51] hover:bg-[#001B51]/90 text-white min-h-[44px]"
                  >
                    {isSettingPrimary ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Star className="h-4 w-4 mr-2" />
                    )}
                    Set as Cover
                  </Button>
                )}

                {/* Remove as Cover button (only when photo is primary) */}
                {photo.source === 'upload' && isPrimary && onRemovePrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePrimary}
                    disabled={isRemovingPrimary}
                    className="border-white/20 text-white hover:bg-white/10 min-h-[44px]"
                  >
                    {isRemovingPrimary ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Remove as Cover
                  </Button>
                )}

                {/* Delete button (only for direct uploads) */}
                {photo.is_deletable && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                )}

                {/* View source button (for receipts) */}
                {(photo.source === 'task_receipt' || photo.source === 'expense_receipt') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleViewSource}
                    className="bg-white/20 hover:bg-white/30 text-white min-h-[44px]"
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
    </AnimatePresence>
  );
}
