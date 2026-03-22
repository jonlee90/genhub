import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([auth(), request.json()]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, quantity, unit } = body;

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

    // Build update object (only include provided fields)
    const updates: any = {
      review_status: "edited", // Mark as edited when manually updated
    };
    if (quantity !== undefined) updates.quantity = quantity;
    if (unit !== undefined) updates.unit = unit;

    // Verify item belongs to company and update
    const { data: updatedItem, error: updateError } = await supabase
      .from("takeoff_items")
      .update(updates)
      .eq("id", itemId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (updateError || !updatedItem) {
      console.error("[takeoff-items/update] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update item or item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error("[takeoff-items/update] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update item",
      },
      { status: 500 },
    );
  }
}
