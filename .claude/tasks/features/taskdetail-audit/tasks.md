# Tasks: Gantt & Kanban Performance Audit

## References
- Requirements: `.claude/tasks/features/taskdetail-audit/requirement.md`
- Design: `.claude/tasks/features/taskdetail-audit/design.md`

---

## Phase 1: Static Analysis - Security & Type Safety

### Task 1.1: Security Review - Gantt Authentication & Authorization

**Agent:** code-reviewer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Verify all Gantt-related Server Actions perform proper authentication and role-based authorization.

**Files to Audit:**
- `app/actions/tasks.ts` (updateTask - date changes)
- `app/actions/tasks.ts` (addTaskDependency, removeTaskDependency)
- `components/tasks/gantt/GanttChart.tsx` (canEdit prop usage)
- `components/tasks/gantt/GanttTaskBar.tsx` (drag disabled logic)

**Checkpoints to Evaluate:**
- [ ] SEC-01: getUserContext() called in updateTask
- [ ] SEC-03: Auth error returns early with proper error object
- [ ] SEC-05: verifyTaskAccess() called for task updates
- [ ] SEC-06: addTaskDependency verifies both tasks in same project
- [ ] SEC-07: removeTaskDependency verifies both tasks in same project
- [ ] SEC-08: canEdit derived correctly in GanttChart
- [ ] SEC-10: Drag disabled when !canEdit in GanttTaskBar

**Success Criteria:**
- All 7 checkpoints evaluated
- Findings documented with file/line references
- Critical issues flagged for immediate attention

**Output:** Section in findings report for SEC-01, SEC-03, SEC-05-08, SEC-10

---

### Task 1.2: Security Review - Kanban Authentication & Authorization

**Agent:** code-reviewer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Verify all Kanban-related Server Actions perform proper authentication and role-based authorization.

**Files to Audit:**
- `app/actions/tasks.ts` (updateTaskStatus - column moves)
- `app/actions/tasks.ts` (getTasksForProject - bulk fetch)
- `components/tasks/KanbanBoard.tsx` (canEdit prop usage)
- `components/tasks/TaskCard.tsx` (drag enabled logic)

**Checkpoints to Evaluate:**
- [ ] SEC-02: getUserContext() called in updateTaskStatus
- [ ] SEC-03: Auth error returns early
- [ ] SEC-04: getTasksForProject enforces company_id isolation
- [ ] SEC-09: canEdit derived correctly in KanbanBoard
- [ ] VAL-03: Status enum validation in updateTaskStatus

**Success Criteria:**
- All 5 checkpoints evaluated
- Findings documented with file/line references

**Output:** Section in findings report for SEC-02, SEC-03, SEC-04, SEC-09, VAL-03

---

### Task 1.3: Input Validation & Type Safety Review

**Agent:** code-reviewer
**Estimated Effort:** Small (20-30 min)

**Objective:** Verify all inputs are validated and types are correct.

**Files to Audit:**
- `app/actions/tasks.ts` (Zod schemas for task operations)
- `components/tasks/gantt/GanttChart.tsx` (Props interface)
- `components/tasks/KanbanBoard.tsx` (Props interface)
- `components/tasks/TaskCard.tsx` (Props interface)

**Checkpoints to Evaluate:**
- [ ] VAL-01: Date validation in updateTask (Gantt drag)
- [ ] VAL-02: start_date <= due_date validation
- [ ] VAL-04: Task ID validated as UUID
- [ ] VAL-05: Project ID validated as UUID
- [ ] VAL-06: Dependency IDs validated as UUIDs
- [ ] VAL-07: No self-dependency check
- [ ] VAL-08: Circular dependency check
- [ ] TYPE-01: All components have explicit props interfaces
- [ ] TYPE-02: Zod schemas align with TypeScript types
- [ ] TYPE-03: TaskStatus enum consistency
- [ ] TYPE-04: Null checks present for nullable fields
- [ ] TYPE-05: No `any` types in audited files

**Methodology:**
```bash
# Search for any types
grep -r ": any" components/tasks/gantt/ components/tasks/KanbanBoard.tsx

# Run TypeScript compiler
npx tsc --noEmit 2>&1 | grep -E "gantt|Kanban|TaskCard"
```

