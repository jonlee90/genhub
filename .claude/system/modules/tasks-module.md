# Tasks Module Documentation

**Last Updated**: 2025-12-06
**Module Path**: `app/app/tasks/`, `components/tasks/`
**Status**: Epic 3 Complete + Recent Refactoring

## Overview

The Tasks module provides comprehensive task management with dual view modes (Kanban and List), drag-and-drop functionality, priority-based theming, and activity tracking. The module supports both standalone Tasks page context and embedded Project context.

## Module Architecture

### Routes

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/app/tasks` | `app/app/tasks/page.tsx` | Server | Tasks board with full filters |
| `/app/tasks/new` | `app/app/tasks/new/page.tsx` | Server | Create new task (legacy) |
| `/app/tasks/[id]` | `app/app/tasks/[id]/page.tsx` | Server | Task detail page |
| `/app/projects/[id]` | Tab in ProjectDetailContent | Server | Tasks in project context |

### Server Actions

**File**: `app/actions/tasks.ts`

| Action | Purpose | Permissions |
|--------|---------|-------------|
| `createTask(state, formData)` | Create new task | gc_admin, pm, foreman |
| `updateTask(formData)` | Update task details | gc_admin, pm, foreman, assignee |
| `updateTaskStatus(formData)` | Change task status | gc_admin, pm, foreman, assignee |
| `deleteTask(formData)` | Delete task | gc_admin, pm |
| `addTaskDependency(formData)` | Add dependency relationship | gc_admin, pm, foreman |
| `removeTaskDependency(formData)` | Remove dependency | gc_admin, pm, foreman |
| `addTaskComment(formData)` | Add comment to activity log | All company members |

### Core Components

#### TaskBoard (Unified Component) ⭐

**File**: `components/tasks/TaskBoard.tsx`

**Purpose**: Unified component that handles both Tasks page context and Project detail context.

**Props**:
```typescript
interface TaskBoardProps {
  initialTasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  initialView: 'kanban' | 'list';
  projectId?: string;          // Enables project context mode
  phases?: Phase[];            // Project phases for filtering
  showNewTaskButton?: boolean; // Show/hide New Task button
}
```

**Context Detection**:
- **Tasks Page Context** (`projectId` not provided):
  - Full filters: project, assignee, priority
  - View toggle with URL state
  - Results count display
  - All company tasks shown
- **Project Context** (`projectId` provided):
  - Phase filter only
  - Tasks pre-filtered to project
  - New Task button shown (default)
  - Simplified toolbar

**State Management**:
```typescript
const [view, setView] = useState<'kanban' | 'list'>(initialView);
const [searchQuery, setSearchQuery] = useState('');
const [projectFilter, setProjectFilter] = useState<string>('all'); // Tasks page only
const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
const [priorityFilter, setPriorityFilter] = useState<string>('all');
const [phaseFilter, setPhaseFilter] = useState<string>('all');    // Project context only
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
```

**Filtering Logic**:
1. Search query (title, description)
2. Project filter (Tasks page only)
3. Phase filter (Project context only)
4. Assignee filter (all contexts)
5. Priority filter (all contexts)

**Recent Changes** (2025-12-06):
- Refactored from separate ProjectTasks component
- Eliminated code duplication between contexts
- Smart context detection based on `projectId` prop
- Unified modal handling for create/edit
- TaskModal integration with dynamic theming

#### TaskModal (Create/Edit) ⭐

**File**: `components/tasks/TaskModal.tsx`

**Purpose**: Create and edit tasks with dynamic priority-based theming.

**Props**:
```typescript
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  task?: Task | null;
  projects: Project[];
  teamMembers: TeamMember[];
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  onSuccess?: () => void;
}
```

**Key Features**:

1. **Dynamic Theming**:
   - **Create Mode**: Construction-blue theme (#001B51)
   - **Edit Mode**: Priority-based colors
     - Low: Green (#059669)
     - Medium: Amber (#FFB627)
     - High: Red (#DC2626)

2. **Form State Management**:
   - Uses function initializers for proper reset: `useState(() => task ? task.field : defaultValue)`
   - Key-based remounting forces fresh state when task changes
   - Form key: `mode === 'edit' && task ? edit-${task.id} : 'create'`

3. **Priority Levels** (Updated):
   - Removed "critical" priority
   - Now: low, medium, high only
   - Updated Zod schema and database enum

4. **Field Groups**:
   - Title (required)
   - Description (optional)
   - Project & Phase (project required, phase optional)
   - Assignee & Priority
   - Due Date & Costs (planned cost always, actual cost edit-only)

**Validation**:
```typescript
const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  project_id: z.string().uuid(),
  phase_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  planned_cost: z.number().min(0).optional().nullable(),
});
```

#### KanbanBoard (Drag-and-Drop)

**File**: `components/tasks/KanbanBoard.tsx`

**Purpose**: Drag-and-drop task board with @dnd-kit.

**Features**:
- 5 columns: Todo, In Progress, Review, Blocked, Completed
- Drag tasks between columns to change status
- Optimistic updates with `useOptimistic`
- Industrial grid background (BackgroundBoxes)
- Column glow effects on drag-over
- Hydration-safe with `useId`

**Columns Configuration**:
```typescript
const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-50' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-[#001B51]/5' },
  { id: 'review', title: 'Review', color: 'bg-[#3C3C3C]/5' },
  { id: 'blocked', title: 'Blocked', color: 'bg-[#DC2626]/5' },
  { id: 'completed', title: 'Completed', color: 'bg-[#059669]/5' },
];
```

**Optimistic Updates**:
```typescript
const [optimisticTasks, setOptimisticTasks] = useOptimistic(
  tasks,
  (state, { taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
    state.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    )
);
```

**Drag Events**:
1. `onDragStart`: Set active task
2. `onDragEnd`:
   - Get drop column
   - Apply optimistic update
   - Call `updateTaskStatus` Server Action
   - Clear active task

**Recent Fixes** (2025-12-05):
- Fixed hydration mismatch by using `useId` for DndContext
- Proper drag-and-drop functionality restored
- Column colors updated to construction theme

#### KanbanColumn

**File**: `components/tasks/KanbanColumn.tsx`

**Purpose**: Droppable column with construction-themed styling.

**Features**:
- Industrial header with uppercase typography
- Task count badge
- Construction-themed empty state (HardHat icon with pulse)
- Glow effect on drag-over (scale: 1.02, shadow)
- Gradient background header

**Empty State**:
- HardHat icon (w-16 h-16)
- Construction-blue color with 30% opacity
- Pulse animation (y: 0 → -10 → 0, 2s loop)
- "No tasks yet" + "Start building your workflow"

#### TaskCard

**File**: `components/tasks/TaskCard.tsx`

**Purpose**: Draggable task card with priority theming.

**Features**:
- **Priority-based left border** (4px):
  - Low: Green (#059669)
  - Medium: Yellow (#FFB627)
  - High: Red (#DC2626)
- **Priority badges** (construction colors)
- **Wrench icon badge** when `planned_cost > 0`
- **Drag animations**:
  - Dragging: `scale: 1.05, rotate: 2deg`
  - Sortable dragging: `opacity: 0.5, scale: 0.95`
  - Rest: `scale: 1, rotate: 0deg`
- Assignee avatar
- Project name badge (in Tasks page context)
- Phase name badge (when assigned)
- Due date with calendar icon

**Click Handler**: Opens TaskModal in edit mode

#### TaskList (Table View)

**File**: `components/tasks/TaskList.tsx`

**Purpose**: Sortable table view alternative to Kanban.

**Features**:
- **Construction-themed header** (sticky, navy blue, white text)
- **Sortable columns**: Title, Status, Priority, Assignee, Due Date
- **Animated sort icons** (180deg rotation)
- **Row hover effect** (construction-blue tint, 5% opacity)
- **Title hover underline** (animated width: 0 → full)
- **Animated status badges**:
  - In Progress: Pulse animation
  - Status icons (Wrench, AlertTriangle, CheckCircle)
- **Status dropdown** for inline status changes
- **Click row** to open TaskModal in edit mode

**Status Configuration**:
```typescript
const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700', icon: null },
  in_progress: { label: 'In Progress', color: 'bg-[#001B51]/10 text-[#001B51]', icon: Wrench },
  review: { label: 'Review', color: 'bg-[#3C3C3C]/10 text-[#3C3C3C]', icon: null },
  blocked: { label: 'Blocked', color: 'bg-[#DC2626]/10 text-[#DC2626]', icon: AlertTriangle },
  completed: { label: 'Completed', color: 'bg-[#059669]/10 text-[#059669]', icon: CheckCircle },
};
```

#### TaskFilters

**File**: `components/tasks/TaskFilters.tsx`

**Purpose**: Filter controls for Tasks page.

**Filters**:
- Search input with clear button
- Project dropdown
- Assignee dropdown (includes "Unassigned" option)
- Priority dropdown

**Note**: Only used in Tasks page context. Project context uses simplified phase filter in TaskBoard.

#### TaskDetail

**File**: `components/tasks/TaskDetail.tsx`

**Purpose**: Full task detail page with tabs.

**Tabs**:
1. **Details**: Full editing form with all fields
2. **Dependencies**: TaskDependencies component
3. **Activity**: TaskActivityLog component

**Features**:
- Construction-themed tabs (active: navy blue bg, white text)
- Section headers with gradient backgrounds
- Icons in tabs (FileText, LinkIcon, Wrench)
- Form validation and submission
- Success/error messages

#### TaskActivityLog

**File**: `components/tasks/TaskActivityLog.tsx`

**Purpose**: Activity timeline with construction-themed icons.

**Features**:
- **Vertical timeline** with construction-blue connector line
- **Construction-themed activity icons**:
  - Created: HardHat
  - Updated: Wrench
  - Status changed: Settings
  - Commented: MessageSquare
  - Assigned: User
  - Due date changed: Calendar
- **Color-coded activity dots** (10x10 circles):
  - Created/Updated: Construction-blue
  - Status changed: Red
  - Commented: Amber
  - Assigned: Green
  - Due date changed: Yellow
- **Staggered animations** (fade-in + slide from right, 50ms delays)
- **Relative timestamps** ("just now", "5m ago", "2h ago", "3d ago")

**Data Structure**:
```typescript
type Activity = {
  id: string;
  action: 'created' | 'updated' | 'status_changed' | 'commented' | 'assigned' | 'due_date_changed';
  user_id: string;
  user_name: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  created_at: string;
};
```

#### TaskDependencies

**File**: `components/tasks/TaskDependencies.tsx`

**Purpose**: Manage task prerequisite relationships.

**Features**:
- List of prerequisite tasks (blocking this task)
- List of dependent tasks (blocked by this task)
- Add dependency via dropdown
- Remove dependency button
- Validation prevents circular dependencies (future)

#### BlockedReasonModal

**File**: `components/tasks/BlockedReasonModal.tsx`

**Purpose**: Input blocked reason when changing status to "blocked".

**Features**:
- Modal dialog with textarea
- Required field validation
- Submit updates task status + blocked_reason
- Cancel option

---

## Data Flow

### 1. Tasks Page

```
app/app/tasks/page.tsx (Server Component)
↓
Fetch tasks, projects, team members from Supabase
↓
TaskBoard (Client Component, Tasks page context)
↓
User interactions: filters, view toggle, click task
↓
TaskModal (Create/Edit)
↓
Server Action → Revalidate → Router refresh
```

**Server Component** (`page.tsx`):
```typescript
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    *,
    assignee:user_profiles!tasks_assignee_id_fkey (id, name, email, avatar_url),
    project:projects!inner (id, name),
    phase:project_phases (id, name)
  `)
  .eq('projects.company_id', companyId);

const { data: projects } = await supabase
  .from('projects')
  .select(`id, name, project_phases!inner (id, name, order_index)`)
  .eq('company_id', companyId);

const { data: teamMembers } = await supabase
  .from('user_profiles')
  .select('id, name, email, avatar_url')
  .in('id', userIds); // From active company_users

<TaskBoard
  initialTasks={tasks}
  projects={projects}
  teamMembers={teamMembers}
  initialView={view}
/>
```

