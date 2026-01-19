"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { Package, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMaterialStockStatusStyle } from "@/lib/materials-ui";
import {
  toggleTracking,
  type MaterialWithStats,
} from "@/app/actions/materials";
import { PriceChangeIndicator } from "./PriceChangeIndicator";

interface MaterialCardProps {
  material: MaterialWithStats;
  showPriceChange?: boolean;
  priceChangePercent?: number | null;
  onTrackingChange?: () => void;
  className?: string;
}

/**
 * MaterialCard Component - Mobile PWA Optimized
 *
 * Touch-friendly card displaying material information with:
 * - Product image or placeholder icon
 * - Product name (truncated)
 * - Stats (Total Quantity, Task Count)
 * - Price + Stock status
 * - Track/Untrack button with optimistic UI
 *
 * Design Principles:
 * - Mobile-first with 44px+ touch targets
 * - High contrast for outdoor visibility
 * - Active states for touch feedback
 * - Optimistic UI updates
 *
 * @component
 */
export const MaterialCard = memo(function MaterialCard({
  material,
  showPriceChange = false,
  priceChangePercent,
  onTrackingChange,
  className = "",
}: MaterialCardProps) {
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
      setError(result.error || "Failed to update tracking");
    } else {
      onTrackingChange?.();
    }
  };

  const stockStatusStyle = getMaterialStockStatusStyle(material.stock_status);

  return (
    <div
      className={cn(
        "bg-white rounded-xl overflow-hidden",
        "border-2 border-gray-200 shadow-sm",
        "transition-all duration-200",
        "active:scale-[0.99] active:shadow-md",
        className,
      )}
    >
      {/* Image Header */}
      <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
        {material.product_image_url ? (
          <Image
            src={material.product_image_url}
            alt={material.product_name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Package className="w-14 h-14 text-gray-300" />
        )}

        {/* Tracked Badge */}
        {isTracked && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-[#001B51] text-white text-xs font-bold rounded-lg flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Tracked
          </div>
        )}

        {/* Stock Status Badge */}
        <div
          className={cn(
            "absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-lg border",
            stockStatusStyle,
          )}
        >
          {material.stock_status || "Unknown"}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-bold text-[#001B51] line-clamp-2 min-h-[2.75rem] text-base leading-snug">
          {material.product_name}
        </h3>

        {/* SKU */}
        {material.sku && (
          <p className="text-xs text-gray-500 font-mono">SKU: {material.sku}</p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
              Quantity
            </span>
            <span className="text-lg font-bold text-[#001B51]">
              {material.total_quantity}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
              Tasks
            </span>
            <span className="text-lg font-bold text-[#001B51]">
              {material.task_count}
            </span>
          </div>
        </div>

        {/* Price & Change */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500 block">Unit Price</span>
            <span className="text-xl font-black text-[#001B51]">
              ${material.unit_price.toFixed(2)}
            </span>
          </div>
          {showPriceChange && (
            <PriceChangeIndicator percent={priceChangePercent} />
          )}
        </div>

        {/* Track/Untrack Button - Touch-friendly */}
        <button
          onClick={handleToggleTracking}
          disabled={isLoading}
          className={cn(
            "w-full h-12 px-4 rounded-xl font-semibold text-sm",
            "flex items-center justify-center gap-2",
            "transition-all duration-150",
            "active:scale-[0.98]",
            "disabled:opacity-50 disabled:pointer-events-none",
            isTracked
              ? "bg-gray-100 text-gray-700 border-2 border-gray-200 active:bg-gray-200"
              : "bg-[#001B51] text-white active:bg-[#001B51]/90",
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isTracked ? (
            <>
              <EyeOff className="w-5 h-5" />
              Untrack
            </>
          ) : (
            <>
              <Eye className="w-5 h-5" />
              Track Material
            </>
          )}
        </button>

        {/* Error/Success Feedback */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}, areMaterialCardEqual);

function areMaterialCardEqual(
  prev: MaterialCardProps,
  next: MaterialCardProps,
): boolean {
  return (
    prev.material.material_id === next.material.material_id &&
    prev.material.product_name === next.material.product_name &&
    prev.material.sku === next.material.sku &&
    prev.material.unit_price === next.material.unit_price &&
    prev.material.stock_status === next.material.stock_status &&
    prev.material.product_image_url === next.material.product_image_url &&
    prev.material.total_quantity === next.material.total_quantity &&
    prev.material.task_count === next.material.task_count &&
    prev.material.is_tracked === next.material.is_tracked &&
    prev.showPriceChange === next.showPriceChange &&
    prev.priceChangePercent === next.priceChangePercent &&
    prev.className === next.className &&
    prev.onTrackingChange === next.onTrackingChange
  );
}
