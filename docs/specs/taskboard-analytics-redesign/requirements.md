# TaskBoard Analytics Redesign - Requirements

## Status
- Status: DRAFT
- Author: kiro-requirement
- Date: 2026-01-03
- Approved by: [pending]

---

## Introduction

This document specifies requirements for redesigning the TaskBoard component's analytics section to replace the current DashboardStats component with a top analytics section using the InfoCard component pattern. The redesign targets general contractors (GCs) and project managers (PMs) who need actionable, real-time insights into task performance, budget tracking, resource allocation, and risk indicators.

The current DashboardStats component displays 4 metrics (Total Tasks, Active Projects/Budget, Task Budget Overview). The new design will expand to **10 key task analytics** presented in a grid layout using reusable InfoCard components, providing comprehensive visibility into task management success metrics.

### Primary Users
- **GC (General Contractor)**: Needs high-level portfolio view across all projects
- **PM (Project Manager)**: Needs detailed task-level insights for active projects

### Key Business Drivers
Based on industry research, general contractors prioritize:
1. **Budget adherence** - Staying under planned costs
2. **Schedule performance** - Meeting deadlines and identifying delays
3. **Resource allocation** - Balancing workload across team
4. **Risk visibility** - Blocked/overdue tasks that threaten progress
5. **Material tracking** - Procurement status tied to tasks

---

## Requirements

### REQ-1: Task Completion Performance Analytics

**User Story:** As a GC/PM, I want to see task completion metrics at a glance, so that I can quickly assess overall productivity and identify bottlenecks.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN TaskBoard renders in non-project context THEN system SHALL display InfoCard with "Task Completion" metrics
2. IF user has tasks THEN system SHALL calculate total tasks, completed tasks, and completion percentage
3. WHEN completion percentage is calculated THEN system SHALL display as progress bar with color coding:
   - Green (≥80%) = On track
   - Yellow (50-79%) = At risk
   - Red (<50%) = Behind
4. IF no tasks exist THEN system SHALL display "0 Tasks" with neutral styling
5. WHEN user clicks InfoCard THEN system SHALL NOT navigate (display-only metric)

**Data Requirements:**
- Query: Count all tasks (filtered)
- Query: Count tasks where status = 'completed'
- Calculation: `completionRate = (completed / total) * 100`

---

### REQ-2: Schedule Adherence Analytics

**User Story:** As a GC/PM, I want to see how many tasks are overdue or at risk, so that I can prioritize interventions and prevent delays.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN TaskBoard renders THEN system SHALL display InfoCard with "Schedule Performance" metrics
2. IF task has due_date < today AND status != 'completed' THEN system SHALL count as overdue
3. IF task has due_date within 3 days AND status = 'todo' OR 'in_progress' THEN system SHALL count as at-risk
4. WHEN overdue count > 0 THEN system SHALL display count with red badge
5. WHEN at-risk count > 0 THEN system SHALL display count with yellow badge
6. IF no overdue or at-risk tasks THEN system SHALL display "On Track" with green badge
7. WHEN user clicks overdue/at-risk badge THEN system SHALL filter task list to show only those tasks

**Data Requirements:**
- Query: Count tasks where `due_date < NOW() AND status != 'completed'`
- Query: Count tasks where `due_date BETWEEN NOW() AND NOW() + 3 days`
- Filter state: Store overdue/at-risk filter selection

---

### REQ-3: Budget Performance Analytics

**User Story:** As a GC/PM, I want to see task-level budget vs actual spending with variance, so that I can control costs and prevent budget overruns.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN TaskBoard renders THEN system SHALL display InfoCard with "Budget Performance" metrics
2. IF tasks have planned_cost THEN system SHALL sum all planned_cost values
3. IF tasks have actual_cost THEN system SHALL sum all actual_cost values (read-only, auto-calculated from materials + expenses)
4. WHEN budget variance is calculated THEN system SHALL compute: `variance = planned - actual`
5. IF variance ≥ 0 THEN system SHALL display "Under Budget" with green styling and variance amount
6. IF variance < 0 THEN system SHALL display "Over Budget" with red styling and absolute variance amount
7. WHEN budget utilization exceeds 90% THEN system SHALL display warning indicator
8. WHEN InfoCard renders THEN system SHALL display 3 columns: Planned, Actual, Variance

