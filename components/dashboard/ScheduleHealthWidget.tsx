"use client";

import { CheckCircle, AlertTriangle, XCircle, Calendar } from "lucide-react";
import { cn, formatPercentWhole } from "@/lib/utils";
import {
  WidgetCard,
  WidgetHeader,
  WidgetSkeleton,
} from "@/components/ui/WidgetCard";
import type { ScheduleHealthData } from "@/types/dashboard";

export interface ScheduleHealthWidgetProps {
  health: ScheduleHealthData;
  isLoading?: boolean;
}

const statusConfig = {
  onTime: {
    label: "On Time",
    icon: CheckCircle,
    bgColor: "bg-[#059669]/10 dark:bg-green-500/20",
    iconColor: "text-[#059669] dark:text-green-400",
    textColor: "text-[#059669] dark:text-green-400",
  },
  atRisk: {
    label: "At Risk",
    icon: AlertTriangle,
    bgColor: "bg-[#F59E0B]/10 dark:bg-yellow-500/20",
    iconColor: "text-[#F59E0B] dark:text-yellow-400",
    textColor: "text-[#F59E0B] dark:text-yellow-400",
  },
  overdue: {
    label: "Overdue",
    icon: XCircle,
    bgColor: "bg-[#DC2626]/10 dark:bg-red-500/20",
    iconColor: "text-[#DC2626] dark:text-red-400",
    textColor: "text-[#DC2626] dark:text-red-400",
  },
} as const;

function ScheduleHealthSkeleton() {
  return (
    <WidgetSkeleton>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-1" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    </WidgetSkeleton>
  );
}

interface StatusRowProps {
  status: keyof typeof statusConfig;
  count: number;
  percentage: number;
}

function StatusRow({ status, count, percentage }: StatusRowProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        "min-h-[52px]",
        config.bgColor,
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", config.iconColor)} />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-lg font-bold", config.textColor)}>
          {count}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
          ({formatPercentWhole(percentage)})
        </span>
      </div>
    </div>
  );
}

export function ScheduleHealthWidget({
  health,
  isLoading = false,
}: ScheduleHealthWidgetProps) {
  if (isLoading) {
    return <ScheduleHealthSkeleton />;
  }

  // Calculate total and percentages
  const total = health.onTime + health.atRisk + health.overdue;
  const onTimePercentRaw = total > 0 ? (health.onTime / total) * 100 : 0;
  const atRiskPercentRaw = total > 0 ? (health.atRisk / total) * 100 : 0;
  const overduePercentRaw = total > 0 ? (health.overdue / total) * 100 : 0;

  // Use the pre-calculated onTimePercent if available, otherwise use calculated
  const displayOnTimePercent = health.onTimePercent ?? onTimePercentRaw;

  // Determine overall health status for header styling
  const getHealthStatus = () => {
    if (displayOnTimePercent >= 80) return "good";
    if (displayOnTimePercent >= 50) return "warning";
    return "danger";
  };

  const healthStatus = getHealthStatus();
  const healthColors = {
    good: {
      bg: "bg-[#059669]/10 dark:bg-green-500/20",
      border: "border-[#059669]/30 dark:border-green-500/30",
      text: "text-[#059669] dark:text-green-400",
    },
    warning: {
      bg: "bg-[#F59E0B]/10 dark:bg-yellow-500/20",
      border: "border-[#F59E0B]/30 dark:border-yellow-500/30",
      text: "text-[#F59E0B] dark:text-yellow-400",
    },
    danger: {
      bg: "bg-[#DC2626]/10 dark:bg-red-500/20",
      border: "border-[#DC2626]/30 dark:border-red-500/30",
      text: "text-[#DC2626] dark:text-red-400",
    },
  };

  return (
    <WidgetCard>
      <WidgetHeader icon={Calendar} title="Schedule" className="mb-4" />

      {/* On-time percentage highlight */}
      <div
        className={cn(
          "mb-4 p-4 rounded-lg border-2 text-center",
          healthColors[healthStatus].bg,
          healthColors[healthStatus].border,
        )}
      >
        <div
          className={cn("text-3xl font-black", healthColors[healthStatus].text)}
        >
          {formatPercentWhole(displayOnTimePercent)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">On-Time Rate</div>
      </div>

      {/* Status rows */}
      <div className="space-y-2">
        <StatusRow
          status="onTime"
          count={health.onTime}
          percentage={onTimePercentRaw}
        />
        <StatusRow
          status="atRisk"
          count={health.atRisk}
          percentage={atRiskPercentRaw}
        />
        <StatusRow
          status="overdue"
          count={health.overdue}
          percentage={overduePercentRaw}
        />
      </div>

      {/* Total count footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Total Tasks</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">{total}</span>
        </div>
      </div>
    </WidgetCard>
  );
}
