# Skill: RLS Patterns

> Row Level Security cookbook for GenHub multi-tenant architecture

## When to Use

- Creating new tables (always need RLS)
- Fixing access control issues
- Adding new access patterns
- Debugging permission errors

## Prerequisites

- Understand GenHub hierarchy: Company → Project → Task
- Know auth helpers: `next_auth.uid()`, `get_user_company_id()`

---

## Quick Reference

### Pattern 1: Company Isolation (Most Common)
```sql
-- User can only access rows belonging to their company
CREATE POLICY "company_access"
ON public.{table} FOR ALL TO authenticated
USING (company_id = (SELECT get_user_company_id(next_auth.uid())));
```

### Pattern 2: Project-Scoped Access
```sql
-- User can access rows linked to projects in their company
CREATE POLICY "project_access"
ON public.{table} FOR ALL TO authenticated
USING (project_id IN (
  SELECT p.id FROM projects p
  JOIN company_users cu ON cu.company_id = p.company_id
  WHERE cu.user_id = (SELECT next_auth.uid())
));
```

### Pattern 3: Task-Scoped Access
```sql
-- Access through task → project → company chain
CREATE POLICY "task_access"
ON public.{table} FOR ALL TO authenticated
USING (task_id IN (
  SELECT t.id FROM tasks t
  JOIN projects p ON p.id = t.project_id
  JOIN company_users cu ON cu.company_id = p.company_id
  WHERE cu.user_id = (SELECT next_auth.uid())
));
```

### Pattern 4: Owner-Only Access
```sql
-- Only the creator can access
CREATE POLICY "owner_only"
ON public.{table} FOR ALL TO authenticated
USING (user_id = (SELECT next_auth.uid()));
```

### Pattern 5: Role-Based Access
```sql
-- GC admins can access all in company, others only own
CREATE POLICY "role_based"
ON public.{table} FOR ALL TO authenticated
USING (
  (SELECT is_user_gc_admin(next_auth.uid()) AND
   company_id = (SELECT get_user_company_id(next_auth.uid())))
  OR user_id = (SELECT next_auth.uid())
);
```

---

## Auth Helper Functions

### Current User ID
```sql
next_auth.uid()  -- Returns current user's UUID
```

### User's Company
```sql
get_user_company_id(user_uuid)  -- Returns company_id for user
```

### Admin Check
```sql
is_user_gc_admin(user_uuid)  -- Returns true if GC admin
```

### Project Access Check
```sql
-- Custom function pattern
CREATE OR REPLACE FUNCTION user_has_project_access(project_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN company_users cu ON cu.company_id = p.company_id
    WHERE p.id = project_uuid
    AND cu.user_id = (SELECT next_auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## Step-by-Step: New Table RLS

### 1. Enable RLS
```sql
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
```

### 2. Choose Pattern
- Has `company_id`? → Pattern 1
- Has `project_id`? → Pattern 2
- Has `task_id`? → Pattern 3
- User-specific? → Pattern 4
- Needs role check? → Pattern 5

### 3. Create Policy
```sql
CREATE POLICY "{descriptive_name}"
ON public.{table} FOR ALL TO authenticated
USING ({condition});
```

### 4. Test Access
```sql
-- Test as specific user (in Supabase dashboard)
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
SELECT * FROM {table};
```

---

## Examples

### Expenses Table
```sql
-- Expenses belong to tasks, access through task chain
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_access"
ON public.expenses FOR ALL TO authenticated
USING (task_id IN (
  SELECT t.id FROM tasks t
  JOIN projects p ON p.id = t.project_id
  JOIN company_users cu ON cu.company_id = p.company_id
  WHERE cu.user_id = (SELECT next_auth.uid())
));
```

### Chat Messages
```sql
-- Messages in rooms user is member of
CREATE POLICY "message_access"
ON public.chat_messages FOR ALL TO authenticated
USING (room_id IN (
  SELECT room_id FROM chat_room_members
  WHERE user_id = (SELECT next_auth.uid())
));
```

### Subcontractors (Company-Wide)
```sql
CREATE POLICY "subcontractor_access"
ON public.subcontractors FOR ALL TO authenticated
USING (company_id = (SELECT get_user_company_id(next_auth.uid())));
```

---

## Anti-Patterns

```sql
-- WRONG: No RLS on table with sensitive data
-- Table is world-readable!

-- WRONG: Using service role in app code
const supabase = createClient(url, SERVICE_ROLE_KEY);  -- Bypasses RLS!

-- WRONG: Overly permissive policy
CREATE POLICY "open" ON table FOR ALL USING (true);

-- WRONG: Complex subqueries in hot path
CREATE POLICY "slow" ON tasks USING (
  -- Multiple JOINs in frequently accessed table
);
-- BETTER: Use helper function with SECURITY DEFINER
```

---

## Debugging RLS

### Check Policies
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = '{table}';
```

### Test as User
```sql
-- Set user context
SET request.jwt.claims TO '{"sub": "user-uuid"}';

-- Try query
SELECT * FROM {table};

-- Check what uid() returns
SELECT next_auth.uid();
```

### Common Errors
| Error | Cause | Fix |
|-------|-------|-----|
| "permission denied" | RLS blocking | Check policy USING clause |
| Empty results | Policy too restrictive | Verify user's company/project access |
| All rows returned | RLS not enabled | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |

---

## Affected Documentation

After RLS changes:
- Update `backend/SCHEMA_RLS.md` if new pattern
- Document in table comment

---

## Checklist

- [ ] RLS enabled on table
- [ ] Policy created with descriptive name
- [ ] Uses auth helpers (not raw UUIDs)
- [ ] Tested with real user context
- [ ] Performance acceptable (no N+1 in policy)
- [ ] Security advisor check passed
