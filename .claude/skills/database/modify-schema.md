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
mcp__supabase__execute_sql
query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table}';"
```

### 2. Check Dependencies
```
mcp__supabase__execute_sql
query: "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = '{table}'::regclass;"
```

### 3. Apply Migration
```
mcp__supabase__apply_migration
name: "alter_{table}_{description}"
query: "[ALTER SQL]"
```

### 4. Update RLS if Needed
If new column affects access control, update policies.

### 5. Regenerate Types
```
mcp__supabase__generate_typescript_types
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

### Add JSON Metadata
```sql
ALTER TABLE public.projects
ADD COLUMN metadata jsonb DEFAULT '{}';

-- Partial index for common query
CREATE INDEX idx_projects_metadata_type ON public.projects((metadata->>'type'))
WHERE metadata->>'type' IS NOT NULL;
```

---

## Anti-Patterns

```sql
-- WRONG: Dropping column with FK dependencies
ALTER TABLE projects DROP COLUMN company_id;  -- Breaks RLS!

-- WRONG: Adding NOT NULL without default
ALTER TABLE tasks ADD COLUMN required_field text NOT NULL;  -- Fails on existing rows

-- CORRECT: Add with default, then optionally remove default
ALTER TABLE tasks ADD COLUMN required_field text NOT NULL DEFAULT '';
```

---

## Affected Documentation

After modifying schema:
- Update `docs/indexes/tables.md` with column changes
- Update `backend/SCHEMA_CORE.md` if significant change
- Regenerate `types/database.types.ts`

---

## Checklist

- [ ] Current schema checked
- [ ] Dependencies identified
- [ ] Migration applied via MCP
- [ ] RLS policies still valid
- [ ] Types regenerated
- [ ] Indexes added for new FKs
- [ ] Documentation updated