**Success Criteria:**
- All 12 checkpoints evaluated
- Type mismatches identified
- Validation gaps documented

**Output:** Section in findings report for VAL-01 to VAL-08, TYPE-01 to TYPE-05

---

### Task 1.4: Data Exposure & RLS Review

**Agent:** code-reviewer (with Supabase access)
**Estimated Effort:** Small (20-30 min)

**Objective:** Verify no sensitive data exposed and RLS policies enforce isolation.

**Files to Audit:**
- `components/tasks/gantt/GanttChart.tsx` (props)
- `components/tasks/KanbanBoard.tsx` (props)
- `components/tasks/TaskCard.tsx` (props)
- RLS policies for tasks, task_dependencies

**Checkpoints to Evaluate:**
- [ ] EXP-01: GanttChart props contain only necessary fields
- [ ] EXP-02: KanbanBoard props contain only necessary fields
- [ ] EXP-03: company_id never passed to client
- [ ] EXP-04: Minimal assignee data in TaskCard
- [ ] EXP-05: Error messages don't include stack traces
- [ ] EXP-06: No console.log with sensitive data
- [ ] RLS-01: tasks SELECT enforces company_id
- [ ] RLS-02: tasks UPDATE enforces company_id
- [ ] RLS-03: task_dependencies SELECT policy
- [ ] RLS-04: task_dependencies INSERT policy
- [ ] RLS-05: task_dependencies DELETE policy
- [ ] RLS-06: getTasksForProject returns only company tasks

**Methodology:**
```bash
# Search for company_id in client components
grep -r "company_id" components/tasks/gantt/ components/tasks/KanbanBoard.tsx

# Search for console.log
grep -r "console.log" components/tasks/gantt/ components/tasks/KanbanBoard.tsx
```

**Success Criteria:**
- All 12 checkpoints evaluated
- Sensitive data exposure risks identified

**Output:** Section in findings report for EXP-01 to EXP-06, RLS-01 to RLS-06

---

## Phase 2: Performance Analysis - Gantt

### Task 2.1: Gantt Memoization Audit

**Agent:** code-reviewer or performance-engineer
**Estimated Effort:** Large (45-60 min)

**Objective:** Verify all Gantt components are properly memoized and optimized.

**Files to Audit:**
- `components/tasks/gantt/GanttChart.tsx`
- `components/tasks/gantt/GanttHeader.tsx`
- `components/tasks/gantt/GanttTimeline.tsx`
- `components/tasks/gantt/GanttDependencyLines.tsx`
- `components/tasks/gantt/GanttTaskRow.tsx`
- `components/tasks/gantt/GanttTaskBar.tsx`
- `components/tasks/gantt/GanttViewToggle.tsx`

**Checkpoints to Evaluate:**
- [ ] PERF-01: GanttHeader wrapped in React.memo
- [ ] PERF-02: GanttTimeline wrapped in React.memo
- [ ] PERF-03: GanttDependencyLines wrapped in React.memo
- [ ] PERF-04: GanttTaskRow wrapped in React.memo
- [ ] PERF-05: GanttTaskBar wrapped in React.memo
- [ ] PERF-06: GanttViewToggle wrapped in React.memo
- [ ] PERF-07: dateColumns uses useMemo
- [ ] PERF-08: taskPositions uses useMemo (Map)
- [ ] PERF-09: dependencyPaths uses useMemo
- [ ] PERF-10: Drag handlers use useCallback
- [ ] PERF-11: GanttTaskBar handlers use useCallback
- [ ] PERF-12: Date updates use useTransition

**Methodology:**
```bash
# Check for React.memo usage
grep -r "React.memo\|memo(" components/tasks/gantt/

# Check for useMemo/useCallback
grep -r "useMemo\|useCallback" components/tasks/gantt/

# Check for useTransition
grep -r "useTransition" components/tasks/gantt/
```

**Success Criteria:**
- All 12 checkpoints evaluated
- Memoization gaps identified
- Recommendations for missing optimizations

**Output:** Section in findings report for PERF-01 to PERF-12

---

### Task 2.2: Dependency Line Optimization Audit

**Agent:** code-reviewer or performance-engineer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Eliminate full recalculation on hover state changes.

