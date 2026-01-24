/**
 * PhotoGallerySection Component
 * - Responsive photo grid (2 cols mobile, 3 cols desktop)
 * - Checkbox selection for bulk actions
 * - Lazy loading for thumbnails
 * - Empty state with upload CTA
 * - Receipt badge overlay for task/expense photos
 * - Cover photo badge and star button for setting primary photo
 */

"use client";

import { useState, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import ImageIcon from "lucide-react/icons/image";
import Upload from "lucide-react/icons/upload";
import Eye from "lucide-react/icons/eye";
import Trash2 from "lucide-react/icons/trash-2";
import Star from "lucide-react/icons/star";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { ProjectPhotoUploader } from "./ProjectPhotoUploader";
import { PhotoLightbox } from "./PhotoLightbox";
import { ReceiptPhotoBadge } from "./ReceiptPhotoBadge";
import { setProjectPrimaryPhoto } from "@/app/actions/project-photos";
import { toast } from "sonner";

interface UnifiedPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename: string;
  category: string;
  source: "upload" | "task_receipt" | "expense_receipt";
  source_id?: string;
  source_title?: string;
  uploaded_by: { id: string; name: string; avatar_url?: string };
  created_at: string;
  exif_data?: any;
  is_deletable: boolean;
  is_editable: boolean;
  client_visible?: boolean;
}

interface PhotoGallerySectionProps {
  photos: UnifiedPhoto[];
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
  onRefresh: () => void;
  projectId: string;
  currentImageUrl?: string | null;
  onSetPrimary?: (url: string | null) => void;
}

