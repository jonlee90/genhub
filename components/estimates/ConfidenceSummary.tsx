"use client";

import { useState, useMemo, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfidenceThresholdSlider } from "@/components/estimates/ConfidenceThresholdSlider";
import CheckCheck from "lucide-react/icons/check-check";
import ShieldCheck from "lucide-react/icons/shield-check";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import ShieldAlert from "lucide-react/icons/shield-alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TakeoffItem } from "@/types/db/tables/estimates";

type ConfidenceSummaryProps = {
  items: TakeoffItem[];
  onBulkAccept: (itemIds: string[]) => Promise<void>;
  onContinue: () => void;
};

export function ConfidenceSummary({
  items,
  onBulkAccept,
  onContinue,
}: ConfidenceSummaryProps) {
  const [threshold, setThreshold] = useState(85);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  // Group items by confidence tier (rerender-defer-reads)
  const confidenceTiers = useMemo(() => {
    const thresholdDecimal = threshold / 100;

    const high = items.filter(
      (item) =>
        item.confidence >= thresholdDecimal && item.review_status === "pending",
    );
    const medium = items.filter(
      (item) =>
        item.confidence >= 0.6 &&
        item.confidence < thresholdDecimal &&
        item.review_status === "pending",
    );
    const low = items.filter(
      (item) => item.confidence < 0.6 && item.review_status === "pending",
    );

    return { high, medium, low };
  }, [items, threshold]);

  const handleBulkAccept = async () => {
    if (confidenceTiers.high.length === 0) {
      toast.error("No high-confidence items to accept");
      return;
    }

    setIsAccepting(true);
    const itemIds = confidenceTiers.high.map((item) => item.id);

    try {
      // Cascading animation with 100ms stagger (rerender-transitions)
      startTransition(() => {
        itemIds.forEach((id, index) => {
          setTimeout(() => {
            setAcceptedIds((prev) => new Set([...prev, id]));
          }, index * 100);
        });
      });

      await onBulkAccept(itemIds);

      toast.success(`${itemIds.length} items accepted`);

      // Small delay before continuing to show final animation
      setTimeout(
        () => {
          onContinue();
        },
        itemIds.length * 100 + 500,
      );
    } catch (error) {
      console.error("[ConfidenceSummary] Bulk accept error:", error);
      toast.error("Failed to accept items");
      setAcceptedIds(new Set());
    } finally {
      setIsAccepting(false);
    }
  };

  const totalPending = items.filter(
    (item) => item.review_status === "pending",
  ).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      {/* Summary header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Review Summary
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {totalPending} items detected from your plan
        </p>
      </div>

      {/* Confidence tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* High confidence */}
        <div
          className={cn(
            "p-4 rounded-lg border-2 transition-all",
            confidenceTiers.high.length > 0
              ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-900/40"
              : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck
              className={cn(
                "w-5 h-5",
                confidenceTiers.high.length > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500",
              )}
            />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              High Confidence
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {confidenceTiers.high.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ≥{threshold}% confidence
          </p>
        </div>

        {/* Medium confidence */}
        <div
          className={cn(
            "p-4 rounded-lg border-2 transition-all",
            confidenceTiers.medium.length > 0
              ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-900/40"
              : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle
              className={cn(
                "w-5 h-5",
                confidenceTiers.medium.length > 0
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-gray-400 dark:text-gray-500",
              )}
            />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Medium Confidence
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {confidenceTiers.medium.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            60-{threshold - 1}% confidence
          </p>
        </div>

        {/* Low confidence */}
        <div
          className={cn(
            "p-4 rounded-lg border-2 transition-all",
            confidenceTiers.low.length > 0
              ? "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-900/40"
              : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert
              className={cn(
                "w-5 h-5",
                confidenceTiers.low.length > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-400 dark:text-gray-500",
              )}
            />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Low Confidence
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {confidenceTiers.low.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            &lt;60% confidence
          </p>
        </div>
      </div>

      {/* Threshold slider */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <ConfidenceThresholdSlider
          defaultValue={threshold}
          onChange={setThreshold}
        />
      </div>

      {/* Accept all high confidence button */}
      <div className="space-y-3">
        <Button
          onClick={handleBulkAccept}
          disabled={confidenceTiers.high.length === 0 || isAccepting}
          className={cn(
            "w-full min-h-[44px] text-base font-semibold",
            "bg-green-600 hover:bg-green-700 active:bg-green-800",
            "text-white",
            "dark:bg-green-600 dark:hover:bg-green-700 dark:active:bg-green-800",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all active:scale-[0.98]",
          )}
          aria-label={`Accept all ${confidenceTiers.high.length} high confidence items`}
        >
          <CheckCheck className="w-5 h-5 mr-2" />
          {isAccepting
            ? "Accepting..."
            : `Accept All High Confidence (${confidenceTiers.high.length})`}
        </Button>

        <Button
          onClick={onContinue}
          variant="outline"
          className={cn(
            "w-full min-h-[44px] text-base font-medium",
            "transition-all active:scale-[0.98]",
          )}
          aria-label="Continue to review all items"
        >
          Review All Items
        </Button>
      </div>

      {/* Cascading checkmark preview */}
      {acceptedIds.size > 0 ? (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300 text-center">
            Accepting {acceptedIds.size} of {confidenceTiers.high.length}{" "}
            items...
          </p>
        </div>
      ) : null}
    </div>
  );
}
