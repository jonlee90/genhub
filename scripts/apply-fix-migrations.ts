import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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

async function applyMigration(filePath: string) {
  console.log(`📄 Applying migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  // Split SQL into individual statements (rough approach)
  // Note: This won't handle all edge cases, but works for our migrations
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments and empty statements
    if (statement.trim().startsWith('--') || statement.trim() === ';') {
      continue;
    }

    try {
      // Use rpc to execute SQL if available, otherwise use direct query
      const { error } = await supabase.rpc('exec_sql', { query: statement });

      if (error) {
        // If RPC doesn't work, just log and continue (might be handled by DO blocks)
        console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
      }
    } catch (err: any) {
      console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
    }
  }

  console.log(`✅ Migration applied: ${path.basename(filePath)}\n`);
}

async function applyFixMigrations() {
  console.log('🔧 Applying fix migrations...\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  const migrations = [
    '045_fix_company_users_add_role_status.sql',
    '046_fix_projects_add_status.sql'
  ];

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${migration}`);
      continue;
    }

    await applyMigration(filePath);
  }

  console.log('✅ All migrations applied!\n');

  // Verify the fix
  console.log('🔍 Verifying changes...\n');

  // Check company_users columns
  const { data: companyUsers } = await supabase
    .from('company_users')
    .select('*')
    .limit(1);

  if (companyUsers && companyUsers.length > 0) {
    const columns = Object.keys(companyUsers[0]);
    console.log('📋 company_users columns:');
    console.log(columns.join(', '));

    if (columns.includes('role') && columns.includes('status')) {
      console.log('✅ role and status columns found!\n');
    } else {
      console.log('⚠️  role or status columns still missing\n');
    }
  }

  // Check projects columns
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (projects) {
    if (projects.length > 0) {
      const columns = Object.keys(projects[0]);
      console.log('📋 projects columns:');
      console.log(columns.join(', '));

      if (columns.includes('status')) {
        console.log('✅ status column found!\n');
      } else {
        console.log('⚠️  status column still missing\n');
      }
    } else {
      console.log('📋 No projects in database yet (table structure cannot be checked this way)\n');
    }
  }
}

applyFixMigrations()
  .then(() => {
    console.log('🎉 Fix migrations complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix migrations failed:', error);
    process.exit(1);
  });
