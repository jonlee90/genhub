// Server Actions for Default 3D Models
// Handles default model assignment, file copying, and marker creation with auto-linking
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// Type imports - use database types instead of local types
import { Project3DModel, SpatialMarker } from '@/types/db/spatial';

type Task = {
  id: string;
  title: string;
  phase_id: string;
  [key: string]: any;
};

// Debug: Helper to get user context
async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'NOT_AUTHENTICATED', details: 'User session not found' };
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!companyUser) {
    return { error: 'NO_COMPANY', details: 'User has no active company' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

/**
 * Get system default model by project type
 */
export async function getSystemDefaultModel(projectType: string) {
  console.log('[getSystemDefaultModel] Fetching system default for project type:', projectType);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[getSystemDefaultModel] Auth error:', userContext.error);
    return null;
  }

  const { supabase } = userContext;

  // Map project_type enum to default model project_type (text)
  const projectTypeMap: Record<string, string> = {
    'residential': 'residential',
    'restaurant': 'restaurant', // Default to restaurant for restaurant_cafe
    'commercial_office': 'commercial_office',
    'cafe': 'cafe', // Default to restaurant for restaurant_cafe
    'industrial': 'industrial',
  };

  const mappedType = projectTypeMap[projectType] || projectType;
  console.log('[getSystemDefaultModel] Mapped project type:', mappedType);

  const { data: defaultModel, error } = await supabase
    .from('default_3d_models')
    .select('*')
    .eq('project_type', mappedType)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[getSystemDefaultModel] Error fetching default model:', error);
    return null;
  }

  if (!defaultModel) {
    console.log('[getSystemDefaultModel] No default model found for type:', mappedType);
    return null;
  }

  console.log('[getSystemDefaultModel] Found default model:', defaultModel.id, defaultModel.name);
  return defaultModel;
}

/**
 * Get company custom default model for a project type
 */
export async function getCompanyDefaultModel(projectType: string) {
  console.log('[getCompanyDefaultModel] Fetching company default for project type:', projectType);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[getCompanyDefaultModel] Auth error:', userContext.error);
    return null;
  }

  const { supabase, companyId } = userContext;

  // Map project_type to project_type_config name
  const projectTypeConfigMap: Record<string, string> = {
    'residential': 'Residential',
    'restaurant': 'Restaurant',
    'commercial_office': 'Commercial Office',
    'industrial': 'Industrial',
    'cafe': 'Cafe',
  };

  const configName = projectTypeConfigMap[projectType];
  if (!configName) {
    console.log('[getCompanyDefaultModel] No config mapping for project type:', projectType);
    return null;
  }

  // Get project_type_config_id
  const { data: typeConfig, error: typeConfigError } = await supabase
    .from('project_type_configs')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', configName)
    .eq('is_active', true)
    .maybeSingle();

  if (typeConfigError || !typeConfig) {
    console.log('[getCompanyDefaultModel] No type config found:', typeConfigError?.message);
    return null;
  }

  // Get company custom default model
  const { data: companyDefault, error: companyDefaultError } = await supabase
    .from('company_default_models')
    .select(`
      id,
      model_id,
      is_active,
      model:projects_3d_models (
        id,
        xkt_file_url,
        original_file_url,
        file_size_bytes,
        element_count,
        bounds,
        floors
      )
    `)
    .eq('company_id', companyId)
    .eq('project_type_config_id', typeConfig.id)
    .eq('is_active', true)
    .maybeSingle();

  if (companyDefaultError || !companyDefault) {
    console.log('[getCompanyDefaultModel] No company default found');
    return null;
  }

  console.log('[getCompanyDefaultModel] Found company custom default:', companyDefault.model_id);
  return companyDefault.model;
}

/**
 * Copy default model files to project storage
 * For MVP: Just create a reference, don't actually copy files yet
 */
