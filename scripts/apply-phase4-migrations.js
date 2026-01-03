#!/usr/bin/env node

/**
 * Apply Phase 4 (GenHub Integration) migrations
 *
 * This script applies the database migrations for Phase 4 of the 3D Spatial Viewer,
 * which adds spatial_marker_id columns to tasks and material_assignments tables.
 *
 * Usage:
 *   node scripts/apply-phase4-migrations.js
 *
 * Prerequisites:
 *   - DATABASE_URL must be set in .env file
 *   - pg (PostgreSQL client) must be installed: npm install pg
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Client } = require('pg');

const MIGRATIONS = [
  {
    file: 'supabase/migrations/20260102120000_add_spatial_marker_to_tasks.sql',
    description: 'Add spatial_marker_id to tasks table',
  },
  {
    file: 'supabase/migrations/20260102120001_add_spatial_marker_to_materials.sql',
    description: 'Add spatial_marker_id to material_assignments table',
  },
];

async function applyMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables');
    console.error('   Please ensure DATABASE_URL is set in your .env file');
    process.exit(1);
  }

  console.log('📦 Phase 4 Migration Tool - GenHub Integration\n');
  console.log('🔗 Connecting to database...');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const migration of MIGRATIONS) {
      console.log(`📝 Applying: ${migration.description}`);
      console.log(`   File: ${migration.file}`);

      const migrationPath = path.join(__dirname, '..', migration.file);

      if (!fs.existsSync(migrationPath)) {
        console.error(`   ❌ Migration file not found: ${migrationPath}`);
        continue;
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');

      try {
        await client.query(sql);
        console.log('   ✅ Migration applied successfully\n');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Column already exists, skipping\n');
        } else {
          console.error('   ❌ Error applying migration:', error.message);
          throw error;
        }
      }
    }

    console.log('🎉 All migrations applied successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Regenerate TypeScript types:');
    console.log('      npx supabase gen types typescript --project-id fozwbpqgkcduwxqvmkjd > types/database.types.ts');
    console.log('   2. Test the new server actions');
    console.log('   3. Build and verify: npm run build\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migrations
applyMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
