# TaskBoard Analytics Redesign - Implementation Tasks

## Status
- Design: [APPROVED](./design.md)
- Requirements: [APPROVED](./requirements.md)
- Tasks: DRAFT
- Planner: kiro-plan
- Date: 2026-01-03

---

## Overview

**Total tasks:** 11
**Estimated phases:** 5
**Agent breakdown:** 4 backend, 4 frontend, 3 review

**Complexity:** Medium (8-10 hours estimated)

**Key deliverables:**
- Remove DashboardStats from TaskBoard
- Create optimized `getTaskAnalytics()` server action
- Create TaskAnalyticsSection component with 10 InfoCard instances
- Click-to-filter functionality for interactive metrics
- Performance < 500ms for analytics query

---

## Phase 1: Database & Server Action

### 1.1 Create PostgreSQL analytics function
- **Agent**: backend-engineer
- **Files**: `supabase/migrations/20260103_create_task_analytics_function.sql`
- **Requirements**:
  - [ ] Create `get_task_analytics()` PostgreSQL function
  - [ ] Use single query with FILTER aggregations (PostgreSQL 9.4+)
  - [ ] Support `project_filter` parameter ('all' or project UUID)
  - [ ] Support `company_id` parameter for RLS filtering
  - [ ] Include all 10 analytics: completion, schedule, budget, blocked, workload, materials, priority, expenses, dependencies, velocity
  - [ ] Use CTEs for readability (filtered_tasks, task_stats, top_blockers, top_assignees, material_stats, expense_stats, dependency_stats)
  - [ ] Return single row with all aggregated metrics
  - [ ] Test query performance < 500ms for 1000 tasks
- **Acceptance**:
  - Function executes successfully in Supabase SQL editor
  - Returns correct data structure matching TypeScript interface
  - Performance target met (< 500ms)
- **Ref**: Design > API Specification > SQL Implementation (lines 316-482)

---

### 1.2 Implement getTaskAnalytics server action
- **Agent**: backend-engineer
- **Files**:
  - `app/actions/tasks.ts` (add function)
  - `types/analytics.ts` (new file for TaskAnalytics interface)
- **Requirements**:
  - [ ] Create TypeScript interface `TaskAnalytics` with all 10 metric structures
  - [ ] Implement `getTaskAnalytics(projectFilter: string, companyId: string)` server action
  - [ ] Call PostgreSQL `get_task_analytics()` via `supabase.rpc()`
  - [ ] Add Zod input validation (projectFilter: 'all' | UUID, companyId: UUID)
  - [ ] Add auth check (require session)
  - [ ] Transform database result to TaskAnalytics interface
  - [ ] Error handling with logging
  - [ ] Return `{ data?: TaskAnalytics, error?: string }` pattern
- **Acceptance**:
  - Server action returns analytics data matching interface
  - Auth check prevents unauthenticated access
  - Error cases handled gracefully (invalid input, DB failure)
  - No TypeScript errors
- **Ref**:
  - Design > API Specification > TypeScript Implementation (lines 485-576)
  - Design > Data Model > TypeScript Interfaces (lines 145-225)
- **Dependencies**: 1.1 (requires PostgreSQL function)

---

### 1.3 Verify database indexes
- **Agent**: backend-engineer
- **Files**: `supabase/migrations/20260103_verify_task_analytics_indexes.sql`
- **Requirements**:
  - [ ] Verify existing indexes on tasks table (status, due_date, assignee_id, priority, project_id, completed_at)
  - [ ] Create composite indexes if missing: `idx_tasks_company_project_status`, `idx_tasks_due_date_status`
  - [ ] Verify indexes on material_assignments (task_id, procurement_status)
  - [ ] Verify indexes on expenses (task_id, status)
  - [ ] Verify indexes on task_dependencies (task_id, depends_on_task_id)
  - [ ] Use `CREATE INDEX IF NOT EXISTS` or `CREATE INDEX CONCURRENTLY` for production safety
  - [ ] Test query plan with EXPLAIN ANALYZE
