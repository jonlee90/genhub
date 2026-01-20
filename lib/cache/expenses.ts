"use cache";

import { cacheTag, cacheLife } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Cached expenses list data
 * Cache key includes companyId for tenant isolation
 *
 * IMPORTANT: Supabase client must be created OUTSIDE cache scope
 * and passed as parameter to avoid dynamic data source errors
 */
export async function getCachedExpensesData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  role: string,
) {
  "use cache";
  cacheLife("short"); // 1 min revalidate, 5 min expire
  cacheTag("expenses", `expenses-${companyId}`);

  const { getExpensesData } = await import("@/lib/expenses");
  return getExpensesData(supabase, companyId, role);
}
