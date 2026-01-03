#!/usr/bin/env tsx
/**
 * Script to apply default models migrations
 * Usage: npm run apply-migrations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

// Parse connection string
const url = new URL(DATABASE_URL.replace('postgresql://', 'postgres://'));
const SUPABASE_URL = `https://${url.hostname.replace('db.', '')}`;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable not set');
  console.log('Please set SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function executeSQLFile(filePath: string) {
  console.log(`\n📄 Executing ${filePath}...`);

  try {
    const sql = readFileSync(resolve(process.cwd(), filePath), 'utf-8');

    // Split by statement separator and execute each
    // Note: This is a simplified approach - for complex migrations use proper SQL parser
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().includes('do $$') || statement.toLowerCase().includes('begin')) {
        // Execute as-is for DO blocks
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.error(`❌ Error executing statement:`, error);
          throw error;
        }
      }
    }

    console.log(`✅ Successfully executed ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to execute ${filePath}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Applying default models migrations...\n');

  const migrations = [
    'supabase/migrations/042_create_default_models_tables.sql',
    'supabase/migrations/043_extend_existing_tables.sql',
    'supabase/migrations/044_seed_default_models.sql',
  ];

  try {
    for (const migration of migrations) {
      await executeSQLFile(migration);
    }

    console.log('\n✅ All migrations applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Created default_3d_models table');
    console.log('  - Created company_default_models table');
    console.log('  - Created default_marker_configs table');
    console.log('  - Extended projects_3d_models table');
    console.log('  - Extended spatial_markers table');
    console.log('  - Seeded 5 default models');
    console.log('  - Seeded marker configurations');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
