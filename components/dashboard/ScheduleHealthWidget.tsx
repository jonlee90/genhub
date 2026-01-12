'use client';

import { CheckCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import { cn, formatPercentWhole } from '@/lib/utils';
import type { ScheduleHealthData } from '@/types/dashboard';

export interface ScheduleHealthWidgetProps {
  health: ScheduleHealthData;
  isLoading?: boolean;
}

const statusConfig = {
  onTime: {
    label: 'On Time',
    icon: CheckCircle,
    bgColor: 'bg-[#059669]/10',
    iconColor: 'text-[#059669]',
    textColor: 'text-[#059669]',
  },
  atRisk: {
    label: 'At Risk',
    icon: AlertTriangle,
    bgColor: 'bg-[#F59E0B]/10',
    iconColor: 'text-[#F59E0B]',
    textColor: 'text-[#F59E0B]',
  },
  overdue: {
    label: 'Overdue',
    icon: XCircle,
    bgColor: 'bg-[#DC2626]/10',
    iconColor: 'text-[#DC2626]',
    textColor: 'text-[#DC2626]',
  },
} as const;

function ScheduleHealthSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 animate-pulse h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <div className="h-10 w-20 bg-gray-200 rounded mx-auto mb-1" />
        <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
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
        'flex items-center justify-between p-3 rounded-lg',
        'min-h-[52px]',
        config.bgColor
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('w-5 h-5', config.iconColor)} />
        <span className="text-sm font-semibold text-gray-700">
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-lg font-bold', config.textColor)}>
          {count}
        </span>
        <span className="text-xs text-gray-500 w-12 text-right">
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
    if (displayOnTimePercent >= 80) return 'good';
    if (displayOnTimePercent >= 50) return 'warning';
    return 'danger';
  };

  const healthStatus = getHealthStatus();
  const healthColors = {
    good: {
      bg: 'bg-[#059669]/10',
      border: 'border-[#059669]/30',
      text: 'text-[#059669]',
    },
    warning: {
      bg: 'bg-[#F59E0B]/10',
      border: 'border-[#F59E0B]/30',
      text: 'text-[#F59E0B]',
    },
    danger: {
      bg: 'bg-[#DC2626]/10',
      border: 'border-[#DC2626]/30',
      text: 'text-[#DC2626]',
    },
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#001B51]/10 rounded-lg">
          <Calendar className="w-5 h-5 text-[#001B51]" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Schedule
        </h3>
      </div>

      {/* On-time percentage highlight */}
      <div
        className={cn(
          'mb-4 p-4 rounded-lg border-2 text-center',
          healthColors[healthStatus].bg,
          healthColors[healthStatus].border
        )}
      >
        <div className={cn('text-3xl font-black', healthColors[healthStatus].text)}>
          {formatPercentWhole(displayOnTimePercent)}
        </div>
        <div className="text-sm text-gray-600 font-medium">
          On-Time Rate
        </div>
      </div>

      {/* Status rows */}
      <div className="space-y-2">
        <StatusRow status="onTime" count={health.onTime} percentage={onTimePercentRaw} />
        <StatusRow status="atRisk" count={health.atRisk} percentage={atRiskPercentRaw} />
        <StatusRow status="overdue" count={health.overdue} percentage={overduePercentRaw} />
      </div>

      {/* Total count footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 font-medium">Total Tasks</span>
          <span className="font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}
