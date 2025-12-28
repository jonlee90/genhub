# E4-T8: Implement Mobile Responsive Design

**Epic**: Team & PWA (Week 7-8)
**Effort**: Medium
**References**: Req 29 (Mobile Responsiveness), Design Section 5.2-5.3

## Description

Optimize all major components for mobile devices with responsive sidebar, mobile-friendly Metro Journey and Kanban board, and mobile-optimized forms.

## Subtasks

### 8.1 Create responsive sidebar with mobile drawer
- Update `components/app/Sidebar.tsx`
- Hide sidebar on mobile, show hamburger menu
- Implement slide-out drawer on mobile
- Close drawer on navigation
- **Refs:** Req 2.4 (Mobile Hamburger), Req 29.2 (Mobile Navigation), Design Section 5.2
- **Effort:** M
- **Files:** `components/app/Sidebar.tsx`, `components/app/MobileDrawer.tsx`

### 8.2 Make Metro Journey mobile-friendly
- Update `components/projects/MetroJourney.tsx`
- Horizontal scroll container on mobile
- Larger touch targets for phase stations (44x44px minimum)
- Swipe gesture support
- **Refs:** Req 8.8 (Mobile Metro), Req 29.4 (Mobile Metro), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/MetroJourney.tsx`

### 8.3 Make Kanban board mobile-friendly
- Update `components/tasks/KanbanBoard.tsx`
- Single column view on mobile with status tabs
- Touch-optimized drag and drop
- Swipe between columns
- **Refs:** Req 10.10 (Mobile Kanban), Req 29.5 (Mobile Kanban), Design Section 5.3
- **Effort:** M
- **Files:** `components/tasks/KanbanBoard.tsx`

### 8.4 Create mobile-optimized forms
- Review all forms for mobile usability
- Use appropriate input types (date, number, tel)
- Ensure tap targets are 44x44px minimum
- Test camera access for photo uploads
- **Refs:** Req 29.3, 29.6-29.8 (Mobile Forms), Design Section 5.2
- **Effort:** M
- **Files:** Various form components

## Acceptance Criteria

- [ ] Sidebar collapses to hamburger menu on mobile
- [ ] Mobile drawer opens/closes smoothly
- [ ] Metro Journey scrolls horizontally on mobile
- [ ] Phase stations have proper touch targets
- [ ] Kanban board displays single column on mobile
- [ ] Swipe gestures work correctly
- [ ] Forms use appropriate mobile input types
- [ ] All tap targets meet 44x44px minimum
- [ ] App is fully functional on mobile devices

## Files to Create/Modify

- `components/app/Sidebar.tsx`
- `components/app/MobileDrawer.tsx`
- `components/projects/MetroJourney.tsx`
- `components/tasks/KanbanBoard.tsx`
- Various form components
