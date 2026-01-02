# Task 1.1: Create project_type_configs table

## Objective
Create migration for project_type_configs table with proper schema, constraints, and indexes.

## References
- Requirements §1 (Project Type Management)
- Design Migration 1

## Implementation Details

### Files to Create
- `supabase/migrations/035_project_type_configs.sql`

### Database Schema
Use `mcp__supabase__apply_migration` to create table with:

**Table Fields:**
- `id` (uuid, primary key, default uuid_generate_v4())
- `company_id` (uuid, foreign key to companies)
- `name` (text, not null)
- `description` (text)
- `icon_name` (text) - Lucide icon name
- `color` (text) - Hex color code
- `is_default` (boolean, default false)
- `order_index` (integer, not null, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

**Constraints:**
- Unique constraint: `(company_id, name)`
- Foreign key: `company_id` references `companies(id)` ON DELETE CASCADE

**Indexes:**
- Index on `company_id`
- Composite index on `(company_id, order_index)`

**Triggers:**
- Add `update_updated_at_column` trigger

**Comments:**
- Add table comment: "Company-specific project type configurations for customizing project workflows"

## Acceptance Criteria
- ✅ Table created with all fields
- ✅ Unique constraint enforced
- ✅ Foreign key relationship established
- ✅ Indexes created for performance
- ✅ Trigger updates `updated_at` automatically
- ✅ Migration file saved locally

## SQL Template

```sql
-- Create project_type_configs table
CREATE TABLE IF NOT EXISTS public.project_type_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT project_type_configs_company_name_unique UNIQUE (company_id, name)
);

-- Add comment
COMMENT ON TABLE public.project_type_configs IS 'Company-specific project type configurations for customizing project workflows';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_type_configs_company_id ON public.project_type_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_project_type_configs_company_order ON public.project_type_configs(company_id, order_index);

-- Add updated_at trigger
CREATE TRIGGER update_project_type_configs_updated_at
    BEFORE UPDATE ON public.project_type_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```
