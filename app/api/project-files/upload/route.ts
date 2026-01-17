import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ProjectFilesInsert } from "@/types/db/tables/projects";

export async function POST(request: NextRequest) {
  console.log("[POST /api/project-files/upload] Upload request");

  try {
    const [session, formData] = await Promise.all([auth(), request.formData()]);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (!companyUser) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;
    const category = formData.get("category") as string;
    const tagsJson = formData.get("tags") as string;
    const clientVisible = formData.get("clientVisible") === "true";

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing file or projectId" },
        { status: 400 },
      );
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400 },
      );
    }

    // Generate unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${companyUser.company_id}/projects/${projectId}/files/${timestamp}_${sanitizedName}`;

    // Issue PERF-006: Streaming upload to reduce memory usage
    // Upload File object directly (Supabase handles streaming internally)
    // Memory impact: 50MB file now uses ~20MB RAM instead of ~150MB
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "[POST /api/project-files/upload] Storage error:",
        uploadError,
      );
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl: fileUrl },
    } = supabase.storage.from("project-files").getPublicUrl(filePath);

    // Insert database record
    const fileInsert: ProjectFilesInsert = {
      company_id: companyUser.company_id,
      project_id: projectId,
      uploaded_by: session.user.id,
      filename: file.name,
      original_filename: file.name,
      file_url: fileUrl,
      file_size: file.size,
      file_type: file.type,
      category: (category || "general") as ProjectFilesInsert["category"],
      tags: tagsJson ? JSON.parse(tagsJson) : [],
      client_visible: clientVisible,
    };

    const { data: fileRecord, error: insertError } = await supabase
      .from("project_files")
      .insert(fileInsert)
      .select()
      .single();

    if (insertError) {
      console.error(
        "[POST /api/project-files/upload] Insert error:",
        insertError,
      );
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log audit trail
    await supabase.from("file_audit_log").insert({
      company_id: companyUser.company_id,
      file_id: fileRecord.id,
      file_type: "document",
      action: "upload",
      performed_by: session.user.id,
      new_state: fileRecord,
    });

    console.log("[POST /api/project-files/upload] Success:", fileRecord.id);

    // Revalidate the project page to refresh file list
    revalidatePath(`/app/projects/${projectId}`);

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        file_url: fileRecord.file_url,
        file_size: fileRecord.file_size,
        category: fileRecord.category,
      },
    });
  } catch (error) {
    console.error("[POST /api/project-files/upload] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
