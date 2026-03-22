"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

type ConstructionStatus = "new" | "existing_to_remain" | "demolition";

type ConstructionStatusFilterProps = {
  selectedStatuses: Set<ConstructionStatus>;
  onToggleStatus: (status: ConstructionStatus) => void;
  className?: string;
};

const STATUS_CONFIG: Record<
  ConstructionStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    activeBg: string;
    activeText: string;
  }
> = {
  new: {
    label: "New",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-blue-700 dark:text-blue-300",
    activeBg: "bg-blue-500 dark:bg-blue-600",
    activeText: "text-white dark:text-white",
  },
  existing_to_remain: {
    label: "Existing",
    bgClass: "bg-gray-100 dark:bg-gray-900/30",
    textClass: "text-gray-700 dark:text-gray-300",
    activeBg: "bg-gray-500 dark:bg-gray-600",
    activeText: "text-white dark:text-white",
  },
  demolition: {
    label: "Demo",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    textClass: "text-red-700 dark:text-red-300",
    activeBg: "bg-red-500 dark:bg-red-600",
    activeText: "text-white dark:text-white",
  },
};

export const ConstructionStatusFilter = memo(function ConstructionStatusFilter({
  selectedStatuses,
  onToggleStatus,
  className,
}: ConstructionStatusFilterProps) {
  const statuses: ConstructionStatus[] = [
    "new",
    "existing_to_remain",
    "demolition",
  ];

  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {statuses.map((status) => {
        const isSelected = selectedStatuses.has(status);
        const config = STATUS_CONFIG[status];

        return (
          <button
            key={status}
            onClick={() => onToggleStatus(status)}
            className={cn(
              "inline-flex items-center justify-center min-h-[44px] px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0",
              "active:scale-95",
              isSelected
                ? cn(config.activeBg, config.activeText)
                : cn(
                    config.bgClass,
                    config.textClass,
                    "hover:opacity-80 active:opacity-90",
                  ),
            )}
            aria-label={`Toggle ${config.label} items`}
            aria-pressed={isSelected}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
});
