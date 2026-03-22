"use client";

import { memo, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import CheckCircle from "lucide-react/icons/check-circle";
import XCircle from "lucide-react/icons/x-circle";
import Clock from "lucide-react/icons/clock";
import Loader2 from "lucide-react/icons/loader-2";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useExtractionProgress,
  type ExtractionJob,
  type ExtractionJobStatus,
} from "@/lib/extraction/progress-tracker";
import { retryFailedExtractionJobs } from "@/app/actions/estimates";

type ExtractionProgressProps = {
  planUploadId: string;
  onCancel?: () => void;
  onComplete?: () => void;
};

// Status color mapping
const STATUS_COLORS: Record<
  ExtractionJobStatus,
  { bg: string; border: string; icon: React.ReactNode }
> = {
  queued: {
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-300 dark:border-gray-600",
    icon: <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />,
  },
  processing: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-300 dark:border-blue-900/40",
    icon: (
      <Loader2 className="w-5 h-5 text-construction-blue dark:text-construction-blue animate-spin" />
    ),
  },
  complete: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-300 dark:border-green-900/40",
    icon: (
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
    ),
  },
  failed: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-300 dark:border-red-900/40",
    icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
  },
};

// Memoized page cell component
const PageCell = memo(function PageCell({
  job,
  onRetry,
}: {
  job: ExtractionJob;
  onRetry: (pageNumber: number) => void;
}) {
  const statusConfig = STATUS_COLORS[job.status];

  return (
    <div
      className={cn(
        "relative",
        "w-full",
        "h-[80px] md:h-[100px]",
        "rounded-lg border-2",
        "flex flex-col items-center justify-center gap-2",
        "transition-all",
        statusConfig.bg,
        statusConfig.border,
        job.status === "processing" && "animate-pulse",
      )}
    >
      {/* Status icon */}
      {statusConfig.icon}

      {/* Page number */}
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        Page {job.pageNumber}
      </p>

      {/* Retry button for failed jobs */}
      {job.status === "failed" ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRetry(job.pageNumber)}
          className={cn(
            "absolute inset-x-2 bottom-2",
            "min-h-[44px] px-2 text-xs",
            "bg-white dark:bg-gray-900",
            "hover:bg-red-50 dark:hover:bg-red-950/30",
            "active:scale-95",
          )}
          aria-label={`Retry page ${job.pageNumber}`}
        >
          Retry
        </Button>
      ) : null}

      {/* Progress percentage for processing */}
      {job.status === "processing" && job.progress > 0 ? (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {Math.round(job.progress)}%
        </p>
      ) : null}
    </div>
  );
});

function ExtractionProgressContent({
  planUploadId,
  onCancel,
  onComplete,
}: ExtractionProgressProps) {
  const { progress, isLoading, error } = useExtractionProgress(planUploadId);

  // Fire onComplete when all jobs finish
  useEffect(() => {
    if (progress?.percentage === 100) {
      onComplete?.();
    }
  }, [progress?.percentage, onComplete]);

  const handleRetry = async (pageNumber: number) => {
    try {
      const result = await retryFailedExtractionJobs(planUploadId, [
        pageNumber,
      ]);
      if (result.success) {
        toast.success(`Retrying page ${pageNumber}`);
      } else {
        toast.error(result.error || "Failed to retry");
      }
    } catch (err) {
      console.error("[ExtractionProgress] Retry error:", err);
      toast.error("Failed to retry extraction");
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(
        `/api/estimates/extract?planUploadId=${planUploadId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Extraction cancelled");
        onCancel?.();
      } else {
        toast.error("Failed to cancel extraction");
      }
    } catch (err) {
      console.error("[ExtractionProgress] Cancel error:", err);
      toast.error("Failed to cancel extraction");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-construction-blue dark:text-construction-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const { stage, percentage, eta, jobs = [] } = progress;
  const failedJobs = jobs.filter((j) => j.status === "failed");

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {stage}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(percentage)}% complete
              {eta ? (
                <span className="ml-2">• ETA: {Math.ceil(eta / 60)} min</span>
              ) : null}
            </p>
          </div>

          {/* Cancel button */}
          {percentage < 100 && onCancel ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className={cn(
                "min-h-[44px] min-w-[44px]",
                "text-red-600 hover:text-red-700 hover:bg-red-50",
                "dark:text-red-400 dark:hover:bg-red-950/30",
                "active:scale-95",
              )}
              aria-label="Cancel extraction"
            >
              Cancel
            </Button>
          ) : null}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-construction-blue dark:bg-construction-blue transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Page grid */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Page Status ({jobs.length} pages)
        </h4>

        <div className={cn("grid gap-3", "grid-cols-2 md:grid-cols-4")}>
          {jobs.map((job) => (
            <PageCell key={job.id} job={job} onRetry={handleRetry} />
          ))}
        </div>
      </div>

      {/* Failed jobs summary */}
      {failedJobs.length > 0 ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            {failedJobs.length} {failedJobs.length === 1 ? "page" : "pages"}{" "}
            failed
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            Click "Retry" on failed pages to try again
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function ExtractionProgress({
  planUploadId,
  onCancel,
  onComplete,
}: ExtractionProgressProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-construction-blue dark:text-construction-blue" />
        </div>
      }
    >
      <ExtractionProgressContent
        planUploadId={planUploadId}
        onCancel={onCancel}
        onComplete={onComplete}
      />
    </Suspense>
  );
}
