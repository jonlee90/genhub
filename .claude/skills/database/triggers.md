# Skill: Database Triggers

> Trigger patterns for GenHub automation

## When to Use

- Auto-updating timestamps
- Maintaining derived data
- Enforcing complex constraints
- Audit logging
- Cascading updates

## Prerequisites

- Understand trigger timing (BEFORE/AFTER)
- Know trigger events (INSERT/UPDATE/DELETE)
- Check existing triggers on table

---

## Quick Reference

### Auto-Update Timestamp
```sql
-- Function (create once)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (per table)
CREATE TRIGGER update_{table}_timestamp
  BEFORE UPDATE ON public.{table}
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### Set Default Value
```sql
-- Auto-set company_id from project
CREATE OR REPLACE FUNCTION public.set_company_from_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL AND NEW.project_id IS NOT NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM projects WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_company
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_from_project();
```

### Audit Log
```sql
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
    (SELECT next_auth.uid())
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_changes();
```

---

## Common Trigger Patterns

### 1. updated_at Timestamp (Standard)
```sql
-- Apply to ALL tables with updated_at column
CREATE TRIGGER update_{table}_timestamp
  BEFORE UPDATE ON public.{table}
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Cascade Status Updates
```sql
-- When all subtasks complete, mark parent complete
CREATE OR REPLACE FUNCTION public.check_parent_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.parent_task_id IS NOT NULL THEN
    -- Check if all siblings are complete
    IF NOT EXISTS (
      SELECT 1 FROM tasks
      WHERE parent_task_id = NEW.parent_task_id
      AND id != NEW.id
      AND status != 'completed'
    ) THEN
      UPDATE tasks SET status = 'completed' WHERE id = NEW.parent_task_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Counter Cache
```sql
-- Update task count on project
CREATE OR REPLACE FUNCTION public.update_project_task_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET task_count = task_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET task_count = task_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_count
  AFTER INSERT OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_task_count();
