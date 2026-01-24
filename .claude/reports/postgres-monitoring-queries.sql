-- ============================================================================
-- GenHub Postgres Performance Monitoring Queries
-- Run these queries periodically to track database health
-- Created: 2026-01-23
-- ============================================================================

-- =============================================================================
-- 1. RLS SECURITY CHECK
-- Verify all tables have RLS enabled
-- =============================================================================
SELECT
    schemaname,
    tablename,
    CASE
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- Expected: All tables should show "✅ Enabled"


-- =============================================================================
-- 2. NEW INDEX USAGE TRACKING
-- Monitor the indexes we just created
-- =============================================================================
SELECT
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    CASE
        WHEN idx_scan = 0 THEN '⚠️ Not used yet'
        WHEN idx_scan < 100 THEN '📊 Low usage'
        WHEN idx_scan < 1000 THEN '✅ Moderate usage'
        ELSE '🚀 High usage'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND (
        indexrelname = 'idx_company_users_active_lookup'
        OR indexrelname = 'idx_notifications_unread'
        OR indexrelname = 'idx_tasks_todo'
        OR indexrelname = 'idx_tasks_in_progress'
    )
ORDER BY idx_scan DESC;

-- Expected: Scans should increase over time
-- Run this daily for the first week after deployment


-- =============================================================================
-- 3. TABLE BLOAT MONITOR
-- Track dead tuples to ensure VACUUM is working
-- =============================================================================
SELECT
    schemaname,
    relname as table_name,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    CASE
        WHEN n_live_tup > 0
        THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
        ELSE 0
    END as dead_pct,
    CASE
        WHEN n_live_tup > 0 AND (100.0 * n_dead_tup / (n_live_tup + n_dead_tup)) > 20
        THEN '❌ HIGH BLOAT'
        WHEN n_live_tup > 0 AND (100.0 * n_dead_tup / (n_live_tup + n_dead_tup)) > 10
        THEN '⚠️ Moderate bloat'
        ELSE '✅ Healthy'
    END as health_status,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN ('company_users', 'team_invitations', 'admin_invitations', 'tasks')
ORDER BY dead_pct DESC;

-- Expected: dead_pct should be <10% after our VACUUM
-- Alert if any table shows >20%


-- =============================================================================
-- 4. SEQUENTIAL SCAN RATIO
-- Track improvement in index usage
-- =============================================================================
SELECT
    schemaname,
    relname as table_name,
    seq_scan,
    idx_scan,
    CASE
        WHEN seq_scan + idx_scan > 0
        THEN ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 2)
        ELSE 0
    END as seq_scan_pct,
    CASE
        WHEN seq_scan > 0 THEN ROUND((seq_tup_read::numeric / seq_scan), 2)
        ELSE 0
    END as avg_rows_per_seq_scan,
    CASE
        WHEN seq_scan + idx_scan > 0 AND (100.0 * seq_scan / (seq_scan + idx_scan)) > 80
        THEN '❌ Too many seq scans'
        WHEN seq_scan + idx_scan > 0 AND (100.0 * seq_scan / (seq_scan + idx_scan)) > 50
        THEN '⚠️ Review queries'
        ELSE '✅ Good index usage'
    END as status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND seq_scan + idx_scan > 100  -- Only tables with meaningful activity
ORDER BY seq_scan_pct DESC
LIMIT 15;

-- Expected: company_users, project_phases should show improvement
-- Baseline (before): company_users ~100%, project_phases ~57%
-- Target: <50% sequential scan ratio


-- =============================================================================
-- 5. CACHE HIT RATIO
-- Monitor buffer cache efficiency
-- =============================================================================
-- Index cache hit ratio
SELECT
    'Index Cache Hit Ratio' as metric,
    ROUND(
        100.0 * SUM(idx_blks_hit) /
        NULLIF(SUM(idx_blks_hit + idx_blks_read), 0),
        2
    ) as percentage,
    CASE
        WHEN ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2) >= 99
        THEN '🚀 Excellent'
        WHEN ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2) >= 95
        THEN '✅ Good'
        WHEN ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2) >= 90
        THEN '⚠️ Fair'
        ELSE '❌ Poor'
    END as status
