#!/usr/bin/env node

/**
 * Simple migration applier using Supabase PostgREST
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlStatements(statements) {
  console.log('\n📝 Executing migration statements...\n');

  const results = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();

    if (!statement || statement.startsWith('--') || statement === '') {
      continue;
    }

    console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

    try {
      // Use raw SQL execution via Supabase
      const { data, error } = await supabase.rpc('query', { query_text: statement });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.push({ success: false, error: error.message, statement });
      } else {
        console.log(`   ✅ Success`);
        results.push({ success: true, statement });
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}`);
      results.push({ success: false, error: err.message, statement });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} failed\n`);

  if (errorCount > 0) {
    console.log('❌ Failed statements:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.statement.substring(0, 80)}...`);
      console.log(`     Error: ${r.error}`);
    });
  }

  return { successCount, errorCount, results };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Applying Migration 045 - Auto Create Phases/Tasks   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Read migration file
  const migrationPath = join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '045_auto_create_phases_tasks_from_templates.sql'
  );

  console.log(`📂 Reading: ${migrationPath}`);

  const sql = readFileSync(migrationPath, 'utf8');

  // Split into statements
  const statements = sql
    .split(/;[\s\n]/)
    .map(s => s.trim())
    .filter(s => s && s !== '');

  console.log(`📋 Found ${statements.length} SQL statements\n`);

  // Try to execute
  const { successCount, errorCount } = await executeSqlStatements(statements);

  if (errorCount === 0) {
    console.log('✅ All statements executed successfully!\n');

    // Verify trigger was created
    console.log('🔍 Verifying trigger creation...');

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .single();

    if (company) {
      const testProject = {
        company_id: company.id,
        name: `VERIFY_TRIGGER_${Date.now()}`,
        client_name: 'Test',
        address: 'Test',
        project_type: 'residential',
        start_date: '2026-01-03',
        status: 'active',
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert(testProject)
        .select('id')
        .single();

      if (project) {
        const { data: phases } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', project.id);

        if (phases && phases.length > 0) {
          console.log(`✅ Trigger verified! Created ${phases.length} phases automatically`);
        } else {
          console.log('⚠️  Trigger may not be working (no phases created)');
        }

        // Clean up
        await supabase.from('projects').delete().eq('id', project.id);
      }
    }

    console.log('\n✅ Migration complete!\n');
  } else {
    console.log('\n⚠️  Migration completed with errors.');
    console.log('Some statements may need to be applied manually via Supabase Dashboard.\n');

    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    console.log(`🔗 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);

    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