**Data Requirements:**
- Query: `SUM(planned_cost)` from filtered tasks
- Query: `SUM(actual_cost)` from filtered tasks (trigger-maintained)
- Calculation: `variance = planned - actual`
- Calculation: `utilization = (actual / planned) * 100`

---

### REQ-5: Workload Distribution Analytics

**User Story:** As a GC/PM, I want to see unassigned tasks and top assignees, so that I can balance workload and ensure all tasks have owners.

**Priority:** Should Have

#### Acceptance Criteria

1. WHEN TaskBoard renders THEN system SHALL display InfoCard with "Workload" metrics
2. IF task has assignee_id = NULL THEN system SHALL count as unassigned
3. WHEN unassigned count > 0 THEN system SHALL display with orange badge and "Needs Assignment" label
4. IF unassigned count = 0 THEN system SHALL display "Fully Assigned" with green badge
5. WHEN InfoCard renders THEN system SHALL display top 3 assignees by task count with avatars
6. WHEN user clicks unassigned count THEN system SHALL filter task list to assignee_id IS NULL
7. WHEN user clicks assignee avatar THEN system SHALL filter task list to that assignee

**Data Requirements:**
- Query: Count tasks where `assignee_id IS NULL`
- Query: Top 3 assignees by `COUNT(*) GROUP BY assignee_id`
- Join: `user_profiles` for name and avatar_url

---

### REQ-6: Material Procurement Status Analytics

**User Story:** As a GC/PM, I want to see material procurement status across tasks, so that I can ensure materials are ordered/delivered before tasks start.

**Priority:** Should Have

#### Acceptance Criteria

1. WHEN TaskBoard renders THEN system SHALL display InfoCard with "Materials" metrics
2. IF task has material_assignments THEN system SHALL count as task with materials
3. WHEN material status = 'needed' THEN system SHALL count as needed
4. WHEN material status = 'ordered' THEN system SHALL count as ordered
5. WHEN material status = 'delivered' THEN system SHALL count as delivered
6. IF materials needed > 0 THEN system SHALL display with orange badge
7. WHEN user clicks material status THEN system SHALL filter tasks by material procurement status
8. WHEN InfoCard renders THEN system SHALL display 3 badges: Needed, Ordered, Delivered

**Data Requirements:**
- Query: `COUNT(DISTINCT task_id)` from material_assignments where task in filtered set
- Query: Group by `procurement_status` (needed, ordered, delivered)
- Join: `material_assignments` → `tasks`

---


### REQ-8: Expense Tracking Analytics

**User Story:** As a GC/PM, I want to see expense submission and approval status for tasks, so that I can manage cash flow and approve pending expenses.

**Priority:** Should Have

#### Acceptance Criteria

1. WHEN TaskBoard renders THEN system SHALL display InfoCard with "Expenses" metrics
2. IF expense status = 'submitted' OR 'under_review' THEN system SHALL count as pending
3. IF expense status = 'approved' THEN system SHALL count as approved and sum expense.amount
4. IF expense status = 'rejected' THEN system SHALL count as rejected
5. WHEN pending count > 0 THEN system SHALL display with orange badge and "Needs Review" label
6. WHEN pending amount exceeds $5,000 THEN system SHALL display warning indicator
7. WHEN user clicks pending expenses THEN system SHALL navigate to expenses page with task filter applied
8. WHEN InfoCard renders THEN system SHALL display 2 metrics: Pending Count and Pending Amount

