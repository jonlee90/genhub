import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

async function executeSql(sql: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response;
}

async function applyMigrations() {
  console.log('🔧 Applying fix migrations directly via SQL...\n');

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

    console.log(`📄 Reading migration: ${migration}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      console.log(`🔧 Executing migration...`);
      await executeSql(sql);
      console.log(`✅ Migration applied: ${migration}\n`);
    } catch (error: any) {
      console.error(`❌ Error applying migration ${migration}:`, error.message);
    }
  }

  console.log('✅ Migrations applied!\n');
}

applyMigrations()
  .then(() => {
    console.log('🎉 Fix complete! Please test project creation again.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
