"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

// ============================================
// Task Analytics
// ============================================

/**
 * Get comprehensive task analytics for a project or all projects
 * Returns 10 key metrics: completion, schedule, budget, blocked, workload,
 * materials, priority, expenses, dependencies, velocity
 *
 * @param projectFilter - 'all' or project UUID to filter analytics
 * @param companyId - Company UUID for RLS filtering
 * @returns TaskAnalytics data or error
 */
export async function getTaskAnalytics(
  projectFilter: string = "all",
  companyId: string,
): Promise<{
  data?: import("@/types/analytics").TaskAnalytics;
  error?: string;
}> {
  try {
    console.log("[getTaskAnalytics] Fetching analytics", {
      projectFilter,
      companyId,
    });

    // Auth check: require authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      console.error("[getTaskAnalytics] Not authenticated");
      return { error: "Not authenticated" };
    }

    // Input validation
    const validationSchema = z.object({
      projectFilter: z.union([
        z.literal("all"),
        z.string().uuid("Invalid project ID"),
      ]),
      companyId: z.string().uuid("Invalid company ID"),
    });

    const validationResult = validationSchema.safeParse({
      projectFilter,
      companyId,
    });
    if (!validationResult.success) {
      console.error(
        "[getTaskAnalytics] Validation failed:",
        validationResult.error,
      );
      return { error: "Invalid input parameters" };
    }

    // Create Supabase client
    const supabase = await createClient();

    // SECURITY: Verify user belongs to the requested company
    const { data: userCompany, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("company_id", companyId)
      .eq("status", "active")
      .single();

    if (companyError || !userCompany) {
      console.error(
        "[getTaskAnalytics] User does not belong to company:",
        companyId,
      );
      return { error: "Unauthorized" };
    }

    // SECURITY: If projectFilter is not 'all', verify project belongs to the company
    if (projectFilter !== "all") {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("company_id")
        .eq("id", projectFilter)
        .single();

      if (projectError || !project || project.company_id !== companyId) {
        console.error(
          "[getTaskAnalytics] Project does not belong to company:",
          { projectFilter, companyId },
        );
        return { error: "Invalid project" };
      }
    }

    // Call optimized PostgreSQL function
    const { data, error } = await supabase.rpc("get_task_analytics", {
      project_filter: projectFilter,
      p_company_id: companyId,
    });

    if (error) {
      console.error("[getTaskAnalytics] RPC error:", error);
      return { error: "Failed to fetch analytics" };
    }

    // Handle empty result set
    if (!data || data.length === 0) {
      console.warn("[getTaskAnalytics] No data returned");
      // Return empty analytics structure
      return {
        data: {
          completion: { total: 0, completed: 0, rate: 0 },
          schedule: { overdue: 0, atRisk: 0, onTime: 0 },
          budget: { planned: 0, actual: 0, variance: 0, utilization: 0 },
          blocked: { count: 0, rate: 0, topReasons: [] },
          workload: { unassigned: 0, topAssignees: [] },
          materials: { needed: 0, ordered: 0, delivered: 0 },
          priority: { high: 0, medium: 0, low: 0 },
          expenses: {
            pending: 0,
            pendingAmount: 0,
            approved: 0,
            approvedAmount: 0,
          },
          dependencies: { blockedByDeps: 0, ready: 0 },
          velocity: { tasksPerDay: 0, trend: 0 },
        },
      };
    }

    // Extract first row (function returns single row)
    const row = data[0];

    // Transform database result to TaskAnalytics interface
    const analytics: import("@/types/analytics").TaskAnalytics = {
      completion: {
        total: Number(row.total_tasks) || 0,
        completed: Number(row.completed) || 0,
        rate: Number(row.completion_rate) || 0,
      },
      schedule: {
        overdue: Number(row.overdue) || 0,
        atRisk: Number(row.at_risk) || 0,
        onTime: Number(row.on_time) || 0,
      },
      budget: {
        planned: Number(row.total_planned) || 0,
        actual: Number(row.total_actual) || 0,
        variance: Number(row.budget_variance) || 0,
        utilization: Number(row.budget_utilization) || 0,
      },
      blocked: {
        count: Number(row.blocked_count) || 0,
        rate: Number(row.blocked_rate) || 0,
        topReasons: (row.top_blocked_reasons as string[] | null) || [],
      },
      workload: {
        unassigned: Number(row.unassigned) || 0,
        topAssignees:
          (row.top_assignees_json as Array<{
            id: string;
            name: string;
            avatar_url: string | null;
            count: number;
          }> | null) || [],
      },
      materials: {
        needed: Number(row.materials_needed) || 0,
        ordered: Number(row.materials_ordered) || 0,
        delivered: Number(row.materials_delivered) || 0,
      },
      priority: {
        high: Number(row.priority_high) || 0,
        medium: Number(row.priority_medium) || 0,
        low: Number(row.priority_low) || 0,
      },
      expenses: {
        pending: Number(row.expenses_pending) || 0,
        pendingAmount: Number(row.pending_amount) || 0,
        approved: Number(row.expenses_approved) || 0,
        approvedAmount: Number(row.approved_amount) || 0,
      },
      dependencies: {
        blockedByDeps: Number(row.blocked_by_deps) || 0,
        ready: Number(row.ready_to_start) || 0,
      },
      velocity: {
        tasksPerDay: Number(row.tasks_per_day) || 0,
        trend: Number(row.velocity_trend) || 0,
      },
    };

    console.log("[getTaskAnalytics] Analytics fetched successfully", {
      totalTasks: analytics.completion.total,
      completionRate: analytics.completion.rate,
    });

    return { data: analytics };
  } catch (error) {
    console.error("[getTaskAnalytics] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}
