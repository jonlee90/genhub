# ProjectCard Redesign - Implementation Tasks

## Overview
Implementation plan for enhancing the ProjectCard component based on the approved design at `.claude/docs/ui-plans/project-card-redesign.md`.

**Target Component**: `components/projects/ProjectCard.tsx`
**Server Action**: `app/actions/projects.ts`

## Requirements Traceability

| Requirement | Source | Tasks |
|-------------|--------|-------|
| Budget variance display | Design: Priority 2 Critical Metrics | PC-003, PC-004 |
| Schedule status indicator | Design: Priority 2 Critical Metrics | PC-003, PC-005 |
| Task summary badges | Design: Priority 3 Supporting Info | PC-006, PC-007 |
| Materials status | Design: Priority 3 Supporting Info | PC-008 |
| Enhanced footer with quick actions | Design: Priority 4 Optional/Hover | PC-009, PC-010 |
| Responsive design adjustments | Design: Responsive Considerations | PC-011 |
| Animations and micro-interactions | Design: Animation Strategy | PC-012 |

---

## Phase 1: Backend Data Preparation

- [ ] 1. Create server action for project stats aggregation
  - **Objective**: Create `getProjectsWithStats()` function that returns enriched project data with task counts, budget variance, and schedule metrics
  - **Files to modify**: `app/actions/projects.ts`
  - **Acceptance criteria**:
    - Function returns all existing project fields plus `stats` object
    - Stats include: `actualSpent`, `taskCounts` (total, completed, blocked, overdue, todo), `schedule` (daysRemaining, status, daysBehind)
    - Uses efficient SQL aggregation (avoid N+1 queries)
    - Maintains existing authentication and company scoping
  - **Complexity**: Medium

- [ ] 1.1. Add task count aggregation query
  - **Objective**: Add SQL logic to count tasks by status (completed, blocked, overdue, todo) for each project
  - **Files to modify**: `app/actions/projects.ts`
  - **Dependencies**: Task 1
  - **Acceptance criteria**:
    - Query groups tasks by status per project
    - Overdue calculation: `due_date < NOW() AND status != 'completed'`
    - Blocked calculation: `status = 'blocked'`
    - Returns counts as part of stats object
  - **Complexity**: Simple

- [ ] 1.2. Add budget variance calculation
  - **Objective**: Calculate actual spending from tasks (actual_cost) and compute variance against planned budget
  - **Files to modify**: `app/actions/projects.ts`
  - **Dependencies**: Task 1
  - **Acceptance criteria**:
    - Sum `actual_cost` from tasks table where `project_id` matches
    - Calculate variance: `budget - actualSpent`
    - Calculate `isUnderBudget` boolean
    - Return in stats object
  - **Complexity**: Simple

- [ ] 1.3. Add schedule status calculation
  - **Objective**: Calculate days remaining, schedule status (on-time/at-risk/delayed), and days behind
  - **Files to modify**: `app/actions/projects.ts`
  - **Dependencies**: Task 1
  - **Acceptance criteria**:
    - Days remaining: `DATEDIFF(end_date, NOW())`
    - Status logic: on-time (0 days behind), at-risk (1-5 days behind), delayed (>5 days behind)
    - Days behind calculated from expected progress vs actual completion_percentage
    - Return in stats object
  - **Complexity**: Medium

- [ ] 1.4. Add materials status query (optional enhancement)
  - **Objective**: Query material_assignments table for materials needed/ordered counts
  - **Files to modify**: `app/actions/projects.ts`
  - **Dependencies**: Task 1
  - **Acceptance criteria**:
    - Count materials where `procurement_status = 'needed'`
    - Count materials where `procurement_status = 'ordered'`
    - Return in stats.materials object
  - **Complexity**: Simple

---

## Phase 2: Utility Functions

- [ ] 2. Add date formatting helper functions
  - **Objective**: Add `formatDistanceToNow()` and `calculateScheduleStatus()` helper functions
  - **Files to modify**: `lib/utils.ts`
  - **Acceptance criteria**:
    - `formatDistanceToNow(date)` returns human-readable time difference (e.g., "2h ago", "3 days ago")
    - `calculateScheduleStatus(endDate, completionPercentage)` returns status object with `status`, `daysRemaining`, `daysBehind`
    - Functions are fully typed with TypeScript
    - Install `date-fns` if not already installed: `pnpm add date-fns`
  - **Complexity**: Simple

- [ ] 2.1. Add budget formatting helpers
  - **Objective**: Add helper functions for formatting budget values and variance display
  - **Files to modify**: `lib/utils.ts`
  - **Dependencies**: Task 2
  - **Acceptance criteria**:
    - `formatBudget(amount)` returns formatted string (e.g., "$250K", "$1.2M")
    - `getBudgetVarianceDisplay(planned, actual)` returns object with `variance`, `isUnder`, `displayText`
  - **Complexity**: Simple

---

## Phase 3: TypeScript Types

