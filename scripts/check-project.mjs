import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const projectId = 'efd3aa5a-7303-46f3-985c-5b8c95ce0c2d';

console.log('Checking project:', projectId);

const { data, error } = await supabase
  .from('projects')
  .select('id, name, status, created_at, company_id')
  .eq('id', projectId)
  .single();

if (error) {
  console.error('Error fetching project:', error);
} else if (data) {
  console.log('Project found:', data);
} else {
  console.log('Project not found');
}

// Also check all projects
const { data: allProjects, error: allError } = await supabase
  .from('projects')
  .select('id, name, status, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

if (allError) {
  console.error('Error fetching all projects:', allError);
} else {
  console.log('\nRecent projects:', allProjects);
}

process.exit(0);
