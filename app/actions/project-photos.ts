"use server";

import { revalidatePath } from "next/cache";
import { getUserContext } from "@/lib/auth/user-context";
import type { ProjectPhotosRow } from "@/types/db/tables/projects";
import type { PhotoCategory } from "@/types/db/enums";
import { z } from "zod";

type ProjectPhoto = ProjectPhotosRow;
type PhotoFilters = {
  category?: PhotoCategory[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: ("upload" | "task_receipt" | "expense_receipt")[];
  showReceipts?: boolean;
};

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const getProjectPhotosWithReceiptsSchema = z.object({
  projectId: z.string().uuid(),
  filters: z
    .object({
      category: z
        .array(
          z.enum([
            "site_progress",
            "safety_documentation",
            "permits_approvals",
            "inspection_reports",
            "material_receipts",
            "change_orders",
            "defects_issues",
            "before_after",
            "task_receipts",
            "expense_receipts",
            "general",
          ])
        )
        .optional(),
      search: z.string().min(1).max(200).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      source: z
        .array(z.enum(["upload", "task_receipt", "expense_receipt"]))
        .optional(),
      showReceipts: z.boolean().optional(),
    })
    .optional(),
});

const setProjectPrimaryPhotoSchema = z.object({
  projectId: z.string().uuid(),
  photoUrl: z
    .string()
    .url()
    .min(1)
    .max(2048)
    .nullable()
    .refine(
      (url) => {
        if (url === null) return true;
        // Validate URL is from expected storage domain (Supabase storage)
        try {
          const parsedUrl = new URL(url);
          return (
            parsedUrl.protocol === "https:" &&
            (parsedUrl.hostname.includes("supabase") ||
              parsedUrl.hostname.includes("amazonaws.com"))
          );
        } catch {
          return false;
        }
      },
      {
        message: "Photo URL must be from an approved storage provider",
      }
    ),
});

const deleteProjectPhotoSchema = z.object({
  photoId: z.string().uuid(),
});

export interface UnifiedPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename: string;
  category: PhotoCategory;
  source: "upload" | "task_receipt" | "expense_receipt";
  source_id?: string;
  source_title?: string;
  uploaded_by: { id: string; name: string; avatar_url?: string };
  created_at: string;
  exif_data?: any;
  is_deletable: boolean;
  is_editable: boolean;
  client_visible?: boolean;
}

/**
 * Get project photos with receipt aggregation (REQ-14)
 * Aggregates:
 * - Direct uploads from project_photos table
 * - Task receipts via tasks.receipt_photo_url
 * - Expense receipts via expenses.receipt_url
 */
