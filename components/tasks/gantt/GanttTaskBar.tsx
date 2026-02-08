"use client";

import React, { useCallback, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import Clock from "lucide-react/icons/clock";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { getDateIndicator } from "@/lib/date-utils";
import type { GanttTaskBarProps } from "./gantt-types";

export const GanttTaskBar = React.memo(function GanttTaskBar({
  task,
  position,
  config,
  isDragging,
  isHovered,
  onHover,
  onClick,
  isMobile = false,
  taskTypes,
}: GanttTaskBarProps) {
  // Only enable dragging on desktop
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: isMobile,
  });

  // Mobile: larger touch targets and minimum widths
  const minWidth = isMobile ? 30 : 20;
  const verticalPadding = isMobile ? 6 : 4;
  const barHeight = config.rowHeight - verticalPadding * 2;

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
    const startStr = task.start_date
      ? formatDate(task.start_date)
      : "No start date";
    const dueStr = task.due_date ? formatDate(task.due_date) : "No due date";
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
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
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
        "absolute rounded-md",
        // Background color based on status
        task.status === "completed"
          ? "bg-gray-400 dark:bg-gray-600"
          : "bg-construction-blue",
        // CSS animations replace Framer Motion (bundle-defer-third-party optimization)
        "animate-scale-in origin-left",
        "transition-all duration-200",
        isMobile
          ? "touch-manipulation active:scale-[0.98] cursor-pointer"
          : "cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] hover:-translate-y-px",
        // Priority border indicators (hide for completed tasks)
        task.status !== "completed" &&
          task.priority === "critical" &&
          "border-2 border-purple-500 dark:border-purple-400",
        task.status !== "completed" &&
          task.priority === "high" &&
          "border-2 border-red-500 dark:border-red-400",
        // Completed task styling - disabled appearance with strikethrough overlay
        task.status === "completed" && "opacity-70 relative",
        // Dragging and hover states
        isDragging &&
          "opacity-50 scale-[1.03] shadow-[0_8px_16px_rgba(0,27,81,0.2)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.4)] z-50",
        isHovered &&
          task.status !== "completed" &&
          "ring-2 ring-construction-blue/50 dark:ring-construction-blue/60 ring-offset-1 dark:ring-offset-gray-900",
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
      <div
        className={cn(
          "absolute inset-0 flex items-center gap-1.5 font-semibold text-white z-10",
          isMobile ? "px-1.5 text-[10px]" : "px-2.5 text-xs",
          "justify-start",
        )}
      >
        {/* Only show content for non-completed tasks */}
        {task.status !== "completed" && (
          <>
            {/* Multi-assignee avatars (stacked) */}
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex items-center shrink-0 -space-x-1.5">
                {task.assignees.slice(0, 3).map((assignee, index) => {
                  const name =
                    assignee.user?.name ||
                    assignee.subcontractor?.contact_name ||
                    "?";
                  const avatarUrl = assignee.user?.avatar_url || null;
                  return (
                    <Avatar
                      key={`${assignee.user_id || assignee.subcontractor_id}-${index}`}
                      className={cn(
                        "shrink-0 border-2 border-white/50 ring-1 ring-white/30",
                        isMobile ? "h-4 w-4" : "h-5 w-5",
                      )}
                    >
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback
                        className={cn(
                          assignee.user
                            ? "bg-construction-blue"
                            : "bg-orange-600",
                          "text-white font-bold",
                          isMobile ? "text-[8px]" : "text-[9px]",
                        )}
                      >
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {task.assignees.length > 3 ? (
                  <div
                    className={cn(
                      "flex items-center justify-center shrink-0 rounded-full bg-white/90 dark:bg-gray-900/90 border-2 border-white/50 font-bold text-gray-700 dark:text-gray-300",
                      isMobile ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]",
                    )}
                  >
                    +{task.assignees.length - 3}
                  </div>
                ) : null}
              </div>
            ) : task.assignee ? (
              <Avatar
                className={cn(
                  "shrink-0 border-2 border-white/30",
                  isMobile ? "h-4 w-4" : "h-5 w-5",
                )}
              >
                <AvatarImage src={task.assignee.avatar_url || undefined} />
                <AvatarFallback
                  className={cn(
                    "bg-white/20 text-white font-bold",
                    isMobile ? "text-[8px]" : "text-[9px]",
                  )}
                >
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
            ) : null}
          </>
        )}

        <span className={cn("truncate min-w-0")}>{task.title}</span>

        {/* Remaining days indicator - hide for completed tasks */}
        {task.status !== "completed" &&
          (() => {
            const dateIndicator = getDateIndicator(task.due_date);
            if (!dateIndicator) return null;
            // Hide entire indicator if task bar takes 1 day or less (rendering-conditional-render)
            if (taskDurationDays <= 1) return null;
            // Hide clock icon if task bar takes less than 4 days space (rendering-conditional-render)
            const showClockIcon = taskDurationDays >= 4;
            return (
              <span
                className={cn(
                  "flex items-center shrink-0 px-1.5 py-0.5 rounded font-semibold",
                  isMobile ? "text-[9px]" : "text-[10px]",
                  // Center content when no icon, add gap when icon is present
                  showClockIcon ? "gap-0.5" : "justify-center",
                  // Use white/dark background with colored text for visibility on colored bars
                  dateIndicator.colorClass.includes("text-red") &&
                    "bg-white/90 dark:bg-gray-900/90 text-red-600 dark:text-red-400",
                  dateIndicator.colorClass.includes("text-amber") &&
                    "bg-white/90 dark:bg-gray-900/90 text-amber-600 dark:text-amber-400",
                  dateIndicator.colorClass.includes("text-gray") &&
                    "bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300",
                )}
              >
                {showClockIcon ? (
                  <Clock className={cn(isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} />
                ) : null}
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
