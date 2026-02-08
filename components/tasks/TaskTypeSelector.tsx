"use client";

/**
 * TaskTypeSelector Component
 *
 * Database-driven task type selection - no hardcoded fallbacks.
 * Task types are fetched from database via prefetchedTaskTypes prop.
 */

import { useMemo, memo } from "react";
import { m as motion } from "framer-motion";
import Check from "lucide-react/icons/check";
import Loader2 from "lucide-react/icons/loader-2";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import Hammer from "lucide-react/icons/hammer";
import { cn } from "@/lib/utils";
import { TASK_TYPE_ICON_MAP } from "@/lib/config/task-type-display";
import type { TaskType } from "@/types/db/task";
import type { TaskTypeConfigsRow } from "@/types/db/tables/tasks";
import type { LucideIcon } from "lucide-react";

type TaskTypeConfig = TaskTypeConfigsRow;

// Predefined Tailwind color classes for common colors (performance optimization)
// If color matches, use Tailwind classes; otherwise fall back to inline styles
const COLOR_CLASSES: Record<
  string,
  { text: string; bg: string; border: string; ring: string; bgLight: string }
> = {
  "#3b82f6": {
    text: "text-blue-600 dark:text-blue-300",
    bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40",
    border:
      "border-blue-200 data-[selected=true]:border-blue-500 dark:border-blue-900/50 dark:data-[selected=true]:border-blue-400",
    ring: "#3b82f6",
    bgLight: "bg-blue-100 dark:bg-blue-950/30",
  },
  "#10b981": {
    text: "text-emerald-600 dark:text-emerald-300",
    bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40",
    border:
      "border-emerald-200 data-[selected=true]:border-emerald-500 dark:border-emerald-900/50 dark:data-[selected=true]:border-emerald-400",
    ring: "#10b981",
    bgLight: "bg-emerald-100 dark:bg-emerald-950/30",
  },
  "#f59e0b": {
    text: "text-amber-600 dark:text-amber-300",
    bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40",
    border:
      "border-amber-200 data-[selected=true]:border-amber-500 dark:border-amber-900/50 dark:data-[selected=true]:border-amber-400",
    ring: "#f59e0b",
    bgLight: "bg-amber-100 dark:bg-amber-950/30",
  },
  "#64748b": {
    text: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800/50",
    border:
      "border-slate-200 data-[selected=true]:border-slate-500 dark:border-slate-700/60 dark:data-[selected=true]:border-slate-400",
    ring: "#64748b",
    bgLight: "bg-slate-100 dark:bg-slate-900/40",
  },
};

// Default color fallback
const DEFAULT_COLOR = "#3b82f6";
const DEFAULT_COLOR_CLASS = COLOR_CLASSES[DEFAULT_COLOR];

// Valid TaskType enum values for mapping
const VALID_TASK_TYPES: TaskType[] = ["work", "purchase", "approval", "admin"];

/**
 * Convert string to Title Case (capitalize first letter of each word)
 */
function toTitleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Derive TaskType enum from config name (case-insensitive match)
 */
export function deriveTaskTypeKey(name: string): TaskType {
  const normalized = name.toLowerCase().trim();
  // Direct match
  if (VALID_TASK_TYPES.includes(normalized as TaskType)) {
    return normalized as TaskType;
  }
  // Partial match (e.g., "Work Tasks" → "work")
  const match = VALID_TASK_TYPES.find((type) => normalized.startsWith(type));
  return match || "work"; // Fallback to "work"
}

/**
 * Task type display info structure
 * Includes both Tailwind classes (for common colors) and hex color for inline styles
 */
export interface TaskTypeInfo {
  id: TaskType;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  // Tailwind classes (only populated for predefined colors, null for custom colors)
  colorClasses: {
    text: string;
    bg: string;
    border: string;
    ring: string;
    bgLight: string;
  } | null;
}

/**
 * Get Tailwind classes for a hex color, or return null if custom
 */
function getColorClasses(hexColor: string | null) {
  if (!hexColor) return COLOR_CLASSES[DEFAULT_COLOR];
  return COLOR_CLASSES[hexColor] || null;
}

/**
 * Convert database config to display format
 * Supports both predefined Tailwind colors and custom hex colors
 */
export function convertTaskTypeConfig(config: TaskTypeConfig): TaskTypeInfo {
  const IconComponent = config.icon_name
    ? TASK_TYPE_ICON_MAP[config.icon_name] || Hammer
    : Hammer;
  const color = config.color || DEFAULT_COLOR;
  const colorClasses = getColorClasses(color);
  const typeKey = deriveTaskTypeKey(config.name);

  return {
    id: typeKey,
    name: config.name,
    description: config.description || "",
    icon: IconComponent,
    color: color,
    colorClasses: colorClasses,
  };
}

/**
 * Get task type info from configs array
 * Requires task type configs from database - no hardcoded fallback
 */
export function getTaskTypeInfo(
  taskType: TaskType,
  configs: TaskTypeConfig[],
): TaskTypeInfo | null {
  if (!configs || configs.length === 0) {
    return null;
  }

  // Find config that matches this task type
  const config = configs.find((c) => deriveTaskTypeKey(c.name) === taskType);
  if (!config) {
    // Return first config as fallback
    return convertTaskTypeConfig(configs[0]);
  }

  return convertTaskTypeConfig(config);
}

/**
 * Get task type info with fallback for display purposes
 * Used when configs might not be available (e.g., in badges)
 */