**Data Requirements:**
- Query: Count expenses where `task_id IN (filtered tasks) AND status IN ('submitted', 'under_review')`
- Query: `SUM(amount)` from pending expenses
- Join: `expenses` → `tasks`

---

### REQ-9: Task Dependencies Analytics

**User Story:** As a GC/PM, I want to see tasks with unmet dependencies, so that I can sequence work correctly and avoid starting tasks prematurely.

**Priority:** Could Have

#### Acceptance Criteria

1. WHEN TaskBoard renders THEN system SHALL display InfoCard with "Dependencies" metrics
2. IF task has dependency WHERE depends_on_task.status != 'completed' THEN system SHALL count as blocked by dependency
3. WHEN blocked-by-dependency count > 0 THEN system SHALL display with orange badge
4. IF all dependencies met THEN system SHALL display "Ready to Start" with green badge
5. WHEN user clicks dependency count THEN system SHALL show modal with dependency graph
6. WHEN task dependency is overdue THEN system SHALL display critical warning

**Data Requirements:**
- Query: Join `task_dependencies` → `tasks` where `depends_on_task.status != 'completed'`
- Calculation: Count tasks with unmet dependencies
- Graph data: Fetch dependency chains for modal display

---


## Non-Functional Requirements

### NFR-1: Performance

**User Story:** As a user, I want analytics to load quickly without blocking the task board, so that I can work efficiently.

#### Acceptance Criteria

1. WHEN TaskBoard renders THEN system SHALL calculate all analytics in < 500ms
2. IF analytics query exceeds 500ms THEN system SHALL display loading skeletons
3. WHEN analytics data updates THEN system SHALL use React useMemo to prevent unnecessary recalculations
4. IF filtered tasks change THEN system SHALL debounce analytics recalculation by 200ms

### NFR-2: Responsive Design

**User Story:** As a user on mobile, I want analytics to be readable and usable on small screens, so that I can manage tasks from the field.

#### Acceptance Criteria

1. WHEN viewport width < 768px THEN system SHALL display InfoCards in 2-column grid
2. WHEN viewport width ≥ 768px THEN system SHALL display InfoCards in 4-column grid
3. WHEN viewport width ≥ 1024px THEN system SHALL display InfoCards in 5-column grid
4. IF InfoCard text overflows THEN system SHALL truncate with ellipsis and show full text on hover

### NFR-3: Accessibility

**User Story:** As a user with visual impairment, I want analytics to be accessible via screen readers, so that I can understand task performance.

#### Acceptance Criteria

1. WHEN InfoCard renders THEN system SHALL include aria-label with full metric description
2. IF metric has badge THEN system SHALL include aria-live="polite" for status changes
3. WHEN color coding is used THEN system SHALL include text labels (not color-only indicators)
4. IF user navigates via keyboard THEN system SHALL support Tab/Enter for interactive cards

### NFR-4: Data Accuracy

**User Story:** As a GC, I want analytics to reflect real-time data, so that I make decisions based on current project state.

#### Acceptance Criteria

1. WHEN TaskBoard data refreshes THEN system SHALL recalculate all analytics immediately
2. IF task actual_cost changes (via trigger) THEN system SHALL reflect in budget analytics within 1 second
3. WHEN user creates/updates task THEN system SHALL invalidate cache and refresh analytics
4. IF analytics data is stale (>5 minutes) THEN system SHALL display "Last updated" timestamp

---

## UI/UX Requirements

### Layout Design

**Grid Structure:**
- **Mobile (< 768px)**: 2 columns, cards stack vertically
- **Tablet (768px - 1023px)**: 4 columns, 2 rows (8 cards) + 2 full-width (top/bottom)
- **Desktop (≥ 1024px)**: 5 columns, 2 rows (10 cards)

**Card Priority (left-to-right, top-to-bottom):**
1. **Row 1 (Top Priority)**: Budget Performance (2 cols), Schedule Adherence, Blocked Tasks, Completion Performance
2. **Row 2 (Secondary)**: Workload Distribution, Materials Status, Priority Distribution, Expenses, Dependencies

