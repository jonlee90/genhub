'use client';

/**
 * OwnerDataTable Component
 *
 * Responsive data display component.
 *
 * Features:
 * - Generic TypeScript interface <T>
 * - Desktop (≥768px): Semantic table with sticky header
 * - Mobile (<768px): Card grid using renderCard prop
 * - SearchInput integration with 300ms debounce
 * - Empty state with icon + title + description
 * - Loading skeleton (table on desktop, cards on mobile)
 * - Column.hiddenOnMobile support
 * - Stagger animation for mobile cards (50ms delay)
 * - Accessible semantic HTML
 * - 2px border, rounded-lg, shadow-construction
 */

import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/mobile/SearchInput';

interface Column<T> {
  /** Field key */
  key: keyof T | string;

  /** Column header text */
  header: string;

  /** Custom render function */
  render?: (item: T) => React.ReactNode;

  /** Hide on mobile? */
  hiddenOnMobile?: boolean;

  /** Sortable? (future enhancement) */
  sortable?: boolean;
}

interface OwnerDataTableProps<T> {
  /** Data array */
  data: T[];

  /** Column definitions */
  columns: Column<T>[];

  /** Unique key field */
  keyField: keyof T;

  /** Empty state config */
  emptyState: {
    icon: LucideIcon;
    title: string;
    description: string;
  };

  /** Enable search? */
  searchable?: boolean;

  /** Fields to search */
  searchKeys?: (keyof T)[];

  /** Loading state */
  isLoading?: boolean;

  /** Row click handler */
  onRowClick?: (item: T) => void;

  /** Mobile card renderer */
  renderCard?: (item: T) => React.ReactNode;

  /** Card skeleton component (for mobile loading state) */
  CardSkeleton?: React.ComponentType;

  /** Additional className */
  className?: string;
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="hidden md:block border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-4">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardSkeletonGrid({ CardSkeleton }: { CardSkeleton?: React.ComponentType }) {
  // Default skeleton if no custom provided
  const DefaultSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );

  const SkeletonComponent = CardSkeleton || DefaultSkeleton;

  return (
    <div className="md:hidden grid grid-cols-1 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        {description}
      </p>
    </div>
  );
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms delay between cards
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
};

export function OwnerDataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  emptyState,
  searchable = false,
  searchKeys = [],
  isLoading = false,
  onRowClick,
  renderCard,
  CardSkeleton,
  className,
}: OwnerDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      return searchKeys.some((key) => {
        const value = item[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchable, searchKeys]);

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        {searchable && (
          <div className="mb-4">
            <SearchInput
              placeholder="Search..."
              disabled
              className="w-full"
            />
          </div>
        )}
        <TableSkeleton columns={columns.length} />
        <CardSkeletonGrid CardSkeleton={CardSkeleton} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Input */}
      {searchable && (
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
            debounce={300}
            className="w-full"
          />
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 ? (
        <EmptyState {...emptyState} />
      ) : (
        <>
          {/* Desktop Table (≥768px) */}
          <div className="hidden md:block border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={String(column.key)}
                        scope="col"
                        className={cn(
                          'px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider',
                          column.hiddenOnMobile && 'hidden md:table-cell'
                        )}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map((item) => (
                    <tr
                      key={String(item[keyField])}
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        'transition-colors duration-150',
                        onRowClick &&
                          'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700'
                      )}
                    >
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={cn(
                            'px-4 py-4 text-sm text-gray-900 dark:text-gray-100',
                            column.hiddenOnMobile && 'hidden md:table-cell'
                          )}
                        >
                          {column.render
                            ? column.render(item)
                            : String(item[column.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid (<768px) */}
          {renderCard && (
            <motion.div
              className="md:hidden grid grid-cols-1 gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredData.map((item) => (
                <motion.div key={String(item[keyField])} variants={cardVariants}>
                  {renderCard(item)}
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
