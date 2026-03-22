import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EstimateStatus } from "@/types/db/tables/estimates";

type EstimateStatusBadgeProps = {
  status: EstimateStatus;
};

const STATUS_CONFIG: Record<
  EstimateStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  },
  reviewed: {
    label: "Reviewed",
    className:
      "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
  },
  approved: {
    label: "Approved",
    className:
      "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/40",
  },
  superseded: {
    label: "Superseded",
    className:
      "bg-gray-100 text-gray-500 border-gray-300 line-through dark:bg-gray-800 dark:text-gray-500 dark:border-gray-600",
  },
};

export function EstimateStatusBadge({ status }: EstimateStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <Badge
      className={cn(
        "px-2 py-1 text-xs font-bold border uppercase tracking-wider",
        config.className,
      )}
    >
      {config.label}
    </Badge>
  );
}
