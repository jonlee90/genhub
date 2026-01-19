# GenHub - Component Patterns

> Common UI component patterns and usage.

---

## Base Components

### Button Variants
```tsx
import { Button } from '@/components/ui/button';

<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus className="w-4 h-4" /></Button>

// With icon
<Button className="bg-construction-blue text-white">
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>

// Loading state
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Saving...
</Button>
```

**Button Text Color Contrast Rule:**
- Dark backgrounds → white text (`text-white`)
- Light backgrounds → dark text (default or `text-gray-900`)

| Background | Text Class |
|------------|------------|
| `bg-construction-blue` | `text-white` |
| `bg-blue-600`, `bg-blue-700`, etc. | `text-white` |
| `bg-gray-800`, `bg-gray-900` | `text-white` |
| `bg-green-600`, `bg-red-600` | `text-white` |
| `bg-construction-yellow` | `text-black` |
| `bg-gray-100`, `bg-white` | `text-gray-900` |

### BaseModal (ALWAYS use for modals)
```tsx
import { BaseModal } from '@/components/ui/BaseModal';

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  icon={<Plus className="w-5 h-5" />}
>
  <div className="space-y-4">
    {/* Modal content */}
  </div>
</BaseModal>
```

**NEVER use `Dialog` directly - always use `BaseModal`**

### Card
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

<Card className="border-2 border-gray-200 shadow-construction">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Badge
```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>

// Custom status colors
<Badge className="bg-construction-green text-white">On Track</Badge>
<Badge className="bg-construction-red text-white">Delayed</Badge>
<Badge className="bg-construction-yellow text-black">Warning</Badge>
```

---

## Status Badges

### Task Status Badge
```tsx
const STATUS_CONFIG = {
  todo: { label: 'To Do', className: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', className: 'bg-yellow-100 text-yellow-800' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
};

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
```

### Priority Badge
```tsx
const PRIORITY_CONFIG = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
};
```

---

## Task Components

### TaskCard (Kanban/List View)
```tsx
// Location: components/tasks/list/TaskCard.tsx
// Draggable task card with industrial construction theme

<Card className={cn(
  'p-3 bg-white hover:shadow-md transition-shadow cursor-pointer relative border-2 group',
  'border-l-4 border-construction-blue',  // Always blue left border
  isBlocked && 'bg-red-50'
)}>
  {/* Edit indicator on hover */}
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-10">
    <div className="bg-construction-blue text-white p-1.5 rounded-lg shadow-lg">
      <Pencil className="w-3 h-3" />
    </div>
  </div>

  {/* Material Badge (stamped metal style) - see DESIGN_SYSTEM.md */}
  {hasMaterials && <MaterialBadge count={count} className="absolute top-2 right-2" />}

  {/* Task Type Badge */}
  <div className="mb-2">
    <TaskTypeBadge type={task.task_type} />
  </div>

  {/* Title + Priority */}
  <div className="flex items-start justify-between gap-2">
    <h4 className="font-bold text-sm line-clamp-2 text-gray-900">{task.title}</h4>
    <Badge className={cn('shrink-0 font-bold text-[10px]', priorityConfig.badgeColor)}>
      {priorityConfig.label}
    </Badge>
  </div>

  {/* Project/Phase context */}
  <p className="text-xs text-muted-foreground truncate">
    {task.project?.name} / {phase?.name}
  </p>

  {/* Footer: Due date, Status indicators, Materials cost, 3D location, Assignee */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {/* Due date with overdue styling */}
      {task.due_date && (
        <div className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-600' : 'text-muted-foreground')}>
          <Calendar className="h-3 w-3" />
          {formatDate(task.due_date)}
        </div>
      )}

      {/* Status indicators */}
      {isBlocked && <Ban className="h-3 w-3 text-red-600" />}
      {isOverdue && !isBlocked && <AlertTriangle className="h-3 w-3 text-orange-600" />}

      {/* Material cost badge */}
      {hasMaterials && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-construction-accent/10 rounded-md">
          <Package className="h-3 w-3 text-construction-accent" />
          <span className="text-[11px] font-black text-construction-accent">
            {formatCurrency(task.materialStats.totalCost)}
          </span>
        </div>
      )}

      {/* 3D Location link */}
      {has3DLocation && <Location3DBadge projectId={task.project?.id} markerId={task.spatial_marker_id} />}
    </div>

    {/* Assignee avatar */}
    {task.assignee && (
      <Avatar className="h-6 w-6">
        <AvatarImage src={task.assignee.avatar_url} />
        <AvatarFallback className="text-xs">{getInitials(task.assignee.name)}</AvatarFallback>
      </Avatar>
    )}
  </div>

  {/* Blocked reason */}
  {isBlocked && task.blocked_reason && (
    <p className="text-xs text-red-600 bg-red-100 p-1.5 rounded truncate">
      {task.blocked_reason}
    </p>
  )}
</Card>
```

