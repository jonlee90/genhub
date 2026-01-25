---
name: supabase-table-rls-policy-generator
description: "Generate RLS policies for Supabase tables following GenHub patterns. Creates SELECT-only RLS with company_id filtering. Includes migration SQL and verification."
---

# Supabase Table RLS Policy Generator

Generate secure RLS policies following GenHub's SELECT-only pattern.

## Trigger

- "create RLS for {table}"
- "add RLS policy"
- "secure table {name}"
- New table creation

## GenHub RLS Strategy

**SELECT-only RLS. Server-side enforcement for mutations.**

```sql
-- ✅ RLS for SELECT (enforced by database)
CREATE POLICY "company_read" ON public.{table}
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- ❌ NO RLS for INSERT/UPDATE/DELETE
-- Mutations enforced in Server Action code
```

**Why:** RLS on INSERT/UPDATE causes O(n) complexity and n+1 problems at scale.

## Workflow

### Step 1: Analyze Table

```sql
-- Get table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = '{table}';

-- Check for company_id
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = '{table}' AND column_name = 'company_id'
);
```

### Step 2: Determine Policy Type

| Table Has | Policy Type |
|-----------|-------------|
| `company_id` column | Company-scoped read |
| `user_id` only | User-scoped read |
| Neither | Public read (rare) |

### Step 3: Generate Migration

**Company-Scoped (Standard):**
```sql
-- Migration: add_rls_{table}
-- Description: Add RLS policy for {table} table

-- Enable RLS
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;

-- SELECT policy (company-scoped)
CREATE POLICY "{table}_company_read" ON public.{table}
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Grant permissions
GRANT SELECT ON public.{table} TO authenticated;
GRANT ALL ON public.{table} TO service_role;
```

**User-Scoped (Personal data):**
```sql
-- Migration: add_rls_{table}

ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table}_user_read" ON public.{table}
  FOR SELECT TO authenticated
  USING (user_id = next_auth.uid());

GRANT SELECT ON public.{table} TO authenticated;
GRANT ALL ON public.{table} TO service_role;
```

### Step 4: Apply Migration

```
mcp__supabase__apply_migration({
  name: "add_rls_{table}",
  sql: "{generated SQL}"
})
```

### Step 5: Verify

```sql
-- Check RLS enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = '{table}';

-- Check policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = '{table}';
```

```
mcp__supabase__get_advisors("security")
```

## SQL Auth Helpers Reference

```sql
next_auth.uid()                              -- Current user UUID
public.get_user_company_id(next_auth.uid())  -- User's active company
public.is_user_admin(next_auth.uid())        -- Is Admin?
```

## Output Format

```
## RLS Policy Generated

**Table:** {table_name}
**Policy Type:** Company-scoped SELECT

### Migration
\`\`\`sql
{generated SQL}
\`\`\`

### Applied
✓ Migration applied successfully

### Verification
- RLS Enabled: ✓
- Policy Created: ✓ {policy_name}
- Security Advisor: ✓ No issues

### Server Action Reminder
Mutations must be enforced in Server Action:
\`\`\`typescript
// Verify company ownership before INSERT/UPDATE/DELETE
const ctx = await getUserContext()
if ('error' in ctx) return ctx

// Always use ctx.companyId, never trust client
const { data, error } = await ctx.supabase
  .from('{table}')
  .insert({ ...input, company_id: ctx.companyId })
\`\`\`
```

## Common Patterns

### Multi-Company Access (GC + Subs)

```sql
CREATE POLICY "{table}_multi_company_read" ON public.{table}
  FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(next_auth.uid())
    OR company_id IN (
      SELECT sub_company_id FROM public.company_relationships
      WHERE gc_company_id = public.get_user_company_id(next_auth.uid())
    )
  );
```

### Project-Scoped Access

```sql
CREATE POLICY "{table}_project_read" ON public.{table}
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id = public.get_user_company_id(next_auth.uid())
    )
  );
```

## Safety Checks

Before applying:
- [ ] Table has required scope column (company_id or user_id)
- [ ] No existing conflicting policies
- [ ] Auth helpers are available in database
- [ ] Build will pass after migration
