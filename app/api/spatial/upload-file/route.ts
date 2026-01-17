/**
 * API Route: Upload File to Marker
 * - Accepts multipart/form-data with file and markerId
 * - Uploads to Vercel Blob
 * - Creates marker_content record
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log("[upload-file] POST request received");

  try {
    const [session, formData] = await Promise.all([auth(), request.formData()]);
    if (!session?.user?.id) {
      console.log("[upload-file] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const file = formData.get("file") as File | null;
    const markerId = formData.get("markerId") as string | null;

    if (!file || !markerId) {
      console.log("[upload-file] Missing file or markerId");
      return NextResponse.json(
        { error: "Missing file or markerId" },
        { status: 400 },
      );
    }

    console.log("[upload-file] File:", file.name, file.type, file.size);
    console.log("[upload-file] Marker ID:", markerId);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileId = crypto.randomUUID();
    const extension = file.name.split(".").pop() || "bin";
    const filename = `${fileId}.${extension}`;

    // Upload to Vercel Blob
    console.log("[upload-file] Uploading to Vercel Blob");
    const blob = await put(`markers/${markerId}/files/${filename}`, buffer, {
      access: "public",
      contentType: file.type,
    });

    // Create marker_content record
    console.log("[upload-file] Creating marker_content record");
    const { data: content, error: dbError } = await supabase
      .from("marker_content")
      .insert({
        marker_id: markerId,
        type: "file",
        file_url: blob.url,
        file_name: file.name,
        file_size_bytes: file.size,
        file_mime_type: file.type,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[upload-file] Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 },
      );
    }

    console.log("[upload-file] Success:", content.id);

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("[upload-file] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
