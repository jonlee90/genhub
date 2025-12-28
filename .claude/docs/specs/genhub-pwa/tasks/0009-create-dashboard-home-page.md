# E1-T9: Create Dashboard Home Page

**Epic**: Foundation (Week 1-2)
**Effort**: Large
**References**: Req 2 (Dashboard), Design Section 5.1-5.2

## Description

Create the dashboard home page with role-based content, dashboard widgets for key metrics, and activity feed for recent updates.

## Subtasks

### 9.1 Create dashboard page with role-based content
- Create `app/app/page.tsx` as Server Component
- Fetch user's company and role
- Display role-appropriate widgets
- Show onboarding message if no projects exist
- **Refs:** Req 2.1 (Role-appropriate Dashboard), Req 2.7 (No Projects State), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/page.tsx`

### 9.2 Create dashboard widgets components
- Create `components/app/DashboardWidgets.tsx`
- Implement: ProjectListWidget, HealthScoresWidget, PendingApprovalsWidget, BudgetOverviewWidget, ActivityFeedWidget
- Each widget fetches own data via Server Component
- **Refs:** Req 2.6 (Dashboard Widgets), Design Section 5.2
- **Effort:** L
- **Files:** `components/app/DashboardWidgets.tsx`, `components/app/widgets/*.tsx`

### 9.3 Create activity feed component
- Create `components/app/ActivityFeed.tsx`
- Show recent updates across projects, tasks
- Include timestamp and user avatar
- Link to relevant items on click
- **Refs:** Req 2.10 (Activity Feed), Design Section 5.2
- **Effort:** M
- **Files:** `components/app/ActivityFeed.tsx`

## Acceptance Criteria

- [ ] Dashboard displays role-appropriate widgets
- [ ] All widgets show accurate real-time data
- [ ] Empty state shown when no projects exist
- [ ] Activity feed displays recent updates
- [ ] Activity items link to source pages
- [ ] Dashboard is performant with Suspense loading
- [ ] Widgets are responsive on mobile

## Files to Create/Modify

- `app/app/page.tsx`
- `components/app/DashboardWidgets.tsx`
- `components/app/widgets/ProjectListWidget.tsx`
- `components/app/widgets/HealthScoresWidget.tsx`
- `components/app/widgets/PendingApprovalsWidget.tsx`
- `components/app/widgets/BudgetOverviewWidget.tsx`
- `components/app/ActivityFeed.tsx`