**Files to Audit:**
- `components/tasks/gantt/GanttDependencyLines.tsx`
- `components/tasks/gantt/GanttChart.tsx` (hoveredTaskId state)

**Checkpoints to Evaluate:**
- [ ] SVG-01: Line positions are memoized with useMemo
- [ ] SVG-02: hoveredTaskId is separated from line position calculation
- [ ] SVG-03: DependencyPath component uses React.memo
- [ ] SVG-04: SVG doesn't rerender entirely on hover change
- [ ] SVG-05: Arrow head markers use <defs> for reuse
- [ ] STATE-03: hoveredTaskId change doesn't trigger line recalc

**Evidence to Collect:**
1. Current dependency array of line position useMemo
2. Whether hoveredTaskId is in that dependency array
3. Re-render count on hover using React DevTools

**Remediation Pattern (if issue found):**
```typescript
// Separate concerns
const linePositions = useMemo(() => calculatePositions(tasks), [tasks]);
const highlightedLines = useMemo(() =>
  hoveredTaskId ? getRelatedLines(hoveredTaskId, dependencies) : [],
  [hoveredTaskId, dependencies]
);
```

**Success Criteria:**
- All 6 checkpoints evaluated
- Hover performance measured
- Optimization recommendations with code examples

**Output:** Section in findings report for SVG-01 to SVG-05, STATE-03

---

### Task 2.3: Gantt SVG Rendering Audit

**Agent:** code-reviewer or performance-engineer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Verify SVG rendering is optimized for performance.

**Files to Audit:**
- `components/tasks/gantt/GanttTimeline.tsx`
- `components/tasks/gantt/GanttDependencyLines.tsx`

**Checkpoints to Evaluate:**
- [ ] SVG-06: Grid lines use virtualization or content-visibility
- [ ] SVG-07: Date labels are memoized
- [ ] SVG-08: Today marker renders once (not per row)
- [ ] PERF-21: content-visibility: auto on GanttTaskRow
- [ ] PERF-22: CSS animations used (not JS)
- [ ] VIRT-13: content-visibility as CSS fallback

**Methodology:**
1. Count DOM nodes with 500 tasks
2. Profile scroll performance in Chrome DevTools
3. Check for CSS animation usage vs requestAnimationFrame

**Success Criteria:**
- All 6 checkpoints evaluated
- DOM node count documented
- Scroll performance measured

**Output:** Section in findings report for SVG-06 to SVG-08, PERF-21, PERF-22, VIRT-13

---

## Phase 3: Performance Analysis - Kanban Virtualization

### Task 3.1: Implement KanbanBoard Virtualization

**Agent:** frontend-engineer
**Estimated Effort:** Large (60-90 min)

**Objective:** Add @tanstack/react-virtual to each KanbanColumn.

**Files to Modify:**
- `components/tasks/KanbanBoard.tsx`
- `components/tasks/KanbanColumn.tsx`

**Reference Pattern:** `components/projects/spatial/MarkerPanel.tsx`

**Implementation Steps:**
1. Add useVirtualizer hook to KanbanColumn
2. Configure estimateSize (~130px for TaskCard)
3. Set overscan to 5 for smooth scrolling
4. Apply absolute positioning with transform
5. Attach scroll container ref
6. Handle mobile tab switch with measureElement

**Checkpoints to Verify After Implementation:**
- [ ] VIRT-01: useVirtualizer hook added per column
- [ ] VIRT-02: scrollContainerRef properly attached
- [ ] VIRT-03: estimateSize matches TaskCard height (~130px)
- [ ] VIRT-04: overscan set to 5
- [ ] VIRT-05: getVirtualItems() renders only visible items
- [ ] VIRT-06: Absolute positioning applied
- [ ] VIRT-07: Transform translateY used
- [ ] VIRT-08: Container height set to getTotalSize()
- [ ] VIRT-09: Mobile tab switch resets virtualizer
- [ ] VIRT-10: Key uses task.id not index

**Code Pattern:**
```typescript
// In KanbanColumn.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const scrollContainerRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 130,
  overscan: 5,
});

const virtualItems = virtualizer.getVirtualItems();

return (
  <div ref={scrollContainerRef} className="overflow-auto h-full">
    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
      {virtualItems.map((virtualItem) => (
        <div
          key={tasks[virtualItem.index].id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          <TaskCard task={tasks[virtualItem.index]} />
        </div>
      ))}
    </div>
  </div>
);
```

