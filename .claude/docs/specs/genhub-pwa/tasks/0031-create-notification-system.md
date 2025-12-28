# E5-T1: Create Notification System

**Epic**: Polish & Testing (Week 9-10)
**Effort**: Medium
**References**: Req 27 (Notifications), Design Section 4.5

## Description

Create comprehensive notification system with server actions, utility functions, and integration into existing actions for automatic notification creation.

## Subtasks

### 1.1 Create notification server actions
- Create `app/actions/notifications.ts`
- Implement: getNotifications(), markAsRead(), markAllAsRead()
- Fetch unread count for badge
- **Refs:** Req 27.4-27.8 (Notification Display), Design Section 4.5
- **Effort:** M
- **Files:** `app/actions/notifications.ts`

### 1.2 Create notification creation utility
- Create `lib/notifications.ts` utility
- Helper function to create notifications
- Support all notification types
- Called from other server actions when events occur
- **Refs:** Req 27.1, 27.6 (Notification Triggers), Design Section 4.5
- **Effort:** M
- **Files:** `lib/notifications.ts`

### 1.3 Integrate notifications into existing actions
- Update task actions to create notifications on: assignment, completion, overdue, blocked
- Update team actions to create notifications on: invitation
- Update project actions to create notifications on: updates
- **Refs:** Req 27.6 (Notification Triggers), Design Section 4.5
- **Effort:** M
- **Files:** `app/actions/tasks.ts`, `app/actions/team.ts`, `app/actions/projects.ts`

## Acceptance Criteria

- [ ] Notification actions fetch and manage notifications
- [ ] Unread count displays correctly
- [ ] Mark as read functionality works
- [ ] Utility function creates all notification types
- [ ] Task events trigger notifications
- [ ] Team events trigger notifications
- [ ] Project events trigger notifications

## Files to Create/Modify

- `app/actions/notifications.ts`
- `lib/notifications.ts`
- `app/actions/tasks.ts`
- `app/actions/team.ts`
- `app/actions/projects.ts`
