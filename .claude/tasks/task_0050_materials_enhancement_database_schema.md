# Task 0050: Materials Enhancement - Database Schema

**Date:** 2026-01-04
**Status:** 🟡 **MIGRATIONS CREATED** (Ready for Deployment)
**Agent:** agent-backend-engineer
**Estimated Effort:** 2-3 hours
**Actual Time:** 1.5 hours

---

## Overview

Create the database foundation for the Materials Page Enhancement feature, including new tables for price tracking and material watchlists, indexes for performance, and RLS policies for security.

---

## Prerequisites

- [x] Design document approved: `docs/specs/materials-page-enhancement/design.md`
- [x] Requirements approved: `docs/specs/materials-page-enhancement/requirements.md`
- [ ] Supabase MCP access configured
- [ ] Database connection verified

---

## Subtasks

### 1. Create `tracked_materials` Table

- [ ] Create migration `supabase/migrations/20260104000001_create_tracked_materials.sql`
- [ ] Define table schema with columns:
  - `id` (uuid, PK, default gen_random_uuid())
  - `company_id` (uuid, FK companies, NOT NULL)
  - `user_id` (uuid, NOT NULL)
  - `material_id` (uuid, FK materials, NOT NULL, CASCADE)
  - `tracked_at` (timestamptz, NOT NULL, default now())
  - `created_at` (timestamptz, NOT NULL, default now())
  - `updated_at` (timestamptz, NOT NULL, default now())
- [ ] Add indexes:
  - `idx_tracked_materials_user` on `(user_id, tracked_at DESC)`
  - `idx_tracked_materials_material` on `(material_id)`
  - `idx_tracked_materials_user_material` UNIQUE on `(user_id, material_id)`
- [ ] Create `update_updated_at_column()` trigger
- [ ] Create `check_tracked_materials_limit()` function (max 10 per user)
- [ ] Create `enforce_tracked_materials_limit` trigger (BEFORE INSERT)
- [ ] Enable RLS
- [ ] Create RLS policies:
  - SELECT: Company members can view
  - INSERT: User can track materials in their company
  - DELETE: User can untrack their own materials
- [ ] Add table comment

### 2. Create `material_price_history` Table

- [ ] Create migration `supabase/migrations/20260104000002_create_material_price_history.sql`
- [ ] Define table schema with columns:
  - `id` (uuid, PK, default gen_random_uuid())
  - `company_id` (uuid, FK companies, NOT NULL, CASCADE)
  - `material_id` (uuid, FK materials, NOT NULL, CASCADE)
  - `price` (numeric(10,2), NOT NULL)
  - `recorded_at` (timestamptz, NOT NULL, default now())
  - `source` (text, NOT NULL, default 'home_depot_api')
  - `created_at` (timestamptz, NOT NULL, default now())
- [ ] Add indexes:
  - `idx_price_history_material_date` on `(material_id, recorded_at DESC)`
  - `idx_price_history_recorded_at` on `(recorded_at DESC)`
- [ ] Enable RLS
- [ ] Create RLS policies:
  - SELECT: Company members can view
  - INSERT: Only service role (for scheduled jobs)
  - No UPDATE or DELETE policies (data is append-only)
- [ ] Add table comment

### 3. Add Indexes to Existing Tables

- [ ] Create migration `supabase/migrations/20260104000003_add_material_indexes.sql`
- [ ] Add indexes to `materials` table:
  - `idx_materials_home_depot_product_id` on `(home_depot_product_id)` WHERE NOT NULL
  - `idx_materials_company_active` on `(company_id, is_active)` WHERE is_active = true
- [ ] Add indexes to `material_assignments` table:
  - `idx_material_assignments_material_id` on `(material_id)`
  - `idx_material_assignments_task_material` on `(task_id, material_id)`
- [ ] Add comments to indexes

### 4. Deploy Migrations

- [ ] Apply migration 001 via MCP Supabase
- [ ] Apply migration 002 via MCP Supabase
- [ ] Apply migration 003 via MCP Supabase
- [ ] Verify tables created successfully
- [ ] Verify indexes created
- [ ] Verify RLS policies enabled

### 5. Verify Database Schema

- [ ] Test max 10 tracking limit (insert 11th material, expect error)
- [ ] Test RLS policies (SELECT, INSERT, DELETE)
- [ ] Verify triggers fire correctly
- [ ] Check index performance (EXPLAIN ANALYZE on key queries)

### 6. Generate TypeScript Types

- [ ] Run `mcp__supabase__generate_typescript_types`
- [ ] Verify new types in `types/database.types.ts`:
  - `tracked_materials`
  - `material_price_history`
- [ ] Commit updated types

---

## Acceptance Criteria

✅ **Tables Created:**
- [ ] `tracked_materials` table exists with correct schema
- [ ] `material_price_history` table exists with correct schema
- [ ] All indexes created on new and existing tables
- [ ] RLS enabled on both new tables
- [ ] All policies created and verified

✅ **Constraints Working:**
- [ ] Max 10 tracked materials enforced (trigger rejects 11th)
- [ ] Unique constraint prevents duplicate user+material combinations
- [ ] Foreign keys cascade deletes correctly

✅ **Performance:**
- [ ] Indexes improve query performance (EXPLAIN ANALYZE shows index usage)
- [ ] Pagination queries are < 100ms
- [ ] Price history lookups are < 50ms

