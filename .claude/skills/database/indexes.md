# Skill: Database Indexes

> Index optimization patterns for GenHub

## When to Use

- Creating new tables (always index FKs)
- Query performance issues (slow queries, sequential scans)
- Adding search functionality
- Optimizing filtered queries
- Dashboard/list views with filters

## Prerequisites

- Know query patterns for the table (check EXPLAIN ANALYZE)
- Check existing indexes before adding (avoid duplicates)
- Use `mcp__supabase__get_advisors(type: "performance")` for recommendations

---

## Quick Reference

### Standard FK Index
```sql
CREATE INDEX idx_{table}_{column} ON public.{table}({column});

-- Examples
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_expenses_task ON public.expenses(task_id);
```

### Composite Index (Multi-Column)
```sql
-- Order matters: most selective first, or match query order
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status);

-- For query: WHERE project_id = ? AND status = ?
```

### Partial Index (Filtered)
```sql
-- Only index rows matching condition
CREATE INDEX idx_tasks_active ON public.tasks(project_id)
WHERE status NOT IN ('completed', 'cancelled');

-- Only index non-deleted
CREATE INDEX idx_tasks_not_deleted ON public.tasks(project_id)
WHERE deleted_at IS NULL;
```

### Unique Index
```sql
CREATE UNIQUE INDEX idx_company_users_unique
ON public.company_users(user_id, company_id);
```

### Text Search Index
```sql
-- GIN index for full-text search
CREATE INDEX idx_tasks_search ON public.tasks
USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### JSON Index
```sql
-- Index specific JSON path
CREATE INDEX idx_projects_metadata_type
ON public.projects((metadata->>'type'));

-- GIN for flexible JSON queries
CREATE INDEX idx_projects_metadata_gin
ON public.projects USING GIN (metadata);
```

---

## Index Strategy by Table Type

### High-Write Tables (tasks, expenses, chat_messages)
```sql
-- Minimal indexes, only essential FKs
CREATE INDEX idx_{table}_fk ON public.{table}(foreign_key_id);

-- Avoid: Over-indexing slows writes
```

### High-Read Tables (projects, phases, users)
```sql
-- More indexes acceptable
CREATE INDEX idx_projects_company ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_company_status ON public.projects(company_id, status);
```

### Lookup Tables (enums, categories)
```sql
-- Usually just primary key is enough
-- Small tables don't benefit from additional indexes
```

---

## Step-by-Step: Analyze & Optimize

### 1. Check Existing Indexes via MCP
```
mcp__supabase__execute_sql(
  query: "SELECT schemaname, tablename, indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = '{table}'
          ORDER BY indexname;"
)
```

### 2. Analyze Query Performance
```
mcp__supabase__execute_sql(
  query: "EXPLAIN ANALYZE
          SELECT * FROM tasks
          WHERE project_id = 'uuid' AND status = 'in_progress';"
)
```

### 3. Look for Sequential Scans
```
Seq Scan on tasks  -- ❌ BAD: Full table scan
Index Scan using idx_tasks_project on tasks  -- ✅ GOOD: Using index
Bitmap Heap Scan  -- ⚠️ OK: Multiple index usage (can be optimized)
```

### 4. Consider RPC Function Alternative

**Before adding complex indexes**, consider if RPC function would be better:

```sql
-- OPTION A: Complex composite index
CREATE INDEX idx_tasks_project_status_date
  ON tasks(project_id, status, due_date);
-- Problem: Large index, only helps this specific query

