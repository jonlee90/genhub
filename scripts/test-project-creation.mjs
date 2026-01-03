#!/usr/bin/env node
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

async function testProjectCreation() {
  console.log('🧪 Testing project creation with trigger...\n');

  // First, get a valid company_id
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .limit(1)
    .single();

  if (companyError || !companies) {
    console.log('❌ No companies found. Cannot test. Error:', companyError?.message);
    return;
  }

  const companyId = companies.id;
  console.log('✅ Using company_id:', companyId);

  // Get a user
  const { data: users, error: userError } = await supabase
    .from('company_users')
    .select('user_id')
    .eq('company_id', companyId)
    .limit(1)
    .single();

  const userId = users?.user_id || companyId; // Fallback
  console.log('✅ Using user_id:', userId);

  // Try to create a project with trigger enabled
  console.log('\n📝 Creating test project...');

  const projectData = {
    company_id: companyId,
    name: 'TEST_PROJECT_DELETE_ME_' + Date.now(),
    client_name: 'Test Client',
    address: '123 Test St',
    project_type: 'residential',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
    created_by: userId,
  };

  console.log('Project data:', JSON.stringify(projectData, null, 2));

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (projectError) {
    console.log('\n❌ ERROR creating project:');
    console.log('   Message:', projectError.message);
    console.log('   Details:', projectError.details);
    console.log('   Hint:', projectError.hint);
    console.log('   Code:', projectError.code);

    // Check if error mentions "phases"
    if (projectError.message.includes('phases')) {
      console.log('\n🔍 Error mentions "phases" - checking table structure...');

      // Check what phase-related tables exist
      const { data: tables } = await supabase.rpc('exec_sql', {
        query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%phase%';`
      });

      console.log('Phase tables:', tables);
    }
  } else {
    console.log('\n✅ Project created successfully!');
    console.log('   Project ID:', project.id);

    // Check if phases were created
    const { data: phases, error: phasesError } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', project.id);

    if (phasesError) {
      console.log('❌ Error fetching phases:', phasesError.message);
    } else {
      console.log(`✅ Phases created: ${phases?.length || 0}`);
      phases?.forEach(p => console.log(`   - ${p.name} (status: ${p.status})`));
    }

    // Clean up
    console.log('\n🧹 Cleaning up test project...');
    await supabase.from('projects').delete().eq('id', project.id);
    console.log('✅ Test project deleted');
  }
}

testProjectCreation().catch(console.error);
