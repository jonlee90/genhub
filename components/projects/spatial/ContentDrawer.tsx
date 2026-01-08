'use client';

// P3.3 - Content drawer for marker detail view
// Features: Tabs (Photos, Files, Notes, Activity), responsive, keyboard accessible

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit,
  Trash2,
  Image,
  File,
  MessageSquare,
  Activity,
  MapPin,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PhotoGallery } from './PhotoGallery';
import { FileList } from './FileList';
import { NotesList } from './NotesList';
import { ActivityTimeline } from './ActivityTimeline';
import type { SpatialMarker, MarkerContent } from '@/types/spatial';

// Debug: Component props
export interface ContentDrawerProps {
  marker: SpatialMarker | null;
  content?: MarkerContent[];
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (marker: SpatialMarker) => void;
  onDelete?: (marker: SpatialMarker) => void;
  className?: string;
}

// Debug: Type icons (must match spatial_marker_type enum)
const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  photo: Image,
  document: File,
  issue: Edit,
  progress: Activity,
  task: Edit,
  material: File,
  safety: Edit,
  inspection: Edit,
  rfi: MessageSquare,
};

// Debug: Type colors (must match spatial_marker_type enum)
const TYPE_COLORS: Record<string, string> = {
  note: 'bg-blue-500',
  photo: 'bg-green-500',
  document: 'bg-purple-500',
  issue: 'bg-red-500',
  progress: 'bg-yellow-500',
  task: 'bg-orange-500',
  material: 'bg-cyan-500',
  safety: 'bg-orange-600',
  inspection: 'bg-indigo-500',
  rfi: 'bg-pink-500',
};

// Debug: Status colors
const STATUS_COLORS = {
  active: 'bg-green-500/10 text-green-700 border-green-200',
  resolved: 'bg-gray-500/10 text-gray-700 border-gray-200',
  archived: 'bg-gray-400/10 text-gray-600 border-gray-300',
};

/**
 * ContentDrawer - Marker detail drawer with tabs
 * Features:
 * - Slides from right (desktop) or bottom (mobile)
 * - Tabs: Photos, Files, Notes, Activity
 * - Edit/delete actions
 * - Keyboard accessible (ESC to close)
 */
export function ContentDrawer({
  marker,
  content = [],
  isOpen,
  onClose,
  onEdit,
  onDelete,
  className,
}: ContentDrawerProps) {
  console.log('[ContentDrawer] Rendering', { isOpen, marker: marker?.id });

  // Debug: Active tab state
  const [activeTab, setActiveTab] = useState('photos');

  // Debug: Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('[ContentDrawer] ESC key pressed, closing');
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Debug: Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!marker) return null;

  // Debug: Get type icon and color
  const TypeIcon = TYPE_ICONS[marker.type];
  const typeColor = TYPE_COLORS[marker.type];

  // Debug: Separate content by type
  const photos = content.filter((c) => c.type === 'photo');
  const files = content.filter((c) => c.type === 'file');
  const notes = content.filter((c) => c.type === 'note');
  const activities = content.filter((c) => c.type === 'activity');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Debug: Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Debug: Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col',
              'md:border-l-2 md:border-[#001B51]',
              className
            )}
          >
            {/* Debug: Header */}
            <div className="shrink-0 border-b-2 border-[#001B51] bg-gradient-to-r from-[#001B51] to-[#3C3C3C] px-6 py-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Debug: Type icon */}
                  <div className={cn('shrink-0 p-2 rounded-lg text-white', typeColor)}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Debug: Title and meta */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight truncate">
                      {marker.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs uppercase font-bold border-white/30 text-white'
                        )}
                      >
                        {marker.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs uppercase font-bold bg-white/10 text-white border-white/30"
                      >
                        {marker.status}
                      </Badge>
                      {marker.floor_name && (
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <MapPin className="w-3 h-3" />
                          <span>{marker.floor_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Debug: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {(onEdit || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(marker)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Marker
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(marker)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Marker
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Debug: Description */}
              {marker.description && (
                <p className="text-sm text-white/80 leading-relaxed">
                  {marker.description}
                </p>
              )}
            </div>

            {/* Debug: Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="shrink-0 justify-start border-b border-gray-200 rounded-none bg-transparent px-6 pt-4">
                <TabsTrigger value="photos" className="gap-2">
                  <Image className="w-4 h-4" />
                  Photos
                  {photos.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-bold">
                      {photos.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <File className="w-4 h-4" />
                  Files
                  {files.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-bold">
                      {files.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notes
                  {notes.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-bold">
                      {notes.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Activity
                  {activities.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-bold">
                      {activities.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Debug: Tab content */}
              <div className="flex-1 overflow-auto">
                <TabsContent value="photos" className="m-0 p-6">
                  <PhotoGallery markerId={marker.id} photos={photos} />
                </TabsContent>

                <TabsContent value="files" className="m-0 p-6">
                  <FileList markerId={marker.id} files={files} />
                </TabsContent>

                <TabsContent value="notes" className="m-0 p-6">
                  <NotesList markerId={marker.id} notes={notes} />
                </TabsContent>

                <TabsContent value="activity" className="m-0 p-6">
                  <ActivityTimeline markerId={marker.id} activities={activities} />
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
