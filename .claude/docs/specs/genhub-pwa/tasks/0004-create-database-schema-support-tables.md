# E1-T4: Create Database Schema - Support Tables

**Epic**: Foundation (Week 1-2)
**Effort**: Medium
**References**: Req 27 (Notifications), Design Section 3.11-3.12

## Description

Create supporting database tables for notifications and file attachments that will be used across the application.

## Subtasks

### 4.1 Create notifications table
- Create migration file `supabase/migrations/013_notifications.sql`
- Create notification_type enum: task_assigned, task_completed, task_overdue, task_blocked, project_update, team_invited, mention
- Include columns: id, user_id, type, title, message, link, read, created_at
- Enable RLS for user-only access
- Create indexes on user_id, read, created_at
- **Refs:** Req 27 (Notification System), Design Section 3.11
- **Effort:** M
- **Files:** `supabase/migrations/013_notifications.sql`

### 4.2 Create attachments table for file storage metadata
- Create migration file `supabase/migrations/014_attachments.sql`
- Include columns: id, entity_type, entity_id, file_name, file_url, file_type, file_size, uploaded_by, created_at
- entity_type enum: task, project, phase, profile
- Enable RLS with entity-based access control
- **Refs:** Req 11.10 (Task Attachments), Design Section 3.12
- **Effort:** M
- **Files:** `supabase/migrations/014_attachments.sql`

## Acceptance Criteria

- [ ] Notifications table supports all notification types
- [ ] RLS ensures users only see their own notifications
- [ ] Attachments table supports polymorphic associations
- [ ] Indexes optimize notification queries
- [ ] Entity-based access control properly configured

## Files to Create/Modify

- `supabase/migrations/013_notifications.sql`
- `supabase/migrations/014_attachments.sql`
