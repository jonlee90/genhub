#!/usr/bin/env node

/**
 * Apply migration using direct PostgreSQL connection
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
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

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    console.log('Executing migration SQL...');
    await client.query(sql);

    console.log('\n✓ Migration applied successfully!\n');

    // Verify the trigger was created
    const { rows } = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name = 'create_phases_and_tasks_on_project_insert'
      AND event_object_schema = 'public';
    `);

    if (rows.length > 0) {
      console.log('✓ Trigger verified:');
      rows.forEach(row => {
        console.log(`  - ${row.trigger_name} on ${row.event_object_table} (${row.event_manipulation})`);
      });
    } else {
      console.log('⚠️  Warning: Trigger not found after migration');
    }

    console.log('\nNext steps:');
    console.log('  1. Run: node scripts/test-trigger.mjs');
    console.log('  2. Create a new project and verify phases/tasks are auto-created\n');

  } catch (error) {
    console.error('\n✗ Error applying migration:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('\n✗ Fatal error:', error.message);
  process.exit(1);
});
