# Supabase Audit Implementation Guide

> Quick reference for implementing audit recommendations
>
> Related: SUPABASE_AUDIT_REPORT.md
> Date: 2026-01-16

---

## Quick Start

### Step 1: Review Audit Report
Read `/Users/jonathanlee/Desktop/genhub/.claude/docs/backend/SUPABASE_AUDIT_REPORT.md`

### Step 2: Apply HIGH Priority Migrations (30 minutes)

```bash
cd /Users/jonathanlee/Desktop/genhub

# Verify migrations are ready
ls -la supabase/migrations/20260116*

# Apply to local database (test first)
supabase db reset

# Verify no errors
supabase db lint

# If successful, push to remote
supabase db push
```

### Step 3: Enable Connection Pooling (15 minutes)

1. **Supabase Dashboard:**
   - Navigate to Project Settings → Database
   - Click "Connection Pooling" tab
   - Enable pooling
   - Set mode to "Transaction"
   - Note the pooler connection string

2. **Update Environment Variables:**
   ```bash
   # Production .env
   SUPABASE_URL=https://PROJECT_ID.supabase.co
   SUPABASE_ANON_KEY=your_anon_key

   # Use pooler for database operations
   DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@HOST:6543/postgres
   ```

3. **Update Server Actions:**
   - Verify `createClient()` uses pooler connection
   - Test connection under load

### Step 4: Verify (10 minutes)

```sql
-- Check indexes were created
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_tasks_project_status%'
OR indexname LIKE 'idx_tasks_due_date%'
OR indexname LIKE 'idx_messages_room_created%';

-- Check constraints were added
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname LIKE 'check_%';

-- Check RLS policies on admin_invitations
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'admin_invitations';
```

---

## Migration Files Created

### 20260116000001_add_performance_indexes.sql
**Purpose:** Add 7 performance indexes for common queries
**Tables affected:** tasks, messages, expenses, material_assignments, task_assignees, spatial_markers
**Risk:** LOW (indexes are additive)
**Rollback:** `DROP INDEX IF EXISTS idx_*;`

**Indexes Added:**
1. `idx_tasks_project_status` - Project task lists by status
2. `idx_tasks_due_date` - Overdue task detection
3. `idx_messages_room_created` - Chat pagination
4. `idx_expenses_project_status` - Expense reports
5. `idx_material_assignments_status` - Material tracking
6. `idx_task_assignees_user_task` - User task lookups
7. `idx_spatial_markers_model_type` - 3D marker filtering

**Expected Impact:**
- 30-50% faster dashboard queries
- Reduced query execution time from 100-200ms to 50-100ms
- Better performance under load

### 20260116000002_add_validation_constraints.sql
**Purpose:** Prevent invalid data (percentages >100, negative amounts)
**Tables affected:** projects, project_phases, tasks, expenses, material_assignments
**Risk:** MEDIUM (constraints may fail on existing invalid data)
**Rollback:** `ALTER TABLE table_name DROP CONSTRAINT constraint_name;`

**Constraints Added:**
1. `check_health_score_range` - projects.health_score (0-100)
2. `check_completion_percentage_range` - projects.completion_percentage (0-100)
3. `check_project_date_range` - projects end_date >= start_date
4. `check_phase_completion_percentage_range` - phases completion (0-100)
5. `check_phase_date_range` - phases end_date >= start_date
6. `check_task_date_range` - tasks due_date >= start_date
7. `check_expense_amount_positive` - expenses.amount > 0
8. `check_quantity_positive` - material_assignments.quantity > 0
9. `check_ocr_confidence_range` - expenses.ocr_confidence_score (0-1)

**Potential Issues:**
- If existing data violates constraints, migration will fail
- Fix data first or use `NOT VALID` constraint initially

**Fix Invalid Data:**
```sql
-- Check for invalid percentages
SELECT id, health_score, completion_percentage
FROM projects
WHERE health_score < 0 OR health_score > 100
   OR completion_percentage < 0 OR completion_percentage > 100;

-- Fix if needed
UPDATE projects SET health_score = 100 WHERE health_score > 100;
UPDATE projects SET health_score = 0 WHERE health_score < 0;
```

### 20260116000003_add_admin_invitation_policies.sql
**Purpose:** Add explicit RLS policies for admin_invitations
**Tables affected:** admin_invitations
**Risk:** LOW (policies are permissive, adds functionality)
**Rollback:** `DROP POLICY policy_name ON table_name;`

**Policies Added:**
1. `owners_can_manage_invitations` - Owners have full access
2. `users_can_view_own_invitations` - Users see their pending invitations

**Changes:**
- Previously: No policies (service role only)
- Now: Explicit owner management + user self-service view

---

## Testing Checklist

### Index Performance Test
```sql
-- Before: Slow query
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE project_id = 'PROJECT_UUID'
AND status = 'in_progress';

-- After: Should use idx_tasks_project_status
-- Look for "Index Scan using idx_tasks_project_status"
```

### Constraint Validation Test
```sql
-- Should fail: Invalid percentage
INSERT INTO projects (company_id, name, health_score)
VALUES ('COMPANY_UUID', 'Test', 150);
-- Expected: ERROR check constraint "check_health_score_range" violated

-- Should fail: Invalid date range
INSERT INTO projects (company_id, name, start_date, end_date)
VALUES ('COMPANY_UUID', 'Test', '2026-12-31', '2026-01-01');
-- Expected: ERROR check constraint "check_project_date_range" violated

-- Should succeed: Valid data
INSERT INTO projects (company_id, name, health_score, completion_percentage)
VALUES ('COMPANY_UUID', 'Test', 75, 50);
-- Expected: Success
```

