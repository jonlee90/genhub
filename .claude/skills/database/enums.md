# Skill: Enum Management

> PostgreSQL enum types for GenHub

## When to Use

- Creating fixed sets of values (status, priority, role)
- Ensuring data integrity
- Adding new values to existing enums

## Prerequisites

- Check `docs/indexes/enums.md` for existing enums
- Enums are defined in `types/database.types.ts`

---

## Quick Reference

### Create New Enum
```sql
CREATE TYPE public.{enum_name} AS ENUM (
  'value1',
  'value2',
  'value3'
);

-- Example: Task priority
CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Use in column
ALTER TABLE public.tasks
ADD COLUMN priority public.task_priority DEFAULT 'medium';
```

### Add Value to Existing Enum
```sql
-- Add at end (safest)
ALTER TYPE public.task_status ADD VALUE 'on_hold';

-- Add in specific position
ALTER TYPE public.task_status ADD VALUE 'review' BEFORE 'completed';
ALTER TYPE public.task_status ADD VALUE 'blocked' AFTER 'in_progress';
```

### List Enum Values
```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'public.task_status'::regtype
ORDER BY enumsortorder;
```

---

## GenHub Standard Enums

### Task Status
```sql
CREATE TYPE public.task_status AS ENUM (
  'todo',
  'in_progress',
  'blocked',
  'review',
  'completed',
  'cancelled'
);
```

### Task Priority
```sql
CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);
```

### Project Status
```sql
CREATE TYPE public.project_status AS ENUM (
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled'
);
```

### User Role
```sql
CREATE TYPE public.user_role AS ENUM (
  'gc_admin',
  'project_manager',
  'field_worker',
  'subcontractor',
  'client',
  'viewer'
);
```

### Expense Status
```sql
CREATE TYPE public.expense_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'paid'
);
```

### Material Status
```sql
CREATE TYPE public.material_status AS ENUM (
  'pending',
  'ordered',
  'shipped',
  'delivered',
  'installed'
);
```

---

## Step-by-Step: Create Enum

### 1. Design Values
- Use lowercase, snake_case
- Start with minimal set (can add, hard to remove)
- Consider workflow order

### 2. Create Migration
```
mcp__supabase__apply_migration
name: "create_{enum_name}_enum"
query: "CREATE TYPE public.{enum_name} AS ENUM ('value1', 'value2');"
```

### 3. Use in Table
```sql
ALTER TABLE public.{table}
ADD COLUMN {column} public.{enum_name} DEFAULT 'value1';
```

### 4. Regenerate Types
```bash
source <(grep -E '^SUPABASE_' .env.local | xargs -I {} echo "export {}") && \
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

### 5. Update Documentation
- Add to `docs/indexes/enums.md`

---

## Examples

### Bid Status Enum
```sql
-- Migration: create_bid_status_enum
CREATE TYPE public.bid_status AS ENUM (
  'draft',
  'invited',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn'
);

-- Use in bids table
ALTER TABLE public.bids
ADD COLUMN status public.bid_status DEFAULT 'draft';
```

### Change Order Status
```sql
CREATE TYPE public.change_order_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'implemented'
);
```

### Notification Type
```sql
CREATE TYPE public.notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'mention',
  'deadline_approaching',
  'expense_approved',
  'chat_message'
);
```

---

## Anti-Patterns

```sql
-- WRONG: Using text with CHECK instead of enum
status text CHECK (status IN ('a', 'b', 'c'))
-- PROBLEM: No type safety, can't easily see valid values

-- WRONG: Too many values in enum
CREATE TYPE status AS ENUM ('v1', 'v2', ... 'v50');
-- PROBLEM: Hard to maintain, probably should be a lookup table

-- WRONG: Trying to remove enum value
ALTER TYPE status DROP VALUE 'old';  -- NOT SUPPORTED!
-- WORKAROUND: Create new enum, migrate data, drop old

-- WRONG: Renaming enum value
ALTER TYPE status RENAME VALUE 'old' TO 'new';  -- NOT SUPPORTED!
-- WORKAROUND: Add new value, update data, keep old for compatibility

-- WRONG: Not using DEFAULT
ADD COLUMN status task_status;  -- NULL by default
-- CORRECT
ADD COLUMN status task_status DEFAULT 'todo' NOT NULL;
```

---

## TypeScript Usage

### Type Definition (Auto-Generated)
```typescript
// In types/database.types.ts
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'review' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
```

### Using in Components
```typescript
const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  blocked: { label: 'Blocked', color: 'red' },
  review: { label: 'Review', color: 'yellow' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'gray' },
}
```

---

## Migrating Enum Values

When you need to rename/remove values:

```sql
-- 1. Create new enum
CREATE TYPE public.task_status_v2 AS ENUM ('todo', 'active', 'done');

-- 2. Add temporary column
ALTER TABLE tasks ADD COLUMN status_new task_status_v2;

-- 3. Migrate data
UPDATE tasks SET status_new = CASE
  WHEN status = 'in_progress' THEN 'active'::task_status_v2
  WHEN status = 'completed' THEN 'done'::task_status_v2
  ELSE 'todo'::task_status_v2
END;

-- 4. Swap columns
ALTER TABLE tasks DROP COLUMN status;
ALTER TABLE tasks RENAME COLUMN status_new TO status;

-- 5. Drop old enum
DROP TYPE public.task_status;
ALTER TYPE public.task_status_v2 RENAME TO task_status;
```

---

## Affected Documentation

After enum changes:
- Update `docs/indexes/enums.md`
- Regenerate `types/database.types.ts`
- Update component configs that use the enum

---

## Checklist

- [ ] Enum name is descriptive (table_column format)
- [ ] Values are lowercase snake_case
- [ ] DEFAULT value specified in column
- [ ] Types regenerated
- [ ] `docs/indexes/enums.md` updated
- [ ] TypeScript config objects updated
