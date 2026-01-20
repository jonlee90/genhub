# Tasks Page Performance Optimization - Requirements

## Overview

This specification documents performance optimization requirements for `app/app/tasks/page.tsx` and its 44 nested components in `components/tasks/`. The optimization targets are derived from Vercel React Best Practices and prioritized by expected impact.

## Analysis Summary

### Current Architecture

```
app/app/tasks/page.tsx (Server Component)
    |
    +-- getTasksPageData() from lib/tasks.ts
    |       |-- auth() + createClient() in parallel [GOOD]
    |       |-- companyUser query (sequential - REQUIRED)
    |       |-- projects, teamMembers, tasks queries in parallel [GOOD]
    |       |-- assignees, materialStats, expenseStats, dependencies in parallel [GOOD]
    |
    +-- TasksPageClient (Large Client Component - ~430 lines)
            |
            +-- TaskBoard.tsx (~565 lines)
            |       +-- KanbanBoard.tsx (dnd-kit)
            |       +-- TaskList.tsx (framer-motion)
            |       +-- TaskModal.tsx (~1373 lines - MASSIVE)
            |       +-- GanttChart.tsx (dynamic import - GOOD)
            |
            +-- Many nested components (44 total)
```

### Component Count by Category

| Category | Count | Key Files |
|----------|-------|-----------|
| Main page components | 4 | TasksPageClient, TaskBoard, TaskModal, TaskDetail |
| View components | 4 | KanbanBoard, KanbanColumn, TaskList, TaskListMobile |
| Card components | 2 | TaskCard, MobileTaskCard |
| Gantt components | 7 | GanttChart, GanttTimeline, GanttTaskBar, etc. |
| Form/Input components | 6 | TaskFilters, AssigneeMultiSelect, TaskTypeSelector, etc. |
| Feature tabs | 5 | MaterialTab, ExpensesTab, ActivityTab, AttachmentsTab, TaskDetailsTab |
| Material components | 4 | TaskMaterialsManager, TaskMaterialSearch, TaskMaterialsList, etc. |
| Other | 12 | Various supporting components |

---

## Priority 1: Bundle Size Issues (CRITICAL)

### REQ-BUNDLE-1: Lucide Icons Barrel Imports

**Rule Reference:** `bundle-barrel-imports`

**Finding:** All 44 task components import from `'lucide-react'` barrel file. Each import loads the entire icon library (~1,583 modules).

**Evidence:**
```typescript
// Found in 36+ files
import { Calendar, AlertTriangle, Ban, Package, Pencil, ... } from 'lucide-react';
```

**Impact:** CRITICAL - 200-800ms added to cold start, slower builds, larger bundles

**Acceptance Criteria (EARS):**
- WHEN the application starts cold THE SYSTEM SHALL load lucide icons in under 50ms
- WHEN Next.js builds THE SYSTEM SHALL not process the full lucide-react module graph
- IF lucide-react is imported THEN imports SHALL be direct paths or optimizePackageImports configured

---

### REQ-BUNDLE-2: Framer Motion in Non-Animated Components

**Rule Reference:** `bundle-dynamic-imports`, `bundle-conditional`

**Finding:** Framer Motion imported in 16 components, many only use basic features or could use CSS transitions.

**Evidence:**
```typescript
// TaskCard.tsx - uses motion.div for simple scale animation
import { motion } from 'framer-motion';

// TaskList.tsx - uses motion only for status animation pulse
import { motion } from 'framer-motion';
```

**Components with framer-motion:**
- TaskCard.tsx (basic scale)
- TaskList.tsx (basic pulse)
- TaskModal.tsx (AnimatePresence)
- KanbanBoard.tsx (layout animations)
- TaskMaterialSearch.tsx
- TaskMaterialsList.tsx
- TaskMaterialsManager.tsx
- TaskActivityLog.tsx
- TaskDetail.tsx
- CreateTaskForm.tsx
- TaskListMobile.tsx
- TaskTypeSelector.tsx
- TaskExpensesSection.tsx
- TaskMaterials.tsx
- TaskReceiptUpload.tsx
- KanbanColumn.tsx

**Impact:** CRITICAL - framer-motion is ~60KB gzipped, loaded for components that may use only simple animations

