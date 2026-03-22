import { useState, useEffect, useRef } from "react";
import { getBrowserClient } from "@/utils/supabase/browser";
import type { Database } from "@/types/database.types";

export type ExtractionJobStatus =
  | "queued"
  | "processing"
  | "complete"
  | "failed";

export type ExtractionJob = {
  id: string;
  planUploadId: string;
  pageNumber: number;
  status: ExtractionJobStatus;
  progress: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type ExtractionProgress = {
  stage: string;
  percentage: number;
  eta: number | null; // seconds
  jobs: ExtractionJob[];
};

export function useExtractionProgress(planUploadId: string) {
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(getBrowserClient());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof getBrowserClient>["channel"]
  > | null>(null);

  // Background processing: persist progress to localStorage
  useEffect(() => {
    if (progress && progress.percentage < 100) {
      try {
        localStorage.setItem(
          `extraction_progress_${planUploadId}`,
          JSON.stringify({
            stage: progress.stage,
            percentage: progress.percentage,
            timestamp: Date.now(),
          }),
        );
      } catch (err) {
        // Ignore localStorage errors
        console.warn("[useExtractionProgress] LocalStorage error:", err);
      }
    } else if (progress && progress.percentage === 100) {
      // Clear from localStorage when complete
      try {
        localStorage.removeItem(`extraction_progress_${planUploadId}`);
      } catch (err) {
        // Ignore localStorage errors
      }
    }
  }, [progress, planUploadId]);

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Initial fetch
    async function fetchProgress() {
      try {
        const response = await fetch(
          `/api/estimates/extraction-progress?planUploadId=${planUploadId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch extraction progress");
        }

        const data = await response.json();
        setProgress(data);
        setIsLoading(false);
      } catch (err) {
        console.error("[useExtractionProgress] Fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    }

    fetchProgress();

    // Set up Realtime subscription
    const channel = supabase
      .channel(`extraction_jobs:${planUploadId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "extraction_jobs",
          filter: `plan_upload_id=eq.${planUploadId}`,
        },
        (payload: { new: ExtractionJob }) => {
          const updatedJob = payload.new;

          setProgress((prev) => {
            if (!prev) return prev;

            // Update the specific job
            const updatedJobs = prev.jobs.map((job) =>
              job.id === updatedJob.id ? updatedJob : job,
            );

            // Recalculate progress
            const completedJobs = updatedJobs.filter(
              (j) => j.status === "complete",
            ).length;
            const totalJobs = updatedJobs.length;
            const percentage =
              totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

            // Estimate ETA based on completed jobs
            let eta: number | null = null;
            const completedWithTiming = updatedJobs.filter(
              (j) => j.status === "complete" && j.startedAt && j.completedAt,
            );

            if (completedWithTiming.length > 0) {
              const avgDuration =
                completedWithTiming.reduce((sum, job) => {
                  const start = new Date(job.startedAt!).getTime();
                  const end = new Date(job.completedAt!).getTime();
                  return sum + (end - start);
                }, 0) / completedWithTiming.length;

              const remainingJobs = totalJobs - completedJobs;
              eta = Math.ceil((avgDuration * remainingJobs) / 1000); // Convert to seconds
            }

            // Determine stage
            let stage = "Initializing";
            if (percentage === 100) {
              stage = "Complete";
            } else if (percentage > 0) {
              stage = "Processing";
            }

            return {
              stage,
              percentage,
              eta,
              jobs: updatedJobs,
            };
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "extraction_jobs",
          filter: `plan_upload_id=eq.${planUploadId}`,
        },
        (payload: { new: ExtractionJob }) => {
          const newJob = payload.new;

          setProgress((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              jobs: [...prev.jobs, newJob],
            };
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [planUploadId]);

  return { progress, isLoading, error };
}
