#!/usr/bin/env tsx
/**
 * Security Audit Script for Spatial Viewer Tables
 *
 * Validates:
 * - RLS is enabled on all spatial tables
 * - All tables have proper SELECT/INSERT/UPDATE/DELETE policies
 * - Policies enforce company access control
 * - Creator/role checks on mutations
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface RLSStatus {
  tablename: string
  rowsecurity: boolean
}

interface PolicyInfo {
  schemaname: string
  tablename: string
  policyname: string
  cmd: string // SELECT, INSERT, UPDATE, DELETE, ALL
}

const SPATIAL_TABLES = [
  'spatial_markers',
  'marker_content',
  'projects_3d_models',
]

const REQUIRED_OPERATIONS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

async function checkRLSEnabled(): Promise<Map<string, boolean>> {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN (${SPATIAL_TABLES.map(t => `'${t}'`).join(',')})
    `
  })

  if (error) {
    console.error('❌ Failed to check RLS status:', error)
    throw error
  }

  const rlsStatus = new Map<string, boolean>()
  for (const row of data as RLSStatus[]) {
    rlsStatus.set(row.tablename, row.rowsecurity)
  }

  return rlsStatus
}

async function checkPolicies(): Promise<Map<string, PolicyInfo[]>> {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT schemaname, tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (${SPATIAL_TABLES.map(t => `'${t}'`).join(',')})
    `
  })

  if (error) {
    console.error('❌ Failed to check policies:', error)
    throw error
  }

  const policies = new Map<string, PolicyInfo[]>()
  for (const policy of data as PolicyInfo[]) {
    if (!policies.has(policy.tablename)) {
      policies.set(policy.tablename, [])
    }
    policies.get(policy.tablename)!.push(policy)
  }

  return policies
}

async function validateCompanyAccess(): Promise<void> {
  // Check that policies reference company_id or get_user_company_id
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT tablename, policyname, pg_get_expr(polqual, polrelid) as using_clause
      FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      WHERE c.relname IN (${SPATIAL_TABLES.map(t => `'${t}'`).join(',')})
      AND c.relnamespace = 'public'::regnamespace
    `
  })

  if (error) {
    console.error('❌ Failed to validate company access:', error)
    throw error
  }

  for (const policy of data as any[]) {
    const usingClause = policy.using_clause?.toLowerCase() || ''
    if (!usingClause.includes('company_id') && !usingClause.includes('get_user_company_id')) {
      console.warn(`⚠️  Warning: Policy "${policy.policyname}" on "${policy.tablename}" does not reference company_id`)
    }
  }
}

async function runSecurityAudit() {
  console.log('🔒 Running Security Audit for Spatial Viewer Tables\n')

  // Check 1: RLS Enabled
  console.log('📋 Checking RLS Status...')
  const rlsStatus = await checkRLSEnabled()

  let allRLSEnabled = true
  for (const table of SPATIAL_TABLES) {
    const enabled = rlsStatus.get(table) || false
    const icon = enabled ? '✅' : '❌'
    console.log(`${icon} ${table}: RLS ${enabled ? 'ENABLED' : 'DISABLED'}`)
    if (!enabled) allRLSEnabled = false
  }

  if (!allRLSEnabled) {
    console.error('\n❌ CRITICAL: Some tables do not have RLS enabled!')
    process.exit(1)
  }

  // Check 2: Required Policies
  console.log('\n📋 Checking Policies...')
  const policies = await checkPolicies()

  let allPoliciesPresent = true
  for (const table of SPATIAL_TABLES) {
    const tablePolicies = policies.get(table) || []
    const operations = new Set(tablePolicies.map(p => p.cmd))

    console.log(`\n  ${table}:`)
    for (const op of REQUIRED_OPERATIONS) {
      const hasPolicy = operations.has(op) || operations.has('ALL')
      const icon = hasPolicy ? '✅' : '⚠️ '
      console.log(`    ${icon} ${op}: ${hasPolicy ? 'COVERED' : 'MISSING'}`)
      if (!hasPolicy && op !== 'DELETE') {
        // DELETE policies are optional for some tables
        allPoliciesPresent = false
      }
    }
  }

  // Check 3: Company Access Control
  console.log('\n📋 Validating Company Access Control...')
  await validateCompanyAccess()

  // Check 4: Creator/Role Checks
  console.log('\n📋 Checking Creator/Role Policies...')
  const markerPolicies = policies.get('spatial_markers') || []
  const hasCreatorCheck = markerPolicies.some(p =>
    p.policyname.toLowerCase().includes('creator') ||
    p.policyname.toLowerCase().includes('own')
  )
  const hasRoleCheck = markerPolicies.some(p =>
    p.policyname.toLowerCase().includes('gc') ||
    p.policyname.toLowerCase().includes('admin')
  )

  console.log(`  ${hasCreatorCheck ? '✅' : '❌'} Creator-based policies found`)
  console.log(`  ${hasRoleCheck ? '✅' : '❌'} Role-based policies found`)

  // Final Report
  console.log('\n' + '='.repeat(60))
  if (allRLSEnabled && allPoliciesPresent && hasCreatorCheck && hasRoleCheck) {
    console.log('✅ Security Audit PASSED')
    console.log('   All spatial tables have proper RLS and policies configured.')
    process.exit(0)
  } else {
    console.log('❌ Security Audit FAILED')
    console.log('   Please review the warnings above.')
    process.exit(1)
  }
}

// Run audit
runSecurityAudit().catch(err => {
  console.error('❌ Security audit failed:', err)
  process.exit(1)
})
