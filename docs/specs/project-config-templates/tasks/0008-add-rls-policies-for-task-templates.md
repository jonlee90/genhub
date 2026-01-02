# Task 1.8: Add RLS policies for task_templates

## Objective
Create Row Level Security policies for task_templates table to enforce company-scoped access control.

## References
- Requirements §4.1-4.9 (Task Template Management)
- Design Migration 4

## Implementation Details

### Files to Modify
- `supabase/migrations/038_task_templates.sql` (same file from 1.7)

### RLS Policies

**Enable RLS:**
```sql
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
```

**SELECT Policy:**
- Users can view their company's task templates

**INSERT Policy:**
- Only GC Admin can insert

**UPDATE Policy:**
- Only GC Admin can update

**DELETE Policy:**
- Only GC Admin can delete

## Acceptance Criteria
- ✅ RLS enabled on table
- ✅ All 4 policies created
- ✅ Templates are company-scoped
- ✅ Non-admins cannot modify task templates
- ✅ Policies tested

## SQL Template

```sql
-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their company's task templates
CREATE POLICY "task_templates_select_policy" ON public.task_templates
    FOR SELECT
    TO authenticated
    USING (company_id = get_user_company_id());

-- INSERT: GC Admin only
CREATE POLICY "task_templates_insert_policy" ON public.task_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (is_user_gc_admin() AND company_id = get_user_company_id());

-- UPDATE: GC Admin only
CREATE POLICY "task_templates_update_policy" ON public.task_templates
    FOR UPDATE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());

-- DELETE: GC Admin only
CREATE POLICY "task_templates_delete_policy" ON public.task_templates
    FOR DELETE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());
```
