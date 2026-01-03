#!/usr/bin/env node

/**
 * Seed Demo Projects Script
 * Executes the demo projects migration to create 10 realistic projects
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260103000000_seed_demo_projects.sql');

if (!fs.existsSync(migrationFile)) {
  console.error('❌ Migration file not found:', migrationFile);
  process.exit(1);
}

console.log('🚀 Starting demo projects seeding...\n');

try {
  // Check if psql is available
  try {
    execSync('which psql', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ psql command not found. Please install PostgreSQL client tools.');
    console.error('   macOS: brew install postgresql');
    console.error('   Ubuntu: sudo apt-get install postgresql-client');
    process.exit(1);
  }

  // Execute the migration
  console.log('📝 Executing migration: 20260103000000_seed_demo_projects.sql');

  const result = execSync(`psql "${DATABASE_URL}" -f "${migrationFile}" 2>&1`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer
  });

  console.log(result);

  // Verify the projects were created
  const countQuery = `psql "${DATABASE_URL}" -c "SELECT COUNT(*) as count FROM projects;" -t`;
  const count = execSync(countQuery, { encoding: 'utf-8' }).trim();

  console.log('\n✅ Demo projects seeding completed!');
  console.log(`📊 Total projects in database: ${count}`);
  console.log('\n🎯 Created 10 demo projects:');
  console.log('   • 2 Residential: Sunset Villa Residence, Oakwood Family Home');
  console.log('   • 2 Restaurant: Downtown Bistro, Harbor View Seafood');
  console.log('   • 2 Cafe: Artisan Coffee Co, Campus Corner Cafe');
  console.log('   • 2 Commercial Office: Tech Hub Office Buildout, Financial District Suite');
  console.log('   • 2 Industrial: Riverside Distribution Center, Metro Manufacturing Plant');
  console.log('\n📋 Each project includes:');
  console.log('   • 5 standard construction phases');
  console.log('   • 8-10 realistic tasks per project');
  console.log('   • Linked to appropriate default 3D models');
  console.log('   • Varied completion percentages (20-80%)');
  console.log('   • Health scores (75-95)');

} catch (error) {
  console.error('❌ Error executing migration:', error.message);
  process.exit(1);
}
