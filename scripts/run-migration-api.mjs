import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://fozwbpqgkcduwxqvmkjd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvendicHFna2NkdXd4cXZta2pkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkwNjg1NCwiZXhwIjoyMDgwNDgyODU0fQ.vnV9RaN4bw_hYTAMdEzFkMji-stisE_0rcwg9uZMumA';

async function executeSQLBatch(sqlStatements) {
  const results = [];

  for (let i = 0; i < sqlStatements.length; i++) {
    const stmt = sqlStatements[i].trim();
    if (!stmt || stmt.startsWith('--')) continue;

    console.log(`\nExecuting statement ${i + 1}/${sqlStatements.length}...`);
    console.log(`First 100 chars: ${stmt.substring(0, 100)}...`);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: stmt })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed: ${error}`);
        results.push({ success: false, error, statement: stmt.substring(0, 100) });
      } else {
        const result = await response.json();
        console.log(`✅ Success`);
        results.push({ success: true, result });
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      results.push({ success: false, error: err.message, statement: stmt.substring(0, 100) });
    }
  }

  return results;
}

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '__consolidated_migration.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log(`Migration size: ${(sql.length / 1024).toFixed(2)} KB`);

    // Split by semicolon but preserve multi-line statements
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    console.log(`Total statements: ${statements.length}`);

    console.log('\nExecuting migration in batches...');
    const results = await executeSQLBatch(statements);

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Results: ${succeeded} succeeded, ${failed} failed`);

    if (failed > 0) {
      console.log('\n❌ Some statements failed. Review errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('🎉 You can now sign in with Google OAuth.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();
