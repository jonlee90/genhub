"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Hammer } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { ClipboardCheck } from "lucide-react";
import { FileText } from "lucide-react";
import { getTaskTypes } from "@/app/actions/task-types";
import { TASK_TYPE_ICON_MAP } from "@/lib/config/task-type-display";
import type { TaskType } from "@/types/db/enums";
import type { TaskTypeConfigsRow } from "@/types/db/tables/tasks";

type TaskTypeConfig = TaskTypeConfigsRow;

// Color palette for task types (used when hex color is provided)
const TAILWIND_COLORS: Record<string, { text: string; bg: string; border: string; ring: string; bgLight: string }> = {
  "#3b82f6": { text: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100", border: "border-blue-200 data-[selected=true]:border-blue-500", ring: "#3b82f6", bgLight: "bg-blue-100" },
  "#10b981": { text: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", border: "border-emerald-200 data-[selected=true]:border-emerald-500", ring: "#10b981", bgLight: "bg-emerald-100" },
  "#f59e0b": { text: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100", border: "border-amber-200 data-[selected=true]:border-amber-500", ring: "#f59e0b", bgLight: "bg-amber-100" },
  "#64748b": { text: "text-slate-600", bg: "bg-slate-50 hover:bg-slate-100", border: "border-slate-200 data-[selected=true]:border-slate-500", ring: "#64748b", bgLight: "bg-slate-100" },
};

// Default fallback task types (used if database fetch fails)
const DEFAULT_TASK_TYPES: Array<{
  id: string;
  name: string;
  description: string;
  icon: typeof Hammer;
  color: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  ringColor: string;
  bgLightClass: string;
}> = [
  {
    id: "work",
    name: "Work",
    description: "Standard labor and construction tasks",
    icon: Hammer,
    color: "#3b82f6",
    textClass: "text-blue-600",
    bgClass: "bg-blue-50 hover:bg-blue-100",
    borderClass: "border-blue-200 data-[selected=true]:border-blue-500",
    ringColor: "#3b82f6",
    bgLightClass: "bg-blue-100",
  },
  {
    id: "purchase",
    name: "Purchase",
    description: "Materials, equipment, and supplies",
    icon: ShoppingCart,
    color: "#10b981",
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-50 hover:bg-emerald-100",
    borderClass: "border-emerald-200 data-[selected=true]:border-emerald-500",
    ringColor: "#10b981",
    bgLightClass: "bg-emerald-100",
  },
  {
    id: "approval",
    name: "Approval",
    description: "Permits, sign-offs, and inspections",
    icon: ClipboardCheck,
    color: "#f59e0b",
    textClass: "text-amber-600",
    bgClass: "bg-amber-50 hover:bg-amber-100",
    borderClass: "border-amber-200 data-[selected=true]:border-amber-500",
    ringColor: "#f59e0b",
    bgLightClass: "bg-amber-100",
  },
  {
    id: "admin",
    name: "Admin",
    description: "Administrative and overhead tasks",
    icon: FileText,
    color: "#64748b",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50 hover:bg-slate-100",
    borderClass: "border-slate-200 data-[selected=true]:border-slate-500",
    ringColor: "#64748b",
    bgLightClass: "bg-slate-100",
  },
];

// Valid TaskType enum values for mapping
const VALID_TASK_TYPES: TaskType[] = ["work", "purchase", "approval", "admin"];

// Derive TaskType enum from config name (case-insensitive match)
function deriveTaskTypeKey(name: string): TaskType {
  const normalized = name.toLowerCase().trim();
  // Direct match
  if (VALID_TASK_TYPES.includes(normalized as TaskType)) {
    return normalized as TaskType;
  }
  // Partial match (e.g., "Work Tasks" → "work")
  const match = VALID_TASK_TYPES.find(type => normalized.startsWith(type));
  return match || "work"; // Fallback to "work"
}

// Convert database config to display format
function convertTaskTypeConfig(config: TaskTypeConfig) {
  const defaultIcon = DEFAULT_TASK_TYPES[0].icon; // Fallback to first icon
  const IconComponent = config.icon_name ? (TASK_TYPE_ICON_MAP[config.icon_name] || defaultIcon) : defaultIcon;
  const color = config.color || "#3b82f6";
  const colorInfo = TAILWIND_COLORS[color] || TAILWIND_COLORS["#3b82f6"]; // Fallback to blue

  // Use derived type key instead of UUID id
  const typeKey = deriveTaskTypeKey(config.name);

  return {
    id: typeKey, // TaskType enum value, not UUID
    name: config.name,
    description: config.description || "",
    icon: IconComponent,
    color: color,
    textClass: colorInfo.text,
    bgClass: colorInfo.bg,
    borderClass: colorInfo.border,
    ringColor: colorInfo.ring,
    bgLightClass: colorInfo.bgLight,
  };
}

interface TaskTypeSelectorProps {
  selectedType: TaskType | null;
  onSelect: (type: TaskType) => void;
  disabled?: boolean;
}

export function TaskTypeSelector({
  selectedType,
  onSelect,
  disabled = false,
}: TaskTypeSelectorProps) {
  // Fetch task types from database
  const [taskTypes, setTaskTypes] = useState(DEFAULT_TASK_TYPES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTaskTypes = async () => {
      setIsLoading(true);

      try {
        const result = await getTaskTypes();

        if (result.success && result.taskTypes && result.taskTypes.length > 0) {
          // Map database types to display format
          const mappedTypes = result.taskTypes.map(convertTaskTypeConfig);
          setTaskTypes(mappedTypes);
        } else {
          setTaskTypes(DEFAULT_TASK_TYPES);
        }
      } catch (error) {
        console.error("[TaskTypeSelector] Error fetching task types:", error);
        setTaskTypes(DEFAULT_TASK_TYPES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskTypes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
        <span className="ml-2 text-sm text-gray-600">Loading task types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Task Type Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {taskTypes.map((taskType, index) => {
          const Icon = taskType.icon;
          const isSelected = selectedType === (taskType.id as TaskType);

          return (
            <motion.button
              key={taskType.id}
              type="button"
              onClick={() => {
                onSelect(taskType.id as TaskType);
              }}
              disabled={disabled}
              data-selected={isSelected}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`
                relative flex flex-col items-center p-4 sm:p-5 rounded-xl border-2
                transition-all duration-200 cursor-pointer
                ${taskType.bgClass} ${taskType.borderClass}
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${isSelected ? "ring-2 ring-offset-2 shadow-md" : "shadow-sm"}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              `}
              style={{
                "--tw-ring-color": isSelected ? taskType.ringColor : undefined,
              } as React.CSSProperties}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ backgroundColor: taskType.color }}
                  className="
                    absolute -top-2 -right-2 w-6 h-6 rounded-full
                    flex items-center justify-center shadow-md
                  "
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Icon Container */}
              <div
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3
                  ${taskType.bgLightClass}
                `}
              >
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${taskType.textClass}`} />
              </div>

              {/* Label */}
              <span className={`
                font-semibold text-sm sm:text-base mb-1
                ${taskType.textClass}
              `}>
                {taskType.name}
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
      <input
        type="hidden"
        name="task_type"
        value={selectedType || "work"}
      />
    </div>
  );
}

// Helper function to get task type display info
export function getTaskTypeInfo(type: TaskType) {
  return DEFAULT_TASK_TYPES.find((t) => t.id === type) || DEFAULT_TASK_TYPES[0];
}

// Task Type Badge component for displaying type in lists/details
export function TaskTypeBadge({ type }: { type: TaskType }) {
  const info = getTaskTypeInfo(type);
  const Icon = info.icon;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      ${info.bgClass} ${info.textClass}
    `}>
      <Icon className="w-3.5 h-3.5" />
      {info.name}
    </span>
  );
}
