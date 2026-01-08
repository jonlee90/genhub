/**
 * Script to manually assign a default cafe model to the existing cafe project
 * Run with: npx tsx scripts/fix-cafe-project-model.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const CAFE_PROJECT_ID = 'ee85199b-ff92-49de-b5d4-d16c7323b78c';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function fixCafeProject() {
  console.log('=== Fixing Cafe Project Model Assignment ===\n');

  // Step 1: Check current project
  console.log('Step 1: Checking project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, project_type, created_at')
    .eq('id', CAFE_PROJECT_ID)
    .single();

  if (projectError || !project) {
    console.error('❌ Project not found:', projectError);
    return;
  }

  console.log('✅ Project found:', project.name, `(${project.project_type})\n`);

  // Step 2: Check if model already exists
  console.log('Step 2: Checking existing models...');
  const { data: existingModels } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('project_id', CAFE_PROJECT_ID);

  console.log(`Found ${existingModels?.length || 0} existing models`);
  if (existingModels && existingModels.length > 0) {
    console.log('Existing models:', JSON.stringify(existingModels, null, 2));
  }
  console.log('');

  // Step 3: Get cafe default model
  console.log('Step 3: Finding cafe default model...');
  const { data: defaultModel, error: defaultError } = await supabase
    .from('default_3d_models')
    .select('*')
    .eq('project_type', 'cafe')
    .eq('is_active', true)
    .single();

  if (defaultError || !defaultModel) {
    console.error('❌ No cafe default model found:', defaultError);
    return;
  }

  console.log('✅ Found cafe default model:', defaultModel.name);
  console.log('   - ID:', defaultModel.id);
  console.log('   - XKT URL:', defaultModel.xkt_file_url);
  console.log('   - Element count:', defaultModel.element_count);
  console.log('');

  // Step 4: Create project model
  console.log('Step 4: Creating project model from default...');
  const { data: projectModel, error: insertError } = await supabase
    .from('projects_3d_models')
    .insert({
      project_id: CAFE_PROJECT_ID,
      version: 1,
      file_name: defaultModel.name || 'cafe-default.xkt',
      xkt_file_url: defaultModel.xkt_file_url,
      original_file_url: defaultModel.original_file_url,
      file_size_bytes: defaultModel.file_size_bytes,
      element_count: defaultModel.element_count,
      bounds: defaultModel.bounds,
      floors: defaultModel.floors,
      processing_status: 'ready',
      is_active: true,
      is_default: true,
      default_model_id: defaultModel.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating project model:', insertError);
    return;
  }

  console.log('✅ Project model created successfully!');
  console.log('   - Model ID:', projectModel.id);
  console.log('   - Version:', projectModel.version);
  console.log('   - Status:', projectModel.processing_status);
  console.log('   - Active:', projectModel.is_active);
  console.log('');

  // Step 5: Create markers from default configs
  console.log('Step 5: Creating markers from default configs...');
  const { data: markerConfigs } = await supabase
    .from('default_marker_configs')
    .select('*')
    .eq('default_model_id', defaultModel.id);

  console.log(`Found ${markerConfigs?.length || 0} marker configs`);

  if (markerConfigs && markerConfigs.length > 0) {
    // Get tasks for auto-linking
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, phase_id')
      .eq('project_id', CAFE_PROJECT_ID);

    console.log(`Found ${tasks?.length || 0} tasks for marker linking`);

    const markersToInsert = markerConfigs.map((config: any) => {
      // Try to match task by title
      let matchedTask = null;
      if (config.task_template_title && tasks) {
        const normalizedConfigTitle = config.task_template_title.toLowerCase().trim();
        matchedTask = tasks.find((task: any) => {
          const normalizedTaskTitle = task.title.toLowerCase().trim();
          return normalizedTaskTitle === normalizedConfigTitle;
        });
      }

      return {
        project_id: CAFE_PROJECT_ID,
        model_id: projectModel.id,
        task_id: matchedTask?.id || null,
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
        created_by: '00000000-0000-0000-0000-000000000000', // Use project creator or system
      };
    });

    const { data: insertedMarkers, error: markersError } = await supabase
      .from('spatial_markers')
      .insert(markersToInsert)
      .select();

    if (markersError) {
      console.error('❌ Error creating markers:', markersError);
    } else {
      const matched = insertedMarkers.filter((m: any) => m.task_id).length;
      const unmatched = insertedMarkers.filter((m: any) => !m.task_id).length;
      console.log(`✅ Created ${insertedMarkers.length} markers (${matched} linked to tasks, ${unmatched} unlinked)`);
    }
  }

  console.log('\n=== ✅ Cafe Project Fixed Successfully! ===');
  console.log('\nYou can now view the project with the 3D model at:');
  console.log(`/app/projects/${CAFE_PROJECT_ID}`);
}

fixCafeProject().catch(console.error);
