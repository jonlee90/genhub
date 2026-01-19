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

### SQL Functions (For RLS Policies)

```sql
-- Get current authenticated user ID
next_auth.uid()  -- Returns current user's UUID

-- Get user's company ID
public.get_user_company_id(user_uuid)  -- Returns company_id for user

-- Check if user is GC Admin (now just "admin" role)
public.is_user_gc_admin(user_uuid)  -- Returns true if admin role
```

### TypeScript Server Action Pattern

**IMPORTANT**: Use centralized `getUserContext()` helper (NOT inline auth)

```typescript
// ❌ OLD PATTERN (Don't use)
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function myAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .single();
  // ...
}

// ✅ NEW PATTERN (Use this)
import { getUserContext } from '@/lib/auth/user-context';

export async function myAction() {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  const { userId, companyId, role, supabase } = ctx;
  // Use ctx.supabase for all DB queries
  // Automatically includes company isolation via RLS
}
```

**Benefits:**
- React `cache()` prevents redundant auth/DB lookups per request
- Consistent error handling
- Type-safe with `UserContextResult` type
- Cleaner, less boilerplate

### Custom Project Access Function
```sql
-- Custom function pattern for complex access checks
CREATE OR REPLACE FUNCTION user_has_project_access(project_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN company_users cu ON cu.company_id = p.company_id
    WHERE p.id = project_uuid
    AND cu.user_id = (SELECT next_auth.uid())
    AND cu.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

### Check Policies via MCP
```
mcp__supabase__execute_sql(
  query: "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;"
)
```

### Check if RLS is Enabled
```
mcp__supabase__execute_sql(
  query: "SELECT tablename, rowsecurity
          FROM pg_tables
          WHERE schemaname = 'public'
          ORDER BY tablename;"
)
```

### Test Policy Logic (Simplified)
```sql
-- Check what current auth state would be
SELECT
  next_auth.uid() as current_user_id,
  public.get_user_company_id(next_auth.uid()) as current_company_id,
  public.is_user_gc_admin(next_auth.uid()) as is_admin;

-- Verify company_users record exists
SELECT user_id, company_id, role, status
FROM company_users
WHERE user_id = next_auth.uid();
```

### Common Errors
| Error | Cause | Fix |
|-------|-------|-----|
| "permission denied for table" | RLS blocking access | Check policy USING clause matches user's company_id |
| Empty results (expected data exists) | Policy too restrictive | Verify user has active company_users record |
| All rows returned (should be filtered) | RLS not enabled | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| "new row violates row-level security" | INSERT policy failing | Check WITH CHECK clause in INSERT policy |
| Policy exists but not working | Using service role key | Ensure using authenticated anon key, not service role |

### Using Security Advisors
```
mcp__supabase__get_advisors(type: "security")
```

Checks for:
- Tables without RLS enabled
- Tables without policies
- Missing indexes on policy filter columns
- Overly permissive policies (e.g., `USING (true)`)

---

## Affected Documentation

After RLS changes:
- Update `backend/SCHEMA_RLS.md` if new pattern
- Document in table comment

---

## Server Actions & RLS

RLS policies work automatically with Server Actions when using `getUserContext()`:

```typescript
// app/actions/tasks.ts
'use server';

import { getUserContext } from '@/lib/auth/user-context';

export async function getTasks(projectId: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // RLS automatically filters to ctx.companyId
  // No need to add .eq('company_id', ctx.companyId) - RLS handles it!
  const { data, error } = await ctx.supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId);

  if (error) return { error: error.message };
  return { data };
}
```

**Key Points:**
1. Always use `ctx.supabase` from `getUserContext()` (not a fresh client)
2. RLS policies apply automatically based on JWT claims
3. Don't manually filter by `company_id` - RLS does it
4. Do verify project ownership if needed (3-level permission check)

---

## Checklist

- [ ] **MCP ONLY**: Policies applied via `mcp__supabase__apply_migration`
- [ ] RLS enabled on table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] At least 4 policies: SELECT, INSERT, UPDATE, DELETE
- [ ] Policy names descriptive (e.g., "company_access", "project_team_access")
- [ ] Uses auth helpers (`next_auth.uid()`, `get_user_company_id()`)
- [ ] No raw UUIDs hardcoded in policies
- [ ] Tested with `mcp__supabase__execute_sql` to verify user context
- [ ] Performance acceptable (no N+1 queries in policy subqueries)
- [ ] Security advisors checked (`mcp__supabase__get_advisors(type: "security")`)
- [ ] Server Actions use `getUserContext()` helper (not inline auth)
