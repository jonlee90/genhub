# Materials Enhancement Migrations - Quick Reference

## Overview
3 migrations for Materials Page Enhancement feature (Task 0050)

## Migrations

| File | Purpose | Key Features |
|------|---------|--------------|
| `20260104000001_create_tracked_materials.sql` | User watchlist | Max 10 per user, RLS, triggers |
| `20260104000002_create_material_price_history.sql` | Price tracking | Append-only, 90-day retention, service role only |
| `20260104000003_add_material_indexes.sql` | Performance | 8 indexes on materials & assignments |

## Deploy

```bash
# Quick deploy (recommended)
./scripts/deploy-materials-migrations.sh

# Or manual
psql $DATABASE_URL -f supabase/migrations/20260104000001_create_tracked_materials.sql
psql $DATABASE_URL -f supabase/migrations/20260104000002_create_material_price_history.sql
psql $DATABASE_URL -f supabase/migrations/20260104000003_add_material_indexes.sql
```

## Verify

```sql
-- Check tables exist
\dt public.*material*

-- Check indexes
\di public.*material*

-- Test max 10 limit
INSERT INTO tracked_materials (company_id, user_id, material_id)
VALUES ('company-id', 'user-id', gen_random_uuid());
-- Repeat 10 times, 11th should fail
```

## After Deployment

```bash
# Regenerate TypeScript types
npx supabase gen types typescript --project-id fozwbpqgkcduwxqvmkjd > types/database.types.ts

# Verify build
npm run build
```

## Key Features

### tracked_materials
- ✅ Max 10 materials per user (trigger enforced)
- ✅ Unique user+material constraint
- ✅ RLS: Company isolation
- ✅ Auto-delete on material/company deletion

### material_price_history
- ✅ Append-only (no updates/deletes)
- ✅ Service role INSERT only
- ✅ 90-day retention (cleanup job separate)
- ✅ Price snapshots with source tracking

### Performance Indexes
- ✅ Home Depot API sync optimization
- ✅ Pagination query optimization
- ✅ Material aggregation optimization
- ✅ Partial indexes (active only, non-null only)

## Full Documentation

See: `.claude/tasks/task_0050_status.md`
