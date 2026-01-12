'use client';

import { useState } from 'react';
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
 * MaterialsList Component - Mobile PWA Optimized
 *
 * Paginated grid of MaterialCard components.
 *
 * Features:
 * - Paginated grid (12 materials per page)
 * - Mobile-friendly pagination controls (touch-optimized)
 * - Loading skeleton during fetch
 * - Empty state when no materials
 * - Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
 *
 * Design Principles:
 * - 44px+ touch targets on pagination buttons
 * - Active states for touch feedback
 * - Construction theme styling
 *
 * @component
 */
export function MaterialsList({
  initialMaterials = [],
  initialPage = 1,
  initialTotalPages = 1,
  className = '',
}: MaterialsListProps) {
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
          'bg-white rounded-xl overflow-hidden',
          'border-2 border-gray-200 shadow-sm p-8 md:p-12',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-[#001B51] mb-2">
            No Materials Linked
          </h3>
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
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#001B51] flex items-center justify-center">
          <Package className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
            Linked Materials
          </h3>
          <p className="text-xs text-gray-500">
            {materials.length} of {totalPages * 12}+ materials
          </p>
        </div>
      </div>

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

      {/* Pagination Controls - Mobile Optimized */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={page === 1 || isLoading}
            className={cn(
              'h-12 px-4 rounded-xl font-semibold text-sm',
              'flex items-center gap-2',
              'transition-all duration-150',
              'active:scale-[0.98]',
              'border-2 border-gray-200',
              page === 1 || isLoading
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 active:bg-gray-50'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page Indicator */}
          <div className="flex items-center gap-2 px-4 h-12 bg-gray-50 rounded-xl border-2 border-gray-200">
            <span className="text-sm font-bold text-[#001B51]">
              {page}
            </span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-600">
              {totalPages}
            </span>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={page === totalPages || isLoading}
            className={cn(
              'h-12 px-4 rounded-xl font-semibold text-sm',
              'flex items-center gap-2',
              'transition-all duration-150',
              'active:scale-[0.98]',
              'border-2 border-gray-200',
              page === totalPages || isLoading
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 active:bg-gray-50'
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
