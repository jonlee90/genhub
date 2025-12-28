# E5-T4: Write Unit Tests for Server Actions

**Epic**: Polish & Testing (Week 9-10)
**Effort**: Medium
**References**: Design Section 9, 9.1

## Description

Set up Vitest testing environment and write comprehensive unit tests for all server actions including projects, tasks, and team management.

## Subtasks

### 4.1 Set up Vitest testing environment
- Configure Vitest for Next.js
- Set up mocks for Supabase client
- Set up mocks for auth
- Create test utilities
- **Refs:** Design Section 9
- **Effort:** M
- **Files:** `vitest.config.ts`, `__tests__/setup.ts`

### 4.2 Write tests for project server actions
- Test createProject with valid/invalid data
- Test permission checks
- Test updateProject and updateProjectStatus
- **Refs:** Req 6-7 (Projects), Design Section 9.1
- **Effort:** M
- **Files:** `__tests__/actions/projects.test.ts`

### 4.3 Write tests for task server actions
- Test createTask with valid/invalid data
- Test updateTaskStatus with all transitions
- Test dependency management
- Test activity logging
- **Refs:** Req 9-11 (Tasks), Design Section 9.1
- **Effort:** M
- **Files:** `__tests__/actions/tasks.test.ts`

### 4.4 Write tests for team server actions
- Test inviteTeamMember with valid/invalid data
- Test duplicate email handling
- Test role change and deactivation
- **Refs:** Req 4 (Team), Design Section 9.1
- **Effort:** M
- **Files:** `__tests__/actions/team.test.ts`

## Acceptance Criteria

- [ ] Vitest configured and running
- [ ] All project actions tested
- [ ] All task actions tested
- [ ] All team actions tested
- [ ] Permission checks tested
- [ ] Validation tested
- [ ] All tests pass

## Files to Create/Modify

- `vitest.config.ts`
- `__tests__/setup.ts`
- `__tests__/actions/projects.test.ts`
- `__tests__/actions/tasks.test.ts`
- `__tests__/actions/team.test.ts`
