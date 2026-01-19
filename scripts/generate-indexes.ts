/**
 * GenHub Index Generation Script
 *
 * Generates auto-indexed documentation files for LLM consumption.
 * Run with: npx tsx scripts/generate-indexes.ts [--type=<type>]
 *
 * Types: tables, actions, components, routes, enums, all (default)
 */

import { writeFileSync, readFileSync, readdirSync, statSync } from 'fs'
import { join, basename, dirname, relative } from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment
config()

const INDEXES_DIR = '.claude/docs/indexes'

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

function extractExports(content: string): Array<{ name: string; params: string; isAsync: boolean }> {
  const exports: Array<{ name: string; params: string; isAsync: boolean }> = []

  // Match: export async function name(params) or export function name(params)
  const funcPattern = /export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g
  let match
  while ((match = funcPattern.exec(content)) !== null) {
    exports.push({
      name: match[2],
      params: match[3].split(',')[0]?.trim() || '-', // First param only
      isAsync: !!match[1],
    })
  }

  return exports
}

function extractRevalidates(content: string, functionName: string): string {
  // Find revalidatePath calls after function definition
  const funcStart = content.indexOf(`function ${functionName}`)
  if (funcStart === -1) return '-'

  // Look for revalidatePath in the next ~50 lines
  const funcSection = content.slice(funcStart, funcStart + 2000)
  const revalidateMatch = funcSection.match(/revalidatePath\(['"]([^'"]+)['"]\)/)

  return revalidateMatch ? revalidateMatch[1] : '-'
}

function isClientComponent(content: string): boolean {
  return content.includes("'use client'") || content.includes('"use client"')
}

function extractComponentName(content: string): string | null {
  // Match: export function ComponentName or export default function ComponentName
  const match = content.match(/export\s+(?:default\s+)?function\s+(\w+)/)
  return match ? match[1] : null
}

function extractPropsInterface(content: string, componentName: string): string {
  // Look for Props interface or inline props
  const propsMatch = content.match(new RegExp(`interface\\s+${componentName}Props\\s*\\{([^}]+)\\}`))
  if (propsMatch) {
    // Count props
    const props = propsMatch[1].split('\n').filter((l) => l.includes(':')).length
    return `${props} props`
  }

  // Check for inline props
  const inlineMatch = content.match(new RegExp(`function\\s+${componentName}\\s*\\(\\{([^}]+)\\}\\s*:\\s*\\{`))
  if (inlineMatch) {
    const props = inlineMatch[1].split(',').length
    return `${props} props`
  }

  return '-'
}

// ============================================================================
// GENERATORS
// ============================================================================

