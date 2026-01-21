# Design: Gantt & Kanban Performance Audit

## Overview

This design document specifies the methodology, checkpoints, and tooling for conducting a comprehensive audit of the Gantt Chart and KanbanBoard components. The audit focuses on performance optimization, virtualization implementation, and drag-and-drop compatibility.

## Requirements Reference

See: `.claude/tasks/features/taskdetail-audit/requirement.md`

---

## Architecture Overview

### Gantt Chart Component Hierarchy

```
GanttChart (root orchestrator) [client]
├── State Management
│   ├── viewMode (day|week|month)
│   ├── hoveredTaskId (hover tracking)
│   ├── dateRange (start/end dates)
│   └── responsiveConfig (cell widths)
│
├── GanttHeader (memoized)
│   └── Column date labels
│
├── GanttTimeline (SVG)
│   ├── Grid lines
│   ├── Date columns
│   └── Today marker
│
├── GanttDependencyLines (SVG)
│   ├── DependencyPath[] (arrow lines)
│   └── Highlight state (hoveredTaskId)
│
├── GanttTaskRow[] (memoized, content-visibility: auto)
│   ├── Task metadata
│   └── GanttTaskBar (memoized, draggable)
│       ├── Resize handles
│       ├── Progress indicator
│       └── Drag overlay
│
└── GanttViewToggle (memoized)
    └── Day/Week/Month buttons
```

### KanbanBoard Component Hierarchy

```
KanbanBoard (root) [client]
├── DndContext (dnd-kit)
│   └── DragOverlay
│       └── TaskCard (clone during drag)
│
├── Desktop Layout (lg:grid-cols-5)
│   └── KanbanColumn[] (5 status columns)
│       └── SortableContext
│           └── TaskCard[] (sortable, memoized)
│               ├── Task title
│               ├── Priority badge
│               ├── Assignee avatar
│               └── Due date (parsed)
│
└── Mobile Layout (tabs)
    ├── Tab navigation (5 status tabs)
    └── Active KanbanColumn
        └── SortableContext
            └── TaskCard[] (sortable, memoized)
```

### Reference Implementation: MarkerPanel.tsx (react-virtual pattern)

```typescript
// Existing pattern from components/projects/spatial/MarkerPanel.tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 130, // TaskCard approximate height
  overscan: 5,
});

const virtualItems = virtualizer.getVirtualItems();

return (
  <div ref={scrollContainerRef} style={{ overflow: 'auto' }}>
    <div style={{ height: virtualizer.getTotalSize() }}>
      {virtualItems.map((virtualItem) => (
        <div
          key={virtualItem.key}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {/* Render item */}
        </div>
      ))}
    </div>
  </div>
);
```

---

## Audit Methodology

### Phase 1: Static Analysis
- TypeScript type checking
- Memoization audit (React.memo, useMemo, useCallback)
- Dependency array review
- Code pattern analysis

### Phase 2: Performance Analysis
- React DevTools profiling
- Chrome Performance timeline
- DOM node counting
- Memory usage analysis

### Phase 3: Virtualization Implementation
- Pattern extraction from MarkerPanel.tsx
- dnd-kit compatibility verification
- Scroll behavior testing
- Mobile responsiveness

### Phase 4: Accessibility Verification
- Keyboard navigation for drag-drop
- Screen reader announcements
- Focus management
- Color contrast in status indicators

---

## Audit Checkpoints

### 1. Security Checkpoints (SEC) - 30 checks

#### 1.1 Authentication & Authorization (10 checks)

| ID | Check | Component/Action | Expected |
|----|-------|------------------|----------|
| SEC-01 | getUserContext() called | updateTask (drag complete) | First operation in action |
| SEC-02 | getUserContext() called | updateTaskStatus (column move) | First operation in action |
| SEC-03 | Auth error returns early | All drag-related actions | `return { error: userContext.error }` |
| SEC-04 | Role check for bulk operations | getTasksForProject | company_id isolation |
| SEC-05 | Task ownership verified | updateTask | verifyTaskAccess() called |
| SEC-06 | Dependency access verified | addTaskDependency | Both tasks in same project |
| SEC-07 | Dependency access verified | removeTaskDependency | Both tasks in same project |
| SEC-08 | canEdit derived correctly | GanttChart | Based on userRole prop |
| SEC-09 | canEdit derived correctly | KanbanBoard | Based on userRole prop |
| SEC-10 | Drag disabled when !canEdit | GanttTaskBar | isDragDisabled prop |