- **Acceptance**:
  - All required indexes exist
  - Query execution plan shows index usage (no sequential scans on large tables)
  - Performance target maintained (< 500ms)
- **Ref**: Design > Data Model > Database Schema (lines 237-258)
- **Dependencies**: 1.1 (function must exist to test query plan)

---

### 1.4 Code review: Database & Server Action
- **Agent**: code-reviewer
- **Files**: All files from Phase 1
- **Requirements**:
  - [ ] Verify SQL function uses FILTER aggregations (not multiple queries)
  - [ ] Verify company_id filtering prevents data leaks
  - [ ] Verify Zod schema validates inputs correctly
  - [ ] Verify auth check prevents unauthenticated access
  - [ ] Verify error messages don't expose sensitive data
  - [ ] Test with edge cases: no tasks, single project, all filters
  - [ ] Run `npm run build` to verify no TypeScript errors
  - [ ] Test performance with simulated 1000 tasks
- **Acceptance**:
  - Security audit passed (RLS pattern enforced)
  - No TypeScript/build errors
  - Performance SLA met (< 500ms)
  - Edge cases handled gracefully
- **Ref**: Design > Security Considerations (lines 1414-1449)
- **Dependencies**: 1.1, 1.2, 1.3

---

## Phase 2: Component Development

### 2.1 Create TaskAnalyticsSection component
- **Agent**: frontend-engineer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx`
- **Requirements**:
  - [ ] Create client component with `'use client'` directive
  - [ ] Accept props: `analytics: TaskAnalytics`, `onFilterChange: (filter: FilterState) => void`
  - [ ] Import InfoCard component from `@/components/projects/InfoCard`
  - [ ] Import Lucide icons: DollarSign, Clock, AlertOctagon, CheckSquare, Users, Package, Flag, Receipt, GitBranch, TrendingUp
  - [ ] Implement responsive grid layout: `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4`
  - [ ] Configure 10 InfoCard instances (see subtasks 2.2-2.11)
  - [ ] Budget Performance card spans 2 columns: `col-span-2`
  - [ ] Add loading skeleton state (10 Skeleton cards)
  - [ ] Add error state (error banner)
- **Acceptance**:
  - Component renders without errors
  - Grid layout is responsive (2→4→5 columns)
  - All 10 InfoCards displayed
  - Loading/error states work
- **Ref**:
  - Design > Component Diagram (lines 82-106)
  - Design > UI Specification > Component Structure (lines 1176-1217)
- **Dependencies**: 1.2 (requires TaskAnalytics interface)

---

### 2.2 Configure Budget Performance InfoCard (Hero)
- **Agent**: frontend-engineer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx` (within 2.1)
- **Requirements**:
  - [ ] Use InfoCard with `isHeroCard={true}`, `columns={3}`
  - [ ] Header: DollarSign icon, "Budget Performance", "Planned vs Actual Costs"
  - [ ] Field 1: "Planned" - `formatCurrency(analytics.budget.planned)`, Target icon
  - [ ] Field 2: "Actual" - `formatCurrency(analytics.budget.actual)`, DollarSign icon
  - [ ] Field 3: "Under/Over Budget" - variance badge with color (green if ≥0, red if <0), TrendingDown/Up icon
  - [ ] Footer warning if `analytics.budget.utilization > 90` (AlertTriangle, orange text)
  - [ ] Non-interactive (display-only)
- **Acceptance**:
  - Card spans 2 columns
  - 3-column internal layout (Planned | Actual | Variance)
  - Variance badge color-coded correctly
  - Warning footer shows when utilization > 90%
- **Ref**: Design > InfoCard Configurations > Budget Performance (lines 629-664)
- **Dependencies**: 2.1

---