export async function getProjectPhotosWithReceipts(params: unknown) {
  // Validate input
  const validated = getProjectPhotosWithReceiptsSchema.safeParse(params);
  if (!validated.success) {
    return {
      error: "Invalid parameters",
      details: validated.error.format(),
    };
  }

  const { projectId, filters } = validated.data;

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[getProjectPhotosWithReceipts] Fetching photos for project:",
      projectId,
    );
  }

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId } = userContext;

  const photos: UnifiedPhoto[] = [];

  const includeUploads = !filters?.source || filters.source.includes("upload");
  const includeTaskReceipts =
    filters?.showReceipts !== false &&
    (!filters?.source || filters.source.includes("task_receipt"));
  const includeExpenseReceipts =
    filters?.showReceipts !== false &&
    (!filters?.source || filters.source.includes("expense_receipt"));

  const uploadPromise = includeUploads
    ? (() => {
        let query = supabase
          .from("project_photos")
          .select("*")
          .eq("project_id", projectId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

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

        return query;
      })()
    : Promise.resolve({ data: [] as ProjectPhoto[] });

  const taskReceiptsPromise = includeTaskReceipts
    ? supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          receipt_photo_url,
          created_at,
          created_by,
          uploader:created_by (id, name, avatar_url)
        `,
        )
        .eq("project_id", projectId)
        .not("receipt_photo_url", "is", null)
    : Promise.resolve({ data: [] as Array<Record<string, any>> });

  const expenseReceiptsPromise = includeExpenseReceipts
    ? supabase
        .from("expenses")
        .select(
          `
          id,
          description,
          amount,
          status,
          receipt_url,
          created_at,
          submitted_by,
          uploader:submitted_by (id, name, avatar_url)
        `,
        )
        .eq("project_id", projectId)
        .not("receipt_url", "is", null)
    : Promise.resolve({ data: [] as Array<Record<string, any>> });

  const [
    { data: uploadedPhotos },
    { data: taskReceipts },
    { data: expenseReceipts },
  ] = await Promise.all([
    uploadPromise,
    taskReceiptsPromise,
    expenseReceiptsPromise,
  ]);

  if (uploadedPhotos && uploadedPhotos.length > 0) {
    photos.push(
      ...uploadedPhotos.map((photo: any) => ({
        id: photo.id,
        url: photo.photo_url,
        thumbnail_url: photo.thumbnail_url || undefined,
        filename: photo.filename,
        category: photo.category,
        source: "upload" as const,
        uploaded_by: photo.uploader || {
          id: photo.uploaded_by,
          name: "Unknown",
        },
        created_at: photo.created_at,
        exif_data: photo.exif_data,
        is_deletable: photo.uploaded_by === userId,
        is_editable: photo.uploaded_by === userId,
        client_visible: photo.client_visible,
      })),
    );
  }

  if (taskReceipts && taskReceipts.length > 0) {
    photos.push(
      ...taskReceipts.map((task: any) => ({
        id: `task-${task.id}`,
        url: task.receipt_photo_url!,
        thumbnail_url: undefined,
        filename: `Task Receipt: ${task.title}`,
        category: "task_receipts" as PhotoCategory,
        source: "task_receipt" as const,
        source_id: task.id,
        source_title: task.title,
        uploaded_by: task.uploader || {
          id: task.created_by || "",
          name: "Unknown",
        },
        created_at: task.created_at,
        is_deletable: false,
        is_editable: false,
      })),
    );
  }

  if (expenseReceipts && expenseReceipts.length > 0) {
    photos.push(
      ...expenseReceipts.map((expense: any) => ({
        id: `expense-${expense.id}`,
        url: expense.receipt_url!,
        thumbnail_url: undefined,
        filename: `Expense Receipt: ${expense.description}`,
        category: "expense_receipts" as PhotoCategory,
        source: "expense_receipt" as const,
        source_id: expense.id,
        source_title: `${expense.description} ($${expense.amount})`,
        uploaded_by: expense.uploader || {
          id: expense.submitted_by || "",
          name: "Unknown",
        },
        created_at: expense.created_at,
        is_deletable: false,
        is_editable: false,
      })),
    );
  }

  // Sort all photos by created_at descending
  photos.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[getProjectPhotosWithReceipts] Success:",
      photos.length,
      "total photos",
    );
  }
  return { data: photos };
}

/**
 * Set or clear the primary photo for a project
 * Updates projects.image_url column
 */
export async function setProjectPrimaryPhoto(
  params: unknown
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validated = setProjectPrimaryPhotoSchema.safeParse(params);
  if (!validated.success) {
    return {
      success: false,
      error: "Invalid parameters",
    };
  }

  const { projectId, photoUrl } = validated.data;

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[setProjectPrimaryPhoto] Setting primary photo for project:",
      projectId,
    );
  }

  // 1. Validate user is authenticated
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error };
  }

  const { supabase, userId, companyId } = userContext;

  // 2. Verify user has access to project (company_id check or project_team membership)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return { success: false, error: "Project not found" };
  }

  // Check company access
  if (project.company_id !== companyId) {
    // Check project_team membership as fallback
    const { data: teamMember } = await supabase
      .from("project_team")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return {
        success: false,
        error: "You don't have permission to edit this project",
      };
    }
  }

  // 3. Verify the photo exists in project_photos for this project (prevents arbitrary URL injection)
  if (photoUrl !== null) {
    // Verify the photo exists in project_photos for this project (prevents arbitrary URL injection)
    const { data: existingPhoto, error: photoError } = await supabase
      .from("project_photos")
      .select("id, photo_url")
      .eq("project_id", projectId)
      .eq("photo_url", photoUrl)
      .is("deleted_at", null)
      .single();

    if (photoError || !existingPhoto) {
      return { success: false, error: "Photo not found or has been deleted" };
    }
  }

  // 4. Update projects.image_url
  const { error: updateError } = await supabase
    .from("projects")
    .update({ image_url: photoUrl, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (updateError) {
    console.error("[setProjectPrimaryPhoto] Error:", updateError);
    return {
      success: false,
      error: "Failed to update cover photo. Please try again.",
    };
  }

  // 5. Revalidate paths
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/projects");

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[setProjectPrimaryPhoto] Success - imageUrl:",
      photoUrl ? "set" : "cleared",
    );
  }
  return { success: true };
}

/**
 * Delete project photo (soft delete)
 */
export async function deleteProjectPhoto(params: unknown) {
  // Validate input
  const validated = deleteProjectPhotoSchema.safeParse(params);
  if (!validated.success) {
    return {
      error: "Invalid parameters",
      details: validated.error.format(),
    };
  }

  const { photoId } = validated.data;

  if (process.env.NODE_ENV === "development") {
    console.log("[deleteProjectPhoto] Deleting photo:", photoId);
  }

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get photo to verify ownership and log audit
  const { data: photo, error: fetchError } = await supabase
    .from("project_photos")
    .select("*")
    .eq("id", photoId)
    .eq("company_id", companyId)
    .single();

  if (fetchError || !photo) {
    return { error: "Photo not found or access denied" };
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from("project_photos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", photoId);

  if (deleteError) {
    console.error("[deleteProjectPhoto] Error:", deleteError);
    return { error: deleteError.message };
  }

  // Log audit trail
  await supabase.from("file_audit_log").insert({
    company_id: companyId,
    file_id: photoId,
    file_type: "photo",
    action: "delete",
    performed_by: userId,
    previous_state: photo,
    new_state: { ...photo, deleted_at: new Date().toISOString() },
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[deleteProjectPhoto] Success");
  }
  revalidatePath(`/app/projects/${photo.project_id}`);
  return { success: true };
}
