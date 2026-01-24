# Command: /kc:audit

> Comprehensive performance, security, and code quality audit for GenHub modules

## Usage

```bash
/kc:audit {module-path}                    # Full audit (all 10 items)
/kc:audit {module-path} --scope=security   # Security only (RLS, auth)
/kc:audit {module-path} --scope=perf       # Performance only (queries, indexes)
/kc:audit {module-path} --scope=quality    # Code quality only (logs, types, hooks)
```

## Description

Performs a **comprehensive audit** of a page, feature module, or Server Action set. Identifies and fixes:
- **Security issues**: Missing RLS policies, auth gaps
- **Performance bottlenecks**: N+1 queries, missing indexes, unnecessary renders
- **Code quality issues**: Console logs, inconsistent types, React Hook violations

The audit produces a detailed report and optionally implements fixes.

---

## Audit Checklist (10 Items)

### CRITICAL - Security

#### 1. RLS Policy Verification
**Check:** All database tables have RLS enabled with company isolation
- Query: `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (...)`
- Verify policies: `SELECT tablename, policyname FROM pg_policies`
- **Fix:** Create migration with company-scoped RLS policies

#### 2. Server Action Auth Checks
**Check:** All Server Actions verify user authentication and authorization
- Pattern: `const session = await auth(); if (!session?.user) return { error: "Unauthorized" }`
- Check role-based access control where needed
- **Fix:** Add auth guards to exposed actions

---

### HIGH - Performance

#### 3. N+1 Query Detection
**Check:** Sequential database queries that should be joined
- Pattern: Query 1 gets IDs → Query 2 fetches related data
- Common in: Server Actions with nested data fetching
- **Fix:** Replace with JOIN queries or use relations in Supabase

**Example N+1:**
```typescript
// ❌ N+1 - 2 queries
const { data: user } = await supabase.from("users").select("company_id")
const { data: company } = await supabase.from("companies").select("*").eq("id", user.company_id)

// ✅ Fixed - 1 query
const { data } = await supabase.from("users").select("company_id, companies!inner(*)")
```

#### 4. Missing Database Indexes
**Check:** Tables with frequent WHERE clauses lack indexes
- Check: `SELECT indexname, tablename FROM pg_indexes WHERE tablename = '...'`
- Common patterns: `WHERE company_id = X AND is_active = true`
- **Fix:** Create composite indexes (partial indexes for filtered queries)

**Example:**
```sql
CREATE INDEX idx_configs_company_active
ON project_type_configs(company_id, is_active)
WHERE is_active = true;
```

#### 5. Missing Suspense Boundaries
**Check:** Server Components without loading states, client components with slow fetches
- Pattern: `async function Page() { const data = await fetch(); }`
- **Fix:** Wrap sections in `<Suspense fallback={<Skeleton />}>`

#### 6. Sequential Order Index Queries
**Check:** Create operations that query max order_index then insert
- Pattern: `SELECT MAX(order_index) ... INSERT ... order_index: max + 1`
- Race condition: Concurrent creates may get same order_index
- **Fix:** Create RPC function for atomic calculation

**Example RPC:**
```sql
CREATE FUNCTION get_next_order_index(p_company_id uuid, p_parent_id uuid)
RETURNS int AS $$
BEGIN
  RETURN COALESCE(MAX(order_index), -1) + 1
  FROM items WHERE company_id = p_company_id AND parent_id = p_parent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### MEDIUM - Code Quality

#### 7. Console.log in Production
**Check:** Unguarded console.log/debug statements in Server Actions
- Pattern: `console.log("[action] ...")` without dev check
- **Fix:** Wrap in `if (process.env.NODE_ENV === "development") { console.log(...) }`

#### 8. Inconsistent Error Return Types
**Check:** Server Actions with optional success/error fields
- Pattern: `{ success?: boolean; data?: T; error?: string }`
- Hard to type narrow, runtime bugs possible
- **Fix:** Use discriminated unions from `types/server-actions.ts`

**Fix pattern:**
```typescript
// ✅ Type-safe discriminated union
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Usage
const result = await getItems();
if (result.success) {
  console.log(result.data); // ✅ TypeScript knows data exists
} else {
  console.error(result.error); // ✅ TypeScript knows error exists
}
```

#### 9. React Hook Dependency Violations
**Check:** useEffect, useCallback, useMemo with missing dependencies
- ESLint rule: `react-hooks/exhaustive-deps`
- **Fix:** Add missing dependencies or use eslint-disable with justification

#### 10. Over-fetching / Under-fetching Data
**Check:** Components fetching more data than needed or making multiple requests
- Pattern: Client components with multiple useEffect fetches
- **Fix:** Lift data fetching to parent or use server components

---

## Workflow

### Step 1: Audit Scope Analysis
```
Input: /kc:audit app/app/settings/page.tsx

