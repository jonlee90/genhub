#!/usr/bin/env node
/**
 * Apply file management migrations to Supabase
 * Adapted from apply-migration.mjs pattern
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Expected: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Migration files in order
const migrations = [
  '20260106000001_create_file_enums.sql',
  '20260106000002_create_project_files.sql',
  '20260106000003_create_project_photos.sql',
  '20260106000004_create_file_audit_log.sql'
];

/**
 * Execute SQL via Supabase exec_sql RPC
 * NOTE: This requires the exec_sql RPC function to exist in your database.
 * If it doesn't exist, use the Supabase Dashboard SQL Editor instead.
 */
async function executeSql(sql) {
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
  const url = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

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

/**
 * Apply a single migration file
 */
async function applyMigration(filename) {
  console.log(`\n📄 Applying: ${filename}`);

  const filepath = join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = readFileSync(filepath, 'utf-8');

  try {
    await executeSql(sql);
    console.log(`✅ Successfully applied: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply ${filename}:`, error.message);

    // Try statement-by-statement
    console.log('   Trying statement-by-statement...');
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
        console.error(`   Error: ${err.message.substring(0, 100)}`);
        errorCount++;
      }
    }

    console.log(`   ${successCount} statements OK, ${errorCount} errors`);
    return errorCount === 0;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Applying File Management Migrations                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`Project: ${supabaseUrl}`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log('\n⚠️  Migration had errors. Check output above.');
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Successful: ${successCount}/${migrations.length}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount === 0) {
    console.log('\n🎉 All migrations applied successfully!');
    console.log('\nNext steps:');
    console.log('  1. Regenerate TypeScript types');
    console.log('  2. Verify schema in Supabase dashboard');
    console.log('  3. Test RLS policies');
    console.log('\nRun: npm run db:types (if available)\n');
  } else {
    console.log('\n⚠️  Some migrations had errors.');
    console.log('Consider using Supabase Dashboard SQL Editor instead.');
    console.log('See: supabase/migrations/README_FILE_MIGRATIONS.md\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error.message);
  console.error('\nTry using Supabase Dashboard SQL Editor instead.');
  console.error('See: supabase/migrations/README_FILE_MIGRATIONS.md\n');
  process.exit(1);
});
