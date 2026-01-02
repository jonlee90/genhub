# Task 1.5: Create phase_templates table

## Objective
Create migration for phase_templates table with foreign key relationships to project_type_configs.

## References
- Requirements §3 (Phase Template Management)
- Design Migration 3

## Implementation Details

### Files to Create
- `supabase/migrations/037_phase_templates.sql`

### Database Schema
Use `mcp__supabase__apply_migration` to create table with:

**Table Fields:**
- `id` (uuid, primary key, default uuid_generate_v4())
- `company_id` (uuid, foreign key to companies)
- `project_type_config_id` (uuid, foreign key to project_type_configs)
- `name` (text, not null)
- `description` (text)
- `order_index` (integer, not null, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

**Constraints:**
- Unique constraint: `(project_type_config_id, name)`
- Foreign key: `company_id` references `companies(id)` ON DELETE CASCADE
- Foreign key: `project_type_config_id` references `project_type_configs(id)` ON DELETE CASCADE

**Indexes:**
- Index on `company_id`
- Index on `project_type_config_id`
- Composite index on `(project_type_config_id, order_index)`

**Triggers:**
- Add `update_updated_at_column` trigger

**Comments:**
- Add table comment: "Pre-built phase templates linked to project types for automatic project initialization"

## Acceptance Criteria
- ✅ Table created with all fields
- ✅ Foreign key relationships established
- ✅ CASCADE DELETE configured (deleting project type deletes phases)
- ✅ Indexes created for performance
- ✅ Trigger updates `updated_at` automatically
- ✅ Migration file saved locally

## SQL Template

```sql
-- Create phase_templates table
CREATE TABLE IF NOT EXISTS public.phase_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_type_config_id UUID NOT NULL REFERENCES public.project_type_configs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT phase_templates_type_name_unique UNIQUE (project_type_config_id, name)
);

-- Add comment
COMMENT ON TABLE public.phase_templates IS 'Pre-built phase templates linked to project types for automatic project initialization';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phase_templates_company_id ON public.phase_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_phase_templates_project_type_id ON public.phase_templates(project_type_config_id);
CREATE INDEX IF NOT EXISTS idx_phase_templates_type_order ON public.phase_templates(project_type_config_id, order_index);

-- Add updated_at trigger
CREATE TRIGGER update_phase_templates_updated_at
    BEFORE UPDATE ON public.phase_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```
