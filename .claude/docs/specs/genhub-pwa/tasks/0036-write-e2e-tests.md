# E5-T6: Write E2E Tests

**Epic**: Polish & Testing (Week 9-10)
**Effort**: Medium
**References**: Design Section 9, 9.3

## Description

Set up Playwright for end-to-end testing and write comprehensive E2E tests for critical user flows including authentication, project creation, and task management.

## Subtasks

### 6.1 Set up Playwright for E2E testing
- Configure Playwright
- Set up test database seeding
- Create authentication helpers
- **Refs:** Design Section 9
- **Effort:** M
- **Files:** `playwright.config.ts`, `e2e/setup.ts`

### 6.2 Write E2E test for authentication flow
- Test sign in / sign out
- Test protected route redirect
- Test new user onboarding
- **Refs:** Req 1 (Authentication), Design Section 9.3
- **Effort:** M
- **Files:** `e2e/auth.spec.ts`

### 6.3 Write E2E test for project creation flow
- Test creating new project with all fields
- Test project appearing in list
- Test project detail page with Metro Journey
- **Refs:** Req 6-8 (Projects), Design Section 9.3
- **Effort:** M
- **Files:** `e2e/projects.spec.ts`

### 6.4 Write E2E test for task management flow
- Test creating task from project
- Test drag-and-drop status change
- Test task detail editing
- **Refs:** Req 9-11 (Tasks), Design Section 9.3
- **Effort:** M
- **Files:** `e2e/tasks.spec.ts`

## Acceptance Criteria

- [ ] Playwright configured and running
- [ ] Test database seeding works
- [ ] Authentication flow tested
- [ ] Project creation flow tested
- [ ] Task management flow tested
- [ ] All critical paths covered
- [ ] All E2E tests pass

## Files to Create/Modify

- `playwright.config.ts`
- `e2e/setup.ts`
- `e2e/auth.spec.ts`
- `e2e/projects.spec.ts`
- `e2e/tasks.spec.ts`
