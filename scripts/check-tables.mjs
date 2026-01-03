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

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  // Check if tables exist
  const tablesToCheck = ['phases', 'project_phases', 'tasks', 'phase_templates', 'task_templates', 'projects'];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table "${table}" - ERROR: ${error.message}`);
      } else {
        console.log(`✅ Table "${table}" exists`);
      }
    } catch (err) {
      console.log(`❌ Table "${table}" - ERROR: ${err.message}`);
    }
  }

  // Check for the trigger and function
  console.log('\n🔍 Checking trigger and function...\n');

  try {
    const { data: triggerData, error: triggerError } = await supabase.rpc('sql', {
      query: `
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'create_phases_and_tasks_on_project_insert'
          AND tgrelid = 'public.projects'::regclass
        ) as trigger_exists;
      `
    });

    console.log('Trigger check result:', triggerData);
  } catch (err) {
    console.log('Trigger check error:', err.message);
  }

  try {
    const { data: funcData, error: funcError } = await supabase.rpc('sql', {
      query: `
        SELECT EXISTS (
          SELECT 1 FROM pg_proc
          WHERE proname = 'create_phases_and_tasks_from_templates'
          AND pronamespace = 'public'::regnamespace
        ) as function_exists;
      `
    });

    console.log('Function check result:', funcData);
  } catch (err) {
    console.log('Function check error:', err.message);
  }
}

checkTables().catch(console.error);