### RLS Policy Test
```sql
-- Test as owner
SET request.jwt.claims = '{"sub": "OWNER_USER_UUID"}';
SELECT * FROM admin_invitations; -- Should see all invitations

-- Test as invited user
SET request.jwt.claims = '{"sub": "INVITED_USER_UUID"}';
SELECT * FROM admin_invitations; -- Should see only own invitation

-- Reset
RESET request.jwt.claims;
```

---

## Rollback Procedures

### If Migration Fails

```bash
# Check error
supabase db remote changes

# Rollback locally
supabase db reset

# Fix issue in migration file
vim supabase/migrations/YYYYMMDDHHMMSS_*.sql

# Test again
supabase db reset
```

### If Constraints Block Existing Data

```sql
-- Option 1: Fix data first
UPDATE projects SET health_score = LEAST(health_score, 100);
UPDATE projects SET completion_percentage = LEAST(completion_percentage, 100);

-- Then apply migration
```

```sql
-- Option 2: Add constraint as NOT VALID (allows existing data)
ALTER TABLE projects
  ADD CONSTRAINT check_health_score_range
  CHECK (health_score >= 0 AND health_score <= 100)
  NOT VALID;

-- Then fix data
UPDATE projects SET health_score = 100 WHERE health_score > 100;

-- Validate constraint (will fail if data still invalid)
ALTER TABLE projects VALIDATE CONSTRAINT check_health_score_range;
```

### Manual Rollback SQL

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_tasks_project_status;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_messages_room_created;
DROP INDEX IF EXISTS idx_expenses_project_status;
DROP INDEX IF EXISTS idx_material_assignments_status;
DROP INDEX IF EXISTS idx_task_assignees_user_task;
DROP INDEX IF EXISTS idx_spatial_markers_model_type;

-- Drop constraints
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_health_score_range;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_completion_percentage_range;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_date_range;
ALTER TABLE project_phases DROP CONSTRAINT IF EXISTS check_phase_completion_percentage_range;
ALTER TABLE project_phases DROP CONSTRAINT IF EXISTS check_phase_date_range;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_task_date_range;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS check_expense_amount_positive;
ALTER TABLE material_assignments DROP CONSTRAINT IF EXISTS check_quantity_positive;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS check_ocr_confidence_range;

-- Drop policies
DROP POLICY IF EXISTS owners_can_manage_invitations ON admin_invitations;
DROP POLICY IF EXISTS users_can_view_own_invitations ON admin_invitations;
```

---

## Performance Benchmarks

### Expected Improvements

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| Project task list (status filter) | 150ms | 50ms | 67% faster |
| Overdue tasks dashboard | 200ms | 60ms | 70% faster |
| Chat message pagination | 100ms | 30ms | 70% faster |
| Expense report (status filter) | 120ms | 40ms | 67% faster |
| Material tracking dashboard | 180ms | 70ms | 61% faster |

### How to Measure

```sql
-- Enable timing
\timing on

-- Run query multiple times
SELECT COUNT(*) FROM tasks
WHERE project_id = 'PROJECT_UUID'
AND status = 'in_progress';

-- Note average execution time
```

---

## Connection Pooling Configuration

### Supabase Dashboard Setup

1. **Project Settings → Database → Connection Pooling**
2. **Configuration:**
   ```
   Mode: Transaction
   Pool Size: 20 (adjust based on plan)
   Max Client Connections: 100
   ```
3. **Connection Strings:**
   - **Direct:** `postgresql://postgres:password@db.project.supabase.co:5432/postgres`
   - **Pooler:** `postgresql://postgres:password@db.project.supabase.co:6543/postgres`

### When to Use Each

| Use Case | Connection Type |
|----------|----------------|
| Application queries (Server Actions) | Pooler (6543) |
| Database migrations | Direct (5432) |
| Admin operations | Direct (5432) |
| Long-running transactions | Direct (5432) |
| Serverless functions | Pooler (6543) |

### Environment Variables

```bash
# .env.production
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```

### Update Supabase Client

```typescript
// utils/supabase/server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  // Uses connection pooling automatically via Supabase SDK
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false }
    }
  );
}
```

---

## Monitoring & Alerts

### Queries to Monitor

```sql
-- Slow queries (requires pg_stat_statements)
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%public.tasks%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Recommended Tools

1. **Supabase Dashboard:**
   - Database → Reports
   - Query Performance tab
   - Monitor slow queries

2. **External Monitoring:**
   - **pganalyze** (recommended)
   - **Datadog** (for large deployments)
   - **New Relic** (APM integration)

3. **Alerts to Set Up:**
   - Query execution time > 1s
   - Connection pool utilization > 80%
   - Table size growth rate
   - Failed constraint violations

---

## Next Steps

### Immediate (Today)
- [ ] Apply HIGH priority migrations
- [ ] Enable connection pooling
- [ ] Run performance benchmarks

### This Week
- [ ] Monitor query performance
- [ ] Fix any constraint violations
- [ ] Update Server Actions for N+1 queries

### This Month
- [ ] Add JSONB GIN indexes
- [ ] Remove legacy columns
- [ ] Set up query monitoring
- [ ] Implement audit logging

---

## Support & Questions

**Technical Issues:**
- Schema: supabase-schema-architect agent
- Performance: performance-engineer agent
- Security: backend-engineer agent

**Documentation:**
- Audit Report: `.claude/docs/backend/SUPABASE_AUDIT_REPORT.md`
- Schema Reference: `.claude/docs/backend/SCHEMA_CORE.md`
- RLS Patterns: `.claude/docs/backend/SCHEMA_RLS.md`

---

*Implementation Guide - GenHub Supabase Audit*
