# Gantt & Kanban Audit - REMEDIATION PLAN

**Date:** 2026-01-20  
**Based on:** gantt-kanban-audit-FINAL.md  
**Total Findings:** 16  
**Total Effort:** ~6 hours

---

## Priority 1: CRITICAL (Fix Immediately)

**Status:** ✅ No critical issues identified

All security, authentication, and build requirements pass.

---

## Priority 2: HIGH (Fix This Sprint) - Est. 4.5 hours

| ID | Finding | Files | Assignee | Effort | Target |
|----|---------|-------|----------|--------|--------|
| H01 | Any types in taskTypes props | gantt-types.ts, GanttTaskRow.tsx, KanbanBoard.tsx, KanbanColumn.tsx, TaskCard.tsx | frontend-engineer | 20 min | Day 1 |
| H02 | Missing useCallback on KanbanBoard handlers | KanbanBoard.tsx:93-139 | frontend-engineer | 10 min | Day 1 |
| H03 | hoveredTaskId triggers dependency recalc | GanttChart.tsx:225-228 | frontend-engineer | 10 min | Day 1 |
| H04 | No dnd-kit accessibility announcements | KanbanBoard.tsx:150 | frontend-engineer | 30 min | Day 2 |
| H05 | Missing ARIA labels on Gantt task bars | GanttTaskBar.tsx:64-93 | frontend-engineer | 20 min | Day 2 |
| H06 | Missing focus visible styles on TaskCard | TaskCard.tsx:127-150 | frontend-engineer | 10 min | Day 2 |
| H07 | No keyboard drag support in Kanban | KanbanBoard.tsx | frontend-engineer | 3 hours | **OPTIONAL** |
| H08 | Missing column ARIA labels | KanbanColumn.tsx:68-98 | frontend-engineer | 5 min | Day 2 |

**Priority 2 Subtotal (excluding H07):** 1.5 hours  
**With H07 (full keyboard support):** 4.5 hours

---

## Priority 3: MEDIUM (Fix This Quarter) - Est. 1.5 hours

| ID | Finding | Files | Assignee | Effort | Target |
|----|---------|-------|----------|--------|--------|
| M01 | Today marker rendering verification | GanttTimeline.tsx | frontend-engineer | 15 min | Week 2 |
| M02 | Missing project check in removeTaskDependency | tasks.ts:1436-1491 | backend-engineer | 10 min | Week 2 |
| M03 | Date validation not explicit in Zod | tasks.ts | backend-engineer | 15 min | Week 2 |
| M04 | Missing Escape key to cancel drag | KanbanBoard.tsx, GanttChart.tsx | frontend-engineer | 5 min | Week 3 |
| M05 | Status not conveyed by color alone | TaskCard.tsx | frontend-engineer | 15 min | Week 3 |
| M06 | No task position announcement | TaskCard.tsx | frontend-engineer | 20 min | Week 3 |

**Priority 3 Subtotal:** 1.5 hours

---

## Priority 4: LOW (Backlog) - Est. 30 min

| ID | Finding | Files | Assignee | Effort | Target |
|----|---------|-------|----------|--------|--------|
| L01 | Tab order verification needed | GanttChart.tsx | QA | 15 min | Backlog |
| L02 | Drag preview optimization verification | KanbanBoard.tsx, GanttChart.tsx | QA | 15 min | Backlog |

**Priority 4 Subtotal:** 30 min

---

## Implementation Notes

### H01: Fix Any Types (20 min)

**Files:** 5 files (gantt-types.ts, GanttTaskRow.tsx, KanbanBoard.tsx, KanbanColumn.tsx, TaskCard.tsx)

**Steps:**
1. Create interface in `types/db/task.ts`:
```typescript
export interface TaskTypeConfig {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string | null;
}
```

2. Find-replace all instances of `taskTypes?: any[]` with `taskTypes?: TaskTypeConfig[]`

3. Run `npx tsc --noEmit` to verify

