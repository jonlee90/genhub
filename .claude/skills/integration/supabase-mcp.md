# Skill: Supabase MCP Integration

> MCP Supabase tool usage patterns for GenHub

## When to Use

- All database operations (read, write, DDL)
- Schema inspection and modification
- Type generation
- Security auditing

## Prerequisites

- MCP Supabase tools available in tool list
- Never use psql, CLI, or direct database connections

---

## Quick Reference

### Available Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `mcp__supabase__list_tables` | List all tables | Start of work, verify schema |
| `mcp__supabase__execute_sql` | Run queries | SELECT, INSERT, UPDATE, DELETE |
| `mcp__supabase__apply_migration` | Schema changes | CREATE, ALTER, DROP |
| `mcp__supabase__get_advisors` | Security audit | After migrations, periodic checks |
| `mcp__supabase__get_logs` | Debug issues | When queries fail |
| `npx supabase gen types...` | Update types | After ANY schema change (use Bash) |
| `mcp__supabase__list_migrations` | Migration history | Review applied migrations |

---

## Tool Usage Patterns

### List Tables
```typescript
// Check current schema
mcp__supabase__list_tables
// Returns: Array of table names and metadata

// Use cases:
// - Verify table exists before migration
// - Check column names before query
// - Start of any database work
```

### Execute SQL
```typescript
// Simple query
mcp__supabase__execute_sql
query: "SELECT * FROM tasks WHERE project_id = 'uuid' LIMIT 10;"

// Count
mcp__supabase__execute_sql
query: "SELECT COUNT(*) FROM tasks WHERE status = 'completed';"

// Join
mcp__supabase__execute_sql
query: `
  SELECT t.*, p.name as project_name
  FROM tasks t
  JOIN projects p ON p.id = t.project_id
  WHERE t.status = 'in_progress';
`

// Insert and return
mcp__supabase__execute_sql
query: `
  INSERT INTO materials (name, quantity, task_id)
  VALUES ('Concrete', 100, 'task-uuid')
  RETURNING *;
`

// Update
mcp__supabase__execute_sql
query: `
  UPDATE tasks
  SET status = 'completed', updated_at = NOW()
  WHERE id = 'task-uuid'
  RETURNING *;
`

// Check RLS policies
mcp__supabase__execute_sql
query: `
  SELECT policyname, cmd, qual
  FROM pg_policies
  WHERE tablename = 'tasks';
`

// Check indexes
mcp__supabase__execute_sql
query: `
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'tasks';
`
```

### Apply Migration
```typescript
// Create table
mcp__supabase__apply_migration
name: "create_materials_table"
query: `
  CREATE TABLE public.materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    company_id uuid NOT NULL REFERENCES companies(id),
    created_at timestamptz DEFAULT now()
  );

  ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "company_access" ON public.materials
    FOR ALL TO authenticated
    USING (company_id = (SELECT get_user_company_id(next_auth.uid())));

  CREATE INDEX idx_materials_company ON public.materials(company_id);
`

// Add column
mcp__supabase__apply_migration
name: "add_priority_to_tasks"
query: `
  ALTER TABLE public.tasks
  ADD COLUMN priority text DEFAULT 'medium'
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'));
`

// Create enum
mcp__supabase__apply_migration
name: "create_expense_status_enum"
query: `
  CREATE TYPE public.expense_status AS ENUM (
    'draft', 'submitted', 'approved', 'rejected', 'paid'
  );
`

// Drop (careful!)
mcp__supabase__apply_migration
name: "drop_deprecated_column"
query: `
  ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS old_column;
`
```

### Get Advisors
```typescript
// Security check (run after migrations)
mcp__supabase__get_advisors
type: "security"

// Performance check
mcp__supabase__get_advisors
type: "performance"

// Response includes:
// - Level (critical, warning, info)
// - Issue description
// - Remediation URL
// - Affected objects
```

