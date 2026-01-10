# Dashboard Redesign - Implementation Tasks

## References
- Requirements: `.claude/specs/dashboard-redesign/requirements.md`
- Design: `.claude/specs/dashboard-redesign/design.md`

---

## Phase 1: Backend Foundation

### Task 1.1: Create Dashboard Types
- **Agent:** backend-engineer
- **Skill:** N/A (TypeScript types only)
- **Output:** `types/dashboard.ts`
- **Requirements:**
  - Define `DashboardData` interface per design doc
  - Define `DashboardKPIs` interface
  - Define all widget data interfaces
  - Export all types
- **Acceptance:**
  - [ ] All interfaces match design specification
  - [ ] Proper TypeScript documentation comments
  - [ ] No circular dependencies

---

### Task 1.2: Create getDashboardData Server Action
- **Agent:** backend-engineer
- **Skill:** `skills/backend/server-action.md`
- **Output:** `app/actions/dashboard.ts`
- **Dependencies:** Task 1.1
- **Requirements:**
  - Create `getDashboardData()` action
  - Use `getUserContext()` pattern for auth
  - Execute parallel queries for performance:
    ```typescript
    const [projects, tasks, expenses, materials, team] = await Promise.all([...])
    ```
  - Aggregate data into `DashboardData` structure
  - Handle empty data gracefully (return zeros, not errors)
  - Return `{ data, error }` pattern
- **Queries Required:**
  - Projects: Count by status, total budget
  - Tasks: Completion metrics, schedule metrics, assignee distribution
  - Expenses: Pending counts, amounts, by category
  - Materials: Procurement status counts
  - Team: Member count, top assignees
- **Acceptance:**
  - [ ] Action compiles without error
  - [ ] Auth check at start
  - [ ] Company isolation via RLS
  - [ ] Returns complete DashboardData structure
  - [ ] Handles companies with no data gracefully
  - [ ] Performance: <2s for typical company

---

## Phase 2: UI Components

### Task 2.1: Create KPICard Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/KPICard.tsx`
- **Requirements:**
  - Props interface per design doc
  - Support variants: default, success, warning, danger
  - Optional trend indicator (up/down/neutral)
  - Optional click handler/href for navigation
  - Hover animation with framer-motion
  - Responsive sizing (smaller on mobile)
  - Skeleton loading state
- **Acceptance:**
  - [ ] Displays title, value, subtitle, icon
  - [ ] Trend indicator shows correctly
  - [ ] Color variants work
  - [ ] Click navigation works when href provided
  - [ ] Mobile responsive
  - [ ] Uses Lucide icons only

---

### Task 2.2: Create KPICardsGrid Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/KPICardsGrid.tsx`
- **Dependencies:** Task 2.1
- **Requirements:**
  - Receives `DashboardKPIs` as prop
  - Renders 6 KPICards in responsive grid
  - Grid layout:
    - Mobile: 2 columns
    - Tablet: 3 columns
    - Desktop: 6 columns
  - Staggered entrance animation
  - Skeleton state for loading
- **Cards to render:**
  1. Active Projects (icon: FolderKanban, variant based on count)
  2. Tasks This Week (icon: CheckSquare, warning if overdue)
  3. Budget Health (icon: Wallet, variant based on utilization)
  4. Schedule Status (icon: Clock, variant based on on-time %)
  5. Pending Approvals (icon: AlertCircle, warning if count > 0)
  6. Team Size (icon: Users, default variant)
- **Acceptance:**
  - [ ] All 6 cards render with correct data
  - [ ] Responsive grid works
  - [ ] Skeleton loading state
  - [ ] Proper icons and variants

---

### Task 2.3: Create ProjectStatusWidget Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/ProjectStatusWidget.tsx`
- **Requirements:**
  - Receives project status counts as prop
  - Horizontal stacked bar visualization
  - Legend with clickable status labels
  - Click navigates to filtered projects page
  - Empty state if no projects
- **Acceptance:**
  - [ ] Bar shows proportional segments
  - [ ] Colors match status (blue, yellow, green, gray)
  - [ ] Click navigation works
  - [ ] Empty state displays correctly

---

