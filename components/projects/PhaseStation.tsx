"use client";

import { useMemo } from "react";
import { m as motion } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Check from "lucide-react/icons/check";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import Ban from "lucide-react/icons/ban";
import Rocket from "lucide-react/icons/rocket";
import FileText from "lucide-react/icons/file-text";
import ShoppingCart from "lucide-react/icons/shopping-cart";
import FolderKanban from "lucide-react/icons/folder-kanban";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import Sparkles from "lucide-react/icons/sparkles";
import Calendar from "lucide-react/icons/calendar";
import ListTodo from "lucide-react/icons/list-todo";
// Additional icons for PHASE_ICONS map
import Layers from "lucide-react/icons/layers";
import HardHat from "lucide-react/icons/hard-hat";
import Hammer from "lucide-react/icons/hammer";
import Wrench from "lucide-react/icons/wrench";
import ClipboardCheck from "lucide-react/icons/clipboard-check";
import Package from "lucide-react/icons/package";
import Truck from "lucide-react/icons/truck";
import Flag from "lucide-react/icons/flag";
import type { LucideIcon } from "lucide-react";
import { AnimatedTooltip } from "@/components/ui/aceternity/animated-tooltip";
import { cn, formatPercentWhole, formatDate } from "@/lib/utils";
import type { ProjectPhasesRow } from "@/types/db/tables/projects";

type Phase = ProjectPhasesRow & { icon_name?: string | null };

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

interface PhaseStationProps {
  phase: Phase;
  stats?: PhaseStats;
  isCurrent: boolean;
  isSelected: boolean;
  onClick: () => void;
}

// Icon map for phase templates (must match PHASE_TEMPLATE_ICONS)
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

// Map phase names to construction-themed icons
const getPhaseIcon = (phaseName: string, iconName?: string | null) => {
  // Priority 1: Use stored icon_name if valid
  if (iconName && iconName in PHASE_ICONS) {
    return PHASE_ICONS[iconName];
  }

  // Priority 2: Fallback to keyword-based matching for new standard phases
  const name = phaseName.toLowerCase();
  if (name.includes("site") && name.includes("set")) return ClipboardCheck; // "Site set up"
  if (name.includes("framing")) return Layers;
  if (name.includes("mep") || name.includes("rough")) return Wrench; // "MEP Rough In"
  if (name.includes("fire") || name.includes("safety")) return HardHat; // "Fire life and safety"
  if (name.includes("finishes") || name.includes("finish")) return Rocket;

  // Legacy phase names (fallback for older projects)
  if (name.includes("initiation") || name.includes("planning")) return Rocket;
  if (name.includes("pre-construction") || name.includes("design"))
    return FileText;
  if (name.includes("procurement")) return ShoppingCart;
  if (
    name.includes("post") ||
    name.includes("closeout") ||
    name.includes("completion")
  )
    return CheckCircle2;
  if (name.includes("construction") || name.includes("execution"))
    return FolderKanban;

  return Sparkles; // Default icon
};

