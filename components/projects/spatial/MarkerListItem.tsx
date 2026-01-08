'use client';

// P3.2 - Individual marker list item component
// Features: Type icon, metadata, content count, selection state

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  FileText,
  Image,
  File,
  AlertCircle,
  TrendingUp,
  Hammer,
  Package,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { SpatialMarker, SpatialMarkerType } from '@/types/spatial';
import { formatDistanceToNow } from 'date-fns';

// Debug: Component props
export interface MarkerListItemProps {
  marker: SpatialMarker;
  isSelected?: boolean;
  onClick?: (marker: SpatialMarker) => void;
  className?: string;
}

// Debug: Type icon mapping (matching database enum)
const TYPE_ICONS: Record<SpatialMarkerType, any> = {
  note: FileText,
  photo: Image,
  issue: AlertCircle,
  safety: AlertCircle,
  progress: TrendingUp,
  material: Package,
  inspection: FileText,
  rfi: FileText,
};

// Debug: Type colors (matching database enum)
const TYPE_COLORS: Record<SpatialMarkerType, string> = {
  note: 'bg-blue-500',
  photo: 'bg-green-500',
  issue: 'bg-red-500',
  safety: 'bg-orange-500',
  progress: 'bg-yellow-500',
  material: 'bg-cyan-500',
  inspection: 'bg-indigo-500',
  rfi: 'bg-pink-500',
};

// Debug: Status badge colors (matching database enum)
const STATUS_COLORS = {
  open: 'bg-green-500/10 text-green-700 border-green-200',
  in_progress: 'bg-blue-500/10 text-blue-700 border-blue-200',
  resolved: 'bg-gray-500/10 text-gray-700 border-gray-200',
  closed: 'bg-gray-400/10 text-gray-600 border-gray-300',
};

/**
 * MarkerListItem - Individual marker card in list
 * Features:
 * - Type icon with color coding
 * - Title, floor, timestamp
 * - Content count badge
 * - Selection highlighting
 * - Click to select
 */
export const MarkerListItem = memo(function MarkerListItem({
  marker,
  isSelected = false,
  onClick,
  className,
}: MarkerListItemProps) {
  console.log('[MarkerListItem] Rendering', { id: marker.id, isSelected });

  // Debug: Get type icon
  const Icon = TYPE_ICONS[marker.type] || MapPin;
  const typeColor = TYPE_COLORS[marker.type] || 'bg-gray-500';

  // Debug: Format timestamp
  const timeAgo = marker.created_at
    ? formatDistanceToNow(new Date(marker.created_at), { addSuffix: true })
    : '';

  // Debug: Handle click
  const handleClick = () => {
    console.log('[MarkerListItem] Clicked:', marker.id);
    onClick?.(marker);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className={cn(
        'group relative cursor-pointer rounded-lg border-2 bg-white p-3 transition-all hover:shadow-md',
        isSelected
          ? 'border-[#001B51] shadow-md'
          : 'border-gray-200 hover:border-[#001B51]/30',
        className
      )}
    >
      {/* Debug: Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#001B51] rounded-l-lg" />
      )}

      <div className="flex items-start gap-3">
        {/* Debug: Type icon */}
        <div
          className={cn(
            'shrink-0 rounded-lg p-2 text-white',
            typeColor
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Debug: Content */}
        <div className="flex-1 min-w-0">
          {/* Debug: Title */}
          <h4 className="font-bold text-sm text-[#001B51] truncate mb-1 uppercase tracking-tight">
            {marker.title}
          </h4>

          {/* Debug: Metadata row */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            {marker.floor_name && (
              <>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{marker.floor_name}</span>
                <span className="text-gray-300">•</span>
              </>
            )}
            <span className="truncate">{timeAgo}</span>
          </div>

          {/* Debug: Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Debug: Status badge */}
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] uppercase font-bold px-1.5 py-0.5',
                STATUS_COLORS[marker.status]
              )}
            >
              {marker.status}
            </Badge>

            {/* Debug: Content count badge */}
            {(marker.content_count ?? 0) > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] border-gray-200 bg-gray-50 text-gray-600"
              >
                <Paperclip className="w-3 h-3 mr-1" />
                {marker.content_count}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Debug: Hover indicator */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg border-2 border-[#001B51] opacity-0 pointer-events-none transition-opacity',
          'group-hover:opacity-20'
        )}
      />
    </motion.div>
  );
});