export function getTaskTypeInfoWithFallback(
  taskType: TaskType,
  configs?: TaskTypeConfig[] | null,
): TaskTypeInfo {
  // If we have configs, use them
  if (configs && configs.length > 0) {
    const info = getTaskTypeInfo(taskType, configs);
    if (info) return info;
  }

  // Fallback: build minimal info from task type enum
  // This ensures badges can still display even without full config data
  const fallbackMap: Record<
    TaskType,
    { name: string; icon: LucideIcon; color: string }
  > = {
    work: {
      name: "Work",
      icon: TASK_TYPE_ICON_MAP["Hammer"] || Hammer,
      color: "#3b82f6",
    },
    purchase: {
      name: "Purchase",
      icon: TASK_TYPE_ICON_MAP["ShoppingCart"] || Hammer,
      color: "#10b981",
    },
    approval: {
      name: "Approval",
      icon: TASK_TYPE_ICON_MAP["ClipboardCheck"] || Hammer,
      color: "#f59e0b",
    },
    admin: {
      name: "Admin",
      icon: TASK_TYPE_ICON_MAP["FileText"] || Hammer,
      color: "#64748b",
    },
  };

  const fallback = fallbackMap[taskType] || fallbackMap.work;
  const colorClasses = getColorClasses(fallback.color);

  return {
    id: taskType,
    name: fallback.name,
    description: "",
    icon: fallback.icon,
    color: fallback.color,
    colorClasses: colorClasses,
  };
}

interface TaskTypeSelectorProps {
  selectedType: TaskType | null;
  onSelect: (type: TaskType) => void;
  disabled?: boolean;
  /** Task types from database - required, no internal fetching */
  prefetchedTaskTypes: TaskTypeConfig[];
  /** Show loading state */
  isLoading?: boolean;
}

function TaskTypeSelectorInner({
  selectedType,
  onSelect,
  disabled = false,
  prefetchedTaskTypes,
  isLoading = false,
}: TaskTypeSelectorProps) {
  // Convert configs to display format
  const taskTypes = useMemo(() => {
    if (!prefetchedTaskTypes || prefetchedTaskTypes.length === 0) {
      return [];
    }
    return prefetchedTaskTypes
      .filter((t) => t.is_active !== false)
      .map(convertTaskTypeConfig);
  }, [prefetchedTaskTypes]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
        <span className="ml-2 text-sm text-gray-600">
          Loading task types...
        </span>
      </div>
    );
  }
  // Error state: no task types configured
  if (taskTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-muted-foreground font-medium">
          No task types configured
        </p>
        <p className="text-sm text-muted-foreground">
          Contact your administrator to set up task types in Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Task Type Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {taskTypes.map((taskType, index) => {
          const Icon = taskType.icon;
          const isSelected = selectedType === taskType.id;
          const isCustomColor = !taskType.colorClasses;

          return (
            <motion.button
              key={taskType.id}
              type="button"
              onClick={() => onSelect(taskType.id)}
              disabled={disabled}
              data-selected={isSelected}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={cn(
                "relative flex flex-col items-center p-4 sm:p-5 rounded-xl border-2",
                "transition-all duration-200 cursor-pointer",
                !isCustomColor && taskType.colorClasses!.bg,
                !isCustomColor && taskType.colorClasses!.border,
                disabled ? "opacity-50 cursor-not-allowed" : "",
                isSelected ? "ring-2 ring-offset-2 shadow-md" : "shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              )}
              style={
                isCustomColor
                  ? ({
                      backgroundColor: `${taskType.color}15`,
                      borderColor: taskType.color,
                      "--tw-ring-color": taskType.color,
                    } as React.CSSProperties)
                  : ({
                      "--tw-ring-color": isSelected
                        ? taskType.colorClasses!.ring
                        : undefined,
                    } as React.CSSProperties)
              }
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ backgroundColor: taskType.color }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Icon Container */}
              <div
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3",
                  !isCustomColor && taskType.colorClasses!.bgLight,
                )}
                style={
                  isCustomColor
                    ? { backgroundColor: `${taskType.color}25` }
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7",
                    !isCustomColor && taskType.colorClasses!.text,
                  )}
                  style={isCustomColor ? { color: taskType.color } : undefined}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "font-semibold text-sm sm:text-base mb-1",
                  !isCustomColor && taskType.colorClasses!.text,
                )}
                style={isCustomColor ? { color: taskType.color } : undefined}
              >
                {toTitleCase(taskType.name)}
              </span>

              {/* Description */}
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {taskType.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name="task_type" value={selectedType || "work"} />
    </div>
  );
}

// Memoized TaskTypeSelector to prevent unnecessary re-renders
export const TaskTypeSelector = memo(TaskTypeSelectorInner);

/**
 * Task Type Badge component for displaying type in lists/details
 * Uses getTaskTypeInfoWithFallback so it works even without configs
 * Supports both predefined Tailwind colors and custom hex colors
 */
export function TaskTypeBadge({
  type,
  taskTypeConfigs,
}: {
  type: TaskType;
  taskTypeConfigs?: TaskTypeConfig[] | null;
}) {
  const info = getTaskTypeInfoWithFallback(type, taskTypeConfigs);
  const Icon = info.icon;
  const isCustomColor = !info.colorClasses;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        !isCustomColor && info.colorClasses!.bg,
        !isCustomColor && info.colorClasses!.text,
      )}
      style={
        isCustomColor
          ? {
              backgroundColor: `${info.color}20`,
              color: info.color,
            }
          : undefined
      }
    >
      <Icon className="w-3.5 h-3.5" />
      {info.name}
    </span>
  );
}
