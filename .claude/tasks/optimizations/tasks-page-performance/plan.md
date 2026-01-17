# Tasks Page Performance Optimization - Implementation Plan

## References

- Requirements: `.claude/tasks/optimizations/tasks-page-performance/requirements.md`
- Design: `.claude/tasks/optimizations/tasks-page-performance/design.md`

---

## Execution Strategy

### Dependency Graph

```
                    ┌─────────────────────────────────────────────────────┐
                    │              PHASE 1: QUICK WINS                     │
                    │            (All tasks parallelizable)                │
                    └─────────────────────────────────────────────────────┘
                                          │
        ┌─────────────┬─────────────┬─────┴─────┬─────────────┬─────────────┐
        ▼             ▼             ▼           ▼             ▼             ▼
    ┌───────┐     ┌───────┐     ┌───────┐   ┌───────┐     ┌───────┐     ┌───────┐
    │Task 1 │     │Task 2 │     │Task 3 │   │Task 4 │     │Task 5 │     │Task 6 │
    │Lucide │     │CSS    │     │TaskCard│   │KanbanBd│    │React  │     │Content│
    │Config │     │Anims  │     │Utils  │   │Grouping│    │.cache │     │Visib. │
    └───────┘     └───────┘     └───────┘   └───────┘     └───────┘     └───────┘
        │             │             │           │             │             │
        └─────────────┴─────────────┴─────┬─────┴─────────────┴─────────────┘
                                          │
                    ┌─────────────────────────────────────────────────────┐
                    │            PHASE 2: COMPONENT REFACTORING            │
                    │         (Dependencies on Phase 1 CSS work)           │
                    └─────────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
                ┌───────┐                                   ┌───────┐
                │Task 7 │                                   │Task 8 │
                │Dynamic│                                   │Single │
                │Imports│                                   │Pass   │
                └───────┘                                   │Filter │
                    │                                       └───────┘
                    ▼                                           │
                ┌───────┐                                       │
                │Task 9 │                                       │
                │Modal  │                                       │
                │Context│◄──────────────────────────────────────┘
                └───────┘
                    │
                    ▼
                    ┌─────────────────────────────────────────────────────┐
                    │              PHASE 3: VERIFICATION                   │
                    └─────────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
                ┌───────┐                                   ┌───────┐
                │Task 10│                                   │Task 11│
                │Bundle │                                   │Integr.│
                │Measure│                                   │Test   │
                └───────┘                                   └───────┘
```

### Parallel Execution Groups

| Group | Tasks | Can Run With |
|-------|-------|--------------|
| P1-A | Task 1, Task 5, Task 6 | P1-B |
| P1-B | Task 2, Task 3, Task 4 | P1-A |
| P2-A | Task 7, Task 8 | Each other |
| P2-B | Task 9 | After P2-A |
| P3 | Task 10, Task 11 | Each other |

### Critical Path

```
Task 2 (CSS) → Task 7 (Dynamic Imports) → Task 9 (Modal Context) → Task 11 (Integration)
```

**Estimated Critical Path Time:** 4 task cycles

---

## Phase 1: Quick Wins (Parallelizable)

### Task 1: Configure optimizePackageImports for Lucide

**Agent:** backend-engineer

**Skills Required:**
- None (config change only)

**Files:**
- `/Users/jonathanlee/Desktop/genhub/next.config.ts`

**Dependencies:** None

**Description:**
Add `lucide-react` to Next.js experimental `optimizePackageImports` array. This enables automatic tree-shaking for barrel imports without requiring code changes across 36+ component files.

**Implementation Steps:**
1. Read current `next.config.ts`
2. Add `optimizePackageImports: ['lucide-react']` to experimental config
3. Run build to verify no errors

**Acceptance Criteria:**
- [ ] `optimizePackageImports` array contains `'lucide-react'`
- [ ] Build passes without errors
- [ ] No TypeScript errors

