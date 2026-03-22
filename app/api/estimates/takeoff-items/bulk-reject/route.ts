import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([auth(), request.json()]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid itemIds" },
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

    // Verify items belong to company and update status
    const { data: updatedItems, error: updateError } = await supabase
      .from("takeoff_items")
      .update({ review_status: "rejected" })
      .in("id", itemIds)
      .eq("company_id", companyId)
      .select();

    if (updateError) {
      console.error("[takeoff-items/bulk-reject] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to reject items" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        count: updatedItems?.length || 0,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("[takeoff-items/bulk-reject] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to reject items",
      },
      { status: 500 },
    );
  }
}