### 2.3 Configure Schedule Adherence InfoCard (Interactive)
- **Agent**: frontend-engineer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx` (within 2.1)
- **Requirements**:
  - [ ] Header: Clock icon, "Schedule", "On-time performance"
  - [ ] Field 1: "Overdue" - clickable badge, calls `onFilterChange({ status: 'overdue' })`, red badge if > 0
  - [ ] Field 2: "At Risk" - clickable badge, calls `onFilterChange({ status: 'at-risk' })`, yellow badge if > 0
  - [ ] Field 3: "On Time" - display-only badge, green
  - [ ] Use color dots (w-2 h-2 rounded-full) + text labels for accessibility
- **Acceptance**:
  - Click "Overdue" triggers filter
  - Click "At Risk" triggers filter
  - Color-coded badges (red/yellow/green)
  - Hover states visible on interactive badges
- **Ref**: Design > InfoCard Configurations > Schedule Adherence (lines 674-723)
- **Dependencies**: 2.1

---

### 2.4 Configure Blocked Tasks InfoCard (Interactive)
- **Agent**: frontend-engineer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx` (within 2.1)
- **Requirements**:
  - [ ] Header: AlertOctagon icon, "Blocked", "Tasks requiring attention"
  - [ ] Field 1: "Blocked Tasks" - clickable badge, calls `onFilterChange({ status: 'blocked' })`, shows count + rate
  - [ ] Field 2 (conditional): "Top Blockers" - list top 3 blocker reasons with bullet points (only if `analytics.blocked.topReasons.length > 0`)
  - [ ] Badge: red if count > 0, gray if 0
- **Acceptance**:
  - Click "Blocked Tasks" triggers filter
  - Top blockers list displays correctly
  - Conditional rendering works
- **Ref**: Design > InfoCard Configurations > Blocked Tasks (lines 732-774)
- **Dependencies**: 2.1

---

### 2.5 Configure Completion, Workload, Materials, Priority InfoCards
- **Agent**: frontend-engineer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx` (within 2.1)
- **Requirements**:
  - [ ] **Completion Performance**: CheckSquare icon, progress bar (color-coded: green ≥80%, yellow 50-79%, red <50%), display-only
  - [ ] **Workload Distribution**: Users icon, unassigned count (clickable, orange badge), top 3 assignees with avatars (clickable)
  - [ ] **Materials Status**: Package icon, 3 badges (Needed/Ordered/Delivered), "Needed" clickable (orange if > 0)
  - [ ] **Priority Distribution**: Flag icon, 3 clickable badges (High/Medium/Low) with color-coding (red/yellow/gray)
  - [ ] All interactive cards call `onFilterChange` with appropriate filter
- **Acceptance**:
  - Completion progress bar color-coded correctly
  - Workload avatars display with click handlers
  - Materials badges show correct counts
  - Priority filters work on click
- **Ref**:
  - Design > InfoCard Configurations (lines 784-969)
  - UI_RULES.md > InfoCard Pattern (lines 308-454)
- **Dependencies**: 2.1

---

### 2.6 Configure Expenses, Dependencies, Velocity InfoCards
- **Agent**: frontend-engineer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx` (within 2.1)
- **Requirements**:
  - [ ] **Expenses**: Receipt icon, "Pending Review" clickable (navigates to `/app/expenses?status=pending`), "Approved" badge, footer warning if pending > $5,000
  - [ ] **Dependencies**: GitBranch icon, "Blocked by Dependencies" clickable (logs to console for MVP), "Ready to Start" badge
  - [ ] **Velocity**: TrendingUp icon, tasks/day (7d avg), trend badge with arrow (up/down/neutral), color-coded (green/red/gray)
  - [ ] All currency values use `formatCurrency()` helper
- **Acceptance**:
  - Expenses card navigates correctly
  - Dependencies card logs on click (modal out of scope)
  - Velocity trend direction displayed correctly
  - Warning footer appears when needed
