'use client';

import { CheckCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    borderColor: 'border-[#059669]/20',
    iconColor: 'text-[#059669]',
    textColor: 'text-[#059669]',
  },
  atRisk: {
    label: 'At Risk',
    icon: AlertTriangle,
    bgColor: 'bg-[#F59E0B]/10',
    borderColor: 'border-[#F59E0B]/20',
    iconColor: 'text-[#F59E0B]',
    textColor: 'text-[#F59E0B]',
  },
  overdue: {
    label: 'Overdue',
    icon: XCircle,
    bgColor: 'bg-[#DC2626]/10',
    borderColor: 'border-[#DC2626]/20',
    iconColor: 'text-[#DC2626]',
    textColor: 'text-[#DC2626]',
  },
} as const;

function ScheduleHealthSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-200 rounded-lg w-10 h-10" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>

      {/* On-time percentage highlight */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="h-8 w-20 bg-gray-200 rounded mx-auto mb-1" />
        <div className="h-3 w-24 bg-gray-200 rounded mx-auto" />
      </div>

      {/* Status rows */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-8 bg-gray-200 rounded" />
              <div className="h-4 w-12 bg-gray-200 rounded" />
            </div>
          </div>
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
    <motion.div
      className={cn(
        'flex items-center justify-between p-2 md:p-3 rounded-lg border-2 transition-colors',
        config.bgColor,
        config.borderColor
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className={cn('p-1.5 md:p-2 rounded-lg', config.bgColor)}>
          <Icon className={cn('w-4 h-4 md:w-5 md:h-5', config.iconColor)} />
        </div>
        <span className="text-sm md:text-base font-medium text-gray-700">
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <span className={cn('text-lg md:text-xl font-bold', config.textColor)}>
          {count}
        </span>
        <span className="text-xs md:text-sm text-gray-500 min-w-[45px] text-right">
          ({percentage}%)
        </span>
      </div>
    </motion.div>
  );
}

export function ScheduleHealthWidget({
  health,
  isLoading = false,
}: ScheduleHealthWidgetProps) {
  console.log('[ScheduleHealthWidget] Rendering:', { health, isLoading });

  if (isLoading) {
    return <ScheduleHealthSkeleton />;
  }

  // Calculate total and percentages
  const total = health.onTime + health.atRisk + health.overdue;
  const onTimePercent = total > 0 ? Math.round((health.onTime / total) * 100) : 0;
  const atRiskPercent = total > 0 ? Math.round((health.atRisk / total) * 100) : 0;
  const overduePercent = total > 0 ? Math.round((health.overdue / total) * 100) : 0;

  // Use the pre-calculated onTimePercent if available, otherwise use calculated
  const displayOnTimePercent = health.onTimePercent ?? onTimePercent;

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
    <motion.div
      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-[#001B51]/30 transition-colors h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#001B51]/10 rounded-lg border-2 border-[#001B51]/20">
          <Calendar className="w-5 h-5 text-[#001B51]" />
        </div>
        <h3 className="text-sm md:text-base font-semibold text-gray-900 uppercase tracking-wide">
          Schedule Health
        </h3>
      </div>

      {/* On-time percentage highlight */}
      <div
        className={cn(
          'mb-4 p-3 md:p-4 rounded-lg border-2 text-center',
          healthColors[healthStatus].bg,
          healthColors[healthStatus].border
        )}
      >
        <div className={cn('text-3xl md:text-4xl font-black', healthColors[healthStatus].text)}>
          {displayOnTimePercent}%
        </div>
        <div className="text-xs md:text-sm text-gray-600 font-medium">
          On-Time Rate
        </div>
      </div>

      {/* Status rows */}
      <div className="space-y-2 md:space-y-3">
        <StatusRow status="onTime" count={health.onTime} percentage={onTimePercent} />
        <StatusRow status="atRisk" count={health.atRisk} percentage={atRiskPercent} />
        <StatusRow status="overdue" count={health.overdue} percentage={overduePercent} />
      </div>

      {/* Total count footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total Tasks</span>
          <span className="font-semibold text-gray-900">{total}</span>
        </div>
      </div>
    </motion.div>
  );
}
