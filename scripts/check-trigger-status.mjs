#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract connection details from Supabase URL
// Typical format: https://abcdef.supabase.co
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];

console.log('🔍 Checking trigger and function status...\n');
console.log('Project ref:', projectRef);
console.log('Supabase URL:', supabaseUrl);

// Use Supabase SQL Editor API or direct connection
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  // Check if migrations table exists and what was run
  console.log('\n📊 Checking migration history...');

  try {
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('migration_name, finished_at')
      .order('finished_at', { ascending: false })
      .limit(10);

    if (error && !error.message.includes('does not exist')) {
      console.log('Note: _prisma_migrations check:', error.message);
    } else if (data) {
      console.log('Recent migrations:', data);
    }
  } catch (e) {
    // Ignore
  }

  // Try to query pg_trigger and pg_proc using a raw query approach
  console.log('\n🔍 Checking for trigger...');

  // Method 1: Try to select from projects to see if trigger fires
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .limit(1)
    .single();

  if (company) {
    // Create a test project and immediately delete it, watching for errors
    const testData = {
      company_id: company.id,
      name: `TRIGGER_TEST_${Date.now()}`,
      client_name: 'Test',
      address: 'Test',
      project_type: 'residential',
      start_date: '2026-01-03',
      status: 'active',
    };

    console.log('\n🧪 Creating test project to check trigger...');

    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert(testData)
      .select('id')
      .single();

    if (createError) {
      console.log('❌ Error during project creation:', createError.message);

      // Check if it's a phases-related error
      if (createError.message.toLowerCase().includes('phases')) {
        console.log('\n⚠️  FOUND THE ISSUE: Trigger references non-existent table');
        console.log('   Error message:', createError.message);
      }
    } else if (project) {
      console.log('✅ Test project created:', project.id);

      // Check for phases
      const { data: phases } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', project.id);

      if (phases && phases.length > 0) {
        console.log(`✅ Trigger worked! Created ${phases.length} phases`);
      } else {
        console.log('⚠️  Trigger did NOT create phases (trigger may not exist or failed silently)');

        // Check trigger exists
        console.log('\n🔍 Checking if trigger is registered in database...');

        // Use a stored procedure if available, or check via Supabase API
        // For now, we'll infer from behavior
      }

      // Clean up
      await supabase.from('projects').delete().eq('id', project.id);
      console.log('🧹 Test project deleted');
    }
  }

  console.log('\n📋 Summary:');
  console.log('   If phases were NOT created, you need to apply migration 045');
  console.log('   Migration file: supabase/migrations/045_auto_create_phases_tasks_from_templates.sql');
}

checkDatabase().catch(console.error);