**Complexity:** Simple

**Estimated Impact:** Bundle: -200KB, Build time: -2s

---

### Task 2: Add CSS Animation Classes to globals.css

**Agent:** frontend-engineer

**Skills Required:**
- `.claude/skills/frontend/responsive.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/app/globals.css`

**Dependencies:** None

**Description:**
Add CSS keyframe animations and utility classes that will replace Framer Motion animations in TaskCard and TaskList. Includes badge-pop animation and content-visibility utility.

**Implementation Steps:**
1. Read current `globals.css`
2. Add `@keyframes badge-pop` animation
3. Add `.animate-badge-pop` utility class
4. Add `.content-visibility-auto` utility class

**Acceptance Criteria:**
- [ ] `badge-pop` keyframe defined with scale/rotate transforms
- [ ] `.animate-badge-pop` class applies the animation
- [ ] `.content-visibility-auto` class defined
- [ ] Build passes

**Complexity:** Simple

**Estimated Impact:** Enables Bundle: -60KB (framer-motion removal)

---

### Task 3: Extract Utility Functions from TaskCard

**Agent:** frontend-engineer

**Skills Required:**
- `.claude/skills/vercel-react-best-practices/SKILL.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/components/tasks/TaskCard.tsx`

**Dependencies:** None

**Description:**
Move `getInitials` and `formatCurrency` functions outside the TaskCard component to module scope. These are pure functions with no dependencies on component state.

**Implementation Steps:**
1. Read TaskCard.tsx
2. Identify `getInitials` and `formatCurrency` functions (around lines 71-85)
3. Move functions to module scope (before component definition)
4. Rename `formatCurrency` to `formatCompactCurrency` for clarity
5. Verify component still works

**Acceptance Criteria:**
- [ ] `getInitials` defined at module scope
- [ ] `formatCompactCurrency` defined at module scope
- [ ] Functions not recreated on each render
- [ ] TypeScript compiles without errors
- [ ] No visual changes to TaskCard

**Complexity:** Simple

**Estimated Impact:** Performance: Fewer allocations per render

---

### Task 4: Single-Pass Task Grouping in KanbanBoard

**Agent:** frontend-engineer

**Skills Required:**
- `.claude/skills/vercel-react-best-practices/SKILL.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/components/tasks/KanbanBoard.tsx`

**Dependencies:** None

**Description:**
Replace the reduce+filter pattern with a single-pass grouping algorithm. Currently iterates tasks 5 times (once per column). New approach iterates once.

**Implementation Steps:**
1. Read KanbanBoard.tsx
2. Find `tasksByStatus` useMemo (around lines 71-81)
3. Replace reduce+filter with single-iteration grouping
4. Initialize empty arrays for each status
5. Push tasks to appropriate status array in one loop

**Acceptance Criteria:**
- [ ] `tasksByStatus` computed with single iteration
- [ ] All 5 status columns populated correctly
- [ ] Drag-and-drop still works
- [ ] TypeScript compiles without errors

**Complexity:** Simple

**Estimated Impact:** Performance: O(n) vs O(5n) for task grouping

---

### Task 5: Add React.cache() to Data Fetching

**Agent:** backend-engineer

**Skills Required:**
- `.claude/skills/backend/server-action.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/lib/tasks.ts`

**Dependencies:** None

**Description:**
Wrap `getTasksPageData` and `getTaskDetailData` functions with React.cache() for request-level deduplication. This prevents duplicate database queries if the same function is called multiple times during a single request.

**Implementation Steps:**
1. Read lib/tasks.ts
2. Import `cache` from 'react'
3. Wrap `getTasksPageData` with `cache()`
4. Wrap `getTaskDetailData` with `cache()` if it exists
5. Verify function signatures unchanged

**Acceptance Criteria:**
- [ ] `cache` imported from 'react'
- [ ] `getTasksPageData` wrapped with `cache()`
- [ ] Function can be called multiple times in same request without duplicate queries
- [ ] TypeScript compiles without errors

