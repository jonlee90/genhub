/**
 * Reset and Seed Projects Script
 *
 * This script will:
 * 1. Delete all existing projects and related data
 * 2. Create 10 new realistic construction projects (2 per project type)
 * 3. Create phases and tasks for each project based on templates
 * 4. Link projects to default 3D models
 *
 * Usage:
 *   npx tsx scripts/reset-and-seed-projects.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY')
  process.exit(1)
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🚀 Starting data reset and seed...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'reset-and-seed-projects.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Loaded SQL script')
    console.log('⚠️  WARNING: This will DELETE ALL existing project data!\n')

    // Execute the SQL
    console.log('🔄 Executing SQL script...\n')

    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Error executing SQL:', error)
      process.exit(1)
    }

    console.log('\n✅ Data reset and seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log('   - Deleted all existing projects and related data')
    console.log('   - Created 10 new realistic projects:')
    console.log('     • 2 Residential projects')
    console.log('     • 2 Restaurant projects')
    console.log('     • 2 Cafe projects')
    console.log('     • 2 Commercial Office projects')
    console.log('     • 2 Industrial projects')
    console.log('   - Created phases and tasks from templates')
    console.log('   - Linked projects to default 3D models')
    console.log('\n🎉 All done!\n')

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

main()