### 2. Project Tasks Tab

```
app/app/projects/[id]/page.tsx (Server Component)
↓
Fetch project with tasks, phases, team
↓
ProjectDetailContent (Client Component)
↓
Tasks tab selected
↓
TaskBoard (Project context mode)
↓
User interactions: phase filter, click task, new task
↓
TaskModal (with preselectedProjectId)
↓
Server Action → Revalidate → Router refresh
```

**Integration**:
```typescript
<TaskBoard
  initialTasks={project.tasks || []}
  projects={projects}  // All projects (for TaskModal if changing project)
  teamMembers={teamMembers}
  initialView="kanban"
  projectId={project.id}      // Enables project context
  phases={project.project_phases || []}
  showNewTaskButton={true}    // Default when projectId provided
/>
```

### 3. Task Creation/Update Flow

```
User clicks "New Task" or task card
↓
TaskModal opens (create or edit mode)
↓
User fills form and submits
↓
createTask() or updateTask() Server Action
↓
1. Validate with Zod
2. Check user permissions
3. Insert/Update in database
4. Log activity to task_activity table
5. Create notification (if assignee changed)
6. Revalidate path
7. Return success/error
↓
TaskModal shows success → closes after 500ms
↓
Router refresh updates UI
```

**Server Action Example** (`createTask`):
```typescript
export async function createTask(
  prevState: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
  // 1. Get user context
  const { userId, companyId, role } = await getUserContext();

  // 2. Validate permissions
  if (!['gc_admin', 'project_manager', 'foreman'].includes(role)) {
    return { error: 'Insufficient permissions', fieldErrors: null, success: false, task: null };
  }

  // 3. Parse and validate data
  const validated = createTaskSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: 'Validation failed', fieldErrors: validated.error.flatten().fieldErrors, success: false, task: null };
  }

  // 4. Verify project access
  const { error: projectError } = await verifyProjectAccess(supabase, validated.data.project_id, companyId);
  if (projectError) {
    return { error: projectError, fieldErrors: null, success: false, task: null };
  }

  // 5. Insert task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...validated.data, created_by: userId })
    .select()
    .single();

  // 6. Log activity
  await logTaskActivity(supabase, task.id, userId, 'created');

  // 7. Notify assignee (if assigned)
  if (task.assignee_id) {
    await notifyUser(task.assignee_id, 'task_assigned', task);
  }

  // 8. Revalidate
  revalidatePath('/app/tasks');
  revalidatePath(`/app/projects/${task.project_id}`);

  return { success: true, task, error: null, fieldErrors: null };
}
```