```

### 4. Notification Trigger
```sql
-- Create notification on task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND
     (OLD IS NULL OR OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    INSERT INTO notifications (user_id, type, title, data)
    VALUES (
      NEW.assignee_id,
      'task_assigned',
      'New task assigned',
      jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_assignment
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment();
```

### 5. Soft Delete
```sql
-- Prevent actual delete, set deleted_at instead
CREATE OR REPLACE FUNCTION public.soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tasks SET deleted_at = NOW() WHERE id = OLD.id;
  RETURN NULL;  -- Prevent actual delete
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soft_delete_tasks
  BEFORE DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete();
```

---

## Step-by-Step: Create Trigger

### 1. Design Logic
- What event triggers it? (INSERT/UPDATE/DELETE)
- When should it run? (BEFORE/AFTER)
- Per row or per statement?

### 2. Create Function
```sql
CREATE OR REPLACE FUNCTION public.{function_name}()
RETURNS TRIGGER AS $$
BEGIN
  -- Guard against infinite recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Your logic here
  -- NEW = new row (INSERT/UPDATE)
  -- OLD = old row (UPDATE/DELETE)
  -- TG_OP = operation name ('INSERT', 'UPDATE', 'DELETE')

  RETURN NEW;  -- or OLD for DELETE, or NULL to abort
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.{function_name}() IS '{Description of what this trigger does}';
```

### 3. Create Trigger
```sql
CREATE TRIGGER {trigger_name}
  {BEFORE|AFTER} {INSERT|UPDATE|DELETE} ON public.{table}
  FOR EACH ROW
  EXECUTE FUNCTION public.{function_name}();

COMMENT ON TRIGGER {trigger_name} ON public.{table} IS '{When and why this fires}';
```

### 4. Apply via MCP
```
mcp__supabase__apply_migration(
  name: "create_{trigger_name}_trigger",
  query: "[Function + Trigger SQL]"
)
```

### 5. Save Migration
```bash
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_create_{trigger_name}_trigger.sql << 'EOF'
-- [Your SQL here]
EOF
```

### 6. Test
```
mcp__supabase__execute_sql(
  query: "-- Insert/update/delete and verify trigger fired
          INSERT INTO {table} (...) VALUES (...) RETURNING *;

          -- Check trigger effect
          SELECT * FROM {related_table} WHERE ...;"
)
```

### 7. Monitor Performance
```
mcp__supabase__get_advisors(type: "performance")
```

Check if trigger is causing slow writes.

---

## Examples

### Project Progress Calculation
```sql
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_tasks, completed_tasks
  FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  UPDATE projects
  SET completion_percentage = CASE
    WHEN total_tasks > 0 THEN (completed_tasks * 100 / total_tasks)
    ELSE 0
  END
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_project_progress
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_progress();
```

### Chat Unread Count
```sql
CREATE OR REPLACE FUNCTION public.update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread for all members except sender
  UPDATE chat_room_members
  SET unread_count = unread_count + 1
  WHERE room_id = NEW.room_id
  AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_unread
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unread_count();
```

---

## Anti-Patterns

```sql
-- WRONG: Heavy computation in trigger
-- Triggers should be fast, defer heavy work

-- WRONG: Recursive triggers without guard
UPDATE same_table SET ...  -- May trigger infinite loop!

-- CORRECT: Add guard condition
IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;

-- WRONG: External API calls in trigger
-- Triggers run in transaction, can't do HTTP calls

-- WRONG: Modifying other tables without considering RLS
-- Trigger runs as table owner, bypasses RLS
-- CORRECT: Use SECURITY DEFINER carefully
```

---

## Debugging Triggers

### List Triggers via MCP
```
mcp__supabase__execute_sql(
  query: "SELECT
            tgname as trigger_name,
            tgrelid::regclass as table_name,
            proname as function_name,
            CASE tgtype::integer & 1
              WHEN 1 THEN 'ROW' ELSE 'STATEMENT' END as level,
            CASE tgtype::integer & 66
              WHEN 2 THEN 'BEFORE'
              WHEN 64 THEN 'INSTEAD OF'
              ELSE 'AFTER' END as timing
          FROM pg_trigger
          JOIN pg_proc ON pg_proc.oid = tgfoid
          WHERE tgrelid = 'public.{table}'::regclass
          AND NOT tgisinternal;"
)
```

### Check Function Source
```
mcp__supabase__execute_sql(
  query: "SELECT
            p.proname as function_name,
            pg_get_functiondef(p.oid) as definition
          FROM pg_proc p
          WHERE p.proname = '{function_name}';"
)
```

### Disable/Enable Trigger
```sql
-- Temporarily disable for testing
ALTER TABLE public.{table} DISABLE TRIGGER {trigger_name};

-- Test without trigger
INSERT INTO public.{table} (...) VALUES (...);

-- Re-enable
ALTER TABLE public.{table} ENABLE TRIGGER {trigger_name};
```

### Performance Impact
```
mcp__supabase__get_advisors(type: "performance")
```

Check if trigger is causing slow writes (look for lock contention, long execution times).

---

## Affected Documentation

After trigger changes:
- Document in migration file comment
- Update `backend/SCHEMA_CORE.md` if business-critical

---

## Checklist

- [ ] **MCP ONLY**: Trigger created via `mcp__supabase__apply_migration`
- [ ] Function created with RETURNS TRIGGER
- [ ] Guard against infinite recursion (`pg_trigger_depth()`)
- [ ] Trigger timing correct (BEFORE/AFTER)
- [ ] Trigger events specified (INSERT/UPDATE/DELETE)
- [ ] Returns NEW, OLD, or NULL appropriately
- [ ] No external API calls (triggers run in transaction)
- [ ] No heavy computation (defer to background job if needed)
- [ ] COMMENT ON FUNCTION and COMMENT ON TRIGGER added
- [ ] Performance tested with realistic data
- [ ] Migration SQL saved to `supabase/migrations/`
- [ ] Migration includes both function and trigger
- [ ] Tested via `mcp__supabase__execute_sql`
