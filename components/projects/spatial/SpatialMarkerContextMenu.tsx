/**
 * SpatialMarkerContextMenu - P2.1
 * Context menu for 3D click interactions on spatial viewer
 * Only visible for admin/project_manager roles
 *
 * NOTE: Uses separate onAdd* callbacks (onAddIssue, onAddNote, onAddSafety, onAddMilestone)
 * instead of single onCreateMarker(type) for better type safety and clearer parent component integration.
 */

'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Plus from 'lucide-react/icons/plus';
import Link2 from 'lucide-react/icons/link-2';
import AlertCircle from 'lucide-react/icons/alert-circle';
import FileText from 'lucide-react/icons/file-text';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import Flag from 'lucide-react/icons/flag';
import Minus from 'lucide-react/icons/minus';;
import { cn } from '@/lib/utils';

/**
 * Props for SpatialMarkerContextMenu component
 *
 * API Note: This component uses separate onAdd* callbacks instead of a single
 * onCreateMarker(type) callback for better type safety and integration.
 */
interface SpatialMarkerContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number }; // Screen coordinates
  worldPosition: { x: number; y: number; z: number }; // 3D coordinates
  normal?: { x: number; y: number; z: number }; // Surface normal
  elementId?: string;
  userRole: string;
  onClose: () => void;
  onCreateTask: () => void;
  onLinkTask: () => void;
  onAddIssue: () => void;
  onAddNote: () => void;
  onAddSafety: () => void;
  onAddMilestone: () => void;
}

const MARKER_ACTIONS = [
  {
    id: 'issue',
    label: 'Add Issue',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'hover:bg-red-50',
    borderColor: 'hover:border-red-200',
    action: 'onAddIssue',
  },
  {
    id: 'note',
    label: 'Add Note',
    icon: FileText,
    color: 'text-yellow-600',
    bgColor: 'hover:bg-yellow-50',
    borderColor: 'hover:border-yellow-200',
    action: 'onAddNote',
  },
  {
    id: 'safety',
    label: 'Add Safety',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'hover:bg-orange-50',
    borderColor: 'hover:border-orange-200',
    action: 'onAddSafety',
  },
  {
    id: 'milestone',
    label: 'Add Milestone',
    icon: Flag,
    color: 'text-green-600',
    bgColor: 'hover:bg-green-50',
    borderColor: 'hover:border-green-200',
    action: 'onAddMilestone',
  },
];

export function SpatialMarkerContextMenu({
  isOpen,
  position,
  worldPosition,
  normal,
  elementId,
  userRole,
  onClose,
  onCreateTask,
  onLinkTask,
  onAddIssue,
  onAddNote,
  onAddSafety,
  onAddMilestone,
}: SpatialMarkerContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  console.log('[SpatialMarkerContextMenu] Rendering', {
    isOpen,
    position,
    worldPosition,
    userRole,
  });

  // Permission check: Only GC/PM can see menu
  const hasPermission = userRole === 'admin' || userRole === 'project_manager';

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Don't render if no permission
  if (!hasPermission) return null;

  const actionMap = {
    onAddIssue,
    onAddNote,
    onAddSafety,
    onAddMilestone,
  };

  const handleAction = (actionKey: string) => {
    const handler = actionMap[actionKey as keyof typeof actionMap];
    if (handler) {
      handler();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 9999,
          }}
          className="select-none"
        >
          <div className="bg-white rounded-lg shadow-construction-lg border-2 border-gray-900 overflow-hidden min-w-[240px]">
            {/* Header with 3D coordinates */}
            <div className="px-4 py-3 bg-[#001B51] border-b-2 border-gray-900">
              <div className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1">
                3D Position
              </div>
              <div className="font-mono text-xs text-white">
                X: {worldPosition.x.toFixed(2)} / Y: {worldPosition.y.toFixed(2)} / Z:{' '}
                {worldPosition.z.toFixed(2)}
              </div>
              {elementId && (
                <div className="text-[10px] font-mono text-white/80 mt-1">
                  Element: {elementId.substring(0, 16)}...
                </div>
              )}
            </div>

            {/* Task Actions */}
            <div className="p-2">
              <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider px-2 py-1.5">
                Task Actions
              </div>
              <button
                onClick={() => {
                  onCreateTask();
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                  'text-left text-sm font-medium text-gray-900',
                  'hover:bg-[#001B51]/5 hover:border-[#001B51]/20',
                  'border-2 border-transparent transition-all duration-150'
                )}
              >
                <Plus className="h-4 w-4 text-[#001B51]" />
                <span>Create New Task Here</span>
              </button>
              <button
                onClick={() => {
                  onLinkTask();
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                  'text-left text-sm font-medium text-gray-900',
                  'hover:bg-[#001B51]/5 hover:border-[#001B51]/20',
                  'border-2 border-transparent transition-all duration-150'
                )}
              >
                <Link2 className="h-4 w-4 text-[#001B51]" />
                <span>Link Existing Task</span>
              </button>
            </div>

            {/* Separator */}
            <div className="px-4 py-0">
              <div className="h-[2px] bg-gray-200" />
            </div>

            {/* Marker Actions */}
            <div className="p-2">
              <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider px-2 py-1.5">
                Marker Actions
              </div>
              {MARKER_ACTIONS.map((marker) => {
                const IconComponent = marker.icon;
                return (
                  <button
                    key={marker.id}
                    onClick={() => handleAction(marker.action)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                      'text-left text-sm font-medium text-gray-900',
                      'border-2 border-transparent transition-all duration-150',
                      marker.bgColor,
                      marker.borderColor
                    )}
                  >
                    <IconComponent className={cn('h-4 w-4', marker.color)} />
                    <span>{marker.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