- [ ] 3. Update ProjectCard type definitions
  - **Objective**: Extend Project type to include stats object with all new metrics
  - **Files to modify**: `components/projects/ProjectCard.tsx` (local types)
  - **Acceptance criteria**:
    - Create `ProjectStats` interface with taskCounts, schedule, materials, actualSpent
    - Extend `ProjectCardProps` to accept optional `stats` prop
    - Maintain backward compatibility (stats is optional)
  - **Complexity**: Simple

---

## Phase 4: Component Implementation

- [ ] 4. Add Budget & Schedule grid section
  - **Objective**: Implement the 2-column grid showing budget performance and schedule status
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Tasks 1.2, 1.3, 2.1, 3
  - **Acceptance criteria**:
    - 2-column grid layout with budget on left, schedule on right
    - Budget shows: Planned, Actual, Variance with color coding
    - Schedule shows: Days remaining, status badge (On Track/At Risk/Delayed)
    - Uses construction theme colors (green for under budget, red for over)
    - Responsive: stacks vertically on mobile
  - **Complexity**: Medium

- [ ] 4.1. Implement budget column UI
  - **Objective**: Build the budget column with planned vs actual display and variance indicator
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Task 4
  - **Acceptance criteria**:
    - DollarSign icon header
    - Planned and Actual rows with right-aligned values
    - Variance indicator with TrendingUp/TrendingDown icons
    - Green for under budget, red for over budget
  - **Complexity**: Simple

- [ ] 4.2. Implement schedule column UI
  - **Objective**: Build the schedule column with days remaining and status indicator
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Task 4
  - **Acceptance criteria**:
    - Calendar icon header
    - Days remaining display
    - Status badge: CheckCircle2 (on-time), AlertCircle (at-risk), Clock (delayed)
    - Color coding per design (green/yellow/red)
  - **Complexity**: Simple

- [ ] 5. Add Task Summary Badges section
  - **Objective**: Implement horizontal row of task status badges (Done, Blocked, Overdue, Todo)
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Tasks 1.1, 3
  - **Acceptance criteria**:
    - Flex wrap layout with gap-2
    - Each badge shows icon + count + label
    - Completed: green, Blocked: yellow (only if > 0), Overdue: red (only if > 0), Todo: gray
    - Badges have subtle background matching their status color
    - whileHover scale animation (1.05)
  - **Complexity**: Medium

- [ ] 5.1. Create TaskBadge sub-component
  - **Objective**: Extract reusable TaskBadge component for consistent styling
  - **Files to modify**: `components/projects/ProjectCard.tsx` (inline) or new file
  - **Dependencies**: Task 5
  - **Acceptance criteria**:
    - Props: icon, count, label, colorScheme, showIfZero
    - Applies motion.div with hover animation
    - Consistent padding, border-radius, font styles
  - **Complexity**: Simple

- [ ] 6. Enhance phase progress display
  - **Objective**: Add phase completion percentage next to phase name
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: None (uses existing data)
  - **Acceptance criteria**:
    - Display format: "Phase X of Y: {phase.name}" with "{phase.completion_percentage}%" right-aligned
    - Uses existing `currentPhase` logic
    - Styled in construction-blue
  - **Complexity**: Simple

- [ ] 7. Add risk indicators to health section
  - **Objective**: Show blocked/overdue warning when project has risks
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Tasks 1.1, 5
  - **Acceptance criteria**:
    - If blockedTasks > 0 OR overdueTasks > 0, show warning below health badge
    - AlertTriangle icon with yellow color
    - Text: "{blockedTasks} blocked, {overdueTasks} overdue"
  - **Complexity**: Simple

- [ ] 8. Add materials status to footer
  - **Objective**: Show materials needed count in footer section
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Task 1.4
  - **Acceptance criteria**:
    - Package icon with yellow color when materials needed > 0
    - Display: "{count} needed"
    - Only shows if materialsNeeded > 0
  - **Complexity**: Simple

- [ ] 9. Enhance footer with last updated timestamp
  - **Objective**: Add "Updated {time}" display using formatDistanceToNow
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Task 2
  - **Acceptance criteria**:
    - Uses `project.updated_at` field
    - Format: "Updated 2h ago" or "Updated 3 days ago"
    - Positioned right side of footer
    - Small, muted text styling
  - **Complexity**: Simple

- [ ] 10. Add quick actions dropdown menu
  - **Objective**: Implement hover-reveal dropdown with Edit, Settings, Archive actions
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: None
  - **Acceptance criteria**:
    - MoreVertical icon trigger button
    - Shows on card hover (group-hover:opacity-100)
    - DropdownMenu with: Edit Project, Settings, Separator, Archive (red)
    - Slide-in animation from right
    - Prevent card navigation when clicking menu
  - **Complexity**: Medium

---

## Phase 5: Animations & Micro-interactions

- [ ] 11. Add staggered badge animations
  - **Objective**: Animate task summary badges with staggered fade-in on card mount
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Task 5
  - **Acceptance criteria**:
    - Each badge fades in with slight delay (index * 0.05s)
    - initial: opacity 0, y: 10
    - animate: opacity 1, y: 0
    - duration: 0.3s
  - **Complexity**: Simple

