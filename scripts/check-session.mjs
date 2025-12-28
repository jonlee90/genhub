#!/usr/bin/env node

/**
 * Check NextAuth Session Token
 *
 * This script checks if the session has the required supabaseAccessToken
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

// Check if environment variables are set
console.log('🔍 Checking Environment Variables\n');
console.log('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SECRET_KEY:', SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_JWT_SECRET:', JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('AUTH_SECRET:', process.env.AUTH_SECRET ? '✅ Set' : '❌ Missing');
console.log('AUTH_GOOGLE_ID:', process.env.AUTH_GOOGLE_ID ? '✅ Set' : '❌ Missing');
console.log('AUTH_GOOGLE_SECRET:', process.env.AUTH_GOOGLE_SECRET ? '✅ Set' : '❌ Missing');

// Check NextAuth sessions
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'next_auth' }
});

console.log('\n🔍 Checking NextAuth Sessions\n');

const { data: sessions, error: sessionsError } = await supabaseAuth
  .from('sessions')
  .select('*')
  .order('expires', { ascending: false });

if (sessionsError) {
  console.log('❌ Error fetching sessions:', sessionsError.message);
} else {
  console.log(`Found ${sessions?.length || 0} session(s)\n`);

  if (sessions && sessions.length > 0) {
    sessions.forEach((session, i) => {
      console.log(`Session ${i + 1}:`);
      console.log(`  User ID: ${session.userId}`);
      console.log(`  Session Token: ${session.sessionToken.substring(0, 20)}...`);
      console.log(`  Expires: ${new Date(session.expires).toLocaleString()}`);
      console.log(`  Expired: ${new Date(session.expires) < new Date() ? '❌ Yes' : '✅ No'}`);
      console.log('');
    });
  }
}

// Check users in next_auth schema
console.log('🔍 Checking NextAuth Users\n');

const { data: users, error: usersError } = await supabaseAuth
  .from('users')
  .select('*');

if (usersError) {
  console.log('❌ Error fetching users:', usersError.message);
} else {
  console.log(`Found ${users?.length || 0} user(s)\n`);

  if (users && users.length > 0) {
    users.forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
      console.log('');
    });
  }
}

// Check accounts (OAuth connections)
console.log('🔍 Checking OAuth Accounts\n');

const { data: accounts, error: accountsError } = await supabaseAuth
  .from('accounts')
  .select('*');

if (accountsError) {
  console.log('❌ Error fetching accounts:', accountsError.message);
} else {
  console.log(`Found ${accounts?.length || 0} account(s)\n`);

  if (accounts && accounts.length > 0) {
    accounts.forEach(account => {
      console.log(`Provider: ${account.provider}`);
      console.log(`  User ID: ${account.userId}`);
      console.log(`  Provider Account ID: ${account.providerAccountId}`);
      console.log(`  Type: ${account.type}`);
      console.log('');
    });
  }
}

console.log('✅ Session check complete!\n');
console.log('📝 Note: The supabaseAccessToken is generated dynamically in the session callback.');
console.log('   It is NOT stored in the database - it\'s created when you access the session.');
console.log('   If you\'re being redirected, the session callback might not be running.');
