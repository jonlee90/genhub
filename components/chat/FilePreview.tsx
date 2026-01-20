"use client";

/**
 * FilePreview - Display message attachments
 *
 * Features:
 * - Images: Thumbnail grid with lightbox on click
 * - Documents: File icon, name, size
 * - Download: Click to download with original filename
 * - Grid layout: Show max 4 thumbnails, "+N more" badge for rest
 * - Delete button for own attachments (trash icon)
 * - Construction-themed design
 */

import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Download,
  Trash2,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { deleteAttachment } from "@/app/actions/chat";
import { toast } from "sonner";
import Image from "next/image";

export interface MessageAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  thumbnail_url: string | null;
  created_at: string;
}

interface FilePreviewProps {
  attachments: MessageAttachment[];
  canDelete?: boolean;
  onDelete?: () => void;
}

// Debug: File preview component
export function FilePreview({
  attachments,
  canDelete = false,
  onDelete,
}: FilePreviewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  console.log("[FilePreview] Rendering", attachments.length, "attachments");

  if (attachments.length === 0) {
    return null;
  }

  // Debug: Separate images from documents
  const images = attachments.filter((a) => a.file_type.startsWith("image/"));
  const documents = attachments.filter(
    (a) => !a.file_type.startsWith("image/"),
  );

  // Debug: Handle attachment download
  const handleDownload = (attachment: MessageAttachment) => {
    console.log("[FilePreview] Downloading attachment:", attachment.file_name);
    window.open(attachment.file_url, "_blank");
  };

  // Debug: Handle attachment deletion
  const handleDelete = async (attachmentId: string) => {
    console.log("[FilePreview] Deleting attachment:", attachmentId);
    setDeletingId(attachmentId);

    const result = await deleteAttachment(attachmentId);

    if (result.success) {
      console.log("[FilePreview] Attachment deleted successfully");
      toast.success("File deleted");
      onDelete?.();
    } else {
      console.error("[FilePreview] Failed to delete attachment:", result.error);
      toast.error(result.error || "Failed to delete file");
    }

    setDeletingId(null);
  };

  // Debug: Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  // Debug: Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (fileType.includes("zip")) return "📦";
    return "📎";
  };

  // Debug: Lightbox navigation
  const handlePrevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Debug: Image grid */}
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-2",
            images.length === 1 && "grid-cols-1",
            images.length === 2 && "grid-cols-2",
            images.length === 3 && "grid-cols-3",
            images.length >= 4 && "grid-cols-2",
          )}
        >
          {images.slice(0, 4).map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100"
            >
              {/* Debug: Image thumbnail */}
              <Image
                src={image.file_url}
                alt={image.file_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />

              {/* Debug: Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-xs font-mono text-white truncate">
                    {image.file_name}
                  </p>
                </div>

                {/* Debug: Action buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => setLightboxIndex(index)}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-colors"
                    title="View full size"
                  >
                    <ZoomIn className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDownload(image)}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4 text-gray-700" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={deletingId === image.id}
                      className="p-1.5 bg-red-500/90 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === image.id ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-white" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Debug: "+N more" badge for 5th+ image */}
              {index === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">
                    +{images.length - 4}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Debug: Document list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-3 p-3",
                "bg-gray-50 hover:bg-gray-100",
                "border-2 border-gray-200 rounded-lg",
                "transition-all duration-200",
                "group",
              )}
            >
              {/* Debug: File icon */}
              <div className="shrink-0 text-2xl">
                {getFileIcon(doc.file_type)}
              </div>

              {/* Debug: File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {doc.file_name}
                </p>
                <p className="text-xs font-mono text-gray-500">
                  {formatFileSize(doc.file_size)}
                </p>
              </div>

              {/* Debug: Actions */}
              <div className="shrink-0 flex items-center gap-1">
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 hover:bg-construction-blue/10 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4 text-gray-600 group-hover:text-construction-blue" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === doc.id ? (
                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Debug: Lightbox for images */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Debug: Close button */}
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Debug: Navigation */}
            {images.length > 1 && (
              <>
                {lightboxIndex > 0 && (
                  <button
                    className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                )}
                {lightboxIndex < images.length - 1 && (
                  <button
                    className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                )}
              </>
            )}

            {/* Debug: Image container */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightboxIndex].file_url}
                alt={images[lightboxIndex].file_name}
                width={1920}
                height={1080}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />

              {/* Debug: Image info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                <p className="text-sm font-mono text-white">
                  {images[lightboxIndex].file_name}
                </p>
                <p className="text-xs font-mono text-gray-300">
                  {formatFileSize(images[lightboxIndex].file_size)} • Image{" "}
                  {lightboxIndex + 1} of {images.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
