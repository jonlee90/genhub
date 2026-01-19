# Skill: Create Database Migration

> Create new tables in GenHub with RLS, indexes, and proper patterns.

## When to Use

- Adding a new feature that requires persistent storage
- User says: "create table", "add database", "store data for"
- Design doc specifies new data model

## Prerequisites

- MCP Supabase connected (check with `mcp__supabase__list_tables`)
- Understanding of which company/project the data belongs to
- Knowledge of related tables for foreign keys
- Review `.claude/docs/indexes/tables.md` for existing schema

## Type Imports

**IMPORTANT**: Use domain-specific type files (NOT `types/database.types.ts`):
- `types/db/task.ts` - Task types
- `types/db/expense.ts` - Expense types
- `types/db/spatial.ts` - Spatial/3D types
- `types/db/chat.ts` - Chat types
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

```sql
-- GenHub Standard Table Template
CREATE TABLE public.{table_name} (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Add other columns here
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.{table_name} IS '{Description}';

-- Indexes
CREATE INDEX idx_{table_name}_company ON public.{table_name}(company_id);

-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- Standard RLS Policies
CREATE POLICY "{table_name}_select" ON public.{table_name}
FOR SELECT USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "{table_name}_insert" ON public.{table_name}
FOR INSERT WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "{table_name}_update" ON public.{table_name}
FOR UPDATE USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "{table_name}_delete" ON public.{table_name}
FOR DELETE USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Auto-update trigger
CREATE TRIGGER update_{table_name}_updated_at
BEFORE UPDATE ON public.{table_name}
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## Step-by-Step

### 1. Plan the Schema

Identify:
- **Primary key**: Always `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- **Company isolation**: `company_id uuid NOT NULL REFERENCES public.companies(id)`
- **Project scope** (if applicable): `project_id uuid REFERENCES public.projects(id)`
- **User tracking**: `created_by uuid REFERENCES next_auth.users(id)`
- **Timestamps**: `created_at`, `updated_at` (always include)
- **Soft delete** (if needed): `deleted_at timestamptz`

### 2. Choose Column Types

| Data Type | Use For | Example |
|-----------|---------|---------|
| `uuid` | IDs, foreign keys | `id`, `project_id` |
| `text` | Strings (no limit needed) | `title`, `description` |
| `varchar(n)` | Strings with max length | `code varchar(50)` |
| `integer` | Whole numbers | `quantity`, `version_number` |
| `numeric(p,s)` | Money, precise decimals | `amount numeric(12,2)` |
| `boolean` | True/false | `is_active`, `client_visible` |
| `timestamptz` | Dates/times | `due_date`, `created_at` |
| `jsonb` | Flexible/nested data | `metadata`, `settings` |
| `text[]` | String arrays | `tags` |
| Enum | Fixed options | `status public.task_status` |

### 3. Create Migration via MCP

**CRITICAL**: Always use MCP Supabase tools, NEVER use CLI (`psql`, `supabase db push`)

```
mcp__supabase__apply_migration(
  name: "create_{table_name}",
  query: "-- Full SQL here"
)
```

### 4. Save Migration to File System

After MCP applies migration successfully, save SQL to version control:

```bash
# Create timestamped migration file
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_create_{table_name}.sql << 'EOF'
-- [Your SQL here]
EOF
```

### 5. Add RLS Policies

**Standard Company Isolation:**
```sql
-- All users in company can SELECT
CREATE POLICY "{table}_select" ON public.{table}
FOR SELECT USING (company_id = public.get_user_company_id(next_auth.uid()));

-- All users in company can INSERT
CREATE POLICY "{table}_insert" ON public.{table}
FOR INSERT WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));

-- Only creator or admin can UPDATE
CREATE POLICY "{table}_update" ON public.{table}
FOR UPDATE USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND (created_by = next_auth.uid() OR public.is_user_gc_admin(next_auth.uid()))
);

-- Only creator or admin can DELETE
CREATE POLICY "{table}_delete" ON public.{table}
FOR DELETE USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND (created_by = next_auth.uid() OR public.is_user_gc_admin(next_auth.uid()))
);
```

**Project-scoped (alternative):**
```sql
-- Must be on project team
CREATE POLICY "{table}_select" ON public.{table}
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.project_team
    WHERE project_id = {table}.project_id
    AND user_id = next_auth.uid()
  )
);
```

### 6. Add Indexes

```sql
-- Always index foreign keys
CREATE INDEX idx_{table}_{fk_name} ON public.{table}({fk_column});

-- Index frequently filtered columns
CREATE INDEX idx_{table}_status ON public.{table}(status);

-- Partial indexes for soft deletes
CREATE INDEX idx_{table}_active ON public.{table}(company_id)
WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX idx_{table}_project_status ON public.{table}(project_id, status);
```

### 7. Add Comments (Best Practice)

Document table and constraint purpose:
```sql
COMMENT ON TABLE public.{table} IS '{Description of table purpose}';
COMMENT ON COLUMN public.{table}.{column} IS '{Description}';
COMMENT ON CONSTRAINT {constraint_name} ON public.{table} IS '{Why this constraint exists}';
```

### 8. Run Security Advisors

