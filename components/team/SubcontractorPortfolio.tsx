"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import type { SubcontractorsRow } from "@/types/db/tables/companies";
import Users from "lucide-react/icons/users";
import CheckCircle from "lucide-react/icons/check-circle";
import HardHat from "lucide-react/icons/hard-hat";

interface SubcontractorPortfolioProps {
  subcontractors: SubcontractorsRow[];
  stats: {
    total: number;
    active: number;
  };
  compact?: boolean;
}

export const SubcontractorPortfolio = memo(function SubcontractorPortfolio({
  subcontractors,
  stats,
}: SubcontractorPortfolioProps) {
  const uniqueTrades = new Set(
    subcontractors
      .filter((s) => s.is_active && s.trade_specialization)
      .map((s) => s.trade_specialization),
  ).size;

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl overflow-hidden",
        "border-2 border-gray-200 dark:border-gray-700 shadow-sm",
        "transition-all duration-200",
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/50 to-white dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
              Subcontractor Details
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.active} active subcontractor{stats.active !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            icon={Users}
            label="Total"
            value={stats.total}
            subtext="Subcontractors"
          />
          <StatCard
            icon={CheckCircle}
            label="Active"
            value={stats.active}
            subtext="On Roster"
            variant="success"
            showStatusDot
          />
          <StatCard
            icon={HardHat}
            label="Trades"
            value={uniqueTrades}
            subtext="Specializations"
          />
        </div>
      </div>
    </div>
  );
});