---

## State Management Patterns

### Optimistic Updates (KanbanBoard)

```typescript
// 1. Define optimistic state
const [optimisticTasks, setOptimisticTasks] = useOptimistic(
  tasks,
  (state, { taskId, newStatus }) =>
    state.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    )
);

// 2. On drag end, apply optimistic update
function handleDragEnd(event: DragEndEvent) {
  const newStatus = event.over?.id as TaskStatus;

  // Optimistic update (instant UI feedback)
  setOptimisticTasks({ taskId: activeTask.id, newStatus });

  // Server update (reconciles or rolls back)
  startTransition(async () => {
    const formData = new FormData();
    formData.append('id', activeTask.id);
    formData.append('status', newStatus);
    await updateTaskStatus(formData);
  });
}
```

### Form State Reset (TaskModal)

**Problem**: Form state not resetting when switching between tasks in edit mode.

**Solution**: Key-based remounting
```typescript
// Generate unique key for each task
const formKey = mode === 'edit' && task ? `edit-${task.id}` : 'create';

// Render form with key
<TaskModalForm
  key={formKey}  // Forces React to remount component with fresh state
  mode={mode}
  task={task}
  // ... other props
/>
```

**Why This Works**: React treats components with different keys as completely different instances, so changing the key destroys the old component (and its state) and creates a new one.

