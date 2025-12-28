#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'next_auth' }
});

console.log('Checking NextAuth tables...\n');

// Check users table
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('*');

console.log('next_auth.users:');
if (usersError) {
  console.log('  Error:', usersError.message);
} else {
  console.log(`  Found ${users?.length || 0} users`);
  if (users && users.length > 0) {
    users.forEach(u => {
      console.log(`    - ${u.email} (ID: ${u.id})`);
    });
  }
}

// Check accounts table
const { data: accounts, error: accountsError } = await supabase
  .from('accounts')
  .select('*');

console.log('\nnext_auth.accounts:');
if (accountsError) {
  console.log('  Error:', accountsError.message);
} else {
  console.log(`  Found ${accounts?.length || 0} accounts`);
  if (accounts && accounts.length > 0) {
    accounts.forEach(a => {
      console.log(`    - Provider: ${a.provider}, User: ${a.userId}`);
    });
  }
}

// Check sessions table
const { data: sessions, error: sessionsError } = await supabase
  .from('sessions')
  .select('*');

console.log('\nnext_auth.sessions:');
if (sessionsError) {
  console.log('  Error:', sessionsError.message);
} else {
  console.log(`  Found ${sessions?.length || 0} sessions`);
}