#### 1.2 Input Validation (8 checks)

| ID | Check | Component/Action | Expected |
|----|-------|------------------|----------|
| VAL-01 | Date validation | updateTask (Gantt drag) | Valid date range |
| VAL-02 | Date range check | updateTask | start_date <= due_date |
| VAL-03 | Status enum validation | updateTaskStatus | Valid TaskStatus values |
| VAL-04 | Task ID is UUID | All task operations | `z.string().uuid()` |
| VAL-05 | Project ID is UUID | getTasksForProject | `z.string().uuid()` |
| VAL-06 | Dependency IDs valid | addTaskDependency | Both IDs are UUIDs |
| VAL-07 | No self-dependency | addTaskDependency | taskId !== dependsOnTaskId |
| VAL-08 | No circular dependency | addTaskDependency | Circular check in action |

#### 1.3 Data Exposure (6 checks)

| ID | Check | Component/Action | Expected |
|----|-------|------------------|----------|
| EXP-01 | No sensitive fields in props | GanttChart | Only necessary task fields |
| EXP-02 | No sensitive fields in props | KanbanBoard | Only necessary task fields |
| EXP-03 | No company_id in client | All client components | company_id never passed |
| EXP-04 | Minimal assignee data | TaskCard | id, name, avatar_url only |
| EXP-05 | Error messages safe | Drag-related actions | No stack traces |
| EXP-06 | Console.log removed | All Gantt/Kanban components | No sensitive data logged |

#### 1.4 RLS Policy Verification (6 checks)

| ID | Check | Table | Expected Policy |
|----|-------|-------|-----------------|
| RLS-01 | tasks SELECT | tasks | company_id via projects join |
| RLS-02 | tasks UPDATE | tasks | company_id via projects join |
| RLS-03 | task_dependencies SELECT | task_dependencies | via task → project → company |
| RLS-04 | task_dependencies INSERT | task_dependencies | via task → project → company |
| RLS-05 | task_dependencies DELETE | task_dependencies | via task → project → company |
| RLS-06 | Bulk fetch isolation | getTasksForProject | Returns only company tasks |

---

### 2. Performance Checkpoints (PERF) - 35 checks

#### 2.1 Gantt Memoization (12 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| PERF-01 | React.memo wrapper | GanttHeader | Wrapped with memo |
| PERF-02 | React.memo wrapper | GanttTimeline | Wrapped with memo |
| PERF-03 | React.memo wrapper | GanttDependencyLines | Wrapped with memo |
| PERF-04 | React.memo wrapper | GanttTaskRow | Wrapped with memo |
| PERF-05 | React.memo wrapper | GanttTaskBar | Wrapped with memo |
| PERF-06 | React.memo wrapper | GanttViewToggle | Wrapped with memo |
| PERF-07 | useMemo for dateColumns | GanttChart | Memoized date array |
| PERF-08 | useMemo for taskPositions | GanttChart | Memoized position map |
| PERF-09 | useMemo for dependencyPaths | GanttChart | Memoized path calculations |
| PERF-10 | useCallback for handlers | GanttChart | Drag handlers memoized |
| PERF-11 | useCallback for handlers | GanttTaskBar | onDragEnd memoized |
| PERF-12 | useTransition for date updates | GanttChart | Non-blocking date changes |

#### 2.2 Kanban Memoization (8 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| PERF-13 | React.memo wrapper | KanbanColumn | Wrapped with memo |
| PERF-14 | React.memo wrapper | TaskCard | Wrapped with memo |
| PERF-15 | useMemo for filtered tasks | KanbanBoard | Per-column task filtering |
| PERF-16 | useCallback for drag handlers | KanbanBoard | onDragEnd memoized |
| PERF-17 | useCallback for drop handlers | KanbanColumn | onDrop memoized |
| PERF-18 | Stable task list mapping | KanbanColumn | Not recreated on render |
| PERF-19 | Date parsing memoized | TaskCard | Parsed once, not per render |
| PERF-20 | Empty state animation optimized | KanbanColumn | Not infinite CPU drain |