**Verification:** TypeScript compiles without errors

---

### H02: Add useCallback to KanbanBoard (10 min)

**File:** `components/tasks/KanbanBoard.tsx`

**Code:**
```typescript
import { useCallback } from "react";

const handleDragStart = useCallback((event: DragStartEvent) => {
  const task = optimisticTasks.find((t) => t.id === event.active.id);
  setActiveTask(task || null);
}, [optimisticTasks]);

const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  setActiveTask(null);
  // ... rest of implementation
}, [optimisticTasks, setOptimisticTasks, startTransition]);
```

**Verification:** React DevTools Profiler shows no re-renders on drag

---

### H03: Optimize Hover State (10 min)

**File:** `components/tasks/gantt/GanttChart.tsx:225-228`

**Code:**
```typescript
// Before
const dependencyLines = useMemo(
  () => calculateDependencyLines(dependencies, taskPositions, hoveredTaskId),
  [dependencies, taskPositions, hoveredTaskId]
);

// After
const dependencyLines = useMemo(
  () => calculateDependencyLines(dependencies, taskPositions),
  [dependencies, taskPositions]  // ✅ Removed hoveredTaskId
);
```

**Note:** GanttDependencyLines component already handles highlighting correctly.

**Verification:** Chrome DevTools Performance shows no recalc on hover

---

### H04: Add dnd-kit Announcements (30 min)

**File:** `components/tasks/KanbanBoard.tsx`

**Code:**
```typescript
const announcements = {
  onDragStart: ({ active }) => {
    const task = optimisticTasks.find(t => t.id === active.id);
    return `Picked up task: ${task?.title || 'Unknown task'}`;
  },
  onDragOver: ({ over }) => {
    if (!over) return '';
    const column = COLUMNS.find(c => c.id === over.id);
    return column ? `Over ${column.title} column` : '';
  },
  onDragEnd: ({ active, over }) => {
    const task = optimisticTasks.find(t => t.id === active.id);
    if (!over) return `Dropped task: ${task?.title}. Drag cancelled.`;
    const column = COLUMNS.find(c => c.id === over.id);
    return `Dropped task: ${task?.title} in ${column?.title} column`;
  },
};

<DndContext
  announcements={announcements}
  id={dndContextId}
  sensors={sensors}
  collisionDetection={closestCorners}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
```

**Verification:** Test with screen reader (VoiceOver/NVDA) to hear announcements

---

### H05: Add ARIA Labels to Gantt Bars (20 min)

**File:** `components/tasks/gantt/GanttTaskBar.tsx`

**Code:**
```typescript
import { useMemo } from "react";
import { formatDate } from "@/lib/utils";

const ariaLabel = useMemo(() => {
  const startStr = task.start_date ? formatDate(task.start_date) : 'No start date';
  const dueStr = task.due_date ? formatDate(task.due_date) : 'No due date';
  return `${task.title}. Start: ${startStr}. Due: ${dueStr}. Status: ${task.status}. Priority: ${task.priority}.`;
}, [task]);

<div
  ref={setNodeRef}
  {...attributes}
  {...listeners}
  aria-label={ariaLabel}
  role="button"
  tabIndex={0}
  // ... rest
>
```

**Verification:** Screen reader announces task details on focus

---

### H06: Add Focus Visible to TaskCard (10 min)

**File:** `components/tasks/TaskCard.tsx:127-150`

**Code:**
```typescript
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  tabIndex={0}
  className={cn(
    "touch-manipulation transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2",
    isSortableDragging && "opacity-50 scale-95",
    // ... rest
  )}
>
```

**Verification:** Tab through cards and verify visible focus ring

---

### H07: Keyboard Drag Support (3 hours) - OPTIONAL

**File:** `components/tasks/KanbanBoard.tsx`

**Implementation:**
1. Add keyboard instructions component
2. Implement arrow key navigation between columns
3. Add Space/Enter to activate drag mode
4. Test with keyboard-only users