- [ ] 11.1. Add warning pulse animation
  - **Objective**: Add subtle pulse animation on over-budget or delayed indicators
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Tasks 4, 5
  - **Acceptance criteria**:
    - motion.div animate with scale pulse [1, 1.05, 1]
    - backgroundColor opacity pulse
    - repeat: Infinity, duration: 2s
    - Only applies when isOverBudget or scheduleStatus === 'delayed'
  - **Complexity**: Simple

- [ ] 11.2. Add progress bar fill animation
  - **Objective**: Animate progress bar from 0 to actual value on mount
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: None
  - **Acceptance criteria**:
    - Use framer-motion to animate width from 0% to completionPercentage
    - Duration: 1s with ease-out
    - Triggers on card mount/visibility
  - **Complexity**: Simple

---

## Phase 6: Responsive Design

- [ ] 12. Implement mobile responsive adjustments
  - **Objective**: Adjust card layout for mobile screens (< 640px)
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Tasks 4, 5
  - **Acceptance criteria**:
    - Health ring: 60pt diameter on mobile (vs 80pt desktop)
    - Budget/Schedule grid: stack vertically with `sm:grid-cols-2 grid-cols-1`
    - Task badges: 2-row wrap, possibly show "+N more" if > 4
    - Hide quick actions menu (accessible via project detail)
    - Test at 320px, 375px, 640px breakpoints
  - **Complexity**: Medium

- [ ] 12.1. Create responsive health ring
  - **Objective**: Make health score ring responsive (60pt mobile, 70pt tablet, 80pt desktop)
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: Task 12
  - **Acceptance criteria**:
    - Use Tailwind responsive classes for sizing
    - SVG viewBox adjusts appropriately
    - Text size scales with ring size
  - **Complexity**: Simple

---

## Phase 7: Integration & Testing

- [ ] 13. Update project list page to use getProjectsWithStats
  - **Objective**: Modify the projects list page to fetch enriched project data
  - **Files to modify**: `app/app/projects/page.tsx`
  - **Dependencies**: Task 1
  - **Acceptance criteria**:
    - Replace current `getProjects()` call with `getProjectsWithStats()`
    - Pass stats prop to each ProjectCard
    - Maintain loading and error states
    - Verify performance (< 200ms for list of 20 projects)
  - **Complexity**: Simple

- [ ] 13.1. Add loading skeleton for new sections
  - **Objective**: Create skeleton loading state for budget/schedule grid and task badges
  - **Files to modify**: `components/projects/ProjectCard.tsx` or new skeleton component
  - **Dependencies**: Tasks 4, 5
  - **Acceptance criteria**:
    - Shimmer animation on loading
    - Matches layout of actual content
    - Shows when stats is undefined/loading
  - **Complexity**: Simple

- [ ] 14. Add accessibility attributes
  - **Objective**: Ensure all new elements have proper ARIA labels and keyboard navigation
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: All Phase 4 tasks
  - **Acceptance criteria**:
    - All icon-only elements have aria-label
    - Progress bar has aria-valuemin, aria-valuemax, aria-valuenow
    - Quick actions menu is keyboard accessible
    - Color contrast meets WCAG AA (4.5:1 minimum)
    - Screen reader announces status changes
  - **Complexity**: Simple

- [ ] 15. Write unit tests for utility functions
  - **Objective**: Add tests for new helper functions in lib/utils.ts
  - **Files to create**: `lib/__tests__/utils.test.ts`
  - **Dependencies**: Task 2
  - **Acceptance criteria**:
    - Tests for formatDistanceToNow with various date inputs
    - Tests for calculateScheduleStatus with edge cases
    - Tests for formatBudget with various amounts
    - All tests pass
  - **Complexity**: Simple

- [ ] 16. Performance optimization
  - **Objective**: Ensure card rendering is optimized for lists of 20+ projects
  - **Files to modify**: `components/projects/ProjectCard.tsx`
  - **Dependencies**: All Phase 4 tasks
  - **Acceptance criteria**:
    - Use useMemo for derived calculations (task stats, budget variance)
    - Avoid unnecessary re-renders with React.memo if needed
    - Lazy load rarely-used icons
    - Animations use GPU-accelerated transforms (not layout properties)
    - Measure with React DevTools Profiler
  - **Complexity**: Medium

---

## Completion Checklist

### Pre-Implementation
- [ ] Verify `date-fns` is installed or install it
- [ ] Review existing database schema for tasks and materials tables
- [ ] Confirm project_phases includes completion_percentage field

### Post-Implementation
- [ ] All tasks marked complete
- [ ] Build passes (`pnpm build`)
- [ ] No TypeScript errors
- [ ] Mobile responsive verified (Chrome DevTools)
- [ ] Accessibility audit passed (Lighthouse)
- [ ] Code review completed

---

## Notes

- **Backward Compatibility**: The `stats` prop is optional - card should gracefully degrade if stats not provided
- **Performance Target**: < 200ms render time per card
- **Mobile Priority**: Construction workers use phones on-site - ensure touch targets are 44x44px minimum
- **Color Consistency**: Use existing Tailwind config colors (`construction-blue`, `construction-green`, etc.)
