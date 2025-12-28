# E2-T1: Create Projects Server Actions

**Epic**: Projects (Week 3-4)
**Effort**: Medium
**References**: Req 6-7 (Projects), Design Section 4.1

## Description

Create server actions for project CRUD operations, status updates, and team assignment management with proper validation and permissions.

## Subtasks

### 1.1 Create project creation server action
- Create `app/actions/projects.ts`
- Implement createProject() with Zod validation
- Validate: name, client_name, address, project_type, start_date (required)
- Check user permissions (GC Admin or PM)
- Insert into projects table
- Revalidate `/app/projects` path
- **Refs:** Req 6.1-6.8 (Project Creation), Design Section 4.1
- **Effort:** M
- **Files:** `app/actions/projects.ts`

### 1.2 Create project update server action
- Add updateProject() to `app/actions/projects.ts`
- Support updating all editable fields
- Validate user has edit permissions
- Revalidate project detail and list paths
- **Refs:** Req 7 (Project Management), Design Section 4.1
- **Effort:** M
- **Files:** `app/actions/projects.ts`

### 1.3 Create project status update server action
- Add updateProjectStatus() to `app/actions/projects.ts`
- Support: active, on_hold, completed, archived
- Validate user permissions
- Revalidate relevant paths
- **Refs:** Req 7.4 (Status Filter), Design Section 4.1
- **Effort:** S
- **Files:** `app/actions/projects.ts`

### 1.4 Create project team assignment server actions
- Add assignProjectTeamMember() and removeProjectTeamMember()
- Validate project access and user existence
- Create notification for assigned user
- **Refs:** Req 6.10 (Team Assignment), Design Section 4.1
- **Effort:** M
- **Files:** `app/actions/projects.ts`

## Acceptance Criteria

- [ ] All server actions use Zod validation
- [ ] Permission checks enforce GC Admin/PM restrictions
- [ ] Actions revalidate affected paths
- [ ] Team assignments create notifications
- [ ] Error handling returns user-friendly messages
- [ ] All actions respect RLS policies

## Files to Create/Modify

- `app/actions/projects.ts`