#### 2.3 Rendering Optimization (9 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| PERF-21 | content-visibility: auto | GanttTaskRow | CSS property applied |
| PERF-22 | CSS animations (not JS) | GanttTaskBar | Progress uses CSS |
| PERF-23 | Framer Motion lazy | Kanban animations | `m` alias not `motion` |
| PERF-24 | AnimatePresence mode | Tab transitions | `mode="wait"` |
| PERF-25 | Static JSX hoisted | Config objects | Outside component body |
| PERF-26 | Derived state computed | isOverdue | Not stored in state |
| PERF-27 | Derived state computed | canEdit | Not stored in state |
| PERF-28 | Icon imports direct | All components | `lucide-react/icons/*` |
| PERF-29 | Type imports | All files | `import type { }` |

#### 2.4 Data Fetching (6 checks)

| ID | Check | Component/Action | Expected |
|----|-------|------------------|----------|
| FETCH-01 | Initial data server-passed | GanttChart | Props from Server Component |
| FETCH-02 | Initial data server-passed | KanbanBoard | Props from Server Component |
| FETCH-03 | No client-side fetch | GanttChart | No useEffect data fetch |
| FETCH-04 | No client-side fetch | KanbanBoard | No useEffect data fetch |
| FETCH-05 | Revalidation targeted | updateTask | Specific paths revalidated |
| FETCH-06 | Revalidation targeted | updateTaskStatus | Specific paths revalidated |

---

### 3. Virtualization Checkpoints (VIRT) - 15 checks

#### 3.1 KanbanColumn Virtualization (10 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| VIRT-01 | useVirtualizer hook | KanbanColumn | Hook from @tanstack/react-virtual |
| VIRT-02 | scrollContainerRef | KanbanColumn | Ref attached to scroll parent |
| VIRT-03 | estimateSize correct | KanbanColumn | ~130px for TaskCard height |
| VIRT-04 | overscan configured | KanbanColumn | 5 items for smooth scroll |
| VIRT-05 | getVirtualItems() used | KanbanColumn | Only renders visible items |
| VIRT-06 | Absolute positioning | TaskCard wrapper | `position: absolute` |
| VIRT-07 | Transform translateY | TaskCard wrapper | `transform: translateY(${start}px)` |
| VIRT-08 | Container height set | KanbanColumn | `height: getTotalSize()` |
| VIRT-09 | Mobile tab preserves scroll | KanbanBoard | measureElement on tab switch |
| VIRT-10 | Key stability | TaskCard | Using task.id not index |

#### 3.2 Gantt Virtualization (5 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| VIRT-11 | Row virtualization | GanttChart | Vertical virtualization option |
| VIRT-12 | Column virtualization | GanttTimeline | Horizontal date virtualization |
| VIRT-13 | content-visibility backup | GanttTaskRow | CSS fallback if no JS virtual |
| VIRT-14 | IntersectionObserver | GanttChart | For lazy loading rows |
| VIRT-15 | DOM node count | GanttChart | <100 task rows at any time |

---

### 4. Drag-and-Drop Checkpoints (DND) - 10 checks

#### 4.1 dnd-kit + Virtualization (6 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| DND-01 | SortableContext items stable | KanbanColumn | Array identity stable |
| DND-02 | useSortable hooks stable | TaskCard | Across virtual renders |
| DND-03 | DragOverlay renders | KanbanBoard | Outside virtualizer |
| DND-04 | Drop zones work | KanbanColumn | With virtual scroll position |
| DND-05 | Sensor activation | KanbanBoard | Touch + pointer sensors |
| DND-06 | Collision detection | KanbanBoard | closestCorners strategy |

#### 4.2 Gantt Drag Performance (4 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| DND-07 | Drag preview performant | GanttTaskBar | Uses DragOverlay |
| DND-08 | Resize handles work | GanttTaskBar | Left/right resize |
| DND-09 | Date calculation | GanttTaskBar | Pixel to date conversion |
| DND-10 | Optimistic update | GanttChart | UI updates before server |

---

### 5. SVG/Timeline Checkpoints (SVG) - 8 checks

#### 5.1 Dependency Line Rendering (5 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| SVG-01 | Line positions memoized | GanttDependencyLines | useMemo for paths |
| SVG-02 | Hover state isolated | GanttDependencyLines | hoveredTaskId separate |
| SVG-03 | Path components stable | DependencyPath | React.memo wrapped |
| SVG-04 | SVG not rerendered | GanttDependencyLines | On hover state change |
| SVG-05 | Arrow heads optimized | DependencyPath | Reuse <marker> defs |

#### 5.2 Timeline Rendering (3 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| SVG-06 | Grid lines virtualized | GanttTimeline | Only visible columns |
| SVG-07 | Date labels memoized | GanttTimeline | Label text cached |
| SVG-08 | Today marker single | GanttTimeline | One marker, not per row |