### MobileTaskCard (Swipeable)
```tsx
// Location: components/tasks/list/TaskListMobile.tsx
// Card with swipe-to-complete and swipe-to-delete actions

<SwipeableCard
  onSwipeRight={() => handleComplete(task)}
  onSwipeLeft={() => handleDelete(task)}
  leftActionIcon={<Check className="w-6 h-6" />}
  rightActionIcon={<Trash2 className="w-6 h-6" />}
>
  <button
    onClick={() => onTaskClick?.(task)}
    className={cn(
      'w-full text-left p-4',
      'border-l-4 border-[#001B51]',
      'active:bg-gray-50 transition-colors',
      task.status === 'blocked' && 'bg-red-50'
    )}
  >
    {/* Header: Title + Priority */}
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {task.status === 'blocked' && <Ban className="h-4 w-4 text-red-500" />}
          {taskIsOverdue && <AlertTriangle className="h-4 w-4 text-orange-500" />}
          <h3 className="font-bold text-gray-900 line-clamp-2 text-[15px]">{task.title}</h3>
        </div>
      </div>
      <Badge className={cn('text-[10px] font-bold shrink-0', priorityConfig.badgeColor)}>
        {priorityConfig.label}
      </Badge>
    </div>

    {/* Project/Phase */}
    {(task.project || phaseName) && (
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <FolderKanban className="h-3 w-3" />
        <span className="truncate">{task.project?.name} / {phaseName}</span>
      </div>
    )}

    {/* Footer: Status, Due Date, Assignee */}
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Badge className={cn('text-[10px] font-bold', statusConfig.solidColor)}>
          {statusConfig.label}
        </Badge>
        {task.due_date && (
          <div className={cn('flex items-center gap-1 text-xs', taskIsOverdue ? 'text-red-600' : 'text-gray-500')}>
            <Calendar className="h-3 w-3" />
            {formatDate(task.due_date)}
          </div>
        )}
      </div>
      {task.assignee && (
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px] bg-[#001B51] text-white">
            {getInitials(task.assignee.name)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  </button>
</SwipeableCard>
```

### KanbanBoard
```tsx
// Location: components/tasks/kanban/KanbanBoard.tsx
// Drag-and-drop kanban with responsive mobile/desktop views

// Desktop: All 5 columns side-by-side
<div className="hidden md:flex gap-4 overflow-x-auto pb-4">
  {COLUMNS.map(column => (
    <KanbanColumn
      key={column.id}
      id={column.id}
      title={column.title}
      tasks={tasksByStatus[column.id]}
      onTaskClick={onTaskClick}
    />
  ))}
</div>

// Mobile: Tab-based single column view
<div className="md:hidden">
  {/* Sticky status tabs */}
  <div className="sticky top-0 z-20 bg-white border-b-2 mb-4">
    <MobileStatusTabs
      columns={COLUMNS}
      activeStatus={mobileActiveStatus}
      onStatusChange={setMobileActiveStatus}
    />
  </div>

  {/* Single active column */}
  {mobileActiveStatus && (
    <KanbanColumn
      {...activeColumn}
      isMobile={true}
    />
  )}
</div>
```

