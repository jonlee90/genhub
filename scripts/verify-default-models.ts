/**
 * Script to verify default model assignment is working
 * Run with: npx tsx scripts/verify-default-models.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function verifyDefaultModels() {
  console.log('=== Verifying Default Model System ===\n');

  // Step 1: Check available default models
  console.log('Step 1: Checking default models in system...');
  const { data: defaults } = await supabase
    .from('default_3d_models')
    .select('id, project_type, name, is_active')
    .eq('is_active', true)
    .order('project_type');

  console.log(`✅ Found ${defaults?.length || 0} default models:`);
  defaults?.forEach((model: any) => {
    console.log(`   - ${model.project_type}: ${model.name}`);
  });
  console.log('');

  // Step 2: Check cafe project
  console.log('Step 2: Verifying cafe project model assignment...');
  const { data: cafeProject } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      project_type,
      projects_3d_models!inner (
        id,
        file_name,
        processing_status,
        is_active,
        is_default,
        element_count,
        default_model_id
      )
    `)
    .eq('id', 'ee85199b-ff92-49de-b5d4-d16c7323b78c')
    .eq('projects_3d_models.is_active', true)
    .single();

  if (cafeProject) {
    console.log('✅ Cafe project has active model:');
    console.log(`   - Project: ${cafeProject.name} (${cafeProject.project_type})`);
    console.log(`   - Model ID: ${(cafeProject.projects_3d_models as any)[0]?.id}`);
    console.log(`   - File: ${(cafeProject.projects_3d_models as any)[0]?.file_name}`);
    console.log(`   - Status: ${(cafeProject.projects_3d_models as any)[0]?.processing_status}`);
    console.log(`   - Is Default: ${(cafeProject.projects_3d_models as any)[0]?.is_default}`);
    console.log(`   - Elements: ${(cafeProject.projects_3d_models as any)[0]?.element_count}`);
  } else {
    console.log('❌ Cafe project has no active model');
  }
  console.log('');

  // Step 3: Check markers for cafe project
  console.log('Step 3: Checking markers for cafe project...');
  const { data: markers, count } = await supabase
    .from('spatial_markers')
    .select('id, title, type, status, task_id, marker_config_id', { count: 'exact' })
    .eq('project_id', 'ee85199b-ff92-49de-b5d4-d16c7323b78c');

  console.log(`✅ Found ${count || 0} markers for cafe project`);
  if (markers && markers.length > 0) {
    const linked = markers.filter(m => m.task_id).length;
    const fromConfig = markers.filter(m => m.marker_config_id).length;
    console.log(`   - ${linked} markers linked to tasks`);
    console.log(`   - ${fromConfig} markers from default configs`);
  }
  console.log('');

  // Step 4: Test query that page.tsx uses
  console.log('Step 4: Testing page.tsx query...');
  const { data: pageQueryResult } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('project_id', 'ee85199b-ff92-49de-b5d4-d16c7323b78c')
    .eq('is_active', true)
    .eq('processing_status', 'ready')
    .maybeSingle();

  if (pageQueryResult) {
    console.log('✅ Page query finds the model successfully!');
    console.log(`   - Model will load in UI`);
  } else {
    console.log('❌ Page query does NOT find the model');
    console.log('   - Model will NOT load in UI');
  }

  console.log('\n=== Verification Complete ===');
}

verifyDefaultModels().catch(console.error);
