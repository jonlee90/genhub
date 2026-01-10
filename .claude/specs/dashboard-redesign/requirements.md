# Dashboard Redesign - Requirements

## Overview
Redesign the GenHub main dashboard (`/app`) to provide general contractors with an at-a-glance command center displaying critical KPIs, project health, financial metrics, and actionable insights. The dashboard replaces the current placeholder stats with real data and adds powerful analytics widgets while preserving the existing Quick Actions section.

## Personas
- **Primary**: GC (General Contractor/Owner) - Needs company-wide visibility into all projects, finances, and team performance
- **Secondary**: PM (Project Manager) - Wants quick access to project status, task progress, and schedule health
- **Tertiary**: Admin - Monitors team activity, expense approvals, and system health

---

## User Stories

### US-1: View Company-Wide KPI Summary
**As a** GC,
**I want** to see key performance indicators at the top of my dashboard,
**So that** I can quickly assess overall company health without drilling into individual projects.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL display 4-6 primary KPI cards within 2 seconds
- IF data is loading THE SYSTEM SHALL display skeleton placeholders for each KPI card
- WHEN user hovers over a KPI card THE SYSTEM SHALL display a tooltip with additional context
- IF no projects exist THE SYSTEM SHALL display zero values with helpful empty state messaging

**KPIs Required:**
1. Active Projects (count with trend indicator)
2. Tasks Due This Week (count, with overdue highlight)
3. Budget Health (overall CPI or utilization %)
4. Team Utilization (assigned vs. unassigned tasks)
5. Pending Approvals (expenses + tasks awaiting review)
6. Schedule Performance (projects on-time vs. delayed)

**Priority:** Critical

---

### US-2: View Project Status Overview
**As a** GC,
**I want** to see a visual breakdown of all my projects by status,
**So that** I can identify which projects need attention.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL display a project status widget showing active, on-hold, completed, and archived counts
- WHEN user clicks on a status segment THE SYSTEM SHALL navigate to projects page filtered by that status
- IF no projects exist THE SYSTEM SHALL display "No projects yet" with a CTA to create first project

**Priority:** Critical

---

### US-3: View Task Completion Progress
**As a** PM,
**I want** to see task completion metrics across all projects,
**So that** I can track overall productivity and identify bottlenecks.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL display a task completion widget showing:
  - Total tasks, completed, in-progress, blocked, overdue counts
  - Visual progress indicator (progress bar or ring)
- WHEN tasks are blocked THE SYSTEM SHALL highlight blocked count in warning color
- WHEN tasks are overdue THE SYSTEM SHALL highlight overdue count in error color
- IF user clicks the widget THE SYSTEM SHALL navigate to /app/tasks

**Priority:** High

---

### US-4: View Budget & Expense Summary
**As a** GC,
**I want** to see financial health metrics including budget utilization and pending expenses,
**So that** I can manage cash flow and prevent cost overruns.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL display:
  - Total planned budget across projects
  - Total actual spend to date
  - Budget variance (under/over)
  - Pending expense count and amount
- IF budget utilization exceeds 90% THE SYSTEM SHALL display warning indicator
- IF budget utilization exceeds 100% THE SYSTEM SHALL display error indicator
- WHEN user clicks pending expenses THE SYSTEM SHALL navigate to /app/expenses?status=pending

**Priority:** High

---

### US-5: View Schedule Health
**As a** PM,
**I want** to see how many projects/tasks are on schedule vs. at risk vs. delayed,
**So that** I can proactively address schedule slippage.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL display schedule metrics:
  - On-time count (green)
  - At-risk count (tasks due within 3 days, yellow/amber)
  - Overdue count (red)
- WHEN there are at-risk or overdue items THE SYSTEM SHALL display them prominently
- IF all items are on-time THE SYSTEM SHALL display success indicator

**Priority:** High

---

### US-6: View Team Activity Summary
**As a** GC,
**I want** to see team-related metrics like member count and workload distribution,
**So that** I can ensure work is properly distributed and no one is overloaded.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL display:
  - Total team members
  - Top assignees with task counts (top 3-5)
  - Unassigned task count
- IF unassigned tasks exist THE SYSTEM SHALL highlight with warning color
- WHEN user clicks team widget THE SYSTEM SHALL navigate to /app/team

