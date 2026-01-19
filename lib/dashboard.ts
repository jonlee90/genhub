import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/app/actions/dashboard";
import { getProjectTypes } from "@/app/actions/project-types";
import type { ProjectTypeConfigsRow } from "@/types/db/tables/projects";
import type { DashboardDataResult } from "@/types/dashboard";

/**
 * Fetch dashboard data and project types in parallel
 * Uses React.cache() for per-request deduplication (async-parallel pattern)
 *
 * Performance:
 * - Fetches dashboard KPIs and project types simultaneously
 * - Reduces total fetch time vs sequential requests
 * - Passes prefetched project types to modal to avoid client-side fetch
 */
export const getDashboardPageData = cache(async function getDashboardPageData() {
  // Fetch dashboard data and project types in parallel (async-parallel pattern)
  const [dashboardResult, projectTypesResult] = await Promise.all([
    getDashboardData(),
    getProjectTypes(),
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
    };
  }

  if (!dashboardResult.data) {
    redirect("/login");
  }

  return {
    data: dashboardResult.data,
    error: null,
    projectTypes: projectTypesResult.success ? projectTypesResult.projectTypes || [] : [],
  };
});
