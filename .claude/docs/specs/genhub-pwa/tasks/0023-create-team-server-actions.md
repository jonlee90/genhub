# E4-T1: Create Team Server Actions

**Epic**: Team & PWA (Week 7-8)
**Effort**: Medium
**References**: Req 4 (Team Management), Design Section 4.3, 8.4

## Description

Create server actions for team member invitation, role management, deactivation, and invitation acceptance flow.

## Subtasks

### 1.1 Create team member invitation server action
- Create `app/actions/team.ts`
- Implement inviteTeamMember() with Zod validation
- Require: email, name, role; Only GC Admin can invite
- Check for existing user; Create placeholder if not exists
- Create company_users entry with status=invited
- Send invitation email with accept link
- **Refs:** Req 4.2-4.4 (Team Invitation), Design Section 4.3
- **Effort:** M
- **Files:** `app/actions/team.ts`

### 1.2 Create team member role update action
- Add updateTeamMemberRole() to `app/actions/team.ts`
- Only GC Admin can change roles
- Update role immediately in company_users
- Log activity
- **Refs:** Req 4.7 (Role Change), Design Section 4.3
- **Effort:** S
- **Files:** `app/actions/team.ts`

### 1.3 Create team member deactivation action
- Add deactivateTeamMember() to `app/actions/team.ts`
- Set status to inactive (preserve historical data)
- Revoke access immediately
- **Refs:** Req 4.8-4.9 (Deactivation), Design Section 4.3
- **Effort:** S
- **Files:** `app/actions/team.ts`

### 1.4 Create invitation acceptance flow
- Create `app/accept-invite/page.tsx`
- Validate invitation token
- Allow user to set password and complete profile
- Update status to active, set activated_at
- Redirect to dashboard
- **Refs:** Req 4.4 (Accept Invitation), Design Section 8.4
- **Effort:** M
- **Files:** `app/accept-invite/page.tsx`, `app/actions/team.ts`

## Acceptance Criteria

- [ ] Only GC Admins can invite team members
- [ ] Invitation emails sent with valid tokens
- [ ] Duplicate invitations prevented
- [ ] Role changes restricted to GC Admin
- [ ] Deactivation preserves historical data
- [ ] Invitation acceptance completes profile
- [ ] All actions respect RLS policies

## Files to Create/Modify

- `app/actions/team.ts`
- `app/accept-invite/page.tsx`
