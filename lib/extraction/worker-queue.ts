/**
 * Worker Queue (VEC-014)
 *
 * Job lifecycle functions for the extraction_jobs table:
 *   VEC-014.1: claimJob, completeJob, failJob, heartbeat
 *   VEC-014.2: processJob (stage routing + heartbeat), recoverStaleJobs
 *
 * All database operations use the admin client (service role) to bypass RLS.
 * RLS on extraction_jobs is SELECT-only — mutations require admin client.
 */

import { createAdminClient } from "@/utils/supabase/server";

// ---------------------------------------------------------------------------
// VEC-014.1: Job lifecycle functions
// ---------------------------------------------------------------------------

/**
 * Claim the next pending extraction job for this worker.
 * Uses the SKIP LOCKED claim_extraction_job() RPC defined in migration
 * 20260217000001_create_extraction_jobs.sql.
 *
 * @param workerId - Unique identifier for the calling worker process
 * @returns The claimed job row, or null if no pending jobs are available
 */
export async function claimJob(
  workerId: string,
): Promise<Record<string, unknown> | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc(
    "claim_extraction_job" as any, // TODO: Remove after VEC-013 types are regenerated
    { worker_id: workerId },
  );

  if (error) {
    console.error("[worker-queue] claimJob error:", error);
    throw error;
  }

  // RPC returns null when no pending jobs exist
  if (!data) return null;

  return data as Record<string, unknown>;
}

/**
 * Mark a job as successfully completed and store the result payload.
 *
 * @param jobId  - The UUID of the extraction job
 * @param result - Arbitrary result payload to store as JSONB
 */
export async function completeJob(
  jobId: string,
  result: unknown,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("extraction_jobs" as any) // TODO: Remove after VEC-013 types are regenerated
    .update({
      status: "completed" as any,
      result: result as any,
      completed_at: new Date().toISOString(),
    } as any)
    .eq("id", jobId);

  if (error) {
    console.error("[worker-queue] completeJob error:", error);
    throw error;
  }
}

/**
 * Record a job failure and either retry or move to dead-letter queue.
 *
 * @param jobId          - The UUID of the extraction job
 * @param errorMessage   - Human-readable error message
 * @param currentAttempt - Current attempt count (0-based, read from job row)
 * @param maxAttempts    - Maximum allowed attempts (from job.max_attempts)
 */
export async function failJob(
  jobId: string,
  errorMessage: string,
  currentAttempt: number,
  maxAttempts: number,
): Promise<void> {
  const supabase = createAdminClient();

  const nextAttempt = currentAttempt + 1;
  const nextStatus = nextAttempt >= maxAttempts ? "dead_letter" : "failed";

  const { error } = await supabase
    .from("extraction_jobs" as any) // TODO: Remove after VEC-013 types are regenerated
    .update({
      status: nextStatus as any,
      error: errorMessage,
      attempt: nextAttempt,
      claimed_at: null,
      heartbeat_at: null,
    } as any)
    .eq("id", jobId);

  if (error) {
    console.error("[worker-queue] failJob error:", error);
    throw error;
  }
}

/**
 * Update the heartbeat timestamp to signal liveness to the stale-job
 * recovery process.
 *
 * @param jobId - The UUID of the extraction job
 */
export async function heartbeat(jobId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("extraction_jobs" as any) // TODO: Remove after VEC-013 types are regenerated
    .update({ heartbeat_at: new Date().toISOString() } as any)
    .eq("id", jobId);

  if (error) {
    // Heartbeat failures are non-fatal — log and continue
    console.warn("[worker-queue] heartbeat error (non-fatal):", error);
  }
}

// ---------------------------------------------------------------------------
// VEC-014.2: Job processing pipeline
// ---------------------------------------------------------------------------

