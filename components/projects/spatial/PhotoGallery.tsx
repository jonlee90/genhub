/**
 * PhotoGallery Component - P3.5
 * - Grid gallery with thumbnails
 * - Upload button + PhotoUploader modal
 * - Lightbox for viewing photos
 * - Delete photo functionality
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Upload, X, Trash2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhotoUploader } from './PhotoUploader'
import { useMarkerMutations } from '@/hooks/use-marker-mutations'
import type { MarkerContent } from '@/types/spatial'

export interface PhotoGalleryProps {
  markerId: string
  photos: MarkerContent[]
}

/**
 * PhotoGallery - Grid gallery for marker photos
 */
export function PhotoGallery({ markerId, photos }: PhotoGalleryProps) {
  console.log('[PhotoGallery] Rendering', { markerId, photoCount: photos.length })

  const [showUploader, setShowUploader] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<MarkerContent | null>(null)
  const { deleteContent } = useMarkerMutations()

  const handleUploadComplete = (photoUrl: string) => {
    console.log('[PhotoGallery] Upload complete:', photoUrl)
    setShowUploader(false)
    // The mutation hook will handle revalidation
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return
    console.log('[PhotoGallery] Deleting photo:', photoId)
    await deleteContent(photoId)
  }

  if (photos.length === 0 && !showUploader) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Image className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="font-bold text-[#001B51] mb-2 uppercase tracking-tight">
          No Photos Yet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload photos to document this marker location.
        </p>
        <button
          onClick={() => setShowUploader(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[#001B51] text-white font-bold',
            'hover:bg-[#002B71] transition-colors'
          )}
        >
          <Upload className="w-4 h-4" />
          UPLOAD PHOTO
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      {!showUploader && (
        <button
          onClick={() => setShowUploader(true)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
            'bg-[#001B51] text-white font-bold',
            'hover:bg-[#002B71] transition-colors'
          )}
        >
          <Upload className="w-4 h-4" />
          ADD PHOTOS
        </button>
      )}

      {/* Photo uploader */}
      {showUploader && (
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <PhotoUploader
            markerId={markerId}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#001B51] transition-colors cursor-pointer"
              onClick={() => setLightboxPhoto(photo)}
            >
              {/* Thumbnail */}
              <img
                src={photo.photo_thumbnail_url || photo.photo_url || photo.file_url || ''}
                alt={photo.file_name || 'Photo'}
                className="w-full h-full object-cover"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <Maximize2 className="w-4 h-4 text-white" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(photo.id)
                    }}
                    className="p-1 rounded bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-0 right-0 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Photo */}
              <div className="flex-1 flex items-center justify-center mb-4">
                <img
                  src={lightboxPhoto.photo_url || lightboxPhoto.file_url || ''}
                  alt={lightboxPhoto.file_name || 'Photo'}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>

              {/* Photo metadata */}
              <div className="bg-[#001B51] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-tight">
                    {lightboxPhoto.file_name || 'Untitled Photo'}
                  </h3>
                  <button
                    onClick={() => handleDelete(lightboxPhoto.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1 rounded-lg',
                      'bg-red-600 text-white text-sm font-bold',
                      'hover:bg-red-700 transition-colors'
                    )}
                  >
                    <Trash2 className="w-3 h-3" />
                    DELETE
                  </button>
                </div>

                {/* Photo dimensions */}
                {(lightboxPhoto.photo_width || lightboxPhoto.photo_height) && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>
                      {lightboxPhoto.photo_width}×{lightboxPhoto.photo_height}px
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
