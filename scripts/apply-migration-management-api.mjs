#!/usr/bin/env node

/**
 * Apply migration using Supabase Management API
 * This uses the official Supabase API to execute SQL
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN; // Personal access token from Supabase dashboard

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project ref from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

async function executeSqlViaApi(sql) {
  if (!supabaseAccessToken) {
    console.log('\n⚠️  No SUPABASE_ACCESS_TOKEN found.');
    console.log('To use Management API, get a personal access token from:');
    console.log('https://supabase.com/dashboard/account/tokens');
    console.log('Then add it to .env as SUPABASE_ACCESS_TOKEN=your_token\n');
    throw new Error('SUPABASE_ACCESS_TOKEN required');
  }

  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log(`Executing SQL via Management API (${url})...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAccessToken}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return await response.json();
}

async function executeSqlViaSupabaseJs(statements) {
  // Alternative: Use supabase-js with service key to execute statements
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\nExecuting statements via Supabase client (limited method)...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      // Try using raw SQL execution if available
      // Note: This may not work for all DDL statements
      const trimmed = statement.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      console.log(`Executing: ${trimmed.substring(0, 80)}...`);

      // Attempt to execute via rpc if available
      const { error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        console.error(`  ❌ ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\nCompleted: ${successCount} successful, ${errorCount} errors\n`);

  return { successCount, errorCount };
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

  console.log(`Reading migration: 045_auto_create_phases_tasks_from_templates.sql\n`);

  const sql = readFileSync(migrationPath, 'utf8');

  console.log('⚠️  IMPORTANT: Supabase hosted instances have limited SQL execution options.\n');
  console.log('📋 RECOMMENDED APPROACH:');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Open a new query');
  console.log('   3. Copy/paste the content of:');
  console.log('      supabase/migrations/045_auto_create_phases_tasks_from_templates.sql');
  console.log('   4. Run the query\n');

  console.log('🔗 Direct link:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);

  // Try Management API first
  try {
    await executeSqlViaApi(sql);
    console.log('\n✅ Migration applied successfully via Management API!\n');
  } catch (error) {
    console.log(`\n❌ Management API failed: ${error.message}\n`);

    // Show manual instructions
    console.log('📄 SQL Content to copy/paste:\n');
    console.log('────────────────────────────────────────────────────────');
    console.log(sql);
    console.log('────────────────────────────────────────────────────────\n');

    console.log('After applying manually, run: node scripts/test-trigger.mjs\n');
  }
}

main().catch(error => {
  console.error('\n✗ Fatal error:', error.message);
  process.exit(1);
});
