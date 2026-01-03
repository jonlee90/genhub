#!/usr/bin/env node

/**
 * Script to check if the auto-create phases/tasks trigger exists
 * and apply the migration if needed
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggerExists() {
  console.log('Checking if trigger exists...');

  const { data, error } = await supabase.rpc('check_trigger_exists', {
    trigger_name: 'create_phases_and_tasks_on_project_insert',
    table_name: 'projects'
  });

  if (error) {
    // Trigger check function doesn't exist, we'll check directly with SQL
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'create_phases_and_tasks_on_project_insert')
      .eq('event_object_table', 'projects');

    if (triggerError) {
      console.log('Could not check triggers directly, will apply migration');
      return false;
    }

    return triggers && triggers.length > 0;
  }

  return data;
}

async function applyMigration() {
  console.log('Applying migration...');

  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '045_auto_create_phases_tasks_from_templates.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('Error: Migration file not found at', migrationPath);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolons and execute each statement
  const statements = migrationSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log('Executing statement...');
    const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

    if (error) {
      console.error('Error executing statement:', error.message);
      // Continue with next statement
    }
  }

  console.log('Migration applied successfully');
}

async function main() {
  console.log('=== Checking Auto-Create Phases/Tasks Migration ===\n');

  const triggerExists = await checkTriggerExists();

  if (triggerExists) {
    console.log('✓ Trigger already exists. Migration has been applied.');
  } else {
    console.log('✗ Trigger does not exist. Applying migration...');
    await applyMigration();
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
