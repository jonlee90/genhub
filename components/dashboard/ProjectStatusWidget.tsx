'use client';

import Link from 'next/link';
import { FolderKanban, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatPercent, formatPercentWhole } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ProjectStatusData } from '@/types/dashboard';

export interface ProjectStatusWidgetProps {
  status: ProjectStatusData;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: '#001B51',
    bgClass: 'bg-[#001B51]',
    textClass: 'text-[#001B51]',
    hoverClass: 'hover:bg-[#001B51]/10',
    filter: 'active',
  },
  onHold: {
    label: 'On Hold',
    color: '#F59E0B',
    bgClass: 'bg-[#F59E0B]',
    textClass: 'text-[#F59E0B]',
    hoverClass: 'hover:bg-[#F59E0B]/10',
    filter: 'on_hold',
  },
  completed: {
    label: 'Completed',
    color: '#059669',
    bgClass: 'bg-[#059669]',
    textClass: 'text-[#059669]',
    hoverClass: 'hover:bg-[#059669]/10',
    filter: 'completed',
  },
  archived: {
    label: 'Archived',
    color: '#9CA3AF',
    bgClass: 'bg-gray-400',
    textClass: 'text-gray-400',
    hoverClass: 'hover:bg-gray-100',
    filter: 'archived',
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function ProjectStatusWidgetSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>

      {/* Bar skeleton */}
      <div className="h-4 w-full bg-gray-200 rounded-full mb-4" />

      {/* Legend skeleton */}
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-8 bg-gray-200 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FolderKanban className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">No Projects Yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-[200px]">
        Create your first project to start tracking progress.
      </p>
      <Link href="/app/projects/new">
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </Link>
    </div>
  );
}

interface StatusBarProps {
  status: ProjectStatusData;
  total: number;
}

function StatusBar({ status, total }: StatusBarProps) {
  const statusKeys: StatusKey[] = ['active', 'onHold', 'completed', 'archived'];

  return (
    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
      {statusKeys.map((key) => {
        const count = status[key];
        const percentage = total > 0 ? (count / total) * 100 : 0;

        if (percentage === 0) return null;

        return (
          <motion.div
            key={key}
            className={cn(STATUS_CONFIG[key].bgClass, 'h-full')}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            title={`${STATUS_CONFIG[key].label}: ${count} (${formatPercent(percentage)})`}
          />
        );
      })}
    </div>
  );
}

interface LegendItemProps {
  statusKey: StatusKey;
  count: number;
  percentage: number;
}

function LegendItem({ statusKey, count, percentage }: LegendItemProps) {
  const config = STATUS_CONFIG[statusKey];

  return (
    <Link
      href={`/app/projects?status=${config.filter}`}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-colors',
        'min-h-[44px]',
        config.hoverClass
      )}
    >
      <span className={cn('w-3 h-3 rounded-full flex-shrink-0', config.bgClass)} />
      <span className="text-sm text-gray-700">{config.label}</span>
      <span className={cn('ml-auto text-sm font-semibold', config.textClass)}>
        {count}
      </span>
      <span className="text-xs text-gray-400 w-12 text-right">
        {formatPercentWhole(percentage)}
      </span>
    </Link>
  );
}

export function ProjectStatusWidget({
  status,
  isLoading = false,
}: ProjectStatusWidgetProps) {
  console.log('[ProjectStatusWidget] Rendering:', { status, isLoading });

  if (isLoading) {
    return <ProjectStatusWidgetSkeleton />;
  }

  const total = status.active + status.onHold + status.completed + status.archived;
  const isEmpty = total === 0;

  const statusKeys: StatusKey[] = ['active', 'onHold', 'completed', 'archived'];

  return (
    <motion.div
      className="bg-white border-2 border-gray-200 rounded-lg p-4 h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#001B51]/10 rounded-lg border-2 border-[#001B51]/20">
          <FolderKanban className="w-5 h-5 text-[#001B51]" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Project Status
        </h3>
        <span className="ml-auto text-sm text-gray-500">{total} total</span>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Stacked Bar */}
          <div className="mb-4">
            <StatusBar status={status} total={total} />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1">
            {statusKeys.map((key) => (
              <LegendItem
                key={key}
                statusKey={key}
                count={status[key]}
                percentage={total > 0 ? (status[key] / total) * 100 : 0}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
