# /kc:update-dependencies

## Usage
```bash
/kc:update-dependencies                     # Scan and report
/kc:update-dependencies --fix               # Scan and auto-update
/kc:update-dependencies --check-stale       # Find stale entries only
```

## What It Does

Automatically maintains `.claude/docs/dependencies.json` by:

1. **Scanning** the codebase for actual sources:
   - Database tables (via Supabase MCP)
   - Server Action files (`app/actions/*.ts`)
   - Component directories (`components/**/`)
   - Route pages (`app/app/**/page.tsx`)

2. **Detecting** missing entries:
   - New tables not in dependencies.json
   - New action files not mapped
   - New component directories not mapped
   - New routes not mapped

3. **Detecting** stale entries:
   - Entries referencing deleted files
   - Entries referencing non-existent tables

4. **Proposing** additions with proper structure:
   - Determines `type` (table, server_action, component, route)
   - Infers `depends_on` based on conventions
   - Maps to correct `affects` docs

## Output Format

### Report Mode (default)
```markdown
# Dependency Update Report

## Missing Entries (3)

### New Table: company_subcontractors
- Type: table
- Affects: docs/indexes/tables.md, docs/backend/SCHEMA_CORE.md
- Action: Add entry to dependencies.json

### New Action: app/actions/subcontractors.ts
- Type: server_action
- Depends on: database/subcontractors
- Affects: docs/indexes/actions.md
- Action: Add entry to dependencies.json

### New Component: components/subcontractors/**
- Type: component
- Depends on: actions/subcontractors.ts
- Affects: docs/indexes/components.md
- Action: Add entry to dependencies.json

## Stale Entries (1)

### Stale: actions/old-feature.ts
- Reason: File no longer exists
- Action: Remove from dependencies.json

## Already Tracked (42)
All other sources are correctly mapped.

---

## Next Steps

Run with --fix to automatically update dependencies.json
```

### Fix Mode (--fix)
```markdown
# Dependency Update Applied

✓ Added 3 new entries
✓ Removed 1 stale entry
✓ Updated lastUpdated timestamp

Dependencies.json is now current with codebase.
```

## Execution Details

### Detection Rules

**Tables:**
- Source: `mcp__supabase__list_tables`
- Key: `database/{table_name}`
- Affects: Always includes `tables.md` + relevant SCHEMA file

**Actions:**
- Source: Glob `app/actions/*.ts`
- Key: `actions/{filename}`
- Affects: Always includes `actions.md`
- Depends on: Inferred from filename (e.g., tasks.ts → database/tasks)

**Components:**
- Source: Directories in `components/`
- Key: `components/{dir}/**`
- Affects: Always includes `components.md`
- Depends on: Inferred from directory name

**Routes:**
- Source: Files matching `app/app/**/page.tsx`
- Key: `app/app/{path}/page.tsx`
- Affects: Always includes `routes.md`

### Inference Rules

The tool infers relationships based on naming conventions:

```typescript
// Action file inference
actions/tasks.ts → depends_on: ["database/tasks"]
actions/project-files.ts → depends_on: ["database/project_files"]

// Component directory inference
components/tasks/** → depends_on: ["actions/tasks.ts"]
components/projects/** → depends_on: ["actions/projects.ts"]

// Domain doc mapping
database/tasks → affects: [..., "docs/domain/TASKS.md"]
database/projects → affects: [..., "docs/domain/PROJECTS.md"]
```

## Integration

### In Agent Workflow

```markdown
After implementing new feature:
1. Run /kc:update-dependencies to check
2. Review proposed additions
3. Run with --fix to apply updates
4. Commit dependencies.json with other changes
```

### As Pre-Commit Hook

```bash
# Add to .claude/hooks/pre-commit.sh
npx tsx scripts/update-dependencies.ts --check-stale
if [ $? -ne 0 ]; then
  echo "Error: Stale entries in dependencies.json"
  exit 1
fi
```

## Examples

### After Adding New Table
```bash
# Created migration: 20240115_create_project_notes.sql
$ /kc:update-dependencies

Missing Entries (1):
- database/project_notes → Add to dependencies.json

$ /kc:update-dependencies --fix
✓ Added database/project_notes entry
```

### After Creating New Action File
```bash
# Created: app/actions/notes.ts
$ /kc:update-dependencies

Missing Entries (1):
- actions/notes.ts → Add to dependencies.json

$ /kc:update-dependencies --fix
✓ Added actions/notes.ts entry
```

### After Cleanup
```bash
# Deleted: app/actions/old-feature.ts
$ /kc:update-dependencies --check-stale

Stale Entries (1):
- actions/old-feature.ts → File no longer exists

$ /kc:update-dependencies --fix
✓ Removed stale entry
```

## Script Location

`scripts/update-dependencies.ts`

## npm Command

```bash
npm run deps:update      # Report only
npm run deps:fix         # Auto-fix
npm run deps:check       # Check for stale only
```