async function generateTablesIndex(): Promise<void> {
  console.log('Generating tables.md...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log('  Skipping: SUPABASE env vars not found')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get all tables
  const { data: tables } = await supabase.rpc('get_table_list').select('*')

  if (!tables) {
    // Fallback: query information_schema
    const { data: schemaTables } = await supabase
      .from('information_schema.tables' as never)
      .select('table_name')
      .eq('table_schema', 'public')

    console.log('  Tables found:', schemaTables?.length || 0)
  }

  // For now, read from existing tables.md and update timestamp
  // Full implementation would query Supabase directly
  const existingPath = join(INDEXES_DIR, 'tables.md')
  try {
    const existing = readFileSync(existingPath, 'utf-8')
    const updated = existing.replace(
      /Last updated: .*/,
      `Last updated: ${new Date().toISOString().split('T')[0]}`
    )
    writeFileSync(existingPath, updated)
    console.log('  Updated tables.md timestamp')
  } catch {
    console.log('  Could not update tables.md')
  }
}

async function generateActionsIndex(): Promise<void> {
  console.log('Generating actions.md...')

  const actionFiles = getFiles('app/actions', /\.ts$/)
  console.log(`  Found ${actionFiles.length} action files`)

  let markdown = `# GenHub Server Actions Index

> Auto-generated. Do not edit manually.

Last updated: ${new Date().toISOString().split('T')[0]}

---

## Quick Lookup by File

`

  const byDomain: Record<string, number> = {}

  for (const file of actionFiles) {
    const filename = basename(file)
    const content = readFileSync(file, 'utf-8')
    const exports = extractExports(content)

    if (exports.length === 0) continue

    // Track by domain
    const domain = filename.replace('.ts', '')
    byDomain[domain] = exports.length

    markdown += `### ${filename}\n`
    markdown += '| Action | Purpose | Revalidates |\n'
    markdown += '|--------|---------|-------------|\n'

    for (const exp of exports) {
      const revalidates = extractRevalidates(content, exp.name)
      // Generate purpose from function name (camelCase to sentence)
      const purpose = exp.name
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .trim()
      markdown += `| ${exp.name} | ${purpose} | ${revalidates} |\n`
    }

    markdown += '\n'
  }

  // Add summary
  const totalActions = Object.values(byDomain).reduce((a, b) => a + b, 0)
  markdown += `---

## Summary

| Domain | Action Count |
|--------|--------------|
`
  for (const [domain, count] of Object.entries(byDomain).sort((a, b) => b[1] - a[1])) {
    markdown += `| ${domain} | ${count} |\n`
  }
  markdown += `| **Total** | ${totalActions} |\n`

  writeFileSync(join(INDEXES_DIR, 'actions.md'), markdown)
  console.log(`  Generated actions.md with ${totalActions} actions`)
}

async function generateComponentsIndex(): Promise<void> {
  console.log('Generating components.md...')

  const componentFiles = getFiles('components', /\.tsx$/)
  console.log(`  Found ${componentFiles.length} component files`)

  let markdown = `# GenHub Components Index

> Auto-generated. Do not edit manually.

Last updated: ${new Date().toISOString().split('T')[0]}

---

## By Directory

`

  // Group by directory
  const byDir: Record<string, Array<{ path: string; name: string; type: string; props: string }>> =
    {}

  for (const file of componentFiles) {
    const content = readFileSync(file, 'utf-8')
    const name = extractComponentName(content)
    if (!name) continue

    const relativePath = relative('components', file)
    const dir = dirname(relativePath) || 'root'

    if (!byDir[dir]) byDir[dir] = []

    byDir[dir].push({
      path: relativePath,
      name,
      type: isClientComponent(content) ? 'Client' : 'Server',
      props: extractPropsInterface(content, name),
    })
  }

  // Sort directories
  const sortedDirs = Object.keys(byDir).sort()

  let totalComponents = 0

  for (const dir of sortedDirs) {
    const components = byDir[dir]
    totalComponents += components.length

    markdown += `### ${dir === 'root' ? 'Root' : dir}\n`
    markdown += '| Component | Type | Props | Path |\n'
    markdown += '|-----------|------|-------|------|\n'

    for (const comp of components.sort((a, b) => a.name.localeCompare(b.name))) {
      markdown += `| ${comp.name} | ${comp.type} | ${comp.props} | ${comp.path} |\n`
    }

    markdown += '\n'
  }

  // Add summary
  markdown += `---

## Summary

| Category | Count |
|----------|-------|
| Total Components | ${totalComponents} |
| Client Components | ${Object.values(byDir)
    .flat()
    .filter((c) => c.type === 'Client').length} |
| Server Components | ${Object.values(byDir)
    .flat()
    .filter((c) => c.type === 'Server').length} |
| Directories | ${sortedDirs.length} |
`

  writeFileSync(join(INDEXES_DIR, 'components.md'), markdown)
  console.log(`  Generated components.md with ${totalComponents} components`)
}

async function generateRoutesIndex(): Promise<void> {
  console.log('Generating routes.md...')

  const pageFiles = getFiles('app', /page\.tsx$/)
  console.log(`  Found ${pageFiles.length} page files`)

  let markdown = `# GenHub Routes Index

> Auto-generated. Do not edit manually.

Last updated: ${new Date().toISOString().split('T')[0]}

---

## Routes

| Route | Type | Layout |
|-------|------|--------|
`

  for (const file of pageFiles.sort()) {
    const relativePath = relative('app', file)
    const routePath =
      '/' +
      dirname(relativePath)
        .replace(/\\/g, '/')
        .replace(/\(.*?\)\/?/g, '') // Remove route groups
        .replace(/\[([^\]]+)\]/g, ':$1') // Convert [id] to :id

    const content = readFileSync(file, 'utf-8')
    const type = isClientComponent(content) ? 'Client' : 'Server'

    // Check for layout
    const layoutPath = join(dirname(file), 'layout.tsx')
    let hasLayout = false
    try {
      statSync(layoutPath)
      hasLayout = true
    } catch {
      // No layout
    }

    markdown += `| ${routePath === '/.' ? '/' : routePath} | ${type} | ${hasLayout ? 'Yes' : '-'} |\n`
  }

  // Add summary
  markdown += `
---

## Summary

| Metric | Count |
|--------|-------|
| Total Routes | ${pageFiles.length} |
| App Routes | ${pageFiles.filter((f) => f.includes('/app/')).length} |
| Public Routes | ${pageFiles.filter((f) => !f.includes('/app/')).length} |
`

  writeFileSync(join(INDEXES_DIR, 'routes.md'), markdown)
  console.log(`  Generated routes.md with ${pageFiles.length} routes`)
}

