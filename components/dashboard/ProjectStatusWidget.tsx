'use client';

import Link from 'next/link';
import { FolderKanban, Plus, ChevronRight } from 'lucide-react';
import { cn, formatPercentWhole } from '@/lib/utils';
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
    lightBg: 'bg-[#001B51]/5',
    filter: 'active',
  },
  onHold: {
    label: 'On Hold',
    color: '#F59E0B',
    bgClass: 'bg-[#F59E0B]',
    textClass: 'text-[#F59E0B]',
    lightBg: 'bg-[#F59E0B]/5',
    filter: 'on_hold',
  },
  completed: {
    label: 'Completed',
    color: '#059669',
    bgClass: 'bg-[#059669]',
    textClass: 'text-[#059669]',
    lightBg: 'bg-[#059669]/5',
    filter: 'completed',
  },
  archived: {
    label: 'Archived',
    color: '#9CA3AF',
    bgClass: 'bg-gray-400',
    textClass: 'text-gray-400',
    lightBg: 'bg-gray-100',
    filter: 'archived',
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function ProjectStatusWidgetSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 animate-pulse h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      <div className="h-3 w-full bg-gray-200 rounded-full mb-4" />
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
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
      <h3 className="text-base font-semibold text-gray-900 mb-1">No Projects Yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-[200px]">
        Create your first project to start tracking progress.
      </p>
      <Link
        href="/app/projects/new"
        className={cn(
          'inline-flex items-center gap-2 px-4 h-11',
          'bg-[#001B51] text-white rounded-lg',
          'font-semibold text-sm',
          'active:scale-[0.98] active:bg-[#001B51]/90',
          'transition-all duration-150'
        )}
      >
        <Plus className="w-4 h-4" />
        Create Project
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
    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
      {statusKeys.map((key) => {
        const count = status[key];
        const percentage = total > 0 ? (count / total) * 100 : 0;

        if (percentage === 0) return null;

        return (
          <div
            key={key}
            className={cn(STATUS_CONFIG[key].bgClass, 'h-full transition-all duration-500')}
            style={{ width: `${percentage}%` }}
            title={`${STATUS_CONFIG[key].label}: ${count} (${formatPercentWhole(percentage)})`}
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
        'flex items-center justify-between p-3 rounded-lg',
        'min-h-[48px]',
        'transition-all duration-150',
        config.lightBg,
        'active:scale-[0.98] active:opacity-80'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', config.bgClass)} />
        <span className="text-sm font-medium text-gray-700">{config.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-base font-bold', config.textClass)}>
          {count}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </Link>
  );
}

export function ProjectStatusWidget({
  status,
  isLoading = false,
}: ProjectStatusWidgetProps) {
  if (isLoading) {
    return <ProjectStatusWidgetSkeleton />;
  }

  const total = status.active + status.onHold + status.completed + status.archived;
  const isEmpty = total === 0;

  const statusKeys: StatusKey[] = ['active', 'onHold', 'completed', 'archived'];

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#001B51]/10 rounded-lg">
            <FolderKanban className="w-5 h-5 text-[#001B51]" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Projects
          </h3>
        </div>
        <span className="text-sm font-semibold text-gray-500">{total} total</span>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Stacked Bar */}
          <div className="mb-4">
            <StatusBar status={status} total={total} />
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
}
