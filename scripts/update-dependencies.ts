/**
 * GenHub Dependency Graph Updater
 *
 * Automatically maintains .claude/docs/dependencies.json by:
 * - Scanning codebase for actual sources
 * - Detecting missing entries
 * - Detecting stale entries
 * - Optionally updating the file
 *
 * Run with: npx tsx scripts/update-dependencies.ts [--fix] [--check-stale]
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, basename, dirname } from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment
config()

const DEPENDENCIES_PATH = '.claude/docs/dependencies.json'

// ============================================================================
// TYPES
// ============================================================================

interface DependencyEntry {
  type: string
  depends_on?: string[]
  affects: string[]
}

interface DependenciesJson {
  version: string
  description: string
  lastUpdated: string
  sources: Record<string, DependencyEntry>
  autoSync: Record<string, any>
  syncCommands: Record<string, any>
}

interface MissingEntry {
  key: string
  type: string
  depends_on?: string[]
  affects: string[]
  reason: string
}

interface StaleEntry {
  key: string
  reason: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = []

  function walk(currentDir: string) {
    try {
      const files = readdirSync(currentDir)
      for (const file of files) {
        const filePath = join(currentDir, file)
        const stat = statSync(filePath)
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          walk(filePath)
        } else if (pattern.test(file)) {
          results.push(filePath)
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  walk(dir)
  return results.sort()
}

function getDirectories(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map((dirent) => dirent.name)
  } catch {
    return []
  }
}

function normalizeKey(key: string): string {
  // Normalize Windows paths to Unix-style
  return key.replace(/\\/g, '/')
}

// ============================================================================
// INFERENCE RULES
// ============================================================================

function inferDependsOn(key: string, type: string): string[] | undefined {
  if (type === 'server_action') {
    // actions/tasks.ts → ["database/tasks"]
    // actions/project-files.ts → ["database/project_files"]
    const match = key.match(/actions\/(.+)\.ts$/)
    if (match) {
      const baseName = match[1]
      // Convert kebab-case to snake_case
      const tableName = baseName.replace(/-/g, '_')
      return [`database/${tableName}`]
    }
  }

  if (type === 'component') {
    // components/tasks/** → ["actions/tasks.ts"]
    const match = key.match(/components\/([^/]+)\//)
    if (match) {
      const dirName = match[1]
      return [`actions/${dirName}.ts`]
    }
  }

  return undefined
}

function inferAffects(key: string, type: string): string[] {
  const affects: string[] = []

  if (type === 'table') {
    affects.push('docs/indexes/tables.md')

    // Determine which SCHEMA file
    const tableName = key.replace('database/', '')
    if (tableName.includes('spatial_') || tableName.includes('marker_') || tableName.includes('3d_model') || tableName.includes('model_element')) {
      affects.push('docs/backend/SCHEMA_SPATIAL.md')
    } else {
      affects.push('docs/backend/SCHEMA_CORE.md')
    }

    // Check for domain docs
    const domainMap: Record<string, string> = {
      projects: 'PROJECTS',
      project_phases: 'PROJECTS',
      project_team: 'PROJECTS',
      project_files: 'PROJECTS',
      project_photos: 'PROJECTS',
      tasks: 'TASKS',
      task_assignees: 'TASKS',
      task_dependencies: 'TASKS',
      task_activity: 'TASKS',
      materials: 'MATERIALS',
      material_assignments: 'MATERIALS',
      tracked_materials: 'MATERIALS',
      material_price_history: 'MATERIALS',
      spatial_markers: 'SPATIAL',
      marker_content: 'SPATIAL',
      projects_3d_models: 'SPATIAL',
      model_elements: 'SPATIAL',
    }

    if (domainMap[tableName]) {
      affects.push(`docs/domain/${domainMap[tableName]}.md`)
    }
  }

  if (type === 'enum') {
    affects.push('docs/indexes/enums.md')
    affects.push('docs/backend/SCHEMA_ENUMS.md')
  }

  if (type === 'server_action') {
    affects.push('docs/indexes/actions.md')

    // Check if it's a domain action
    const match = key.match(/actions\/(.+)\.ts$/)
    if (match) {
      const baseName = match[1]
      const domainMap: Record<string, string> = {
        tasks: 'TASKS',
        projects: 'PROJECTS',
        materials: 'MATERIALS',
        spatial: 'SPATIAL',
      }
      if (domainMap[baseName]) {
        affects.push(`docs/domain/${domainMap[baseName]}.md`)
      }
    }
  }

  if (type === 'component') {
    affects.push('docs/indexes/components.md')
  }

  if (type === 'route') {
    affects.push('docs/indexes/routes.md')
  }

  return affects
}

// ============================================================================
// SCANNERS
// ============================================================================

async function scanTables(): Promise<string[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log('  ⚠️  Skipping table scan: SUPABASE env vars not found')
    return []
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all tables from public schema
    const { data, error } = await supabase
      .from('information_schema.tables' as never)
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error || !data) {
      console.log('  ⚠️  Could not fetch tables from Supabase')
      return []
    }

    return (data as any[]).map((row) => `database/${row.table_name}`)
  } catch (error) {
    console.log('  ⚠️  Error scanning tables:', error)
    return []
  }
}

function scanActions(): string[] {
  const actionFiles = getFiles('app/actions', /\.ts$/)
  return actionFiles.map((file) => `actions/${basename(file)}`)
}

function scanComponents(): string[] {
  const componentDirs = getDirectories('components')
  return componentDirs.map((dir) => `components/${dir}/**`)
}

function scanRoutes(): string[] {
  const pageFiles = getFiles('app/app', /page\.tsx$/)
  return pageFiles.map((file) => normalizeKey(file))
}

// ============================================================================
// ANALYSIS
// ============================================================================

function findMissingEntries(
  actualSources: string[],
  existingSources: Record<string, DependencyEntry>
): MissingEntry[] {
  const missing: MissingEntry[] = []

  for (const source of actualSources) {
    if (!existingSources[source]) {
      const type = determineType(source)
      const depends_on = inferDependsOn(source, type)
      const affects = inferAffects(source, type)

      missing.push({
        key: source,
        type,
        depends_on,
        affects,
        reason: 'Not in dependencies.json',
      })
    }
  }

  return missing
}

function findStaleEntries(
  existingSources: Record<string, DependencyEntry>,
  actualActions: string[],
  actualComponents: string[],
  actualRoutes: string[]
): StaleEntry[] {
  const stale: StaleEntry[] = []

  for (const [key, entry] of Object.entries(existingSources)) {
    // Skip database and enum entries (checked separately)
    if (entry.type === 'table' || entry.type === 'enum') {
      continue
    }

    // Skip wildcard patterns (these are meta-entries)
    if (key.includes('**') || key.includes('*')) {
      continue
    }

    // Check if action file exists
    if (entry.type === 'server_action') {
      if (!actualActions.includes(key)) {
        const filePath = `app/${key}`
        if (!existsSync(filePath)) {
          stale.push({
            key,
            reason: 'File no longer exists',
          })
        }
      }
    }

    // Check if component directory exists
    if (entry.type === 'component') {
      const match = key.match(/components\/([^/]+)\//)
      if (match) {
        const dirName = match[1]
        if (!actualComponents.some((c) => c.includes(dirName))) {
          const dirPath = `components/${dirName}`
          if (!existsSync(dirPath)) {
            stale.push({
              key,
              reason: 'Directory no longer exists',
            })
          }
        }
      }
    }

    // Check if route file exists
    if (entry.type === 'route') {
      if (!actualRoutes.includes(key)) {
        if (!existsSync(key)) {
          stale.push({
            key,
            reason: 'Route file no longer exists',
          })
        }
      }
    }
  }

  return stale
}

function determineType(source: string): string {
  if (source.startsWith('database/')) return 'table'
  if (source.startsWith('actions/')) return 'server_action'
  if (source.startsWith('components/')) return 'component'
  if (source.includes('page.tsx')) return 'route'
  return 'unknown'
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const checkStaleOnly = args.includes('--check-stale')

  console.log(`\nGenHub Dependency Graph Updater`)
  console.log(`================================`)
  console.log(`Mode: ${shouldFix ? 'FIX' : 'REPORT'}`)
  console.log('')

  // Load existing dependencies.json
  let dependencies: DependenciesJson
  try {
    const content = readFileSync(DEPENDENCIES_PATH, 'utf-8')
    dependencies = JSON.parse(content)
  } catch (error) {
    console.error('❌ Could not read dependencies.json')
    process.exit(1)
  }

  console.log('📊 Scanning codebase...')

  // Scan actual sources
  const actualTables = checkStaleOnly ? [] : await scanTables()
  const actualActions = scanActions()
  const actualComponents = scanComponents()
  const actualRoutes = scanRoutes()

  console.log(`  Found ${actualTables.length} tables`)
  console.log(`  Found ${actualActions.length} action files`)
  console.log(`  Found ${actualComponents.length} component directories`)
  console.log(`  Found ${actualRoutes.length} route pages`)
  console.log('')

  // Find missing entries
  let missing: MissingEntry[] = []
  if (!checkStaleOnly) {
    const allActual = [...actualTables, ...actualActions, ...actualComponents, ...actualRoutes]
    missing = findMissingEntries(allActual, dependencies.sources)
  }

  // Find stale entries
  const stale = findStaleEntries(
    dependencies.sources,
    actualActions,
    actualComponents,
    actualRoutes
  )

  // Report
  console.log('📋 Analysis Results')
  console.log('===================\n')

  if (missing.length > 0) {
    console.log(`🔍 Missing Entries (${missing.length}):\n`)
    for (const entry of missing) {
      console.log(`  • ${entry.key}`)
      console.log(`    Type: ${entry.type}`)
      if (entry.depends_on) {
        console.log(`    Depends on: ${entry.depends_on.join(', ')}`)
      }
      console.log(`    Affects: ${entry.affects.join(', ')}`)
      console.log('')
    }
  }

  if (stale.length > 0) {
    console.log(`⚠️  Stale Entries (${stale.length}):\n`)
    for (const entry of stale) {
      console.log(`  • ${entry.key}`)
      console.log(`    Reason: ${entry.reason}`)
      console.log('')
    }
  }

  if (missing.length === 0 && stale.length === 0) {
    console.log('✅ No issues found. Dependencies.json is up to date!\n')
    return
  }

  // Apply fixes if requested
  if (shouldFix) {
    console.log('🔧 Applying fixes...\n')

    // Add missing entries
    for (const entry of missing) {
      const newEntry: DependencyEntry = {
        type: entry.type,
        affects: entry.affects,
      }
      if (entry.depends_on) {
        newEntry.depends_on = entry.depends_on
      }
      dependencies.sources[entry.key] = newEntry
      console.log(`  ✓ Added ${entry.key}`)
    }

    // Remove stale entries
    for (const entry of stale) {
      delete dependencies.sources[entry.key]
      console.log(`  ✓ Removed ${entry.key}`)
    }

    // Update timestamp
    dependencies.lastUpdated = new Date().toISOString().split('T')[0]

    // Write back
    writeFileSync(DEPENDENCIES_PATH, JSON.stringify(dependencies, null, 2) + '\n')
    console.log('')
    console.log('✅ Dependencies.json updated successfully!\n')
  } else {
    console.log('💡 Run with --fix to automatically update dependencies.json\n')
    if (stale.length > 0) {
      process.exit(1) // Exit with error if stale entries found
    }
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