✅ **Security:**
- [ ] RLS policies enforce company isolation
- [ ] Users can only track materials in their company
- [ ] Users can only delete their own tracked materials
- [ ] Service role can insert price history

✅ **Types Generated:**
- [ ] TypeScript types updated in `types/database.types.ts`
- [ ] No TypeScript errors in existing code

---

## Implementation Notes

### Key Technical Details

**1. Max 10 Tracking Limit:**
```sql
-- Trigger function checks count BEFORE INSERT
CREATE OR REPLACE FUNCTION check_tracked_materials_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM tracked_materials WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 tracked materials per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**2. Price History Retention:**
- 90-day retention policy (enforced by cleanup job, not constraint)
- Append-only (no updates/deletes via RLS)
- Service role inserts only

**3. Index Strategy:**
- Optimize for pagination queries (material_id aggregation)
- Optimize for price lookups (material_id + date DESC)
- Optimize for Home Depot sync (home_depot_product_id lookup)

**4. Company Isolation:**
```sql
-- RLS helper function
get_user_company_id(next_auth.uid())

-- Example policy
CREATE POLICY "tracked_materials_select" ON tracked_materials FOR SELECT
USING (company_id = get_user_company_id(next_auth.uid()));
```

### Migration File References

**Migration 001:** See design.md lines 1507-1567
**Migration 002:** See design.md lines 1572-1602
**Migration 003:** See design.md lines 1607-1628

---

## Files to Modify/Create

### Create:
- `supabase/migrations/20260104000001_create_tracked_materials.sql`
- `supabase/migrations/20260104000002_create_material_price_history.sql`
- `supabase/migrations/20260104000003_add_material_indexes.sql`

### Modify:
- `types/database.types.ts` (auto-generated)

---

## Testing Instructions

### 1. Test Tracking Limit

```sql
-- As user with ID 'user-123'
INSERT INTO tracked_materials (company_id, user_id, material_id)
VALUES
  ('company-1', 'user-123', 'mat-1'),
  ('company-1', 'user-123', 'mat-2'),
  -- ... up to mat-10
  ('company-1', 'user-123', 'mat-10');

-- This should fail with error
INSERT INTO tracked_materials (company_id, user_id, material_id)
VALUES ('company-1', 'user-123', 'mat-11');
-- Expected: ERROR: Maximum 10 tracked materials per user
```

### 2. Test RLS Policies

```sql
-- As user in company A, try to track material in company B
-- Should fail or not insert
SET request.jwt.claim.sub = 'user-in-company-a';

INSERT INTO tracked_materials (company_id, user_id, material_id)
VALUES ('company-b', current_setting('request.jwt.claim.sub')::uuid, 'mat-1');
-- Expected: RLS policy violation
```

### 3. Test Price History Insertion

```sql
-- As service role, insert price history
INSERT INTO material_price_history (company_id, material_id, price, source)
VALUES ('company-1', 'mat-1', 10.99, 'home_depot_api');

-- As regular user, try to insert (should fail)
SET role authenticated;
INSERT INTO material_price_history (company_id, material_id, price)
VALUES ('company-1', 'mat-1', 10.99);
-- Expected: RLS policy violation
```

### 4. Test Index Performance

```sql
-- Query with index
EXPLAIN ANALYZE
SELECT m.*, SUM(ma.quantity) as total_quantity
FROM materials m
INNER JOIN material_assignments ma ON ma.material_id = m.id
WHERE m.company_id = 'company-1'
GROUP BY m.id
ORDER BY total_quantity DESC
LIMIT 12;

-- Verify: Index idx_material_assignments_material_id is used
-- Expected: Execution time < 100ms
```

---

## Rollback Plan

If issues occur:

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS material_price_history CASCADE;
DROP TABLE IF EXISTS tracked_materials CASCADE;

-- Drop indexes on existing tables
DROP INDEX IF EXISTS idx_materials_home_depot_product_id;
DROP INDEX IF EXISTS idx_materials_company_active;
DROP INDEX IF EXISTS idx_material_assignments_material_id;
DROP INDEX IF EXISTS idx_material_assignments_task_material;
```

---

## Dependencies

**Depends on:**
- Existing `materials` table
- Existing `material_assignments` table
- Existing `companies` table
- Helper function `get_user_company_id()`

**Required by:**
- Task 0051: Server Actions (needs these tables)
- Task 0052: Scheduled Jobs (needs price_history table)
- Task 0053: UI Components (needs TypeScript types)

---

## References

- Design Document: `docs/specs/materials-page-enhancement/design.md`
  - Data Model: Lines 115-244
  - Migration Scripts: Lines 1504-1628
- DB Schema: `.claude/docs/law/DB_SCHEMA.md`
  - Materials Tables: Lines 205-248
- Requirements: `docs/specs/materials-page-enhancement/requirements.md`

---

## Success Checklist

Before marking this task complete:

- [ ] All 3 migrations applied successfully
- [ ] Tables visible in Supabase dashboard
- [ ] Indexes created (verify with `\di` in psql)
- [ ] RLS policies enabled (verify with `\d+ table_name`)
- [ ] Max 10 limit tested and working
- [ ] TypeScript types regenerated
- [ ] No build errors
- [ ] All tests passed

---

**Next Task:** Task 0051 - Server Actions Implementation