**Success Criteria:**
- All 10 VIRT checkpoints pass
- Scroll performance 60fps with 200+ tasks
- DOM node count <50 per column

**Output:** Updated KanbanColumn.tsx with virtualization

---

### Task 3.2: dnd-kit + Virtualization Compatibility

**Agent:** frontend-engineer
**Estimated Effort:** Large (60-90 min)

**Objective:** Ensure drag-drop works correctly with virtualized lists.

**Files to Modify:**
- `components/tasks/KanbanColumn.tsx`
- `components/tasks/TaskCard.tsx`
- `components/tasks/KanbanBoard.tsx`

**Checkpoints to Verify:**
- [ ] DND-01: SortableContext items array has stable identity
- [ ] DND-02: useSortable hooks work across virtual renders
- [ ] DND-03: DragOverlay renders outside virtualizer
- [ ] DND-04: Drop zones work with virtual scroll position
- [ ] DND-05: Touch + pointer sensors configured
- [ ] DND-06: closestCorners collision detection used

**Implementation Considerations:**
1. SortableContext items must be task IDs, not task objects
2. DragOverlay must render at KanbanBoard level (outside columns)
3. Scroll position must be accounted for in drop calculations
4. useSortable hooks must handle virtual item unmounting gracefully

**Test Scenarios:**
1. Drag task from middle of long virtualized column
2. Drop task at scrolled-away position
3. Drag between columns while both are scrolled
4. Touch drag on mobile with virtualized tabs

**Success Criteria:**
- All 6 DND checkpoints pass
- Drag-drop works with 200+ tasks per column
- No janky behavior during cross-column drags

**Output:** Updated KanbanColumn.tsx, TaskCard.tsx with dnd-kit compatibility

---

### Task 3.3: Kanban Memoization Audit

**Agent:** code-reviewer or performance-engineer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Verify Kanban components are properly memoized.

**Files to Audit:**
- `components/tasks/KanbanBoard.tsx`
- `components/tasks/KanbanColumn.tsx`
- `components/tasks/TaskCard.tsx`

**Checkpoints to Evaluate:**
- [ ] PERF-13: KanbanColumn wrapped in React.memo
- [ ] PERF-14: TaskCard wrapped in React.memo
- [ ] PERF-15: Per-column task filtering uses useMemo
- [ ] PERF-16: onDragEnd handler uses useCallback
- [ ] PERF-17: onDrop handler uses useCallback
- [ ] PERF-18: Task list mapping is stable (not recreated)
- [ ] PERF-19: Date parsing in TaskCard is memoized
- [ ] PERF-20: Empty state animation doesn't infinite loop

**Methodology:**
```bash
# Check memoization
grep -r "React.memo\|memo(" components/tasks/KanbanBoard.tsx components/tasks/KanbanColumn.tsx components/tasks/TaskCard.tsx

# Check for Framer Motion issues
grep -r "animate=" components/tasks/KanbanColumn.tsx
```

**Success Criteria:**
- All 8 checkpoints evaluated
- Memoization gaps identified
- Framer Motion optimization recommendations

**Output:** Section in findings report for PERF-13 to PERF-20

---

## Phase 4: Accessibility Review

### Task 4.1: Gantt Keyboard Navigation & Screen Reader

**Agent:** code-reviewer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Verify Gantt is accessible via keyboard and screen readers.

**Files to Audit:**
- `components/tasks/gantt/GanttTaskBar.tsx`
- `components/tasks/gantt/GanttChart.tsx`
- `components/tasks/gantt/GanttDependencyLines.tsx`

**Checkpoints to Evaluate:**
- [ ] A11Y-01: Focus visible on GanttTaskBar
- [ ] A11Y-05: Escape cancels drag
- [ ] A11Y-06: Tab order is logical (left-to-right, top-to-bottom)
- [ ] A11Y-11: Date range announced via aria-label
- [ ] A11Y-12: Dependencies announced via aria-describedby

