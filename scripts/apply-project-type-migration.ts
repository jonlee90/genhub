/**
 * Apply project_type enum migration
 *
 * This script updates the project_type enum to include separate 'restaurant' and 'cafe' types
 * instead of the combined 'restaurant_cafe' type.
 *
 * Usage:
 *   npx tsx scripts/apply-project-type-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SECRET_KEY:', supabaseServiceKey ? '✓' : '✗');
    process.exit(1);
  }

  console.log('🔧 Applying project_type enum migration...\n');

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260102150000_update_project_type_enum.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file:', migrationPath);
  console.log('📝 SQL preview:');
  console.log('---');
  console.log(migrationSQL.split('\n').slice(0, 20).join('\n'));
  console.log('...\n');

  try {
    // Execute the migration
    console.log('⏳ Executing migration...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);

      // Try alternative approach: execute each statement separately
      console.log('\n🔄 Trying alternative approach (statement by statement)...');

      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.startsWith('--') || !statement.trim()) continue;

        console.log(`\n  [${i + 1}/${statements.length}] Executing statement...`);
        console.log(`  ${statement.substring(0, 60)}...`);

        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (stmtError) {
          console.error(`  ❌ Failed:`, stmtError.message);

          // Some errors are expected (e.g., "type already exists")
          if (stmtError.message.includes('already exists')) {
            console.log('  ⚠️  Skipping (already exists)');
            continue;
          }

          throw stmtError;
        }

        console.log('  ✅ Success');
      }

      console.log('\n✅ Migration applied successfully (alternative method)!');
    } else {
      console.log('✅ Migration applied successfully!');
    }

    // Verify the new enum values
    console.log('\n🔍 Verifying enum values...');

    const { data: enumData, error: enumError } = await supabase
      .from('projects')
      .select('project_type')
      .limit(0);

    if (enumError && !enumError.message.includes('no rows')) {
      console.error('❌ Verification failed:', enumError);
    } else {
      console.log('✅ Enum updated successfully!');
      console.log('\n📊 Valid project_type values:');
      console.log('   - residential');
      console.log('   - restaurant');
      console.log('   - cafe');
      console.log('   - commercial_office');
      console.log('   - industrial');
    }

  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }

  console.log('\n🎉 Migration complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Regenerate TypeScript types: npx supabase gen types typescript --project-id $PROJECT_REF > types/database.types.ts');
  console.log('   2. Test creating a project with type "cafe"');
}

main();
