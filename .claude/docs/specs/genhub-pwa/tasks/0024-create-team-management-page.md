# E4-T2: Create Team Management Page

**Epic**: Team & PWA (Week 7-8)
**Effort**: Medium
**References**: Req 4 (Team Management), Design Section 5.1-5.2

## Description

Create team management page with member table, role management, and team member invitation functionality.

## Subtasks

### 2.1 Create team page with member list
- Create `app/app/team/page.tsx` as Server Component
- Fetch all company_users for user's company
- Display TeamMemberTable component
- Show subcontractor directory link
- **Refs:** Req 4.1 (Team Management), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/team/page.tsx`

### 2.2 Create TeamMemberTable component
- Create `components/team/TeamMemberTable.tsx`
- Display: name, email, role, status (active/invited), project count
- Show role badge with color coding
- Action dropdown: Change Role, View Projects, Deactivate
- Sortable columns
- **Refs:** Req 4.6 (Team Display), Design Section 5.2
- **Effort:** M
- **Files:** `components/team/TeamMemberTable.tsx`

### 2.3 Create InviteTeamMemberModal component
- Create `components/team/InviteTeamMemberModal.tsx`
- Form fields: email, name, role selector
- Use useActionState with inviteTeamMember action
- Show success/error states
- Prevent duplicate invitations
- **Refs:** Req 4.2-4.5 (Invitation Form), Design Section 5.2
- **Effort:** M
- **Files:** `components/team/InviteTeamMemberModal.tsx`

## Acceptance Criteria

- [ ] Team page displays all company members
- [ ] Member table shows all required information
- [ ] Role badges are color-coded correctly
- [ ] Invitation modal validates input
- [ ] Duplicate invitations are prevented
- [ ] Action dropdowns work correctly
- [ ] Only GC Admins see admin actions

## Files to Create/Modify

- `app/app/team/page.tsx`
- `components/team/TeamMemberTable.tsx`
- `components/team/InviteTeamMemberModal.tsx`
