'use client';

// P3.9 - Advanced marker search with Fuse.js
// Full-text search across title, description, and content notes

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SpatialMarker } from '@/types/spatial';
import type { MarkerWithContent } from '@/types/spatial';

export interface MarkerSearchProps {
  markers: (SpatialMarker | MarkerWithContent)[];
  onSearchResults?: (results: SpatialMarker[]) => void;
  onSearchQueryChange?: (query: string) => void;
  debounceMs?: number;
  maxResults?: number;
  placeholder?: string;
  className?: string;
}

/**
 * MarkerSearch - Advanced full-text search with Fuse.js
 *
 * Features:
 * - Searches title, description, and content notes
 * - Debounced input (default 300ms)
 * - Fuzzy matching with threshold 0.3
 * - Max 100 results for performance
 * - Search result highlights
 * - Clear button
 * - Construction-themed styling
 */
export function MarkerSearch({
  markers,
  onSearchResults,
  onSearchQueryChange,
  debounceMs = 300,
  maxResults = 100,
  placeholder = 'Search markers...',
  className,
}: MarkerSearchProps) {
  console.log('[MarkerSearch] Rendering', { markerCount: markers.length });

  // Debug: Search state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debug: Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      console.log('[MarkerSearch] Debounced query updated', { query });
      setDebouncedQuery(query);
      setIsSearching(false);
      onSearchQueryChange?.(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearchQueryChange]);

  // Debug: Prepare searchable data
  const searchableMarkers = useMemo(() => {
    return markers.map((marker) => {
      // Extract content notes if available
      const contentNotes = 'content' in marker && Array.isArray(marker.content)
        ? marker.content
            .filter((c) => c.content_type === 'note')
            .map((c) => c.text_content || '')
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
    console.log('[MarkerSearch] Initializing Fuse.js', {
      itemCount: searchableMarkers.length,
    });

    return new Fuse(searchableMarkers, {
      keys: [
        { name: 'title', weight: 2.0 },
        { name: 'description', weight: 1.5 },
        { name: 'searchableContent', weight: 1.0 },
      ],
      threshold: 0.3, // 0.0 = exact match, 1.0 = match anything
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }, [searchableMarkers]);

  // Debug: Perform search
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return markers;
    }

    console.log('[MarkerSearch] Searching', { query: debouncedQuery });
    const startTime = performance.now();

    const fuseResults = fuse.search(debouncedQuery, { limit: maxResults });
    const results = fuseResults.map((result) => result.item as SpatialMarker);

    const elapsed = performance.now() - startTime;
    console.log('[MarkerSearch] Search complete', {
      query: debouncedQuery,
      resultCount: results.length,
      elapsed: `${elapsed.toFixed(2)}ms`,
    });

    return results;
  }, [fuse, debouncedQuery, markers, maxResults]);

  // Debug: Emit search results
  useEffect(() => {
    onSearchResults?.(searchResults);
  }, [searchResults, onSearchResults]);

  // Debug: Clear search
  const handleClear = useCallback(() => {
    console.log('[MarkerSearch] Clearing search');
    setQuery('');
    setDebouncedQuery('');
  }, []);

  // Debug: Has active search
  const hasActiveSearch = query.trim().length > 0;

  return (
    <div className={cn('relative', className)}>
      {/* Debug: Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            'bg-white border-2 border-gray-200',
            'focus:border-[#001B51] focus:ring-2 focus:ring-[#001B51]/20',
            'transition-all duration-200',
            hasActiveSearch && 'border-[#001B51]'
          )}
        />

        {/* Debug: Loading / Clear button */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Loader2 className="w-4 h-4 text-[#001B51] animate-spin" />
            </motion.div>
          ) : hasActiveSearch ? (
            <motion.div
              key="clear"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="w-3 h-3 text-gray-400 hover:text-[#001B51]" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Debug: Search results count */}
      <AnimatePresence>
        {hasActiveSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">
                  {searchResults.length === maxResults
                    ? `${searchResults.length}+ results`
                    : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
                </span>

                {searchResults.length === 0 && (
                  <span className="text-[#DC2626] font-bold">No matches</span>
                )}

                {searchResults.length > 0 && (
                  <span className="text-[#059669] font-bold">
                    ✓ Found
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