---

### 6. Accessibility Checkpoints (A11Y) - 12 checks

#### 6.1 Keyboard Navigation (6 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| A11Y-01 | Focus visible | GanttTaskBar | Focus ring on keyboard nav |
| A11Y-02 | Focus visible | TaskCard | Focus ring on keyboard nav |
| A11Y-03 | Arrow key navigation | KanbanBoard | Move between columns |
| A11Y-04 | Enter activates drag | TaskCard | Space/Enter to pick up |
| A11Y-05 | Escape cancels drag | All draggables | Aborts drag operation |
| A11Y-06 | Tab order logical | GanttChart | Left-to-right, top-to-bottom |

#### 6.2 Screen Reader Support (6 checks)

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| A11Y-07 | Drag announcements | KanbanBoard | DndContext announcements |
| A11Y-08 | Drop zone labels | KanbanColumn | aria-label for column |
| A11Y-09 | Task position announced | TaskCard | "Task X in column Y" |
| A11Y-10 | Status conveyed | TaskCard | Not color-only |
| A11Y-11 | Date range announced | GanttTaskBar | aria-label with dates |
| A11Y-12 | Dependency announced | GanttDependencyLines | aria-describedby |

---

### 7. Error Handling Checkpoints (ERR) - 6 checks

| ID | Check | Component/Action | Expected |
|----|-------|------------------|----------|
| ERR-01 | Drag error recovery | KanbanBoard | Reverts on server error |
| ERR-02 | Drag error recovery | GanttChart | Reverts on server error |
| ERR-03 | Error displayed to user | KanbanBoard | Toast/banner on failure |
| ERR-04 | Error displayed to user | GanttChart | Toast/banner on failure |
| ERR-05 | Loading states | KanbanColumn | Skeleton during load |
| ERR-06 | Loading states | GanttChart | Skeleton during load |

---

### 8. State Management Checkpoints (STATE) - 5 checks

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| STATE-01 | State at correct level | GanttChart | viewMode, dateRange local |
| STATE-02 | State at correct level | KanbanBoard | activeTab local |
| STATE-03 | hoveredTaskId isolation | GanttChart | Doesn't trigger line recalc |
| STATE-04 | Callback deps correct | All useCallback | Dependency arrays complete |
| STATE-05 | No stale closures | Drag handlers | Latest state captured |

---

### 9. Type Safety Checkpoints (TYPE) - 5 checks

| ID | Check | Component/Action | Expected |
|----|-------|------------------|----------|
| TYPE-01 | Props interface defined | All components | Explicit interface/type |
| TYPE-02 | Zod matches TypeScript | Drag-related actions | Schemas align with types |
| TYPE-03 | Enum consistency | TaskStatus | DB enums match TS enums |
| TYPE-04 | Null checks present | Nullable fields | `?.` or explicit checks |
| TYPE-05 | No `any` types | All code | Explicit types everywhere |

---

### 10. UX/Interaction Checkpoints (UX) - 8 checks

| ID | Check | Component | Expected |
|----|-------|-----------|----------|
| UX-01 | Drag preview matches | TaskCard | Overlay looks like card |
| UX-02 | Drag preview matches | GanttTaskBar | Overlay looks like bar |
| UX-03 | Drop indicator clear | KanbanColumn | Visual drop target |
| UX-04 | Drop indicator clear | GanttChart | Date snap indicator |
| UX-05 | Loading during save | KanbanBoard | Spinner after drop |
| UX-06 | Loading during save | GanttChart | Spinner after drag |
| UX-07 | Success feedback | KanbanBoard | Toast on status change |
| UX-08 | Success feedback | GanttChart | Visual confirmation |

---

## Checkpoint Summary

| Category | Count | Focus |
|----------|-------|-------|
| SEC (Security) | 30 | Auth, validation, RLS |
| PERF (Performance) | 35 | Memoization, rendering, fetching |
| VIRT (Virtualization) | 15 | react-virtual implementation |
| DND (Drag-and-Drop) | 10 | dnd-kit + virtual list compat |
| SVG (Timeline) | 8 | Gantt SVG rendering |
| A11Y (Accessibility) | 12 | Keyboard, screen reader |
| ERR (Error Handling) | 6 | Recovery, display |
| STATE (State Mgmt) | 5 | State placement, closures |
| TYPE (Type Safety) | 5 | TypeScript coverage |
| UX (User Experience) | 8 | Drag UX, feedback |
| **TOTAL** | **134** | |

