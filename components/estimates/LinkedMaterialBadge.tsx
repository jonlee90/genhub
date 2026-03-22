"use client";

import Link2 from "lucide-react/icons/link-2";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LinkedMaterialBadgeProps = {
  materialName: string;
  isStale?: boolean;
  onClick?: () => void;
};

export function LinkedMaterialBadge({
  materialName,
  isStale = false,
  onClick,
}: LinkedMaterialBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1",
        "min-h-[32px]",
        "text-xs font-medium rounded",
        "bg-construction-blue/10 text-construction-blue",
        "dark:bg-construction-blue/20 dark:text-construction-blue",
        "hover:bg-construction-blue/20 dark:hover:bg-construction-blue/30",
        "active:scale-95 transition-all",
        "relative",
      )}
      aria-label={`Linked to material: ${materialName}`}
    >
      <Link2 className="w-3 h-3" />
      <span className="truncate max-w-[100px]">{materialName}</span>
      {isStale ? (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
          aria-label="Stale price warning"
        />
      ) : null}
    </button>
  );
}
