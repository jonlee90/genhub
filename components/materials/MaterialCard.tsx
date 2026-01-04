'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleTracking } from '@/app/actions/materials';
import type { MaterialWithStats } from '@/app/actions/materials';
import { PriceChangeIndicator } from './PriceChangeIndicator';

interface MaterialCardProps {
  material: MaterialWithStats;
  showPriceChange?: boolean;
  priceChangePercent?: number | null;
  onTrackingChange?: () => void;
  className?: string;
}

/**
 * MaterialCard Component
 *
 * Reusable card displaying:
 * - Product image or placeholder icon
 * - Product name (truncated)
 * - Category badge
 * - Stats (Total Quantity, Task Count)
 * - Price + Stock status
 * - Track/Untrack button with optimistic UI
 *
 * Features:
 * - Optimistic UI updates
 * - Error handling with rollback
 * - Loading state
 *
 * @component
 */
export function MaterialCard({
  material,
  showPriceChange = false,
  priceChangePercent,
  onTrackingChange,
  className = '',
}: MaterialCardProps) {
  console.log('[MaterialCard] Rendering material:', material.product_name);

  const [isTracked, setIsTracked] = useState(material.is_tracked);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTracking = async () => {
    const previousState = isTracked;
    setIsTracked(!isTracked); // Optimistic update
    setError(null);

    setIsLoading(true);
    const result = await toggleTracking(material.material_id, !isTracked);
    setIsLoading(false);

    if (!result.success) {
      // Rollback on error
      setIsTracked(previousState);
      setError(result.error || 'Failed to update tracking');
      console.error('[MaterialCard] Toggle tracking error:', result.error);
    } else {
      console.log('[MaterialCard] Tracking toggled successfully');
      onTrackingChange?.();
    }
  };

  return (
    <div
      className={cn(
        'border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-all',
        'bg-white',
        className
      )}
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
      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
        {material.product_name}
      </h3>

      {/* SKU */}
      {material.sku && (
        <p className="text-xs text-gray-500 mb-2">SKU: {material.sku}</p>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">Quantity</span>
          <span className="font-bold text-gray-900">{material.total_quantity}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs">Tasks</span>
          <span className="font-bold text-gray-900">{material.task_count}</span>
        </div>
      </div>

      {/* Price & Stock */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-bold text-gray-900">
            ${material.unit_price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">{material.stock_status || 'Unknown'}</p>
        </div>
        {showPriceChange && (
          <PriceChangeIndicator percent={priceChangePercent} />
        )}
      </div>

      {/* Track/Untrack Button */}
      <button
        onClick={handleToggleTracking}
        disabled={isLoading}
        className={cn(
          'w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2',
          isTracked
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-[#001B51] text-white hover:bg-[#002B71]',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isTracked ? (
          <>
            <EyeOff className="w-4 h-4" />
            Untrack
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            Track
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
