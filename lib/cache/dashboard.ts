"use cache";

import { cacheTag, cacheLife } from "next/cache";

/**
 * Cached dashboard KPIs
 * Uses materialized view for optimal performance
 */
export async function getCachedDashboardKPIs(companyId: string) {
  "use cache";
  cacheLife("short"); // Dashboard data changes frequently
  cacheTag("dashboard", "dashboard-kpis", `dashboard-${companyId}`);

  const { getDashboardData } = await import("@/app/actions/dashboard");
  return getDashboardData();
}
