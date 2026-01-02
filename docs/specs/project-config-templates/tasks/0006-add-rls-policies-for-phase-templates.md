# Task 1.6: Add RLS policies for phase_templates

## Objective
Create Row Level Security policies for phase_templates table with support for cascading deletes.

## References
- Requirements §3.1-3.9 (Phase Template Management)
- Design Migration 3

## Implementation Details

### Files to Modify
- `supabase/migrations/037_phase_templates.sql` (same file from 1.5)

### RLS Policies

**Enable RLS:**
```sql
ALTER TABLE public.phase_templates ENABLE ROW LEVEL SECURITY;
```

**SELECT Policy:**
- Users can view their company's phase templates

**INSERT Policy:**
- Only GC Admin can insert

**UPDATE Policy:**
- Only GC Admin can update

**DELETE Policy:**
- Only GC Admin can delete
- Cascading delete: When project_type_config is deleted, phases are automatically deleted

## Acceptance Criteria
- ✅ RLS enabled on table
- ✅ All 4 policies created
- ✅ Cascading deletes work correctly (deleting project type also deletes phases)
- ✅ Non-admins cannot modify phase templates
- ✅ Policies tested

## SQL Template

```sql
-- Enable RLS
ALTER TABLE public.phase_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their company's phase templates
CREATE POLICY "phase_templates_select_policy" ON public.phase_templates
    FOR SELECT
    TO authenticated
    USING (company_id = get_user_company_id());

-- INSERT: GC Admin only
CREATE POLICY "phase_templates_insert_policy" ON public.phase_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (is_user_gc_admin() AND company_id = get_user_company_id());

-- UPDATE: GC Admin only
CREATE POLICY "phase_templates_update_policy" ON public.phase_templates
    FOR UPDATE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());

-- DELETE: GC Admin only
CREATE POLICY "phase_templates_delete_policy" ON public.phase_templates
    FOR DELETE
    TO authenticated
    USING (is_user_gc_admin() AND company_id = get_user_company_id());
```