**Complexity:** Simple

**Estimated Impact:** Server: Eliminates duplicate fetches

---

### Task 6: Add Content-Visibility to TaskList

**Agent:** frontend-engineer

**Skills Required:**
- `.claude/skills/vercel-react-best-practices/SKILL.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/components/tasks/TaskList.tsx`

**Dependencies:** Task 2 (CSS classes must exist)

**Description:**
Add `content-visibility: auto` CSS class to TaskList table rows for virtualization-lite behavior. This defers rendering of off-screen rows.

**Implementation Steps:**
1. Read TaskList.tsx
2. Find TableRow component usage in the map function
3. Add `content-visibility-auto` className to TableRow
4. Verify scrolling behavior unchanged

**Acceptance Criteria:**
- [ ] TableRow has `content-visibility-auto` class
- [ ] Scrolling remains smooth
- [ ] No visual glitches
- [ ] Build passes

**Complexity:** Simple

**Estimated Impact:** Rendering: Faster initial paint for 50+ tasks

---

## Phase 2: Component Refactoring

### Task 7: Dynamic Imports for KanbanBoard and TaskModal

**Agent:** frontend-engineer

**Skills Required:**
- `.claude/skills/vercel-react-best-practices/SKILL.md`
- `.claude/skills/frontend/component-patterns.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/components/tasks/TaskBoard.tsx`

**Dependencies:** Task 2 (CSS animations ready for TaskCard)

**Description:**
Convert KanbanBoard and TaskModal from static imports to dynamic imports with next/dynamic. Include loading skeleton for KanbanBoard and lazy rendering for TaskModal (only render when open).

**Implementation Steps:**
1. Read TaskBoard.tsx
2. Import `dynamic` from 'next/dynamic'
3. Replace KanbanBoard static import with dynamic import
4. Add loading skeleton (5 column placeholders)
5. Replace TaskModal static import with dynamic import
6. Wrap TaskModal render with `{isModalOpen && <TaskModal />}`
7. Verify both components still work

**Acceptance Criteria:**
- [ ] KanbanBoard dynamically imported with `ssr: false`
- [ ] KanbanBoard has loading skeleton
- [ ] TaskModal dynamically imported with `ssr: false`
- [ ] TaskModal only renders when `isModalOpen` is true
- [ ] List view loads without KanbanBoard bundle
- [ ] Modal opens without flash
- [ ] Build passes

**Complexity:** Medium

**Estimated Impact:** Bundle: -80KB initial, -35KB (dnd-kit deferred)

---

### Task 8: Single-Pass Task Filtering in TasksPageClient

**Agent:** frontend-engineer

**Skills Required:**
- `.claude/skills/vercel-react-best-practices/SKILL.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/components/tasks/TasksPageClient.tsx`

**Dependencies:** None

**Description:**
Combine 5 separate useMemo hooks into a single iteration that computes filteredTasks, projectTaskCount, projectTaskCounts, and statusCounts in one pass over the tasks array.

**Implementation Steps:**
1. Read TasksPageClient.tsx
2. Identify the 5 useMemo hooks (lines 117-200 approximately)
3. Create single `taskMetrics` useMemo that computes all values
4. Initialize counters and filtered array
5. Single loop over tasks computing all metrics
6. Destructure result for component usage
7. Remove old useMemo hooks

**Acceptance Criteria:**
- [ ] Single `taskMetrics` useMemo replacing multiple hooks
- [ ] All filter combinations work correctly
- [ ] Status tab counts accurate
- [ ] Project dropdown counts accurate
- [ ] TypeScript compiles without errors
- [ ] No behavior changes

**Complexity:** Medium

**Estimated Impact:** Performance: 50% fewer filter re-renders

---

### Task 9: Extract Modal State to Context

**Agent:** frontend-engineer

