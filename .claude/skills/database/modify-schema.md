# Skill: Modify Schema

> ALTER TABLE patterns for GenHub database

## When to Use

- Adding columns to existing tables
- Modifying column types or constraints
- Adding/removing indexes
- Renaming columns or tables

## Prerequisites

- Check `docs/indexes/tables.md` for table structure
- Understand existing RLS policies (may need updates)

## Type Imports

**IMPORTANT**: Use domain-specific type files (NOT `types/database.types.ts`):
- `types/db/task.ts`, `types/db/expense.ts`, `types/db/spatial.ts`, etc.
- `types/db/enums.ts` - All enum types (small, ~100 lines)
- `types/db/tables/{table}.ts` - Individual table Row types

## Schema Documentation

For understanding existing tables and schema:
- **Quick lookup**: `.claude/docs/indexes/tables.md`
- **Core tables**: `.claude/docs/backend/SCHEMA_CORE.md`
- **Enums**: `.claude/docs/backend/SCHEMA_ENUMS.md`
- **Spatial tables**: `.claude/docs/backend/SCHEMA_SPATIAL.md`
- **RLS patterns**: `.claude/docs/backend/SCHEMA_RLS.md`

---

## Quick Reference

### Add Column
```sql
ALTER TABLE public.{table}
ADD COLUMN {column_name} {type} {constraints};

-- Example: Add priority to tasks
ALTER TABLE public.tasks
ADD COLUMN priority text DEFAULT 'medium'
CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'));
```

### Add Column with FK
```sql
ALTER TABLE public.tasks
ADD COLUMN phase_id uuid REFERENCES phases(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_phase ON public.tasks(phase_id);
```

### Modify Column
```sql
-- Change default
ALTER TABLE public.tasks
ALTER COLUMN status SET DEFAULT 'todo';

-- Make nullable
ALTER TABLE public.tasks
ALTER COLUMN due_date DROP NOT NULL;

-- Make required
ALTER TABLE public.tasks
ALTER COLUMN title SET NOT NULL;
```

### Drop Column
```sql
ALTER TABLE public.tasks
DROP COLUMN IF EXISTS deprecated_field;
```

---

## Step-by-Step

### 1. Check Current Schema
```
mcp__supabase__execute_sql(
  query: "SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '{table}'
          ORDER BY ordinal_position;"
)
```

### 2. Check Existing Constraints
```
mcp__supabase__execute_sql(
  query: "SELECT conname, contype, pg_get_constraintdef(oid)
          FROM pg_constraint
          WHERE conrelid = 'public.{table}'::regclass;"
)
```

### 3. Check Existing Indexes
```
mcp__supabase__execute_sql(
  query: "SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = '{table}';"
)
```

### 4. Apply Migration via MCP

**CRITICAL**: Always use MCP, NEVER CLI
```
mcp__supabase__apply_migration(
  name: "alter_{table}_{description}",
  query: "[ALTER SQL]"
)
```

### 5. Save Migration to File System
```bash
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_alter_{table}_{description}.sql << 'EOF'
-- [Your SQL here]
EOF
```

### 6. Update RLS if Needed
If new column affects access control, update policies:
```sql
-- Example: New status column affects which users can see rows
DROP POLICY IF EXISTS "project_access" ON public.{table};
CREATE POLICY "project_access" ON public.{table}
FOR SELECT USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND (status != 'archived' OR public.is_user_gc_admin(next_auth.uid()))
);
```

### 7. Run Security Advisors
```
mcp__supabase__get_advisors(type: "security")
mcp__supabase__get_advisors(type: "performance")
```

### 8. Regenerate Types
```bash
source <(grep -E '^SUPABASE_' .env.local | xargs -I {} echo "export {}") && \
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

---

## Examples

### Add Soft Delete
```sql
-- Migration: add_soft_delete_to_tasks
ALTER TABLE public.tasks
ADD COLUMN deleted_at timestamptz;

CREATE INDEX idx_tasks_deleted ON public.tasks(deleted_at)
WHERE deleted_at IS NULL;

