"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface PriceChangeIndicatorProps {
  percent: number | null | undefined;
  className?: string;
}

/**
 * PriceChangeIndicator Component
 *
 * Displays price change with color-coded icons:
 * - Red TrendingUp for price increases
 * - Green TrendingDown for price decreases
 * - Gray Minus for no change or null
 *
 * @component
 */
export function PriceChangeIndicator({
  percent,
  className = "",
}: PriceChangeIndicatorProps) {
  // Handle no change or null/undefined
  if (percent === null || percent === undefined || percent === 0) {
    return (
      <div className={`flex items-center gap-1 text-gray-500 dark:text-gray-400 ${className}`}>
        <Minus className="w-4 h-4" />
        <span className="text-sm">No change</span>
      </div>
    );
  }

  const isPositive = percent > 0;
  const color = isPositive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-1 ${color} ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">
        {isPositive ? "+" : ""}
        {formatPercent(Math.abs(percent))}
      </span>
    </div>
  );
}