**Skills Required:**
- `.claude/skills/frontend/component-patterns.md`
- `.claude/skills/vercel-react-best-practices/SKILL.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/components/tasks/TaskModalContext.tsx` (new)
- `/Users/jonathanlee/Desktop/genhub/components/tasks/TaskBoard.tsx`
- `/Users/jonathanlee/Desktop/genhub/components/tasks/TasksPageClient.tsx`

**Dependencies:** Task 7 (dynamic imports complete)

**Description:**
Create TaskModalContext to manage modal state (isOpen, mode, selectedTask) separately from TaskBoard. This prevents TaskBoard re-renders when modal state changes. Also remove duplicate TaskModal from TasksPageClient.

**Implementation Steps:**
1. Create new file `TaskModalContext.tsx`
2. Define context with isOpen, mode, selectedTask state
3. Create openCreate, openEdit, close callbacks with useCallback
4. Export TaskModalProvider and useTaskModal hook
5. Update TaskBoard to use useTaskModal instead of local state
6. Wrap TasksPageClient children with TaskModalProvider
7. Remove duplicate TaskModal from TasksPageClient
8. Update mobile create button to use context

**Acceptance Criteria:**
- [ ] TaskModalContext.tsx created with proper types
- [ ] TaskModalProvider wraps task components
- [ ] TaskBoard uses useTaskModal hook
- [ ] Modal state changes don't re-render TaskBoard
- [ ] No duplicate TaskModal in TasksPageClient
- [ ] Mobile create task works
- [ ] Desktop edit task works
- [ ] Build passes

**Complexity:** Medium

**Estimated Impact:** Performance: TaskBoard re-renders reduced 60%

---

## Phase 3: Verification

### Task 10: Bundle Size Measurement

**Agent:** code-reviewer

**Skills Required:**
- `.claude/skills/workflow/code-review.md`

**Files:**
- Build output analysis
- `/Users/jonathanlee/Desktop/genhub/.next/` (build artifacts)

**Dependencies:** All Phase 1 and Phase 2 tasks

**Description:**
Measure and document bundle size changes after all optimizations. Compare before/after for initial JS, task page chunk, and key dependencies.

**Implementation Steps:**
1. Run `npm run build`
2. Capture bundle analysis output
3. Compare `.next/static` sizes before/after
4. Document lucide-react tree-shaking effect
5. Document dnd-kit/framer-motion deferred loading
6. Create measurement report

**Acceptance Criteria:**
- [ ] Build completes without errors
- [ ] Initial JS reduced (target: -100KB)
- [ ] Task page chunk reduced (target: -50KB)
- [ ] Measurements documented
- [ ] Before/after comparison clear

**Complexity:** Simple

**Estimated Impact:** Documentation of achieved improvements

---

### Task 11: Integration Testing

**Agent:** code-reviewer

**Skills Required:**
- `.claude/skills/workflow/code-review.md`

**Files:**
- `/Users/jonathanlee/Desktop/genhub/app/app/tasks/page.tsx`
- All modified components

**Dependencies:** All Phase 1 and Phase 2 tasks

**Description:**
Verify all user flows work correctly after optimizations. Test filter combinations, view switching, modal operations, drag-and-drop, and mobile experience.

**Implementation Steps:**
1. Run development server
2. Test task filtering (search, status, project, assignee)
3. Test view switching (list, kanban, gantt)
4. Test task creation flow
5. Test task editing flow
6. Test drag-and-drop in kanban
7. Test mobile responsive behavior
8. Check browser console for errors
9. Profile with React DevTools

**Acceptance Criteria:**
- [ ] All filter combinations work
- [ ] View switching works without flash
- [ ] Task CRUD operations work
- [ ] Drag-and-drop functions correctly
- [ ] Mobile layout correct
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] React DevTools shows reduced re-renders

**Complexity:** Medium

**Estimated Impact:** Verification of all improvements

