# Skill: Create Database Migration

> Create new tables in GenHub with RLS, indexes, and proper patterns.

## When to Use

- Adding a new feature that requires persistent storage
- User says: "create table", "add database", "store data for"
- Design doc specifies new data model

## Prerequisites

- MCP Supabase connected
- Understanding of which company/project the data belongs to
- Knowledge of related tables for foreign keys

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

```
mcp__supabase__apply_migration(
  name: "create_{table_name}",
  query: "-- Full SQL here"
)
```

### 4. Add RLS Policies

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

### 5. Add Indexes

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

### 6. Regenerate Types

After migration succeeds:
```bash
source <(grep -E '^SUPABASE_' .env.local | xargs -I {} echo "export {}") && \
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

---

## Examples

### Example 1: Simple Lookup Table

```sql
-- Create equipment_types table
CREATE TABLE public.equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  hourly_rate numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.equipment_types IS 'Equipment types catalog for the company';

CREATE INDEX idx_equipment_types_company ON public.equipment_types(company_id);
CREATE UNIQUE INDEX idx_equipment_types_name ON public.equipment_types(company_id, name);

ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_types_select" ON public.equipment_types
FOR SELECT USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "equipment_types_insert" ON public.equipment_types
FOR INSERT WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "equipment_types_update" ON public.equipment_types
FOR UPDATE USING (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "equipment_types_delete" ON public.equipment_types
FOR DELETE USING (company_id = public.get_user_company_id(next_auth.uid()));

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

- **Never** skip RLS - every table MUST have `ENABLE ROW LEVEL SECURITY`
- **Never** use `serial` for IDs - always use `uuid`
- **Never** forget `company_id` - all data must be company-isolated
- **Never** use raw `timestamp` - always use `timestamptz`
- **Never** hardcode IDs in migrations - use references or generate at runtime
- **Never** skip indexes on foreign keys - causes slow queries

---

## Affected Documentation

| Document | Update Action |
|----------|---------------|
| `docs/indexes/tables.md` | Add new table entry |
| `docs/law/DB_SCHEMA.md` | Add schema details (if significant) |
| `types/database.types.ts` | Regenerate via MCP |

---

## Checklist

- [ ] Table has `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] Table has `company_id` with foreign key to companies
- [ ] Table has `created_at` and `updated_at` timestamps
- [ ] RLS is enabled
- [ ] At least SELECT policy exists
- [ ] Foreign key columns are indexed
- [ ] Migration applied via `mcp__supabase__apply_migration`
- [ ] Types regenerated via `npx supabase gen types typescript...`
- [ ] Types saved to `types/database.types.ts`
