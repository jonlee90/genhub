// Check cafe project and available models
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

(async () => {
  console.log('=== Checking Cafe Project ===\n');

  // Check cafe project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, project_type, created_at')
    .eq('id', 'ee85199b-ff92-49de-b5d4-d16c7323b78c')
    .single();

  if (projectError) {
    console.error('Project error:', projectError);
    return;
  }

  console.log('Project:', JSON.stringify(project, null, 2));
  console.log('');

  // Check models for this project
  const { data: models, error: modelsError } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('project_id', 'ee85199b-ff92-49de-b5d4-d16c7323b78c');

  if (modelsError) {
    console.error('Models error:', modelsError);
  } else {
    console.log(`Models for project (${models?.length || 0}):`);
    console.log(JSON.stringify(models, null, 2));
  }
  console.log('');

  // Check default models available
  const { data: defaults, error: defaultsError } = await supabase
    .from('default_3d_models')
    .select('id, project_type, name, is_active')
    .eq('is_active', true);

  if (defaultsError) {
    console.error('Defaults error:', defaultsError);
  } else {
    console.log(`Available default models (${defaults?.length || 0}):`);
    console.log(JSON.stringify(defaults, null, 2));
  }
})();