export function PhaseStation({
  phase,
  stats,
  isCurrent,
  isSelected,
  onClick,
}: PhaseStationProps) {
  const isCompleted = phase.status === "completed";
  const isInProgress = phase.status === "in_progress";
  const hasBlockers = (stats?.blockedTasks || 0) > 0;
  const hasOverdue = (stats?.overdueTasks || 0) > 0;
  const PhaseIcon = getPhaseIcon(phase.name, phase.icon_name);

  // Performance optimization: Memoize tooltip content to avoid recreating JSX on every render
  const tooltipContent = useMemo(
    () => (
      <div className="space-y-3 min-w-[240px]">
        {/* Header */}
        <div className="space-y-1 border-b border-gray-700 pb-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-sm">
              {phase.name}
            </span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                isCompleted && "text-[#059669]",
                isInProgress && "text-construction-blue",
                !isCompleted && !isInProgress && "text-gray-400",
              )}
            >
              {formatPercentWhole(phase.completion_percentage)}
            </span>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium">Tasks</span>
              </div>
              <span className="font-semibold text-white tabular-nums">
                {stats.completedTasks}/{stats.totalTasks}
              </span>
            </div>

            {stats.blockedTasks > 0 && (
              <div className="flex items-center justify-between text-[#DC2626]">
                <div className="flex items-center gap-2">
                  <Ban className="w-3.5 h-3.5" />
                  <span className="font-medium">Blocked</span>
                </div>
                <span className="font-semibold tabular-nums">
                  {stats.blockedTasks}
                </span>
              </div>
            )}

            {stats.overdueTasks > 0 && (
              <div className="flex items-center justify-between text-[#FFB627]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-medium">Overdue</span>
                </div>
                <span className="font-semibold tabular-nums">
                  {stats.overdueTasks}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        {(phase.started_at || phase.completed_at) && (
          <div className="space-y-1.5 text-xs text-gray-400 pt-2 border-t border-gray-700">
            {phase.started_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Started: {formatDate(phase.started_at, { includeYear: true })}
                </span>
              </div>
            )}
            {phase.completed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Completed:{" "}
                  {formatDate(phase.completed_at, { includeYear: true })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    ),
    [
      phase.name,
      phase.completion_percentage,
      phase.started_at,
      phase.completed_at,
      stats,
      isCompleted,
      isInProgress,
    ],
  );

  return (
    <AnimatedTooltip content={tooltipContent} side="top" delay={300}>
      <motion.button
        onClick={onClick}
        className="flex flex-col items-center gap-2.5 w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--construction-blue)] focus-visible:ring-offset-2 rounded-lg"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Clean station circle */}
        <div className="relative">
          {/* Subtle glow for active phase */}
          {isCurrent && !isCompleted && (
            <div className="absolute inset-0 rounded-full bg-construction-blue/20 blur-xl -z-10 animate-glow-pulse" />
          )}

          <motion.div
            className={cn(
              "relative flex items-center justify-center rounded-full border-3 transition-all duration-300",
              // Touch target: 56x56px minimum on mobile
              "w-14 h-14 md:w-16 md:h-16",
              isCompleted &&
                "bg-[#059669] border-[#059669] text-white shadow-lg shadow-[#059669]/20",
              isInProgress &&
                "bg-construction-blue border-construction-blue text-white shadow-lg shadow-[var(--construction-blue)]/20",
              !isCompleted &&
                !isInProgress &&
                "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 shadow-md",
              isSelected &&
                "ring-3 ring-[var(--construction-blue)]/30 ring-offset-2 dark:ring-offset-gray-900",
            )}
            animate={
              isCurrent && !isCompleted
                ? {
                    boxShadow: [
                      "0 10px 15px -3px rgba(0, 27, 81, 0.2)",
                      "0 20px 25px -5px rgba(0, 27, 81, 0.3)",
                      "0 10px 15px -3px rgba(0, 27, 81, 0.2)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {isCompleted ? (
              <Check className="w-7 h-7 stroke-[2.5]" />
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <PhaseIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold tabular-nums leading-none">
                  {formatPercentWhole(phase.completion_percentage)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Clean warning indicators */}
          {hasBlockers && !isCompleted && (
            <div className="absolute -top-1 -right-1 bg-[#DC2626] rounded-full p-1 shadow-md border-2 border-white dark:border-gray-800">
              <Ban className="w-3 h-3 text-white" />
            </div>
          )}

          {hasOverdue && !hasBlockers && !isCompleted && (
            <div className="absolute -top-1 -right-1 bg-[#FFB627] rounded-full p-1 shadow-md border-2 border-white dark:border-gray-800">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Phase name and status */}
        <div className="text-center max-w-[140px]">
          <p
            className={cn(
              "text-xs font-semibold line-clamp-2 mb-1 leading-tight",
              isCompleted && "text-[#059669]",
              isInProgress && "text-construction-blue",
              !isCompleted &&
                !isInProgress &&
                "text-gray-600 dark:text-gray-400",
              "group-hover:text-construction-blue transition-colors",
            )}
          >
            {phase.name}
          </p>

          {/* Task count */}
          {stats && stats.totalTasks > 0 && (
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <span className="tabular-nums">
                {stats.completedTasks}/{stats.totalTasks}
              </span>
              <span>tasks</span>
            </div>
          )}
        </div>
      </motion.button>
    </AnimatedTooltip>
  );
}
