"use client";

import React, { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate, formatBudget } from "@/lib/utils";
import { GanttTaskBar } from "./GanttTaskBar";
import type { GanttTask, TaskPosition, GanttConfig } from "./gantt-types";
import { getTaskTypeInfoWithFallback } from "@/components/tasks/TaskTypeSelector";
import type { TaskType } from "@/types/db/enums";
import type { TaskTypeConfigsRow } from "@/types/db/tables/tasks";
import type { LucideIcon } from "lucide-react";
import Rocket from "lucide-react/icons/rocket";
import FileText from "lucide-react/icons/file-text";
import ShoppingCart from "lucide-react/icons/shopping-cart";
import FolderKanban from "lucide-react/icons/folder-kanban";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import Layers from "lucide-react/icons/layers";
import Sparkles from "lucide-react/icons/sparkles";
import Calendar from "lucide-react/icons/calendar";
import HardHat from "lucide-react/icons/hard-hat";
import Hammer from "lucide-react/icons/hammer";
import Wrench from "lucide-react/icons/wrench";
import ClipboardCheck from "lucide-react/icons/clipboard-check";
import Package from "lucide-react/icons/package";
import Truck from "lucide-react/icons/truck";
import Flag from "lucide-react/icons/flag";

// Icon map for phase templates (bundle-barrel-imports)
const PHASE_ICONS: Record<string, LucideIcon> = {
  Rocket,
  FileText,
  ShoppingCart,
  FolderKanban,
  CheckCircle2,
  Layers,
  Sparkles,
  Calendar,
  HardHat,
  Hammer,
  Wrench,
  ClipboardCheck,
  Package,
  Truck,
  Flag,
};

// Get phase icon based on icon_name or phase name (rerender-memo optimization)
const getPhaseIcon = (phaseName: string, iconName?: string | null): LucideIcon => {
  // Priority 1: Use stored icon_name if valid
  if (iconName && iconName in PHASE_ICONS) {
    return PHASE_ICONS[iconName];
  }

  // Priority 2: Fallback to keyword-based matching
  const name = phaseName.toLowerCase();
  if (name.includes('site') && name.includes('set')) return ClipboardCheck;
  if (name.includes('framing')) return Layers;
  if (name.includes('mep') || name.includes('rough')) return Wrench;
  if (name.includes('fire') || name.includes('safety')) return HardHat;
  if (name.includes('finishes') || name.includes('finish')) return Rocket;
  if (name.includes('initiation') || name.includes('planning')) return Rocket;
  if (name.includes('pre-construction') || name.includes('design')) return FileText;
  if (name.includes('procurement')) return ShoppingCart;
  if (name.includes('post') || name.includes('closeout') || name.includes('completion')) return CheckCircle2;
  if (name.includes('construction') || name.includes('execution')) return FolderKanban;

  return Layers; // Default fallback
};

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
}: GanttTaskRowProps) {
  const { sidebarWidth, rowHeight } = config;
  const isHovered = hoveredTaskId === task.id;

  // Memoize click handler
  const handleClick = useCallback(() => onClick(task), [onClick, task]);

  // Memoize keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(task);
    }
  }, [onClick, task]);

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
          "sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex items-center cursor-pointer transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isMobile ? "gap-1.5 px-2 py-1" : "gap-3 px-3 py-2"
        )}
        style={{ width: sidebarWidth }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Task title and phase - Two-row layout for all sizes */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Line 1 - Phase icon and Phase/Project name */}
          <div className="flex items-center gap-1.5 mb-0.5">
            {/* Phase icon (rendering-conditional-render) */}
            {PhaseIcon ? (
              <PhaseIcon
                className={cn("shrink-0 text-gray-500 dark:text-gray-400", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")}
                strokeWidth={2}
                aria-label={task.phase?.name || "Phase"}
              />
            ) : null}
            {/* Phase or Project name */}
            {(showProjectInsteadOfPhase ? task.project?.name : task.phase?.name) ? (
              <span className={cn(
                "text-gray-500 dark:text-gray-400 truncate flex-1",
                isMobile ? "text-[10px]" : "text-xs"
              )}>
                {showProjectInsteadOfPhase ? task.project?.name : task.phase?.name}
              </span>
            ) : null}
          </div>
          {/* Line 2 - Task title */}
          <span className={cn(
            "text-gray-900 dark:text-gray-100 truncate font-medium",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {task.title}
          </span>
        </div>
        {/* Due date & actual cost - right aligned (rendering-conditional-render) */}
        {task.due_date || task.actual_cost ? (
          <div className="shrink-0 text-right">
            {task.due_date ? (
              <span className={cn(
                "block text-gray-500 dark:text-gray-400 tabular-nums",
                isMobile ? "text-[10px]" : "text-xs"
              )}>
                {formatDate(task.due_date)}
              </span>
            ) : null}
            {task.actual_cost ? (
              <span className={cn(
                "block text-construction-green font-bold tabular-nums",
                isMobile ? "text-[9px]" : "text-[11px]"
              )}>
                {formatBudget(task.actual_cost)}
              </span>
            ) : null}
          </div>
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
        />
      </div>
    </div>
  );
});
