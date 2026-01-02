---
allowed-tools: Bash, mcp__supabase__generate_typescript_types
description: "Lightweight database security check, regenerate types"
---

# /kc:db-check - Database health check

## Purpose
Fast, focused database security checks and type synchronization. Uses direct SQL queries instead of verbose MCP advisors to minimize token usage.

## Execution

Run this single SQL query via Bash to check all critical security issues:

```bash
npx supabase db execute "
-- Critical Security Checks
SELECT
  'RLS_DISABLED' as check_type,
  schemaname || '.' || tablename as location,
  'CRITICAL' as severity,
  'Table has no RLS protection' as issue
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false

UNION ALL

SELECT
  'NO_POLICIES' as check_type,
  schemaname || '.' || tablename as location,
  'CRITICAL' as severity,
  'Table has RLS enabled but no policies' as issue
FROM pg_tables t
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname
    AND p.tablename = t.tablename
  )

UNION ALL

SELECT
  'MISSING_INDEXES' as check_type,
  schemaname || '.' || tablename as location,
  'WARNING' as severity,
  'Foreign key without index: ' || column_name as issue
FROM (
  SELECT
    tc.table_schema as schemaname,
    tc.table_name as tablename,
    kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_indexes i
      WHERE i.schemaname = tc.table_schema
        AND i.tablename = tc.table_name
        AND i.indexdef LIKE '%' || kcu.column_name || '%'
    )
) fk
ORDER BY severity DESC, check_type;
"
```

Then regenerate TypeScript types:
```
mcp__supabase__generate_typescript_types
```
Save to `types/database.types.ts`

## Output Format

```markdown
# Database Health Check

## Security Issues
| Severity | Check Type | Table/Location | Issue |
|----------|------------|----------------|-------|
| CRITICAL | RLS_DISABLED | public.table_name | Table has no RLS protection |
| CRITICAL | NO_POLICIES | public.table_name | Table has RLS enabled but no policies |
| WARNING | MISSING_INDEXES | public.table_name | Foreign key without index: column_name |

## TypeScript Types
- Status: ✅ Updated / ❌ Failed
- Location: types/database.types.ts

## Summary
- Critical Issues: [count]
- Warnings: [count]
- Action Required: [Yes/No]
```

The optimized version checks the 3 most critical security issues:
1. **RLS disabled** - Tables without Row-Level Security
2. **No policies** - Tables with RLS but no policies (equally insecure)
3. **Missing indexes** - Foreign keys without indexes (performance risk)
