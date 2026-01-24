"use server";

import { revalidatePath } from "next/cache";
import { getUserContext, verifyProjectAccess } from "@/lib/auth/user-context";
import { z } from "zod";
import type { DocumentCategory } from "@/types/db/enums";

type FileFilters = {
  category?: DocumentCategory[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  uploadedBy?: string[];
  fileType?: ("document" | "image" | "cad" | "archive")[];
};

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const projectIdSchema = z.string().uuid();

const getProjectFilesSchema = z.object({
  projectId: z.string().uuid(),
  filters: z
    .object({
      category: z
        .array(
          z.enum([
            "contract",
            "permit",
            "drawing",
            "specification",
            "invoice",
            "receipt",
            "photo",
            "report",
            "other",
          ]),
        )
        .optional(),
      search: z.string().min(1).max(200).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      uploadedBy: z.array(z.string().uuid()).optional(),
      fileType: z
        .array(z.enum(["document", "image", "cad", "archive"]))
        .optional(),
    })
    .optional(),
});

const updateFileCategorySchema = z.object({
  fileId: z.string().uuid(),
  category: z.enum([
    "contract",
    "permit",
    "drawing",
    "specification",
    "invoice",
    "receipt",
    "photo",
    "report",
    "other",
  ]),
});

const bulkDeleteFilesSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1).max(100),
  projectId: z.string().uuid(),
});

/**
 * Get project files with filters
 */
export async function getProjectFiles(
  projectId: string,
  filters?: FileFilters,
) {
  if (process.env.NODE_ENV === "development") {
    console.log("[getProjectFiles] Fetching files for project:", projectId);
  }

  // Zod validation
  try {
    getProjectFilesSchema.parse({ projectId, filters });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: `Invalid input: ${error.issues[0].message}` };
    }
    return { error: "Invalid input parameters" };
  }

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
    .select("id, company_id, project_id, uploaded_by, filename, original_filename, file_url, file_size, file_type, category, tags, client_visible, version_number, parent_file_id, metadata, deleted_at, created_at, updated_at")
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

  if (process.env.NODE_ENV === "development") {
    console.log("[getProjectFiles] Success:", files.length, "files");
  }
  return { data: files };
}

/**
 * Delete project file (soft delete)
 */
export async function deleteProjectFile(fileId: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("[deleteProjectFile] Deleting file:", fileId);
  }

  // Zod validation
  try {
    z.string().uuid().parse(fileId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid file ID format" };
    }
    return { error: "Invalid input" };
  }

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get file to verify ownership and log audit
  const { data: file, error: fetchError } = await supabase
    .from("project_files")
    .select("id, company_id, project_id, uploaded_by, filename, original_filename, file_url, file_size, file_type, category, tags, client_visible, version_number, parent_file_id, metadata, deleted_at, created_at, updated_at")
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

  if (process.env.NODE_ENV === "development") {
    console.log("[deleteProjectFile] Success");
  }
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
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[updateFileCategory] Updating file:",
      fileId,
      "to category:",
      category,
    );
  }

  // Zod validation
  try {
    updateFileCategorySchema.parse({ fileId, category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Invalid input parameters" };
  }

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get current file state
  const { data: file, error: fetchError } = await supabase
    .from("project_files")
    .select("id, company_id, project_id, uploaded_by, filename, original_filename, file_url, file_size, file_type, category, tags, client_visible, version_number, parent_file_id, metadata, deleted_at, created_at, updated_at")
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

  if (process.env.NODE_ENV === "development") {
    console.log("[updateFileCategory] Success");
  }
  revalidatePath(`/app/projects/${file.project_id}`);
  return { success: true };
}

/**
 * Get file version history
 */
export async function getFileVersionHistory(fileId: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("[getFileVersionHistory] Fetching versions for file:", fileId);
  }

  // Zod validation
  try {
    z.string().uuid().parse(fileId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid file ID format" };
    }
    return { error: "Invalid input" };
  }

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
    .select("id, company_id, project_id, uploaded_by, filename, original_filename, file_url, file_size, file_type, category, tags, client_visible, version_number, parent_file_id, metadata, deleted_at, created_at, updated_at")
    .or(`id.eq.${rootFileId},parent_file_id.eq.${rootFileId}`)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("version_number", { ascending: false });

  if (error) {
    console.error("[getFileVersionHistory] Error:", error);
    return { error: error.message };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[getFileVersionHistory] Success:", versions.length, "versions");
  }
  return { data: versions };
}

/**
 * Bulk delete files
 */
export async function bulkDeleteFiles(fileIds: string[], projectId: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("[bulkDeleteFiles] Deleting files:", fileIds.length);
  }

  // Zod validation
  try {
    bulkDeleteFilesSchema.parse({ fileIds, projectId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Invalid input parameters" };
  }

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  const errors: string[] = [];

  const { data: files, error: fetchError } = await supabase
    .from("project_files")
    .select("id, company_id, project_id, uploaded_by, filename, original_filename, file_url, file_size, file_type, category, tags, client_visible, version_number, parent_file_id, metadata, deleted_at, created_at, updated_at")
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

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[bulkDeleteFiles] Success:",
      files.length,
      "deleted,",
      errors.length,
      "errors",
    );
  }
  revalidatePath(`/app/projects/${projectId}`);

  return {
    success: true,
    deletedCount: files.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