-- OPTION B: RPC function with server-side aggregation
CREATE OR REPLACE FUNCTION get_project_dashboard(p_project_id uuid)
RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'tasks', (
      SELECT jsonb_agg(t.*)
      FROM tasks t
      WHERE t.project_id = p_project_id
    ),
    'stats', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'completed', COUNT(*) FILTER (WHERE status = 'completed')
      )
      FROM tasks
      WHERE project_id = p_project_id
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
-- Benefits: 4 queries → 1, server-side aggregation, smaller indexes
```

**Use RPC when:**
- Multiple related queries executed together
- Complex aggregations needed
- Fetching related data from multiple tables
- Query is used frequently (dashboard, detail pages)

**Example from projects module**: `get_project_with_full_stats()` RPC function reduced 4 queries + JS aggregation (~500ms) to 1 query (~50ms).

### 5. Add Missing Index via MCP
```
mcp__supabase__apply_migration(
  name: "add_idx_{table}_{column}",
  query: "CREATE INDEX IF NOT EXISTS idx_{table}_{column}
          ON public.{table}({column});

          COMMENT ON INDEX idx_{table}_{column} IS 'Optimizes {description of query pattern}';"
)
```

### 6. Save Migration
```bash
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_idx_{table}_{column}.sql << 'EOF'
-- [Your SQL here]
EOF
```

### 7. Verify Improvement
```
mcp__supabase__execute_sql(
  query: "EXPLAIN ANALYZE [same query];"
)
-- Should show Index Scan now, faster execution time
```

### 8. Check Performance Advisors
```
mcp__supabase__get_advisors(type: "performance")
```

---

## Examples

### Tasks Table (Comprehensive)
```sql
-- Essential FK indexes
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_phase ON public.tasks(phase_id);

-- Status filtering (common query)
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- Composite for dashboard queries
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status);

-- Due date for upcoming tasks
CREATE INDEX idx_tasks_due ON public.tasks(due_date)
WHERE due_date IS NOT NULL AND status != 'completed';
```

### Expenses Table
```sql
CREATE INDEX idx_expenses_task ON public.expenses(task_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_date ON public.expenses(created_at);

-- For expense reports by date range
CREATE INDEX idx_expenses_task_date ON public.expenses(task_id, created_at);
```

### Chat Messages (Time-Series)
```sql
-- Primary query: recent messages in room
CREATE INDEX idx_messages_room_time ON public.chat_messages(room_id, created_at DESC);

-- Don't index: sender_id (rarely queried alone)
```

---

## Anti-Patterns

```sql
-- WRONG: Index every column
CREATE INDEX idx_1 ON tasks(title);
CREATE INDEX idx_2 ON tasks(description);
CREATE INDEX idx_3 ON tasks(created_at);
-- Slows writes, wastes storage

-- WRONG: Duplicate indexes
CREATE INDEX idx_a ON tasks(project_id);
CREATE INDEX idx_b ON tasks(project_id, status);
-- idx_a is redundant (idx_b covers project_id queries)

-- WRONG: Index on low-cardinality column alone
CREATE INDEX idx_bool ON tasks(is_active);  -- Only 2 values!
-- BETTER: Partial index
CREATE INDEX idx_active ON tasks(project_id) WHERE is_active = true;

-- WRONG: Not using CONCURRENTLY for production
CREATE INDEX idx_big ON large_table(col);  -- Locks table!
-- CORRECT
CREATE INDEX CONCURRENTLY idx_big ON large_table(col);
```

---

## Monitoring

### Index Usage Stats
```sql
SELECT
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Unused Indexes
```sql
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';
```

### Index Size
```sql
SELECT
  indexrelname,
  pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Affected Documentation

After index changes:
- Note in migration file comment
- Update `docs/indexes/tables.md` if significant

---

## Checklist

- [ ] **MCP ONLY**: Indexes created via `mcp__supabase__apply_migration`
- [ ] Existing indexes checked to avoid duplicates
- [ ] Query patterns analyzed with EXPLAIN ANALYZE
- [ ] FK columns indexed
- [ ] Considered RPC function alternative for complex queries
- [ ] Partial indexes used for filtered queries (WHERE clause)
- [ ] CONCURRENTLY used for large tables (>1M rows)
- [ ] COMMENT ON INDEX added for documentation
- [ ] Performance improvement verified with EXPLAIN ANALYZE
- [ ] Performance advisors checked
- [ ] Migration SQL saved to `supabase/migrations/`
