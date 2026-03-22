import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import sharp from "sharp";
import { pdfToPng } from "pdf-to-png-converter";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
];

// Note: Page type classification happens during parsing/extraction pipeline
// and is stored in plan_parse_results, not plan_pages

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

    // MIME type validation (allow HEIC by extension if MIME type is generic)
    const isHEIC =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !isHEIC) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG, HEIC" },
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

        // PDF processing - render all pages with pdf-to-png-converter
        console.log("[plan-upload] Rendering PDF...");

        const pngPages = (await pdfToPng(
          fileBuffer as any,
          {
            outputType: "buffer",
            strictPagesToProcess: false,
            verbosityLevel: 0,
            viewportScale: 3.0, // High DPI (3x = ~216 DPI)
          } as any,
        )) as Array<{ content: Buffer }>;

        if (!pngPages || pngPages.length === 0) {
          throw new Error("Failed to render PDF pages");
        }

        console.log(`[plan-upload] Rendered ${pngPages.length} page(s)`);

        // Process and upload each page
        const pageRecords = [];
        for (let i = 0; i < pngPages.length; i++) {
          const page = pngPages[i];
          const pageNumber = i + 1;

          console.log(
            `[plan-upload] Processing page ${pageNumber}: ${page.content.length} bytes`,
          );

          // Optimize with sharp
          const pngBuffer = await sharp(page.content)
            .png({ compressionLevel: 6 })
            .toBuffer();
          const imageMetadata = await sharp(pngBuffer).metadata();

          // Upload page image
          const pageImagePath = `${companyId}/projects/${projectId}/pages/${planUpload.id}/page_${pageNumber}.png`;
          const { error: pageUploadError } = await supabase.storage
            .from("plan-pages")
            .upload(pageImagePath, pngBuffer, {
              contentType: "image/png",
              upsert: false,
            });

          if (pageUploadError) {
            console.error(
              `[plan-upload] Page ${pageNumber} upload error:`,
              pageUploadError,
            );
            throw new Error(`Failed to upload page ${pageNumber} image`);
          }

          pageRecords.push({
            company_id: companyId,
            plan_upload_id: planUpload.id,
            page_number: pageNumber,
            image_path: pageImagePath,
            image_width: imageMetadata.width || 0,
            image_height: imageMetadata.height || 0,
            file_size: pngBuffer.length,
            parse_status: "pending" as const,
          });
        }

        // Insert all plan_pages records
        const { error: pageInsertError } = await supabase
          .from("plan_pages")
          .insert(pageRecords);

        if (pageInsertError) {
          console.error("[plan-upload] Page insert error:", pageInsertError);
          throw new Error("Failed to create page records");
        }

        console.log(
          `[plan-upload] Success! Uploaded ${pngPages.length} page(s)`,
        );

        // Update plan_uploads status
        await supabase
          .from("plan_uploads")
          .update({
            status: "ready",
            total_pages: pngPages.length,
          })
          .eq("id", planUpload.id);

        return NextResponse.json({
          success: true,
          data: {
            planUpload: {
              id: planUpload.id,
              status: "ready",
              totalPages: pngPages.length,
            },
          },
        });
      } else {
        // JPG/PNG/HEIC - convert HEIC to PNG, store directly
        let processedBuffer = fileBuffer;
        let outputMimeType = file.type;

        // Convert HEIC to PNG if needed
        if (isHEIC) {
          console.log("[plan-upload] Converting HEIC to PNG...");
          processedBuffer = await sharp(fileBuffer).png().toBuffer();
          outputMimeType = "image/png";
        }

        const imageMetadata = await sharp(processedBuffer).metadata();
        const pageImagePath = `${companyId}/projects/${projectId}/pages/${planUpload.id}/page_1.png`;

        const { error: pageUploadError } = await supabase.storage
          .from("plan-pages")
          .upload(pageImagePath, processedBuffer, {
            contentType: outputMimeType,
            upsert: false,
          });

        if (pageUploadError) {
          console.error("[plan-upload] Page upload error:", pageUploadError);
          throw new Error("Failed to upload page image");
        }

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
            parse_status: "pending" as const,
          });

        if (pageInsertError) {
          console.error("[plan-upload] Page insert error:", pageInsertError);
          throw new Error("Failed to create page record");
        }

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
      console.error(
        "[plan-upload] Error stack:",
        processingError instanceof Error ? processingError.stack : "N/A",
      );

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
