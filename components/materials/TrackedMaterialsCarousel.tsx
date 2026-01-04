'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Package, Loader2, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleTracking } from '@/app/actions/materials';
import type { TrackedMaterial } from '@/app/actions/materials';
import { PriceChangeIndicator } from './PriceChangeIndicator';

interface TrackedMaterialsCarouselProps {
  materials: TrackedMaterial[];
  onTrackingChange?: () => void;
  className?: string;
}

/**
 * TrackedMaterialsCarousel Component
 *
 * Horizontal scrolling carousel showing up to 10 tracked materials.
 *
 * Features:
 * - Smooth horizontal scrolling
 * - Navigation arrows (ChevronLeft, ChevronRight)
 * - Each card shows: image, name, SKU, current price, price change indicator
 * - Untrack button with optimistic UI
 * - Empty state when no tracked materials
 *
 * @component
 */
export function TrackedMaterialsCarousel({
  materials = [],
  onTrackingChange,
  className = '',
}: TrackedMaterialsCarouselProps) {
  console.log('[TrackedMaterialsCarousel] Rendering with', materials?.length || 0, 'materials');

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('tracked-carousel');
    const scrollAmount = 300;
    container?.scrollTo({
      left: container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount),
      behavior: 'smooth',
    });
  };

  const handleUntrack = async (materialId: string) => {
    setLoadingId(materialId);
    const result = await toggleTracking(materialId, false);
    setLoadingId(null);

    if (result.success) {
      console.log('[TrackedMaterialsCarousel] Material untracked successfully');
      onTrackingChange?.();
    } else {
      console.error('[TrackedMaterialsCarousel] Untrack error:', result.error);
    }
  };

  // Empty state
  if (materials.length === 0) {
    return (
      <div
        className={cn(
          'border-2 border-gray-200 rounded-lg p-8 shadow-construction bg-white',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Package className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Tracked Materials</h3>
          <p className="text-sm text-gray-600">
            Track materials to monitor price changes and stock status
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Navigation Arrows */}
      {materials.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border-2 border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border-2 border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        id="tracked-carousel"
        className="flex gap-4 overflow-x-auto scrollbar-hide px-10 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {materials.map((material) => (
          <div
            key={material.material_id}
            className="flex-shrink-0 w-64 border-2 border-gray-200 rounded-lg p-4 shadow-construction bg-white hover:shadow-construction-lg transition-shadow"
          >
            {/* Image */}
            <div className="h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {material.product_image_url ? (
                <Image
                  src={material.product_image_url}
                  alt={material.product_name}
                  width={200}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Product Name */}
            <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
              {material.product_name}
            </h4>

            {/* SKU */}
            {material.sku && (
              <p className="text-xs text-gray-500 mb-2">SKU: {material.sku}</p>
            )}

            {/* Current Price */}
            <div className="mb-3">
              <p className="text-lg font-bold text-gray-900">
                ${material.current_price.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{material.stock_status || 'Unknown'}</p>
            </div>

            {/* Price Change Indicator */}
            <div className="mb-3">
              <PriceChangeIndicator percent={material.price_change_percent} />
            </div>

            {/* Untrack Button */}
            <button
              onClick={() => handleUntrack(material.material_id)}
              disabled={loadingId === material.material_id}
              className={cn(
                'w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2',
                'bg-gray-200 text-gray-700 hover:bg-gray-300',
                loadingId === material.material_id && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loadingId === material.material_id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Untrack
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