**Verification:** Complete drag-drop workflow using only keyboard

**Note:** This is a full accessibility feature implementation. Can be deferred to Phase 2 if time-constrained.

---

### H08: Add Column ARIA Labels (5 min)

**File:** `components/tasks/KanbanColumn.tsx:68-98`

**Code:**
```typescript
<motion.div
  className={/* ... */}
  role="region"
  aria-label={`${title} column with ${tasks.length} tasks`}
>
```

**Verification:** Screen reader announces column name and count

---

### M02: Add Project Check to removeTaskDependency (10 min)

**File:** `app/actions/tasks.ts:1436-1491`

**Code:**
```typescript
export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
) {
  const userContext = await getUserContext();
  if ("error" in userContext) return { error: userContext.error };

  const { userId, companyId, supabase } = userContext;

  // Verify both tasks
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) return { error: taskCheck.error };

  const dependsCheck = await verifyTaskAccess(supabase, dependsOnTaskId, companyId);
  if ("error" in dependsCheck) return { error: "Dependency task not found" };

  // ✅ NEW: Verify same project
  if (taskCheck.projectId !== dependsCheck.projectId) {
    return { error: "Tasks must be in the same project" };
  }

  // ... rest of deletion logic
}
```

**Verification:** Try to remove dependency between tasks in different projects (should fail)

---

### M03: Add Date Validation to Zod (15 min)

**File:** `app/actions/tasks.ts`

**Code:**
```typescript
const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  // ... other fields
}).refine(
  (data) => {
    if (data.start_date && data.due_date) {
      return new Date(data.start_date) <= new Date(data.due_date);
    }
    return true;
  },
  { message: "Start date must be before or equal to due date" }
);
```

**Verification:** Try to set start_date > due_date (should fail validation)

---

### M06: Add Task Position Announcements (20 min)

**File:** `components/tasks/TaskCard.tsx`

**Code:**
```typescript
// In KanbanColumn, pass index to TaskCard
{virtualItems.map((virtualItem) => {
  const task = tasks[virtualItem.index];
  return (
    <TaskCard
      key={task.id}
      task={task}
      taskIndex={virtualItem.index}
      totalTasks={tasks.length}
      // ... rest
    />
  );
})}

// In TaskCard component
interface TaskCardProps {
  // ... existing props
  taskIndex?: number;
  totalTasks?: number;
}

<div
  ref={setNodeRef}
  aria-setsize={totalTasks}
  aria-posinset={taskIndex !== undefined ? taskIndex + 1 : undefined}
  // ... rest
>
```

**Verification:** Screen reader announces "Item 3 of 12" when focused

---

## Testing Checklist

### Pre-Implementation
- [ ] Read Phase 1-2 report findings
- [ ] Review existing code patterns
- [ ] Set up test environment

### During Implementation
- [ ] Fix one finding at a time
- [ ] Test each fix independently
- [ ] Run `npx tsc --noEmit` after type changes
- [ ] Run `npm run lint` after code changes

### Post-Implementation (Priority 2)
- [ ] All TypeScript errors resolved
- [ ] All ESLint errors resolved
- [ ] Screen reader testing (NVDA/VoiceOver)
- [ ] Keyboard-only navigation test
- [ ] Focus visibility test
- [ ] Drag-drop workflows test (mouse + keyboard)
- [ ] Performance profiling (no regressions)

### Post-Implementation (Priority 3)
- [ ] Date validation tests
- [ ] Project isolation tests
- [ ] Color-blind testing (simulator)
- [ ] Mobile testing

---

## Rollout Strategy

### Phase 1: Quick Wins (Day 1) - 40 min
- H01: Fix any types (20 min)
- H02: Add useCallback (10 min)
- H03: Optimize hover (10 min)

**Impact:** Type safety + performance improvement

---