---

## Vercel React Best Practices Alignment

### Coverage by Priority

#### Priority 1 (CRITICAL) - Eliminating Waterfalls
| Rule | Implementation | Checkpoint |
|------|----------------|------------|
| `async-parallel` | Promise.all for independent queries | FETCH-03, FETCH-04 |
| `server-cache-react` | React.cache() for per-request dedup | Consider in actions |

#### Priority 2 (CRITICAL) - Bundle Size Optimization
| Rule | Implementation | Checkpoint |
|------|----------------|------------|
| `bundle-barrel-imports` | Direct lucide imports | PERF-28 |
| `bundle-dynamic-imports` | next/dynamic for heavy components | Consider for modals |
| `bundle-defer-third-party` | Defer analytics | N/A |

#### Priority 3 (HIGH) - Client Rendering
| Rule | Implementation | Checkpoint |
|------|----------------|------------|
| `rerender-memo` | React.memo() for all children | PERF-01 to PERF-14 |
| `rerender-derived-state` | Compute not store | PERF-26, PERF-27 |
| `rerender-transitions` | useTransition() for date updates | PERF-12 |

#### Priority 4 (MEDIUM) - Rendering Performance
| Rule | Implementation | Checkpoint |
|------|----------------|------------|
| `rendering-content-visibility` | CSS content-visibility | PERF-21, VIRT-13 |
| `rendering-hoist-jsx` | Static JSX outside components | PERF-25 |
| `js-index-maps` | Task position Map usage | PERF-08 |

---

## Tool Stack

| Tool | Purpose | Usage |
|------|---------|-------|
| React DevTools Profiler | Render analysis | Identify re-renders |
| Chrome Performance | Scroll/drag profiling | Frame rate analysis |
| Chrome DevTools Elements | DOM node counting | Verify virtualization |
| TypeScript (`tsc --noEmit`) | Type checking | All files in scope |
| ESLint | Pattern violations | Memoization gaps |

---

## Integration Points

### Reference Implementation
- `components/projects/spatial/MarkerPanel.tsx` - Existing react-virtual pattern
- `components/chat/MessageList.tsx` - Alternative virtual list usage

### Test Data Requirements
- Project with 500+ tasks for scale testing
- Tasks with complex dependency chains
- Tasks with various statuses (all 5 columns populated)

### Browser Requirements
- Chrome with React DevTools installed
- Performance profiling enabled
- Touch device or emulator for mobile testing

---

## Findings Report Structure

```markdown
# Gantt & Kanban Audit Findings Report

## Executive Summary
- Total Checkpoints: 134
- Passed: {count}
- Failed: {count}
- Not Applicable: {count}

## Critical Findings
{Severity: Critical - Requires immediate attention}
{Typically: Missing virtualization, severe performance issues}

## High Priority Findings
{Severity: High - Should be addressed in next sprint}
{Typically: Memoization gaps, dnd-kit compatibility}

## Medium Priority Findings
{Severity: Medium - Should be addressed within quarter}
{Typically: Minor optimizations, accessibility gaps}

## Low Priority Findings
{Severity: Low - Technical debt, address when convenient}

## Detailed Findings

### {Finding ID}: {Title}
- **Severity:** {Critical|High|Medium|Low}
- **Category:** {SEC|PERF|VIRT|DND|SVG|A11Y|ERR|STATE|TYPE|UX}
- **Checkpoint:** {Checkpoint ID}
- **File:** {File path}
- **Line:** {Line number(s)}
- **Description:** {What was found}
- **Evidence:** {Code snippet or screenshot}
- **Recommendation:** {How to fix}
- **Effort:** {S|M|L}
```

---

## Remediation Plan Template

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
- Virtualization: Follow MarkerPanel.tsx pattern
- dnd-kit: Ensure SortableContext works with virtual lists
- SVG: Separate hover state from position calculation

## Sign-off Checklist
- [ ] Performance Engineer reviewed PERF/VIRT findings
- [ ] Frontend Architect reviewed DND/SVG findings
- [ ] Accessibility Specialist reviewed A11Y findings
- [ ] Security Lead reviewed SEC findings
- [ ] Tech Lead approved remediation timeline
```

---

**Status:** PENDING APPROVAL

**Approval Required:** [ ] Yes - Proceed to Tasks Phase upon approval