FROM pg_statio_user_indexes
WHERE schemaname = 'public'

UNION ALL

-- Table cache hit ratio
SELECT
    'Table Cache Hit Ratio' as metric,
    ROUND(
        100.0 * SUM(heap_blks_hit) /
        NULLIF(SUM(heap_blks_hit + heap_blks_read), 0),
        2
    ) as percentage,
    CASE
        WHEN ROUND(100.0 * SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0), 2) >= 99
        THEN '🚀 Excellent'
        WHEN ROUND(100.0 * SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0), 2) >= 95
        THEN '✅ Good'
        WHEN ROUND(100.0 * SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0), 2) >= 90
        THEN '⚠️ Fair'
        ELSE '❌ Poor'
    END as status
FROM pg_statio_user_tables
WHERE schemaname = 'public';

-- Expected: Both should be >99%
-- Alert if drops below 95%


-- =============================================================================
-- 6. QUERY PERFORMANCE - TOP SLOW QUERIES
-- Identify queries that need optimization
-- =============================================================================
SELECT
    LEFT(query, 100) as query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) as total_time_ms,
    ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
    ROUND(max_exec_time::numeric, 2) as max_time_ms,
    CASE
        WHEN mean_exec_time > 100 THEN '❌ Very slow'
        WHEN mean_exec_time > 50 THEN '⚠️ Slow'
        WHEN mean_exec_time > 10 THEN '⚠️ Monitor'
        ELSE '✅ Fast'
    END as performance
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
    AND query NOT LIKE '%information_schema%'
    AND calls > 10
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Expected: Most queries <10ms avg
-- Investigate any query >50ms
-- Note: Requires pg_stat_statements extension enabled


-- =============================================================================
-- 7. INDEX SIZE AND EFFICIENCY
-- Track index growth and identify bloat
-- =============================================================================
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan,
    idx_tup_read,
    CASE
        WHEN idx_scan = 0 THEN '❌ Unused'
        WHEN idx_scan < 100 THEN '⚠️ Low usage'
        ELSE '✅ Active'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Expected: Our new indexes should show "✅ Active" within a week
-- Dropped indexes should no longer appear


-- =============================================================================
-- 8. TABLE SIZE TRENDS
-- Monitor table growth
-- =============================================================================
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(
        pg_total_relation_size(schemaname||'.'||tablename) -
        pg_relation_size(schemaname||'.'||tablename)
    ) as indexes_size,
    ROUND(
        100.0 * (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) /
        NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0),
        2
    ) as index_pct,
    n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 15;

-- Expected: company_users index_pct should decrease (we dropped 6 indexes)
-- Monitor tables approaching 1GB for partitioning consideration


-- =============================================================================
-- 9. CONNECTION POOL STATUS
-- Monitor active connections
-- =============================================================================
SELECT
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE state = 'active') as active,
    COUNT(*) FILTER (WHERE state = 'idle') as idle,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
    COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL) as waiting
FROM pg_stat_activity
WHERE datname = current_database()
    AND pid != pg_backend_pid();

-- Expected: Total connections should be reasonable for your Supabase tier
-- Alert if idle_in_transaction > 5 (indicates connection leaks)


-- =============================================================================
-- 10. AUTOVACUUM ACTIVITY
-- Verify autovacuum is running on our tuned tables
-- =============================================================================
SELECT
    schemaname,
    relname as table_name,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count,
    CASE
        WHEN last_autovacuum IS NULL THEN '⚠️ Never auto-vacuumed'
        WHEN last_autovacuum < NOW() - INTERVAL '7 days' THEN '⚠️ Stale (>7 days)'
        WHEN last_autovacuum < NOW() - INTERVAL '1 day' THEN '✅ Recent (1-7 days)'
        ELSE '🚀 Very recent (<24h)'
    END as autovacuum_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN ('company_users', 'team_invitations', 'admin_invitations')