### Task 2.4: Create TaskProgressWidget Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/TaskProgressWidget.tsx`
- **Requirements:**
  - Circular progress ring (CSS-based, not external lib)
  - Completion percentage in center
  - Status breakdown list with colored indicators
  - Velocity trend if available
  - Click navigates to /app/tasks
- **Acceptance:**
  - [ ] Progress ring animates on load
  - [ ] Percentage displays in center
  - [ ] Status counts with correct colors
  - [ ] Mobile responsive

---

### Task 2.5: Create BudgetSummaryWidget Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/BudgetSummaryWidget.tsx`
- **Requirements:**
  - Utilization progress bar
  - Color changes based on utilization threshold
  - Planned vs Actual display with formatting
  - Variance with positive/negative indicator
  - Pending expenses section with CTA
- **Acceptance:**
  - [ ] Progress bar colors correctly
  - [ ] Currency formatting (KRW or USD)
  - [ ] Variance shows under/over budget
  - [ ] Pending expenses clickable

---

### Task 2.6: Create ScheduleHealthWidget Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/ScheduleHealthWidget.tsx`
- **Requirements:**
  - Three-row status display (on-time, at-risk, overdue)
  - Traffic light colors
  - Count and percentage for each
  - Icon indicators
- **Acceptance:**
  - [ ] Three status rows render
  - [ ] Correct colors (green, amber, red)
  - [ ] Percentages calculated correctly

---

### Task 2.7: Create TeamActivityWidget Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/TeamActivityWidget.tsx`
- **Requirements:**
  - Team count header
  - Top 5 assignees list with:
    - Avatar (fallback to initials)
    - Name
    - Task count bar
  - Unassigned tasks warning
  - Click navigates to /app/team
- **Acceptance:**
  - [ ] Avatars render or show fallback
  - [ ] Task count bars proportional
  - [ ] Unassigned warning visible if count > 0

---

### Task 2.8: Create MaterialsStatusWidget Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/MaterialsStatusWidget.tsx`
- **Requirements:**
  - Three-stage pipeline visual
  - Needed → Ordered → Delivered flow
  - Counts for each stage
  - Click navigates to /app/materials
- **Acceptance:**
  - [ ] Three stages visible
  - [ ] Visual flow/arrows between stages
  - [ ] Counts display correctly

---

### Task 2.9: Create WidgetsGrid Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/WidgetsGrid.tsx`
- **Dependencies:** Tasks 2.3-2.8
- **Requirements:**
  - Container for all widgets
  - Responsive grid (2 cols desktop, 1 col mobile)
  - Widget wrapper with consistent styling:
    - White background
    - Border
    - Padding
    - Shadow
  - Section title for each widget
- **Acceptance:**
  - [ ] All widgets render in grid
  - [ ] Responsive layout works
  - [ ] Consistent widget styling

---

### Task 2.10: Create DashboardHeader Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/DashboardHeader.tsx`
- **Requirements:**
  - Simplified welcome message
  - User name from session
  - Blueprint accent bar (from current design)
  - Subtitle: "Your construction command center"
  - Remove heavy Aceternity effects for cleaner look
- **Acceptance:**
  - [ ] Displays user name
  - [ ] Clean, professional design
  - [ ] Mobile responsive

---

### Task 2.11: Create DashboardContent Client Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/dashboard/DashboardContent.tsx`
- **Dependencies:** Tasks 2.2, 2.9, 2.10
- **Requirements:**
  - 'use client' component
  - Receives DashboardData as prop
  - Renders:
    1. DashboardHeader
    2. KPICardsGrid
    3. WidgetsGrid
    4. QuickActionsSection (PRESERVED from current)
  - Framer-motion entrance animations
  - Background grid pattern (subtle)
- **Acceptance:**
  - [ ] All sections render
  - [ ] QuickActions preserved exactly
  - [ ] Smooth animations
  - [ ] No Supabase imports

---

### Task 2.12: Create Dashboard Component Exports
- **Agent:** frontend-engineer
- **Output:** `components/dashboard/index.ts`
- **Dependencies:** All Task 2.x
- **Requirements:**
  - Export all dashboard components
  - Named exports for tree-shaking
- **Acceptance:**
  - [ ] All components exported
  - [ ] Clean import syntax works

---

## Phase 3: Page Integration

