'use client';

import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  AlertCircle,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MaterialSummaryStats } from '@/app/actions/materials';

interface MaterialSummaryProps {
  stats: MaterialSummaryStats;
  trackedCount: number;
  className?: string;
}

/**
 * MaterialSummary Component - Mobile PWA Optimized
 *
 * A premium, mobile-first material analytics card designed for construction
 * field workers. Features touch-optimized interactions, high contrast
 * for outdoor visibility, and a clean visual hierarchy.
 *
 * Design Principles:
 * - Mobile-first with 44px+ touch targets
 * - High contrast for outdoor/bright sun visibility
 * - Clear visual hierarchy with scannable stats
 * - Native app feel with smooth transitions
 * - Construction-themed with GenHub design system
 *
 * Pattern: Follows ProjectTaskSummary card layout
 *
 * @component
 */
export function MaterialSummary({
  stats,
  trackedCount,
  className = '',
}: MaterialSummaryProps) {
  // Calculate utilization percentage
  const trackingUtilization = (trackedCount / 10) * 100;
  const isNearLimit = trackingUtilization > 70;
  const hasPriceIncreases = stats.price_increases_last_7_days > 0;

  return (
    <div
      className={cn(
        'bg-white rounded-xl overflow-hidden',
        'border-2 border-gray-200 shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#001B51] flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
              Material Summary
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {stats.total_materials_linked} materials linked
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              hasPriceIncreases
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            )}
          >
            {hasPriceIncreases ? 'Price Alert' : 'Stable'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Progress Bars Section */}
        <div className="space-y-4 mb-5">
          {/* Tracking Utilization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tracking Slots
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  isNearLimit ? 'text-[#F59E0B]' : 'text-[#001B51]'
                )}
              >
                {trackedCount}/10
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  isNearLimit ? 'bg-[#F59E0B]' : 'bg-[#001B51]'
                )}
                style={{ width: `${trackingUtilization}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid - 3 columns on mobile, responsive */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Total Materials */}
          <StatCard
            icon={Boxes}
            label="Total"
            value={stats.total_materials_linked}
            subtext="Linked"
            variant="neutral"
          />

          {/* Estimated Cost */}
          <StatCard
            icon={DollarSign}
            label="Est. Cost"
            value={`$${formatCompactNumber(stats.total_estimated_cost)}`}
            subtext="Total"
            variant="neutral"
          />

          {/* Lead Time */}
          <StatCard
            icon={Clock}
            label="Lead Time"
            value={stats.average_lead_time_days}
            subtext="Avg Days"
            variant="neutral"
          />
        </div>

        {/* Status Indicators Grid - 2 columns */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Price Increases */}
          <AlertCard
            icon={TrendingUp}
            label="Price Increases"
            value={stats.price_increases_last_7_days}
            subtext="Last 7 days"
            variant={hasPriceIncreases ? 'danger' : 'success'}
          />

          {/* Tracked Materials */}
          <AlertCard
            icon={Eye}
            label="Tracked"
            value={trackedCount}
            subtext="Watchlist"
            variant={trackedCount > 0 ? 'success' : 'neutral'}
          />
        </div>

        {/* Price Alert Banner */}
        {hasPriceIncreases && (
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl',
              'transition-all duration-200',
              'bg-amber-50 border border-amber-200'
            )}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {stats.price_increases_last_7_days} price increase{stats.price_increases_last_7_days !== 1 ? 's' : ''} detected
              </p>
              <p className="text-xs mt-0.5 text-amber-600">
                Review tracked materials for updates
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatCard - Compact stat display
 */
interface StatCardProps {
  icon: typeof Package;
  label: string;
  value: string | number;
  subtext: string;
  variant: 'neutral' | 'success' | 'danger' | 'warning';
}

function StatCard({ icon: Icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-200 min-h-[76px]">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <span className="text-base font-bold text-[#001B51] leading-tight">
        {value}
      </span>
      <span className="text-[10px] text-gray-500 mt-0.5">{subtext}</span>
    </div>
  );
}

/**
 * AlertCard - Status indicator with color-coded dot
 */
interface AlertCardProps {
  icon: typeof TrendingUp;
  label: string;
  value: number;
  subtext: string;
  variant: 'success' | 'danger' | 'warning' | 'neutral';
}

function AlertCard({ icon: Icon, label, value, subtext, variant }: AlertCardProps) {
  const dotColors = {
    success: 'bg-[#059669]',
    danger: 'bg-[#DC2626]',
    warning: 'bg-[#F59E0B]',
    neutral: 'bg-gray-400',
  };

  const getDotColor = () => {
    if (variant === 'danger' && value === 0) return dotColors.success;
    if (variant === 'success' && value === 0) return dotColors.neutral;
    return dotColors[variant];
  };

  return (
    <div className="flex flex-col p-3 rounded-xl min-h-[76px] bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', getDotColor())} />
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold leading-tight text-[#001B51]">
        {value}
      </span>
      <span className="text-[10px] mt-0.5 text-gray-500">{subtext}</span>
    </div>
  );
}

/**
 * Format large numbers in compact form (1K, 1.2M, etc.)
 */
function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}
