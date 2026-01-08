/**
 * MarkerFilterPanel - P2.3
 * Filter panel for spatial markers with localStorage persistence
 * Shows marker type counts and filter options
 */

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  FileText,
  AlertTriangle,
  Flag,
  CheckSquare,
  Package,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MarkerFilters {
  markerTypes?: string[];
  statuses?: string[];
  priorities?: string[];
  phaseId?: string;
  hasTask?: boolean;
  hasMaterials?: boolean;
}

interface MarkerCounts {
  issue: number;
  note: number;
  safety: number;
  milestone: number;
}

interface MarkerFilterPanelProps {
  activeFilters: MarkerFilters;
  onFilterChange: (filters: MarkerFilters) => void;
  markerCounts: MarkerCounts;
  className?: string;
}

const MARKER_TYPE_FILTERS = [
  { id: 'issue', label: 'Issues', icon: AlertCircle, color: 'text-red-600' },
  { id: 'note', label: 'Notes', icon: FileText, color: 'text-yellow-600' },
  { id: 'safety', label: 'Safety', icon: AlertTriangle, color: 'text-orange-600' },
  { id: 'milestone', label: 'Milestones', icon: Flag, color: 'text-green-600' },
];

const STATUS_FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

const STORAGE_KEY = 'genhub_spatial_marker_filters';

export function MarkerFilterPanel({
  activeFilters,
  onFilterChange,
  markerCounts,
  className,
}: MarkerFilterPanelProps) {
  console.log('[MarkerFilterPanel] Rendering', { activeFilters, markerCounts });

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeFilters));
  }, [activeFilters]);

  // Restore filters from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        onFilterChange(parsed);
      } catch (err) {
        console.error('[MarkerFilterPanel] Failed to parse stored filters:', err);
      }
    }
  }, []); // Only run once on mount

  const toggleMarkerType = (type: string) => {
    const markerTypes = activeFilters.markerTypes ?? [];
    const newTypes = markerTypes.includes(type)
      ? markerTypes.filter((t) => t !== type)
      : [...markerTypes, type];

    onFilterChange({ ...activeFilters, markerTypes: newTypes });
  };

  const toggleStatus = (status: string) => {
    const statuses = activeFilters.statuses ?? [];
    const newStatuses = statuses.includes(status)
      ? statuses.filter((s) => s !== status)
      : [...statuses, status];

    onFilterChange({ ...activeFilters, statuses: newStatuses });
  };

  const toggleHasTask = () => {
    const newValue =
      activeFilters.hasTask === undefined ? true : activeFilters.hasTask ? false : undefined;
    onFilterChange({ ...activeFilters, hasTask: newValue });
  };

  const toggleHasMaterials = () => {
    const newValue =
      activeFilters.hasMaterials === undefined
        ? true
        : activeFilters.hasMaterials
        ? false
        : undefined;
    onFilterChange({ ...activeFilters, hasMaterials: newValue });
  };

  const clearFilters = () => {
    onFilterChange({
      markerTypes: [],
      statuses: [],
      hasTask: undefined,
      hasMaterials: undefined,
    });
  };

  const hasActiveFilters =
    (activeFilters.markerTypes?.length ?? 0) > 0 ||
    (activeFilters.statuses?.length ?? 0) > 0 ||
    activeFilters.hasTask !== undefined ||
    activeFilters.hasMaterials !== undefined;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border-2 border-gray-200 shadow-construction',
        'p-4 space-y-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
              'text-xs font-bold text-red-600',
              'hover:bg-red-50 transition-colors duration-150'
            )}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Marker Types */}
      <div>
        <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-3">
          Marker Types
        </div>
        <div className="space-y-2">
          {MARKER_TYPE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const count = markerCounts[filter.id as keyof MarkerCounts] || 0;
            const isActive = activeFilters.markerTypes?.includes(filter.id) ?? false;

            return (
              <label
                key={filter.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
                  'border-2 transition-all duration-150',
                  isActive
                    ? 'border-[#001B51] bg-[#001B51]/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleMarkerType(filter.id)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center',
                    'transition-all duration-150',
                    isActive ? 'border-[#001B51] bg-[#001B51]' : 'border-gray-300'
                  )}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 bg-white rounded-sm"
                    />
                  )}
                </div>
                <Icon className={cn('h-4 w-4 flex-shrink-0', filter.color)} />
                <span className="text-sm font-medium text-gray-900 flex-1">
                  {filter.label}
                </span>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div>
        <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-3">
          Status
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilters.statuses?.includes(filter.id) ?? false;

            return (
              <button
                key={filter.id}
                onClick={() => toggleStatus(filter.id)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-bold uppercase',
                  'border-2 transition-all duration-150',
                  isActive
                    ? 'border-[#001B51] bg-[#001B51] text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-3">
          Special
        </div>
        <div className="space-y-2">
          <button
            onClick={toggleHasTask}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg',
              'border-2 transition-all duration-150 text-left',
              activeFilters.hasTask !== undefined
                ? 'border-[#001B51] bg-[#001B51]/5'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <CheckSquare
              className={cn(
                'h-4 w-4 flex-shrink-0',
                activeFilters.hasTask !== undefined ? 'text-[#001B51]' : 'text-gray-400'
              )}
            />
            <span className="text-sm font-medium text-gray-900 flex-1">
              Tasks with Locations
            </span>
            {activeFilters.hasTask !== undefined && (
              <span className="text-xs font-mono font-bold text-[#001B51]">
                {activeFilters.hasTask ? 'YES' : 'NO'}
              </span>
            )}
          </button>

          <button
            onClick={toggleHasMaterials}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg',
              'border-2 transition-all duration-150 text-left',
              activeFilters.hasMaterials !== undefined
                ? 'border-[#001B51] bg-[#001B51]/5'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <Package
              className={cn(
                'h-4 w-4 flex-shrink-0',
                activeFilters.hasMaterials !== undefined
                  ? 'text-[#001B51]'
                  : 'text-gray-400'
              )}
            />
            <span className="text-sm font-medium text-gray-900 flex-1">
              Tasks with Materials
            </span>
            {activeFilters.hasMaterials !== undefined && (
              <span className="text-xs font-mono font-bold text-[#001B51]">
                {activeFilters.hasMaterials ? 'YES' : 'NO'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