-- Update RLS to exclude deleted
DROP POLICY IF EXISTS "project_access" ON public.tasks;
CREATE POLICY "project_access" ON public.tasks FOR ALL TO authenticated
USING (
  deleted_at IS NULL AND
  project_id IN (
    SELECT p.id FROM projects p
    JOIN company_users cu ON cu.company_id = p.company_id
    WHERE cu.user_id = (SELECT next_auth.uid())
  )
);
```

### Add JSON Metadata with Validation
```sql
-- Migration: add_projects_metadata
ALTER TABLE public.projects
ADD COLUMN metadata jsonb DEFAULT '{}' NOT NULL;

COMMENT ON COLUMN public.projects.metadata IS 'Flexible JSON storage for project-specific custom fields';

-- GIN index for efficient JSON queries
CREATE INDEX idx_projects_metadata_gin ON public.projects USING GIN (metadata);

-- Partial index for common query
CREATE INDEX idx_projects_metadata_type ON public.projects((metadata->>'type'))
WHERE metadata->>'type' IS NOT NULL;
```

### Add CHECK Constraint
```sql
-- Migration: add_project_budget_validation
ALTER TABLE public.projects
ADD CONSTRAINT check_budget_positive CHECK (budget IS NULL OR budget > 0);

COMMENT ON CONSTRAINT check_budget_positive ON public.projects IS 'Budget must be positive when specified';
```

---

## Anti-Patterns

```sql
-- WRONG: Using CLI instead of MCP
psql $DATABASE_URL -c "ALTER TABLE..."  -- ❌
supabase db push  -- ❌

-- CORRECT: MCP Supabase
mcp__supabase__apply_migration(...)  -- ✅

-- WRONG: Dropping column with FK dependencies
ALTER TABLE projects DROP COLUMN company_id;  -- ❌ Breaks RLS!

-- WRONG: Adding NOT NULL without default (breaks existing rows)
ALTER TABLE tasks ADD COLUMN required_field text NOT NULL;  -- ❌

-- CORRECT: Add with default, then optionally remove default
ALTER TABLE tasks ADD COLUMN required_field text NOT NULL DEFAULT '';  -- ✅

-- WRONG: Dropping column without checking dependencies
ALTER TABLE projects DROP COLUMN status;  -- ❌ What if other tables reference this?

-- CORRECT: Check first
-- SELECT * FROM information_schema.columns WHERE column_name = 'status';
-- Then decide if safe to drop

-- WRONG: Renaming column without updating app code
ALTER TABLE tasks RENAME COLUMN assignee_id TO assigned_to;  -- ❌ Breaks queries!

-- CORRECT: Add new column, migrate data, update app, then drop old
-- More work but safer

-- WRONG: Adding FK without index
ALTER TABLE tasks ADD COLUMN phase_id uuid REFERENCES phases(id);  -- ❌

-- CORRECT: Always index FKs
ALTER TABLE tasks ADD COLUMN phase_id uuid REFERENCES phases(id);
CREATE INDEX idx_tasks_phase ON tasks(phase_id);  -- ✅

-- WRONG: Changing column type without checking data compatibility
ALTER TABLE tasks ALTER COLUMN estimated_hours TYPE smallint;  -- ❌ Data loss if values > 32767

-- CORRECT: Check data range first, or use USING clause
ALTER TABLE tasks ALTER COLUMN estimated_hours TYPE smallint USING estimated_hours::smallint;
```

---

## Affected Documentation

After modifying schema:
- Update `docs/indexes/tables.md` with column changes
- Update `backend/SCHEMA_CORE.md` if significant change
- Regenerate `types/database.types.ts`

---

## Checklist

- [ ] **MCP ONLY**: Used `mcp__supabase__apply_migration` (NOT CLI)
- [ ] Current schema checked via `mcp__supabase__execute_sql`
- [ ] Existing constraints checked
- [ ] Existing indexes checked
- [ ] Dependencies identified (FKs, triggers, views)
- [ ] Migration applied via MCP
- [ ] Migration SQL saved to `supabase/migrations/`
- [ ] New FK columns indexed
- [ ] CHECK constraints added for validation (if applicable)
- [ ] COMMENT ON added for new columns
- [ ] RLS policies updated (if access control affected)
- [ ] Security advisors checked
- [ ] Types regenerated
- [ ] Documentation updated (`.claude/docs/indexes/tables.md`)