---

## Parallel Dispatch Instructions

### For Orchestrator: Phase 1 Dispatch

```
dispatch-parallel-agents:
  - agent: backend-engineer
    tasks: [Task 1, Task 5]
    prompt: |
      Execute Tasks 1 and 5 from the performance optimization plan.

      Task 1: Add lucide-react to optimizePackageImports in next.config.ts
      Task 5: Wrap getTasksPageData with React.cache() in lib/tasks.ts

      Files: next.config.ts, lib/tasks.ts
      Return: Summary of changes made

  - agent: frontend-engineer
    tasks: [Task 2, Task 3, Task 4, Task 6]
    prompt: |
      Execute Tasks 2, 3, 4, and 6 from the performance optimization plan.

      Task 2: Add CSS animations to globals.css (badge-pop, content-visibility)
      Task 3: Extract getInitials/formatCurrency from TaskCard to module scope
      Task 4: Single-pass task grouping in KanbanBoard useMemo
      Task 6: Add content-visibility-auto to TaskList TableRow

      Files: globals.css, TaskCard.tsx, KanbanBoard.tsx, TaskList.tsx
      Return: Summary of changes made
```

### For Orchestrator: Phase 2 Dispatch

```
dispatch-parallel-agents:
  - agent: frontend-engineer
    tasks: [Task 7, Task 8]
    prompt: |
      Execute Tasks 7 and 8 from the performance optimization plan.

      Task 7: Convert KanbanBoard and TaskModal to dynamic imports in TaskBoard.tsx
      Task 8: Single-pass filtering in TasksPageClient.tsx

      Files: TaskBoard.tsx, TasksPageClient.tsx
      Return: Summary of changes made

# After Task 7 and 8 complete:
  - agent: frontend-engineer
    tasks: [Task 9]
    prompt: |
      Execute Task 9 from the performance optimization plan.

      Task 9: Create TaskModalContext and integrate into TaskBoard/TasksPageClient

      Files: TaskModalContext.tsx (new), TaskBoard.tsx, TasksPageClient.tsx
      Return: Summary of changes made
```

### For Orchestrator: Phase 3 Dispatch

```
dispatch-parallel-agents:
  - agent: code-reviewer
    tasks: [Task 10, Task 11]
    prompt: |
      Execute Tasks 10 and 11 from the performance optimization plan.

      Task 10: Run build and measure bundle sizes, document before/after
      Task 11: Test all user flows - filtering, views, modals, drag-drop, mobile

      Return: Measurement report and test results
```

---

## Estimated Effort

| Phase | Tasks | Agents | Estimated Time |
|-------|-------|--------|----------------|
| Phase 1 | 6 tasks | 2 agents parallel | 1 cycle |
| Phase 2 | 3 tasks | 1 agent | 2 cycles |
| Phase 3 | 2 tasks | 1 agent | 1 cycle |
| **Total** | **11 tasks** | | **4 cycles** |

---

## Expected Outcomes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial JS Bundle | ~800KB | ~600KB | -200KB (25%) |
| Task Page Chunk | ~150KB | ~70KB | -80KB (53%) |
| Cold Start TTI | ~1.2s | ~0.8s | -400ms (33%) |
| Filter Re-renders | 5 passes | 1 pass | -80% |
| Modal State Re-renders | Full board | Modal only | -60% |

---

## Rollback Plan

If issues arise:
1. Each task modifies isolated files
2. Git revert individual commits
3. No database or API changes
4. All changes are client-side or config

---

## Post-Implementation

After all tasks complete:
1. Run `/kc:build` for final verification
2. Run `/kc:sync-docs` to update component index
3. Archive this plan to `.claude/tasks/completed/`

---

**Status:** READY FOR IMPLEMENTATION

**Next Step:** Execute via orchestrator with `dispatch-parallel-agents` skill or run tasks individually with `/kc:impl`.