- **Ref**: Design > InfoCard Configurations (lines 978-1098)
- **Dependencies**: 2.1

---

### 2.7 Code review: TaskAnalyticsSection component
- **Agent**: code-reviewer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx`
- **Requirements**:
  - [ ] Verify all 10 InfoCards configured correctly
  - [ ] Verify interactive cards call `onFilterChange` with correct parameters
  - [ ] Verify responsive grid layout (2→4→5 columns)
  - [ ] Verify color-coding matches design (green/yellow/red/orange/blue/gray)
  - [ ] Verify accessibility: ARIA labels, keyboard navigation, color + text labels
  - [ ] Verify no Supabase imports in client component
  - [ ] Test on mobile (375px), tablet (768px), desktop (1024px+)
  - [ ] Run `npm run build` to verify no errors
- **Acceptance**:
  - Component passes accessibility audit
  - Responsive at all breakpoints
  - No build errors
  - Interactive elements keyboard-accessible
- **Ref**:
  - Design > Accessibility (lines 1453-1490)
  - Design > Responsive Design (lines 597-623)
- **Dependencies**: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

---

## Phase 3: TaskBoard Integration

### 3.1 Integrate TaskAnalyticsSection into TaskBoard
- **Agent**: frontend-engineer
- **Files**:
  - `app/app/tasks/page.tsx` (modify)
  - `components/tasks/TaskBoard.tsx` (modify)
- **Requirements**:
  - [ ] In TasksPage (Server Component): Call `getTaskAnalytics('all', companyId)` to fetch analytics
  - [ ] Pass analytics to TaskBoard as prop: `analytics?: TaskAnalytics`
  - [ ] In TaskBoard: Import TaskAnalyticsSection
  - [ ] Remove DashboardStats import and usage
  - [ ] Render TaskAnalyticsSection above TaskFilters (conditionally if analytics exists)
  - [ ] Implement `handleFilterChange` in TaskBoard to update filter state
  - [ ] Map analytics filters to TaskBoard filter state (status: 'overdue'/'at-risk'/'blocked', assignee: 'unassigned'/UUID, priority, materialStatus)
  - [ ] Handle errors gracefully (display error banner if analytics fails, show TaskBoard without analytics)
- **Acceptance**:
  - Analytics section displays at top of TaskBoard
  - DashboardStats removed completely
  - Click-to-filter updates task list below
  - Error handling prevents page crash
  - Build passes
- **Ref**: Design > Integration Plan > Phase 3 (lines 1221-1304)
- **Dependencies**: 2.1, 2.7

---

## Phase 4: Testing & Optimization

### 4.1 Performance testing
- **Agent**: code-reviewer
- **Files**: All modified files
- **Requirements**:
  - [ ] Test analytics query with 500+ tasks (verify < 500ms)
  - [ ] Test page load time (analytics should not block task list rendering)
  - [ ] Verify analytics use React useMemo to prevent unnecessary recalculations
  - [ ] Test filter changes (ensure debounced if needed)
  - [ ] Profile component render performance (React DevTools)
  - [ ] Test with slow network (loading skeletons should appear)
- **Acceptance**:
  - Analytics query < 500ms for 1000 tasks
  - Page load time acceptable (< 2s total)
  - No unnecessary re-renders
  - Loading states work correctly
- **Ref**:
  - Design > Performance Optimization (lines 1360-1410)
  - Requirements > NFR-1: Performance (lines 206-212)
- **Dependencies**: 3.1

---

### 4.2 Responsive & accessibility testing
- **Agent**: code-reviewer
- **Files**: `components/tasks/TaskAnalyticsSection.tsx`, `components/tasks/TaskBoard.tsx`
- **Requirements**:
  - [ ] Test on mobile (375px, 768px)
  - [ ] Test on tablet (768px, 1024px)
  - [ ] Test on desktop (1024px+)
  - [ ] Verify grid switches correctly (2→4→5 columns)
  - [ ] Test keyboard navigation (Tab through interactive cards, Enter/Space to activate)
  - [ ] Test screen reader (ARIA labels present and correct)
  - [ ] Verify color-only indicators have text labels
  - [ ] Test with browser zoom (150%, 200%)
- **Acceptance**:
  - Responsive at all breakpoints
  - All interactive elements keyboard-accessible
  - Screen reader can announce all metrics
  - No layout breaks at high zoom
- **Ref**:
  - Requirements > NFR-2: Responsive Design (lines 214-222)
  - Requirements > NFR-3: Accessibility (lines 224-234)
- **Dependencies**: 3.1

---

## Phase 5: Review & Build

### 5.1 Final code review and build verification
- **Agent**: code-reviewer
- **Files**: All modified files
- **Requirements**:
  - [ ] Review all code changes for consistency with GenHub patterns
  - [ ] Verify no Supabase in client components
  - [ ] Verify all Server Actions use proper auth checks
  - [ ] Verify SQL function filters by company_id (no data leaks)
  - [ ] Verify TypeScript types match between backend and frontend
  - [ ] Run `npm run build` and verify success
  - [ ] Check build output for warnings
  - [ ] Test analytics with various scenarios: no tasks, single project, all filters
  - [ ] Verify all 10 requirements (REQ-1 through REQ-10) are met
- **Acceptance**:
  - Build passes with no errors or warnings
  - Security audit passed
  - All requirements met
  - Ready for production deployment
- **Ref**:
  - Design > Testing Strategy (lines 1611-1727)
  - Requirements > All REQ sections
- **Dependencies**: 4.1, 4.2

---

## Requirement Traceability

| Requirement | Tasks |
|-------------|-------|
| REQ-1: Task Completion Performance Analytics | 1.1, 1.2, 2.1, 2.5 (Completion card) |
| REQ-2: Schedule Adherence Analytics | 1.1, 1.2, 2.3 (Schedule card) |
| REQ-3: Budget Performance Analytics | 1.1, 1.2, 2.2 (Budget card) |
| REQ-5: Workload Distribution Analytics | 1.1, 1.2, 2.5 (Workload card) |
| REQ-6: Material Procurement Status Analytics | 1.1, 1.2, 2.5 (Materials card) |
| REQ-8: Expense Tracking Analytics | 1.1, 1.2, 2.6 (Expenses card) |
| REQ-9: Task Dependencies Analytics | 1.1, 1.2, 2.6 (Dependencies card) |
| NFR-1: Performance (< 500ms) | 1.1, 1.3, 4.1 |
| NFR-2: Responsive Design | 2.1, 4.2 |
| NFR-3: Accessibility | 2.7, 4.2 |
| NFR-4: Data Accuracy | 1.1, 1.2, 1.4 |

---

## Task Dependencies Graph

```
Phase 1 (Backend):
1.1 (SQL function) → 1.2 (Server action) → 1.3 (Indexes)
                                         ↓
                                       1.4 (Review)

