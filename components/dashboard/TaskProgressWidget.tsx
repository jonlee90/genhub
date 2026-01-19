"use client";

import Link from "next/link";
import {
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import { cn, formatPercentWhole } from "@/lib/utils";
import {
  WidgetCard,
  WidgetHeader,
  WidgetSkeleton,
} from "@/components/ui/WidgetCard";
import type { TaskProgressData } from "@/types/dashboard";

export interface TaskProgressWidgetProps {
  progress: TaskProgressData;
  isLoading?: boolean;
}

const STATUS_CONFIG = [
  {
    key: "completed",
    label: "Completed",
    color: "bg-[#059669]",
    textColor: "text-[#059669]",
  },
  {
    key: "inProgress",
    label: "In Progress",
    color: "bg-[#3B82F6]",
    textColor: "text-[#3B82F6]",
  },
  {
    key: "blocked",
    label: "Blocked",
    color: "bg-[#F59E0B]",
    textColor: "text-[#F59E0B]",
  },
  {
    key: "overdue",
    label: "Overdue",
    color: "bg-[#DC2626]",
    textColor: "text-[#DC2626]",
  },
] as const;

function TaskProgressWidgetSkeleton() {
  return (
    <WidgetSkeleton>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="h-5 w-28 bg-gray-200 rounded" />
      </div>
      <div className="flex flex-col items-center mb-4">
        <div className="w-28 h-28 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </WidgetSkeleton>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({
  percentage,
  size = 112,
  strokeWidth = 10,
}: ProgressRingProps) {
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#001B51"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-[#001B51]">
          {formatPercentWhole(percentage)}
        </span>
        <span className="text-xs text-gray-500 font-medium">Complete</span>
      </div>
    </div>
  );
}

function VelocityTrend({ trend }: { trend: number }) {
  const direction = trend > 0 ? "up" : trend < 0 ? "down" : "neutral";
  const TrendIcon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus;
  const trendColor =
    direction === "up"
      ? "text-[#059669]"
      : direction === "down"
        ? "text-[#DC2626]"
        : "text-gray-500";

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-semibold",
        trendColor,
      )}
    >
      <TrendIcon className="w-3.5 h-3.5" />
      <span>
        {direction !== "neutral" && (direction === "up" ? "+" : "")}
        {trend}%
      </span>
    </div>
  );
}

export function TaskProgressWidget({
  progress,
  isLoading = false,
}: TaskProgressWidgetProps) {
  if (isLoading) {
    return <TaskProgressWidgetSkeleton />;
  }

  return (
    <Link href="/app/tasks" className="block h-full">
      <WidgetCard interactive>
        <WidgetHeader
          icon={ClipboardList}
          title="Tasks"
          right={
            <div className="flex items-center gap-2">
              {progress.velocityTrend !== 0 && (
                <VelocityTrend trend={progress.velocityTrend} />
              )}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          }
          className="mb-4"
        />

        {/* Progress Ring */}
        <div className="flex flex-col items-center mb-4">
          <ProgressRing percentage={progress.completionRate} />
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {progress.completed} of {progress.total} tasks
          </p>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2">
          {STATUS_CONFIG.map(({ key, label, color, textColor }) => {
            const count = progress[key as keyof TaskProgressData] as number;
            return (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
                  <span className="text-sm text-gray-600 font-medium">
                    {label}
                  </span>
                </div>
                <span className={cn("text-sm font-bold", textColor)}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </WidgetCard>
    </Link>
  );
}
