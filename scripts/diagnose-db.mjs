#!/usr/bin/env node

/**
 * Database Diagnostic Script
 *
 * This script checks if the database is properly set up for the GenHub application.
 * Run this to diagnose project creation issues.
 *
 * Usage: node scripts/diagnose-db.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check your .env.local file has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('  - SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Use service role key to bypass RLS for diagnostics
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔍 GenHub Database Diagnostics\n');
console.log('=' .repeat(50));

async function checkTables() {
  console.log('\n📊 Checking if tables exist...');

  const tables = [
    'companies',
    'user_profiles',
    'company_users',
    'projects',
    'project_phases',
    'project_team',
    'tasks'
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`  ❌ ${table} - NOT FOUND`);
          results.push({ table, exists: false });
        } else {
          console.log(`  ⚠️  ${table} - Error: ${error.message}`);
          results.push({ table, exists: false, error: error.message });
        }
      } else {
        console.log(`  ✅ ${table} - EXISTS`);
        results.push({ table, exists: true });
      }
    } catch (err) {
      console.log(`  ❌ ${table} - Error: ${err.message}`);
      results.push({ table, exists: false, error: err.message });
    }
  }

  const allExist = results.every(r => r.exists);

  if (!allExist) {
    console.log('\n❌ Some tables are missing!');
    console.log('\n📝 You need to run the database migrations:');
    console.log('  1. Open Supabase Dashboard → SQL Editor');
    console.log('  2. Run these migration files IN ORDER:');
    console.log('     - supabase/migrations/01_setup_and_auth.sql');
    console.log('     - supabase/migrations/02_enums.sql');
    console.log('     - supabase/migrations/03_tables.sql');
    console.log('     - supabase/migrations/04_rls_policies.sql');
    console.log('     - supabase/migrations/05_triggers.sql');
    return false;
  }

  return true;
}

async function checkAuthSetup() {
  console.log('\n🔐 Checking NextAuth setup...');

  try {
    // Query the next_auth schema directly using rpc or raw SQL
    const { data: users, error } = await supabase.rpc('get_auth_users', {});

    if (error) {
      // Fallback: Try using service role to query directly
      console.log('  ℹ️  Trying alternative method to check users...');

      // Since we're using service role key, try a different approach
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, name')
        .limit(5);

      if (profileError) {
        console.log(`  ❌ Cannot access user data: ${profileError.message}`);
        console.log('  ⚠️  This is OK - checking user_profiles instead');
      }

      if (profiles && profiles.length > 0) {
        console.log(`  ✅ Found ${profiles.length} user profile(s)`);
        console.log('\n  📋 Users in database:');
        profiles.forEach(user => {
          console.log(`     - ${user.email || 'No email'} (${user.name || 'No name'})`);
          console.log(`       ID: ${user.id}`);
        });
        return { hasUsers: true, users: profiles };
      } else {
        console.log('  ⚠️  No user profiles found');
        console.log('  📝 You need to sign up through the app first!');
        return { hasUsers: false, users: [] };
      }
    }

    console.log(`  ✅ next_auth.users - EXISTS (${users?.length || 0} users found)`);

    if (users && users.length > 0) {
      console.log('\n  📋 Users in database:');
      users.forEach(user => {
        console.log(`     - ${user.email} (ID: ${user.id})`);
      });
      return { hasUsers: true, users };
    }

    return { hasUsers: false, users: [] };
  } catch (err) {
    console.log(`  ❌ Error checking auth: ${err.message}`);
    return { hasUsers: false, users: [] };
  }
}

async function checkCompanyUsers() {
  console.log('\n🏢 Checking company_users setup...');

  try {
    const { data: companyUsers, error } = await supabase
      .from('company_users')
      .select('user_id, company_id, role, status')
      .eq('status', 'active');

    if (error) {
      console.log(`  ❌ company_users - Error: ${error.message}`);
      return false;
    }

    console.log(`  ✅ company_users - ${companyUsers?.length || 0} active members found`);

    if (!companyUsers || companyUsers.length === 0) {
      console.log('\n  ⚠️  No active company users found!');
      console.log('  📝 You need to create:');
      console.log('     1. A company record');
      console.log('     2. A company_users record linking your user to the company');
      console.log('     3. The user must have role: "gc_admin" or "project_manager"');
      console.log('     4. The user must have status: "active"');
      return false;
    }

    console.log('\n  📋 Active company users:');
    companyUsers.forEach(cu => {
      console.log(`     - User: ${cu.user_id} | Company: ${cu.company_id} | Role: ${cu.role}`);
    });

    const hasAdminOrPM = companyUsers.some(
      cu => cu.role === 'gc_admin' || cu.role === 'project_manager'
    );

    if (!hasAdminOrPM) {
      console.log('\n  ⚠️  No GC Admin or Project Manager found!');
      console.log('  📝 At least one user needs role "gc_admin" or "project_manager" to create projects');
      return false;
    }

    return true;
  } catch (err) {
    console.log(`  ❌ Error checking company users: ${err.message}`);
    return false;
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS policies on projects table...');

  try {
    // Query pg_policies to check if RLS policies exist
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT policyname, cmd, qual
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'projects'
        `
      });

    if (error) {
      // Fallback: Try to check if we can insert without RLS
      console.log('  ℹ️  Cannot query pg_policies (expected in some setups)');
      console.log('  ℹ️  RLS policies should be defined in 04_rls_policies.sql');
      return true;
    }

    if (data && data.length > 0) {
      console.log(`  ✅ Found ${data.length} RLS policies on projects table`);
      return true;
    } else {
      console.log('  ⚠️  No RLS policies found (this may be OK if migrations not run yet)');
      return true;
    }
  } catch (err) {
    console.log('  ℹ️  RLS check skipped (normal for Supabase setup)');
    return true;
  }
}

async function runDiagnostics() {
  try {
    const tablesOk = await checkTables();

    if (!tablesOk) {
      console.log('\n' + '='.repeat(50));
      console.log('\n❌ MIGRATIONS NOT RUN - Cannot proceed with other checks');
      console.log('\n👉 Next step: Run the database migrations first!');
      return;
    }

    const authResult = await checkAuthSetup();
    const companyUsersOk = await checkCompanyUsers();
    await checkRLSPolicies();

    console.log('\n' + '='.repeat(50));

    if (!authResult.hasUsers) {
      console.log('\n⚠️  No users found!');
      console.log('\n👉 Next step: Sign up through the app first');
      console.log('  1. Start your dev server: npm run dev');
      console.log('  2. Go to the sign-up page');
      console.log('  3. Create your account');
      console.log('  4. Run this diagnostic again');
      return;
    }

    if (companyUsersOk) {
      console.log('\n✅ Database setup looks good!');
      console.log('\n📝 If projects still won\'t save, check:');
      console.log('  1. Browser console for specific error messages');
      console.log('  2. Your authentication is working (you\'re logged in)');
      console.log('  3. The logged-in user has an active company_users record');
    } else {
      console.log('\n⚠️  Database setup incomplete');
      console.log('\n👉 Next step: Run the automated setup script');
      console.log('\n  npm run db:setup');
      console.log('\nThis will automatically:');
      console.log('  ✅ Create a test company');
      console.log('  ✅ Link your user to the company');
      console.log('  ✅ Set you as GC Admin');
      console.log('  ✅ Activate your account');
    }

  } catch (err) {
    console.error('\n❌ Diagnostic failed:', err);
  }
}

// Run diagnostics
runDiagnostics();
