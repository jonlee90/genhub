# E2-T6: Create Project Settings and Team Management

**Epic**: Projects (Week 3-4)
**Effort**: Medium
**References**: Req 6 (Projects), Design Section 5.2

## Description

Create components for project settings editing and project team member management with proper role-based access controls.

## Subtasks

### 6.1 Create project settings tab component
- Create `components/projects/ProjectSettings.tsx`
- Allow editing project details (name, dates, budget)
- Show project status with change option
- Display audit info (created by, created at)
- **Refs:** Req 6 (Project Management), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/ProjectSettings.tsx`

### 6.2 Create project team management component
- Create `components/projects/ProjectTeam.tsx`
- Display current team members with roles
- Add team member selector from company users
- Remove team member option for GC/PM
- **Refs:** Req 6.10 (Team Assignment), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/ProjectTeam.tsx`

## Acceptance Criteria

- [ ] Project settings form displays all editable fields
- [ ] Settings changes save correctly
- [ ] Only authorized users can edit settings
- [ ] Team management shows current members
- [ ] Can add team members from company users
- [ ] Can remove team members (with permissions)
- [ ] Changes trigger appropriate notifications

## Files to Create/Modify

- `components/projects/ProjectSettings.tsx`
- `components/projects/ProjectTeam.tsx`
