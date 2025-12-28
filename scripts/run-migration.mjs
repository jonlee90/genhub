import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PostgreSQL connection string from Supabase
// Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const connectionString = 'postgresql://postgres.fozwbpqgkcduwxqvmkjd:lrmxVzMhj3VlBjAsGmikf%2B4hD5UIcGz7cvAsR475P52x4U%2F%2BttZCDWcy22nTJPLJdYTQEH%2BmXOZaUCABP0QkSA%3D%3D@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('\nReading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '__consolidated_migration.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    console.log(`Migration size: ${(sql.length / 1024).toFixed(2)} KB`);

    console.log('\nExecuting migration...');
    await client.query(sql);

    console.log('✅ Migration executed successfully!');
    console.log('\n🎉 All database tables and policies have been created!');
    console.log('You can now sign in with Google OAuth.');

  } catch (err) {
    console.error('❌ Error running migration:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