### Task 3.1: Refactor Dashboard Page to Server Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/page-creation.md`
- **Output:** `app/app/page.tsx` (MODIFY existing)
- **Dependencies:** Tasks 1.2, 2.11
- **Requirements:**
  - Convert to Server Component (remove 'use client')
  - Import and call getDashboardData()
  - Handle auth redirect if not authenticated
  - Handle error state
  - Pass data to DashboardContent client component
  - Suspense boundary with loading state
- **Acceptance:**
  - [ ] Page is Server Component (no 'use client')
  - [ ] Data fetched server-side
  - [ ] QuickActions still works
  - [ ] Loading state shows skeletons
  - [ ] Error boundary for failures

---

### Task 3.2: Create Dashboard Loading State
- **Agent:** frontend-engineer
- **Output:** `app/app/loading.tsx`
- **Requirements:**
  - Skeleton layout matching dashboard structure
  - Animating pulse placeholders
  - Same responsive grid
- **Acceptance:**
  - [ ] Skeletons match real layout
  - [ ] No layout shift on load

---

## Phase 4: Polish & Integration

### Task 4.1: Integration Testing
- **Agent:** code-reviewer
- **Output:** Test report
- **Dependencies:** All Phase 1-3 tasks
- **Requirements:**
  - Verify all widgets render with real data
  - Test empty state (new company, no projects)
  - Test with populated data
  - Verify mobile responsiveness
  - Console error check
  - Build verification
- **Acceptance:**
  - [ ] All user stories verified
  - [ ] No console errors
  - [ ] Build passes
  - [ ] Mobile layout correct

---

### Task 4.2: Documentation Sync
- **Agent:** backend-engineer OR frontend-engineer
- **Output:** Updated index files
- **Requirements:**
  - Run `/kc:sync-docs`
  - Update actions.md (new dashboard.ts)
  - Update components.md (new dashboard/ directory)
- **Acceptance:**
  - [ ] actions.md updated with getDashboardData
  - [ ] components.md updated with dashboard components

---

## Execution Order

```
Sequential Dependencies:

Phase 1 (Backend):
1.1 Types → 1.2 Server Action

Phase 2 (Components - can parallelize within phase):
2.1 KPICard
    ↓
2.2 KPICardsGrid

2.3-2.8 (Widgets - all parallel)
    ↓
2.9 WidgetsGrid

2.10 DashboardHeader

All of above →
2.11 DashboardContent → 2.12 Exports

Phase 3 (Page):
1.2 + 2.11 → 3.1 Page Refactor
           → 3.2 Loading State

Phase 4 (Polish):
All above → 4.1 Testing → 4.2 Docs
```

### Parallelization Opportunities
```
Parallel Group A (after 2.1):
- 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10

These can run in parallel once KPICard (2.1) is done.
```

---

## Estimated Effort

| Phase | Tasks | Complexity | Est. Time |
|-------|-------|------------|-----------|
| Backend | 2 | Medium | 1-2 hours |
| Components | 12 | Medium-High | 4-6 hours |
| Page Integration | 2 | Medium | 1-2 hours |
| Polish | 2 | Low | 1 hour |
| **Total** | **18 tasks** | - | **7-11 hours** |

---

## Risk Mitigation

### Risk: Complex Aggregation Query Performance
**Mitigation:** Use parallel Promise.all, add indexes if needed, consider caching

### Risk: Empty State Edge Cases
**Mitigation:** Test explicitly with new company, document all zero-data states

### Risk: Breaking QuickActions
**Mitigation:** Extract QuickActions to separate component first, then integrate

### Risk: Mobile Layout Complexity
**Mitigation:** Design mobile-first, test at 375px width throughout development

---

## QuickActions Preservation Strategy

The existing QuickActions section must be preserved exactly. Strategy:

1. **Extract First:** Before modifying page.tsx, extract the QuickActions JSX into its own component file: `components/dashboard/QuickActionsSection.tsx`
2. **Verify:** Ensure the extracted component works identically
3. **Integrate:** Import and use in new DashboardContent
4. **Test:** Verify all links work, animations preserved

**Current QuickActions from page.tsx (lines 60-94, 188-278):**
- Create Project → /app/projects
- Add Task → /app/tasks
- Invite Team → /app/team

---

**Status:** READY FOR IMPLEMENTATION