**Test Scenarios:**
1. Tab through task bars
2. Initiate drag via Space/Enter (if supported)
3. Cancel drag with Escape
4. Verify screen reader announces task dates

**Success Criteria:**
- All 5 checkpoints evaluated
- Keyboard-only navigation tested
- Screen reader compatibility documented

**Output:** Section in findings report for A11Y-01, A11Y-05, A11Y-06, A11Y-11, A11Y-12

---

### Task 4.2: Kanban Drag Accessibility

**Agent:** code-reviewer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Verify Kanban drag-drop is accessible.

**Files to Audit:**
- `components/tasks/KanbanBoard.tsx`
- `components/tasks/KanbanColumn.tsx`
- `components/tasks/TaskCard.tsx`

**Checkpoints to Evaluate:**
- [ ] A11Y-02: Focus visible on TaskCard
- [ ] A11Y-03: Arrow keys move between columns
- [ ] A11Y-04: Space/Enter activates drag
- [ ] A11Y-05: Escape cancels drag
- [ ] A11Y-07: dnd-kit announcements configured
- [ ] A11Y-08: Drop zone labels (aria-label on columns)
- [ ] A11Y-09: Task position announced ("Task X in column Y")
- [ ] A11Y-10: Status conveyed not by color alone

**dnd-kit Accessibility Pattern:**
```typescript
const announcements = {
  onDragStart: ({ active }) => `Picked up task ${active.data.current?.title}`,
  onDragOver: ({ over }) => over ? `Over ${over.id} column` : '',
  onDragEnd: ({ over }) => over ? `Dropped in ${over.id}` : 'Cancelled',
};

<DndContext announcements={announcements}>
```

**Success Criteria:**
- All 8 checkpoints evaluated
- Screen reader announcements verified
- Keyboard drag flow documented

**Output:** Section in findings report for A11Y-02 to A11Y-10

---

## Phase 5: UX & Integration Verification

### Task 5.1: Gantt Interaction Workflows

**Agent:** code-reviewer or QA
**Estimated Effort:** Medium (30-45 min)

**Objective:** Test complete Gantt user workflows.

**Test Scenarios:**

1. **Resize Task Duration**
   - Drag right edge of task bar
   - Verify due_date updates
   - Verify success feedback

2. **Move Task (Reschedule)**
   - Drag entire task bar
   - Verify start_date and due_date shift
   - Verify dependency lines update

3. **Hover Dependency Highlight**
   - Hover task with dependencies
   - Verify related lines highlight
   - Verify no performance degradation

4. **View Mode Switch**
   - Switch between day/week/month
   - Verify grid recalculates
   - Verify task positions update

**Checkpoints to Evaluate:**
- [ ] DND-07: Drag preview is performant
- [ ] DND-08: Resize handles work correctly
- [ ] DND-09: Pixel-to-date conversion accurate
- [ ] DND-10: Optimistic UI update before server
- [ ] UX-02: Drag preview matches task bar
- [ ] UX-04: Date snap indicator visible
- [ ] UX-06: Loading spinner during save
- [ ] UX-08: Success feedback displayed
- [ ] ERR-02: Reverts on server error
- [ ] ERR-04: Error displayed to user

**Success Criteria:**
- All 10 checkpoints evaluated
- All workflows complete without errors
- Performance acceptable during interactions

**Output:** Section in findings report for DND-07 to DND-10, UX-02, UX-04, UX-06, UX-08, ERR-02, ERR-04

---

### Task 5.2: Kanban Interaction Workflows

**Agent:** code-reviewer or QA
**Estimated Effort:** Medium (30-45 min)

**Objective:** Test complete Kanban user workflows.

**Test Scenarios:**

1. **Move Task Between Columns**
   - Drag task from "todo" to "in_progress"
   - Verify status updates
   - Verify success toast

2. **Reorder Within Column**
   - Drag task up/down in same column
   - Verify order maintained (if applicable)
   - Note: Order may not be persisted

3. **Mobile Tab Switching**
   - Switch between status tabs
   - Verify correct tasks shown
   - Verify scroll position preserved

4. **Long Column Scrolling**
   - Add 100+ tasks to one column
   - Scroll up and down
   - Verify smooth 60fps scroll

