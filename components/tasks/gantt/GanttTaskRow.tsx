"use client";

import React, { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { GanttTaskBar } from "./GanttTaskBar";
import type { GanttTask, TaskPosition, GanttConfig } from "./gantt-types";
import { getTaskTypeInfoWithFallback } from "@/components/tasks/TaskTypeSelector";
import type { TaskType } from "@/types/db/enums";
import type { TaskTypeConfigsRow } from "@/types/db/tables/tasks";
import { getPhaseIcon } from "./phase-icons";

interface GanttTaskRowProps {
  task: GanttTask;
  position: TaskPosition;
  config: GanttConfig;
  isDragging?: boolean;
  hoveredTaskId: string | null;
  onHover: (taskId: string | null) => void;
  onClick: (task: GanttTask) => void;
  isMobile?: boolean;
  taskTypes?: TaskTypeConfigsRow[];
  /** Show project name instead of phase name (for /app/tasks page) */
  showProjectInsteadOfPhase?: boolean;
  /** Visual nesting under a phase row */
  isNested?: boolean;
  /** First task in phase (for bracket connector) */
  isFirstInPhase?: boolean;
  /** Last task in phase (for bracket connector) */
  isLastInPhase?: boolean;
}

export const GanttTaskRow = React.memo(function GanttTaskRow({
  task,
  position,
  config,
  isDragging,
  hoveredTaskId,
  onHover,
  onClick,
  isMobile = false,
  taskTypes,
  showProjectInsteadOfPhase = false,
  isNested = false,
  isFirstInPhase = false,
  isLastInPhase = false,
}: GanttTaskRowProps) {
  const { sidebarWidth, rowHeight } = config;
  const isHovered = hoveredTaskId === task.id;

  // Memoize click handler
  const handleClick = useCallback(() => onClick(task), [onClick, task]);

  // Memoize keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(task);
      }
    },
    [onClick, task],
  );

  // Memoize phase icon (rerender-memo)
  const PhaseIcon = useMemo(() => {
    if (!task.phase?.name) return null;
    return getPhaseIcon(task.phase.name, task.phase.icon_name);
  }, [task.phase?.name, task.phase?.icon_name]);

  return (
    <div
      className="flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
      style={{
        height: rowHeight,
        // content-visibility: auto provides automatic virtualization (rendering-content-visibility)
        // Browser skips rendering off-screen rows, improving performance for large task lists
        contentVisibility: "auto",
        containIntrinsicSize: `auto ${rowHeight}px`,
      }}
    >
      {/* Left sidebar: Task info - clickable to open edit modal */}
      <div
        className={cn(
          "sticky left-0 z-10 border-r border-gray-200 dark:border-gray-800 flex items-center cursor-pointer transition-colors relative",
          task.status === "completed"
            ? "bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-150 dark:hover:bg-gray-800/70 opacity-70"
            : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800",
          isMobile ? "gap-1.5 px-2 py-1" : "gap-3 px-3 py-2",
        )}
        style={{ width: sidebarWidth }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Task title and optional phase - Two-row layout for all sizes */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Line 1 - Phase icon and Phase/Project name (only when NOT nested OR when showing project) */}
          {(!isNested || showProjectInsteadOfPhase) && (
            <div className="flex items-center gap-1.5 mb-0.5">
              {/* Phase icon (rendering-conditional-render) */}
              {PhaseIcon ? (
                <PhaseIcon
                  className={cn(
                    "shrink-0 text-gray-500 dark:text-gray-400",
                    isMobile ? "h-3 w-3" : "h-3.5 w-3.5",
                  )}
                  strokeWidth={2}
                  aria-label={task.phase?.name || "Phase"}
                />
              ) : null}
              {/* Phase or Project name */}
              {(
                showProjectInsteadOfPhase
                  ? task.project?.name
                  : task.phase?.name
              ) ? (
                <span
                  className={cn(
                    "text-gray-500 dark:text-gray-400 truncate flex-1",
                    isMobile ? "text-[10px]" : "text-xs",
                  )}
                >
                  {showProjectInsteadOfPhase
                    ? task.project?.name
                    : task.phase?.name}
                </span>
              ) : null}
            </div>
          )}
          {/* Line 2 - Task title */}
          <span
            className={cn(
              "truncate font-medium",
              task.status === "completed"
                ? "text-gray-500 dark:text-gray-400 line-through"
                : "text-gray-900 dark:text-gray-100",
              isMobile ? "text-xs" : "text-sm",
            )}
          >
            {task.title}
          </span>
        </div>
        {/* Due date - right aligned (rendering-conditional-render) */}
        {task.due_date ? (
          <span
            className={cn(
              "shrink-0 tabular-nums",
              task.status === "completed"
                ? "text-gray-400 dark:text-gray-500"
                : "text-gray-500 dark:text-gray-400",
              isMobile ? "text-[10px]" : "text-xs",
            )}
          >
            {(() => {
              try {
                const dateObj =
                  typeof task.due_date === "string"
                    ? new Date(task.due_date)
                    : task.due_date;
                return `Due ${format(dateObj, "M/d")}`;
              } catch {
                return formatDate(task.due_date);
              }
            })()}
          </span>
        ) : null}
      </div>

      {/* Right area: Task bar */}
      <div className="relative flex-1">
        <GanttTaskBar
          task={task}
          position={position}
          config={config}
          isDragging={isDragging}
          isHovered={isHovered}
          onHover={onHover}
          onClick={onClick}
          isMobile={isMobile}
          taskTypes={taskTypes}
          isNested={isNested && !showProjectInsteadOfPhase}
          isFirstInPhase={isFirstInPhase}
          isLastInPhase={isLastInPhase}
        />
      </div>
    </div>
  );
});
