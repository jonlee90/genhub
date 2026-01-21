# Requirement: Gantt & Kanban Performance Audit

## Problem Statement

The Gantt Chart and KanbanBoard components (`components/tasks/gantt/*` and `components/tasks/KanbanBoard.tsx`) serve as critical visualization interfaces for construction project task management in GenHub. As projects scale to handle 100+ tasks with complex dependencies, performance and usability audits are required to:

1. **Optimize Gantt Chart Performance**: Address DOM growth at scale, dependency line recalculation overhead, and responsive configuration recalculation
2. **Implement KanbanBoard Virtualization**: Add `@tanstack/react-virtual` (already installed v3.13.13) to handle large task lists in columns
3. **Ensure Drag-and-Drop Compatibility**: Verify dnd-kit integration works correctly with virtualized lists
4. **Validate Accessibility**: Ensure keyboard navigation and screen reader support for timeline and kanban interactions
5. **Verify Error Handling**: Confirm graceful degradation during drag operations and data loading failures

This audit will establish a baseline quality assessment, implement virtualization, and generate a remediation plan for any identified issues.

---

## Scope

### Components In Scope

**Gantt Chart Ecosystem (7 components):**
- `components/tasks/gantt/GanttChart.tsx` - Main orchestrator (~400 lines)
- `components/tasks/gantt/GanttHeader.tsx` - Column headers (memoized)
- `components/tasks/gantt/GanttTimeline.tsx` - Date columns/grid (SVG)
- `components/tasks/gantt/GanttDependencyLines.tsx` - Dependency arrows (SVG)
- `components/tasks/gantt/GanttTaskRow.tsx` - Task row container (memoized, content-visibility)
- `components/tasks/gantt/GanttTaskBar.tsx` - Draggable task bar (memoized)
- `components/tasks/gantt/GanttViewToggle.tsx` - View mode toggle (memoized)

**Kanban Board Ecosystem (3 components):**
- `components/tasks/KanbanBoard.tsx` - Main board with columns (~262 lines)
- `components/tasks/KanbanColumn.tsx` - Droppable column container
- `components/tasks/TaskCard.tsx` - Sortable task card (memoized)

**Supporting Libraries:**
- `@tanstack/react-virtual` v3.13.13 - Virtualization (already installed)
- `@dnd-kit/*` - Drag-and-drop framework

### Server Actions In Scope

**Task actions (`app/actions/tasks.ts`):**
- `updateTask()` - Task field updates (start_date, due_date for Gantt drag)
- `updateTaskStatus()` - Status changes (Kanban column moves)
- `getTasksForProject()` - Bulk task fetching for timeline/board views
- `addTaskDependency()` / `removeTaskDependency()` - Dependency management

### Out of Scope

- Database schema/migration changes
- RLS policy modifications (audit only, no changes)
- TaskDetail component ecosystem (separate audit)
- TaskModal component
- Server Component pages that render Gantt/Kanban
- Third-party library internals

---

## Personas

| Persona | Role | Audit Concern |
|---------|------|---------------|
| **Performance Engineer** | Optimizes runtime | Virtualization, re-renders, DOM growth |
| **Frontend Architect** | Reviews patterns | dnd-kit + virtual list integration |
| **Security Lead** | Reviews for vulnerabilities | Auth on drag operations, data exposure |
| **Accessibility Specialist** | Ensures inclusive design | Keyboard nav, screen readers, drag accessibility |
| **QA Engineer** | Validates functionality | Drag-drop edge cases, scroll behavior |

---

## User Stories

### US-1: Timeline Rendering at Scale
**As a** Performance Engineer,
**I want** the Gantt Chart to render 1000+ tasks without performance degradation,
**So that** large construction projects remain usable.

**Acceptance Criteria (EARS):**
- WHEN the Gantt loads with 500+ tasks THE SYSTEM SHALL use virtualization to limit DOM nodes
- WHEN the user scrolls the timeline THE SYSTEM SHALL maintain 60fps scroll performance
- WHEN tasks are filtered/sorted THE SYSTEM SHALL update without full re-render
- WHEN the audit examines GanttTaskRow rendering THE SYSTEM SHALL verify content-visibility usage
- WHEN the audit identifies DOM growth issues THE SYSTEM SHALL provide virtualization recommendations

### US-2: Smooth Drag-Drop on Gantt Bars
**As a** Project Manager,
**I want** to drag task bars to reschedule without jank,
**So that** timeline adjustments feel responsive.

