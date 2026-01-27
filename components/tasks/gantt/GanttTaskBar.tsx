"use client";

import React, { useCallback, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import Clock from "lucide-react/icons/clock";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { getDateIndicator } from "@/lib/date-utils";
import type { GanttTaskBarProps } from "./gantt-types";
import { STATUS_STYLES } from "./gantt-types";

export const GanttTaskBar = React.memo(function GanttTaskBar({
  task,
  position,
  config,
  isDragging,
  isHovered,
  onHover,
  onClick,
  isMobile = false,
}: GanttTaskBarProps) {
  // Only enable dragging on desktop
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: isMobile,
  });

  // Get status-specific styling
  const statusStyle = STATUS_STYLES[task.status];

  // Mobile: larger touch targets and minimum widths
  const minWidth = isMobile ? 30 : 20;
  const verticalPadding = isMobile ? 6 : 4;
  const barHeight = config.rowHeight - (verticalPadding * 2);

  // Memoized event handlers to prevent recreation on every render
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) onHover?.(task.id);
  }, [isMobile, onHover, task.id]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) onHover?.(null);
  }, [isMobile, onHover]);

  const handleTouchStart = useCallback(() => {
    if (isMobile) onHover?.(task.id);
  }, [isMobile, onHover, task.id]);

  const handleTouchEnd = useCallback(() => {
    if (isMobile) onHover?.(null);
  }, [isMobile, onHover]);

  const handleClick = useCallback(() => {
    onClick?.(task);
  }, [onClick, task]);

  // Accessibility: Create comprehensive ARIA label for screen readers
  const ariaLabel = useMemo(() => {
    const startStr = task.start_date ? formatDate(task.start_date) : 'No start date';
    const dueStr = task.due_date ? formatDate(task.due_date) : 'No due date';
    return `${task.title}. Start: ${startStr}. Due: ${dueStr}. Status: ${task.status}. Priority: ${task.priority}.`;
  }, [task]);

  // Calculate task duration in days
  const taskDurationDays = useMemo(() => {
    if (!task.start_date || !task.due_date) return 0;
    const start = new Date(task.start_date);
    const end = new Date(task.due_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [task.start_date, task.due_date]);

  // Use default priority-based colors
  const barStyle = {
    left: position.left,
    width: Math.max(position.width, minWidth),
    top: verticalPadding,
    height: barHeight,
    transform: transform
      ? `translate3d(${transform.x}px, 0, 0)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...(isMobile ? {} : attributes)}
      {...(isMobile ? {} : listeners)}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      className={cn(
        "absolute rounded-md bg-construction-blue",
        // CSS animations replace Framer Motion (bundle-defer-third-party optimization)
        "animate-scale-in origin-left",
        "transition-all duration-200",
        isMobile
          ? "touch-manipulation active:scale-[0.98] cursor-pointer"
          : "cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] hover:-translate-y-px",
        // Clean background based on priority - removed gradients for simplicity
        task.priority === "high" && "bg-red-600 dark:bg-red-700 border border-red-700 dark:border-red-600",
        task.priority === "medium" && "border border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-300",
        task.priority === "low" && "border border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-300",
        // Status overlay styles
        statusStyle,
        // Dragging and hover states
        isDragging && "opacity-50 scale-[1.03] shadow-[0_8px_16px_rgba(0,27,81,0.2)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.4)] z-50",
        isHovered && "ring-2 ring-construction-blue/50 dark:ring-construction-blue/60 ring-offset-1 dark:ring-offset-gray-900"
      )}
      style={barStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Progress fill (if task has actual_cost / planned_cost) */}
      {task.planned_cost && task.actual_cost && (
        <div
          className="absolute inset-0 bg-white/25 rounded-l-md transition-all"
          style={{
            width: `${Math.min((task.actual_cost / task.planned_cost) * 100, 100)}%`,
          }}
        />
      )}

      {/* Task title and indicators */}
      <div className={cn(
        "absolute inset-0 flex items-center gap-1.5 font-semibold text-white z-10",
        isMobile ? "px-1.5 text-[10px]" : "px-2.5 text-xs",
        // Center content for 1-day tasks
        taskDurationDays <= 1 ? "justify-center" : ""
      )}>
        {/* Multi-assignee avatars (stacked) */}
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex items-center shrink-0 -space-x-1.5">
            {task.assignees.slice(0, 3).map((assignee, index) => {
              const name = assignee.user?.name || assignee.subcontractor?.contact_name || "?";
              const avatarUrl = assignee.user?.avatar_url || null;
              return (
                <Avatar
                  key={`${assignee.user_id || assignee.subcontractor_id}-${index}`}
                  className={cn(
                    "shrink-0 border-2 border-white/50 ring-1 ring-white/30",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )}
                >
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className={cn(
                    assignee.user ? "bg-construction-blue" : "bg-orange-600",
                    "text-white font-bold",
                    isMobile ? "text-[8px]" : "text-[9px]"
                  )}>
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {task.assignees.length > 3 ? (
              <div className={cn(
                "flex items-center justify-center shrink-0 rounded-full bg-white/90 dark:bg-gray-900/90 border-2 border-white/50 font-bold text-gray-700 dark:text-gray-300",
                isMobile ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]"
              )}>
                +{task.assignees.length - 3}
              </div>
            ) : null}
          </div>
        ) : task.assignee ? (
          <Avatar className={cn(
            "shrink-0 border-2 border-white/30",
            isMobile ? "h-4 w-4" : "h-5 w-5"
          )}>
            <AvatarImage src={task.assignee.avatar_url || undefined} />
            <AvatarFallback className={cn(
              "bg-white/20 text-white font-bold",
              isMobile ? "text-[8px]" : "text-[9px]"
            )}>
              {getInitials(task.assignee.name)}
            </AvatarFallback>
          </Avatar>
        ) : null}

        {/* Completed label */}
        {task.status === "completed" && (
          <span className={cn(
            "shrink-0 px-1.5 py-0.5 rounded bg-white/90 dark:bg-gray-900/90 text-green-600 dark:text-green-400 font-bold uppercase",
            isMobile ? "text-[8px]" : "text-[9px]"
          )}>
            Done
          </span>
        )}

        <span className="truncate min-w-0">
          {task.title}
        </span>

        {/* Remaining days indicator */}
        {(() => {
          const dateIndicator = getDateIndicator(task.due_date);
          if (!dateIndicator) return null;
          const isOneDay = taskDurationDays <= 1;
          return (
            <span className={cn(
              "flex items-center shrink-0 px-1.5 py-0.5 rounded font-semibold",
              isMobile ? "text-[9px]" : "text-[10px]",
              // Center content when no icon, add gap when icon is present
              isOneDay ? "justify-center" : "gap-0.5",
              // Use white/dark background with colored text for visibility on colored bars
              dateIndicator.colorClass.includes("text-red") && "bg-white/90 dark:bg-gray-900/90 text-red-600 dark:text-red-400",
              dateIndicator.colorClass.includes("text-amber") && "bg-white/90 dark:bg-gray-900/90 text-amber-600 dark:text-amber-400",
              dateIndicator.colorClass.includes("text-gray") && "bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300"
            )}>
              {!isOneDay && <Clock className={cn(isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} />}
              {dateIndicator.display}
            </span>
          );
        })()}
      </div>

      {/* Resize handles (visual only for now) - hide on mobile, subtle styling */}
      {!isMobile && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20 rounded-l-md transition-colors" />
          <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20 rounded-r-md transition-colors" />
        </>
      )}
    </div>
  );
});
