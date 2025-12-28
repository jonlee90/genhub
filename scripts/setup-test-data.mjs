#!/usr/bin/env node

/**
 * Test Data Setup Script
 *
 * This script creates a test company and links your user to it.
 * Run this AFTER running database migrations.
 *
 * Usage: node scripts/setup-test-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Create a separate client for next_auth schema
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'next_auth' }
});

console.log('🚀 GenHub Test Data Setup\n');
console.log('=' .repeat(50));

async function setupTestData() {
  try {
    // 1. Get the first user - try user_profiles first (more reliable)
    console.log('\n1️⃣ Finding your user account...');

    let user = null;

    // Try user_profiles first
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, name')
      .limit(1);

    if (profiles && profiles.length > 0) {
      user = profiles[0];
      console.log(`✅ Found user: ${user.email} (${user.name || 'No name'})`);
      console.log(`   User ID: ${user.id}`);
    } else {
      // Fallback to next_auth.users
      console.log('  ℹ️  No user_profiles found, checking next_auth.users...');
      const { data: users, error: userError } = await supabaseAuth
        .from('users')
        .select('id, email, name')
        .limit(1);

      if (userError || !users || users.length === 0) {
        console.log('❌ No users found in database!');
        console.log('👉 You need to sign up first through the app');
        console.log('   1. Go to http://localhost:3000');
        console.log('   2. Click "Sign Up" or "Register"');
        console.log('   3. Create your account');
        console.log('   4. Run this script again');
        return false;
      }

      user = users[0];
      console.log(`✅ Found user: ${user.email} (${user.name || 'No name'})`);
      console.log(`   User ID: ${user.id}`);
    }

    // 2. Check if user profile exists
    console.log('\n2️⃣ Checking user profile...');
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      console.log('📝 Creating user profile...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: user.name || 'Test User',
          email: user.email || 'test@example.com'
        });

      if (profileError) {
        console.log(`❌ Error creating user profile: ${profileError.message}`);
        return false;
      }
      console.log('✅ User profile created');
    } else {
      console.log('✅ User profile already exists');
    }

    // 3. Check if company exists
    console.log('\n3️⃣ Checking for test company...');
    const TEST_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', TEST_COMPANY_ID)
      .single();

    let companyId = TEST_COMPANY_ID;

    if (!existingCompany) {
      console.log('📝 Creating test company...');
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          id: TEST_COMPANY_ID,
          name: 'GenHub Test Company',
          email: 'admin@genhub.test',
          phone: '555-0100'
        })
        .select()
        .single();

      if (companyError) {
        console.log(`❌ Error creating company: ${companyError.message}`);
        return false;
      }

      companyId = newCompany.id;
      console.log(`✅ Test company created (ID: ${companyId})`);
    } else {
      console.log(`✅ Test company already exists: ${existingCompany.name}`);
    }

    // 4. Check if user is linked to company
    console.log('\n4️⃣ Linking user to company...');
    const { data: existingLink } = await supabase
      .from('company_users')
      .select('id, role, status')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (!existingLink) {
      console.log('📝 Creating company_users link...');
      const { error: linkError } = await supabase
        .from('company_users')
        .insert({
          company_id: companyId,
          user_id: user.id,
          role: 'gc_admin',
          status: 'active',
          activated_at: new Date().toISOString()
        });

      if (linkError) {
        console.log(`❌ Error linking user to company: ${linkError.message}`);
        return false;
      }
      console.log('✅ User linked to company as GC Admin');
    } else {
      console.log(`✅ User already linked (Role: ${existingLink.role}, Status: ${existingLink.status})`);

      // Update to gc_admin if needed
      if (existingLink.role !== 'gc_admin' || existingLink.status !== 'active') {
        console.log('📝 Updating to GC Admin with active status...');
        const { error: updateError } = await supabase
          .from('company_users')
          .update({
            role: 'gc_admin',
            status: 'active',
            activated_at: new Date().toISOString()
          })
          .eq('id', existingLink.id);

        if (updateError) {
          console.log(`⚠️  Error updating: ${updateError.message}`);
        } else {
          console.log('✅ Updated to GC Admin');
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 Test data setup complete!');
    console.log('\n📋 Summary:');
    console.log(`   User: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Company: GenHub Test Company`);
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Role: GC Admin`);
    console.log(`   Status: Active`);
    console.log('\n✅ You should now be able to create projects!');
    console.log('👉 Try creating a project in the app');

    return true;

  } catch (err) {
    console.error('\n❌ Setup failed:', err);
    return false;
  }
}

// Run setup
setupTestData();