ORDER BY last_autovacuum DESC NULLS LAST;

-- Expected: company_users should autovacuum more frequently now
-- Our tuning: autovacuum_vacuum_scale_factor = 0.05 (5% threshold)


-- =============================================================================
-- 11. DAILY HEALTH SUMMARY
-- Single query dashboard for quick health check
-- =============================================================================
WITH metrics AS (
    SELECT
        'RLS Coverage' as metric,
        COUNT(*) FILTER (WHERE rowsecurity = true)::text || '/' || COUNT(*)::text as value,
        CASE WHEN COUNT(*) FILTER (WHERE rowsecurity = false) = 0 THEN '✅' ELSE '❌' END as status
    FROM pg_tables
    WHERE schemaname = 'public'

    UNION ALL

    SELECT
        'Cache Hit Ratio' as metric,
        ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2)::text || '%' as value,
        CASE
            WHEN ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2) >= 99 THEN '✅'
            WHEN ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2) >= 95 THEN '⚠️'
            ELSE '❌'
        END as status
    FROM pg_statio_user_indexes
    WHERE schemaname = 'public'

    UNION ALL

    SELECT
        'High Bloat Tables' as metric,
        COUNT(*)::text as value,
        CASE
            WHEN COUNT(*) = 0 THEN '✅'
            WHEN COUNT(*) <= 2 THEN '⚠️'
            ELSE '❌'
        END as status
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
        AND n_live_tup > 0
        AND (100.0 * n_dead_tup / (n_live_tup + n_dead_tup)) > 20

    UNION ALL

    SELECT
        'Unused Indexes' as metric,
        COUNT(*)::text as value,
        CASE
            WHEN COUNT(*) = 0 THEN '✅'
            WHEN COUNT(*) <= 5 THEN '⚠️'
            ELSE '❌'
        END as status
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
        AND idx_scan = 0
        AND indexrelname NOT LIKE 'pg_%'
)
SELECT * FROM metrics;

-- Run this daily for a quick health check


-- =============================================================================
-- 12. PERFORMANCE COMPARISON BASELINE
-- Save this output to compare against future runs
-- =============================================================================
SELECT
    NOW() as measured_at,
    'company_users' as table_name,
    seq_scan,
    idx_scan,
    ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_pct,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND relname = 'company_users'

UNION ALL

SELECT
    NOW(),
    'project_phases',
    seq_scan,
    idx_scan,
    ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2),
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2)
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND relname = 'project_phases'

UNION ALL

SELECT
    NOW(),
    'tasks',
    seq_scan,
    idx_scan,
    ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2),
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2)
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND relname = 'tasks';

-- Save this output and compare weekly
-- Expected improvements:
-- - company_users: seq_scan_pct should decrease (was ~100%)
-- - company_users: dead_pct should stay <10% (was 77.78%)
-- - project_phases: seq_scan_pct should decrease (was 57%)


-- =============================================================================
-- RESET STATISTICS (Use with caution!)
-- Uncomment to reset statistics for fresh baseline
-- =============================================================================
-- SELECT pg_stat_reset();
-- Only run this if you want to reset all statistics counters


-- =============================================================================
-- MONITORING SCHEDULE RECOMMENDATION
-- =============================================================================
/*
Daily (first week after changes):
- Query #2: New Index Usage Tracking
- Query #3: Table Bloat Monitor
- Query #11: Daily Health Summary

Weekly (ongoing):
- Query #4: Sequential Scan Ratio
- Query #6: Query Performance - Top Slow Queries
- Query #12: Performance Comparison Baseline

Monthly:
- Query #7: Index Size and Efficiency (identify bloat)
- Query #8: Table Size Trends (plan capacity)
- Full audit review

Alert Thresholds:
- Dead tuple % > 20%: Immediate action required
- Sequential scan ratio > 80%: Review query patterns
- Cache hit ratio < 95%: Investigate
- Mean query time > 100ms: Optimize query
*/
