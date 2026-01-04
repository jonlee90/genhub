'use client';

import { Boxes, DollarSign, TrendingUp, Clock, Eye } from 'lucide-react';
import type { MaterialSummaryStats } from '@/app/actions/materials';

interface MaterialSummaryProps {
  stats: MaterialSummaryStats;
  trackedCount: number;
  className?: string;
}

/**
 * MaterialSummary Component
 *
 * Displays 5-card summary grid for materials dashboard:
 * 1. Total Materials Linked
 * 2. Total Estimated Cost
 * 3. Price Increases (7d)
 * 4. Average Lead Time
 * 5. Tracked Materials Count
 *
 * Pattern: Follows ProjectTaskSummary 5-card grid layout
 *
 * @component
 */
export function MaterialSummary({
  stats,
  trackedCount,
  className = '',
}: MaterialSummaryProps) {
  console.log('[MaterialSummary] Rendering with stats:', stats, 'tracked:', trackedCount);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      {/* Card 1: Total Materials Linked */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-blue-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#001B51] rounded-lg">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Total Materials
            </p>
            <p className="text-2xl font-black text-gray-900">
              {stats.total_materials_linked}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Linked to tasks
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Total Estimated Cost */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-green-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#059669] rounded-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Estimated Cost
            </p>
            <p className="text-2xl font-black text-gray-900">
              ${stats.total_estimated_cost.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Total value
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: Price Increases (7d) */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-red-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#DC2626] rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Price Increases
            </p>
            <p className="text-2xl font-black text-gray-900">
              {stats.price_increases_last_7_days}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Last 7 days
            </p>
          </div>
        </div>
      </div>

      {/* Card 4: Average Lead Time */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-gray-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#3C3C3C] rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Avg Lead Time
            </p>
            <p className="text-2xl font-black text-gray-900">
              {stats.average_lead_time_days}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Days
            </p>
          </div>
        </div>
      </div>

      {/* Card 5: Tracked Materials */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-blue-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#001B51] rounded-lg">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tracked
            </p>
            <p className="text-2xl font-black text-gray-900">
              {trackedCount}/10
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Watchlist
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
