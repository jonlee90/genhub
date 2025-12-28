# E5-T5: Write Component Tests

**Epic**: Polish & Testing (Week 9-10)
**Effort**: Medium
**References**: Design Section 9, 9.2

## Description

Set up React Testing Library and write component tests for core layout, project, and task components.

## Subtasks

### 5.1 Set up React Testing Library
- Configure RTL with Vitest
- Create custom render with providers
- **Refs:** Design Section 9
- **Effort:** S
- **Files:** `__tests__/test-utils.tsx`

### 5.2 Write tests for core layout components
- Test Sidebar navigation and active states
- Test Header user menu
- Test NotificationBell dropdown
- **Refs:** Req 2 (Navigation), Design Section 9.2
- **Effort:** M
- **Files:** `__tests__/components/app/*.test.tsx`

### 5.3 Write tests for project components
- Test ProjectCard rendering
- Test ProjectFilters state management
- Test MetroJourney phase display
- **Refs:** Req 7-8 (Projects), Design Section 9.2
- **Effort:** M
- **Files:** `__tests__/components/projects/*.test.tsx`

### 5.4 Write tests for task components
- Test TaskCard rendering with all states
- Test KanbanBoard column organization
- Test drag-and-drop interactions
- **Refs:** Req 10-11 (Tasks), Design Section 9.2
- **Effort:** M
- **Files:** `__tests__/components/tasks/*.test.tsx`

## Acceptance Criteria

- [ ] RTL configured with custom render
- [ ] Layout components tested
- [ ] Project components tested
- [ ] Task components tested
- [ ] All component states tested
- [ ] User interactions tested
- [ ] All tests pass

## Files to Create/Modify

- `__tests__/test-utils.tsx`
- `__tests__/components/app/Sidebar.test.tsx`
- `__tests__/components/app/Header.test.tsx`
- `__tests__/components/app/NotificationBell.test.tsx`
- `__tests__/components/projects/ProjectCard.test.tsx`
- `__tests__/components/projects/ProjectFilters.test.tsx`
- `__tests__/components/projects/MetroJourney.test.tsx`
- `__tests__/components/tasks/TaskCard.test.tsx`
- `__tests__/components/tasks/KanbanBoard.test.tsx`