Phase 2 (Frontend):
1.2 → 2.1 (Component) → 2.2, 2.3, 2.4, 2.5, 2.6 (InfoCard configs) → 2.7 (Review)

Phase 3 (Integration):
2.7 → 3.1 (TaskBoard integration)

Phase 4 (Testing):
3.1 → 4.1 (Performance), 4.2 (Responsive/A11y)

Phase 5 (Review):
4.1, 4.2 → 5.1 (Final review & build)
```

---

## File Change Summary

### New Files
- `supabase/migrations/20260103_create_task_analytics_function.sql`
- `supabase/migrations/20260103_verify_task_analytics_indexes.sql`
- `types/analytics.ts`
- `components/tasks/TaskAnalyticsSection.tsx`

### Modified Files
- `app/actions/tasks.ts` (add getTaskAnalytics function)
- `app/app/tasks/page.tsx` (fetch and pass analytics)
- `components/tasks/TaskBoard.tsx` (remove DashboardStats, add TaskAnalyticsSection, add filter handler)

### Deleted Components
- Remove DashboardStats usage (component file may remain if used elsewhere, but remove from TaskBoard)

---

## Implementation Checklist

Before marking tasks as complete:

**Phase 1:**
- [ ] PostgreSQL function created and tested
- [ ] Server action returns correct data structure
- [ ] Indexes verified and optimized
- [ ] Auth and validation working
- [ ] Performance < 500ms verified

**Phase 2:**
- [ ] TaskAnalyticsSection component created
- [ ] All 10 InfoCards configured
- [ ] Grid layout responsive (2→4→5 columns)
- [ ] Interactive cards call onFilterChange
- [ ] Loading/error states implemented

**Phase 3:**
- [ ] Analytics fetched in TasksPage
- [ ] TaskAnalyticsSection integrated above TaskFilters
- [ ] DashboardStats removed from TaskBoard
- [ ] Filter handlers wired correctly
- [ ] Error handling prevents crashes

**Phase 4:**
- [ ] Performance tested (< 500ms query, < 2s page load)
- [ ] Responsive tested (375px, 768px, 1024px+)
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] No build warnings

**Phase 5:**
- [ ] All requirements met
- [ ] Build passes
- [ ] Security audit passed
- [ ] Ready for production

---

## Estimated Complexity by Task

| Task | Complexity | Estimated Time |
|------|------------|----------------|
| 1.1 | High | 1.5 hours (SQL optimization) |
| 1.2 | Medium | 1 hour (TypeScript interfaces + server action) |
| 1.3 | Low | 0.5 hours (verify/create indexes) |
| 1.4 | Medium | 0.5 hours (review Phase 1) |
| 2.1 | Medium | 1 hour (component structure) |
| 2.2-2.6 | High | 3 hours (10 InfoCard configs) |
| 2.7 | Medium | 0.5 hours (review Phase 2) |
| 3.1 | Medium | 1 hour (integration) |
| 4.1 | Medium | 1 hour (performance testing) |
| 4.2 | Medium | 1 hour (responsive/a11y testing) |
| 5.1 | Low | 0.5 hours (final review) |

**Total: 11.5 hours**

---

## Notes for Implementation

### Backend (Tasks 1.1-1.4)
- Use MCP Supabase for all database operations
- Test SQL function in Supabase SQL editor before creating migration
- Use `FILTER` clause for conditional aggregations (faster than CASE WHEN)
- Return single row to minimize network overhead
- Handle edge cases: no tasks, no company

### Frontend (Tasks 2.1-2.7)
- Reuse existing InfoCard component (DO NOT create new card component)
- Follow construction theme colors (#001B51, #059669, #DC2626, #FBBF24, #F97316)
- Use Lucide icons only (no other icon libraries)
- Test with mock data during development
- Use React DevTools to verify no unnecessary re-renders

### Integration (Task 3.1)
- TasksPage is Server Component (can call server actions directly)
- TaskBoard is Client Component (receives analytics as props)
- Filter state lives in TaskBoard, not in TaskAnalyticsSection
- Handle analytics fetch errors gracefully (don't crash page)

### Testing (Tasks 4.1-4.2)
- Use browser DevTools Network tab for performance testing
- Test with React DevTools Profiler for render performance
- Use browser zoom and screen readers for accessibility testing
- Test on actual mobile devices if possible (not just browser DevTools)

---

## Approval

**Reviewer Questions:**

1. Are all 11 tasks clearly defined with acceptance criteria?
2. Are dependencies between tasks explicit?
3. Are agent assignments appropriate (backend/frontend/reviewer)?
4. Is the estimated complexity (11.5 hours) realistic?
5. Are all 10 analytics requirements covered?

---

**Ready for implementation via `/kc:impl` workflow.**