**Priority:** Medium

---

### US-7: View Material Procurement Status
**As a** PM,
**I want** to see material procurement status at a glance,
**So that** I can ensure materials are ordered and delivered on time.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL display material status counts:
  - Needed (not yet ordered)
  - Ordered (in transit)
  - Delivered
- IF materials are needed THE SYSTEM SHALL highlight to prompt action
- WHEN user clicks widget THE SYSTEM SHALL navigate to /app/materials

**Priority:** Medium

---

### US-8: Preserve Quick Actions Section
**As a** User,
**I want** the Quick Actions section to remain on the dashboard,
**So that** I can quickly navigate to common tasks.

**Acceptance Criteria (EARS):**
- WHEN dashboard renders THE SYSTEM SHALL display Quick Actions section with existing functionality
- THE SYSTEM SHALL maintain current Quick Actions: Create Project, Add Task, Invite Team
- WHEN user clicks a quick action THE SYSTEM SHALL navigate to the appropriate page

**Priority:** Critical

---

### US-9: View Velocity/Trend Indicators
**As a** GC,
**I want** to see trend indicators on key metrics,
**So that** I can understand if things are improving or declining.

**Acceptance Criteria (EARS):**
- WHEN displaying task completion THE SYSTEM SHALL show velocity trend (tasks/day vs. previous period)
- IF trend is positive THE SYSTEM SHALL display green up arrow with percentage
- IF trend is negative THE SYSTEM SHALL display red down arrow with percentage
- IF insufficient historical data THE SYSTEM SHALL hide trend indicator

**Priority:** Low

---

### US-10: Dashboard Performance
**As a** User,
**I want** the dashboard to load quickly even with many projects,
**So that** I don't wait for critical information.

**Acceptance Criteria (EARS):**
- WHEN dashboard loads THE SYSTEM SHALL render initial UI within 500ms
- WHEN data fetches THE SYSTEM SHALL complete within 2 seconds for companies with <50 projects
- WHILE data is loading THE SYSTEM SHALL display skeleton placeholders
- IF data fails to load THE SYSTEM SHALL display error state with retry option

**Priority:** High

---

## Out of Scope
- Real-time WebSocket updates (use page refresh or manual refresh)
- Custom widget configuration/drag-and-drop layout
- Drill-down charts with historical trends over time (future enhancement)
- PDF/export functionality
- Mobile-specific dashboard layout (responsive design is in scope)
- Comparison between projects
- AI-powered insights/recommendations

## Dependencies
- Existing Server Actions: `getTaskAnalytics`, `getExpenseAnalytics`, `getProjects`
- New Server Action needed: `getDashboardData` (aggregated query for performance)
- Database: All existing tables (projects, tasks, expenses, materials, team)

## Non-Functional Requirements
- **Performance**: Initial paint <500ms, data load <2s, skeleton loading during fetch
- **Security**: All data filtered by company_id via RLS, auth required
- **Mobile**: Responsive grid (2 columns on tablet, 1 column on mobile)
- **Accessibility**: Proper heading hierarchy, ARIA labels on interactive elements

---

## Widget Priority Matrix

| Widget | Priority | Data Source | Complexity |
|--------|----------|-------------|------------|
| KPI Cards (top row) | Critical | aggregated | Medium |
| Quick Actions | Critical | static | Low |
| Project Status | Critical | projects table | Low |
| Task Progress | High | tasks/analytics | Medium |
| Budget Summary | High | projects + expenses | Medium |
| Schedule Health | High | tasks | Medium |
| Team Activity | Medium | team + tasks | Medium |
| Materials Status | Medium | materials | Low |
| Velocity Trend | Low | task_activity | High |

---

## Research Sources
- [Top 12 Construction KPIs Every Project Manager Should Know](https://smartpm.com/blog/12-fundamental-key-performance-indicators-in-construction)
- [Essential Project Management KPIs for 2025](https://premiercs.com/blog/project-management-kpis-essential-metrics-to-prevent-cost-overruns-2025-guide)
- [Construction Dashboard Best Practices](https://www.mastt.com/blogs/ultimate-construction-dashboard-capital-projects)
- [Bold BI Construction Dashboard Examples](https://www.boldbi.com/dashboard-examples/construction/project-monitoring-dashboard/)

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to design)
