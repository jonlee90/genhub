# E1-T8: Create Core Application Layout

**Epic**: Foundation (Week 1-2)
**Effort**: Medium
**References**: Req 2 (Dashboard/Navigation), Design Section 5.1-5.2

## Description

Create the authenticated app layout structure with sidebar navigation, header with user menu, and notification bell component.

## Subtasks

### 8.1 Create authenticated app layout with sidebar
- Create `app/app/layout.tsx` with sidebar and header structure
- Import and configure providers (Session, Theme)
- Set up responsive layout (desktop sidebar, mobile hamburger)
- **Refs:** Req 2.2-2.4 (Navigation), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/layout.tsx`

### 8.2 Implement Sidebar navigation component
- Create `components/app/Sidebar.tsx`
- Add navigation items: Dashboard, Projects, Tasks, Team, Settings
- Implement active state highlighting based on pathname
- Support collapsible state for mobile
- **Refs:** Req 2.2 (Sidebar Navigation), Req 2.8 (Active Highlighting), Design Section 5.2
- **Effort:** M
- **Files:** `components/app/Sidebar.tsx`

### 8.3 Implement Header component with user menu
- Create `components/app/Header.tsx`
- Include company logo/name display
- Add notification bell component
- Add user avatar dropdown with sign-out option
- **Refs:** Req 2.2 (Dashboard Header), Design Section 5.2
- **Effort:** M
- **Files:** `components/app/Header.tsx`, `components/app/UserMenu.tsx`

### 8.4 Implement NotificationBell dropdown component
- Create `components/app/NotificationBell.tsx`
- Show unread count badge
- Display notification list in dropdown
- Mark notifications as read on click
- **Refs:** Req 27.4-27.5 (In-app Notifications), Design Section 5.2
- **Effort:** M
- **Files:** `components/app/NotificationBell.tsx`

## Acceptance Criteria

- [ ] App layout properly renders sidebar and main content area
- [ ] Sidebar navigation works on both desktop and mobile
- [ ] Active route is highlighted in sidebar
- [ ] Header displays company info and user menu
- [ ] Notification bell shows unread count
- [ ] User can sign out from user menu
- [ ] Layout is responsive across all screen sizes

## Files to Create/Modify

- `app/app/layout.tsx`
- `components/app/Sidebar.tsx`
- `components/app/Header.tsx`
- `components/app/UserMenu.tsx`
- `components/app/NotificationBell.tsx`
