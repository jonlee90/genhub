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

async function diagnoseProjectCreation() {
  console.log('🔍 Diagnosing Project Creation Issue...\n');

  // Get the first user (the one trying to create a project)
  const { data: users } = await supabase
    .schema('next_auth')
    .from('users')
    .select('id, email, name')
    .limit(1);

  if (!users || users.length === 0) {
    console.error('❌ No users found!');
    return;
  }

  const user = users[0];
  console.log('👤 Testing with user:', user);

  // Check if user has a company
  const { data: companyUsers, error: companyUsersError } = await supabase
    .from('company_users')
    .select('*')
    .eq('user_id', user.id);

  if (companyUsersError) {
    console.error('❌ Error fetching company_users:', companyUsersError);
    return;
  }

  console.log('\n🔗 User company associations:');
  console.table(companyUsers);

  if (!companyUsers || companyUsers.length === 0) {
    console.log('\n⚠️  User has no company associations!');
    console.log('Creating company for user...');

    // Create a company
    const { data: newCompany, error: createCompanyError } = await supabase
      .from('companies')
      .insert({
        name: `${user.name || user.email}'s Company`,
        status: 'active'
      })
      .select()
      .single();

    if (createCompanyError) {
      console.error('❌ Error creating company:', createCompanyError);
      return;
    }

    console.log('✅ Company created:', newCompany);

    // Link user to company
    const { data: newAssociation, error: createAssociationError } = await supabase
      .from('company_users')
      .insert({
        user_id: user.id,
        company_id: newCompany.id,
        activated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createAssociationError) {
      console.error('❌ Error linking user to company:', createAssociationError);
      return;
    }

    console.log('✅ User linked to company:', newAssociation);
  } else {
    console.log('\n✅ User has company associations');

    // Check the helper function
    console.log('\n🔧 Testing get_user_company_id function...');

    const { data: companyId, error: functionError } = await supabase.rpc('get_user_company_id', {
      p_user_id: user.id
    });

    if (functionError) {
      console.error('❌ Error calling get_user_company_id:', functionError);
      console.log('\nThis function may not exist. Let me check the projects query directly...');

      // Try to create a project directly
      console.log('\n🔧 Attempting to create a test project...');

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: 'Test Project',
          company_id: companyUsers[0].company_id,
          status: 'planning'
        })
        .select()
        .single();

      if (projectError) {
        console.error('❌ Error creating project:', projectError);
      } else {
        console.log('✅ Project created successfully:', project);

        // Clean up test project
        await supabase.from('projects').delete().eq('id', project.id);
        console.log('✅ Test project cleaned up');
      }
    } else {
      console.log('✅ get_user_company_id returned:', companyId);

      if (!companyId) {
        console.log('\n⚠️  Function returned null! This is the issue.');
        console.log('The function likely checks for an "active" status or role.');
        console.log('\nCurrent company_user record:');
        console.table(companyUsers[0]);

        // Check if we need to add role/status columns
        const columns = Object.keys(companyUsers[0]);
        console.log('\n📋 Available columns in company_users:');
        console.log(columns.join(', '));

        if (!columns.includes('role') || !columns.includes('status')) {
          console.log('\n❌ Missing role/status columns!');
          console.log('The table structure doesn\'t match the migration files.');
          console.log('You may need to run the migrations again.');
        }
      }
    }
  }
}

diagnoseProjectCreation()
  .then(() => {
    console.log('\n🎉 Diagnosis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnosis failed:', error);
    process.exit(1);
  });