export function PhotoGallerySection({
  photos,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  onRefresh,
  projectId,
  currentImageUrl,
  onSetPrimary,
}: PhotoGallerySectionProps) {
  console.log(
    "[PhotoGallerySection] Rendering with photos:",
    photos.length,
    "currentImageUrl:",
    currentImageUrl,
  );

  const [showUploader, setShowUploader] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<UnifiedPhoto | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  // Performance optimization: Memoize helper function to prevent recreation on every render
  const isPrimaryPhoto = useCallback(
    (photo: UnifiedPhoto) => {
      return currentImageUrl === photo.url;
    },
    [currentImageUrl],
  );

  // Performance optimization: Memoize async handler to prevent recreation on every render
  const handleSetPrimary = useCallback(
    async (photoUrl: string) => {
      if (!onSetPrimary) return;

      // Find the photo to get its ID for loading state
      const photo = photos.find((p) => p.url === photoUrl);
      if (photo) setSettingPrimaryId(photo.id);

      const result = await setProjectPrimaryPhoto({ projectId, photoUrl });

      setSettingPrimaryId(null);

      if (!result.success) {
        toast.error(`Failed to set cover photo: ${result.error}`);
      } else {
        toast.success("Cover photo updated");
        onSetPrimary(photoUrl);
        onRefresh();
      }
    },
    [onSetPrimary, photos, projectId, onRefresh],
  );

  // Performance optimization: Memoize async handler to prevent recreation on every render
  const handleRemovePrimary = useCallback(async () => {
    if (!onSetPrimary) return;

    setSettingPrimaryId("removing");

    const result = await setProjectPrimaryPhoto({ projectId, photoUrl: null });

    setSettingPrimaryId(null);

    if (!result.success) {
      toast.error(`Failed to remove cover photo: ${result.error}`);
    } else {
      toast.success("Cover photo removed");
      onSetPrimary(null);
      onRefresh();
    }
  }, [onSetPrimary, projectId, onRefresh]);

  // Performance optimization: Memoize event handler to prevent recreation on every render
  const handlePhotoDelete = useCallback(
    (photoId: string) => {
      console.log("[PhotoGallerySection] Photo deleted:", photoId);
      setLightboxPhoto(null);
      onRefresh();
    },
    [onRefresh],
  );

  // Performance optimization: Memoize event handler to prevent recreation on every render
  const handleUploadComplete = useCallback(
    (photoUrl: string) => {
      console.log("[PhotoGallerySection] Upload complete:", photoUrl);
      setShowUploader(false);
      onRefresh();
    },
    [onRefresh],
  );

  // Check if all photos are selected
  const allSelected = photos.length > 0 && selectedIds.size === photos.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < photos.length;

  // Empty state
  if (photos.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="p-4 bg-construction-blue/10 rounded-full mb-4">
            <ImageIcon className="h-12 w-12 text-construction-blue" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No Photos Yet
          </h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            Start documenting site progress, safety conditions, and inspections
            by uploading your first photo.
          </p>
          <Button
            onClick={() => setShowUploader(true)}
            className="bg-construction-blue text-white hover:bg-construction-blue/90"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </Button>
        </div>

        {/* Uploader modal */}
        <ResponsiveModal
          isOpen={showUploader}
          onClose={() => setShowUploader(false)}
          title="Upload Photo"
          icon={Upload}
        >
          <ProjectPhotoUploader
            projectId={projectId}
            onComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
          />
        </ResponsiveModal>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with select all and upload */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
            onCheckedChange={() => onSelectAll()}
            id="select-all-photos"
          />
          <label
            htmlFor="select-all-photos"
            className="text-sm text-gray-600 cursor-pointer"
          >
            {selectedIds.size > 0
              ? `${selectedIds.size} of ${photos.length} selected`
              : `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
          </label>
        </div>

        <Button
          onClick={() => setShowUploader(true)}
          className="bg-construction-blue text-white hover:bg-construction-blue/90"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>
      </div>

      {/* Photo grid - 2 cols mobile, 3 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative group rounded-lg overflow-hidden border-2 aspect-square bg-gray-100",
                selectedIds.has(photo.id)
                  ? "border-construction-blue ring-2 ring-[var(--construction-blue)]/30"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              {/* Thumbnail image with lazy loading */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnail_url || photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setLightboxPhoto(photo)}
                loading="lazy"
              />

              {/* Selection checkbox overlay (top-left) */}
              <div
                className="absolute top-2 left-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedIds.has(photo.id)}
                  onCheckedChange={() => onSelectToggle(photo.id)}
                  className="bg-white shadow-md border-gray-300 data-[state=checked]:bg-construction-blue"
                />
              </div>

              {/* Receipt badge overlay (top-right) */}
              {(photo.source === "task_receipt" ||
                photo.source === "expense_receipt") && (
                <div className="absolute top-2 right-2 z-10">
                  <ReceiptPhotoBadge
                    source={photo.source}
                    sourceTitle={photo.source_title}
                    sourceId={photo.source_id}
                  />
                </div>
              )}

              {/* Cover photo badge (top-right, for uploads only - below receipt badge position) */}
              {photo.source === "upload" && isPrimaryPhoto(photo) && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="px-2 py-1 bg-construction-blue text-white rounded text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </div>
                </div>
              )}

              {/* Hover overlay with actions */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  "flex flex-col justify-end p-3",
                )}
              >
                {/* Photo info */}
                <p className="text-white text-xs font-medium truncate mb-2">
                  {photo.filename}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLightboxPhoto(photo)}
                    className="flex items-center justify-center w-8 h-8 min-w-[44px] min-h-[44px] bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    aria-label="View photo"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>

                  {/* Star button for setting as cover (only for direct uploads) */}
                  {photo.source === "upload" && onSetPrimary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPrimaryPhoto(photo)) {
                          handleRemovePrimary();
                        } else {
                          handleSetPrimary(photo.url);
                        }
                      }}
                      disabled={
                        settingPrimaryId === photo.id ||
                        settingPrimaryId === "removing"
                      }
                      className={cn(
                        "flex items-center justify-center w-8 h-8 min-w-[44px] min-h-[44px] rounded-full transition-colors",
                        isPrimaryPhoto(photo)
                          ? "bg-construction-blue text-white"
                          : "bg-white/20 hover:bg-white/30 text-white",
                      )}
                      aria-label={
                        isPrimaryPhoto(photo)
                          ? "Remove as cover photo"
                          : "Set as cover photo"
                      }
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          isPrimaryPhoto(photo) ? "fill-current" : "",
                        )}
                      />
                    </button>
                  )}

                  {/* Only show delete for direct uploads */}
                  {photo.is_deletable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete will be handled via lightbox for now
                        setLightboxPhoto(photo);
                      }}
                      className="flex items-center justify-center w-8 h-8 min-w-[44px] min-h-[44px] bg-red-500/80 hover:bg-red-600 rounded-full transition-colors"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Client visible indicator */}
              {photo.client_visible && (
                <div className="absolute bottom-2 left-2 z-10">
                  <div className="px-1.5 py-0.5 bg-white/90 rounded text-[10px] font-medium text-gray-700">
                    Client
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Uploader modal */}
      <ResponsiveModal
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        title="Upload Photo"
        icon={Upload}
      >
        <ProjectPhotoUploader
          projectId={projectId}
          onComplete={handleUploadComplete}
          onCancel={() => setShowUploader(false)}
        />
      </ResponsiveModal>

      {/* Lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          photos={photos}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={(newPhoto) => setLightboxPhoto(newPhoto)}
          onDelete={handlePhotoDelete}
          isPrimary={isPrimaryPhoto(lightboxPhoto)}
          onSetPrimary={onSetPrimary ? handleSetPrimary : undefined}
          onRemovePrimary={onSetPrimary ? handleRemovePrimary : undefined}
        />
      )}
    </div>
  );
}
