'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Configuration for a single filter dropdown
 */
export interface FilterConfig {
  /** Unique name for the filter */
  name: string;
  /** Current selected value */
  value: string;
  /** Handler when value changes */
  onChange: (value: string) => void;
  /** Available options */
  options: { label: string; value: string }[];
  /** Placeholder text */
  placeholder?: string;
  /** Column span: controls grid layout width */
  colSpan?: 'full' | 'half' | 'third' | 'auto';
}

/**
 * Configuration for search input
 */
export interface SearchConfig {
  /** Search placeholder text */
  placeholder: string;
  /** Current search value */
  value: string;
  /** Handler when search changes */
  onChange: (value: string) => void;
  /** Column span for search (default: auto) */
  colSpan?: 'full' | 'half' | 'third' | 'auto';
}

export interface FilterBarProps {
  /** Search input configuration (optional) */
  searchConfig?: SearchConfig;
  /** Array of filter dropdown configurations */
  filters?: FilterConfig[];
  /** Custom content (e.g., ProjectFilterHeader) */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilterBar Component
 *
 * Reusable filter bar with construction theme styling.
 * Supports search input, multiple filter dropdowns, and custom content.
 *
 * Features:
 * - Construction theme with industrial header
 * - Responsive grid layout
 * - Sticky positioning on mobile
 * - Touch-friendly inputs (h-10 md:h-11)
 *
 * @example
 * ```tsx
 * <FilterBar
 *   searchConfig={{
 *     placeholder: 'Search materials...',
 *     value: searchQuery,
 *     onChange: setSearchQuery,
 *     colSpan: 'half'
 *   }}
 *   filters={[
 *     {
 *       name: 'project',
 *       value: projectFilter,
 *       onChange: setProjectFilter,
 *       options: [
 *         { label: 'All Projects', value: 'all' },
 *         ...projects.map(p => ({ label: p.name, value: p.id }))
 *       ],
 *       placeholder: 'All Projects'
 *     }
 *   ]}
 * />
 * ```
 */
export function FilterBar({
  searchConfig,
  filters = [],
  children,
  className,
}: FilterBarProps) {
  console.log('[FilterBar] Rendering with:', {
    hasSearch: !!searchConfig,
    filterCount: filters.length,
    hasChildren: !!children,
  });

  // Helper to get column span classes
  const getColSpanClass = (colSpan?: 'full' | 'half' | 'third' | 'auto'): string => {
    switch (colSpan) {
      case 'full':
        return 'sm:col-span-2 lg:col-span-full';
      case 'half':
        return 'sm:col-span-2';
      case 'third':
        return 'sm:col-span-1 lg:col-span-1';
      case 'auto':
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      "relative sticky top-0 md:relative z-40 md:z-auto bg-white md:bg-transparent",
      className
    )}>

      <div className="bg-white border-2 border-gray-200 rounded-lg md:rounded-xl shadow-construction p-3 md:p-5">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
          <h3 className="text-sm md:text-base font-black text-construction-blue uppercase tracking-wider">
            Filters
          </h3>
        </div>

        {/* Custom children (e.g., ProjectFilterHeader) */}
        {children && (
          <div className="mb-3 md:mb-4">
            {children}
          </div>
        )}

        {/* Dynamic grid based on content */}
        {(searchConfig || filters.length > 0) && (
          <div className={cn(
            "grid gap-3 md:gap-4",
            // Determine grid columns based on filter count
            filters.length === 0 && searchConfig ? "grid-cols-1" :
            filters.length === 1 && searchConfig ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
            filters.length === 2 && searchConfig ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
            filters.length === 3 && searchConfig ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
            filters.length >= 4 && searchConfig ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
            filters.length === 1 ? "grid-cols-1 sm:grid-cols-2" :
            filters.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            filters.length >= 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
            "grid-cols-1"
          )}>
            {/* Search Input */}
            {searchConfig && (
              <div className={cn(
                "relative",
                getColSpanClass(searchConfig.colSpan || (filters.length > 0 ? 'half' : 'full'))
              )}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={searchConfig.placeholder}
                  value={searchConfig.value}
                  onChange={(e) => searchConfig.onChange(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-construction-blue transition-colors h-10 md:h-11 font-medium"
                />
              </div>
            )}

            {/* Filter Dropdowns */}
            {filters.map((filter) => (
              <div
                key={filter.name}
                className={getColSpanClass(filter.colSpan)}
              >
                <Select
                  value={filter.value}
                  onValueChange={filter.onChange}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue h-10 md:h-11 font-medium">
                    <SelectValue placeholder={filter.placeholder || `Select ${filter.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