### TaskDetailPanel (Slide-out Drawer)
```tsx
// Location: components/tasks/detail/TaskDetailPanel.tsx
// Desktop: 500px right drawer, Mobile: 70vh bottom sheet

<div className={cn(
  'fixed bg-white shadow-2xl z-50 transition-transform duration-300',
  // Desktop: slide from right
  'md:top-0 md:right-0 md:w-[500px] md:h-full md:border-l-4 md:border-l-[#001B51]',
  isOpen ? 'md:translate-x-0' : 'md:translate-x-full',
  // Mobile: slide from bottom
  'bottom-0 left-0 right-0 rounded-t-2xl border-t-4 border-t-[#001B51]',
  isOpen ? 'translate-y-0' : 'translate-y-full'
)}>
  {/* Mobile drag handle */}
  <div className="md:hidden flex justify-center pt-2 pb-1">
    <div className="w-12 h-1 bg-gray-300 rounded-full" />
  </div>

  {/* Header */}
  <div className="border-b-2 p-4 flex items-center justify-between bg-gradient-to-r from-[#001B51]/5">
    <h2 className="font-black uppercase text-lg text-[#001B51] truncate">
      {taskData?.title}
    </h2>
    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
      <X className="h-5 w-5" />
    </button>
  </div>

  {/* Tab Navigation */}
  <div className="border-b flex overflow-x-auto bg-gray-50">
    {['details', 'materials', 'expenses', 'attachments', 'activity'].map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={cn(
          'px-4 py-3 font-bold uppercase text-xs whitespace-nowrap relative',
          activeTab === tab ? 'text-[#001B51] bg-white' : 'text-gray-500'
        )}
      >
        {tab}
        {badgeCount > 0 && (
          <span className={cn(
            'px-1.5 py-0.5 rounded text-xs font-bold ml-2',
            activeTab === tab ? 'bg-[#001B51] text-white' : 'bg-gray-300'
          )}>
            {badgeCount}
          </span>
        )}
        {activeTab === tab && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#001B51]" />
        )}
      </button>
    ))}
  </div>

  {/* Tab Content */}
  <div className="overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
    {activeTab === 'details' && <TaskDetailsTab task={taskData} />}
    {activeTab === 'materials' && <MaterialTab taskId={taskId} />}
    {activeTab === 'expenses' && <ExpensesTab taskId={taskId} />}
    {activeTab === 'attachments' && <AttachmentsTab taskId={taskId} />}
    {activeTab === 'activity' && <ActivityTab taskId={taskId} />}
  </div>
</div>
```

### TaskFilters
```tsx
// Location: components/tasks/shared/TaskFilters.tsx
// Filter bar for search, project, assignee, priority

<div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
  {/* Search */}
  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Search tasks..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="pl-9"
    />
  </div>

  {/* Project Filter */}
  {!hideProjectFilter && (
    <Select value={projectFilter} onValueChange={onProjectChange}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="All Projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Projects</SelectItem>
        {projects.map(project => (
          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}

  {/* Assignee Filter */}
  <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
    <SelectTrigger className="w-full sm:w-[180px]">
      <SelectValue placeholder="All Assignees" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Assignees</SelectItem>
      <SelectItem value="unassigned">Unassigned</SelectItem>
      {teamMembers.map(member => (
        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>

  {/* Priority Filter */}
  <Select value={priorityFilter} onValueChange={onPriorityChange}>
    <SelectTrigger className="w-full sm:w-[150px]">
      <SelectValue placeholder="All Priorities" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Priorities</SelectItem>
      <SelectItem value="high">High</SelectItem>
      <SelectItem value="medium">Medium</SelectItem>
      <SelectItem value="low">Low</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### ViewToggle
```tsx
// Toggle between Kanban and List views

<div className="flex items-center gap-1 rounded-lg border p-1">
  <Button
    variant={view === 'kanban' ? 'secondary' : 'ghost'}
    size="sm"
    onClick={() => handleViewChange('kanban')}
    className={cn('gap-2', view === 'kanban' && 'bg-construction-blue text-white')}
  >
    <LayoutGrid className="h-4 w-4" />
    <span className="hidden sm:inline">Kanban</span>
  </Button>
  <Button
    variant={view === 'list' ? 'secondary' : 'ghost'}
    size="sm"
    onClick={() => handleViewChange('list')}
    className={cn('gap-2', view === 'list' && 'bg-construction-blue text-white')}
  >
    <List className="h-4 w-4" />
    <span className="hidden sm:inline">List</span>
  </Button>