async function copyDefaultModelToProject(
  projectId: string,
  defaultModelId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Project3DModel | null> {
  console.log('[copyDefaultModelToProject] Copying default model to project:', projectId, defaultModelId);

  // Fetch default model
  const { data: defaultModel, error: fetchError } = await supabase
    .from('default_3d_models')
    .select('*')
    .eq('id', defaultModelId)
    .single();

  if (fetchError || !defaultModel) {
    console.error('[copyDefaultModelToProject] Error fetching default model:', fetchError);
    return null;
  }

  // Create project model record (for MVP, use same file URLs - no actual file copy)
  const { data: projectModel, error: insertError } = await supabase
    .from('projects_3d_models')
    .insert({
      project_id: projectId,
      version: 1,
      file_name: defaultModel.name || `${defaultModel.project_type}-default.xkt`, // Extract from name or use default
      xkt_file_url: defaultModel.xkt_file_url,
      original_file_url: defaultModel.original_file_url,
      file_size_bytes: defaultModel.file_size_bytes,
      element_count: defaultModel.element_count,
      bounds: defaultModel.bounds,
      floors: defaultModel.floors,
      processing_status: 'ready', // Changed from 'completed' to 'ready' to match page.tsx query
      is_active: true, // Mark as active so page.tsx query finds it
      is_default: true,
      default_model_id: defaultModelId,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[copyDefaultModelToProject] Error creating project model:', insertError);
    return null;
  }

  console.log('[copyDefaultModelToProject] Created project model:', projectModel.id);
  return projectModel as Project3DModel;
}

/**
 * Create markers from default configs, auto-linking to tasks
 */
export async function createMarkersFromDefaultConfigs(
  projectId: string,
  modelId: string,
  tasks: Task[]
): Promise<SpatialMarker[]> {
  console.log('[createMarkersFromDefaultConfigs] Creating markers for project:', projectId);
  console.log('[createMarkersFromDefaultConfigs] Tasks count:', tasks.length);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[createMarkersFromDefaultConfigs] Auth error:', userContext.error);
    return [];
  }

  const { supabase, userId } = userContext;

  // Get project model to find default_model_id
  const { data: projectModel, error: modelError } = await supabase
    .from('projects_3d_models')
    .select('default_model_id')
    .eq('id', modelId)
    .single();

  if (modelError || !projectModel?.default_model_id) {
    console.log('[createMarkersFromDefaultConfigs] No default model reference found');
    return [];
  }

  // Fetch marker configs for this default model
  const { data: markerConfigs, error: configsError } = await supabase
    .from('default_marker_configs')
    .select('*')
    .eq('default_model_id', projectModel.default_model_id);

  if (configsError || !markerConfigs || markerConfigs.length === 0) {
    console.log('[createMarkersFromDefaultConfigs] No marker configs found');
    return [];
  }

  console.log('[createMarkersFromDefaultConfigs] Found marker configs:', markerConfigs.length);

  // Create markers with auto-linking to tasks
  const markersToInsert: any[] = [];

  for (const config of markerConfigs) {
    // Try to match task by title (case-insensitive, trimmed)
    let matchedTask: Task | null = null;

    if (config.task_template_title) {
      const normalizedConfigTitle = config.task_template_title.toLowerCase().trim();

      matchedTask = tasks.find((task) => {
        const normalizedTaskTitle = task.title.toLowerCase().trim();
        return normalizedTaskTitle === normalizedConfigTitle;
      }) || null;

      if (!matchedTask) {
        console.log('[createMarkersFromDefaultConfigs] WARNING: No task match for marker:', config.title, '| Template title:', config.task_template_title);
      } else {
        console.log('[createMarkersFromDefaultConfigs] Matched marker to task:', config.title, '→', matchedTask.title);
      }
    }

    markersToInsert.push({
      project_id: projectId,
      model_id: modelId,
      task_id: matchedTask?.id || null, // Allow null if no match
      position_x: config.position_x,
      position_y: config.position_y,
      position_z: config.position_z,
      normal_x: config.normal_x,
      normal_y: config.normal_y,
      normal_z: config.normal_z,
      floor_id: config.floor_id,
      floor_name: config.floor_name,
      element_id: config.element_id,
      element_type: config.element_type,
      title: config.title,
      description: config.description,
      type: config.type,
      status: 'open', // Changed from 'active' to 'open' to match spatial_marker_status enum
      marker_config_id: config.id,
      created_by: userId,
    });
  }

  if (markersToInsert.length === 0) {
    console.log('[createMarkersFromDefaultConfigs] No markers to insert');
    return [];
  }

  // Insert all markers
  const { data: insertedMarkers, error: insertError } = await supabase
    .from('spatial_markers')
    .insert(markersToInsert)
    .select();

  if (insertError) {
    console.error('[createMarkersFromDefaultConfigs] Error inserting markers:', insertError);
    return [];
  }

  console.log('[createMarkersFromDefaultConfigs] Created markers:', insertedMarkers.length);
  return insertedMarkers as SpatialMarker[];
}

/**
 * Assign default model to project
 * Priority: Company custom → System default
 * Returns null if no default exists (project proceeds without default model)
 */
export async function assignDefaultModel(
  projectId: string,
  projectType: string
): Promise<Project3DModel | null> {
  console.log('[assignDefaultModel] Assigning default model for project:', projectId, projectType);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[assignDefaultModel] Auth error:', userContext.error);
    return null;
  }

  const { supabase } = userContext;

  // Step 1: Check for company custom default
  const companyDefault = await getCompanyDefaultModel(projectType);
  if (companyDefault) {
    console.log('[assignDefaultModel] Using company custom default:', companyDefault.id);

    // Create project model record referencing company default
    const { data: projectModel, error: insertError } = await supabase
      .from('projects_3d_models')
      .insert({
        project_id: projectId,
        version: 1,
        file_name: `company-custom-${projectType}.xkt`, // Use project type for file name
        xkt_file_url: companyDefault.xkt_file_url,
        original_file_url: companyDefault.original_file_url,
        file_size_bytes: companyDefault.file_size_bytes,
        element_count: companyDefault.element_count,
        bounds: companyDefault.bounds,
        floors: companyDefault.floors,
        processing_status: 'ready', // Changed from 'completed' to 'ready' to match page.tsx query
        is_active: true, // Mark as active so page.tsx query finds it
        is_default: true,
        default_model_id: null, // Company custom, not system default
      })
      .select()
      .single();

    if (insertError) {
      console.error('[assignDefaultModel] Error creating project model from company default:', insertError);
      return null;
    }

    console.log('[assignDefaultModel] Created project model from company default:', projectModel.id);
    return projectModel as Project3DModel;
  }

  // Step 2: Fallback to system default
  const systemDefault = await getSystemDefaultModel(projectType);
  if (systemDefault) {
    console.log('[assignDefaultModel] Using system default:', systemDefault.id, systemDefault.name);

    const projectModel = await copyDefaultModelToProject(projectId, systemDefault.id, supabase);
    if (projectModel) {
      console.log('[assignDefaultModel] Created project model from system default:', projectModel.id);
      return projectModel;
    }
  }

  // Step 3: No default found
  console.log('[assignDefaultModel] No default model available for project type:', projectType);
  return null;
}

