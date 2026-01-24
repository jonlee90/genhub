"use server";

/**
 * Client Portal Server Actions
 *
 * Handles client-specific permissions and data access for the client portal.
 * Permissions are managed at the company level via the companies table.
 *
 * @module app/actions/client
 */

import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

// ============================================
// Validation Schemas
// ============================================

const getClientPermissionsSchema = z.object({
  projectId: z.string().uuid(),
});

// ============================================
// Types
// ============================================

export interface ClientPermissions {
  can_view_budget: boolean;
  can_approve_change_orders: boolean; // Future feature
  can_view_invoices: boolean; // Future feature
}

// ============================================
// Server Actions
// ============================================

/**
 * Get client portal permissions for a company
 *
 * Fetches client-facing permission settings from the companies table.
 * These permissions control what information clients can view in the portal.
 *
 * @param projectId - Project ID (used to get company_id)
 * @returns ClientPermissions object or error
 *
 * @example
 * const { data: permissions, error } = await getClientPermissions(projectId);
 * if (!error && permissions.can_view_budget) {
 *   // Show budget information to client
 * }
 */
export async function getClientPermissions(input: unknown) {
  // Validate input
  const validation = getClientPermissionsSchema.safeParse(input);
  if (!validation.success) {
    console.error("[getClientPermissions] Validation failed:", validation.error);
    return { error: "Invalid project ID" };
  }

  const { projectId: _projectId } = validation.data;

  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    console.error("[getClientPermissions] Unauthorized: No session");
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // HIGH-2 FIX: Single query with join to eliminate N+1
  const { data: result, error } = await supabase
    .from("company_users")
    .select("company_id, companies!inner(client_can_view_budget)")
    .eq("user_id", session.user.id!)
    .eq("status", "active")
    .maybeSingle();

  if (error || !result) {
    console.error(
      "[getClientPermissions] Error fetching company permissions:",
      error,
    );
    // Default to no budget visibility on error
    return {
      data: {
        can_view_budget: false,
        can_approve_change_orders: false,
        can_view_invoices: false,
      },
    };
  }

  // Return permissions with defaults for future features
  // Note: client_can_view_budget column must exist on companies table
  // If column doesn't exist yet, default to false (migration not applied)
  return {
    data: {
      can_view_budget:
        (result.companies as any)?.client_can_view_budget || false,
      can_approve_change_orders: false, // Future feature - placeholder
      can_view_invoices: false, // Future feature - placeholder
    } as ClientPermissions,
  };
}
