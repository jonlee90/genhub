import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/companies/[companyId]/subcontractors
 * Fetch all active subcontractors for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const [{ companyId }, session] = await Promise.all([params, auth()]);

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createAdminClient();

    // Verify user has access to this company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id, role, status")
      .eq("user_id", session.user.id)
      .eq("company_id", companyId)
      .eq("status", "active")
      .maybeSingle();

    if (companyError) {
      console.error(
        "[GET /api/companies/:companyId/subcontractors] Company user query error:",
        companyError,
      );
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!companyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all active subcontractors in this company
    const { data: subcontractors, error: subcontractorsError } = await supabase
      .from("subcontractors")
      .select(
        `
        id,
        company_name,
        contact_name,
        email,
        phone,
        trade_specialization,
        performance_rating
      `,
      )
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("company_name", { ascending: true });

    if (subcontractorsError) {
      console.error(
        "[GET /api/companies/:companyId/subcontractors] Subcontractors query error:",
        subcontractorsError,
      );
      return NextResponse.json(
        { error: "Failed to fetch subcontractors" },
        { status: 500 },
      );
    }

    return NextResponse.json({ subcontractors: subcontractors || [] });
  } catch (error) {
    console.error(
      "[GET /api/companies/:companyId/subcontractors] Unexpected error:",
      error,
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
