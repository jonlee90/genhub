import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/app/actions/dashboard";
import { getProjectTypes } from "@/app/actions/project-types";
import { getTaskTypes } from "@/app/actions/task-types";
import type { ProjectTypeConfigsRow } from "@/types/db/tables/projects";
import type { TaskTypeConfigsRow } from "@/types/db/tables/tasks";
import type { DashboardDataResult } from "@/types/dashboard";

/**
 * Fetch dashboard data, project types, and task types in parallel
 * Uses React.cache() for per-request deduplication (async-parallel pattern)
 *
 * Performance:
 * - Fetches dashboard KPIs, project types, and task types simultaneously
 * - Reduces total fetch time vs sequential requests
 * - Passes prefetched types to modals to avoid client-side fetch
 */
export const getDashboardPageData = cache(async function getDashboardPageData() {
  // Fetch dashboard data, project types, and task types in parallel (async-parallel pattern)
  const [dashboardResult, projectTypesResult, taskTypesResult] = await Promise.all([
    getDashboardData(),
    getProjectTypes(),
    getTaskTypes(),
  ]);

  // Handle dashboard data errors
  if (dashboardResult.error) {
    if (
      dashboardResult.error === "Not authenticated" ||
      dashboardResult.error === "No active company found for user"
    ) {
      redirect("/login");
    }
    return {
      data: null,
      error: dashboardResult.error,
      projectTypes: [],
      taskTypes: [],
    };
  }

  if (!dashboardResult.data) {
    redirect("/login");
  }

  return {
    data: dashboardResult.data,
    error: null,
    projectTypes: projectTypesResult.success ? projectTypesResult.projectTypes || [] : [],
    taskTypes: taskTypesResult.success ? taskTypesResult.taskTypes || [] : [],
  };
});