### Get Logs
```typescript
// Database logs
mcp__supabase__get_logs
service: "postgres"

// Auth logs
mcp__supabase__get_logs
service: "auth"

// Edge function logs
mcp__supabase__get_logs
service: "edge-function"

// API logs
mcp__supabase__get_logs
service: "api"
```

### Generate Types
```bash
# Run after ANY schema change (use Bash, not MCP)
source <(grep -E '^SUPABASE_' .env.local | xargs -I {} echo "export {}") && \
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts

# This saves directly to types/database.types.ts
# More token-efficient than MCP tool (doesn't return file contents)
```

---

## Workflow Patterns

### New Table Workflow
```
1. mcp__supabase__list_tables
   → Verify table name doesn't exist

2. mcp__supabase__apply_migration
   name: "create_{table}_table"
   query: [CREATE TABLE + RLS + indexes]

3. mcp__supabase__execute_sql
   query: "SELECT * FROM pg_policies WHERE tablename = '{table}';"
   → Verify RLS created

4. mcp__supabase__get_advisors
   type: "security"
   → Check for issues

5. Bash: npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
   → Update type definitions (token-efficient)

6. Save SQL to supabase/migrations/YYYYMMDDHHMMSS_{name}.sql
```

### Modify Schema Workflow
```
1. mcp__supabase__list_tables
   → Get current schema

2. mcp__supabase__execute_sql
   query: "SELECT column_name, data_type FROM information_schema.columns
           WHERE table_name = '{table}';"
   → Verify current columns

3. mcp__supabase__apply_migration
   name: "alter_{table}_{change}"
   query: [ALTER TABLE ...]

4. Bash: npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts

5. Update affected Server Actions
```

### Debug Workflow
```
1. mcp__supabase__get_logs
   service: "postgres"
   → Check for errors

2. mcp__supabase__execute_sql
   query: "EXPLAIN ANALYZE {problematic_query};"
   → Check query plan

3. mcp__supabase__get_advisors
   type: "performance"
   → Check for index suggestions
```

---

## Common Queries

### Schema Inspection
```sql
-- List all columns in table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- List foreign keys
SELECT
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'tasks';

-- List all RLS policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Data Validation
```sql
-- Count by status
SELECT status, COUNT(*)
FROM tasks
GROUP BY status;

-- Find orphaned records
SELECT t.id, t.title
FROM tasks t
LEFT JOIN projects p ON p.id = t.project_id
WHERE p.id IS NULL;

-- Find duplicate entries
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

---

## Anti-Patterns

```typescript
// WRONG: Using psql directly
psql $DATABASE_URL -c "SELECT * FROM tasks"

// WRONG: Using Supabase CLI
npx supabase migration new feature
npx supabase db push

// WRONG: Skipping type generation
mcp__supabase__apply_migration(...)
// No type generation!

// WRONG: No RLS on new table
mcp__supabase__apply_migration
query: "CREATE TABLE public.data (...);"
// Missing: ALTER TABLE ... ENABLE ROW LEVEL SECURITY

// WRONG: No security check after migration
// Always run get_advisors after schema changes

// CORRECT: Full workflow
mcp__supabase__apply_migration(...)
mcp__supabase__get_advisors({ type: "security" })
// Then run: npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "relation does not exist" | Table not created | Check migration applied |
| "permission denied" | RLS blocking | Check policy conditions |
| "duplicate key" | Unique constraint | Handle in application |
| "foreign key violation" | FK doesn't exist | Verify referenced ID |
| "timeout" | Long query | Add indexes, optimize |

### Debug Steps
```
1. Check logs: mcp__supabase__get_logs service: "postgres"
2. Verify table: mcp__supabase__list_tables
3. Check RLS: execute_sql → pg_policies
4. Check advisors: get_advisors type: "security"
```

---

## Checklist

- [ ] Used MCP tools (not psql/CLI)
- [ ] Verified schema before changes
- [ ] Applied migration with descriptive name
- [ ] RLS enabled and policy created
- [ ] Security advisors checked
- [ ] Types regenerated
- [ ] Migration saved locally
