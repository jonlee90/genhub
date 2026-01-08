/**
 * P5.4 - Conflict Resolution Dialog
 * Shows conflicts and allows user to resolve
 * Uses BaseModal with construction theme
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, User, Clock, MapPin, FileText } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { cn } from '@/lib/utils';
import type { MarkerConflict, ConflictResolution } from '@/lib/offline/conflict-resolver';
import { formatDistanceToNow } from 'date-fns';

console.log('[ConflictDialog] Component loaded');

export interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: MarkerConflict[];
  markerTitle: string;
  onResolve: (resolutions: Map<string, ConflictResolution>) => void;
}

/**
 * Conflict resolution dialog
 */
export function ConflictDialog({
  isOpen,
  onClose,
  conflicts,
  markerTitle,
  onResolve,
}: ConflictDialogProps) {
  console.log('[ConflictDialog] Rendering:', { isOpen, conflictCount: conflicts.length });

  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(
    new Map()
  );

  const handleResolutionChange = (
    conflictType: string,
    resolution: ConflictResolution
  ) => {
    console.log('[ConflictDialog] Resolution changed:', { conflictType, resolution });
    const newResolutions = new Map(resolutions);
    newResolutions.set(conflictType, resolution);
    setResolutions(newResolutions);
  };

  const handleResolveAll = () => {
    console.log('[ConflictDialog] Resolving all conflicts');

    // Ensure all conflicts have a resolution
    const allResolved = conflicts.every((conflict) =>
      resolutions.has(conflict.conflictType)
    );

    if (!allResolved) {
      console.warn('[ConflictDialog] Not all conflicts resolved');
      alert('Please select a resolution for all conflicts');
      return;
    }

    onResolve(resolutions);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={AlertTriangle}
      title="Resolve Conflicts"
      subtitle={`Marker: ${markerTitle}`}
      badges={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
        </span>
      }
      maxWidth="2xl"
      theme="warning"
    >
      <div className="space-y-4">
        {/* Info banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            This marker was edited offline and on the server. Please choose which version to keep for each conflict.
          </p>
        </div>

        {/* Conflict list */}
        <div className="space-y-4">
          {conflicts.map((conflict, index) => (
            <ConflictItem
              key={`${conflict.conflictType}-${index}`}
              conflict={conflict}
              resolution={resolutions.get(conflict.conflictType)}
              onResolutionChange={(res) =>
                handleResolutionChange(conflict.conflictType, res)
              }
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg',
              'hover:bg-gray-50 transition-colors font-medium text-sm'
            )}
          >
            Cancel
          </button>

          <button
            onClick={handleResolveAll}
            disabled={conflicts.some(
              (c) => !resolutions.has(c.conflictType)
            )}
            className={cn(
              'px-4 py-2 bg-[#001B51] text-white rounded-lg',
              'hover:bg-[#001B51]/90 transition-colors font-medium text-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Resolve All Conflicts
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

/**
 * Individual conflict item
 */
function ConflictItem({
  conflict,
  resolution,
  onResolutionChange,
}: {
  conflict: MarkerConflict;
  resolution?: ConflictResolution;
  onResolutionChange: (resolution: ConflictResolution) => void;
}) {
  console.log('[ConflictItem] Rendering:', conflict.conflictType);

  // Conflict type icon & label
  const typeConfig: Record<
    string,
    { icon: any; label: string; color: string }
  > = {
    title: {
      icon: FileText,
      label: 'Title Changed',
      color: 'text-blue-600',
    },
    position: {
      icon: MapPin,
      label: 'Position Moved',
      color: 'text-purple-600',
    },
    content: {
      icon: FileText,
      label: 'Description Changed',
      color: 'text-green-600',
    },
    deleted: {
      icon: AlertTriangle,
      label: 'Deleted on Server',
      color: 'text-red-600',
    },
  };

  const config = typeConfig[conflict.conflictType] || typeConfig.title;
  const Icon = config.icon;

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4">
      {/* Conflict type header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('w-5 h-5', config.color)} />
        <h4 className="font-bold text-gray-900">{config.label}</h4>
      </div>

      {/* Versions comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Local version (Mine) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 uppercase">
              My Version
            </span>
          </div>

          <ConflictVersionContent
            conflict={conflict}
            version="local"
          />

          <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(conflict.localTimestamp, { addSuffix: true })}
          </div>
        </div>

        {/* Server version (Theirs) */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-600 uppercase">
              Server Version
            </span>
          </div>

          <ConflictVersionContent
            conflict={conflict}
            version="server"
          />

          <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(conflict.serverTimestamp, { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Resolution options */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Choose resolution:
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onResolutionChange('keep-mine')}
            className={cn(
              'flex-1 px-4 py-2 border-2 rounded-lg transition-colors text-sm font-medium',
              resolution === 'keep-mine'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            Keep Mine
          </button>

          <button
            onClick={() => onResolutionChange('keep-theirs')}
            className={cn(
              'flex-1 px-4 py-2 border-2 rounded-lg transition-colors text-sm font-medium',
              resolution === 'keep-theirs'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            Keep Theirs
          </button>

          {conflict.conflictType === 'content' && (
            <button
              onClick={() => onResolutionChange('merge')}
              className={cn(
                'flex-1 px-4 py-2 border-2 rounded-lg transition-colors text-sm font-medium',
                resolution === 'merge'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              Merge Both
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render conflict version content
 */
function ConflictVersionContent({
  conflict,
  version,
}: {
  conflict: MarkerConflict;
  version: 'local' | 'server';
}) {
  const value = version === 'local' ? conflict.localVersion : conflict.serverVersion;

  if (conflict.conflictType === 'deleted') {
    return (
      <p className="text-sm text-gray-600">
        {version === 'server' ? 'Deleted' : 'Exists'}
      </p>
    );
  }

  if (conflict.conflictType === 'title') {
    return <p className="text-sm font-medium text-gray-900">{value}</p>;
  }

  if (conflict.conflictType === 'position') {
    return (
      <div className="text-sm text-gray-900 font-mono">
        <div>X: {value.x.toFixed(2)}</div>
        <div>Y: {value.y.toFixed(2)}</div>
        <div>Z: {value.z.toFixed(2)}</div>
      </div>
    );
  }

  if (conflict.conflictType === 'content') {
    return (
      <p className="text-sm text-gray-900 line-clamp-3">
        {value || '(empty)'}
      </p>
    );
  }

  return <p className="text-sm text-gray-600">{JSON.stringify(value)}</p>;
}
