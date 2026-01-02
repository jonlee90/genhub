# Task 1.3: Create task_type_configs table

## Objective
Create migration for task_type_configs table with proper schema, constraints, and indexes.

## References
- Requirements §2 (Task Type Management)
- Design Migration 2

## Implementation Details

### Files to Create
- `supabase/migrations/036_task_type_configs.sql`

### Database Schema
Use `mcp__supabase__apply_migration` to create table with:

**Table Fields:**
- `id` (uuid, primary key, default uuid_generate_v4())
- `company_id` (uuid, foreign key to companies)
- `name` (text, not null)
- `description` (text)
- `color` (text) - Hex color code for badge styling
- `icon_name` (text) - Lucide icon name
- `is_default` (boolean, default false) - System default types cannot be deleted
- `is_active` (boolean, default true) - Soft delete flag
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

**Constraints:**
- Unique constraint: `(company_id, name)`
- Foreign key: `company_id` references `companies(id)` ON DELETE CASCADE

**Indexes:**
- Index on `company_id`

**Triggers:**
- Add `update_updated_at_column` trigger

**Comments:**
- Add table comment: "Company-specific task type configurations with custom colors and icons"

## Acceptance Criteria
- ✅ Table created with all fields
- ✅ Unique constraint enforced
- ✅ Foreign key relationship established
- ✅ Indexes created
- ✅ Trigger updates `updated_at` automatically
- ✅ Migration file saved locally

## SQL Template

```sql
-- Create task_type_configs table
CREATE TABLE IF NOT EXISTS public.task_type_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon_name TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT task_type_configs_company_name_unique UNIQUE (company_id, name)
);

-- Add comment
COMMENT ON TABLE public.task_type_configs IS 'Company-specific task type configurations with custom colors and icons';

-- Create index
CREATE INDEX IF NOT EXISTS idx_task_type_configs_company_id ON public.task_type_configs(company_id);

-- Add updated_at trigger
CREATE TRIGGER update_task_type_configs_updated_at
    BEFORE UPDATE ON public.task_type_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```