/**
 * Get all default models for company (system + custom)
 * Returns comprehensive list for UI display
 */
export async function getDefaultModelsForCompany() {
  console.log('[getDefaultModelsForCompany] Fetching all default models');

  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[getDefaultModelsForCompany] Auth error:', userContext.error);
    return { success: false, error: userContext.error, data: [] };
  }

  const { supabase, companyId } = userContext;

  // Get all project type configs for company
  const { data: typeConfigs, error: typeConfigError } = await supabase
    .from('project_type_configs')
    .select('id, name, description, icon_name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('order_index');

  if (typeConfigError) {
    console.error('[getDefaultModelsForCompany] Error fetching type configs:', typeConfigError);
    return { success: false, error: typeConfigError.message, data: [] };
  }

  // Map to project type names for system defaults
  const projectTypeToSystemMap: Record<string, string> = {
    'Residential': 'residential',
    'Cafe': 'cafe',
    'Restaurant': 'restaurant',
    'Restaurant/Cafe': 'restaurant', // Default to restaurant
    'Commercial Office': 'commercial_office',
    'Industrial': 'industrial',
  };

  const result = [];

  for (const typeConfig of typeConfigs) {
    // Get system default
    const systemType = projectTypeToSystemMap[typeConfig.name];
    const { data: systemDefault } = await supabase
      .from('default_3d_models')
      .select('*')
      .eq('project_type', systemType)
      .eq('is_active', true)
      .maybeSingle();

    // Get company custom default
    const { data: companyDefault } = await supabase
      .from('company_default_models')
      .select(`
        id,
        model_id,
        is_active,
        created_at,
        model:projects_3d_models (
          id,
          xkt_file_url,
          original_file_url,
          file_size_bytes,
          element_count,
          bounds,
          floors,
          created_at
        )
      `)
      .eq('company_id', companyId)
      .eq('project_type_config_id', typeConfig.id)
      .eq('is_active', true)
      .maybeSingle();

    result.push({
      projectTypeConfigId: typeConfig.id,
      projectTypeName: typeConfig.name,
      projectTypeDescription: typeConfig.description,
      iconName: typeConfig.icon_name,
      systemDefault: systemDefault || null,
      companyCustom: companyDefault ? {
        id: companyDefault.id,
        modelId: companyDefault.model_id,
        fileSize: companyDefault.model.file_size_bytes,
        elementCount: companyDefault.model.element_count,
        uploadedAt: companyDefault.created_at,
        xktUrl: companyDefault.model.xkt_file_url,
      } : null,
    });
  }

  console.log('[getDefaultModelsForCompany] Returning', result.length, 'project types');
  return { success: true, data: result };
}

/**
 * Upload company custom default model
 * For Phase 5 - Company customization UI
 */
export async function uploadCompanyDefaultModel(
  formData: FormData,
  projectTypeConfigId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[uploadCompanyDefaultModel] Uploading company default for type config:', projectTypeConfigId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { success: false, error: userContext.error };
  }

  const { supabase, companyId, role } = userContext;

  // Check if user is GC admin
  if (role !== 'admin') {
    return { success: false, error: 'Only GC admins can upload company default models' };
  }

  // TODO: Implement actual file upload and IFC conversion
  // For now, return placeholder
  return { success: false, error: 'Upload functionality not yet implemented' };
}

/**
 * Reset company default to system default
 * For Phase 5 - Company customization UI
 */
export async function resetToSystemDefault(
  projectTypeConfigId: string
): Promise<{ success: boolean }> {
  console.log('[resetToSystemDefault] Resetting to system default for type config:', projectTypeConfigId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { success: false };
  }

  const { supabase, companyId, role } = userContext;

  // Check if user is GC admin
  if (role !== 'admin') {
    return { success: false };
  }

  // Deactivate company custom default
  const { error } = await supabase
    .from('company_default_models')
    .update({ is_active: false })
    .eq('company_id', companyId)
    .eq('project_type_config_id', projectTypeConfigId)
    .eq('is_active', true);

  if (error) {
    console.error('[resetToSystemDefault] Error deactivating company default:', error);
    return { success: false };
  }

  console.log('[resetToSystemDefault] Successfully reset to system default');
  revalidatePath('/app/settings/default-models');
  return { success: true };
}
