'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatPercentWhole } from '@/lib/utils';
import type { TaskProgressData } from '@/types/dashboard';

export interface TaskProgressWidgetProps {
  progress: TaskProgressData;
  isLoading?: boolean;
}

const STATUS_CONFIG = [
  { key: 'completed', label: 'Completed', color: 'bg-[#059669]' },
  { key: 'inProgress', label: 'In Progress', color: 'bg-[#3B82F6]' },
  { key: 'blocked', label: 'Blocked', color: 'bg-[#F59E0B]' },
  { key: 'overdue', label: 'Overdue', color: 'bg-[#DC2626]' },
] as const;

function TaskProgressWidgetSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gray-200 rounded-lg w-8 h-8" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>

      {/* Progress Ring + Center Content */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-28 h-28 md:w-32 md:h-32 bg-gray-200 rounded-full" />
      </div>

      {/* Status Breakdown */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ percentage, size = 120, strokeWidth = 10 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#001B51"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl md:text-3xl font-black text-[#001B51]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {formatPercentWhole(percentage)}
        </motion.span>
        <span className="text-xs text-gray-500">Complete</span>
      </div>
    </div>
  );
}

function VelocityTrend({ trend }: { trend: number }) {
  const direction = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const trendColor =
    direction === 'up'
      ? 'text-[#059669]'
      : direction === 'down'
        ? 'text-[#DC2626]'
        : 'text-gray-500';

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
      <TrendIcon className="w-3 h-3" />
      <span>
        {direction !== 'neutral' && (direction === 'up' ? '+' : '')}
        {trend}%
      </span>
      <span className="text-gray-500 ml-0.5">velocity</span>
    </div>
  );
}

export function TaskProgressWidget({ progress, isLoading = false }: TaskProgressWidgetProps) {
  console.log('[TaskProgressWidget] Rendering:', { progress, isLoading });

  if (isLoading) {
    return <TaskProgressWidgetSkeleton />;
  }

  return (
    <Link href="/app/tasks" className="block h-full">
      <motion.div
        className={cn(
          'bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5 h-full',
          'hover:border-[#001B51]/30 transition-colors cursor-pointer'
        )}
        whileHover={{
          scale: 1.02,
          boxShadow: '0 4px 12px rgba(0, 27, 81, 0.1)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#001B51]/10 border-2 border-[#001B51]/20 rounded-lg">
              <CheckSquare className="w-4 h-4 text-[#001B51]" />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">
              Task Progress
            </span>
          </div>
          {progress.velocityTrend !== 0 && (
            <VelocityTrend trend={progress.velocityTrend} />
          )}
        </div>

        {/* Progress Ring */}
        <div className="flex flex-col items-center mb-4">
          <ProgressRing
            percentage={progress.completionRate}
            size={120}
            strokeWidth={10}
          />
          <p className="mt-2 text-xs text-gray-500">
            {progress.completed} of {progress.total} tasks
          </p>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2">
          {STATUS_CONFIG.map(({ key, label, color }) => {
            const count = progress[key as keyof TaskProgressData] as number;
            return (
              <motion.div
                key={key}
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: STATUS_CONFIG.findIndex(s => s.key === key) * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
                  <span className="text-xs md:text-sm text-gray-600">{label}</span>
                </div>
                <span className="text-xs md:text-sm font-semibold text-gray-900">{count}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </Link>
  );
}