### Phase 2: Accessibility Foundation (Day 2) - 1 hour 5 min
- H04: dnd-kit announcements (30 min)
- H05: ARIA labels on Gantt (20 min)
- H06: Focus visible on TaskCard (10 min)
- H08: Column ARIA labels (5 min)

**Impact:** Basic screen reader support

---

### Phase 3: Validation & Security (Week 2) - 40 min
- M02: Project check (10 min)
- M03: Date validation (15 min)
- M01: Today marker verification (15 min)

**Impact:** Data integrity improvements

---

### Phase 4: Enhanced Accessibility (Week 3) - 40 min
- M04: Escape key verification (5 min)
- M05: Status color indicators (15 min)
- M06: Task position announcements (20 min)

**Impact:** WCAG 2.1 Level AA compliance

---

### Phase 5: Advanced Features (Optional) - 3 hours
- H07: Full keyboard drag support (3 hours)

**Impact:** WCAG 2.1 Level AAA compliance

---

## Success Metrics

### Phase 1-2 (Priority 2 without H07)
- TypeScript: 0 errors
- ESLint: 0 errors
- Screen reader: Basic announcements work
- Focus: Visible on all interactive elements
- Performance: No regressions (< 5ms difference)

### Phase 3-4 (Priority 3)
- Validation: Date range enforced
- Security: Cross-project dependencies blocked
- Accessibility: WCAG 2.1 AA compliance
- Color-blind testing: All statuses distinguishable

### Phase 5 (Optional)
- Keyboard: Complete drag-drop workflow without mouse
- WCAG: 2.1 AAA compliance

---

## Risk Mitigation

### High Risk Areas
1. **H07 (Keyboard drag):** Complex implementation, may introduce bugs
   - **Mitigation:** Make optional, defer to Phase 2
   
2. **H03 (Hover optimization):** May affect dependency highlighting
   - **Mitigation:** Test thoroughly with 100+ tasks
   
3. **H04 (dnd-kit announcements):** May conflict with existing focus management
   - **Mitigation:** Test with multiple screen readers

### Low Risk Areas
- H01, H02, H06, H08: Straightforward changes
- M02, M03: Backend validation (no UI impact)

---

## Rollback Plan

If any Priority 2 fix causes regression:

1. **Immediate:** Revert commit
2. **Within 1 hour:** Root cause analysis
3. **Within 4 hours:** Alternative fix or defer to Priority 3
4. **Communication:** Update Tech Lead and stakeholders

---

## Sign-off Checklist

### Before Starting
- [ ] Tech Lead approved remediation plan
- [ ] frontend-engineer assigned Priority 2 tasks
- [ ] backend-engineer assigned M02, M03 tasks
- [ ] QA resources allocated for testing

### After Priority 2 (Day 2)
- [ ] All Priority 2 fixes deployed to staging
- [ ] Screen reader testing complete
- [ ] Performance testing complete
- [ ] Tech Lead sign-off obtained

### After Priority 3 (Week 3)
- [ ] All Priority 3 fixes deployed to staging
- [ ] Validation testing complete
- [ ] Accessibility audit re-run (should show 95%+ pass rate)
- [ ] Ready for production deployment

---

## Contacts

| Role | Assignee | Responsibility |
|------|----------|----------------|
| Tech Lead | TBD | Final approval, priority decisions |
| Frontend Engineer | TBD | Priority 2 implementation (H01-H08) |
| Backend Engineer | TBD | Priority 3 implementation (M02-M03) |
| Accessibility Specialist | TBD | Testing and validation |
| QA Lead | TBD | Priority 4 verification |

---

**Plan Status:** ✅ READY FOR IMPLEMENTATION  
**Next Action:** Assign frontend-engineer to Priority 2 tasks  
**Target Completion:** Priority 2 by end of Week 1, Priority 3 by end of Week 3

---

**Generated:** 2026-01-20  
**Based on:** gantt-kanban-audit-FINAL.md (16 findings)  
**Estimated Total Time:** 6 hours (1.5 hours without H07)
