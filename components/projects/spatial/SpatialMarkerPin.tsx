/**
 * SpatialMarkerPin - P2.4
 * 3D marker pin visualization with color coding, badges, and tooltips
 * Features glow effects, pulse animations, and drag-and-drop support
 */

'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import AlertCircle from 'lucide-react/icons/alert-circle';
import FileText from 'lucide-react/icons/file-text';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import Flag from 'lucide-react/icons/flag';
import ClipboardList from 'lucide-react/icons/clipboard-list';
import Package from 'lucide-react/icons/package';
import Paperclip from 'lucide-react/icons/paperclip';
import Image from 'lucide-react/icons/image';
import CheckCircle from 'lucide-react/icons/check-circle';
import HelpCircle from 'lucide-react/icons/help-circle';
import Zap from 'lucide-react/icons/zap';;
import { cn } from '@/lib/utils';

import type { SpatialMarker } from '@/types/db/spatial';

// Local type for priority display
type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

interface SpatialMarkerPinProps {
  marker: SpatialMarker;
  materialCount?: number;
  attachmentCount?: number;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
  isDraggable?: boolean; // Only true for GC/PM
  /** Whether marker has a linked task (controls click behavior hint in tooltip) */
  hasLinkedTask?: boolean;
}

// Comprehensive marker type configuration matching database schema
const MARKER_TYPE_CONFIG = {
  issue: { color: '#DC2626', icon: AlertCircle, label: 'Issue' },
  note: { color: '#FBBF24', icon: FileText, label: 'Note' },
  photo: { color: '#3B82F6', icon: Image, label: 'Photo' },
  inspection: { color: '#8B5CF6', icon: CheckCircle, label: 'Inspection' },
  rfi: { color: '#EC4899', icon: HelpCircle, label: 'RFI' },
  safety: { color: '#F97316', icon: AlertTriangle, label: 'Safety' },
  material: { color: '#059669', icon: Package, label: 'Material' },
  progress: { color: '#10B981', icon: Zap, label: 'Progress' },
} as const;

// Fallback config for unknown marker types
const FALLBACK_CONFIG = { color: '#6B7280', icon: Flag, label: 'Marker' };

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function SpatialMarkerPin({
  marker,
  materialCount = 0,
  attachmentCount = 0,
  onClick,
  onDragStart,
  onDragEnd,
  className,
  isDraggable = false,
  hasLinkedTask,
}: SpatialMarkerPinProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Debug: Derive hasLinkedTask from marker.task_id if not explicitly provided
  const isLinkedToTask = hasLinkedTask ?? Boolean(marker.task_id);

  console.log('[SpatialMarkerPin] Rendering marker:', marker.id, marker.type, 'hasLinkedTask:', isLinkedToTask);

  // Safe config lookup with fallback for undefined types
  const config = MARKER_TYPE_CONFIG[marker.type as keyof typeof MARKER_TYPE_CONFIG] || FALLBACK_CONFIG;
  
  // Defensive check: ensure config and icon exist before rendering
  if (!config) {
    console.error('[SpatialMarkerPin] Invalid marker type:', marker.type);
    return null;
  }

  const Icon = config.icon;

  // High priority markers should pulse (priority is on linked task, not marker itself)
  const shouldPulse = false; // TODO: Get priority from linked task

  // Blocked status gets red border
  const isBlocked = marker.status === 'closed';

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', marker.id);
    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn('relative inline-block group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Phase 6: Enlarged tap area (invisible) - increases touch target without visual size */}
      <div className="absolute -inset-2 md:-inset-1" onClick={onClick} />

      {/* Main Pin - Responsive sizing: 48px mobile (w-12), 40px desktop (w-10) */}
      <motion.div
        onClick={onClick}
        className={cn(
          'relative rounded-full',
          'flex items-center justify-center',
          'border-4 border-white shadow-construction-lg',
          'transition-all duration-300 cursor-pointer',
          // Responsive sizing: Mobile 48px (w-12 h-12), Desktop 40px (w-10 h-10)
          'w-12 h-12 md:w-10 md:h-10',
          isDraggable && 'cursor-move',
          isDragging && 'opacity-50 scale-90',
          'group-hover:scale-110 group-hover:shadow-construction-xl',
          isBlocked && 'border-red-500'
        )}
        style={{
          backgroundColor: config.color,
          boxShadow: `0 0 0 4px rgba(255, 255, 255, 1), 0 0 20px ${config.color}40`,
        }}
        animate={{
          scale: shouldPulse ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: shouldPulse ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full opacity-30 blur-md"
          style={{ backgroundColor: config.color }}
        />

        {/* Icon - Responsive sizing */}
        <Icon className="relative z-10 h-6 w-6 md:h-5 md:w-5 text-white" />
      </motion.div>

      {/* Material Count Badge (top-right) - Responsive sizing */}
      {materialCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute -top-1 -right-1 z-20',
            'rounded-full',
            'bg-green-500 border-2 border-white',
            'flex items-center justify-center',
            'shadow-md',
            // Responsive sizing: Mobile 28px (w-7 h-7), Desktop 24px (w-6 h-6)
            'w-7 h-7 md:w-6 md:h-6'
          )}
        >
          <span className="text-[10px] font-mono font-bold text-white">
            {materialCount}
          </span>
        </motion.div>
      )}

      {/* Attachment Count Badge (bottom-right) - Responsive sizing */}
      {attachmentCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute -bottom-1 -right-1 z-20',
            'rounded-full',
            'bg-blue-500 border-2 border-white',
            'flex items-center justify-center',
            'shadow-md',
            // Responsive sizing: Mobile 28px (w-7 h-7), Desktop 24px (w-6 h-6)
            'w-7 h-7 md:w-6 md:h-6'
          )}
        >
          <Paperclip className="h-3 w-3 text-white" />
        </motion.div>
      )}

      {/* Tooltip on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30',
              'bg-gray-900 text-white rounded-lg shadow-2xl',
              'px-4 py-3 min-w-[200px] max-w-[280px]',
              'pointer-events-none'
            )}
          >
            {/* Arrow */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid rgb(17, 24, 39)',
              }}
            />

            {/* Content */}
            <div className="space-y-2">
              {/* Type & Title */}
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 mb-1">
                  {config.label}
                </div>
                <div className="text-sm font-bold">{marker.title}</div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                  Status:
                </div>
                <div
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded',
                    marker.status === 'open' && 'bg-gray-700',
                    marker.status === 'in_progress' && 'bg-blue-700',
                    marker.status === 'resolved' && 'bg-green-700',
                    marker.status === 'closed' && 'bg-gray-600'
                  )}
                >
                  {STATUS_LABELS[marker.status]}
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 pt-1">
                {materialCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-900 rounded text-[10px] font-bold">
                    <Package className="h-3 w-3" />
                    {materialCount} Materials
                  </div>
                )}
                {attachmentCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-900 rounded text-[10px] font-bold">
                    <Paperclip className="h-3 w-3" />
                    {attachmentCount}
                  </div>
                )}
              </div>

              {/* Click action hint */}
              <div className="mt-2 pt-2 border-t border-gray-700">
                {isLinkedToTask ? (
                  <div className="flex items-center gap-1 text-[10px] text-blue-400">
                    <ClipboardList className="h-3 w-3" />
                    <span>Click to view linked task</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Flag className="h-3 w-3" />
                    <span>Click to view marker details</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
