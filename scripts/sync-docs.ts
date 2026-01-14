/**
 * GenHub Documentation Sync
 *
 * Synchronizes documentation with codebase changes by:
 * - Loading the dependency graph from .claude/docs/dependencies.json
 * - Finding all affected docs for changed sources
 * - Regenerating documentation content
 * - Writing changes and reporting results
 *
 * Run with: npx tsx scripts/sync-docs.ts [--source=path/to/source] [--changed-files] [--write]
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, basename, dirname, relative } from 'path'
import { execSync } from 'child_process'
import { config } from 'dotenv'

// Load environment
config()

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

interface SyncResult {
  file: string
  status: 'updated' | 'no-change' | 'flagged' | 'error'
  reason?: string
  message?: string
}

interface ComponentInfo {
  name: string
  type: 'Client' | 'Server'
  props: number | string
  path: string
}

interface ActionInfo {
  name: string
  purpose: string
  revalidates: string
}

interface RouteInfo {
  route: string
  type: 'Client' | 'Server'
  layout: boolean | string
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

function getGitChangedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8' })
    return output.split('\n').filter((f) => f.length > 0)
  } catch {
    return []
  }
}

function normalizeKey(key: string): string {
  return key.replace(/\\/g, '/')
}

// ============================================================================
// CONTENT GENERATORS
// ============================================================================

async function generateTablesIndex(): Promise<string> {
  try {
    // Try to fetch tables from Supabase via CLI
    const output = execSync('npx supabase db list --json 2>/dev/null || echo "[]"', {
      encoding: 'utf-8',
    })

    let tables: Array<{ name: string; columns?: number }> = []
    try {
      tables = JSON.parse(output)
    } catch {
      // Fallback to empty list if JSON parse fails
      tables = []
    }

    // If no tables from CLI, try to read from existing index
    if (tables.length === 0) {
      try {
        const existing = readFileSync('.claude/docs/indexes/tables.md', 'utf-8')
        // If it exists and is recent, return it
        if (existing.includes('Last updated')) {
          return existing
        }
      } catch {
        // No existing file
      }
    }

    // Generate markdown
    let md = '# GenHub Database Tables Index\n\n'
    md += '> Auto-generated. Do not edit manually.\n\n'
    md += `Last updated: ${new Date().toISOString().split('T')[0]}\n\n`
    md += '---\n\n'
    md += '## Tables\n\n'

    if (tables.length > 0) {
      md += '| Table | Columns | Purpose |\n'
      md += '|-------|---------|----------|\n'
      for (const table of tables) {
        md += `| ${table.name} | ${table.columns || '-'} | - |\n`
      }
    } else {
      md += '> Supabase tables not available. Connect to Supabase to regenerate.\n'
    }

    md += '\n'
    return md
  } catch {
    return '⚠️ Tables index requires Supabase connection to regenerate'
  }
}

function generateComponentsIndex(): string {
  const componentDirs = getDirectories('components')
  const componentsMap: Record<string, ComponentInfo[]> = {}

  // Group components by directory
  for (const dir of componentDirs) {
    const dirPath = join('components', dir)
    const files = getFiles(dirPath, /\.tsx$/)

    if (files.length > 0) {
      componentsMap[dir] = files.map((file) => ({
        name: basename(file, '.tsx'),
        type: 'Client',
        props: '-',
        path: relative('components', file),
      }))
    }
  }

  // Generate markdown
  let md = '# GenHub Components Index\n\n'
  md += '> Auto-generated. Do not edit manually.\n\n'
  md += `Last updated: ${new Date().toISOString().split('T')[0]}\n\n`
  md += '---\n\n'
  md += '## By Directory\n\n'

  for (const [dir, components] of Object.entries(componentsMap)) {
    md += `### ${dir}\n`
    md += '| Component | Type | Props | Path |\n'
    md += '|-----------|------|-------|------|\n'
    for (const comp of components) {
      md += `| ${comp.name} | ${comp.type} | ${comp.props} | ${comp.path} |\n`
    }
    md += '\n'
  }

  return md
}

function generateActionsIndex(): string {
  const actionFiles = getFiles('app/actions', /\.ts$/)
  const actionsMap: Record<string, string[]> = {}

  // Extract action names from files
  for (const file of actionFiles) {
    const filename = basename(file)
    const content = readFileSync(file, 'utf-8')

    // Simple regex to find exported async functions
    const matches = content.match(/export\s+(?:async\s+)?function\s+(\w+)/g) || []
    const actions = matches.map((m) => m.replace(/export\s+(?:async\s+)?function\s+/, ''))

    if (actions.length > 0) {
      actionsMap[filename] = actions
    }
  }

  // Generate markdown
  let md = '# GenHub Server Actions Index\n\n'
  md += '> Auto-generated. Do not edit manually.\n\n'
  md += `Last updated: ${new Date().toISOString().split('T')[0]}\n\n`
  md += '---\n\n'
  md += '## Quick Lookup by File\n\n'

  for (const [filename, actions] of Object.entries(actionsMap)) {
    md += `### ${filename}\n`
    md += '| Action | Purpose | Revalidates |\n'
    md += '|--------|---------|-------------|\n'
    for (const action of actions) {
      // Convert camelCase to readable format
      const purpose = action
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .trim()
      md += `| ${action} | ${purpose} | - |\n`
    }
    md += '\n'
  }

  return md
}

function generateRoutesIndex(): string {
  const pageFiles = getFiles('app/app', /page\.tsx$/)
  const routes: RouteInfo[] = []

  for (const file of pageFiles) {
    // Convert file path to route
    let route = file
      .replace(/app\/app/, '')
      .replace(/\/page\.tsx$/, '')
      .replace(/\\/g, '/')

    if (!route) {
      route = '/app'
    }

    const content = readFileSync(file, 'utf-8')
    const isClient = content.includes("'use client'")
    const hasLayout = content.includes('export default')

    routes.push({
      route,
      type: isClient ? 'Client' : 'Server',
      layout: hasLayout ? 'Yes' : '-',
    })
  }

  // Also add public routes
  const publicPages = ['/', '/login', '/signup', '/accept-invite', '/admin-invite']
  for (const page of publicPages) {
    if (!routes.find((r) => r.route === page)) {
      routes.push({
        route: page,
        type: 'Server',
        layout: '-',
      })
    }
  }

  // Sort routes
  routes.sort((a, b) => a.route.localeCompare(b.route))

  // Generate markdown
  let md = '# GenHub Routes Index\n\n'
  md += '> Auto-generated. Do not edit manually.\n\n'
  md += `Last updated: ${new Date().toISOString().split('T')[0]}\n\n`
  md += '---\n\n'
  md += '## Routes\n\n'
  md += '| Route | Type | Layout |\n'
  md += '|-------|------|--------|\n'

  for (const route of routes) {
    md += `| ${route.route} | ${route.type} | ${route.layout} |\n`
  }

  md += '\n---\n\n'
  md += '## Summary\n\n'
  md += '| Metric | Count |\n'
  md += '|--------|-------|\n'
  md += `| Total Routes | ${routes.length} |\n`
  md += `| App Routes | ${routes.filter((r) => r.route.startsWith('/app')).length} |\n`
  md += `| Public Routes | ${routes.filter((r) => !r.route.startsWith('/app')).length} |\n`
  md += '\n'

  return md
}

// ============================================================================
// CONTENT UPDATERS
// ============================================================================

async function updateDocumentation(
  docPath: string,
  dependencies: DependenciesJson
): Promise<{ content: string; changed: boolean; fullPath: string }> {
  const normalizedPath = normalizeKey(docPath)
  const fullPath = join('.claude', docPath)

  // Handle tables index with async support
  if (normalizedPath.includes('docs/indexes/tables.md')) {
    const newContent = await generateTablesIndex()
    try {
      const oldContent = readFileSync(fullPath, 'utf-8')
      return {
        content: newContent,
        changed: oldContent !== newContent,
        fullPath,
      }
    } catch {
      return { content: newContent, changed: true, fullPath }
    }
  }

  // Handle index files
  if (normalizedPath.includes('docs/indexes/components.md')) {
    const newContent = generateComponentsIndex()
    try {
      const oldContent = readFileSync(fullPath, 'utf-8')
      return {
        content: newContent,
        changed: oldContent !== newContent,
        fullPath,
      }
    } catch {
      return { content: newContent, changed: true, fullPath }
    }
  }

  if (normalizedPath.includes('docs/indexes/actions.md')) {
    const newContent = generateActionsIndex()
    try {
      const oldContent = readFileSync(fullPath, 'utf-8')
      return {
        content: newContent,
        changed: oldContent !== newContent,
        fullPath,
      }
    } catch {
      return { content: newContent, changed: true, fullPath }
    }
  }

  if (normalizedPath.includes('docs/indexes/routes.md')) {
    const newContent = generateRoutesIndex()
    try {
      const oldContent = readFileSync(fullPath, 'utf-8')
      return {
        content: newContent,
        changed: oldContent !== newContent,
        fullPath,
      }
    } catch {
      return { content: newContent, changed: true, fullPath }
    }
  }


  // Domain docs require more context - mark for manual review
  if (normalizedPath.includes('docs/domain/')) {
    return {
      content: '⚠️ Domain documentation requires manual review',
      changed: false,
      fullPath,
    }
  }

  // SCHEMA docs require database access
  if (normalizedPath.includes('docs/backend/SCHEMA')) {
    return {
      content: '⚠️ Schema documentation requires database access to regenerate',
      changed: false,
      fullPath,
    }
  }

  return {
    content: '⚠️ Unknown documentation type',
    changed: false,
    fullPath,
  }
}

// ============================================================================
// SYNC LOGIC
// ============================================================================

function findAffectedDocs(
  sourcePath: string,
  dependencies: DependenciesJson
): string[] {
  // Find exact match first
  if (dependencies.sources[sourcePath]) {
    return dependencies.sources[sourcePath].affects
  }

  // Check for wildcard patterns
  for (const [key, entry] of Object.entries(dependencies.sources)) {
    if (key.includes('**')) {
      // Wildcard pattern like components/tasks/**
      const pattern = key.replace('/**', '')
      if (sourcePath.startsWith(pattern)) {
        return entry.affects
      }
    }
  }

  return []
}

function getSourcesToSync(
  args: string[],
  dependencies: DependenciesJson
): string[] {
  const sourceArg = args.find((a) => a.startsWith('--source='))
  const useChangedFiles = args.includes('--changed-files')

  if (sourceArg) {
    const source = sourceArg.replace('--source=', '')
    return [source]
  }

  if (useChangedFiles) {
    return getGitChangedFiles()
  }

  // Default: all sources
  return Object.keys(dependencies.sources)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const shouldWrite = args.includes('--write')

  console.log('\nGenHub Documentation Sync')
  console.log('==========================')
  console.log(`Mode: ${shouldWrite ? 'WRITE' : 'CHECK'}\n`)

  // Load dependencies.json
  let dependencies: DependenciesJson
  try {
    const content = readFileSync('.claude/docs/dependencies.json', 'utf-8')
    dependencies = JSON.parse(content)
  } catch (error) {
    console.error('❌ Could not read dependencies.json')
    process.exit(1)
  }

  // Find sources to sync
  const sourcesToSync = getSourcesToSync(args, dependencies)
  console.log(`📋 Found ${sourcesToSync.length} sources to check\n`)

  // Find affected docs
  const affectedDocsSet = new Set<string>()
  for (const source of sourcesToSync) {
    const affected = findAffectedDocs(source, dependencies)
    affected.forEach((doc) => affectedDocsSet.add(doc))
  }

  const affectedDocs = Array.from(affectedDocsSet).sort()
  console.log(`📄 Found ${affectedDocs.length} affected documentation files\n`)

  if (affectedDocs.length === 0) {
    console.log('✅ No documentation needs updating\n')
    return
  }

  // Process each affected doc
  const results: SyncResult[] = []

  for (const docPath of affectedDocs) {
    console.log(`📝 Processing: ${docPath}`)

    try {
      const { content, changed, fullPath } = await updateDocumentation(docPath, dependencies)

      if (content.includes('⚠️')) {
        results.push({
          file: docPath,
          status: 'flagged',
          message: content,
        })
        console.log('  ⚠️  Flagged for manual review\n')
      } else if (changed) {
        if (shouldWrite) {
          writeFileSync(fullPath, content)
          results.push({
            file: docPath,
            status: 'updated',
          })
          console.log('  ✅ Updated\n')
        } else {
          results.push({
            file: docPath,
            status: 'updated',
          })
          console.log('  ℹ️  Would update (use --write to apply)\n')
        }
      } else {
        results.push({
          file: docPath,
          status: 'no-change',
        })
        console.log('  ✓ No changes needed\n')
      }
    } catch (error) {
      results.push({
        file: docPath,
        status: 'error',
        reason: error instanceof Error ? error.message : 'Unknown error',
      })
      console.log(`  ❌ Error: ${error}\n`)
    }
  }

  // Report summary
  console.log('\n📊 Sync Report')
  console.log('===============\n')

  const updated = results.filter((r) => r.status === 'updated')
  const flagged = results.filter((r) => r.status === 'flagged')
  const noChange = results.filter((r) => r.status === 'no-change')
  const errors = results.filter((r) => r.status === 'error')

  if (updated.length > 0) {
    console.log(`✅ Updated (${updated.length})`)
    for (const result of updated) {
      console.log(`  • ${result.file}`)
    }
    console.log('')
  }

  if (flagged.length > 0) {
    console.log(`⚠️  Flagged for Manual Review (${flagged.length})`)
    for (const result of flagged) {
      console.log(`  • ${result.file}`)
      if (result.message) {
        console.log(`    ${result.message}`)
      }
    }
    console.log('')
  }

  if (noChange.length > 0) {
    console.log(`✓ No Changes Needed (${noChange.length})`)
    for (const result of noChange) {
      console.log(`  • ${result.file}`)
    }
    console.log('')
  }

  if (errors.length > 0) {
    console.log(`❌ Errors (${errors.length})`)
    for (const result of errors) {
      console.log(`  • ${result.file}`)
      if (result.reason) {
        console.log(`    ${result.reason}`)
      }
    }
    console.log('')
  }

  if (updated.length > 0 || flagged.length > 0) {
    if (!shouldWrite) {
      console.log('💡 Run with --write to apply changes\n')
    } else {
      console.log('✅ Documentation synchronized successfully!\n')
    }
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