**Acceptance Criteria (EARS):**
- WHEN dragging a task bar THE SYSTEM SHALL show visual feedback within 16ms
- WHEN the drag completes THE SYSTEM SHALL update dates optimistically
- WHEN the audit examines drag handlers THE SYSTEM SHALL verify proper memoization
- WHEN the audit examines dependency recalculation THE SYSTEM SHALL identify hover-triggered overhead
- IF drag performance drops below 30fps THEN THE SYSTEM SHALL flag for remediation

### US-3: Kanban Column Scrolling with 100+ Tasks
**As a** Field Worker,
**I want** to scroll through large task columns smoothly on mobile,
**So that** I can find my assigned tasks quickly.

**Acceptance Criteria (EARS):**
- WHEN a column has 100+ tasks THE SYSTEM SHALL virtualize the task list
- WHEN the user scrolls THE SYSTEM SHALL render only visible tasks + overscan
- WHEN the audit examines KanbanColumn THE SYSTEM SHALL verify useVirtualizer implementation
- WHEN the audit examines TaskCard THE SYSTEM SHALL verify proper memoization
- WHEN the audit identifies performance issues THE SYSTEM SHALL provide react-virtual patterns

### US-4: Dependency Line Hover Performance
**As a** Performance Engineer,
**I want** dependency line highlighting to not trigger full recalculation,
**So that** hover interactions remain smooth.

**Acceptance Criteria (EARS):**
- WHEN the user hovers a task THE SYSTEM SHALL highlight related dependency lines only
- WHEN the audit examines GanttDependencyLines THE SYSTEM SHALL verify hover state isolation
- WHEN the audit examines line position calculation THE SYSTEM SHALL verify memoization
- IF hoveredTaskId change triggers full recalc THEN THE SYSTEM SHALL flag for optimization
- WHEN the audit identifies the issue THE SYSTEM SHALL recommend state separation

### US-5: Mobile Kanban Tab Switching
**As a** Field Worker,
**I want** to switch between status columns quickly on mobile,
**So that** I can check different task statuses efficiently.

**Acceptance Criteria (EARS):**
- WHEN switching mobile tabs THE SYSTEM SHALL preserve scroll position per column
- WHEN the audit examines mobile view THE SYSTEM SHALL verify virtualizer reset on tab change
- WHEN the audit examines Framer Motion THE SYSTEM SHALL identify infinite animation overhead
- IF empty state animations run continuously THEN THE SYSTEM SHALL recommend optimization
- WHEN the audit examines date parsing THE SYSTEM SHALL verify TaskCard memoization

---

## Non-Functional Requirements

### Performance Targets
- Gantt Chart: <100ms Time to Interactive with 500 tasks
- Kanban Column: 60fps scroll with 200+ tasks
- Dependency lines: <16ms hover response
- Mobile tab switch: <200ms perceived latency

### Memory Targets
- Virtualized lists: Maintain <50 DOM nodes per column
- Gantt viewport: Limit visible rows to viewport + 10 overscan

### Audit Requirements
- Audit execution time: < 3 hours for full audit
- Report generation: < 15 minutes
- No production impact during audit

### Documentation Requirements
- All findings must include file path and line numbers
- All findings must include severity classification
- Performance findings must include measurement methodology
- Remediation plan must include code examples from existing patterns

---

## Constraints

1. **No Code Changes During Audit Phase**: Audit is observation-only; implementation tracked separately
2. **Use Existing Patterns**: Virtualization must follow MarkerPanel.tsx pattern (already using react-virtual)
3. **GenHub Architecture Compliance**: Must respect client/server boundary (no Supabase in 'use client')
4. **dnd-kit Compatibility**: Virtualization must work with existing SortableContext usage
5. **Timeline**: Complete audit within one development sprint
6. **Reporting Format**: Markdown findings compatible with existing spec structure

---

## Dependencies

- Access to running development server for dynamic testing
- React DevTools Profiler for render analysis
- Chrome DevTools Performance tab for scroll/drag analysis
- Test project with 500+ tasks for scale testing
- Reference implementation: `components/projects/spatial/MarkerPanel.tsx` (react-virtual pattern)

---

## Success Criteria

The audit is successful when:
1. All ~134 audit checkpoints have been evaluated
2. Findings report generated with severity classifications
3. Virtualization implementation plan created for KanbanBoard
4. Gantt dependency line optimization plan created
5. No Critical severity issues left unaddressed in plan
6. Sign-off from designated reviewer

---

**Status:** PENDING APPROVAL

**Approval Required:** [ ] Yes - Proceed to Design Phase upon approval
