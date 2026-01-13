'use client';

// P3.9 - Advanced marker filtering with URL persistence
// Multi-select type/status, floor/creator dropdowns, date range

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  X,
  ChevronDown,
  Calendar,
  User,
  Layers,
  ClipboardList,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import type { SpatialMarker, SpatialMarkerType, SpatialMarkerStatus } from '@/types/db/spatial';

export interface MarkerFiltersState {
  types: SpatialMarkerType[];
  statuses: SpatialMarkerStatus[];
  floorId?: string;
  creatorId?: string;
  dateRange?: {
    start?: string; // ISO date string
    end?: string;
  };
}

export interface MarkerFiltersProps {
  markers: SpatialMarker[];
  onFiltersChange?: (filters: MarkerFiltersState) => void;
  onFilteredResults?: (results: SpatialMarker[]) => void;
  className?: string;
}

// Marker type definitions with labels (matching database enum)
const MARKER_TYPES: Array<{ value: SpatialMarkerType; label: string }> = [
  { value: 'note', label: 'Note' },
  { value: 'photo', label: 'Photo' },
  { value: 'issue', label: 'Issue' },
  { value: 'safety', label: 'Safety' },
  { value: 'progress', label: 'Progress' },
  { value: 'material', label: 'Material' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'rfi', label: 'RFI' },
];