</div>
```

### GanttChart
```tsx
// Location: components/tasks/gantt/GanttChart.tsx
// Collapsible timeline with drag-to-reschedule tasks
// Configurable time scales: day, week, month
// Dependency lines between tasks
// Today marker with current time indicator

<GanttChart
  tasks={ganttTasks}
  dependencies={taskDependencies}
  onTaskClick={handleTaskClick}
  onTaskDateChange={handleTaskDateChange}
/>
```

---

## Card Patterns

### Task Card
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardContent className="p-4">
    <div className="flex items-start justify-between mb-2">
      <h3 className="font-medium line-clamp-2">{task.title}</h3>
      <PriorityBadge priority={task.priority} />
    </div>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
      {task.description}
    </p>
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Avatar className="w-6 h-6" />
        <span className="text-gray-600">{assignee.name}</span>
      </div>
      <span className="text-gray-500">{formatDate(task.due_date)}</span>
    </div>
  </CardContent>
</Card>
```

### Project Card
```tsx
<Card className="border-l-4 border-l-construction-blue">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{project.name}</CardTitle>
      <StatusBadge status={project.status} />
    </div>
    <CardDescription>
      <Building2 className="inline w-4 h-4 mr-1" />
      {project.client_name}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Progress value={project.completion_percentage} className="mb-2" />
    <div className="flex justify-between text-sm text-gray-500">
      <span>{project.completion_percentage}% complete</span>
      <span>Due {formatDate(project.end_date)}</span>
    </div>
  </CardContent>
</Card>
```

### Stats Card
```tsx
<Card className="border-2 border-gray-200">
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-construction-blue/10 rounded-lg">
        <CheckSquare className="w-5 h-5 text-construction-blue" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Active Tasks</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Form Patterns

### Form Layout
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Name *</Label>
    <Input
      id="name"
      name="name"
      required
      placeholder="Enter name"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea
      id="description"
      name="description"
      placeholder="Enter description (optional)"
      rows={3}
    />
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Start Date</Label>
      <Input type="date" name="start_date" />
    </div>
    <div className="space-y-2">
      <Label>End Date</Label>
      <Input type="date" name="end_date" />
    </div>
  </div>

  <div className="flex justify-end gap-3 pt-4">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" className="bg-construction-blue">
      Save
    </Button>
  </div>
</form>
```

### Error Display
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
    {error}
  </div>
)}
```

---

## List Patterns

### Simple List
```tsx
<div className="space-y-3">
  {items.map(item => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-construction-blue/30 transition-colors"
    >
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-gray-500">{item.description}</p>
      </div>
      <Button variant="ghost" size="icon">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  ))}
</div>
```

### Grid List
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>
```

---

## Navigation Patterns

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <OverviewContent />
  </TabsContent>
  <TabsContent value="tasks">
    <TasksContent />
  </TabsContent>
  <TabsContent value="team">
    <TeamContent />
  </TabsContent>
</Tabs>
```

### Breadcrumbs
```tsx
<div className="flex items-center gap-2 text-sm text-gray-500">
  <Link href="/app/projects" className="hover:text-construction-blue">
    Projects
  </Link>
  <ChevronRight className="w-4 h-4" />
  <span className="text-gray-900">{project.name}</span>
</div>
```

---

## Performance Patterns from Projects Module

### Direct Icon Imports (Critical Performance)

**Problem:** Barrel imports from `lucide-react` add 200-800ms to page load.

**Solution:** Import icons directly from their individual files.

```typescript
// ❌ BAD - Barrel import (slow)
import { Building2, MapPin, Calendar } from 'lucide-react';