### Filter State (TaskBoard)

```typescript
// Local state for filters
const [searchQuery, setSearchQuery] = useState('');
const [projectFilter, setProjectFilter] = useState<string>('all');
const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
const [priorityFilter, setPriorityFilter] = useState<string>('all');
const [phaseFilter, setPhaseFilter] = useState<string>('all');

// Computed filtered tasks (useMemo for performance)
const filteredTasks = useMemo(() => {
  let filtered = [...initialTasks];

  if (searchQuery) {
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (!isProjectContext && projectFilter !== 'all') {
    filtered = filtered.filter(task => task.project_id === projectFilter);
  }

  if (isProjectContext && phaseFilter !== 'all') {
    filtered = filtered.filter(task => task.phase_id === phaseFilter);
  }

  if (assigneeFilter !== 'all') {
    if (assigneeFilter === 'unassigned') {
      filtered = filtered.filter(task => !task.assignee_id);
    } else {
      filtered = filtered.filter(task => task.assignee_id === assigneeFilter);
    }
  }

  if (priorityFilter !== 'all') {
    filtered = filtered.filter(task => task.priority === priorityFilter);
  }

  return filtered;
}, [initialTasks, searchQuery, projectFilter, assigneeFilter, priorityFilter, phaseFilter, isProjectContext]);
```

---

## Design Patterns

### Priority-Based Theming

