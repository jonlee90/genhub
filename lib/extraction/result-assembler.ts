/**
 * Result Assembler - Progressive extraction result loading
 * Handles streaming takeoff items as they're detected via Realtime
 *
 * Tasks: P1.11 (EST-P1-011) - Progressive Result Loading
 */

export interface ExtractionProgress {
  planUploadId: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  currentStage: string | null;
  progressPct: number;
  pageStatuses: {
    pageNumber: number;
    stages: { stage: string; status: string }[];
  }[];
}

/**
 * Calculate extraction progress from job states
 */
export function calculateExtractionProgress(
  jobs: Array<{
    page_number: number;
    stage: string;
    status: string;
  }>,
  planUploadId: string,
): ExtractionProgress {
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  const progressPct = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  // Get current stage from first processing/claimed job
  const activeJob = jobs.find(
    (j) => j.status === "processing" || j.status === "claimed",
  );
  const currentStage = activeJob?.stage || null;

  // Group jobs by page number
  const pageMap = new Map<number, Array<{ stage: string; status: string }>>();
  for (const job of jobs) {
    if (!pageMap.has(job.page_number)) {
      pageMap.set(job.page_number, []);
    }
    pageMap.get(job.page_number)!.push({
      stage: job.stage,
      status: job.status,
    });
  }

  const pageStatuses = Array.from(pageMap.entries())
    .map(([pageNumber, stages]) => ({
      pageNumber,
      stages,
    }))
    .sort((a, b) => a.pageNumber - b.pageNumber);

  return {
    planUploadId,
    totalJobs,
    completedJobs,
    failedJobs,
    currentStage,
    progressPct,
    pageStatuses,
  };
}

/**
 * Get overall page status for UI display
 */
export function getPageStatus(
  stages: Array<{ stage: string; status: string }>,
): {
  status: "pending" | "processing" | "completed" | "failed";
  stageLabel: string;
} {
  const hasCompleted = stages.some((s) => s.status === "completed");
  const hasFailed = stages.some((s) => s.status === "failed");
  const hasProcessing = stages.some(
    (s) => s.status === "processing" || s.status === "claimed",
  );

  if (hasFailed) {
    const failedStage = stages.find((s) => s.status === "failed");
    return {
      status: "failed",
      stageLabel: failedStage?.stage || "extraction",
    };
  }

  if (hasProcessing) {
    const processingStage = stages.find(
      (s) => s.status === "processing" || s.status === "claimed",
    );
    return {
      status: "processing",
      stageLabel: processingStage?.stage || "extraction",
    };
  }

  if (hasCompleted && stages.every((s) => s.status === "completed")) {
    return {
      status: "completed",
      stageLabel: "complete",
    };
  }

  return {
    status: "pending",
    stageLabel: "queued",
  };
}

/**
 * Format stage name for display
 */
export function formatStageName(stage: string): string {
  const stageNames: Record<string, string> = {
    extract_vectors: "Extracting geometry",
    classify_sheet: "Classifying sheet",
    detect_scale: "Detecting scale",
    detect_elements: "Detecting elements",
    detect_rooms: "Detecting rooms",
    extract_schedules: "Extracting schedules",
    extract_mep: "Extracting MEP",
    calculate_quantities: "Calculating quantities",
    cross_page_reconcile: "Reconciling pages",
    generate_estimate: "Generating estimate",
  };

  return stageNames[stage] || stage;
}

/**
 * Calculate ETA based on average job duration
 */
export function calculateETA(
  completedJobs: number,
  remainingJobs: number,
  avgJobDurationMs: number,
): {
  etaSeconds: number;
  etaLabel: string;
} {
  if (completedJobs === 0 || remainingJobs === 0) {
    return {
      etaSeconds: 0,
      etaLabel: "Calculating...",
    };
  }

  const etaMs = remainingJobs * avgJobDurationMs;
  const etaSeconds = Math.ceil(etaMs / 1000);

  let etaLabel: string;
  if (etaSeconds < 60) {
    etaLabel = `${etaSeconds}s`;
  } else if (etaSeconds < 3600) {
    const minutes = Math.ceil(etaSeconds / 60);
    etaLabel = `${minutes}m`;
  } else {
    const hours = Math.floor(etaSeconds / 3600);
    const minutes = Math.ceil((etaSeconds % 3600) / 60);
    etaLabel = `${hours}h ${minutes}m`;
  }

  return {
    etaSeconds,
    etaLabel,
  };
}
