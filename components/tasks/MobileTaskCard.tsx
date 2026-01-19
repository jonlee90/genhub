"use client";

import React, { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Circle,
  Receipt,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { TASK_STATUS_CONFIG } from "@/lib/config/task-colors";
import type { TaskStatus } from "@/types/db/enums";

// Simplified task type for mobile card
interface MobileTask {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  assignee?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface MobileTaskCardProps {
  task: MobileTask;
  onPress?: (task: MobileTask) => void;
  /** Optional className for container */
  className?: string;
  /** Optional expense stats to display */
  expenseStats?: {
    count: number;
    totalAmount: number;
  };
}

// Status icons for mobile display
const STATUS_ICONS: Record<
  TaskStatus,
  React.ComponentType<{ className?: string }>
> = {
  todo: Circle,
  in_progress: Wrench,
  review: Clock,
  blocked: AlertTriangle,
  completed: CheckCircle,
};

const formatDate = (date: string) => {
  const [year, month, day] = date.split("T")[0].split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Show "Today" or "Tomorrow" for better mobile UX
  if (dateObj.getTime() === today.getTime()) {
    return "Today";
  }
  if (dateObj.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
};

/**
 * MobileTaskCard - Field worker optimized task card
 *
 * Designed for construction site use:
 * - Large touch targets (minimum 44px)
 * - High contrast status indicators
 * - Quick-glance information hierarchy
 * - Works well in bright outdoor conditions
 */
export const MobileTaskCard = React.memo(function MobileTaskCard({
  task,
  onPress,
  className,
  expenseStats,
}: MobileTaskCardProps) {
  const statusConfig = TASK_STATUS_CONFIG[task.status];
  const StatusIcon = STATUS_ICONS[task.status];

  const isOverdue = useMemo(() => {
    if (!task.due_date || task.status === "completed") return false;
    const [year, month, day] = task.due_date
      .split("T")[0]
      .split("-")
      .map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }, [task.due_date, task.status]);

  return (
    <button
      onClick={() => onPress?.(task)}
      className={cn(
        // Base card styling
        "w-full text-left",
        "bg-white rounded-xl",
        "border-2 border-gray-200",
        "shadow-sm",
        // Touch-optimized padding
        "p-4",
        // Active state for touch feedback
        "active:bg-gray-50 active:scale-[0.98]",
        "transition-all duration-150",
        // Status-based left border
        task.status === "blocked" && "border-l-4 border-l-[#DC2626]",
        task.status === "completed" && "border-l-4 border-l-[#059669]",
        task.status === "in_progress" && "border-l-4 border-l-[#001B51]",
        task.status === "todo" && "border-l-4 border-l-gray-400",
        task.status === "review" && "border-l-4 border-l-[#F59E0B]",
        className,
      )}
    >
      {/* Status Row - Most prominent */}
      <div className="flex items-center justify-between mb-3">
        <Badge
          className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-full",
            "min-h-[32px] flex items-center gap-1.5",
            statusConfig.solidColor,
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusConfig.label}
        </Badge>

        {/* Overdue indicator */}
        {isOverdue && (
          <div className="flex items-center gap-1 text-[#DC2626] bg-red-50 px-2 py-1 rounded-full">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold">Overdue</span>
          </div>
        )}
      </div>

      {/* Task Title - Large and readable */}
      <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-3 leading-snug">
        {task.title}
      </h3>

      {/* Expense Badge */}
      {expenseStats && expenseStats.count > 0 && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Receipt className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-900">
            {expenseStats.count} expense{expenseStats.count !== 1 ? "s" : ""} •{" "}
            {formatCurrency(expenseStats.totalAmount)}
          </span>
        </div>
      )}

      {/* Footer: Due Date & Assignee */}
      <div className="flex items-center justify-between gap-3 min-h-[44px]">
        {/* Due Date */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "min-h-[44px]",
            isOverdue
              ? "bg-red-50 text-[#DC2626]"
              : task.due_date
                ? "bg-gray-100 text-gray-700"
                : "bg-gray-50 text-gray-400",
          )}
        >
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">
            {task.due_date ? formatDate(task.due_date) : "No due date"}
          </span>
        </div>

        {/* Assignee */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "min-h-[44px]",
            task.assignee ? "bg-[#001B51]/5" : "bg-gray-50",
          )}
        >
          {task.assignee ? (
            <>
              <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                <AvatarImage src={task.assignee.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] font-bold bg-[#001B51] text-white">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[100px]">
                {task.assignee.name.split(" ")[0]}
              </span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Unassigned</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
});

/**
 * MobileTaskCardSkeleton - Loading placeholder
 */
export function MobileTaskCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-xl border-2 border-gray-200 p-4 animate-pulse">
      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 w-24 bg-gray-200 rounded-full" />
      </div>

      {/* Title */}
      <div className="space-y-2 mb-3">
        <div className="h-5 bg-gray-200 rounded w-full" />
        <div className="h-5 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-11 w-28 bg-gray-100 rounded-lg" />
        <div className="h-11 w-32 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}