// ✅ GOOD - Direct import (fast)
import Building2 from 'lucide-react/icons/building-2';
import MapPin from 'lucide-react/icons/map-pin';
import Calendar from 'lucide-react/icons/calendar';
```

**Impact:** Saves 200-800ms per page load.

---

### useMemo for Expensive Computations

Use `useMemo` to cache computed values that don't change often:

```typescript
const statusConfig = useMemo(
  () =>
    STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.active,
  [project.status],
);

const formattedBudget = useMemo(
  () => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(project.budget || 0),
  [project.budget],
);
```

**When to use:** Complex calculations, object/array transformations, expensive formatting.

---

### useCallback for Stable Event Handlers

Use `useCallback` to prevent function recreation on every render:

```typescript
const handleModalOpen = useCallback(() => {
  fetchModalData();
}, [fetchModalData]);

const handleRefresh = useCallback(() => {
  router.refresh();
}, [router]);
```

**When to use:** Event handlers, callbacks passed to child components, dependency arrays.

---

### useEffect for Conditional Side Effects

Use `useEffect` for side effects that should only run when dependencies change:

```typescript
// Fetch modal data only when modal opens
useEffect(() => {
  if (isOpen) {
    onModalOpen();
  }
}, [isOpen, onModalOpen]);
```

**Anti-pattern:**
```typescript
// ❌ BAD - Runs on every render while modal is open
if (isOpen) {
  onModalOpen();
}
```

---

### Props Merging with Fallbacks

Handle optional props with multiple fallback levels:

```typescript
const resolvedProjects = modalData?.projects || projects || [];
const resolvedTeamMembers = modalData?.teamMembers || teamMembers || [];
```

**Pattern:** Lazy-loaded data → Server props → Empty array

---

### Dynamic Component Loading

Load heavy components only when needed:

```typescript
const TaskModal = dynamic(
  () =>
    import('@/components/tasks/TaskModal').then((mod) => ({
      default: mod.TaskModal,
    })),
  { ssr: false },
);
```

**When to use:** Modals, heavy charts, editor components, third-party widgets.

---

### Lazy Loading Hook Pattern

Create custom hooks for lazy-loaded data with caching:

```typescript
export function useLazyData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const timestampRef = useRef(null);

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const isCacheValid = useCallback(() => {
    if (!timestampRef.current) return false;
    return Date.now() - timestampRef.current < CACHE_TTL;
  }, []);

  const fetchData = useCallback(async () => {
    // Skip if cache is valid or already fetching
    if (isCacheValid() || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const result = await serverAction();
      setData(result.data);
      hasFetchedRef.current = true;
      timestampRef.current = Date.now();
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isCacheValid]);

  return { data, isLoading, fetchData };
}
```

**Features:**
- Manual trigger (not on mount)
- Cache with TTL (prevents stale data)
- Duplicate fetch prevention
- Loading states

**Usage:**
```typescript
const { data, isLoading, fetchData } = useLazyData();

// Trigger fetch when modal opens
useEffect(() => {
  if (isModalOpen) {
    fetchData();
  }
}, [isModalOpen, fetchData]);
```

---

### Modal Context Provider Pattern

Centralize modal state management:

```typescript
<TaskModalProvider>
  <ProjectDetailContent />
  {/* TaskModalRenderer consumes context */}
</TaskModalProvider>
```

**Benefits:**
- Avoids prop drilling
- Consistent modal API
- Easier testing

---

## Data Loading Patterns

### Deferred Loading (Non-Critical Data)

For expensive or non-critical data, use the deferred loading pattern to improve initial page load time.

```tsx
'use client';

import { useDeferredData } from '@/hooks/use-deferred-data';
import { getProjectExpenseStats } from '@/app/actions/project-deferred';

export function ExpenseStatsPanel({ projectId }: { projectId: string }) {
  // Load expense stats 1 second after page loads
  const { data: statsData, loading, error } = useDeferredData({
    fetchFn: () => getProjectExpenseStats(projectId),
    delay: 1000,
    cacheKey: `project-${projectId}-expense-stats`,
  });

  if (loading) {
    return <ExpenseStatsSkeleton />;
  }

  if (!statsData) {
    return null; // Graceful degradation
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard title="Total" value={statsData.expenseStats.totalAmount} />
      <StatCard title="Approved" value={statsData.expenseStats.approvedAmount} />
      <StatCard title="Pending" value={statsData.expenseStats.pendingAmount} />
    </div>
  );
}

function ExpenseStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}
```

**When to use:**
- Expensive calculations (aggregations, stats)
- Below-the-fold content
- Inactive tab content
- Secondary metrics not needed for initial render

**Pattern:**
1. Create deferred server action in `app/actions/{feature}-deferred.ts`
2. Use `useDeferredData` hook with delay
3. Show skeleton while loading
4. Gracefully handle empty/error states
5. Use cache key to prevent refetching

**See:**
- Skill: `.claude/skills/frontend/deferred-loading.md`
- Example: `.claude/docs/frontend/DEFERRED_LOADING_EXAMPLE.md`
- Reference: `app/actions/project-deferred.ts`, `hooks/use-deferred-data.ts`

---

## Component Refactoring Strategy

### When to Split Components

Split components when they exceed maintainability thresholds:

**Size Thresholds:**
- `>500 lines`: Consider splitting by responsibility
- `>800 lines`: Definitely split into multiple components
- `>1,000 lines`: Urgent refactoring needed

**Complexity Indicators:**
- Multiple distinct responsibilities (details, approval, materials)
- 10+ useState declarations
- 15+ event handlers
- Multiple tabs or sections
- Difficult to locate specific logic

**Real Example from Tasks Module:**
- `TaskDetail.tsx`: 1,404 lines → Split into orchestrator + 4 sections = 572 lines (59% reduction)
- `TaskModal.tsx`: 1,499 lines → Split into orchestrator + 4 steps = 808 lines (46% reduction)

---

### Pattern 1: Orchestrator + Sections

**Use For:** Display components with multiple sections (detail views, dashboards)

**Structure:**
```
components/tasks/
├── TaskDetail.tsx          (orchestrator, 250-300 lines)
└── detail/
    ├── TaskDetailsSection.tsx      (200 lines)
    ├── TaskApprovalSection.tsx     (150 lines)
    ├── TaskDependenciesSection.tsx (200 lines)
    └── TaskMaterialsSection.tsx    (300 lines)
```

**Orchestrator Responsibilities:**
- Layout and structure
- Tab/section navigation
- Global state (activeTab, isLoading)
- Error boundaries
- Close/dismiss handlers

**Section Responsibilities:**
- Domain-specific logic
- Local state management
- Domain-specific data fetching
- Field validation
- Domain-specific error handling

**Example:**

```typescript
// TaskDetail.tsx (Orchestrator)
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskDetailsSection } from './detail/TaskDetailsSection';
import { TaskApprovalSection } from './detail/TaskApprovalSection';
import { TaskDependenciesSection } from './detail/TaskDependenciesSection';
import { TaskMaterialsSection } from './detail/TaskMaterialsSection';

