import { cache } from "react";
import { auth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import type { UserRole } from "@/types/db/enums";

// ============================================
// Types
// ============================================

export type UserContextResult =
  | {
      userId: string;
      companyId: string;
      role: UserRole;
      supabase: Awaited<ReturnType<typeof createClient>>;
    }
  | { error: string };

export type AdminUserContextResult =
  | {
      userId: string;
      companyId: string;
      role: "admin";
      supabase: Awaited<ReturnType<typeof createClient>>;
    }
  | { error: string };

// ============================================
// Cached User Context
// ============================================

/**
 * Get authenticated user context with company info.
 * Cached per-request to avoid redundant auth/DB lookups.
 * React cache() ensures this runs only once per request.
 */
export const getUserContext = cache(async (): Promise<UserContextResult> => {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data: companyUser, error: companyError } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (companyError || !companyUser) {
    return { error: "No active company found for user" };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role as UserRole,
    supabase,
  };
});

/**
 * Get authenticated user context, requiring admin role.
 * Use for admin-only operations like managing project types.
 */
export const getAdminUserContext = cache(
  async (): Promise<AdminUserContextResult> => {
    const result = await getUserContext();

    if ("error" in result) {
      return result;
    }

    if (result.role !== "admin") {
      return {
        error: "Insufficient permissions. Only Admin can perform this action.",
      };
    }

    return {
      ...result,
      role: "admin" as const,
    };
  },
);

// ============================================
// Helper Functions
// ============================================

/**
 * Verify that the user has access to a specific project.
 */
export async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  companyId: string,
): Promise<{ error: string } | { project: { id: string; company_id: string } }> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .single();

  if (error || !project) {
    return { error: "Project not found or access denied" };
  }

  return { project };
}

/**
 * Type guard to check if result has an error
 */
export function hasError<T extends { error: string }>(
  result: T | { error: string },
): result is { error: string } {
  return "error" in result;
}