**InfoCard Configuration:**
- Use `InfoCard` component from `@/components/projects/InfoCard`
- All cards: `columns={1}` (internal layout handled by InfoCard)
- Hero cards (Budget, Schedule): `isHeroCard={true}` for emphasis
- Interactive cards: `onClick` handler to filter/navigate

### Color Coding

**Status Colors (align with construction theme):**
- **Green** (`bg-construction-green`): On track, under budget, no issues
- **Yellow** (`bg-yellow-500`): At risk, needs attention, moderate concern
- **Red** (`bg-construction-red`): Overdue, over budget, critical issue
- **Blue** (`bg-construction-blue`): Neutral/informational
- **Orange** (`bg-orange-500`): Action required, pending

### Visual Hierarchy

**Emphasis Levels:**
1. **Primary**: Budget Performance, Schedule Adherence (larger text, hero cards)
2. **Secondary**: Blocked Tasks, Completion Rate (standard cards)
3. **Tertiary**: Dependencies, Velocity (could-have metrics, smaller emphasis)

### Interactive Elements

**Clickable Cards:**
- Schedule Adherence → Filter to overdue/at-risk tasks
- Blocked Tasks → Filter to blocked status
- Workload → Filter to unassigned or specific assignee
- Materials → Filter to tasks with pending materials
- Priority → Filter to specific priority level
- Expenses → Navigate to expenses page with task filter

**Non-Interactive Cards:**
- Completion Performance (display-only)
- Budget Performance (display-only, unless drilling into tasks)
- Velocity (display-only, unless chart modal implemented)

---

## Data Model Requirements

### Required Server Action: `getTaskAnalytics`

**Location:** `/app/actions/tasks.ts`

**Function Signature:**
```typescript
export async function getTaskAnalytics(
  projectFilter: string = 'all',
  companyId: string
): Promise<{
  completion: { total: number; completed: number; rate: number };
  schedule: { overdue: number; atRisk: number; onTime: number };
  budget: { planned: number; actual: number; variance: number; utilization: number };
  blocked: { count: number; rate: number; topReasons: string[] };
  workload: { unassigned: number; topAssignees: Array<{ id: string; name: string; avatar_url: string; count: number }> };
  materials: { needed: number; ordered: number; delivered: number };
  priority: { high: number; medium: number; low: number };
  expenses: { pending: number; pendingAmount: number; approved: number; approvedAmount: number };
  dependencies: { blockedByDeps: number; ready: number };
  velocity: { tasksPerDay: number; trend: number };
}>
```

### Required Queries

**Base Query (filtered tasks):**
```sql
SELECT
  t.*,
  up.name as assignee_name,
  up.avatar_url as assignee_avatar
FROM tasks t
LEFT JOIN user_profiles up ON t.assignee_id = up.id
WHERE t.project_id = CASE
  WHEN $projectFilter = 'all' THEN t.project_id
  ELSE $projectFilter
END
AND t.project_id IN (
  SELECT id FROM projects WHERE company_id = $companyId
)
```