Analysis:
✓ Server component found
✓ Imports 4 client components
✓ Uses Server Action: getSettingsPageData()
✓ Dependencies: 3 Server Action files

Scope:
- Core: app/app/settings/page.tsx, lib/settings.ts
- Server Actions: app/actions/task-types.ts, app/actions/phase-templates.ts, app/actions/task-templates.ts
- Components: components/settings/*.tsx
- Database: project_type_configs, task_type_configs, phase_templates, task_templates
```

### Step 2: Execute Audit Checklist

For each item, the audit:
1. **Scans** relevant files with Grep/Read
2. **Verifies** with SQL queries (for database checks)
3. **Documents** findings in audit plan
4. **Proposes** fixes with file/line references

### Step 3: Present Audit Plan

Output: `.claude/reports/{module-name}-audit-plan-{YYYY-MM-DD}.md`

```markdown
# {Module} Audit Plan

## Files to Audit
- Core files (priority HIGH)
- Server Actions (priority MEDIUM)
- Components (priority LOW)

## Findings by Priority

### CRITICAL - Security
1. RLS Policy Gap on X table
   - Problem: No company_id isolation
   - Fix: Create migration with RLS policies

### HIGH - Performance
2. N+1 Query in getClientPermissions
   - File: app/actions/client.ts:73-99
   - Current: 2 sequential queries
   - Fix: Use join query

...

## Implementation Order
1. CRITICAL fixes first (security)
2. HIGH fixes (performance)
3. MEDIUM fixes (code quality)
```

### Step 4: User Approval

Prompt:
```
Audit complete. Found:
- 2 CRITICAL issues (security)
- 4 HIGH issues (performance)
- 3 MEDIUM issues (code quality)

Proceed with fixes? [yes/no/custom]
- yes: Implement all fixes
- no: Exit (report saved)
- custom: Select specific fixes
```

### Step 5: Implementation

For approved fixes:
1. Create database migrations (RLS, indexes, RPC)
2. Apply migrations with `mcp__supabase__apply_migration`
3. Fix Server Action code (queries, logs, types)
4. Fix component code (Suspense, hooks)
5. Verify with TypeScript + build

### Step 6: Verification Report

Output: `.claude/reports/{module-name}-audit-{YYYY-MM-DD}.md`

```markdown
# {Module} Audit Report

## Summary
- Tasks completed: 7/8 (87.5%)
- Files modified: 8
- Migrations applied: 2
- Security issues: 0 (all resolved)
- Performance impact: 50% query reduction

## Completed Tasks
✅ 1. RLS policies verified
✅ 2. N+1 query fixed
...

## Verification
- TypeScript: ✅ No errors
- Build: ✅ Success
- Database: ✅ Migrations applied

## Recommendations
- Future work: Error type migration
```

---

## Examples

### Example 1: Settings Page Audit
```bash
/kc:audit app/app/settings/page.tsx

# Output
Auditing settings page...
✓ Scanned 8 files
✓ Verified 4 database tables
✓ Checked 24 Server Actions

Findings:
- 0 CRITICAL (security) ✅
- 5 HIGH (performance)
- 3 MEDIUM (code quality)

[Presents audit plan]

User: yes

Implementing fixes...
✅ Fixed N+1 query in getClientPermissions
✅ Added Suspense boundaries
✅ Created composite indexes (migration applied)
✅ Created RPC functions (migration applied)
✅ Wrapped 26 console.log statements
✅ Fixed useEffect dependencies

Report: .claude/reports/settings-page-audit-2026-01-23.md
```

### Example 2: Dashboard Audit (Scoped)
```bash
/kc:audit app/app/dashboard/page.tsx --scope=perf

# Performance-only audit
Auditing dashboard performance...

Findings:
- 3 N+1 queries in getDashboardData()
- Missing index on dashboard_kpis(company_id, created_at)
- Large client-side filtering (should be server-side)

[Presents performance-focused plan]
```

### Example 3: Server Action Set Audit
```bash
/kc:audit app/actions/projects.ts

# Audits single Server Action file
Auditing Server Actions...

Findings:
- 12 console.log statements
- Inconsistent error returns (optional fields)
- No auth check in getPublicProjects()

[Presents code quality + security plan]
```

---

## Audit Scope Options

### `--scope=security`
**Checks:** Items 1-2 only
- RLS policies
- Auth guards

### `--scope=perf`
**Checks:** Items 3-6 only
- N+1 queries
- Missing indexes
- Suspense boundaries
- Order index race conditions

### `--scope=quality`
**Checks:** Items 7-10 only
- Console logs
- Error types
- React Hooks
- Data fetching patterns

### `--scope=all` (default)
**Checks:** All 10 items

---

## Output Files

All output goes to `.claude/reports/`:

```
.claude/reports/
├── {module}-audit-plan-{date}.md      # Initial audit findings
└── {module}-audit-{date}.md           # Final implementation report
```

---

## Database Queries Used

### RLS Verification
```sql
-- Check RLS enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN (...table_names...);

-- Check policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (...table_names...);
```

### Index Verification
```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN (...table_names...)
  AND schemaname = 'public';
```

### Query Performance Analysis
```sql
EXPLAIN ANALYZE
SELECT * FROM table_name
WHERE company_id = 'uuid' AND is_active = true;
```

---

## Integration with Other Commands

### After /kc:spec (Planning)
```bash
/kc:spec new-feature
# ... spec complete ...
/kc:audit app/app/new-feature/page.tsx --scope=security
# Verify design has RLS policies planned
```

### Before /kc:impl (Pre-implementation)
```bash
/kc:audit app/app/existing-page/page.tsx
# Find issues before adding new features
```

### Periodic Maintenance
```bash
# Quarterly audits
/kc:audit app/app/dashboard/page.tsx
/kc:audit app/app/projects/page.tsx
/kc:audit app/app/tasks/page.tsx
```

---

## Best Practices

### When to Run Audits

**Required:**
- Before major releases
- After significant refactoring
- When performance issues reported

**Recommended:**
- Quarterly for high-traffic pages
- After adding new database tables
- When adopting new patterns

**Optional:**
- Before code reviews
- During onboarding (learn codebase patterns)

### Audit Frequency by Module

| Module | Frequency | Reason |
|--------|-----------|--------|
| Dashboard | Monthly | High complexity, many queries |
| Projects/Tasks | Quarterly | Core features, frequent changes |
| Settings | Yearly | Low traffic, stable |
| 3D Viewer | Quarterly | Performance-critical |

---

## Audit Agent Context

The audit loads:
- `.claude/CLAUDE.md` - Hard rules and constraints
- `.claude/skills/postgres-best-practices/*.md` - Database patterns
- `.claude/skills/vercel-react-best-practices/*.md` - React patterns
- `types/server-actions.ts` - Error type standards

The audit references:
- Serena memories for known anti-patterns
- Memory MCP for previous audit findings
- Supabase MCP for database inspection

---

## See Also

- **Planning**: `/kc:spec` - Create feature specs
- **Implementation**: `/kc:impl` - Implement from spec
- **Build**: `/kc:build` - Build verification
- **Documentation**:
  - `.claude/skills/postgres-best-practices/` - Database patterns
  - `.claude/skills/vercel-react-best-practices/` - React patterns
  - `.claude/reports/` - Previous audit reports
