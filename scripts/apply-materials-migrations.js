#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrations = [
  '20260104000001_create_tracked_materials.sql',
  '20260104000002_create_material_price_history.sql',
  '20260104000003_add_material_indexes.sql'
];

async function applyMigration(filename) {
  try {
    console.log(`\n📄 Reading ${filename}...`);
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', filename),
      'utf8'
    );

    console.log(`⚙️  Applying migration...`);

    // Use the REST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log(`✅ ${filename} applied successfully!`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to apply ${filename}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration process...\n');
  console.log('=' .repeat(60));

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (!success) {
      console.error('\n❌ Migration process stopped due to errors.');
      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All migrations applied successfully!');
  console.log('\n📊 Summary:');
  console.log('  - tracked_materials table created');
  console.log('  - material_price_history table created');
  console.log('  - Indexes added to materials and material_assignments');
  console.log('  - RLS policies enabled');
  console.log('  - Triggers configured');
  console.log('\n💡 Next step: Run TypeScript type generation');
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