// Marker status definitions with labels (matching database enum)
const MARKER_STATUSES: Array<{ value: SpatialMarkerStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

/**
 * MarkerFilters - Advanced multi-select filtering with URL persistence
 *
 * Features:
 * - Multi-select type filter (checkboxes)
 * - Multi-select status filter (checkboxes)
 * - Floor dropdown (if floors exist)
 * - Creator dropdown (if multiple creators)
 * - Date range picker (created_at, last_activity_at)
 * - Clear filters button
 * - Filter count badge
 * - Collapsible filter panel
 * - URL persistence with query params
 */
export function MarkerFilters({
  markers,
  onFiltersChange,
  onFilteredResults,
  className,
}: MarkerFiltersProps) {
  console.log('[MarkerFilters] Rendering', { markerCount: markers.length });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Debug: Filter state
  const [types, setTypes] = useState<SpatialMarkerType[]>([]);
  const [statuses, setStatuses] = useState<SpatialMarkerStatus[]>([]);
  const [floorId, setFloorId] = useState<string | undefined>();
  const [creatorId, setCreatorId] = useState<string | undefined>();
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debug: Load filters from URL on mount
  useEffect(() => {
    const urlTypes = searchParams.get('types')?.split(',').filter(Boolean) as SpatialMarkerType[] || [];
    const urlStatuses = searchParams.get('statuses')?.split(',').filter(Boolean) as SpatialMarkerStatus[] || [];
    const urlFloor = searchParams.get('floor') || undefined;
    const urlCreator = searchParams.get('creator') || undefined;
    const urlDateStart = searchParams.get('dateStart') || '';
    const urlDateEnd = searchParams.get('dateEnd') || '';

    console.log('[MarkerFilters] Loading filters from URL', {
      urlTypes,
      urlStatuses,
      urlFloor,
      urlCreator,
      urlDateStart,
      urlDateEnd,
    });

    setTypes(urlTypes);
    setStatuses(urlStatuses);
    setFloorId(urlFloor);
    setCreatorId(urlCreator);
    setDateStart(urlDateStart);
    setDateEnd(urlDateEnd);

    // Auto-expand if filters are active
    if (urlTypes.length > 0 || urlStatuses.length > 0 || urlFloor || urlCreator || urlDateStart || urlDateEnd) {
      setIsExpanded(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug: Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (types.length > 0) params.set('types', types.join(','));
    if (statuses.length > 0) params.set('statuses', statuses.join(','));
    if (floorId) params.set('floor', floorId);
    if (creatorId) params.set('creator', creatorId);
    if (dateStart) params.set('dateStart', dateStart);
    if (dateEnd) params.set('dateEnd', dateEnd);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    console.log('[MarkerFilters] Updating URL', { newUrl });
    router.replace(newUrl, { scroll: false });
  }, [types, statuses, floorId, creatorId, dateStart, dateEnd, pathname, router]);

  // Debug: Emit filter state
  useEffect(() => {
    const filterState: MarkerFiltersState = {
      types,
      statuses,
      floorId,
      creatorId,
      dateRange: dateStart || dateEnd ? { start: dateStart, end: dateEnd } : undefined,
    };

    console.log('[MarkerFilters] Emitting filter state', filterState);
    onFiltersChange?.(filterState);
  }, [types, statuses, floorId, creatorId, dateStart, dateEnd, onFiltersChange]);

  // Debug: Apply filters
  const filteredMarkers = useMemo(() => {
    let filtered = markers;

    // Type filter
    if (types.length > 0) {
      filtered = filtered.filter((m) => types.includes(m.type as SpatialMarkerType));
    }

    // Status filter
    if (statuses.length > 0) {
      filtered = filtered.filter((m) => statuses.includes(m.status as SpatialMarkerStatus));
    }

    // Floor filter
    if (floorId) {
      filtered = filtered.filter((m) => m.floor_id === floorId);
    }

    // Creator filter
    if (creatorId) {
      filtered = filtered.filter((m) => m.created_by === creatorId);
    }

    // Date range filter (last_activity_at or created_at)
    if (dateStart) {
      const startDate = new Date(dateStart);
      filtered = filtered.filter((m) => {
        const markerDate = new Date(m.last_activity_at || m.created_at);
        return markerDate >= startDate;
      });
    }

    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((m) => {
        const markerDate = new Date(m.last_activity_at || m.created_at);
        return markerDate <= endDate;
      });
    }

    console.log('[MarkerFilters] Filtered markers', {
      total: markers.length,
      filtered: filtered.length,
    });

    return filtered;
  }, [markers, types, statuses, floorId, creatorId, dateStart, dateEnd]);

  // Debug: Emit filtered results
  useEffect(() => {
    onFilteredResults?.(filteredMarkers);
  }, [filteredMarkers, onFilteredResults]);

  // Debug: Extract unique floors and creators
  const { floors, creators } = useMemo(() => {
    const floorMap = new Map<string, string>();
    const creatorMap = new Map<string, string>();

    markers.forEach((m) => {
      if (m.floor_id && m.floor_name) {
        floorMap.set(m.floor_id, m.floor_name);
      }
      if (m.created_by) {
        // Use creator name if available (requires join), fallback to ID
        creatorMap.set(m.created_by, m.created_by);
      }
    });

    return {
      floors: Array.from(floorMap.entries()).map(([id, name]) => ({ id, name })),
      creators: Array.from(creatorMap.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [markers]);

  // Debug: Active filter count
  const activeFilterCount = [
    types.length > 0 ? 1 : 0,
    statuses.length > 0 ? 1 : 0,
    floorId ? 1 : 0,
    creatorId ? 1 : 0,
    dateStart || dateEnd ? 1 : 0,
  ].reduce((sum, val) => sum + val, 0);

  // Debug: Clear all filters
  const handleClearFilters = useCallback(() => {
    console.log('[MarkerFilters] Clearing all filters');
    setTypes([]);
    setStatuses([]);
    setFloorId(undefined);
    setCreatorId(undefined);
    setDateStart('');
    setDateEnd('');
  }, []);

  // Debug: Toggle type
  const handleToggleType = useCallback((type: SpatialMarkerType) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // Debug: Toggle status
  const handleToggleStatus = useCallback((status: SpatialMarkerStatus) => {
    setStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Debug: Filter header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-2 px-3 py-2',
            'border-2 border-gray-200 hover:border-[#001B51]',
            'transition-all duration-200',
            isExpanded && 'bg-[#001B51] text-white hover:bg-[#001B51]/90 border-[#001B51]'
          )}
        >
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-tight">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-[#FFB627] text-[#001B51] rounded-full text-[10px] font-black">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs text-[#DC2626] hover:text-[#DC2626] hover:bg-red-50"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Debug: Filter panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              {/* Debug: Type filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-[#001B51]" />
                  <label className="text-xs font-bold text-[#001B51] uppercase tracking-tight">
                    Type
                  </label>
                  {types.length > 0 && (
                    <span className="text-[10px] text-gray-500">({types.length} selected)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MARKER_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleToggleType(value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2',
                        'border-2 rounded-lg text-xs font-medium',
                        'transition-all duration-150',
                        'hover:border-[#001B51]',
                        types.includes(value)
                          ? 'bg-[#001B51] text-white border-[#001B51]'
                          : 'bg-white text-gray-700 border-gray-200'
                      )}
                    >
                      {types.includes(value) ? (
                        <ClipboardList className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Debug: Status filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-[#001B51]" />
                  <label className="text-xs font-bold text-[#001B51] uppercase tracking-tight">
                    Status
                  </label>
                  {statuses.length > 0 && (
                    <span className="text-[10px] text-gray-500">({statuses.length} selected)</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MARKER_STATUSES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleToggleStatus(value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2',
                        'border-2 rounded-lg text-xs font-medium',
                        'transition-all duration-150',
                        'hover:border-[#001B51]',
                        statuses.includes(value)
                          ? 'bg-[#001B51] text-white border-[#001B51]'
                          : 'bg-white text-gray-700 border-gray-200'
                      )}
                    >
                      {statuses.includes(value) ? (
                        <ClipboardList className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Debug: Floor filter (if floors exist) */}
              {floors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-[#001B51]" />
                    <label className="text-xs font-bold text-[#001B51] uppercase tracking-tight">
                      Floor
                    </label>
                  </div>
                  <select
                    value={floorId || ''}
                    onChange={(e) => setFloorId(e.target.value || undefined)}
                    className={cn(
                      'w-full px-3 py-2 text-xs font-medium',
                      'border-2 rounded-lg',
                      'bg-white text-gray-700',
                      'focus:border-[#001B51] focus:ring-2 focus:ring-[#001B51]/20',
                      'transition-all duration-150',
                      floorId ? 'border-[#001B51]' : 'border-gray-200'
                    )}
                  >
                    <option value="">All Floors</option>
                    {floors.map(({ id, name }) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Debug: Creator filter (if multiple creators) */}
              {creators.length > 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-[#001B51]" />
                    <label className="text-xs font-bold text-[#001B51] uppercase tracking-tight">
                      Creator
                    </label>
                  </div>
                  <select
                    value={creatorId || ''}
                    onChange={(e) => setCreatorId(e.target.value || undefined)}
                    className={cn(
                      'w-full px-3 py-2 text-xs font-medium',
                      'border-2 rounded-lg',
                      'bg-white text-gray-700',
                      'focus:border-[#001B51] focus:ring-2 focus:ring-[#001B51]/20',
                      'transition-all duration-150',
                      creatorId ? 'border-[#001B51]' : 'border-gray-200'
                    )}
                  >
                    <option value="">All Creators</option>
                    {creators.map(({ id, name }) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Debug: Date range filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#001B51]" />
                  <label className="text-xs font-bold text-[#001B51] uppercase tracking-tight">
                    Date Range
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Start Date</label>
                    <Input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className={cn(
                        'text-xs',
                        dateStart && 'border-[#001B51]'
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className={cn(
                        'text-xs',
                        dateEnd && 'border-[#001B51]'
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Results summary */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 bg-[#059669]/10 border-2 border-[#059669] rounded-lg"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#059669] font-bold">
              {filteredMarkers.length} of {markers.length} markers
            </span>
            <span className="text-gray-600">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
