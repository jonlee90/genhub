#!/usr/bin/env node

/**
 * Apply migration using Supabase SQL Editor API
 * This directly executes the migration SQL against the database
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

async function executeSql(sql) {
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
  const url = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

  console.log('Executing SQL via Supabase REST API...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return await response.json();
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Applying Auto-Create Phases/Tasks Trigger Migration ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const migrationPath = join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '045_auto_create_phases_tasks_from_templates.sql'
  );

  console.log(`Reading migration: ${migrationPath}\n`);

  const sql = readFileSync(migrationPath, 'utf8');

  try {
    await executeSql(sql);
    console.log('\n✓ Migration applied successfully!\n');
    console.log('Next steps:');
    console.log('  1. Run: node scripts/test-trigger.mjs');
    console.log('  2. Verify phases and tasks are auto-created\n');
  } catch (error) {
    console.error('\n✗ Error applying migration:');
    console.error(error.message);
    console.error('\nTrying alternative method: Statement by statement...\n');

    // Try splitting into statements
    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '');

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        await executeSql(statement + ';');
        successCount++;
      } catch (err) {
        console.error(`Error in statement: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\nCompleted: ${successCount} successful, ${errorCount} errors\n`);

    if (errorCount > 0) {
      console.error('Some statements failed. Manual intervention may be required.');
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('\n✗ Fatal error:', error.message);
  process.exit(1);
});
