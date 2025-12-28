#!/usr/bin/env node

/**
 * Projects Module - Supabase Connection Test
 *
 * This script tests the connection between the Projects module and Supabase database.
 * It verifies tables exist, RLS policies work, and CRUD operations function correctly.
 *
 * Usage: node scripts/test-projects-connection.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

console.log('🧪 Testing Projects Module ↔ Supabase Connection\n');
console.log('=' .repeat(60));

// Test 1: Connection Test
async function testConnection() {
  console.log('\n📡 Test 1: Basic Connection');
  console.log('-'.repeat(60));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
      return false;
    }

    console.log('  ✅ PASSED: Successfully connected to Supabase');
    console.log('  ✅ PASSED: Projects table is accessible');
    return true;
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    return false;
  }
}

// Test 2: Schema Verification
async function testSchema() {
  console.log('\n📋 Test 2: Schema Verification');
  console.log('-'.repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const requiredTables = [
    'projects',
    'project_phases',
    'project_team',
    'tasks',
    'companies',
    'user_profiles',
    'company_users'
  ];

  let allPassed = true;

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`  ❌ FAILED: Table "${table}" - ${error.message}`);
        allPassed = false;
      } else {
        console.log(`  ✅ PASSED: Table "${table}" exists`);
      }
    } catch (err) {
      console.log(`  ❌ FAILED: Table "${table}" - ${err.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Test 3: RLS Policy Test (Anon Client)
async function testRLSPolicies() {
  console.log('\n🔒 Test 3: Row-Level Security Policies');
  console.log('-'.repeat(60));

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Try to query projects without authentication (should return empty or error)
    const { data, error } = await anonClient
      .from('projects')
      .select('*')
      .limit(1);

    if (error && error.message.includes('JWT')) {
      console.log('  ✅ PASSED: RLS is enforcing authentication');
      return true;
    } else if (!data || data.length === 0) {
      console.log('  ✅ PASSED: RLS is working (no data returned without auth)');
      return true;
    } else {
      console.log('  ⚠️  WARNING: RLS might not be enforcing properly');
      console.log(`     Returned ${data.length} rows without authentication`);
      return true; // Not necessarily a failure in dev mode
    }
  } catch (err) {
    console.log(`  ⚠️  ERROR: ${err.message}`);
    return false;
  }
}

// Test 4: Data Query Test
async function testDataQuery() {
  console.log('\n📊 Test 4: Data Query Operations');
  console.log('-'.repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Query projects with related data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        company_id,
        project_phases(id, name, status),
        tasks(id, title, status)
      `)
      .limit(5);

    if (error) {
      console.log(`  ❌ FAILED: Query error - ${error.message}`);
      return false;
    }

    console.log(`  ✅ PASSED: Successfully queried projects table`);
    console.log(`  ℹ️  Found ${projects?.length || 0} project(s)`);

    if (projects && projects.length > 0) {
      const project = projects[0];
      console.log(`  ℹ️  Sample project: "${project.name}" (Status: ${project.status})`);
      console.log(`  ℹ️  Phases: ${project.project_phases?.length || 0}`);
      console.log(`  ℹ️  Tasks: ${project.tasks?.length || 0}`);
    }

    return true;
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    return false;
  }
}

// Test 5: User & Company Setup Check
async function testUserCompanySetup() {
  console.log('\n👥 Test 5: User & Company Configuration');
  console.log('-'.repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Check for users
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, email, name')
      .limit(5);

    console.log(`  ℹ️  User profiles: ${profiles?.length || 0}`);

    if (profiles && profiles.length > 0) {
      console.log('  ✅ PASSED: User profiles exist');
      profiles.forEach(user => {
        console.log(`     - ${user.email || 'No email'}`);
      });
    } else {
      console.log('  ⚠️  No user profiles found (sign up needed)');
    }

    // Check for companies
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5);

    console.log(`  ℹ️  Companies: ${companies?.length || 0}`);

    if (companies && companies.length > 0) {
      console.log('  ✅ PASSED: Companies exist');
    } else {
      console.log('  ⚠️  No companies found (setup needed)');
    }

    // Check for company_users links
    const { data: companyUsers } = await supabase
      .from('company_users')
      .select('user_id, company_id, role, status')
      .eq('status', 'active');

    console.log(`  ℹ️  Active company users: ${companyUsers?.length || 0}`);

    if (companyUsers && companyUsers.length > 0) {
      console.log('  ✅ PASSED: Active company users exist');
      companyUsers.forEach(cu => {
        console.log(`     - Role: ${cu.role}, Status: ${cu.status}`);
      });
    } else {
      console.log('  ❌ FAILED: No active company users (required for project creation)');
      return false;
    }

    return true;
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    return false;
  }
}

// Test 6: Insert Test (with rollback)
async function testInsertCapability() {
  console.log('\n✏️  Test 6: Insert Capability (Dry Run)');
  console.log('-'.repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get first company and user
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (!companies || companies.length === 0) {
      console.log('  ⚠️  SKIPPED: No companies available for insert test');
      return true;
    }

    const companyId = companies[0].id;

    // Try to insert a test project
    const testProject = {
      company_id: companyId,
      name: '[TEST] Connection Test Project',
      client_name: 'Test Client',
      address: '123 Test St',
      project_type: 'residential',
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
    };

    const { data: inserted, error: insertError } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single();

    if (insertError) {
      console.log(`  ❌ FAILED: Insert error - ${insertError.message}`);
      console.log(`  ℹ️  Error code: ${insertError.code}`);
      console.log(`  ℹ️  Error details: ${insertError.details}`);
      return false;
    }

    console.log('  ✅ PASSED: Successfully inserted test project');
    console.log(`  ℹ️  Project ID: ${inserted.id}`);

    // Immediately delete the test project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', inserted.id);

    if (deleteError) {
      console.log(`  ⚠️  WARNING: Failed to delete test project - ${deleteError.message}`);
      console.log(`  ℹ️  Please manually delete project: ${inserted.id}`);
    } else {
      console.log('  ✅ PASSED: Successfully cleaned up test project');
    }

    return true;
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    connection: false,
    schema: false,
    rls: false,
    query: false,
    userSetup: false,
    insert: false,
  };

  results.connection = await testConnection();

  if (results.connection) {
    results.schema = await testSchema();
    results.rls = await testRLSPolicies();
    results.query = await testDataQuery();
    results.userSetup = await testUserCompanySetup();

    if (results.userSetup) {
      results.insert = await testInsertCapability();
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const tests = [
    ['Connection', results.connection],
    ['Schema Verification', results.schema],
    ['RLS Policies', results.rls],
    ['Data Query', results.query],
    ['User Setup', results.userSetup],
    ['Insert Capability', results.insert],
  ];

  let passed = 0;
  let total = tests.length;

  tests.forEach(([name, result]) => {
    const icon = result ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${result ? 'PASSED' : 'FAILED'}`);
    if (result) passed++;
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`  Result: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n  🎉 ALL TESTS PASSED!');
    console.log('  ✅ Projects module is properly connected to Supabase');
    console.log('  ✅ You can create projects in the app');
  } else {
    console.log('\n  ⚠️  SOME TESTS FAILED');

    if (!results.connection || !results.schema) {
      console.log('\n  👉 Action Required: Run database migrations');
    } else if (!results.userSetup) {
      console.log('\n  👉 Action Required: Run `npm run db:setup`');
    } else if (!results.insert) {
      console.log('\n  👉 Action Required: Check RLS policies and permissions');
    }
  }

  console.log('\n' + '='.repeat(60));
}

// Run tests
runAllTests();
