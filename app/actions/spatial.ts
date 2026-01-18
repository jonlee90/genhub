// P1.5 & P1.6 - Server Actions for 3D models and spatial markers
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { processIFCFile } from "@/lib/ifc-converter";
import type {
  SpatialMarkerInsert,
  SpatialMarkerUpdate,
  MarkerContentInsert,
  MarkerFilters,
  SpatialProcessingStatus,
} from "@/types/db/spatial";

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

// ============================================================================
// P1.5 - 3D MODEL CRUD OPERATIONS
// ============================================================================

/**
 * Upload IFC file to Supabase Storage and create model record
 */
export async function uploadIFCFile(projectId: string, formData: FormData) {
  console.log("[uploadIFCFile] Starting upload for project:", projectId);

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

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file
  if (!file.name.toLowerCase().endsWith(".ifc")) {
    return { error: "Only .IFC files are supported" };
  }

  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return { error: "File size must be less than 500MB" };
  }

  try {
    // Generate unique file path
    const timestamp = Date.now();
    const fileName = `${projectId}/${timestamp}_${file.name}`;

    // Upload to Supabase Storage
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from("ifc-models")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadIFCFile] Upload error:", uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("ifc-models")
      .getPublicUrl(fileName);

    // Create model record
    const modelResult = await createModelRecord(projectId, {
      fileName: file.name,
      originalFileUrl: urlData.publicUrl,
      fileSizeBytes: file.size,
    });

    if ("error" in modelResult) {
      // Cleanup uploaded file on error
      await supabase.storage.from("ifc-models").remove([fileName]);
      return { error: modelResult.error };
    }

    // Wait for IFC to XKT conversion to complete
    if (modelResult.data?.id) {
      console.log(
        "[uploadIFCFile] Starting IFC to XKT conversion:",
        modelResult.data.id,
      );
      try {
        await processIFCFile(modelResult.data.id);
        console.log("[uploadIFCFile] Conversion completed successfully");
      } catch (conversionError) {
        console.error("[uploadIFCFile] Conversion failed:", conversionError);
        return {
          error: "Model uploaded but conversion failed. Please try again.",
        };
      }
    }

    console.log("[uploadIFCFile] Upload complete:", modelResult.data?.id);
    revalidatePath(`/app/projects/${projectId}`);
    return { success: true, data: modelResult.data };
  } catch (err: any) {
    console.error("[uploadIFCFile] Unexpected error:", err);
    return { error: `Upload failed: ${err.message}` };
  }
}

/**
 * Create a new 3D model record with processing_status='pending'
 */
export async function createModelRecord(
  projectId: string,
  fileData: {
    fileName: string;
    originalFileUrl: string;
    fileSizeBytes: number;
  },
) {
  console.log("[createModelRecord] Creating model for project:", projectId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Get next version number
  const { data: existingModels } = await supabase
    .from("projects_3d_models")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion =
    existingModels && existingModels.length > 0
      ? existingModels[0].version + 1
      : 1;

  // Debug: Insert model record
  const { data: model, error } = await supabase
    .from("projects_3d_models")
    .insert({
      project_id: projectId,
      version: nextVersion,
      file_name: fileData.fileName,
      original_file_url: fileData.originalFileUrl,
      file_size_bytes: fileData.fileSizeBytes,
      processing_status: "pending" as SpatialProcessingStatus,
    })
    .select()
    .single();

  if (error) {
    console.error("[createModelRecord] Error:", error);
    return { error: error.message };
  }

  console.log("[createModelRecord] Model created:", model.id);
  revalidatePath(`/app/projects/${projectId}/spatial`);
  return { success: true, data: model };
}

/**
 * Get all model versions for a project
 */
export async function getProjectModels(projectId: string) {
  console.log("[getProjectModels] Fetching models for project:", projectId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Fetch all models
  const { data: models, error } = await supabase
    .from("projects_3d_models")
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false });

  if (error) {
    console.error("[getProjectModels] Error:", error);
    return { error: error.message };
  }

  return { success: true, data: models };
}

