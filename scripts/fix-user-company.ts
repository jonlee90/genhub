import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserCompany() {
  console.log('🔍 Checking database state...\n');

  // 1. Check users
  const { data: users, error: usersError } = await supabase
    .schema('next_auth')
    .from('users')
    .select('id, email, name')
    .limit(5);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log('📋 Users in system:');
  console.table(users);

  // 2. Check companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, created_at')
    .limit(5);

  if (companiesError) {
    console.error('❌ Error fetching companies:', companiesError);
    return;
  }

  console.log('\n🏢 Companies in system:');
  console.table(companies);

  // 3. Check company_users associations
  const { data: companyUsers, error: companyUsersError } = await supabase
    .from('company_users')
    .select('*')
    .limit(5);

  if (companyUsersError) {
    console.log('\n⚠️  Error fetching company_users:', companyUsersError.message);
    console.log('This likely means the table structure is different or doesn\'t exist yet.');
  } else {
    console.log('\n🔗 Company-User associations:');
    console.table(companyUsers);
  }

  // 4. Find users without companies
  const userIds = users?.map(u => u.id) || [];
  const associatedUserIds = (companyUsers || []).map((cu: any) => cu.user_id) || [];
  const usersWithoutCompany = users?.filter(u => !associatedUserIds.includes(u.id)) || [];

  if (usersWithoutCompany.length === 0) {
    console.log('\n✅ All users have companies assigned!');
    return;
  }

  console.log('\n⚠️  Users without companies:');
  console.table(usersWithoutCompany);

  // 5. Create company and associations for users without companies
  for (const user of usersWithoutCompany) {
    console.log(`\n🔧 Creating company for user: ${user.email}`);

    // Create company
    const { data: newCompany, error: createCompanyError } = await supabase
      .from('companies')
      .insert({
        name: `${user.name || user.email}'s Company`,
        status: 'active'
      })
      .select()
      .single();

    if (createCompanyError) {
      console.error(`❌ Error creating company for ${user.email}:`, createCompanyError);
      continue;
    }

    console.log(`✅ Company created: ${newCompany.name} (ID: ${newCompany.id})`);

    // Link user to company
    const { data: newAssociation, error: createAssociationError } = await supabase
      .from('company_users')
      .insert({
        user_id: user.id,
        company_id: newCompany.id,
        role: 'gc_admin',
        status: 'active'
      })
      .select()
      .single();

    if (createAssociationError) {
      console.error(`❌ Error linking user to company:`, createAssociationError);
      continue;
    }

    console.log(`✅ User linked to company as GC Admin`);
  }

  // 6. Verify fix
  console.log('\n🔍 Verifying fix...\n');

  const { data: updatedCompanyUsers, error: verifyError } = await supabase
    .from('company_users')
    .select('user_id, company_id, role, status')
    .in('user_id', userIds);

  if (verifyError) {
    console.error('❌ Error verifying fix:', verifyError);
    return;
  }

  console.log('✅ Updated company-user associations:');
  console.table(updatedCompanyUsers);

  console.log('\n✅ Fix complete! All users now have active companies.');
}

fixUserCompany()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
