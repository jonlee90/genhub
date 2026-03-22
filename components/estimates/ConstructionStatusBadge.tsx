"use client";

import { cn } from "@/lib/utils";

type ConstructionStatus = "new" | "existing_to_remain" | "demolition";

type ConstructionStatusBadgeProps = {
  status?: ConstructionStatus | null;
  className?: string;
};

const STATUS_CONFIG: Record<
  ConstructionStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  new: {
    label: "New",
    bgClass: "bg-blue-500/15 dark:bg-blue-500/20",
    textClass: "text-blue-700 dark:text-blue-300",
  },
  existing_to_remain: {
    label: "Existing",
    bgClass: "bg-gray-500/15 dark:bg-gray-500/20",
    textClass: "text-gray-700 dark:text-gray-300",
  },
  demolition: {
    label: "Demo",
    bgClass: "bg-red-500/15 dark:bg-red-500/20",
    textClass: "text-red-700 dark:text-red-300",
  },
};

export function ConstructionStatusBadge({
  status,
  className,
}: ConstructionStatusBadgeProps) {
  // Don't render if no status provided
  if (!status) return null;

  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.bgClass,
        config.textClass,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
