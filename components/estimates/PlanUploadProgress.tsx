"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import Loader2 from "lucide-react/icons/loader-2";
import FileText from "lucide-react/icons/file-text";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronUp from "lucide-react/icons/chevron-up";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { getPlanPageStatus } from "@/app/actions/estimates";
import { ExtractionProgress } from "@/components/estimates/ExtractionProgress";
import type { PlanUpload } from "@/types/db/tables/estimates";

type PlanUploadProgressProps = {
  planUpload: PlanUpload;
  projectId: string;
  onNavigateToReview?: (planUploadId: string) => void;
};

export function PlanUploadProgress({
  planUpload,
  projectId,
  onNavigateToReview,
}: PlanUploadProgressProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<
    "idle" | "parsing" | "parsed" | "parse_failed"
  >("idle");
  const [showProgress, setShowProgress] = useState(false);

  // Check if plan has already been parsed on mount
  useEffect(() => {
    if (planUpload.status !== "ready") return;

    // Check localStorage for ongoing extraction (background processing)
    try {
      const savedProgress = localStorage.getItem(
        `extraction_progress_${planUpload.id}`,
      );
      if (savedProgress) {
        const data = JSON.parse(savedProgress);
        const age = Date.now() - data.timestamp;
        // If progress was saved within the last 5 minutes, show it
        if (age < 5 * 60 * 1000) {
          setParseStatus("parsing");
          setShowProgress(true);
          setIsParsing(true);
        }
      }
    } catch (err) {
      // Ignore localStorage errors
    }

    getPlanPageStatus(planUpload.id).then((result) => {
      if (result.success && result.data.allParsed) {
        setParseStatus("parsed");
        setShowProgress(false);
        setIsParsing(false);
        // Clear localStorage
        try {
          localStorage.removeItem(`extraction_progress_${planUpload.id}`);
        } catch (err) {
          // Ignore
        }
      }
    });
  }, [planUpload.id, planUpload.status]);

  const getStatusDisplay = () => {
    switch (planUpload.status) {
      case "uploading":
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: "Uploading...",
          className:
            "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
        };
      case "processing":
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: "Processing...",
          className:
            "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
        };
      case "ready":
        return {
          icon: <Check className="w-4 h-4" />,
          text: parseStatus === "parsing" ? "Parsing..." : "Ready",
          className:
            parseStatus === "parsing"
              ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40"
              : "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/40",
        };
      case "failed":
        return {
          icon: <X className="w-4 h-4" />,
          text: "Failed",
          className:
            "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40",
        };
      default:
        return {
          icon: <FileText className="w-4 h-4" />,
          text: "Unknown",
          className:
            "bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
        };
    }
  };

  const handleParseClick = useCallback(async () => {
    setIsParsing(true);
    setParseError(null);
    setParseStatus("parsing");
    setShowProgress(false);

    try {
      const response = await fetch("/api/estimates/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planUploadId: planUpload.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract plan");
      }

      const result = await response.json();
      const { jobCount = 0, pageResults = [] } = result.data ?? {};
      const itemsWritten = (
        pageResults as Array<{ itemsWritten?: number }>
      ).reduce((sum, p) => sum + (p.itemsWritten || 0), 0);

      if (jobCount === 0) {
        // Vector engine ran synchronously — all done
        setParseStatus("parsed");
        setIsParsing(false);
        toast.success(
          itemsWritten > 0
            ? `Extraction complete — ${itemsWritten} item(s) found`
            : "Extraction complete",
        );
        if (onNavigateToReview) {
          onNavigateToReview(planUpload.id);
        }
      } else {
        // Background jobs created (OpenAI path) — show progress panel
        setShowProgress(true);
        toast.info(`Processing ${jobCount} page(s)...`);
        // isParsing stays true until onComplete fires
      }
    } catch (error) {
      console.error("[PlanUploadProgress] Extract error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to extract plan";
      setParseError(message);
      setParseStatus("parse_failed");
      setIsParsing(false);
      toast.error(message);
    }
  }, [planUpload.id, onNavigateToReview]);

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        {/* File info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-construction-blue dark:text-construction-blue" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {planUpload.filename}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(planUpload.created_at, { includeYear: true })}
            </p>

            {planUpload.status === "failed" && planUpload.error_message ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                {planUpload.error_message}
              </p>
            ) : null}
          </div>
        </div>

        {/* Status badge */}
        <Badge
          className={cn(
            "px-2 py-1 text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap flex-shrink-0",
            statusDisplay.className,
          )}
        >
          {parseStatus === "parsing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            statusDisplay.icon
          )}
          {statusDisplay.text}
        </Badge>
      </div>

      {/* Action buttons */}
      {planUpload.status === "ready" ? (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            {parseStatus === "parsed" ? (
              <Button
                size="sm"
                onClick={() => {
                  if (onNavigateToReview) {
                    onNavigateToReview(planUpload.id);
                  }
                }}
                className="min-h-[44px] min-w-[44px] active:scale-95"
                aria-label="View takeoff items"
              >
                View Takeoff Items
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleParseClick}
                disabled={isParsing || parseStatus === "parsing"}
                className="min-h-[44px] min-w-[44px] active:scale-95"
                aria-label={
                  isParsing ? "Extracting plan items" : "Extract plan items"
                }
              >
                {isParsing || parseStatus === "parsing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Extracting...
                  </>
                ) : (
                  "Extract Items"
                )}
              </Button>
            )}

            {/* Toggle progress view button */}
            {parseStatus === "parsing" && showProgress ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowProgress((prev) => !prev)}
                className="min-h-[44px] min-w-[44px] active:scale-95"
                aria-label={showProgress ? "Hide progress" : "Show progress"}
              >
                {showProgress ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Progress
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show Progress
                  </>
                )}
              </Button>
            ) : null}
          </div>

          {/* Per-page extraction progress */}
          {showProgress && parseStatus === "parsing" ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <ExtractionProgress
                planUploadId={planUpload.id}
                onComplete={() => {
                  setParseStatus("parsed");
                  setIsParsing(false);
                  setShowProgress(false);
                  if (onNavigateToReview) {
                    onNavigateToReview(planUpload.id);
                  }
                }}
                onCancel={() => {
                  setParseStatus("idle");
                  setIsParsing(false);
                  setShowProgress(false);
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Parse error display */}
      {parseError ? (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-300 mb-2">
            {parseError}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setParseError(null);
              setParseStatus("idle");
              handleParseClick();
            }}
            className="min-h-[44px] active:scale-95"
            aria-label="Retry extraction"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {/* Upload failed retry */}
      {planUpload.status === "failed" ? (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            className="min-h-[44px] min-w-[44px]"
            disabled
          >
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
