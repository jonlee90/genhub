'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Package, Loader2, EyeOff, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleTracking } from '@/app/actions/materials';
import type { TrackedMaterial } from '@/app/actions/materials';

interface TrackedMaterialsCarouselProps {
  materials: TrackedMaterial[];
  onTrackingChange?: () => void;
  className?: string;
}

/**
 * TrackedMaterialsCarousel Component - Mobile PWA Optimized
 *
 * Horizontal scrolling carousel showing up to 10 tracked materials.
 *
 * Features:
 * - Smooth horizontal scrolling with snap
 * - Navigation arrows (ChevronLeft, ChevronRight)
 * - Each card shows: image, name, SKU, current price, price change indicator
 * - Untrack button with optimistic UI
 * - Empty state when no tracked materials
 * - Touch-friendly 44px+ tap targets
 *
 * Design Principles:
 * - Mobile-first with snap scrolling
 * - High contrast for outdoor visibility
 * - Active states for touch feedback
 *
 * @component
 */
export function TrackedMaterialsCarousel({
  materials = [],
  onTrackingChange,
  className = '',
}: TrackedMaterialsCarouselProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 280; // slightly less than card width for smooth UX
    container.scrollTo({
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

  // Price change icon and color
  const getPriceChangeDisplay = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined || percent === 0) {
      return { Icon: Minus, color: 'text-gray-500', bg: 'bg-gray-100', label: '0%' };
    }
    if (percent > 0) {
      return { Icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', label: `+${percent.toFixed(1)}%` };
    }
    return { Icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50', label: `${percent.toFixed(1)}%` };
  };

  // Empty state
  if (materials.length === 0) {
    return (
      <div
        className={cn(
          'bg-white rounded-xl overflow-hidden',
          'border-2 border-gray-200 shadow-sm p-6',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <Eye className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-[#001B51] mb-1.5">
            No Tracked Materials
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            Track materials to monitor price changes and stock status
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#001B51] flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
              Watchlist
            </h3>
            <p className="text-xs text-gray-500">
              {materials.length}/10 tracked
            </p>
          </div>
        </div>

        {/* Desktop Navigation Arrows */}
        {materials.length > 2 && (
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className={cn(
                'w-10 h-10 rounded-lg bg-white border-2 border-gray-200',
                'flex items-center justify-center',
                'transition-all duration-150',
                'active:scale-95 active:bg-gray-50'
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={cn(
                'w-10 h-10 rounded-lg bg-white border-2 border-gray-200',
                'flex items-center justify-center',
                'transition-all duration-150',
                'active:scale-95 active:bg-gray-50'
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex gap-4 overflow-x-auto pb-2',
          '-mx-4 px-4', // extend to edges on mobile
          'snap-x snap-mandatory',
          'scrollbar-hide'
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {materials.map((material) => {
          const priceChange = getPriceChangeDisplay(material.price_change_percent);

          return (
            <div
              key={material.material_id}
              className={cn(
                'flex-shrink-0 w-[280px] snap-start',
                'bg-white rounded-xl overflow-hidden',
                'border-2 border-gray-200 shadow-sm',
                'transition-all duration-200',
                'active:scale-[0.99]'
              )}
            >
              {/* Image */}
              <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                {material.product_image_url ? (
                  <Image
                    src={material.product_image_url}
                    alt={material.product_name}
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-300" />
                )}

                {/* Price Change Badge */}
                <div
                  className={cn(
                    'absolute top-2 right-2 px-2 py-1 rounded-lg',
                    'flex items-center gap-1',
                    'text-xs font-bold',
                    priceChange.bg,
                    priceChange.color
                  )}
                >
                  <priceChange.Icon className="w-3.5 h-3.5" />
                  {priceChange.label}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Product Name */}
                <h4 className="font-bold text-[#001B51] line-clamp-2 min-h-[2.5rem] text-sm leading-snug">
                  {material.product_name}
                </h4>

                {/* SKU */}
                {material.sku && (
                  <p className="text-xs text-gray-500 font-mono">SKU: {material.sku}</p>
                )}

                {/* Current Price & Stock */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-xs text-gray-500 block">Current Price</span>
                    <span className="text-lg font-black text-[#001B51]">
                      ${material.current_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Stock</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {material.stock_status || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Untrack Button */}
                <button
                  onClick={() => handleUntrack(material.material_id)}
                  disabled={loadingId === material.material_id}
                  className={cn(
                    'w-full h-11 px-4 rounded-xl font-semibold text-sm',
                    'flex items-center justify-center gap-2',
                    'bg-gray-100 text-gray-700 border-2 border-gray-200',
                    'transition-all duration-150',
                    'active:scale-[0.98] active:bg-gray-200',
                    'disabled:opacity-50 disabled:pointer-events-none'
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
