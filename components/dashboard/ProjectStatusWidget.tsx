"use client";

import Link from "next/link";
import { FolderKanban, Plus, ChevronRight } from "lucide-react";
import { cn, formatPercentWhole } from "@/lib/utils";
import {
  WidgetCard,
  WidgetHeader,
  WidgetSkeleton,
} from "@/components/ui/WidgetCard";
import type { ProjectStatusData } from "@/types/dashboard";

export interface ProjectStatusWidgetProps {
  status: ProjectStatusData;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    color: "var(--construction-blue)",
    bgClass: "bg-construction-blue dark:bg-blue-500",
    textClass: "text-construction-blue dark:text-blue-400",
    lightBg: "bg-construction-blue/5 dark:bg-blue-500/20",
    filter: "active",
  },
  onHold: {
    label: "On Hold",
    color: "#F59E0B",
    bgClass: "bg-[#F59E0B] dark:bg-yellow-500",
    textClass: "text-[#F59E0B] dark:text-yellow-400",
    lightBg: "bg-[#F59E0B]/5 dark:bg-yellow-500/20",
    filter: "on_hold",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bgClass: "bg-[#059669] dark:bg-green-500",
    textClass: "text-[#059669] dark:text-green-400",
    lightBg: "bg-[#059669]/5 dark:bg-green-500/20",
    filter: "completed",
  },
  archived: {
    label: "Archived",
    color: "#9CA3AF",
    bgClass: "bg-gray-400 dark:bg-gray-600",
    textClass: "text-gray-400 dark:text-gray-500",
    lightBg: "bg-gray-100 dark:bg-gray-800",
    filter: "archived",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function ProjectStatusWidgetSkeleton() {
  return (
    <WidgetSkeleton>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    </WidgetSkeleton>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <FolderKanban className="w-7 h-7 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No Projects Yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-[200px]">
        Create your first project to start tracking progress.
      </p>
      <Link
        href="/app/projects/new"
        className={cn(
          "inline-flex items-center gap-2 px-4 h-11",
          "bg-construction-blue dark:bg-blue-600 text-white rounded-lg",
          "font-semibold text-sm",
          "active:scale-[0.98] active:bg-construction-blue/90 dark:active:bg-blue-700",
          "transition-all duration-150",
        )}
      >
        <Plus className="w-4 h-4 mr-2" />
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
  const statusKeys: StatusKey[] = ["active", "onHold", "completed", "archived"];

  return (
    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
      {statusKeys.map((key) => {
        const count = status[key];
        const percentage = total > 0 ? (count / total) * 100 : 0;

        if (percentage === 0) return null;

        return (
          <div
            key={key}
            className={cn(
              STATUS_CONFIG[key].bgClass,
              "h-full transition-all duration-500",
            )}
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

function LegendItem({
  statusKey,
  count,
  percentage: _percentage,
}: LegendItemProps) {
  const config = STATUS_CONFIG[statusKey];

  return (
    <Link
      href={`/app/projects?status=${config.filter}`}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        "min-h-[48px]",
        "transition-all duration-150",
        config.lightBg,
        "active:scale-[0.98] active:opacity-80",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-2.5 h-2.5 rounded-full flex-shrink-0",
            config.bgClass,
          )}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-base font-bold", config.textClass)}>
          {count}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
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

  const total =
    status.active + status.onHold + status.completed + status.archived;
  const isEmpty = total === 0;

  const statusKeys: StatusKey[] = ["active", "onHold", "completed", "archived"];

  return (
    <WidgetCard>
      <WidgetHeader
        icon={FolderKanban}
        title="Projects"
        right={
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {total} total
          </span>
        }
        className="mb-4"
      />

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
    </WidgetCard>
  );
}
