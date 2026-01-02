'use client';

// P3.2 - Marker panel with list, search, filters, and virtualization
// Features: Virtualized scrolling, search, filters, sort, responsive

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  Filter,
  SortAsc,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarkerListItem } from './MarkerListItem';
import type { SpatialMarker, SpatialMarkerType, SpatialMarkerStatus } from '@/types/spatial';

// Debug: Component props
export interface MarkerPanelProps {
  markers: SpatialMarker[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (marker: SpatialMarker) => void;
  onCreateMarker?: () => void;
  className?: string;
}

// Debug: Sort options
type SortOption = 'recent' | 'oldest' | 'floor';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'floor', label: 'By Floor' },
];

/**
 * MarkerPanel - Sidebar marker list with search and filters
 * Features:
 * - Virtualized scrolling (performance for 1000+ markers)
 * - Debounced search
 * - Type, status, floor filters
 * - Sort options
 * - Responsive: bottom sheet on mobile, sidebar on desktop
 */
export function MarkerPanel({
  markers,
  selectedMarkerId,
  onMarkerClick,
  onCreateMarker,
  className,
}: MarkerPanelProps) {
  console.log('[MarkerPanel] Rendering', { markerCount: markers.length, selectedMarkerId });

  // Debug: State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SpatialMarkerType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SpatialMarkerStatus | 'all'>('all');
  const [floorFilter, setFloorFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);

  // Debug: Get unique floors
  const floors = useMemo(() => {
    const uniqueFloors = new Set<string>();
    markers.forEach((m) => {
      if (m.floor_name) uniqueFloors.add(m.floor_name);
    });
    return Array.from(uniqueFloors).sort();
  }, [markers]);

  // Debug: Filter and sort markers
  const filteredMarkers = useMemo(() => {
    console.log('[MarkerPanel] Filtering markers', {
      searchQuery,
      typeFilter,
      statusFilter,
      floorFilter,
      sortBy,
    });

    let filtered = markers;

    // Debug: Search filter (title + description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
    }

    // Debug: Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((m) => m.type === typeFilter);
    }

    // Debug: Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Debug: Floor filter
    if (floorFilter !== 'all') {
      filtered = filtered.filter((m) => m.floor_name === floorFilter);
    }

    // Debug: Sort
    const sorted = [...filtered];
    if (sortBy === 'recent') {
      sorted.sort((a, b) => {
        const aTime = new Date(a.last_activity_at || a.created_at).getTime();
        const bTime = new Date(b.last_activity_at || b.created_at).getTime();
        return bTime - aTime;
      });
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return aTime - bTime;
      });
    } else if (sortBy === 'floor') {
      sorted.sort((a, b) => {
        const aFloor = a.floor_name || '';
        const bFloor = b.floor_name || '';
        return aFloor.localeCompare(bFloor);
      });
    }

    console.log('[MarkerPanel] Filtered count:', sorted.length);
    return sorted;
  }, [markers, searchQuery, typeFilter, statusFilter, floorFilter, sortBy]);

  // Debug: Virtualization setup
  const parentRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log('[MarkerPanel] Virtualization parent attached');
    }
  }, []);

  const virtualizer = useVirtualizer({
    count: filteredMarkers.length,
    getScrollElement: () => document.getElementById('marker-list-container'),
    estimateSize: () => 100, // Estimated item height
    overscan: 5,
  });

  // Debug: Handle clear filters
  const handleClearFilters = () => {
    console.log('[MarkerPanel] Clearing filters');
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setFloorFilter('all');
  };

  // Debug: Active filter count
  const activeFilterCount = [
    searchQuery.trim() ? 1 : 0,
    typeFilter !== 'all' ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    floorFilter !== 'all' ? 1 : 0,
  ].reduce((sum, val) => sum + val, 0);

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r-2 border-gray-200 h-full',
        'w-full md:w-80 lg:w-96',
        className
      )}
    >
      {/* Debug: Header */}
      <div className="shrink-0 border-b-2 border-[#001B51] bg-gradient-to-r from-[#001B51] to-[#3C3C3C] px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              Markers
            </h2>
            <div className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold text-white">
              {filteredMarkers.length}
            </div>
          </div>
        </div>

        {/* Debug: Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search markers..."
            className="pl-10 bg-white border-0 text-sm"
          />
        </div>
      </div>

      {/* Debug: Filters bar */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 bg-[#001B51] text-white rounded-full text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-8 text-xs border-0 bg-transparent">
              <SortAsc className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs ml-auto"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Debug: Filter dropdowns */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {/* Debug: Type filter */}
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                </SelectContent>
              </Select>

              {/* Debug: Status filter */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              {/* Debug: Floor filter */}
              {floors.length > 0 && (
                <Select value={floorFilter} onValueChange={setFloorFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Floor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {floors.map((floor) => (
                      <SelectItem key={floor} value={floor}>
                        {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug: Create button */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200">
        <Button
          onClick={onCreateMarker}
          className="w-full bg-[#001B51] hover:bg-[#001B51]/90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Marker
        </Button>
      </div>

      {/* Debug: Marker list (virtualized) */}
      <div
        id="marker-list-container"
        ref={parentRef}
        className="flex-1 overflow-auto px-4 py-3"
        style={{ overflowY: 'auto' }}
      >
        {filteredMarkers.length === 0 ? (
          // Debug: Empty state
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-[#001B51] mb-2 uppercase tracking-tight">
              No Markers
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {activeFilterCount > 0
                ? 'No markers match your filters.'
                : 'No markers yet. Click "Create Marker" to get started.'}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          // Debug: Virtualized list
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const marker = filteredMarkers[virtualItem.index];
              return (
                <div
                  key={marker.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="pb-2"
                >
                  <MarkerListItem
                    marker={marker}
                    isSelected={marker.id === selectedMarkerId}
                    onClick={onMarkerClick}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
