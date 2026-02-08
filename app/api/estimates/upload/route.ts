import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { Canvas } from "canvas";
import sharp from "sharp";

// Configure pdfjs for Node.js environment
if (typeof window === "undefined") {
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix {};
}

const SCALE_FACTOR = 4.17; // 300 DPI from 72 DPI
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(request: NextRequest) {
  try {
    // Parallel auth and form data fetch
    const [session, formData] = await Promise.all([auth(), request.formData()]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Extract form data
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;
    const phaseId = (formData.get("phaseId") as string) || null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing file or projectId" },
        { status: 400 },
      );
    }

    // Validate project belongs to company
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("company_id", companyId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 },
      );
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 413 },
      );
    }

    // MIME type validation (server-side)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG" },
        { status: 400 },
      );
    }

    // Sanitize filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${sanitizedName}`;
    const filePath = `${companyId}/projects/${projectId}/plans/${filename}`;

    // Upload original file to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("plan-files")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[plan-upload] Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    // Create plan_uploads record
    const { data: planUpload, error: insertError } = await supabase
      .from("plan_uploads")
      .insert({
        company_id: companyId,
        project_id: projectId,
        project_phase_id: phaseId,
        filename: file.name,
        file_size: file.size,
        file_path: filePath,
        mime_type: file.type,
        status: "uploading",
        created_by: session.user.id,
      })
      .select()
      .single();

    if (insertError || !planUpload) {
      console.error("[plan-upload] DB insert error:", insertError);
      // Cleanup uploaded file
      await supabase.storage.from("plan-files").remove([filePath]);
      return NextResponse.json(
        { error: "Failed to create plan record" },
        { status: 500 },
      );
    }

    try {
      // Process based on file type
      if (file.type === "application/pdf") {
        // Update status to processing
        await supabase
          .from("plan_uploads")
          .update({ status: "processing" })
          .eq("id", planUpload.id);

        // PDF processing pipeline
        const doc = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
        const numPages = doc.numPages;
        const pages: any[] = [];

        // Process pages sequentially to limit memory usage
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: SCALE_FACTOR });

          // Create canvas
          const canvas = new Canvas(viewport.width, viewport.height);
          const context = canvas.getContext("2d");

          // Render page to canvas
          await page.render({
            canvasContext: context as any,
            viewport: viewport,
          } as any).promise;

          // Convert to PNG buffer via sharp
          const pngBuffer = await sharp(canvas.toBuffer()).png().toBuffer();

          // Upload page image
          const pageImagePath = `${companyId}/projects/${projectId}/pages/${planUpload.id}/page_${pageNum}.png`;
          const { error: pageUploadError } = await supabase.storage
            .from("plan-pages")
            .upload(pageImagePath, pngBuffer, {
              contentType: "image/png",
              upsert: false,
            });

          if (pageUploadError) {
            console.error("[plan-upload] Page upload error:", pageUploadError);
            throw new Error("Failed to upload page image");
          }

          // Insert plan_pages record
          const { data: planPage, error: pageInsertError } = await supabase
            .from("plan_pages")
            .insert({
              company_id: companyId,
              plan_upload_id: planUpload.id,
              page_number: pageNum,
              image_path: pageImagePath,
              image_width: Math.round(viewport.width),
              image_height: Math.round(viewport.height),
              file_size: pngBuffer.length,
              parse_status: "pending",
            })
            .select()
            .single();

          if (pageInsertError || !planPage) {
            console.error("[plan-upload] Page insert error:", pageInsertError);
            throw new Error("Failed to create page record");
          }

          pages.push(planPage);

          // Memory cleanup per page
          page.cleanup();
        }

        // Memory cleanup after all pages
        doc.destroy();

        // Update plan_uploads status
        await supabase
          .from("plan_uploads")
          .update({
            status: "ready",
            total_pages: numPages,
          })
          .eq("id", planUpload.id);

        return NextResponse.json({
          success: true,
          data: {
            planUpload: {
              id: planUpload.id,
              status: "ready",
              totalPages: numPages,
            },
          },
        });
      } else {
        // JPG/PNG - store directly without conversion
        const imageMetadata = await sharp(fileBuffer).metadata();
        const pageImagePath = `${companyId}/projects/${projectId}/pages/${planUpload.id}/page_1.png`;

        // Upload as single page
        const { error: pageUploadError } = await supabase.storage
          .from("plan-pages")
          .upload(pageImagePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (pageUploadError) {
          console.error("[plan-upload] Page upload error:", pageUploadError);
          throw new Error("Failed to upload page image");
        }

        // Insert plan_pages record
        const { error: pageInsertError } = await supabase
          .from("plan_pages")
          .insert({
            company_id: companyId,
            plan_upload_id: planUpload.id,
            page_number: 1,
            image_path: pageImagePath,
            image_width: imageMetadata.width || 0,
            image_height: imageMetadata.height || 0,
            file_size: file.size,
            parse_status: "pending",
          });

        if (pageInsertError) {
          console.error("[plan-upload] Page insert error:", pageInsertError);
          throw new Error("Failed to create page record");
        }

        // Update plan_uploads status
        await supabase
          .from("plan_uploads")
          .update({
            status: "ready",
            total_pages: 1,
          })
          .eq("id", planUpload.id);

        return NextResponse.json({
          success: true,
          data: {
            planUpload: {
              id: planUpload.id,
              status: "ready",
              totalPages: 1,
            },
          },
        });
      }
    } catch (processingError) {
      console.error("[plan-upload] Processing error:", processingError);

      // Update status to failed
      await supabase
        .from("plan_uploads")
        .update({
          status: "failed",
          error_message:
            processingError instanceof Error
              ? processingError.message
              : "Processing failed",
        })
        .eq("id", planUpload.id);

      return NextResponse.json(
        {
          error:
            processingError instanceof Error
              ? processingError.message
              : "Processing failed",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[plan-upload] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