**Analytics Aggregations:**
```sql
-- Completion
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM tasks WHERE [base filter];

-- Schedule
SELECT
  COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue,
  COUNT(*) FILTER (WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days' AND status IN ('todo', 'in_progress')) as at_risk
FROM tasks WHERE [base filter];

-- Budget
SELECT
  SUM(planned_cost) as planned,
  SUM(actual_cost) as actual
FROM tasks WHERE [base filter];

-- Blocked
SELECT
  COUNT(*) as blocked_count,
  blocked_reason
FROM tasks
WHERE status = 'blocked' AND [base filter]
GROUP BY blocked_reason
ORDER BY COUNT(*) DESC
LIMIT 3;

-- Workload
SELECT
  COUNT(*) FILTER (WHERE assignee_id IS NULL) as unassigned,
  assignee_id,
  up.name,
  up.avatar_url,
  COUNT(*) as task_count
FROM tasks t
LEFT JOIN user_profiles up ON t.assignee_id = up.id
WHERE [base filter]
GROUP BY assignee_id, up.name, up.avatar_url
ORDER BY task_count DESC
LIMIT 3;

-- Materials
SELECT
  procurement_status,
  COUNT(DISTINCT ma.task_id) as count
FROM material_assignments ma
WHERE ma.task_id IN (SELECT id FROM tasks WHERE [base filter])
GROUP BY procurement_status;

-- Priority
SELECT
  priority,
  COUNT(*) as count
FROM tasks
WHERE [base filter]
GROUP BY priority;

-- Expenses
SELECT
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM expenses
WHERE task_id IN (SELECT id FROM tasks WHERE [base filter])
GROUP BY status;

-- Dependencies
SELECT COUNT(DISTINCT td.task_id) as blocked_by_deps
FROM task_dependencies td
INNER JOIN tasks blocked_task ON td.task_id = blocked_task.id
INNER JOIN tasks dependency_task ON td.depends_on_task_id = dependency_task.id
WHERE blocked_task.id IN (SELECT id FROM tasks WHERE [base filter])
AND dependency_task.status != 'completed';

-- Velocity
SELECT
  COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '14 days' AND completed_at < NOW() - INTERVAL '7 days') as previous_7_days
FROM tasks
WHERE [base filter];
```

### Caching Strategy

**Server-Side:**
- Cache analytics per project for 5 minutes
- Invalidate on task create/update/delete
- Use `revalidatePath('/app/tasks')` on mutations

**Client-Side:**
- Use `useMemo` with `filteredTasks` dependency
- Debounce filter changes to prevent excessive recalculations
- Display loading skeletons during recalculation

---

## Implementation Constraints

### Technical Constraints

1. **No Supabase in Client Components**: Analytics calculation MUST occur in server action or server component
2. **InfoCard Pattern**: Use existing `InfoCard` component, do NOT create custom card components
3. **Lucide Icons Only**: Use only Lucide icons for consistency
4. **Construction Theme**: Follow `#001B51` (navy) and `#3C3C3C` (gray) color palette
5. **No Breaking Changes**: Maintain existing TaskBoard API (props, filters, view state)

### Business Constraints

1. **Backwards Compatibility**: TaskBoard must still work in project context (projectId prop)
2. **Filter Preservation**: Analytics must respect existing project/assignee/priority filters
3. **Performance SLA**: Analytics must not slow down task board rendering
4. **Mobile-First**: Analytics must be usable on 375px viewport (iPhone SE)

---

## Out of Scope

The following features are explicitly **NOT included** in this iteration:

1. **Historical Trending**: Time-series charts for analytics over weeks/months
2. **Export Analytics**: CSV/PDF export of analytics data
3. **Custom Dashboards**: User-configurable analytics widgets
4. **Predictive Analytics**: AI-powered forecasts (e.g., projected completion date)
5. **Real-Time Updates**: WebSocket/Realtime subscriptions for live analytics updates
6. **Comparison Mode**: Side-by-side project analytics comparison
7. **Custom Metrics**: User-defined KPIs or calculated fields
8. **Drill-Down Modals**: Detailed breakdowns within InfoCards (except dependencies graph)

---

## Open Questions

- [ ] **Q1**: Should Budget Performance InfoCard span 2 columns like current DashboardStats, or fit in 1 column?
  - **Recommendation**: 2 columns for emphasis (hero card)

- [ ] **Q2**: Should clicking analytics cards filter the task list below, or open a modal?
  - **Recommendation**: Filter task list (simpler, more intuitive)

- [ ] **Q3**: Should velocity analytics use 7-day or 14-day window?
  - **Recommendation**: 7-day (more responsive to recent changes)

- [ ] **Q4**: Should unassigned task count trigger warnings at specific thresholds (e.g., >20%)?
  - **Recommendation**: Yes, display warning if unassigned > 20% of total

