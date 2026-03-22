"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import X from "lucide-react/icons/x";

type StalePriceWarningProps = {
  staleItemCount: number;
  onReview: () => void;
};

export function StalePriceWarning({
  staleItemCount,
  onReview,
}: StalePriceWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || staleItemCount === 0) return null;

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          {staleItemCount} {staleItemCount === 1 ? "item has" : "items have"}{" "}
          outdated material prices ({">"}30 days old)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onReview}
          className="min-h-[44px] active:scale-95 border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40"
        >
          Review & Update
        </Button>
        <button
          onClick={() => setIsDismissed(true)}
          className={cn(
            "p-2 min-h-[44px] min-w-[44px]",
            "text-amber-600 hover:text-amber-700",
            "dark:text-amber-400 dark:hover:text-amber-300",
            "active:scale-95 transition-all",
          )}
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