async function generateEnumsIndex(): Promise<void> {
  console.log('Generating enums.md...')

  // Read from database types file
  const typesPath = 'types/database.types.ts'
  try {
    const content = readFileSync(typesPath, 'utf-8')

    // Extract Enums section
    const enumsMatch = content.match(/Enums:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/)
    if (!enumsMatch) {
      console.log('  Could not find Enums section in database.types.ts')
      return
    }

    let markdown = `# GenHub Enums Index

> Auto-generated from database.types.ts. Do not edit manually.

Last updated: ${new Date().toISOString().split('T')[0]}

---

## Database Enums

`

    // Parse enum definitions (handles multi-line enums)
    const enumSection = enumsMatch[1]
    const enums: Record<string, string[]> = {}

    const lines = enumSection.split('\n')
    let currentEnum: string | null = null
    let currentValues: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()

      // Check if this is a new enum definition (ends with colon)
      const enumNameMatch = trimmed.match(/^(\w+):\s*$/)
      if (enumNameMatch) {
        // Save previous enum if exists
        if (currentEnum && currentValues.length > 0) {
          enums[currentEnum] = currentValues
        }
        // Start new enum
        currentEnum = enumNameMatch[1]
        currentValues = []
        continue
      }

      // Check if this is an enum value line (starts with | and has quotes)
      const valueMatch = trimmed.match(/^\|\s*["']([^"']+)["']/)
      if (valueMatch && currentEnum) {
        currentValues.push(valueMatch[1])
        continue
      }

      // Check if this is a single-line enum (name: "value" | "value")
      const singleLineMatch = trimmed.match(/^(\w+):\s*(.+)/)
      if (singleLineMatch && !enumNameMatch) {
        const enumName = singleLineMatch[1]
        const valuesStr = singleLineMatch[2]
        const values = valuesStr
          .split('|')
          .map((v) => v.trim().replace(/^["']|["']$/g, ''))
          .filter((v) => v)

        if (values.length > 0) {
          enums[enumName] = values
        }
      }
    }

    // Save last enum
    if (currentEnum && currentValues.length > 0) {
      enums[currentEnum] = currentValues
    }

    // Group by category
    const categories: Record<string, string[]> = {
      User: ['user_role', 'member_status'],
      Project: ['project_status', 'phase_status'],
      Task: ['task_status', 'task_priority', 'task_type', 'approval_status', 'activity_action'],
      Material: ['material_category', 'procurement_status', 'purchaser_type'],
      Expense: ['expense_category', 'expense_status'],
      File: ['document_category', 'photo_category'],
      Spatial: ['spatial_marker_type', 'spatial_marker_status'],
    }

    for (const [category, enumNames] of Object.entries(categories)) {
      markdown += `### ${category}\n\n`
      markdown += '```sql\n'
      for (const enumName of enumNames) {
        if (enums[enumName]) {
          markdown += `${enumName}: ${enums[enumName].join(' | ')}\n`
        }
      }
      markdown += '```\n\n'
    }

    markdown += `---

## Summary

| Category | Enum Count |
|----------|------------|
`
    for (const [category, enumNames] of Object.entries(categories)) {
      const count = enumNames.filter((n) => enums[n]).length
      if (count > 0) {
        markdown += `| ${category} | ${count} |\n`
      }
    }
    markdown += `| **Total** | ${Object.keys(enums).length} |\n`

    writeFileSync(join(INDEXES_DIR, 'enums.md'), markdown)
    console.log(`  Generated enums.md with ${Object.keys(enums).length} enums`)
  } catch (error) {
    console.log('  Could not read database.types.ts:', error)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const typeArg = args.find((a) => a.startsWith('--type='))
  const type = typeArg ? typeArg.split('=')[1] : 'all'

  console.log(`\nGenHub Index Generator`)
  console.log(`======================`)
  console.log(`Type: ${type}`)
  console.log('')

  const generators: Record<string, () => Promise<void>> = {
    tables: generateTablesIndex,
    actions: generateActionsIndex,
    components: generateComponentsIndex,
    routes: generateRoutesIndex,
    enums: generateEnumsIndex,
  }

  if (type === 'all') {
    for (const [name, generator] of Object.entries(generators)) {
      await generator()
    }
  } else if (generators[type]) {
    await generators[type]()
  } else {
    console.error(`Unknown type: ${type}`)
    console.error(`Valid types: ${Object.keys(generators).join(', ')}, all`)
    process.exit(1)
  }

  console.log('\nDone!')
}

main().catch(console.error)
