"use cache";

import { cacheTag, cacheLife } from "next/cache";

/**
 * Cached expenses list data
 * Cache key includes companyId for tenant isolation
 */
export async function getCachedExpensesData(companyId: string, role: string) {
  "use cache";
  cacheLife("short"); // 1 min revalidate, 5 min expire
  cacheTag("expenses", `expenses-${companyId}`);

  const { getExpensesData } = await import("@/lib/expenses");
  return getExpensesData(companyId, role);
}