**TaskModal Theme Configuration**:
```typescript
const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 via-emerald-400 to-emerald-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    focusRing: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    iconColor: 'text-emerald-500',
  },
  medium: { /* amber colors */ },
  high: { /* red colors */ },
};

const DEFAULT_THEME = {
  gradient: 'from-construction-blue via-blue-500 to-construction-blue',
  iconBg: 'bg-gradient-to-br from-construction-blue to-blue-600',
  button: 'bg-construction-blue hover:bg-construction-blue/90',
  focusRing: 'focus:ring-construction-blue/20 focus:border-construction-blue',
  iconColor: 'text-construction-blue',
};

const theme = mode === 'create' ? DEFAULT_THEME : PRIORITY_CONFIG[priority];
```

**Applied to**:
- Modal top accent bar
- Icon background gradient
- Submit button color
- Input focus rings
- Icon colors
- Priority selection dropdown

### Construction Theme Colors

**Status Colors**:
- Todo: Gray (#6B7280)
- In Progress: Construction-blue (#001B51)
- Review: Dark Gray (#3C3C3C)
- Blocked: Red (#DC2626)
- Completed: Green (#059669)

**Priority Colors**:
- Low: Green (#059669)
- Medium: Yellow (#FFB627)
- High: Red (#DC2626)

### Animations

**Framer Motion**:
- TaskCard drag animations (scale, rotate, shadow)
- Column hover effects (scale 1.02, glow)
- Empty state pulse (HardHat icon)
- Activity log stagger (fade + slide)
- Status badge pulse (in_progress)

**CSS Animations**:
- Sort icon rotation (180deg)
- Title underline expansion (0 → 100%)
- Shimmer effects on loading

---

## Integration with Phases

Tasks can be assigned to project phases:

1. **Phase Selection** in TaskModal (optional)
2. **Phase Filter** in TaskBoard (project context)
3. **Phase Badge** on TaskCard (when assigned)
4. **Phase Completion** auto-calculated from task status
5. **PhaseDetailPanel** shows tasks per phase

**Phase Context**:
- Tasks page: Phase shown as badge (if assigned)
- Project context: Phase filter available, tasks grouped by phase in Metro Journey

See [Phase System Documentation](phase-system.md) for phase lifecycle.

---

## Recent Refactoring (2025-12-06)

### TaskBoard Unification

**Before**:
- Separate `ProjectTasks.tsx` component for project detail
- Duplicate filtering logic
- Different modal handling
- Inconsistent UI between contexts

**After**:
- Single `TaskBoard.tsx` component
- Context detection via `projectId` prop
- Unified modal (TaskModal) with preselection
- Consistent filtering and UI
- ~200 lines of duplicate code eliminated

**Migration**:
```typescript
// OLD: ProjectDetailContent.tsx
import { ProjectTasks } from '@/components/projects/ProjectTasks';
<ProjectTasks projectId={project.id} initialTasks={project.tasks} ... />

// NEW: ProjectDetailContent.tsx
import { TaskBoard } from '@/components/tasks/TaskBoard';
<TaskBoard
  initialTasks={project.tasks || []}
  projects={projects}
  teamMembers={teamMembers}
  initialView="kanban"
  projectId={project.id}
  phases={project.project_phases || []}
/>
```

### TaskModal Improvements

**Before**:
- Form state not resetting between tasks
- Generic blue theme for all modes
- "Critical" priority level

**After**:
- Key-based remounting ensures fresh state
- Dynamic theming based on mode and priority
- Removed "critical", now only low/medium/high
- Better visual distinction between create and edit

---

## Error Handling

**Validation**:
- Zod schemas in Server Actions
- Client-side required fields
- Field-level error messages

**Loading States**:
- Optimistic updates for instant feedback
- Pending states during Server Actions
- Skeleton loaders for initial page load

**Error Boundaries**:
- Error handling in Server Actions
- Toast notifications for user feedback
- Graceful degradation

---

## Future Enhancements

**Epic 4-5 Additions**:
- Bulk task operations
- Task templates
- Recurring tasks
- Task time tracking
- Advanced dependency visualization
- Task checklist/subtasks
- File attachments
- @mentions in comments
- Task notifications (email, push)

---

## Related Documentation

- [Database Schema](../database-schema.md) - tasks, task_dependencies, task_activity tables
- [Projects Module](projects-module.md) - TaskBoard integration in project detail
- [Phase System](phase-system.md) - Phase assignment and filtering
- [Project Structure](../project-structure.md) - File organization
