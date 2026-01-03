/**
 * Script to create markers for the cafe project from default configs
 * Run with: npx tsx scripts/create-cafe-markers.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const CAFE_PROJECT_ID = 'ee85199b-ff92-49de-b5d4-d16c7323b78c';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function createCafeMarkers() {
  console.log('=== Creating Cafe Project Markers ===\n');

  // Step 1: Get project and model
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, created_by')
    .eq('id', CAFE_PROJECT_ID)
    .single();

  const { data: model } = await supabase
    .from('projects_3d_models')
    .select('id, default_model_id')
    .eq('project_id', CAFE_PROJECT_ID)
    .eq('is_active', true)
    .single();

  if (!project || !model || !model.default_model_id) {
    console.error('❌ Project or model not found');
    return;
  }

  console.log('✅ Project:', project.name);
  console.log('✅ Model ID:', model.id);
  console.log('');

  // Step 2: Get marker configs
  const { data: markerConfigs } = await supabase
    .from('default_marker_configs')
    .select('*')
    .eq('default_model_id', model.default_model_id);

  console.log(`Found ${markerConfigs?.length || 0} marker configs`);

  if (!markerConfigs || markerConfigs.length === 0) {
    console.log('No markers to create');
    return;
  }

  // Step 3: Get tasks for auto-linking
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, phase_id')
    .eq('project_id', CAFE_PROJECT_ID);

  console.log(`Found ${tasks?.length || 0} tasks for marker linking`);
  console.log('');

  // Step 4: Create markers
  const markersToInsert = markerConfigs.map((config: any) => {
    // Try to match task by title
    let matchedTask = null;
    if (config.task_template_title && tasks) {
      const normalizedConfigTitle = config.task_template_title.toLowerCase().trim();
      matchedTask = tasks.find((task: any) => {
        const normalizedTaskTitle = task.title.toLowerCase().trim();
        return normalizedTaskTitle === normalizedConfigTitle;
      });

      if (matchedTask) {
        console.log(`✅ Matched marker "${config.title}" → task "${matchedTask.title}"`);
      } else {
        console.log(`⚠️  No task match for marker "${config.title}" (template: "${config.task_template_title}")`);
      }
    }

    return {
      project_id: CAFE_PROJECT_ID,
      model_id: model.id,
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
      status: 'open',
      marker_config_id: config.id,
      created_by: project.created_by || '00000000-0000-0000-0000-000000000000',
    };
  });

  console.log('');
  const { data: insertedMarkers, error: markersError } = await supabase
    .from('spatial_markers')
    .insert(markersToInsert)
    .select();

  if (markersError) {
    console.error('❌ Error creating markers:', markersError);
  } else {
    const matched = insertedMarkers.filter((m: any) => m.task_id).length;
    const unmatched = insertedMarkers.filter((m: any) => !m.task_id).length;
    console.log(`✅ Created ${insertedMarkers.length} markers`);
    console.log(`   - ${matched} linked to tasks`);
    console.log(`   - ${unmatched} unlinked`);
  }

  console.log('\n=== Markers Created Successfully! ===');
}

createCafeMarkers().catch(console.error);
