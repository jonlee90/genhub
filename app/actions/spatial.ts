// P1.5 & P1.6 - Server Actions for 3D models and spatial markers
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type {
  Project3DModel,
  Project3DModelInsert,
  SpatialMarker,
  SpatialMarkerInsert,
  SpatialMarkerUpdate,
  MarkerContent,
  MarkerContentInsert,
  MarkerFilters,
  SpatialProcessingStatus,
} from '@/types/spatial';

// Debug: Helper to get user context
async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!companyUser) {
    return { error: 'No active company found' };
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
  companyId: string
) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .eq('company_id', companyId)
    .single();

  if (!project) {
    return { error: 'Project not found or access denied' };
  }

  return { project };
}

// ============================================================================
// P1.5 - 3D MODEL CRUD OPERATIONS
// ============================================================================

/**
 * Create a new 3D model record with processing_status='pending'
 */
export async function createModelRecord(
  projectId: string,
  fileData: {
    fileName: string;
    originalFileUrl: string;
    fileSizeBytes: number;
  }
) {
  console.log('[createModelRecord] Creating model for project:', projectId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Get next version number
  const { data: existingModels } = await supabase
    .from('projects_3d_models')
    .select('version')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = existingModels && existingModels.length > 0 ? existingModels[0].version + 1 : 1;

  // Debug: Insert model record
  const { data: model, error } = await supabase
    .from('projects_3d_models')
    .insert({
      project_id: projectId,
      version: nextVersion,
      file_name: fileData.fileName,
      original_file_url: fileData.originalFileUrl,
      file_size_bytes: fileData.fileSizeBytes,
      processing_status: 'pending' as SpatialProcessingStatus,
    })
    .select()
    .single();

  if (error) {
    console.error('[createModelRecord] Error:', error);
    return { error: error.message };
  }

  console.log('[createModelRecord] Model created:', model.id);
  revalidatePath(`/app/projects/${projectId}/spatial`);
  return { success: true, data: model };
}

/**
 * Get all model versions for a project
 */
export async function getProjectModels(projectId: string) {
  console.log('[getProjectModels] Fetching models for project:', projectId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Fetch all models
  const { data: models, error } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  if (error) {
    console.error('[getProjectModels] Error:', error);
    return { error: error.message };
  }

  return { success: true, data: models };
}

/**
 * Get active model version for a project
 */
export async function getActiveModel(projectId: string) {
  console.log('[getActiveModel] Fetching active model for project:', projectId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Fetch active model
  const { data: model, error } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .single();

  if (error) {
    // Debug: No active model is not an error
    if (error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    console.error('[getActiveModel] Error:', error);
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
  }
) {
  console.log('[updateModelProcessingStatus] Updating model:', modelId, 'to status:', status);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Build update object
  const updateData: any = { processing_status: status };
  if (metadata) {
    if (metadata.xktFileUrl) updateData.xkt_file_url = metadata.xktFileUrl;
    if (metadata.lodMediumUrl) updateData.lod_medium_url = metadata.lodMediumUrl;
    if (metadata.lodLowUrl) updateData.lod_low_url = metadata.lodLowUrl;
    if (metadata.thumbnailUrl) updateData.thumbnail_url = metadata.thumbnailUrl;
    if (metadata.elementCount !== undefined) updateData.element_count = metadata.elementCount;
    if (metadata.bounds) updateData.bounds = metadata.bounds;
    if (metadata.floors) updateData.floors = metadata.floors;
    if (metadata.processingError) updateData.processing_error = metadata.processingError;
  }

  // Debug: Update model
  const { data: model, error } = await supabase
    .from('projects_3d_models')
    .update(updateData)
    .eq('id', modelId)
    .select()
    .single();

  if (error) {
    console.error('[updateModelProcessingStatus] Error:', error);
    return { error: error.message };
  }

  console.log('[updateModelProcessingStatus] Model updated:', model.id);
  revalidatePath(`/app/projects/${model.project_id}/spatial`);
  return { success: true, data: model };
}

/**
 * Set a model as active (transaction: deactivate others, activate this one)
 */
export async function setActiveModelVersion(projectId: string, modelId: string) {
  console.log('[setActiveModelVersion] Setting model as active:', modelId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Verify model belongs to project
  const { data: model } = await supabase
    .from('projects_3d_models')
    .select('id, project_id, processing_status')
    .eq('id', modelId)
    .eq('project_id', projectId)
    .single();

  if (!model) {
    return { error: 'Model not found or does not belong to project' };
  }

  if (model.processing_status !== 'ready') {
    return { error: 'Model must be in ready status to activate' };
  }

  // Debug: Deactivate all models for this project
  const { error: deactivateError } = await supabase
    .from('projects_3d_models')
    .update({ is_active: false })
    .eq('project_id', projectId);

  if (deactivateError) {
    console.error('[setActiveModelVersion] Deactivate error:', deactivateError);
    return { error: deactivateError.message };
  }

  // Debug: Activate this model
  const { data: activeModel, error: activateError } = await supabase
    .from('projects_3d_models')
    .update({ is_active: true })
    .eq('id', modelId)
    .select()
    .single();

  if (activateError) {
    console.error('[setActiveModelVersion] Activate error:', activateError);
    return { error: activateError.message };
  }

  console.log('[setActiveModelVersion] Model activated:', activeModel.id);
  revalidatePath(`/app/projects/${projectId}/spatial`);
  return { success: true, data: activeModel };
}

/**
 * Delete a model version
 */
export async function deleteModelVersion(modelId: string) {
  console.log('[deleteModelVersion] Deleting model:', modelId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Get model to verify and for revalidation
  const { data: model } = await supabase
    .from('projects_3d_models')
    .select('id, project_id, is_active')
    .eq('id', modelId)
    .single();

  if (!model) {
    return { error: 'Model not found' };
  }

  if (model.is_active) {
    return { error: 'Cannot delete active model. Set another version as active first.' };
  }

  // Debug: Delete model (cascades to model_elements)
  const { error } = await supabase
    .from('projects_3d_models')
    .delete()
    .eq('id', modelId);

  if (error) {
    console.error('[deleteModelVersion] Error:', error);
    return { error: error.message };
  }

  console.log('[deleteModelVersion] Model deleted:', modelId);
  revalidatePath(`/app/projects/${model.project_id}/spatial`);
  return { success: true };
}

// ============================================================================
// P1.6 - SPATIAL MARKER CRUD OPERATIONS
// ============================================================================

/**
 * Create a spatial marker with 3D coordinates
 */
export async function createMarker(data: SpatialMarkerInsert) {
  console.log('[createMarker] Creating marker for project:', data.project_id);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId, userId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, data.project_id, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Insert marker
  const { data: marker, error } = await supabase
    .from('spatial_markers')
    .insert({
      ...data,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('[createMarker] Error:', error);
    return { error: error.message };
  }

  console.log('[createMarker] Marker created:', marker.id);
  revalidatePath(`/app/projects/${data.project_id}/spatial`);
  return { success: true, data: marker };
}

/**
 * Get project markers with optional filters
 */
export async function getProjectMarkers(projectId: string, filters?: MarkerFilters) {
  console.log('[getProjectMarkers] Fetching markers for project:', projectId, 'filters:', filters);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Build query
  let query = supabase
    .from('spatial_markers')
    .select('*')
    .eq('project_id', projectId);

  // Debug: Apply filters
  if (filters) {
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.floor_id) query = query.eq('floor_id', filters.floor_id);
    if (filters.task_id) query = query.eq('task_id', filters.task_id);
    if (filters.phase_id) query = query.eq('phase_id', filters.phase_id);
    if (filters.created_by) query = query.eq('created_by', filters.created_by);
  }

  const { data: markers, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('[getProjectMarkers] Error:', error);
    return { error: error.message };
  }

  return { success: true, data: markers };
}

/**
 * Get single marker by ID
 */
export async function getMarkerById(markerId: string) {
  console.log('[getMarkerById] Fetching marker:', markerId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Fetch marker
  const { data: marker, error } = await supabase
    .from('spatial_markers')
    .select('*')
    .eq('id', markerId)
    .single();

  if (error) {
    console.error('[getMarkerById] Error:', error);
    return { error: error.message };
  }

  return { success: true, data: marker };
}

/**
 * Update a spatial marker
 */
export async function updateMarker(markerId: string, data: SpatialMarkerUpdate) {
  console.log('[updateMarker] Updating marker:', markerId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Update marker
  const { data: marker, error } = await supabase
    .from('spatial_markers')
    .update(data)
    .eq('id', markerId)
    .select()
    .single();

  if (error) {
    console.error('[updateMarker] Error:', error);
    return { error: error.message };
  }

  console.log('[updateMarker] Marker updated:', marker.id);
  revalidatePath(`/app/projects/${marker.project_id}/spatial`);
  return { success: true, data: marker };
}

/**
 * Delete a spatial marker (cascades to content)
 */
export async function deleteMarker(markerId: string) {
  console.log('[deleteMarker] Deleting marker:', markerId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Get marker for revalidation
  const { data: marker } = await supabase
    .from('spatial_markers')
    .select('id, project_id')
    .eq('id', markerId)
    .single();

  if (!marker) {
    return { error: 'Marker not found' };
  }

  // Debug: Delete marker (cascades to marker_content)
  const { error } = await supabase
    .from('spatial_markers')
    .delete()
    .eq('id', markerId);

  if (error) {
    console.error('[deleteMarker] Error:', error);
    return { error: error.message };
  }

  console.log('[deleteMarker] Marker deleted:', markerId);
  revalidatePath(`/app/projects/${marker.project_id}/spatial`);
  return { success: true };
}

/**
 * Attach content (photo/file/note) to marker
 */
export async function attachContentToMarker(markerId: string, content: MarkerContentInsert) {
  console.log('[attachContentToMarker] Attaching content to marker:', markerId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, userId } = userContext;

  // Debug: Insert content (triggers update to marker.content_count and last_activity_at)
  const { data: markerContent, error } = await supabase
    .from('marker_content')
    .insert({
      marker_id: markerId,
      ...content,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('[attachContentToMarker] Error:', error);
    return { error: error.message };
  }

  // Debug: Get marker for revalidation
  const { data: marker } = await supabase
    .from('spatial_markers')
    .select('project_id')
    .eq('id', markerId)
    .single();

  if (marker) {
    revalidatePath(`/app/projects/${marker.project_id}/spatial`);
  }

  console.log('[attachContentToMarker] Content attached:', markerContent.id);
  return { success: true, data: markerContent };
}

/**
 * Get all content for a marker
 */
export async function getMarkerContent(markerId: string) {
  console.log('[getMarkerContent] Fetching content for marker:', markerId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Fetch content
  const { data: content, error } = await supabase
    .from('marker_content')
    .select('*')
    .eq('marker_id', markerId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getMarkerContent] Error:', error);
    return { error: error.message };
  }

  return { success: true, data: content };
}

/**
 * Delete marker content attachment
 */
export async function deleteMarkerContent(contentId: string) {
  console.log('[deleteMarkerContent] Deleting content:', contentId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase } = userContext;

  // Debug: Get content and marker for revalidation
  const { data: content } = await supabase
    .from('marker_content')
    .select('id, marker_id, marker:spatial_markers(project_id)')
    .eq('id', contentId)
    .single();

  if (!content) {
    return { error: 'Content not found' };
  }

  // Debug: Delete content (triggers update to marker.content_count)
  const { error } = await supabase
    .from('marker_content')
    .delete()
    .eq('id', contentId);

  if (error) {
    console.error('[deleteMarkerContent] Error:', error);
    return { error: error.message };
  }

  // @ts-ignore - TypeScript doesn't know about the joined relation
  const projectId = content.marker?.project_id;
  if (projectId) {
    revalidatePath(`/app/projects/${projectId}/spatial`);
  }

  console.log('[deleteMarkerContent] Content deleted:', contentId);
  return { success: true };
}

// ============================================================================
// P4.1 - PHASE INTEGRATION
// ============================================================================

/**
 * Get markers filtered by phase
 */
export async function getMarkersByPhase(projectId: string, phaseId: string) {
  console.log('[getMarkersByPhase] Fetching markers for project:', projectId, 'phase:', phaseId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Fetch markers filtered by phase
  const { data: markers, error } = await supabase
    .from('spatial_markers')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_id', phaseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getMarkersByPhase] Error:', error);
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
  lon2: number
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
  radiusMeters: number = 50
) {
  console.log('[findNearestMarker] Searching for markers near GPS:', latitude, longitude);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Debug: Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Debug: Get project coordinates to validate GPS is within project bounds
  const { data: project } = await supabase
    .from('projects')
    .select('latitude, longitude')
    .eq('id', projectId)
    .single();

  if (!project || !project.latitude || !project.longitude) {
    return { error: 'Project does not have GPS coordinates set' };
  }

  // Debug: Fetch all markers for this project (with GPS metadata in content)
  // Note: This is a simplified implementation. For production, consider adding
  // GPS columns to spatial_markers or using PostGIS for spatial queries.
  const { data: markers, error } = await supabase
    .from('spatial_markers')
    .select(`
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
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('[findNearestMarker] Error:', error);
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
      if (content.type === 'photo' && content.photo_exif) {
        const exif = content.photo_exif as any;
        const markerLat = exif.GPSLatitude;
        const markerLon = exif.GPSLongitude;

        if (markerLat && markerLon) {
          const distance = calculateHaversineDistance(
            latitude,
            longitude,
            markerLat,
            markerLon
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

  console.log('[findNearestMarker] Found marker:', nearestMarker.id, 'distance:', minDistance.toFixed(2), 'm');
  return { success: true, data: nearestMarker };
}
