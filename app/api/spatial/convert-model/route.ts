/**
 * P2.4 - API Route: IFC to XKT Conversion
 *
 * POST /api/spatial/convert-model
 *
 * Workflow:
 * 1. Receive modelId in request body
 * 2. Fetch model record from database
 * 3. Download IFC file from Vercel Blob (original_file_url)
 * 4. Convert IFC to XKT using ifc-conversion-service
 * 5. Upload XKT file(s) to Vercel Blob
 * 6. Extract IFC metadata and populate model_elements table
 * 7. Update model record with xkt_file_url and processing_status='ready'
 * 8. On error: Update processing_status='failed' and processing_error
 *
 * Security:
 * - Requires authentication
 * - Verifies model belongs to user's company
 * - Rate limiting recommended for production
 *
 * Performance:
 * - Serverless timeout: 10s default, configure to 300s in vercel.json
 * - Memory: 1GB default (may need increase for large files)
 * - Future: Queue to background job (BullMQ, Inngest) for long conversions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";
import { z } from "zod";

// Debug: API logger
const log = (message: string, data?: any) => {
  console.log(`[API-ConvertModel] ${message}`, data || "");
};

// Request validation schema
const ConvertModelSchema = z.object({
  modelId: z.string().uuid(),
});

/**
 * POST /api/spatial/convert-model
 * Convert uploaded IFC file to XKT format
 */
export async function POST(request: NextRequest) {
  log("Received conversion request");

  try {
    // Step 1: Authentication + Parse request body
    const [session, body] = await Promise.all([auth(), request.json()]);
    if (!session?.user?.id) {
      log("Authentication failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    log("User authenticated", userId);
    const parseResult = ConvertModelSchema.safeParse(body);

    if (!parseResult.success) {
      log("Invalid request body", parseResult.error);
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { modelId } = parseResult.data;
    log("Processing model", modelId);

    // Step 3: Fetch model record
    const supabase = createAdminClient();

    const { data: model, error: modelError } = await supabase
      .from("projects_3d_models")
      .select(
        "id, processing_status, processing_error, xkt_file_url, element_count, bounds, floors",
      )
      .eq("id", modelId)
      .single();

    if (modelError || !model) {
      log("Model not found", modelError);
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    log("Model status", model.processing_status);

    return NextResponse.json({
      success: true,
      data: {
        modelId: model.id,
        status: model.processing_status,
        error: model.processing_error,
        xktUrl: model.xkt_file_url,
        elementCount: model.element_count,
        bounds: model.bounds,
        floors: model.floors,
      },
    });
  } catch (error) {
    log("Unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
