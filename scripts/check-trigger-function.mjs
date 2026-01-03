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

async function checkTriggerFunction() {
  console.log('🔍 Checking trigger function source code...\n');

  // Get the actual function source code from the database
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = 'create_phases_and_tasks_from_templates';
    `
  }).single();

  if (error) {
    console.log('❌ Error fetching function:', error.message);

    // Try alternative method
    console.log('\n🔄 Trying alternative method...\n');

    try {
      // Create a test project to see the actual error
      const { data: testProject, error: testError } = await supabase
        .from('projects')
        .insert({
          name: 'TEST_PROJECT_DELETE_ME',
          status: 'active',
          project_type: 'residential'
        })
        .select()
        .single();

      if (testError) {
        console.log('❌ Error creating test project:');
        console.log('   Message:', testError.message);
        console.log('   Details:', testError.details);
        console.log('   Hint:', testError.hint);
        console.log('   Code:', testError.code);
      } else {
        console.log('✅ Test project created successfully:', testProject.id);

        // Delete the test project
        await supabase.from('projects').delete().eq('id', testProject.id);
        console.log('✅ Test project deleted');
      }
    } catch (err) {
      console.log('❌ Caught error:', err.message);
    }
  } else {
    console.log('✅ Function found. Definition:');
    console.log(data.function_definition);
  }
}

checkTriggerFunction().catch(console.error);
