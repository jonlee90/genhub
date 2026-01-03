#!/usr/bin/env node

/**
 * Test script to verify the auto-create trigger works
 * 1. Check if trigger exists
 * 2. Create a test project
 * 3. Verify phases and tasks are created
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function checkSchema() {
  console.log('=== Checking Database Schema ===\n');

  // Check projects table
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (projectsError) {
    console.error('Error accessing projects table:', projectsError.message);
    return false;
  }

  console.log('✓ Projects table exists');

  // Check project_phases table
  const { data: phases, error: phasesError } = await supabase
    .from('project_phases')
    .select('*')
    .limit(1);

  if (phasesError) {
    console.error('Error accessing project_phases table:', phasesError.message);
    return false;
  }

  console.log('✓ Project_phases table exists');

  // Check tasks table
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (tasksError) {
    console.error('Error accessing tasks table:', tasksError.message);
    return false;
  }

  console.log('✓ Tasks table exists');

  // Check phase_templates table
  const { data: phaseTemplates, error: phaseTemplatesError } = await supabase
    .from('phase_templates')
    .select('*')
    .limit(1);

  if (phaseTemplatesError) {
    console.error('Error accessing phase_templates table:', phaseTemplatesError.message);
    return false;
  }

  console.log('✓ Phase_templates table exists');

  // Check task_templates table
  const { data: taskTemplates, error: taskTemplatesError } = await supabase
    .from('task_templates')
    .select('*')
    .limit(1);

  if (taskTemplatesError) {
    console.error('Error accessing task_templates table:', taskTemplatesError.message);
    return false;
  }

  console.log('✓ Task_templates table exists\n');

  return true;
}

async function createTestProject() {
  console.log('=== Creating Test Project ===\n');

  // Get a company_id to use (we'll use the first one we find)
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id')
    .limit(1);

  if (companiesError || !companies || companies.length === 0) {
    console.error('No companies found. Please create a company first.');
    return null;
  }

  const companyId = companies[0].id;
  console.log(`Using company ID: ${companyId}`);

  // Get a user to set as created_by
  const { data: users, error: usersError } = await supabase
    .from('next_auth.users')
    .select('id')
    .limit(1);

  const createdBy = users && users.length > 0 ? users[0].id : null;

  // Create test project
  const testProject = {
    name: `Test Auto-Create Project ${Date.now()}`,
    client_name: 'Test Client',
    company_id: companyId,
    status: 'active',
    created_by: createdBy,
    start_date: new Date().toISOString().split('T')[0],
  };

  console.log('Creating project:', testProject.name);

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert(testProject)
    .select()
    .single();

  if (projectError) {
    console.error('Error creating project:', projectError.message);
    return null;
  }

  console.log(`✓ Project created with ID: ${project.id}\n`);

  return project;
}

async function verifyPhasesAndTasks(projectId) {
  console.log('=== Verifying Auto-Created Phases and Tasks ===\n');

  // Wait a moment for the trigger to execute
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check phases
  const { data: phases, error: phasesError } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (phasesError) {
    console.error('Error fetching phases:', phasesError.message);
    return false;
  }

  console.log(`Found ${phases.length} phases:`);
  phases.forEach(phase => {
    console.log(`  - ${phase.name} (order: ${phase.order_index}, status: ${phase.status})`);
  });

  if (phases.length === 0) {
    console.log('\n⚠️  No phases were created. The trigger may not be installed.');
    return false;
  }

  console.log('');

  // Check tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*, project_phases(name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError.message);
    return false;
  }

  console.log(`Found ${tasks.length} tasks:`);
  tasks.forEach(task => {
    const phaseName = task.project_phases?.name || 'Unknown';
    console.log(`  - [${phaseName}] ${task.title} (status: ${task.status}, priority: ${task.priority})`);
  });

  console.log('');

  if (tasks.length === 0) {
    console.log('⚠️  No tasks were created. Check if task templates exist.');
  }

  return phases.length > 0;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Auto-Create Phases/Tasks Trigger Test            ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Step 1: Check schema
  const schemaOk = await checkSchema();
  if (!schemaOk) {
    console.error('\n✗ Schema check failed');
    process.exit(1);
  }

  // Step 2: Create test project
  const project = await createTestProject();
  if (!project) {
    console.error('\n✗ Failed to create test project');
    process.exit(1);
  }

  // Step 3: Verify phases and tasks
  const success = await verifyPhasesAndTasks(project.id);

  console.log('═══════════════════════════════════════════════════\n');

  if (success) {
    console.log('✓ SUCCESS: Trigger is working correctly!');
    console.log(`\nTest project ID: ${project.id}`);
    console.log('\nYou can view the project at:');
    console.log(`  ${supabaseUrl}/project/${project.id}/dashboard/projects`);
  } else {
    console.log('✗ FAILED: Trigger did not create phases/tasks');
    console.log('\nThe migration may need to be applied. Run:');
    console.log('  psql $DATABASE_URL -f supabase/migrations/045_auto_create_phases_tasks_from_templates.sql');
  }

  console.log('');
}

main().catch(error => {
  console.error('\n✗ Error:', error.message);
  process.exit(1);
});