**Acceptance Criteria (EARS):**
- WHEN a component only needs simple scale/opacity animations THE SYSTEM SHALL use CSS transitions
- WHEN AnimatePresence is needed THE SYSTEM SHALL dynamically import framer-motion
- IF framer-motion is used THE SYSTEM SHALL load it only for components that require layout animations

---

### REQ-BUNDLE-3: DND-Kit Loaded Eagerly

**Rule Reference:** `bundle-dynamic-imports`

**Finding:** DND-Kit (~35KB) loaded immediately even when user may never drag tasks.

**Evidence:**
```typescript
// KanbanBoard.tsx
import { DndContext, DragOverlay, closestCorners, ... } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
```

**Files importing dnd-kit:**
- KanbanBoard.tsx
- KanbanColumn.tsx
- TaskCard.tsx
- GanttChart.tsx
- GanttTaskBar.tsx

**Impact:** HIGH - 35KB loaded on initial render regardless of view mode

**Acceptance Criteria (EARS):**
- WHEN user is in list view THE SYSTEM SHALL NOT load dnd-kit
- WHEN user switches to kanban/gantt view THE SYSTEM SHALL load dnd-kit on demand
- WHEN user hovers over kanban tab THE SYSTEM MAY preload dnd-kit

---

### REQ-BUNDLE-4: TaskModal is Massive (1373 lines)

**Rule Reference:** `bundle-dynamic-imports`, `rerender-memo`

**Finding:** TaskModal.tsx is 1373 lines and imports many heavy dependencies. It's rendered in TaskBoard even when closed.

**Evidence:**
```typescript
// TaskModal imports
import { motion, AnimatePresence } from 'framer-motion';
// Plus: 22 lucide icons, multiple form components, expense actions, material actions
```

**Impact:** HIGH - Large component bundled and rendered even when modal is closed

**Acceptance Criteria (EARS):**
- WHEN TaskModal is closed THE SYSTEM SHALL NOT render the modal component tree
- WHEN user clicks to open a task THE SYSTEM SHALL dynamically import TaskModal
- IF TaskModal is rendered THEN only active tab content SHALL be mounted

---

## Priority 2: Re-render Optimization (MEDIUM)

### REQ-RERENDER-1: TasksPageClient Filtering Logic

**Rule Reference:** `rerender-derived-state`, `js-combine-iterations`

**Finding:** TasksPageClient has 5 useMemo hooks for filtering, but computes similar filtered lists multiple times.

**Evidence:**
```typescript
// TasksPageClient.tsx - multiple filter passes over tasks array
const filteredTasks = useMemo(() => {
  return tasks.filter((task) => { /* search, status, project filters */ });
}, [tasks, searchQuery, statusFilter, projectFilter]);

const projectTaskCount = useMemo(() => {
  return tasks.filter((task) => task.project_id === projectFilter).length;
}, [tasks, projectFilter]);

const statusCounts = useMemo(() => {
  const tasksForCounting = tasks.filter((task) => { /* same filters minus status */ });
  // ...
}, [tasks, projectFilter, searchQuery]);
```

**Impact:** MEDIUM - Multiple array iterations on every filter change

**Acceptance Criteria (EARS):**
- WHEN tasks are filtered THE SYSTEM SHALL compute all derived counts in a single iteration
- IF filter state changes THEN only affected computations SHALL re-run
- WHEN statusCounts are computed THE SYSTEM SHALL NOT iterate the array separately

---

### REQ-RERENDER-2: TaskBoard State Management

**Rule Reference:** `rerender-defer-reads`, `rerender-functional-setstate`

**Finding:** TaskBoard has 10+ useState hooks, some only used in callbacks.

**Evidence:**
```typescript
// TaskBoard.tsx
const [view, setView] = useState<'kanban' | 'list'>(initialView);
const [searchQuery, setSearchQuery] = useState('');
const [internalProjectFilter, setInternalProjectFilter] = useState<string>('all');
const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
const [priorityFilter, setPriorityFilter] = useState<string>('all');
const [phaseFilter, setPhaseFilter] = useState<string>('all');
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
```

