/**
 * API Route: Upload Photo to Marker
 * - Accepts multipart/form-data with photo file and markerId
 * - Generates thumbnail
 * - Extracts EXIF data
 * - Uploads to Vercel Blob
 * - Creates marker_content record
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import {
  generateThumbnail,
  extractExif,
  applyOrientation,
} from "@/lib/image-processing";

// Note: runtime = "nodejs" removed for cacheComponents compatibility
// API routes run in Node.js runtime by default with cacheComponents enabled
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log("[upload-photo] POST request received");

  try {
    const [session, formData] = await Promise.all([auth(), request.formData()]);

    if (!session?.user?.id) {
      console.log("[upload-photo] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const file = formData.get("file") as File | null;
    const markerId = formData.get("markerId") as string | null;

    if (!file || !markerId) {
      console.log("[upload-photo] Missing file or markerId");
      return NextResponse.json(
        { error: "Missing file or markerId" },
        { status: 400 },
      );
    }

    console.log("[upload-photo] File:", file.name, file.type, file.size);
    console.log("[upload-photo] Marker ID:", markerId);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Apply orientation correction
    buffer = await applyOrientation(buffer);

    // Generate thumbnail
    const { thumbnail } = await generateThumbnail(buffer);

    // Extract EXIF data
    const exifData = await extractExif(buffer);

    // Generate unique filename
    const photoId = crypto.randomUUID();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${photoId}.${extension}`;
    const thumbFilename = `${photoId}_thumb.${extension}`;

    // Upload original to Vercel Blob
    console.log("[upload-photo] Uploading original to Vercel Blob");
    const originalBlob = await put(
      `markers/${markerId}/photos/${filename}`,
      buffer,
      {
        access: "public",
        contentType: file.type,
      },
    );

    // Upload thumbnail to Vercel Blob
    console.log("[upload-photo] Uploading thumbnail to Vercel Blob");
    const thumbnailBlob = await put(
      `markers/${markerId}/photos/${thumbFilename}`,
      thumbnail,
      {
        access: "public",
        contentType: file.type,
      },
    );

    // Create marker_content record
    console.log("[upload-photo] Creating marker_content record");
    const { data: content, error: dbError } = await supabase
      .from("marker_content")
      .insert({
        marker_id: markerId,
        type: "photo",
        photo_url: originalBlob.url,
        photo_thumbnail_url: thumbnailBlob.url,
        photo_exif: exifData ? JSON.parse(JSON.stringify(exifData)) : null,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[upload-photo] Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save photo" },
        { status: 500 },
      );
    }

    console.log("[upload-photo] Success:", content.id);

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("[upload-photo] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