Check for RLS issues and security vulnerabilities:
```
mcp__supabase__get_advisors(type: "security")
mcp__supabase__get_advisors(type: "performance")
```

### 9. Regenerate Types

After migration succeeds:
```bash
source <(grep -E '^SUPABASE_' .env.local | xargs -I {} echo "export {}") && \
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

---

## Examples

### Example 1: Simple Lookup Table with Validation

```sql
-- Migration: create_equipment_types
-- Purpose: Equipment catalog with hourly rates for cost estimation
-- Date: 2026-01-18

-- Create equipment_types table
CREATE TABLE public.equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  hourly_rate numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Data validation
  CONSTRAINT check_hourly_rate_positive CHECK (hourly_rate IS NULL OR hourly_rate > 0)
);

COMMENT ON TABLE public.equipment_types IS 'Equipment types catalog for the company';
COMMENT ON COLUMN public.equipment_types.hourly_rate IS 'Cost per hour for equipment rental/usage';
COMMENT ON CONSTRAINT check_hourly_rate_positive ON public.equipment_types IS 'Hourly rate must be positive';

-- Indexes
CREATE INDEX idx_equipment_types_company ON public.equipment_types(company_id);
CREATE UNIQUE INDEX idx_equipment_types_name ON public.equipment_types(company_id, name);

-- Enable RLS
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "equipment_types_select" ON public.equipment_types
FOR SELECT USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "equipment_types_insert" ON public.equipment_types
FOR INSERT WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "equipment_types_update" ON public.equipment_types
FOR UPDATE USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "equipment_types_delete" ON public.equipment_types
FOR DELETE USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Auto-update trigger
CREATE TRIGGER update_equipment_types_updated_at
BEFORE UPDATE ON public.equipment_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Example 2: Project-Scoped with Soft Delete

```sql
-- Create project_documents table
CREATE TABLE public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES next_auth.users(id),
  filename text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  category public.document_category DEFAULT 'general',
  client_visible boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_documents IS 'Project documents with soft delete';

CREATE INDEX idx_project_documents_project ON public.project_documents(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_documents_company ON public.project_documents(company_id);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_documents_select" ON public.project_documents
FOR SELECT USING (
  company_id = public.get_user_company_id(next_auth.uid())
  AND deleted_at IS NULL
);

-- ... other policies
```

---

## Anti-Patterns

```sql
-- WRONG: Using CLI instead of MCP
psql $DATABASE_URL -c "CREATE TABLE..."  -- ❌
supabase db push  -- ❌

-- CORRECT: MCP Supabase
mcp__supabase__apply_migration(...)  -- ✅

-- WRONG: No RLS enabled
CREATE TABLE tasks (...);  -- ❌ World readable!

-- CORRECT: Always enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;  -- ✅

-- WRONG: Using serial IDs
id serial PRIMARY KEY  -- ❌ Sequential, predictable

-- CORRECT: UUID
id uuid PRIMARY KEY DEFAULT gen_random_uuid()  -- ✅

-- WRONG: No company isolation
CREATE TABLE docs (id uuid, content text);  -- ❌

-- CORRECT: Always include company_id
CREATE TABLE docs (
  id uuid,
  company_id uuid NOT NULL REFERENCES companies(id),
  content text
);  -- ✅

-- WRONG: Using timestamp without timezone
created_at timestamp  -- ❌ Loses timezone info

-- CORRECT: timestamptz
created_at timestamptz NOT NULL DEFAULT now()  -- ✅

-- WRONG: Hardcoding UUIDs in migration
INSERT INTO companies (id, name) VALUES ('123e4567...', 'Acme');  -- ❌

-- CORRECT: Let database generate
INSERT INTO companies (name) VALUES ('Acme');  -- ✅

-- WRONG: No index on FK
ALTER TABLE tasks ADD COLUMN project_id uuid REFERENCES projects(id);  -- ❌ Slow joins

-- CORRECT: Always index FKs
CREATE INDEX idx_tasks_project ON tasks(project_id);  -- ✅

-- WRONG: No migration file saved
-- Apply via MCP only, don't save to supabase/migrations/  -- ❌

-- CORRECT: Save after MCP apply
-- Save SQL to supabase/migrations/{timestamp}_{name}.sql  -- ✅
```

---

## Affected Documentation

| Document | Update Action |
|----------|---------------|
| `docs/indexes/tables.md` | Add new table entry |
| `docs/law/DB_SCHEMA.md` | Add schema details (if significant) |
| `types/database.types.ts` | Regenerate via MCP |

---

## Checklist

- [ ] **MCP ONLY**: Used `mcp__supabase__apply_migration` (NOT CLI)
- [ ] Table has `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] Table has `company_id` with foreign key to companies
- [ ] Table has `created_at` and `updated_at` timestamps
- [ ] RLS is enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] At least 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Foreign key columns are indexed
- [ ] CHECK constraints added for data validation (if applicable)
- [ ] COMMENT ON TABLE/COLUMN added for documentation
- [ ] Security advisors checked (`mcp__supabase__get_advisors`)
- [ ] Migration SQL saved to `supabase/migrations/{timestamp}_{name}.sql`
- [ ] Types regenerated via `npx supabase gen types typescript...`
- [ ] Documentation updated (`.claude/docs/indexes/tables.md`)