**Impact:** MEDIUM - State changes trigger full component re-renders

**Acceptance Criteria (EARS):**
- WHEN modal state changes THE SYSTEM SHALL NOT re-render the entire TaskBoard
- WHEN filter state changes THE SYSTEM SHALL only re-render affected children
- IF state is only used in callbacks THEN THE SYSTEM SHALL NOT subscribe to that state

---

### REQ-RERENDER-3: TaskCard Memoization Gaps

**Rule Reference:** `rerender-memo`

**Finding:** TaskCard uses React.memo but has complex inline computations.

**Evidence:**
```typescript
// TaskCard.tsx
export const TaskCard = React.memo(function TaskCard({ ... }) {
  // Inline date parsing on every render
  const isOverdue = (() => {
    if (!task.due_date || task.status === 'completed') return false;
    const [year, month, day] = task.due_date.split('T')[0].split('-').map(Number);
    // ...
  })();

  // Inline function definitions
  const getInitials = (name: string) => { ... };
  const formatCurrency = (amount: number) => { ... };
});
```

**Impact:** MEDIUM - Functions recreated on every render, date parsing repeated

**Acceptance Criteria (EARS):**
- WHEN TaskCard renders THE SYSTEM SHALL NOT recreate utility functions
- WHEN isOverdue is computed THE SYSTEM SHALL use a memoized helper
- IF task data has not changed THEN THE SYSTEM SHALL skip expensive computations

---

### REQ-RERENDER-4: KanbanBoard Task Grouping

**Rule Reference:** `js-set-map-lookups`, `rerender-memo`

**Finding:** KanbanBoard groups tasks by status on every render, and renders all columns.

**Evidence:**
```typescript
// KanbanBoard.tsx
const tasksByStatus = useMemo(() =>
  COLUMNS.reduce((acc, column) => {
    acc[column.id] = optimisticTasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<TaskStatus, TaskWithRelations[]>),
  [optimisticTasks]
);
```

**Impact:** MEDIUM - 5 filter operations on task change, all columns re-render

**Acceptance Criteria (EARS):**
- WHEN tasks change THE SYSTEM SHALL group tasks in a single iteration
- WHEN a task moves columns THE SYSTEM SHALL NOT re-render unchanged columns
- IF column has no task changes THEN column SHALL NOT re-render

---

## Priority 3: Server-Side Optimization (HIGH)

### REQ-SERVER-1: Missing React.cache() for getTasksPageData

**Rule Reference:** `server-cache-react`

**Finding:** `getTasksPageData()` and `getTaskDetailData()` in lib/tasks.ts don't use React.cache().

**Evidence:**
```typescript
// lib/tasks.ts
export async function getTasksPageData() {
  const [supabase, session] = await Promise.all([createClient(), auth()]);
  // ...
}
// NOT wrapped with React.cache()
```

**Impact:** HIGH - Same data fetched multiple times in same request if called from multiple places

**Acceptance Criteria (EARS):**
- WHEN getTasksPageData is called multiple times in one request THE SYSTEM SHALL deduplicate
- IF auth() is called THEN THE SYSTEM SHALL use cached session within request
- WHEN React Server Components render THE SYSTEM SHALL deduplicate data fetching

---

### REQ-SERVER-2: Data Serialization at RSC Boundary

**Rule Reference:** `server-serialization`

**Finding:** TasksPage passes full task objects to client, but not all fields are used.

**Evidence:**
```typescript
// app/app/tasks/page.tsx
const { tasks, projects, teamMembers, taskDependencies, userRole } = await getTasksPageData();

// Tasks have ~50 fields, but many aren't used in initial render
// project_phases included in projects but only used in modals
```

**Impact:** MEDIUM - Larger HTML payload, slower hydration

**Acceptance Criteria (EARS):**
- WHEN tasks are passed to client THE SYSTEM SHALL include only fields needed for list/kanban view
- WHEN modal opens THE SYSTEM SHALL fetch additional task details on demand
- IF project_phases are needed THEN THE SYSTEM SHALL fetch them when modal opens

---

## Priority 4: Async Waterfall Prevention (Already Good)

### REQ-ASYNC-1: Current State - Good Patterns in Place

