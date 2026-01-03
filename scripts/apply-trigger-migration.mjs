#!/usr/bin/env node

/**
 * Apply the auto-create phases/tasks trigger migration
 * This script reads and executes the SQL migration file
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile(filePath) {
  console.log(`Reading migration file: ${filePath}`);

  const sql = readFileSync(filePath, 'utf8');

  console.log('Executing migration SQL...\n');

  // We'll use the REST API to execute raw SQL
  // Note: This requires using the service role key
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to execute SQL: ${error}`);
  }

  const result = await response.json();
  console.log('Migration executed successfully');
  return result;
}

async function checkTriggerExists() {
  console.log('Checking if trigger already exists...');

  const { data, error } = await supabase
    .from('pg_trigger')
    .select('tgname')
    .eq('tgname', 'create_phases_and_tasks_on_project_insert')
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine
    console.warn('Could not check trigger (will apply migration anyway):', error.message);
    return false;
  }

  return data && data.length > 0;
}

async function main() {
  console.log('=== Auto-Create Phases/Tasks Migration ===\n');

  try {
    const exists = await checkTriggerExists();

    if (exists) {
      console.log('✓ Trigger already exists');
      console.log('\nTo test, create a new project and verify phases/tasks are auto-created.');
      return;
    }

    console.log('✗ Trigger does not exist, applying migration...\n');

    const migrationPath = join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '045_auto_create_phases_tasks_from_templates.sql'
    );

    await executeSqlFile(migrationPath);

    console.log('\n✓ Migration applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Create a test project');
    console.log('2. Verify phases and tasks are auto-created');
    console.log('3. Check the project_phases and tasks tables');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

main();
