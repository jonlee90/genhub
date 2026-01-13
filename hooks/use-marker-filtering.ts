// P3.9 - React hook for advanced marker filtering and search

import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { SpatialMarker, MarkerWithContent } from '@/types/db/spatial';
import type { MarkerFiltersState } from '@/components/projects/spatial/MarkerFilters';

export interface UseMarkerFilteringOptions {
  searchThreshold?: number; // Fuse.js threshold (default: 0.3)
  maxSearchResults?: number; // Max search results (default: 100)
  debounceMs?: number; // Search debounce (default: 300ms)
}

export interface UseMarkerFilteringReturn {
  filteredMarkers: SpatialMarker[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: MarkerFiltersState;
  setFilters: (filters: MarkerFiltersState) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  stats: {
    totalMarkers: number;
    filteredCount: number;
    searchResultCount: number;
  };
}

/**
 * useMarkerFiltering - Hook for advanced marker filtering and search
 *
 * Features:
 * - Full-text search with Fuse.js (title, description, content)
 * - Multi-select type/status filters
 * - Floor/creator filters
 * - Date range filtering
 * - Debounced search
 * - Filter statistics
 *
 * @param markers - Array of spatial markers to filter
 * @param options - Filtering configuration options
 * @returns Filtering state and control functions
 */
export function useMarkerFiltering(
  markers: (SpatialMarker | MarkerWithContent)[],
  options: UseMarkerFilteringOptions = {}
): UseMarkerFilteringReturn {
  const {
    searchThreshold = 0.3,
    maxSearchResults = 100,
    debounceMs = 300,
  } = options;

  console.log('[useMarkerFiltering] Hook initialized', {
    markerCount: markers.length,
    options,
  });

  // Debug: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debug: Filter state
  const [filters, setFilters] = useState<MarkerFiltersState>({
    types: [],
    statuses: [],
  });

  // Debug: Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[useMarkerFiltering] Debounced query updated', { searchQuery });
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Debug: Prepare searchable data
  const searchableMarkers = useMemo(() => {
    return markers.map((marker) => {
      // Extract content notes if available
      const contentNotes = 'content' in marker && Array.isArray(marker.content)
        ? marker.content
            .filter((c: any) => c.content_type === 'note')
            .map((c: any) => c.text_content || '')
            .join(' ')
        : '';

      return {
        ...marker,
        searchableContent: `${marker.title} ${marker.description || ''} ${contentNotes}`.trim(),
      };
    });
  }, [markers]);

  // Debug: Configure Fuse.js
  const fuse = useMemo(() => {
    console.log('[useMarkerFiltering] Initializing Fuse.js', {
      itemCount: searchableMarkers.length,
      threshold: searchThreshold,
    });

    return new Fuse(searchableMarkers, {
      keys: [
        { name: 'title', weight: 2.0 },
        { name: 'description', weight: 1.5 },
        { name: 'searchableContent', weight: 1.0 },
      ],
      threshold: searchThreshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }, [searchableMarkers, searchThreshold]);

  // Debug: Apply search
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return markers;
    }

    console.log('[useMarkerFiltering] Performing search', { query: debouncedQuery });
    const startTime = performance.now();

    const fuseResults = fuse.search(debouncedQuery, { limit: maxSearchResults });
    const results = fuseResults.map((result) => result.item as SpatialMarker);

    const elapsed = performance.now() - startTime;
    console.log('[useMarkerFiltering] Search complete', {
      query: debouncedQuery,
      resultCount: results.length,
      elapsed: `${elapsed.toFixed(2)}ms`,
    });

    return results;
  }, [fuse, debouncedQuery, markers, maxSearchResults]);

  // Debug: Apply filters
  const filteredMarkers = useMemo(() => {
    let filtered = searchResults;

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter((m) => filters.types.includes(m.type as any));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((m) => filters.statuses.includes(m.status as any));
    }

    // Floor filter
    if (filters.floorId) {
      filtered = filtered.filter((m) => m.floor_id === filters.floorId);
    }

    // Creator filter
    if (filters.creatorId) {
      filtered = filtered.filter((m) => m.created_by === filters.creatorId);
    }

    // Date range filter
    if (filters.dateRange?.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter((m) => {
        const markerDate = new Date(m.last_activity_at || m.created_at);
        return markerDate >= startDate;
      });
    }

    if (filters.dateRange?.end) {
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((m) => {
        const markerDate = new Date(m.last_activity_at || m.created_at);
        return markerDate <= endDate;
      });
    }

    console.log('[useMarkerFiltering] Filters applied', {
      total: markers.length,
      searchResults: searchResults.length,
      filtered: filtered.length,
    });

    return filtered;
  }, [searchResults, filters, markers.length]);

  // Debug: Active filter count
  const activeFilterCount = useMemo(() => {
    return [
      filters.types.length > 0 ? 1 : 0,
      filters.statuses.length > 0 ? 1 : 0,
      filters.floorId ? 1 : 0,
      filters.creatorId ? 1 : 0,
      filters.dateRange?.start || filters.dateRange?.end ? 1 : 0,
      debouncedQuery.trim() ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0);
  }, [filters, debouncedQuery]);

  // Debug: Clear all filters
  const clearFilters = useCallback(() => {
    console.log('[useMarkerFiltering] Clearing all filters');
    setSearchQuery('');
    setDebouncedQuery('');
    setFilters({
      types: [],
      statuses: [],
    });
  }, []);

  // Debug: Statistics
  const stats = useMemo(() => {
    return {
      totalMarkers: markers.length,
      filteredCount: filteredMarkers.length,
      searchResultCount: searchResults.length,
    };
  }, [markers.length, filteredMarkers.length, searchResults.length]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('[useMarkerFiltering] State updated', {
      searchQuery: debouncedQuery,
      activeFilterCount,
      stats,
    });
  }, [debouncedQuery, activeFilterCount, stats]);

  return {
    filteredMarkers,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    stats,
  };
}
