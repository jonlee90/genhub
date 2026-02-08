import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const planUploadId = searchParams.get("planUploadId");

    if (!planUploadId) {
      return NextResponse.json(
        { error: "Missing planUploadId" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Get user's company
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (!companyUser) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const companyId = companyUser.company_id;

    // Verify plan upload belongs to company
    const { data: planUpload } = await supabase
      .from("plan_uploads")
      .select("id")
      .eq("id", planUploadId)
      .eq("company_id", companyId)
      .single();

    if (!planUpload) {
      return NextResponse.json(
        { error: "Plan upload not found or access denied" },
        { status: 404 },
      );
    }

    // Get all pages for this plan
    const { data: pages, error: pagesError } = await supabase
      .from("plan_pages")
      .select("id, page_number, parse_status")
      .eq("plan_upload_id", planUploadId)
      .order("page_number", { ascending: true });

    if (pagesError) {
      console.error("[parse-status] Error fetching pages:", pagesError);
      return NextResponse.json(
        { error: "Failed to fetch parse status" },
        { status: 500 },
      );
    }

    // Check if all pages are complete
    const allComplete = pages.every(
      (page) =>
        page.parse_status === "parsed" || page.parse_status === "parse_failed",
    );

    return NextResponse.json({
      success: true,
      data: {
        pages,
        allComplete,
      },
    });
  } catch (error) {
    console.error("[parse-status] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch status",
      },
      { status: 500 },
    );
  }
}
