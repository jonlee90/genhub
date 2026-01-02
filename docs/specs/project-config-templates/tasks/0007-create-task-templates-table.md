# Task 1.7: Create task_templates table

## Objective
Create migration for task_templates table with foreign key relationships to phase_templates.

## References
- Requirements §4 (Task Template Management)
- Design Migration 4

## Implementation Details

### Files to Create
- `supabase/migrations/038_task_templates.sql`

### Database Schema
Use `mcp__supabase__apply_migration` to create table with:

**Table Fields:**
- `id` (uuid, primary key, default uuid_generate_v4())
- `company_id` (uuid, foreign key to companies)
- `phase_template_id` (uuid, foreign key to phase_templates)
- `title` (text, not null)
- `description` (text)
- `default_task_type` (text) - Soft reference to task_type_configs.name
- `default_priority` (text) - 'low', 'medium', 'high'
- `order_index` (integer, not null, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

**Constraints:**
- Foreign key: `company_id` references `companies(id)` ON DELETE CASCADE
- Foreign key: `phase_template_id` references `phase_templates(id)` ON DELETE CASCADE

**Indexes:**
- Index on `company_id`
- Index on `phase_template_id`
- Composite index on `(phase_template_id, order_index)`

**Triggers:**
- Add `update_updated_at_column` trigger

**Comments:**
- Add table comment: "Pre-built task templates linked to phase templates with default task types and priorities"

## Acceptance Criteria
- ✅ Table created with all fields
- ✅ Foreign key relationships established
- ✅ CASCADE DELETE configured (deleting phase deletes tasks)
- ✅ Soft reference to task_type_configs (no FK, uses name)
- ✅ Indexes created for performance
- ✅ Trigger updates `updated_at` automatically
- ✅ Migration file saved locally

## SQL Template

```sql
-- Create task_templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    phase_template_id UUID NOT NULL REFERENCES public.phase_templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    default_task_type TEXT,
    default_priority TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.task_templates IS 'Pre-built task templates linked to phase templates with default task types and priorities';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_company_id ON public.task_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_phase_id ON public.task_templates(phase_template_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_phase_order ON public.task_templates(phase_template_id, order_index);

-- Add updated_at trigger
CREATE TRIGGER update_task_templates_updated_at
    BEFORE UPDATE ON public.task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```
