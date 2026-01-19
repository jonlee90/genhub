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

## See Also

- Design system: `frontend/DESIGN_SYSTEM.md`
- Page layouts: `frontend/LAYOUTS.md`
- Form patterns skill: `skills/frontend/form-patterns.md`
- Deferred loading skill: `skills/frontend/deferred-loading.md`
