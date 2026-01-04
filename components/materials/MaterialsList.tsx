'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTaskLinkedMaterials } from '@/app/actions/materials';
import type { MaterialWithStats } from '@/app/actions/materials';
import { MaterialCard } from './MaterialCard';
import { MaterialsListSkeleton } from './MaterialsListSkeleton';

interface MaterialsListProps {
  initialMaterials?: MaterialWithStats[];
  initialPage?: number;
  initialTotalPages?: number;
  className?: string;
}

/**
 * MaterialsList Component
 *
 * Paginated grid of MaterialCard components.
 *
 * Features:
 * - Paginated grid (12 materials per page)
 * - Pagination controls (Previous, Page X of Y, Next)
 * - Loading skeleton during fetch
 * - Empty state when no materials
 * - Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
 *
 * @component
 */
export function MaterialsList({
  initialMaterials = [],
  initialPage = 1,
  initialTotalPages = 1,
  className = '',
}: MaterialsListProps) {
  console.log('[MaterialsList] Initializing with', initialMaterials.length, 'materials');

  const [materials, setMaterials] = useState<MaterialWithStats[]>(initialMaterials);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMaterials = async (newPage: number) => {
    setIsLoading(true);
    const result = await getTaskLinkedMaterials(newPage, 12);
    setIsLoading(false);

    if (result.success && result.data) {
      setMaterials(result.data.materials);
      setPage(result.data.page);
      setTotalPages(result.data.totalPages);
      console.log('[MaterialsList] Loaded page', newPage, 'with', result.data.materials.length, 'materials');
    } else {
      console.error('[MaterialsList] Failed to fetch materials:', result.error);
    }
  };

  const handlePrevious = () => {
    if (page > 1) {
      fetchMaterials(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      fetchMaterials(page + 1);
    }
  };

  const handleTrackingChange = () => {
    // Refetch current page to update tracking status
    fetchMaterials(page);
  };

  // Empty state
  if (!isLoading && materials.length === 0) {
    return (
      <div
        className={cn(
          'border-2 border-gray-200 rounded-lg p-12 shadow-construction bg-white',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Materials Linked</h3>
          <p className="text-sm text-gray-600 max-w-md">
            Start by adding materials to your tasks. Materials linked to tasks will appear here
            for tracking and analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Materials Grid */}
      {isLoading ? (
        <MaterialsListSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {materials.map((material) => (
            <MaterialCard
              key={material.material_id}
              material={material}
              onTrackingChange={handleTrackingChange}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrevious}
            disabled={page === 1 || isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all',
              'border-2 border-gray-200',
              page === 1 || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="text-sm font-semibold text-gray-700">
            Page {page} of {totalPages}
          </div>

          <button
            onClick={handleNext}
            disabled={page === totalPages || isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all',
              'border-2 border-gray-200',
              page === totalPages || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
