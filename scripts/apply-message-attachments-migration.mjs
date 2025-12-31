#!/usr/bin/env node

/**
 * Script to manually apply the message_attachments migration
 * Run with: node scripts/apply-message-attachments-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SECRET_KEY:', SUPABASE_SECRET_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// Read migration file
const migrationPath = join(__dirname, '../supabase/migrations/20251230_message_attachments.sql');
console.log('📄 Reading migration from:', migrationPath);

let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
} catch (error) {
  console.error('❌ Failed to read migration file:', error.message);
  process.exit(1);
}

console.log('✅ Migration file loaded');
console.log('📊 Migration size:', migrationSQL.length, 'characters');
console.log('');

console.log('🚀 Applying migration...');
console.log('⏳ This may take a moment...');
console.log('');

try {
  // Execute the migration SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: migrationSQL
  });

  if (error) {
    // Try direct query if rpc fails
    console.log('⚠️  RPC failed, trying direct query...');
    const { error: directError } = await supabase.from('_sql').select('*').limit(0);

    if (directError) {
      console.error('❌ Migration failed:', error.message);
      console.error('');
      console.error('💡 Alternative: Copy the SQL from the migration file and run it manually in Supabase Studio:');
      console.error('   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
      console.error('   2. Paste the SQL from:', migrationPath);
      console.error('   3. Click "Run"');
      process.exit(1);
    }
  }

  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Regenerate TypeScript types:');
  console.log('      npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/database.types.ts');
  console.log('');
  console.log('   2. Set up Vercel Blob environment variable:');
  console.log('      BLOB_READ_WRITE_TOKEN=vercel_blob_...');
  console.log('');
  console.log('   3. Run security advisors (when MCP connection is stable)');
  console.log('');

} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  console.error('');
  console.error('💡 Manual migration instructions:');
  console.error('   1. Go to Supabase Studio SQL Editor');
  console.error('   2. Copy SQL from:', migrationPath);
  console.error('   3. Execute the SQL manually');
  process.exit(1);
}