**Checkpoints to Evaluate:**
- [ ] UX-01: Drag preview matches TaskCard
- [ ] UX-03: Drop indicator is clear
- [ ] UX-05: Loading spinner during save
- [ ] UX-07: Success toast on status change
- [ ] ERR-01: Reverts on server error
- [ ] ERR-03: Error displayed to user
- [ ] ERR-05: Loading/skeleton states shown
- [ ] STATE-01: UI state local (activeTab)
- [ ] STATE-02: activeTab doesn't cause excess re-renders

**Success Criteria:**
- All 9 checkpoints evaluated
- All workflows complete without errors
- Virtualization working with 100+ tasks

**Output:** Section in findings report for UX-01, UX-03, UX-05, UX-07, ERR-01, ERR-03, ERR-05, STATE-01, STATE-02

---

## Phase 6: Reporting & Planning

### Task 6.1: Generate Findings Report

**Agent:** code-reviewer
**Estimated Effort:** Medium (30-45 min)

**Objective:** Compile all findings into structured report.

**Inputs:**
- Outputs from Tasks 1.1 through 5.2
- Checkpoint evaluations
- Evidence gathered

**Report Structure:**
```markdown
# Gantt & Kanban Audit Findings Report

## Executive Summary
- Date: {date}
- Auditor: {agent}
- Total Checkpoints: 134
- Passed: {count}
- Failed: {count}
- Not Applicable: {count}

## Critical Findings (Severity: Critical)
{Typically: Missing virtualization, severe performance issues}

## High Priority Findings (Severity: High)
{Typically: Memoization gaps, dnd-kit compatibility}

## Medium Priority Findings (Severity: Medium)
{Typically: Minor optimizations, accessibility gaps}

## Low Priority Findings (Severity: Low)
{Typically: Technical debt}

## Detailed Findings
{For each finding:}
### {ID}: {Title}
- **Severity:** {level}
- **Category:** {SEC|PERF|VIRT|DND|SVG|A11Y|ERR|STATE|TYPE|UX}
- **Checkpoint:** {checkpoint ID}
- **File:** {path}
- **Line:** {number}
- **Description:** {description}
- **Evidence:** {code/screenshot}
- **Recommendation:** {fix with code example}
- **Effort:** {S|M|L}
```

**Success Criteria:**
- All findings included
- Severity assigned
- Evidence attached
- Recommendations actionable with code examples

**Output:** `.claude/tasks/features/taskdetail-audit/findings-report.md`

**Dependencies:** Tasks 1.1 through 5.2 complete

---

### Task 6.2: Create Remediation Plan

**Agent:** code-reviewer
**Estimated Effort:** Small (20-30 min)

**Objective:** Prioritize findings into actionable remediation plan.

**Plan Structure:**
```markdown
# Gantt & Kanban Audit Remediation Plan

## Priority 1: Critical (Fix immediately)
| ID | Finding | Assignee | Effort | Target Date |
|----|---------|----------|--------|-------------|

## Priority 2: High (Fix this sprint)
| ID | Finding | Assignee | Effort | Target Date |
|----|---------|----------|--------|-------------|

## Priority 3: Medium (Fix this quarter)
| ID | Finding | Assignee | Effort | Target Date |
|----|---------|----------|--------|-------------|

## Priority 4: Low (Backlog)
| ID | Finding | Assignee | Effort | Target Date |
|----|---------|----------|--------|-------------|

## Implementation Notes
- Virtualization: Follow MarkerPanel.tsx pattern (Task 3.1)
- dnd-kit: Ensure SortableContext works with virtual lists (Task 3.2)
- SVG: Separate hover state from position calculation (Task 2.2)

## Sign-off Checklist
- [ ] Performance Engineer reviewed PERF/VIRT findings
- [ ] Frontend Architect reviewed DND/SVG findings
- [ ] Accessibility Specialist reviewed A11Y findings
- [ ] Security Lead reviewed SEC findings
- [ ] Tech Lead approved remediation timeline
```

**Success Criteria:**
- All findings prioritized
- Effort estimates provided
- Dependencies identified
- Ready for sign-off

**Output:** `.claude/tasks/features/taskdetail-audit/remediation-plan.md`

**Dependencies:** Task 6.1 complete

---

### Task 6.3: Audit Sign-off

