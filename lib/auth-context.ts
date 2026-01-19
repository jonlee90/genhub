"use server";

import { cache } from "react";
import { auth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

/**
 * CRITICAL OPTIMIZATION (CRIT-001): Cached user context helper
 * Wrapped with React.cache to prevent redundant auth + DB queries
 * Estimated savings: 50-150ms per redundant call, 2-5 calls avoided per page load
 *
 * @returns User context with userId, companyId, role, and supabase client
 */
export const getUserContext = cache(async function getUserContext() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  // Create Supabase client
  const supabase = await createClient();

  // Get user's company and role using NextAuth user ID
  const { data: companyUser, error: companyError } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (companyError || !companyUser) {
    return { error: "No active company found for user" };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
});