**Finding:** lib/tasks.ts already uses Promise.all() for parallel queries.

**Evidence:**
```typescript
// lib/tasks.ts - Already parallelized
const [projectsResult, teamMembersResult, tasksResult] = await Promise.all([
  supabase.from("projects").select(...),
  supabase.from("company_users").select(...),
  supabase.from("tasks").select(...),
]);

// Secondary queries also parallelized
const [assigneesResult, materialStatsResult, expenseStatsResult, dependenciesResult] = await Promise.all([...]);
```

**Status:** GOOD - No major waterfall issues in data fetching

**Minor Improvement:** One sequential dependency exists (companyUser must complete before other queries) which is unavoidable.

---

## Priority 5: Rendering Performance (MEDIUM)

### REQ-RENDER-1: Long Task Lists Without content-visibility

**Rule Reference:** `rendering-content-visibility`

**Finding:** TaskList and KanbanColumn render all tasks without CSS content-visibility optimization.

**Evidence:**
```typescript
// TaskList.tsx - renders all tasks
{sortedTasks.map((task) => (
  <TableRow key={task.id} ...>
    // Full task row rendered
  </TableRow>
))}
```

**Impact:** MEDIUM - With 100+ tasks, browser renders all rows upfront

**Acceptance Criteria (EARS):**
- WHEN more than 20 tasks are displayed THE SYSTEM SHALL use content-visibility: auto
- WHEN tasks are off-screen THE SYSTEM SHALL defer their rendering
- IF user scrolls THEN THE SYSTEM SHALL render tasks just-in-time

---

### REQ-RENDER-2: SVG Icons Without Hardware Acceleration

**Rule Reference:** `rendering-animate-svg-wrapper`

**Finding:** TaskCard animates SVG elements directly via framer-motion.

**Evidence:**
```typescript
// TaskCard.tsx
<motion.div
  initial={{ scale: 0, rotate: -10 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
>
  <Badge ...>
```

**Impact:** LOW - Animations on badges/icons could be smoother

**Acceptance Criteria (EARS):**
- WHEN badge/icon animations occur THE SYSTEM SHALL animate wrapper div not SVG
- IF CSS can achieve the animation THEN THE SYSTEM SHALL prefer CSS over JS

---

## Out of Scope

- Database query optimization (handled by backend team)
- Supabase RLS policy changes
- New feature development
- API route changes
- Authentication flow changes

## Dependencies

- Next.js 16+ with `optimizePackageImports` support
- React 19+ (already in use)
- No new dependencies required (CSS transitions, React.cache native)

## Non-Functional Requirements

- **Performance Target:** Initial bundle reduced by 30%+
- **Performance Target:** Cold start improved by 200ms+
- **Performance Target:** Filter operations under 16ms
- **Mobile:** Touch interactions remain smooth (60fps)
- **Compatibility:** No breaking changes to component APIs

---

## Summary Table

| ID | Category | Rule | Impact | Complexity |
|----|----------|------|--------|------------|
| REQ-BUNDLE-1 | Bundle | barrel-imports | CRITICAL | Simple |
| REQ-BUNDLE-2 | Bundle | dynamic-imports | CRITICAL | Medium |
| REQ-BUNDLE-3 | Bundle | dynamic-imports | HIGH | Medium |
| REQ-BUNDLE-4 | Bundle | dynamic-imports | HIGH | Complex |
| REQ-RERENDER-1 | Re-render | derived-state | MEDIUM | Medium |
| REQ-RERENDER-2 | Re-render | defer-reads | MEDIUM | Medium |
| REQ-RERENDER-3 | Re-render | memo | MEDIUM | Simple |
| REQ-RERENDER-4 | Re-render | set-map-lookups | MEDIUM | Simple |
| REQ-SERVER-1 | Server | cache-react | HIGH | Simple |
| REQ-SERVER-2 | Server | serialization | MEDIUM | Medium |
| REQ-RENDER-1 | Rendering | content-visibility | MEDIUM | Simple |
| REQ-RENDER-2 | Rendering | animate-svg-wrapper | LOW | Simple |

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to design)

**Next Step:**
Requirements complete. Do you approve to proceed to design? [yes/no]