**Agent:** Human reviewer
**Estimated Effort:** Small (15-30 min)

**Objective:** Review findings and remediation plan, provide sign-off.

**Sign-off Criteria:**
- [ ] No Critical issues without remediation plan
- [ ] High issues scheduled for next sprint
- [ ] Accessibility violations have timeline
- [ ] Security concerns addressed appropriately
- [ ] Performance baseline established
- [ ] Virtualization implementation approved

**Output:** Approval comment on remediation plan

**Dependencies:** Tasks 6.1 and 6.2 complete

---

## Execution Order

```
Sequential Dependencies:

Phase 1 (Static Analysis):
1.1 (Gantt Auth) ──┐
1.2 (Kanban Auth) ─┼──► 1.3 (Types) ──► 1.4 (RLS/Exposure)
                   │
Phase 2 (Gantt Performance):
2.1 (Memoization) ─┼──► 2.2 (Dependency Lines) ──► 2.3 (SVG)
                   │
Phase 3 (Kanban Virtualization):
3.1 (Implement VIRT) ──► 3.2 (dnd-kit compat) ──► 3.3 (Memoization)
                   │
Phase 4 (Accessibility):
4.1 (Gantt A11Y) ──┼──► 4.2 (Kanban A11Y)
                   │
Phase 5 (UX/Integration):
5.1 (Gantt Workflows) ──┼──► 5.2 (Kanban Workflows)
                        │
                        └──► 6.1 (Report) ──► 6.2 (Plan) ──► 6.3 (Sign-off)

Parallelizable:
- Tasks 1.1 and 1.2 can run in parallel
- Tasks 2.1 can start while 1.x completes
- Tasks 4.1 and 4.2 can run in parallel
- Tasks 5.1 and 5.2 can run in parallel
- Phase 3 (implementation) should follow Phase 2 (analysis)
```

---

## Estimated Effort Summary

| Phase | Tasks | Total Time | Focus |
|-------|-------|------------|-------|
| Phase 1: Static Security | 4 tasks | 1.5-2.5 hours | Auth, validation, RLS |
| Phase 2: Gantt Performance | 3 tasks | 2-2.5 hours | Memoization, SVG, dependency lines |
| Phase 3: Kanban Virtualization | 3 tasks | 2.5-3.5 hours | **react-virtual, dnd-kit compat** |
| Phase 4: Accessibility | 2 tasks | 1-1.5 hours | Keyboard, screen reader |
| Phase 5: UX/Integration | 2 tasks | 1-1.5 hours | Workflows, error handling |
| Phase 6: Reporting | 3 tasks | 1-1.5 hours | Sign-off |
| **Total** | **17 tasks** | **9-13 hours** | |

---

## Agent Assignment Summary

| Agent | Tasks | Focus |
|-------|-------|-------|
| **code-reviewer** | 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.3, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2 | Audit, analysis |
| **frontend-engineer** | 3.1, 3.2 | Virtualization implementation |
| **performance-engineer** | 2.1, 2.2, 2.3 (optional co-audit) | Performance profiling |
| **Human reviewer** | 6.3 | Sign-off |

---

## Checkpoint Summary

| Category | Count | Audit Tasks |
|----------|-------|-------------|
| SEC (Security) | 30 | 1.1, 1.2, 1.4 |
| PERF (Performance) | 35 | 2.1, 2.3, 3.3 |
| VIRT (Virtualization) | 15 | 3.1, 3.2 |
| DND (Drag-and-Drop) | 10 | 3.2, 5.1, 5.2 |
| SVG (Timeline) | 8 | 2.2, 2.3 |
| A11Y (Accessibility) | 12 | 4.1, 4.2 |
| ERR (Error Handling) | 6 | 5.1, 5.2 |
| STATE (State Mgmt) | 5 | 2.2, 5.2 |
| TYPE (Type Safety) | 5 | 1.3 |
| UX (User Experience) | 8 | 5.1, 5.2 |
| **TOTAL** | **134** | |

---

**Status:** READY FOR IMPLEMENTATION

**Execution Command:** Execute via orchestrator or manual task execution

```bash
# To begin audit, run first task:
# Task 1.1: Security Review - Gantt Authentication & Authorization
```
