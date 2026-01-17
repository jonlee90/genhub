"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import type { DocumentCategory } from "@/types/db/enums";

type FileFilters = {
  category?: DocumentCategory[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  uploadedBy?: string[];
  fileType?: ("document" | "image" | "cad" | "archive")[];
};

// Debug: Helper to get user context
async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (!companyUser) {
    return { error: "No active company found" };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// Debug: Verify project access
async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  companyId: string,
) {
  const { data: project } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .single();

  if (!project) {
    return { error: "Project not found or access denied" };
  }

  return { project };
}

/**
 * Get project files with filters
 */
export async function getProjectFiles(
  projectId: string,
  filters?: FileFilters,
) {
  console.log("[getProjectFiles] Fetching files for project:", projectId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Build query - Note: uploaded_by references next_auth.users (different schema)
  // User details must be fetched separately if needed
  let query = supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.category && filters.category.length > 0) {
    query = query.in("category", filters.category);
  }

  if (filters?.search) {
    query = query.ilike("filename", `%${filters.search}%`);
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  if (filters?.uploadedBy && filters.uploadedBy.length > 0) {
    query = query.in("uploaded_by", filters.uploadedBy);
  }

  if (filters?.fileType && filters.fileType.length > 0) {
    // Filter by MIME type prefix
    const mimePatterns = filters.fileType.map((type) => {
      switch (type) {
        case "document":
          return "application/%";
        case "image":
          return "image/%";
        case "cad":
          return "application/acad"; // DWG/DXF
        case "archive":
          return "application/zip";
        default:
          return "%";
      }
    });
    query = query.or(mimePatterns.map((p) => `file_type.like.${p}`).join(","));
  }

  const { data: files, error } = await query;

  if (error) {
    console.error("[getProjectFiles] Error:", error);
    return { error: error.message };
  }

  console.log("[getProjectFiles] Success:", files.length, "files");
  return { data: files };
}

/**
 * Delete project file (soft delete)
 */
export async function deleteProjectFile(fileId: string) {
  console.log("[deleteProjectFile] Deleting file:", fileId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get file to verify ownership and log audit
  const { data: file, error: fetchError } = await supabase
    .from("project_files")
    .select("*")
    .eq("id", fileId)
    .eq("company_id", companyId)
    .single();

  if (fetchError || !file) {
    return { error: "File not found or access denied" };
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from("project_files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", fileId);

  if (deleteError) {
    console.error("[deleteProjectFile] Error:", deleteError);
    return { error: deleteError.message };
  }

  // Log audit trail
  await supabase.from("file_audit_log").insert({
    company_id: companyId,
    file_id: fileId,
    file_type: "document",
    action: "delete",
    performed_by: userId,
    previous_state: file,
    new_state: { ...file, deleted_at: new Date().toISOString() },
  });

  console.log("[deleteProjectFile] Success");
  revalidatePath(`/app/projects/${file.project_id}`);
  return { success: true };
}

/**
 * Update file category
 */
export async function updateFileCategory(
  fileId: string,
  category: DocumentCategory,
) {
  console.log(
    "[updateFileCategory] Updating file:",
    fileId,
    "to category:",
    category,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get current file state
  const { data: file, error: fetchError } = await supabase
    .from("project_files")
    .select("*")
    .eq("id", fileId)
    .eq("company_id", companyId)
    .single();

  if (fetchError || !file) {
    return { error: "File not found or access denied" };
  }

  const previousState = { ...file };

  // Update category
  const { error: updateError } = await supabase
    .from("project_files")
    .update({ category, updated_at: new Date().toISOString() })
    .eq("id", fileId);

  if (updateError) {
    console.error("[updateFileCategory] Error:", updateError);
    return { error: updateError.message };
  }

  // Log audit trail
  await supabase.from("file_audit_log").insert({
    company_id: companyId,
    file_id: fileId,
    file_type: "document",
    action: "category_change",
    performed_by: userId,
    previous_state: previousState,
    new_state: { ...file, category, updated_at: new Date().toISOString() },
  });

  console.log("[updateFileCategory] Success");
  revalidatePath(`/app/projects/${file.project_id}`);
  return { success: true };
}

/**
 * Get file version history
 */
export async function getFileVersionHistory(fileId: string) {
  console.log("[getFileVersionHistory] Fetching versions for file:", fileId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Find root file (traverse parent_file_id chain)
  let rootFileId = fileId;
  const { data: file } = await supabase
    .from("project_files")
    .select("parent_file_id")
    .eq("id", fileId)
    .eq("company_id", companyId)
    .single();

  if (file?.parent_file_id) {
    rootFileId = file.parent_file_id;
  }

  // Get all versions in chain (root + children)
  // Note: uploaded_by references next_auth.users - can't auto-join
  const { data: versions, error } = await supabase
    .from("project_files")
    .select("*")
    .or(`id.eq.${rootFileId},parent_file_id.eq.${rootFileId}`)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("version_number", { ascending: false });

  if (error) {
    console.error("[getFileVersionHistory] Error:", error);
    return { error: error.message };
  }

  console.log("[getFileVersionHistory] Success:", versions.length, "versions");
  return { data: versions };
}

/**
 * Bulk delete files
 */
export async function bulkDeleteFiles(fileIds: string[], projectId: string) {
  console.log("[bulkDeleteFiles] Deleting files:", fileIds.length);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  const errors: string[] = [];

  const { data: files, error: fetchError } = await supabase
    .from("project_files")
    .select("*")
    .in("id", fileIds)
    .eq("company_id", companyId);

  if (fetchError) {
    console.error("[bulkDeleteFiles] Error fetching files:", fetchError);
    return { error: "Failed to fetch files for deletion" };
  }

  const foundIds = new Set((files || []).map((file) => file.id));
  const missingIds = fileIds.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    missingIds.forEach((id) => {
      errors.push(`${id}: File not found or access denied`);
    });
  }

  if (!files || files.length === 0) {
    return {
      success: true,
      deletedCount: 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  const deletedAt = new Date().toISOString();

  const { error: deleteError } = await supabase
    .from("project_files")
    .update({ deleted_at: deletedAt })
    .in(
      "id",
      files.map((file) => file.id),
    )
    .eq("company_id", companyId);

  if (deleteError) {
    console.error("[bulkDeleteFiles] Error deleting files:", deleteError);
    return { error: deleteError.message };
  }

  const auditLogs = files.map((file) => ({
    company_id: companyId,
    file_id: file.id,
    file_type: "document",
    action: "delete",
    performed_by: userId,
    previous_state: file,
    new_state: { ...file, deleted_at: deletedAt },
  }));

  if (auditLogs.length > 0) {
    const { error: auditError } = await supabase
      .from("file_audit_log")
      .insert(auditLogs);

    if (auditError) {
      console.error("[bulkDeleteFiles] Error logging audit trail:", auditError);
    }
  }

  console.log(
    "[bulkDeleteFiles] Success:",
    files.length,
    "deleted,",
    errors.length,
    "errors",
  );
  revalidatePath(`/app/projects/${projectId}`);

  return {
    success: true,
    deletedCount: files.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
