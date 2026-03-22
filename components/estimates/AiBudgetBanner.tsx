"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Badge } from "@/components/ui/badge";
import Sparkles from "lucide-react/icons/sparkles";
import X from "lucide-react/icons/x";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import { cn } from "@/lib/utils";

type AiBudgetBannerProps = {
  creditsUsed: number;
  creditsTotal: number;
  onDismiss?: () => void;
};

export function AiBudgetBanner({
  creditsUsed,
  creditsTotal,
  onDismiss,
}: AiBudgetBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const percentageUsed = (creditsUsed / creditsTotal) * 100;
  const isWarning = percentageUsed >= 75;
  const isCritical = percentageUsed >= 90;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <>
      {/* Banner */}
      <div
        className={cn(
          "p-4 rounded-lg border transition-colors",
          isCritical
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40"
            : isWarning
              ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/40"
              : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              isCritical
                ? "bg-red-100 dark:bg-red-900/50"
                : isWarning
                  ? "bg-yellow-100 dark:bg-yellow-900/50"
                  : "bg-blue-100 dark:bg-blue-900/50",
            )}
          >
            {isWarning ? (
              <AlertTriangle
                className={cn(
                  "w-4 h-4",
                  isCritical
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400",
                )}
              />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4
                  className={cn(
                    "text-sm font-bold mb-1",
                    isCritical
                      ? "text-red-900 dark:text-red-100"
                      : isWarning
                        ? "text-yellow-900 dark:text-yellow-100"
                        : "text-blue-900 dark:text-blue-100",
                  )}
                >
                  {isCritical
                    ? "AI Credits Almost Exhausted"
                    : isWarning
                      ? "AI Credits Running Low"
                      : "AI Credits"}
                </h4>
                <p
                  className={cn(
                    "text-xs",
                    isCritical
                      ? "text-red-700 dark:text-red-300"
                      : isWarning
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-blue-700 dark:text-blue-300",
                  )}
                >
                  {creditsUsed.toLocaleString()} /{" "}
                  {creditsTotal.toLocaleString()} credits used (
                  {percentageUsed.toFixed(1)}%)
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="min-h-[32px] min-w-[32px] -mr-2 -mt-1 active:scale-95"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isCritical
                    ? "bg-red-600 dark:bg-red-400"
                    : isWarning
                      ? "bg-yellow-600 dark:bg-yellow-400"
                      : "bg-blue-600 dark:bg-blue-400",
                )}
                style={{ width: `${percentageUsed}%` }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(true)}
                className="min-h-[36px] active:scale-95 text-xs"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded modal */}
      {isExpanded ? (
        <ResponsiveModal
          isOpen={true}
          onClose={() => setIsExpanded(false)}
          title="AI Credit Usage"
        >
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Credits Used
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {creditsUsed.toLocaleString()} /{" "}
                  {creditsTotal.toLocaleString()}
                </p>
              </div>

              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isCritical
                      ? "bg-red-600 dark:bg-red-400"
                      : isWarning
                        ? "bg-yellow-600 dark:bg-yellow-400"
                        : "bg-blue-600 dark:bg-blue-400",
                  )}
                  style={{ width: `${percentageUsed}%` }}
                />
              </div>
            </div>

            {/* Usage breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Credit Breakdown
              </h4>

              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-700 dark:text-gray-300">
                    Plan parsing
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    5,000 credits
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-700 dark:text-gray-300">
                    Takeoff generation
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    8,500 credits
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-700 dark:text-gray-300">
                    Cost estimation
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    2,000 credits
                  </span>
                </div>
              </div>
            </div>

            {/* Warning message */}
            {isWarning ? (
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  isCritical
                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40"
                    : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/40",
                )}
              >
                <p
                  className={cn(
                    "text-sm",
                    isCritical
                      ? "text-red-700 dark:text-red-300"
                      : "text-yellow-700 dark:text-yellow-300",
                  )}
                >
                  {isCritical
                    ? "You're almost out of AI credits. Consider upgrading your plan or wait for the monthly reset."
                    : "You're running low on AI credits. Monitor your usage to avoid running out before the monthly reset."}
                </p>
              </div>
            ) : null}

            <Button
              onClick={() => setIsExpanded(false)}
              className="w-full min-h-[44px] active:scale-95"
            >
              Close
            </Button>
          </div>
        </ResponsiveModal>
      ) : null}
    </>
  );
}
