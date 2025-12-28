# E1-T3: Create Database Schema - Tasks

**Epic**: Foundation (Week 1-2)
**Effort**: Medium
**References**: Req 9-11 (Tasks), Design Section 3.8-3.10

## Description

Create comprehensive task management schema including task statuses, priorities, dependencies, and activity logging for complete task lifecycle tracking.

## Subtasks

### 3.1 Create task_status and task_priority enums
- Create migration file `supabase/migrations/009_task_enums.sql`
- task_status: todo, in_progress, review, blocked, completed
- task_priority: low, medium, high, critical
- **Refs:** Req 9.4-9.5 (Task Status/Priority), Design Section 3.8
- **Effort:** S
- **Files:** `supabase/migrations/009_task_enums.sql`

### 3.2 Create tasks table with assignment and cost tracking
- Create migration file `supabase/migrations/010_tasks.sql`
- Include columns: id, project_id, phase_id, title, description, status, priority, assignee_id, due_date, planned_cost, actual_cost, blocker_reason, created_by, timestamps
- Enable RLS inheriting from project
- Add policies for task creators and assignees
- Create indexes on project_id, phase_id, assignee_id, status
- **Refs:** Req 9 (Task Creation), Req 11 (Task Detail), Design Section 3.8
- **Effort:** M
- **Files:** `supabase/migrations/010_tasks.sql`

### 3.3 Create task_dependencies table
- Create migration file `supabase/migrations/011_task_dependencies.sql`
- Include columns: id, task_id, depends_on_task_id, created_at
- Add check constraint to prevent self-dependencies
- Enable RLS inheriting from task
- **Refs:** Req 9.9 (Task Dependencies), Design Section 3.9
- **Effort:** S
- **Files:** `supabase/migrations/011_task_dependencies.sql`

### 3.4 Create task_activity table for audit logging
- Create migration file `supabase/migrations/012_task_activity.sql`
- Include columns: id, task_id, user_id, action, old_value, new_value, comment, created_at
- Enable RLS inheriting from task
- Create indexes on task_id and created_at
- **Refs:** Req 11.4 (Activity History), Design Section 3.10
- **Effort:** S
- **Files:** `supabase/migrations/012_task_activity.sql`

## Acceptance Criteria

- [ ] Task enums properly define all statuses and priorities
- [ ] Tasks table supports full lifecycle management
- [ ] Dependencies table prevents circular references
- [ ] Activity logging captures all task changes
- [ ] RLS policies properly restrict access
- [ ] Indexes optimize query performance for task lists

## Files to Create/Modify

- `supabase/migrations/009_task_enums.sql`
- `supabase/migrations/010_tasks.sql`
- `supabase/migrations/011_task_dependencies.sql`
- `supabase/migrations/012_task_activity.sql`
