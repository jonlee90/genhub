#!/usr/bin/env node

/**
 * Verify that migration 045 was applied successfully
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   Verifying Migration 045 - Trigger & Function        ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Get a company to test with
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .limit(1)
    .single();

  if (companyError || !company) {
    console.error('❌ Could not find a company to test with');
    console.error('   Error:', companyError?.message);
    process.exit(1);
  }

  console.log(`✅ Using company: ${company.name} (${company.id})\n`);

  // Create a test project
  console.log('🧪 Creating test project to verify trigger...\n');

  const testProjectData = {
    company_id: company.id,
    name: `MIGRATION_VERIFY_TEST_${Date.now()}`,
    client_name: 'Test Client',
    address: '123 Test Street',
    project_type: 'residential',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
  };

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert(testProjectData)
    .select('id, name')
    .single();

  if (projectError) {
    console.error('❌ ERROR creating test project:');
    console.error('   Message:', projectError.message);
    console.error('   Code:', projectError.code);
    console.error('\n🔴 MIGRATION NOT APPLIED');
    console.error('\n📋 Next steps:');
    console.error('   1. Open: https://supabase.com/dashboard/project/' + supabaseUrl.match(/https:\/\/([^.]+)/)[1] + '/sql/new');
    console.error('   2. Copy contents of: supabase/migrations/045_auto_create_phases_tasks_from_templates.sql');
    console.error('   3. Paste into SQL Editor and click "Run"\n');
    process.exit(1);
  }

  console.log(`✅ Test project created: ${project.name} (${project.id})\n`);

  // Check if phases were auto-created
  console.log('🔍 Checking for auto-created phases...\n');

  const { data: phases, error: phasesError } = await supabase
    .from('project_phases')
    .select('id, name, order_index, status')
    .eq('project_id', project.id)
    .order('order_index', { ascending: true });

  if (phasesError) {
    console.error('❌ Error fetching phases:', phasesError.message);
  }

  const phaseCount = phases?.length || 0;

  if (phaseCount === 0) {
    console.log('❌ NO PHASES CREATED\n');
    console.log('🔴 MIGRATION NOT APPLIED OR TRIGGER NOT WORKING\n');
    console.log('📋 What to do:');
    console.log('   1. Verify migration was applied via Supabase Dashboard');
    console.log('   2. Check for errors in Supabase logs');
    console.log('   3. Manually apply migration from:');
    console.log('      supabase/migrations/045_auto_create_phases_tasks_from_templates.sql\n');
  } else {
    console.log(`✅ SUCCESS! ${phaseCount} phases auto-created:\n`);
    phases?.forEach((phase, idx) => {
      console.log(`   ${idx + 1}. ${phase.name} (status: ${phase.status})`);
    });
    console.log('\n🟢 MIGRATION VERIFIED - TRIGGER IS WORKING!\n');
  }

  // Check for tasks too
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, phase_id')
    .eq('project_id', project.id);

  const taskCount = tasks?.length || 0;

  if (taskCount > 0) {
    console.log(`✅ ${taskCount} tasks also created from templates\n`);
  } else {
    console.log(`ℹ️  No tasks created (this is expected if no task templates exist)\n`);
  }

  // Clean up test project
  console.log('🧹 Cleaning up test project...');

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', project.id);

  if (deleteError) {
    console.warn('⚠️  Could not delete test project (you may need to delete manually)');
    console.warn('   Project ID:', project.id);
  } else {
    console.log('✅ Test project deleted\n');
  }

  // Final summary
  console.log('═'.repeat(55));

  if (phaseCount > 0) {
    console.log('🟢 RESULT: Migration successfully applied!');
    console.log('   Projects will now auto-create phases and tasks.');
    console.log('═'.repeat(55) + '\n');
    process.exit(0);
  } else {
    console.log('🔴 RESULT: Migration NOT applied or not working.');
    console.log('   Please apply migration manually via Supabase Dashboard.');
    console.log('═'.repeat(55) + '\n');
    process.exit(1);
  }
}

verifyMigration().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
