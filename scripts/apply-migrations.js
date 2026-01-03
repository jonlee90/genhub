#!/usr/bin/env node
/**
 * Apply default models migrations using pg client
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function applyMigration(client, filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  console.log(`\n📄 Applying ${filePath}...`);

  try {
    const sql = fs.readFileSync(fullPath, 'utf-8');
    await client.query(sql);
    console.log(`✅ Successfully applied ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    const migrations = [
      'supabase/migrations/042_create_default_models_tables.sql',
      'supabase/migrations/043_extend_existing_tables.sql',
      'supabase/migrations/044_seed_default_models.sql',
    ];

    let allSuccess = true;
    for (const migration of migrations) {
      const success = await applyMigration(client, migration);
      if (!success) allSuccess = false;
    }

    if (allSuccess) {
      console.log('\n✅ All migrations applied successfully!\n');
      console.log('📊 Database changes:');
      console.log('  ✓ default_3d_models table created');
      console.log('  ✓ company_default_models table created');
      console.log('  ✓ default_marker_configs table created');
      console.log('  ✓ projects_3d_models extended (is_default, default_model_id)');
      console.log('  ✓ spatial_markers extended (marker_config_id)');
      console.log('  ✓ 5 default models seeded');
      console.log('  ✓ Marker configurations seeded\n');
    } else {
      console.error('\n❌ Some migrations failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

main();
