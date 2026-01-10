# Skill: Database Indexes

> Index optimization patterns for GenHub

## When to Use

- Creating new tables (always index FKs)
- Query performance issues
- Adding search functionality
- Optimizing filtered queries

## Prerequisites

- Know query patterns for the table
- Check existing indexes before adding

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

### 1. Check Existing Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = '{table}';
```

### 2. Analyze Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE project_id = 'uuid' AND status = 'in_progress';
```

### 3. Look for Sequential Scans
```
Seq Scan on tasks  -- BAD: Full table scan
Index Scan on idx_tasks_project  -- GOOD: Using index
```

### 4. Add Missing Index
```
mcp__supabase__apply_migration
name: "add_idx_{table}_{column}"
query: "CREATE INDEX idx_{table}_{column} ON public.{table}({column});"
```

### 5. Verify Improvement
```sql
EXPLAIN ANALYZE [same query]
-- Should show Index Scan now
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

- [ ] FK columns indexed
- [ ] Query patterns analyzed
- [ ] No duplicate indexes
- [ ] Partial indexes for filtered queries
- [ ] CONCURRENTLY used for large tables
- [ ] Performance verified with EXPLAIN ANALYZE
