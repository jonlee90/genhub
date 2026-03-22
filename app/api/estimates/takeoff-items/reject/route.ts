import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([auth(), request.json()]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
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

    // Verify item belongs to company and update status
    const { data: updatedItem, error: updateError } = await supabase
      .from("takeoff_items")
      .update({ review_status: "rejected" })
      .eq("id", itemId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (updateError || !updatedItem) {
      console.error("[takeoff-items/reject] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to reject item or item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error("[takeoff-items/reject] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to reject item",
      },
      { status: 500 },
    );
  }
}