/**
 * Get active model version for a project
 */
export async function getActiveModel(projectId: string) {
  console.log("[getActiveModel] Fetching active model for project:", projectId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Fetch active model
  const { data: model, error } = await supabase
    .from("projects_3d_models")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .single();

  if (error) {
    // Debug: No active model is not an error
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    console.error("[getActiveModel] Error:", error);
    return { error: error.message };
  }

  return { success: true, data: model };
}

/**
 * Update model processing status and metadata
 */
export async function updateModelProcessingStatus(
  modelId: string,
  status: SpatialProcessingStatus,
  metadata?: {
    xktFileUrl?: string;
    lodMediumUrl?: string;
    lodLowUrl?: string;
    thumbnailUrl?: string;
    elementCount?: number;
    bounds?: any;
    floors?: any;
    processingError?: string;
  },
) {
  console.log(
    "[updateModelProcessingStatus] Updating model:",
    modelId,
    "to status:",
    status,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Build update object
  const updateData: any = { processing_status: status };
  if (metadata) {
    if (metadata.xktFileUrl) updateData.xkt_file_url = metadata.xktFileUrl;
    if (metadata.lodMediumUrl)
      updateData.lod_medium_url = metadata.lodMediumUrl;
    if (metadata.lodLowUrl) updateData.lod_low_url = metadata.lodLowUrl;
    if (metadata.thumbnailUrl) updateData.thumbnail_url = metadata.thumbnailUrl;
    if (metadata.elementCount !== undefined)
      updateData.element_count = metadata.elementCount;
    if (metadata.bounds) updateData.bounds = metadata.bounds;
    if (metadata.floors) updateData.floors = metadata.floors;
    if (metadata.processingError)
      updateData.processing_error = metadata.processingError;
  }

  // Debug: Update model
  const { data: model, error } = await supabase
    .from("projects_3d_models")
    .update(updateData)
    .eq("id", modelId)
    .select()
    .single();

  if (error) {
    console.error("[updateModelProcessingStatus] Error:", error);
    return { error: error.message };
  }

  console.log("[updateModelProcessingStatus] Model updated:", model.id);
  revalidatePath(`/app/projects/${model.project_id}/spatial`);
  return { success: true, data: model };
}

/**
 * Set a model as active (transaction: deactivate others, activate this one)
 */
export async function setActiveModelVersion(
  projectId: string,
  modelId: string,
) {
  console.log("[setActiveModelVersion] Setting model as active:", modelId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Verify model belongs to project
  const { data: model } = await supabase
    .from("projects_3d_models")
    .select("id, project_id, processing_status")
    .eq("id", modelId)
    .eq("project_id", projectId)
    .single();

  if (!model) {
    return { error: "Model not found or does not belong to project" };
  }

  if (model.processing_status !== "ready") {
    return { error: "Model must be in ready status to activate" };
  }

  // Debug: Deactivate all models for this project
  const { error: deactivateError } = await supabase
    .from("projects_3d_models")
    .update({ is_active: false })
    .eq("project_id", projectId);

  if (deactivateError) {
    console.error("[setActiveModelVersion] Deactivate error:", deactivateError);
    return { error: deactivateError.message };
  }

  // Debug: Activate this model
  const { data: activeModel, error: activateError } = await supabase
    .from("projects_3d_models")
    .update({ is_active: true })
    .eq("id", modelId)
    .select()
    .single();

  if (activateError) {
    console.error("[setActiveModelVersion] Activate error:", activateError);
    return { error: activateError.message };
  }

  console.log("[setActiveModelVersion] Model activated:", activeModel.id);
  revalidatePath(`/app/projects/${projectId}/spatial`);
  return { success: true, data: activeModel };
}

/**
 * Delete a model version
 * Removes the model from database and cleans up storage files
 */
export async function deleteModelVersion(modelId: string) {
  console.log("[deleteModelVersion] Deleting model:", modelId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Get model to verify and for revalidation
  const { data: model } = await supabase
    .from("projects_3d_models")
    .select(
      "id, project_id, is_active, original_file_url, xkt_file_url, lod_medium_url, lod_low_url, thumbnail_url",
    )
    .eq("id", modelId)
    .single();

  if (!model) {
    return { error: "Model not found" };
  }

  if (model.is_active) {
    return {
      error: "Cannot delete active model. Set another version as active first.",
    };
  }

  // Debug: Delete model (cascades to model_elements and spatial_markers)
  const { error } = await supabase
    .from("projects_3d_models")
    .delete()
    .eq("id", modelId);

  if (error) {
    console.error("[deleteModelVersion] Error:", error);
    return { error: error.message };
  }

  // Cleanup storage files (best effort - don't fail if cleanup fails)
  try {
    const filesToDelete: string[] = [];

    // Extract file paths from URLs
    if (model.original_file_url) {
      const match = model.original_file_url.match(/ifc-models\/(.+)$/);
      if (match) filesToDelete.push(match[1]);
    }
    if (model.xkt_file_url) {
      const match = model.xkt_file_url.match(/ifc-models\/(.+)$/);
      if (match) filesToDelete.push(match[1]);
    }
    if (model.lod_medium_url) {
      const match = model.lod_medium_url.match(/ifc-models\/(.+)$/);
      if (match) filesToDelete.push(match[1]);
    }
    if (model.lod_low_url) {
      const match = model.lod_low_url.match(/ifc-models\/(.+)$/);
      if (match) filesToDelete.push(match[1]);
    }
    if (model.thumbnail_url) {
      const match = model.thumbnail_url.match(/ifc-models\/(.+)$/);
      if (match) filesToDelete.push(match[1]);
    }

    if (filesToDelete.length > 0) {
      console.log("[deleteModelVersion] Cleaning up files:", filesToDelete);
      await supabase.storage.from("ifc-models").remove(filesToDelete);
    }
  } catch (cleanupError) {
    console.error(
      "[deleteModelVersion] Storage cleanup error (non-fatal):",
      cleanupError,
    );
  }

  console.log("[deleteModelVersion] Model deleted:", modelId);
  revalidatePath(`/app/projects/${model.project_id}`);
  return { success: true };
}

/**
 * Replace the active model with a new file upload
 * Deactivates current active model and uploads new one
 */
export async function replaceActiveModel(projectId: string, file: File) {
  console.log(
    "[replaceActiveModel] Replacing active model for project:",
    projectId,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Get current active model
  const { data: currentActiveModel } = await supabase
    .from("projects_3d_models")
    .select("id, version")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .single();

  // Debug: Deactivate current active model if exists
  if (currentActiveModel) {
    const { error: deactivateError } = await supabase
      .from("projects_3d_models")
      .update({ is_active: false })
      .eq("id", currentActiveModel.id);

    if (deactivateError) {
      console.error(
        "[replaceActiveModel] Error deactivating old model:",
        deactivateError,
      );
      return { error: "Failed to deactivate current model" };
    }
  }

  // Debug: Upload new file using existing upload logic
  // Convert File to FormData for uploadIFCFile
  const formData = new FormData();
  formData.append("file", file);

  const uploadResult = await uploadIFCFile(projectId, formData);

  if ("error" in uploadResult) {
    // Re-activate old model on failure
    if (currentActiveModel) {
      await supabase
        .from("projects_3d_models")
        .update({ is_active: true })
        .eq("id", currentActiveModel.id);
    }
    return { error: uploadResult.error };
  }

  console.log("[replaceActiveModel] Model replaced successfully");
  revalidatePath(`/app/projects/${projectId}`);
  return { success: true, data: uploadResult.data };
}

// ============================================================================
// P1.6 - SPATIAL MARKER CRUD OPERATIONS
// ============================================================================

/**
 * Create a spatial marker with 3D coordinates
 * Security: Verifies project access before creation
 */
export async function createMarker(data: SpatialMarkerInsert) {
  console.log("[createMarker] Creating marker for project:", data.project_id);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId, userId } = userContext;

  // Security: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    data.project_id,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Security: Validate file upload quotas (if has attachments)
  // TODO: Implement quota check when storage is configured

  // Insert marker
  const { data: marker, error } = await supabase
    .from("spatial_markers")
    .insert({
      ...data,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[createMarker] Error:", error);
    return { error: error.message };
  }

  console.log("[createMarker] Marker created:", marker.id);
  revalidatePath(`/app/projects/${data.project_id}/spatial`);
  return { success: true, data: marker };
}

/**
 * Get project markers with optional filters
 */
export async function getProjectMarkers(
  projectId: string,
  filters?: MarkerFilters,
) {
  console.log(
    "[getProjectMarkers] Fetching markers for project:",
    projectId,
    "filters:",
    filters,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Build query
  let query = supabase
    .from("spatial_markers")
    .select("*")
    .eq("project_id", projectId);

  // Debug: Apply filters
  if (filters) {
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.floor_id) query = query.eq("floor_id", filters.floor_id);
    if (filters.task_id) query = query.eq("task_id", filters.task_id);
    if (filters.phase_id) query = query.eq("phase_id", filters.phase_id);
    if (filters.created_by) query = query.eq("created_by", filters.created_by);
  }

  const { data: markers, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("[getProjectMarkers] Error:", error);
    return { error: error.message };
  }

  return { success: true, data: markers };
}

/**
 * Get single marker by ID
 */
export async function getMarkerById(markerId: string) {
  console.log("[getMarkerById] Fetching marker:", markerId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Fetch marker
  const { data: marker, error } = await supabase
    .from("spatial_markers")
    .select("*")
    .eq("id", markerId)
    .single();

  if (error) {
    console.error("[getMarkerById] Error:", error);
    return { error: error.message };
  }

  return { success: true, data: marker };
}

/**
 * Update a spatial marker
 * Security: RLS enforces creator/GC admin check
 */
export async function updateMarker(
  markerId: string,
  data: SpatialMarkerUpdate,
) {
  console.log("[updateMarker] Updating marker:", markerId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, role } = userContext;

  // Security: Check marker exists and user has permission
  const { data: existingMarker } = await supabase
    .from("spatial_markers")
    .select("id, created_by, project_id")
    .eq("id", markerId)
    .single();

  if (!existingMarker) {
    return { error: "Marker not found or no permission to update" };
  }

  // Additional check: Only creator or GC/PM can update
  const canUpdate =
    existingMarker.created_by === userId ||
    role === "admin" ||
    role === "project_manager";

  if (!canUpdate) {
    return {
      error: "Permission denied: Only marker creator or GC/PM can update",
    };
  }

  // Update marker
  const { data: marker, error } = await supabase
    .from("spatial_markers")
    .update(data)
    .eq("id", markerId)
    .select()
    .single();

  if (error) {
    console.error("[updateMarker] Error:", error);
    return { error: error.message };
  }

  console.log("[updateMarker] Marker updated:", marker.id);
  revalidatePath(`/app/projects/${marker.project_id}/spatial`);
  return { success: true, data: marker };
}

/**
 * Delete a spatial marker (cascades to content)
 * Security: RLS enforces creator/GC admin check
 */
export async function deleteMarker(markerId: string) {
  console.log("[deleteMarker] Deleting marker:", markerId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId, role } = userContext;

  // Security: Get marker and check permission
  const { data: marker } = await supabase
    .from("spatial_markers")
    .select("id, project_id, created_by")
    .eq("id", markerId)
    .single();

  if (!marker) {
    return { error: "Marker not found" };
  }

  // Additional check: Only creator or GC admin can delete
  const canDelete = marker.created_by === userId || role === "admin";

  if (!canDelete) {
    return {
      error: "Permission denied: Only marker creator or GC admin can delete",
    };
  }

  // Delete marker (cascades to marker_content)
  const { error } = await supabase
    .from("spatial_markers")
    .delete()
    .eq("id", markerId);

  if (error) {
    console.error("[deleteMarker] Error:", error);
    return { error: error.message };
  }

  console.log("[deleteMarker] Marker deleted:", markerId);
  revalidatePath(`/app/projects/${marker.project_id}/spatial`);
  return { success: true };
}

/**
 * Attach content (photo/file/note) to marker
 */
export async function attachContentToMarker(
  markerId: string,
  content: MarkerContentInsert,
) {
  console.log("[attachContentToMarker] Attaching content to marker:", markerId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, userId } = userContext;

  // Debug: Insert content (triggers update to marker.content_count and last_activity_at)
  const { data: markerContent, error } = await supabase
    .from("marker_content")
    .insert({
      ...content,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[attachContentToMarker] Error:", error);
    return { error: error.message };
  }

  // Debug: Get marker for revalidation
  const { data: marker } = await supabase
    .from("spatial_markers")
    .select("project_id")
    .eq("id", markerId)
    .single();

  if (marker) {
    revalidatePath(`/app/projects/${marker.project_id}/spatial`);
  }

  console.log("[attachContentToMarker] Content attached:", markerContent.id);
  return { success: true, data: markerContent };
}

/**
 * Get all content for a marker
 */
export async function getMarkerContent(markerId: string) {
  console.log("[getMarkerContent] Fetching content for marker:", markerId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Fetch content
  const { data: content, error } = await supabase
    .from("marker_content")
    .select("*")
    .eq("marker_id", markerId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMarkerContent] Error:", error);
    return { error: error.message };
  }

  return { success: true, data: content };
}

/**
 * Delete marker content attachment
 */
export async function deleteMarkerContent(contentId: string) {
  console.log("[deleteMarkerContent] Deleting content:", contentId);

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Get content and marker for revalidation
  const { data: content } = await supabase
    .from("marker_content")
    .select("id, marker_id, marker:spatial_markers(project_id)")
    .eq("id", contentId)
    .single();

  if (!content) {
    return { error: "Content not found" };
  }

  // Debug: Delete content (triggers update to marker.content_count)
  const { error } = await supabase
    .from("marker_content")
    .delete()
    .eq("id", contentId);

  if (error) {
    console.error("[deleteMarkerContent] Error:", error);
    return { error: error.message };
  }

  // @ts-ignore - TypeScript doesn't know about the joined relation
  const projectId = content.marker?.project_id;
  if (projectId) {
    revalidatePath(`/app/projects/${projectId}/spatial`);
  }

  console.log("[deleteMarkerContent] Content deleted:", contentId);
  return { success: true };
}

// ============================================================================
// P4.1 - PHASE INTEGRATION
// ============================================================================

/**
 * Get markers filtered by phase
 */
export async function getMarkersByPhase(projectId: string, phaseId: string) {
  console.log(
    "[getMarkersByPhase] Fetching markers for project:",
    projectId,
    "phase:",
    phaseId,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Fetch markers filtered by phase
  const { data: markers, error } = await supabase
    .from("spatial_markers")
    .select("*")
    .eq("project_id", projectId)
    .eq("phase_id", phaseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMarkersByPhase] Error:", error);
    return { error: error.message };
  }

  return { success: true, data: markers };
}

// ============================================================================
// P4.3 - PHOTO INTEGRATION (GPS-BASED MARKER DISCOVERY)
// ============================================================================

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Find nearest marker to GPS coordinates (for photo geo-tagging)
 * @param projectId - Project UUID
 * @param latitude - GPS latitude
 * @param longitude - GPS longitude
 * @param radiusMeters - Search radius in meters (default 50m)
 */
export async function findNearestMarker(
  projectId: string,
  latitude: number,
  longitude: number,
  radiusMeters: number = 50,
) {
  console.log(
    "[findNearestMarker] Searching for markers near GPS:",
    latitude,
    longitude,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Debug: Get project coordinates to validate GPS is within project bounds
  const { data: project } = await supabase
    .from("projects")
    .select("latitude, longitude")
    .eq("id", projectId)
    .single();

  if (!project || !project.latitude || !project.longitude) {
    return { error: "Project does not have GPS coordinates set" };
  }

  // Debug: Fetch all markers for this project (with GPS metadata in content)
  // Note: This is a simplified implementation. For production, consider adding
  // GPS columns to spatial_markers or using PostGIS for spatial queries.
  const { data: markers, error } = await supabase
    .from("spatial_markers")
    .select(
      `
      id,
      title,
      description,
      position_x,
      position_y,
      position_z,
      type,
      status,
      created_at,
      marker_content (
        id,
        type,
        photo_exif
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) {
    console.error("[findNearestMarker] Error:", error);
    return { error: error.message };
  }

  // Debug: Calculate distances for markers that have GPS data in photo_exif
  let nearestMarker: any = null;
  let minDistance = Infinity;

  for (const marker of markers || []) {
    // Check if marker has any photo content with GPS data
    const markerContent = marker.marker_content as any[];
    if (!markerContent || markerContent.length === 0) continue;

    for (const content of markerContent) {
      if (content.type === "photo" && content.photo_exif) {
        const exif = content.photo_exif as any;
        const markerLat = exif.GPSLatitude;
        const markerLon = exif.GPSLongitude;

        if (markerLat && markerLon) {
          const distance = calculateHaversineDistance(
            latitude,
            longitude,
            markerLat,
            markerLon,
          );

          if (distance <= radiusMeters && distance < minDistance) {
            minDistance = distance;
            nearestMarker = {
              ...marker,
              distance,
            };
          }
        }
      }
    }
  }

  if (!nearestMarker) {
    return {
      success: true,
      data: null,
      message: `No markers found within ${radiusMeters}m radius`,
    };
  }

  console.log(
    "[findNearestMarker] Found marker:",
    nearestMarker.id,
    "distance:",
    minDistance.toFixed(2),
    "m",
  );
  return { success: true, data: nearestMarker };
}

/**
 * Get spatial markers for a project with optional filters (enhanced version)
 *
 * Fetches spatial markers with optional filters for marker type, status, priority,
 * phase, task linkage, and material linkage. Returns markers with extended info
 * including task details and material counts.
 *
 * CRITICAL FIX: Uses explicit task_id relationship to resolve ambiguity
 * (spatial_markers.task_id -> tasks.id)
 * PostgREST requires this because there are TWO relationships between these tables:
 * - spatial_markers.task_id -> tasks.id (forward)
 * - tasks.spatial_marker_id -> spatial_markers.id (reverse)
 */
export async function getMarkersByProject(
  projectId: string,
  filters?: {
    markerTypes?: string[];
    statuses?: string[];
    priorities?: string[];
    phaseId?: string;
    hasTask?: boolean;
    hasMaterials?: boolean;
  },
) {
  console.log("[getMarkersByProject] Fetching markers with filters", {
    projectId,
    filters,
  });

  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { companyId, supabase } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) return { error: projectCheck.error };

  // Build base query with task info
  // CRITICAL: Use tasks!task_id(...) syntax to explicitly specify the foreign key relationship
  // This resolves the "more than one relationship" error from PostgREST
  let query = supabase
    .from("spatial_markers")
    .select(
      `
      *,
      tasks!task_id (
        id,
        title,
        status
      )
    `,
    )
    .eq("project_id", projectId);

  // Apply filters
  if (filters?.markerTypes && filters.markerTypes.length > 0) {
    query = query.in(
      "type",
      filters.markerTypes as Array<
        | "photo"
        | "note"
        | "issue"
        | "inspection"
        | "rfi"
        | "safety"
        | "material"
        | "progress"
      >,
    );
  }

  if (filters?.statuses && filters.statuses.length > 0) {
    query = query.in(
      "status",
      filters.statuses as Array<"open" | "in_progress" | "resolved" | "closed">,
    );
  }

  if (filters?.priorities && filters.priorities.length > 0) {
    query = query.in("priority", filters.priorities);
  }

  if (filters?.phaseId) {
    query = query.eq("phase_id", filters.phaseId);
  }

  if (filters?.hasTask !== undefined) {
    if (filters.hasTask) {
      query = query.not("task_id", "is", null);
    } else {
      query = query.is("task_id", null);
    }
  }

  const { data: markers, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("[getMarkersByProject] Query failed:", error);
    return { error: error.message };
  }

  if (!markers) return { success: true, data: [] };

  // Fetch material counts for tasks (if hasMaterials filter is active)
  let materialCounts: Record<string, number> = {};

  if (filters?.hasMaterials !== undefined) {
    const taskIds = markers
      .map((m) => m.task_id)
      .filter((id): id is string => id !== null);

    if (taskIds.length > 0) {
      const { data: assignments } = await supabase
        .from("material_assignments")
        .select("task_id")
        .in("task_id", taskIds);

      if (assignments) {
        materialCounts = assignments.reduce(
          (acc, a) => {
            acc[a.task_id] = (acc[a.task_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      }
    }
  }

  // Fetch marker content
  const markerIds = markers.map((m) => m.id);
  let markerContentMap: Record<string, any[]> = {};

  if (markerIds.length > 0) {
    const { data: contents } = await supabase
      .from("marker_content")
      .select("*")
      .in("marker_id", markerIds);

    if (contents) {
      markerContentMap = contents.reduce(
        (acc, c) => {
          if (!acc[c.marker_id]) acc[c.marker_id] = [];
          acc[c.marker_id].push(c);
          return acc;
        },
        {} as Record<string, any[]>,
      );
    }
  }

  // Transform markers to include extended info
  const markersWithDetails = markers.map((marker) => {
    const task = marker.tasks as unknown as {
      id: string;
      title: string;
      status: string;
    } | null;
    const materialCount = marker.task_id
      ? materialCounts[marker.task_id] || 0
      : 0;
    const content = markerContentMap[marker.id] || [];

    return {
      ...marker,
      task_title: task?.title || null,
      task_status: task?.status || null,
      material_count: materialCount,
      content,
    };
  });

  // Apply hasMaterials filter (post-processing)
  let filteredMarkers = markersWithDetails;
  if (filters?.hasMaterials !== undefined) {
    filteredMarkers = markersWithDetails.filter((m) =>
      filters.hasMaterials ? m.material_count > 0 : m.material_count === 0,
    );
  }

  console.log(
    "[getMarkersByProject] Fetched",
    filteredMarkers.length,
    "markers",
  );
  return { success: true, data: filteredMarkers };
}

// ============================================================================
// P4.4 - TASK AT LOCATION & FILE UPLOAD
// ============================================================================

/**
 * Upload file attachment to a marker
 * Creates a marker_content record with the file stored in Supabase Storage
 */
export async function uploadMarkerAttachment(
  markerId: string,
  file: File,
  contentType: "photo" | "file",
): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log(
    "[uploadMarkerAttachment] Uploading attachment to marker:",
    markerId,
  );

  const userContext = await getUserContext();
  if ("error" in userContext)
    return { success: false, error: userContext.error };

  const { supabase, userId } = userContext;

  // Verify marker exists and user has access
  const { data: marker } = await supabase
    .from("spatial_markers")
    .select("id, project_id")
    .eq("id", markerId)
    .single();

  if (!marker) {
    return { success: false, error: "Marker not found or access denied" };
  }

  try {
    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${marker.project_id}/markers/${markerId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage (marker-attachments bucket)
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from("marker-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadMarkerAttachment] Upload error:", uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("marker-attachments")
      .getPublicUrl(filePath);

    // Create marker_content record
    const contentInsert: MarkerContentInsert = {
      marker_id: markerId,
      type: contentType,
      file_url: urlData.publicUrl,
      file_size_bytes: file.size,
      file_name: file.name,
    };

    const { data: markerContent, error: contentError } = await supabase
      .from("marker_content")
      .insert({
        ...contentInsert,
        created_by: userId,
      })
      .select()
      .single();

    if (contentError) {
      // Cleanup uploaded file on error
      await supabase.storage.from("marker-attachments").remove([filePath]);
      console.error(
        "[uploadMarkerAttachment] Content insert error:",
        contentError,
      );
      return {
        success: false,
        error: `Failed to create content record: ${contentError.message}`,
      };
    }

    console.log(
      "[uploadMarkerAttachment] Attachment uploaded:",
      markerContent.id,
    );
    revalidatePath(`/app/projects/${marker.project_id}/spatial`);
    return { success: true, data: markerContent };
  } catch (err: any) {
    console.error("[uploadMarkerAttachment] Unexpected error:", err);
    return { success: false, error: `Upload failed: ${err.message}` };
  }
}

/**
 * Create a task at a specific 3D location in the model
 * Creates both the task and a spatial marker linked to it
 */
export async function createTaskAtLocation(
  taskData: {
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "critical";
    phase_id?: string;
    assignee_id?: string;
    due_date?: string;
  },
  position: {
    x: number;
    y: number;
    z: number;
  },
  projectId: string,
  elementId?: string,
): Promise<{
  success: boolean;
  data?: { task: any; marker: any };
  error?: string;
}> {
  console.log("[createTaskAtLocation] Creating task at position:", position);

  const userContext = await getUserContext();
  if ("error" in userContext)
    return { success: false, error: userContext.error };

  const { supabase, companyId, userId } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck)
    return { success: false, error: projectCheck.error };

  try {
    // Create task in tasks table
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || "medium",
        phase_id: taskData.phase_id || null,
        assignee_id: taskData.assignee_id || null,
        due_date: taskData.due_date || null,
        project_id: projectId,
        status: "todo",
      })
      .select()
      .single();

    if (taskError) {
      console.error("[createTaskAtLocation] Task creation error:", taskError);
      return {
        success: false,
        error: `Failed to create task: ${taskError.message}`,
      };
    }

    // Create spatial_marker linked to task
    const markerInsert: SpatialMarkerInsert = {
      project_id: projectId,
      task_id: task.id,
      phase_id: taskData.phase_id || null,
      type: "issue", // Default marker type for task-linked markers
      title: taskData.title,
      description: taskData.description || null,
      position_x: position.x,
      position_y: position.y,
      position_z: position.z,
      element_id: elementId || null,
      status: "open",
    };

    const { data: marker, error: markerError } = await supabase
      .from("spatial_markers")
      .insert({
        ...markerInsert,
        created_by: userId,
      })
      .select()
      .single();

    if (markerError) {
      // Rollback: delete task if marker creation fails
      await supabase.from("tasks").delete().eq("id", task.id);
      console.error(
        "[createTaskAtLocation] Marker creation error:",
        markerError,
      );
      return {
        success: false,
        error: `Failed to create marker: ${markerError.message}`,
      };
    }

    // Update task with spatial_marker_id for reverse reference
    await supabase
      .from("tasks")
      .update({ spatial_marker_id: marker.id })
      .eq("id", task.id);

    console.log(
      "[createTaskAtLocation] Task and marker created:",
      task.id,
      marker.id,
    );
    revalidatePath(`/app/projects/${projectId}/spatial`);
    revalidatePath(`/app/projects/${projectId}/tasks`);
    return { success: true, data: { task, marker } };
  } catch (err: any) {
    console.error("[createTaskAtLocation] Unexpected error:", err);
    return {
      success: false,
      error: `Failed to create task at location: ${err.message}`,
    };
  }
}
