import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getExtractionProgress } from "@/app/actions/estimates";
import { calculateETA } from "@/lib/extraction/result-assembler";
import type {
  ExtractionJob,
  ExtractionJobStatus,
} from "@/lib/extraction/progress-tracker";

function mapStatus(dbStatus: string): ExtractionJobStatus {
  switch (dbStatus) {
    case "pending":
      return "queued";
    case "claimed":
    case "processing":
      return "processing";
    case "completed":
      return "complete";
    case "failed":
      return "failed";
    default:
      return "queued";
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auth check — return 401 for unauthenticated requests
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planUploadId = searchParams.get("planUploadId");

    if (!planUploadId) {
      return NextResponse.json(
        { error: "planUploadId is required" },
        { status: 400 },
      );
    }

    const result = await getExtractionProgress(planUploadId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to get extraction progress" },
        { status: 500 },
      );
    }

    const rawJobs = (result.data ?? []) as unknown as Array<
      Record<string, unknown>
    >;

    const jobs: ExtractionJob[] = rawJobs.map((row) => ({
      id: (row.id as string) ?? "",
      planUploadId: (row.plan_upload_id as string) ?? planUploadId,
      pageNumber: row.page_number as number,
      status: mapStatus(row.status as string),
      progress: (row.progress as number) ?? 0,
      error: (row.error as string | null) ?? null,
      startedAt: (row.claimed_at as string | null) ?? null,
      completedAt: (row.completed_at as string | null) ?? null,
    }));

    const completedJobs = jobs.filter((j) => j.status === "complete");
    const completedCount = completedJobs.length;
    const remainingCount = jobs.length - completedCount;
    const percentage =
      jobs.length > 0 ? (completedCount / jobs.length) * 100 : 0;

    // Calculate average job duration from completed jobs that have timing data
    let eta: number | null = null;
    const jobsWithTiming = completedJobs.filter(
      (j) => j.startedAt && j.completedAt,
    );
    if (jobsWithTiming.length > 0) {
      const avgDurationMs =
        jobsWithTiming.reduce((sum, job) => {
          const start = new Date(job.startedAt!).getTime();
          const end = new Date(job.completedAt!).getTime();
          return sum + (end - start);
        }, 0) / jobsWithTiming.length;

      const etaResult = calculateETA(
        completedCount,
        remainingCount,
        avgDurationMs,
      );
      eta = etaResult.etaSeconds > 0 ? etaResult.etaSeconds : null;
    }

    let stage = "Initializing";
    if (percentage === 100) {
      stage = "Complete";
    } else if (percentage > 0) {
      stage = "Processing";
    }

    return NextResponse.json({ stage, percentage, eta, jobs });
  } catch (error) {
    console.error("[extraction-progress] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