- [ ] **Q5**: Should material analytics include total material cost, or just procurement status?
  - **Recommendation**: Procurement status only (cost is in budget analytics)

- [ ] **Q6**: Should analytics be collapsible to save screen space?
  - **Recommendation**: No, always visible (critical decision-making info)

- [ ] **Q7**: Should project context (projectId prop) hide certain analytics (e.g., Active Projects)?
  - **Recommendation**: Yes, hide irrelevant metrics in project context

- [ ] **Q8**: Should analytics refresh on task drag-and-drop status changes?
  - **Recommendation**: Yes, refresh via `router.refresh()` after mutation

- [ ] **Q9**: Should we add a "Last Updated" timestamp to analytics section?
  - **Recommendation**: Yes, display subtly in footer

- [ ] **Q10**: Should dependencies analytics require separate SQL query or use existing task_dependencies data?
  - **Recommendation**: Separate optimized query (avoid N+1 problem)

---

## Glossary

| Term | Definition |
|------|------------|
| **InfoCard** | Reusable card component for displaying structured information with construction-themed styling |
| **DashboardStats** | Current analytics component to be replaced (4 metrics) |
| **TaskBoard** | Main task management component with Kanban/List views |
| **Budget Variance** | Difference between planned_cost and actual_cost (positive = under budget) |
| **Schedule Performance** | Measure of on-time task completion vs overdue/at-risk tasks |
| **Workload Distribution** | Assignment of tasks across team members |
| **Procurement Status** | Material ordering/delivery state (needed, ordered, delivered) |
| **Velocity** | Rate of task completion (tasks per day) |
| **Hero Card** | Larger, emphasized InfoCard for primary metrics |
| **At-Risk Task** | Task due within 3 days with status = todo or in_progress |
| **Blocked Task** | Task with status = 'blocked' and blocked_reason populated |
| **Material Assignment** | Link between material and task via material_assignments table |
| **Task Dependency** | Prerequisite task that must complete before dependent task starts |

---

## Approval

**Reviewer Questions:**

1. Do the 10 analytics cover the most critical GC/PM needs?
2. Is the InfoCard grid layout (2-4-5 columns) responsive enough?
3. Should any analytics be moved to "Must Have" or "Could Have"?
4. Are the color-coding rules clear and consistent?
5. Does the data model support all required queries efficiently?

---

**Do the requirements look good? If so, we can move on to the design.**

---

## Research Sources

Industry research on construction KPIs informed this requirements document:

- [Construction KPIs that Help Build a Better Business - CFMA](https://cfma.org/articles/construction-kpis-that-help-build-a-better-business)
- [Construction KPI Examples | Construction Industry KPIs - Spider Strategies](https://www.spiderstrategies.com/kpi/industry/construction/)
- [8 Key Construction KPIs for Measuring Success | Procore](https://www.procore.com/library/construction-kpis)
- [7 Essential Construction KPIs for Effective Management | Linarc](https://www.linarc.com/buildspace/construction-kpis)
- [15 KPIs For Construction Project: Construction KPIs Examples - Ajelix](https://ajelix.com/bi/kpis-for-construction/)
- [5 Financial Construction KPIs Every Contractor Should Track - Buildern](https://buildern.com/resources/blog/financial-construction-kpis/)
- [Essential Construction KPIs to Measure and Track | Dusty Robotics](https://www.dustyrobotics.com/articles/essential-construction-kpis-to-measure-and-track)
- [How to Read Key Performance Indicators (KPIs) - Foundation Software](https://www.foundationsoft.com/learn/how-to-read-key-performance-indicators-kpis/)
- [Key Performance Indicators in Construction - OnIndus](https://www.onindus.com/key-performance-indicators-in-construction/)
- [Top 12 Construction KPIs Every Project Manager Should Know - SmartPM](https://smartpm.com/blog/12-fundamental-key-performance-indicators-in-construction)