/**
 * Process a single claimed extraction job.
 *
 * Routes by job.stage to the appropriate handler stub. Sends a heartbeat
 * every 10 seconds during processing. Calls completeJob on success and
 * failJob on error.
 *
 * Stage routing:
 *   extract_vectors      → stub (handled directly in the API route)
 *   classify_sheet       → stub
 *   detect_scale         → stub
 *   detect_elements      → stub
 *   detect_rooms         → stub
 *   extract_schedules    → stub (VEC-016 not yet implemented)
 *   extract_mep          → stub (VEC-018 not yet implemented)
 *   calculate_quantities → stub
 *   cross_page_reconcile → stub
 *   generate_estimate    → stub
 *
 * @param job - The claimed job row (Record<string, unknown>)
 */
export async function processJob(job: Record<string, unknown>): Promise<void> {
  const jobId = job.id as string;

  // Heartbeat every 10 seconds to prevent stale-job recovery from reclaiming
  const heartbeatInterval = setInterval(() => {
    heartbeat(jobId).catch((err) =>
      console.warn("[worker-queue] heartbeat interval error:", err),
    );
  }, 10_000);

  try {
    const stage = job.stage as string;

    switch (stage) {
      case "extract_vectors":
        // Actual extraction is handled by app/api/estimates/extract/route.ts
        // Worker queue stub — no-op
        break;

      case "classify_sheet":
        // VEC-005: Sheet classification stub
        break;

      case "detect_scale":
        // VEC-003: Scale detection stub
        break;

      case "detect_elements":
        // VEC-008/009: Door and window detection stub
        break;

      case "detect_rooms":
        // VEC-010: Room detection stub
        break;

      case "extract_schedules":
        // VEC-016: Schedule extraction — not yet implemented
        console.log("VEC-016 not yet implemented");
        break;

      case "extract_mep":
        // VEC-018: MEP extraction — not yet implemented
        console.log("VEC-018 not yet implemented");
        break;

      case "calculate_quantities":
        // VEC-011: Quantity calculation stub
        break;

      case "cross_page_reconcile":
        // VEC-012: Cross-page reconciliation stub
        break;

      case "generate_estimate":
        // VEC-015: Estimate generation stub
        break;

      default:
        throw new Error(`Unknown stage: ${stage}`);
    }

    clearInterval(heartbeatInterval);
    await completeJob(jobId, {});
  } catch (err) {
    clearInterval(heartbeatInterval);

    const errorMessage =
      err instanceof Error
        ? err.message
        : "Unknown error during job processing";
    const currentAttempt = (job.attempt as number) ?? 0;
    const maxAttempts = (job.max_attempts as number) ?? 3;

    await failJob(jobId, errorMessage, currentAttempt, maxAttempts);
  }
}

// ---------------------------------------------------------------------------
// VEC-014.2: Stale job recovery
// ---------------------------------------------------------------------------

/**
 * Find claimed jobs whose heartbeat has not been updated in ≥60 seconds
 * and reset them to pending so another worker can claim them.
 *
 * This prevents jobs from being permanently stuck if a worker crashes
 * without completing or failing them.
 *
 * @returns Number of jobs recovered (reset from claimed → pending)
 */
export async function recoverStaleJobs(): Promise<number> {
  const supabase = createAdminClient();

  // Raw SQL via Supabase RPC equivalent: use rpc for the interval comparison
  // Supabase JS client does not expose NOW() - INTERVAL directly in .update(),
  // so we use execute via rpc or a workaround using ISO timestamp arithmetic.
  // We compute the cutoff in JS: now - 60 seconds.
  const cutoff = new Date(Date.now() - 60_000).toISOString();

  const { data, error } = await supabase
    .from("extraction_jobs" as any) // TODO: Remove after VEC-013 types are regenerated
    .update({
      status: "pending" as any,
      claimed_at: null,
      heartbeat_at: null,
    } as any)
    .eq("status", "claimed" as any)
    .lt("heartbeat_at", cutoff)
    .select("id");

  if (error) {
    console.error("[worker-queue] recoverStaleJobs error:", error);
    throw error;
  }

  const recovered = (data as unknown[])?.length ?? 0;

  if (recovered > 0) {
    console.log(`[worker-queue] Recovered ${recovered} stale job(s)`);
  }

  return recovered;
}