export function TaskDetail({ task, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <h2>{task.title}</h2>
        <button onClick={onClose}>Close</button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <TaskDetailsSection task={task} />
          <TaskApprovalSection task={task} />
          <TaskDependenciesSection task={task} />
        </TabsContent>

        <TabsContent value="materials">
          <TaskMaterialsSection taskId={task.id} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLog taskId={task.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

```typescript
// detail/TaskDetailsSection.tsx (Section)
'use client';

import { useActionWithError } from '@/hooks/useActionWithError';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { updateTask } from '@/app/actions/tasks';

export function TaskDetailsSection({ task }: { task: Task }) {
  const { execute, error, success } = useActionWithError(updateTask);

  const handleUpdateTitle = async (title: string) => {
    await execute(task.id, { title });
  };

  const handleUpdateDescription = async (description: string) => {
    await execute(task.id, { description });
  };

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />

      <div>
        <Label>Title</Label>
        <Input
          value={task.title}
          onChange={(e) => handleUpdateTitle(e.target.value)}
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={task.description || ''}
          onChange={(e) => handleUpdateDescription(e.target.value)}
        />
      </div>

      {/* More fields... */}
    </div>
  );
}
```

**Benefits:**
- Clear separation of concerns
- Easier to test sections independently
- Reusable sections across different views
- Better code splitting (lazy load sections)
- Easier to maintain (smaller files)

**Key Principles:**
1. Orchestrator manages **layout**, sections manage **logic**
2. Pass only required data to sections (not entire parent state)
3. Sections are self-contained (manage own state and actions)
4. Use shared error handling patterns (useActionWithError)
5. Each section has a single clear responsibility

---

### Pattern 2: Multi-Step Form (Wizard)

**Use For:** Multi-step forms, wizards, onboarding flows

**Structure:**
```
components/tasks/
├── TaskModal.tsx           (orchestrator, 200-250 lines)
└── modal/
    ├── TaskTypeSelectionStep.tsx   (150 lines)
    ├── TaskFormFieldsStep.tsx      (250 lines)
    ├── TaskAssigneeStep.tsx        (180 lines)
    └── TaskMaterialsExtrasStep.tsx (200 lines)
```

**Orchestrator Responsibilities:**
- Step navigation (next, back, jump to step)
- Form state management (centralized)
- Validation coordination
- Submit handler
- Progress indication

**Step Responsibilities:**
- Step-specific UI
- Field validation
- Help text and instructions
- Step-specific error display

**Example:**

```typescript
// TaskModal.tsx (Orchestrator)
'use client';

import { useState } from 'react';
import { useTaskFormState } from '@/hooks/useTaskFormState';
import { TaskTypeSelectionStep } from './modal/TaskTypeSelectionStep';
import { TaskFormFieldsStep } from './modal/TaskFormFieldsStep';
import { TaskAssigneeStep } from './modal/TaskAssigneeStep';
import { TaskMaterialsExtrasStep } from './modal/TaskMaterialsExtrasStep';

const STEPS = ['type', 'fields', 'assignee', 'extras'] as const;
type Step = typeof STEPS[number];

export function TaskModal({ isOpen, onClose, projectId }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const formState = useTaskFormState(); // Centralized form state

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    const result = await createTask(formState.toInput());
    if ('error' in result) {
      setError(result.error);
    } else {
      onClose();
      router.refresh();
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Create Task">
      {/* Progress indicator */}
      <StepProgress steps={STEPS} currentStep={currentStep} />

      {/* Step content */}
      {currentStep === 'type' && (
        <TaskTypeSelectionStep
          value={formState.taskType}
          onChange={formState.setTaskType}
          onNext={handleNext}
        />
      )}

      {currentStep === 'fields' && (
        <TaskFormFieldsStep
          formState={formState}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'assignee' && (
        <TaskAssigneeStep
          value={formState.assigneeId}
          onChange={formState.setAssigneeId}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'extras' && (
        <TaskMaterialsExtrasStep
          formState={formState}
          onSubmit={handleSubmit}
          onBack={handleBack}
        />
      )}
    </ResponsiveModal>
  );
}
```

```typescript
// modal/TaskFormFieldsStep.tsx (Step)
'use client';

export function TaskFormFieldsStep({
  formState,
  onNext,
  onBack,
}: Props) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    // Validate step fields
    const errors: Record<string, string> = {};

    if (!formState.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input
          value={formState.title}
          onChange={(e) => formState.setTitle(e.target.value)}
          error={validationErrors.title}
        />
        {validationErrors.title && (
          <p className="text-sm text-red-600 mt-1">{validationErrors.title}</p>
        )}
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formState.description}
          onChange={(e) => formState.setDescription(e.target.value)}
        />
      </div>

      {/* More fields... */}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
```

**Benefits:**
- Clear step boundaries
- Progressive validation
- Easy to reorder steps
- Can skip optional steps
- Better UX (focused on one task at a time)

**Key Principles:**
1. Centralized form state in orchestrator or custom hook
2. Each step validates its own fields
3. Steps are dumb components (receive props, call callbacks)
4. Orchestrator manages step progression logic
5. Use step progress indicator for user feedback

---

### Pattern 3: Shared Utilities for Common Patterns

**Use For:** Duplicate patterns across multiple components (error handling, loading states, etc.)

**Problem:** Tasks Module had 8 components with duplicate error handling code (15 lines each = 120 lines total).

**Solution:** Extract to shared hook + banner components.

```typescript
// hooks/useActionWithError.ts
'use client';

import { useState, useCallback } from 'react';

export function useActionWithError<T extends (...args: any[]) => Promise<any>>(
  action: T
) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setError(null);
      setSuccess(false);
      setIsLoading(true);

      try {
        const result = await action(...args);

        if (result && 'error' in result) {
          setError(result.error);
          return result;
        }

        setSuccess(true);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [action]
  );

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(false), []);

  return { execute, error, success, isLoading, clearError, clearSuccess };
}
```

```typescript
// components/shared/ErrorBanner.tsx
'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <p className="flex-1 text-sm text-red-700">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0">
          <X className="w-4 h-4 text-red-600" />
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      <p className="flex-1 text-sm text-green-700">{message}</p>
    </div>
  );
}
```

**Usage in Components:**

```typescript
// Before (15 lines per component × 8 components = 120 lines)
export function SomeComponent() {
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    try {
      const result = await someAction();
      if ('error' in result) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error occurred');
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 p-3 text-red-700">{error}</div>
      )}
      {/* ... */}
    </div>
  );
}

// After (5 lines per component × 8 components = 40 lines + 50 lines shared = 90 lines total)
import { useActionWithError } from '@/hooks/useActionWithError';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

export function SomeComponent() {
  const { execute, error, clearError } = useActionWithError(someAction);

  return (
    <div>
      <ErrorBanner message={error} onDismiss={clearError} />
      <Button onClick={() => execute(params)}>Action</Button>
    </div>
  );
}
```

**Impact:** 120 lines → 90 lines total, 74% duplicate code eliminated.

**When to Extract:**
- Pattern appears in 3+ components
- Logic is identical or nearly identical
- Pattern is self-contained (doesn't depend on parent state)
- Pattern is likely to be needed in future components

**Common Shared Utilities:**
- Error handling (useActionWithError)
- Loading states (useLoadingState)
- Modal state (useModal)
- Form state (useFormState)
- Async data (useAsyncData)
- Debounced input (useDebouncedValue)

---

### Refactoring Checklist

When splitting or refactoring components:

**Planning:**
- [ ] Identify clear responsibility boundaries
- [ ] Choose appropriate pattern (orchestrator, steps, shared utility)
- [ ] Document component structure before starting
- [ ] Plan prop interfaces for each section/step

**Implementation:**
- [ ] Create directory structure (detail/, modal/, etc.)
- [ ] Extract sections/steps one at a time
- [ ] Verify functionality after each extraction
- [ ] Update imports in parent component
- [ ] Run build to catch type errors

**Quality:**
- [ ] Each component <500 lines
- [ ] Single responsibility per component
- [ ] Clear prop interfaces
- [ ] Shared patterns extracted to utilities
- [ ] No duplicate error handling code

**Testing:**
- [ ] Test all features still work
- [ ] Verify error handling
- [ ] Check loading states
- [ ] Test on mobile
- [ ] Verify no console errors

**Performance:**
- [ ] Add React.memo() to list item components
- [ ] Use useMemo() for expensive computations
- [ ] Use useCallback() for stable handlers
- [ ] Consider lazy loading for heavy sections

---

## See Also

- Design system: `frontend/DESIGN_SYSTEM.md`
- Page layouts: `frontend/LAYOUTS.md`
- Form patterns skill: `skills/frontend/form-patterns.md`
- Deferred loading skill: `skills/frontend/deferred-loading.md`
- Tasks Module migration guide: `/Users/jonathanlee/Desktop/genhub/docs/tasks-module-migration-guide.md`
- Performance report: `/Users/jonathanlee/Desktop/genhub/docs/tasks-module-performance-report.md`
- Optimization runbook: `/Users/jonathanlee/Desktop/genhub/docs/module-optimization-runbook.md`
