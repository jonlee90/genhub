# Skill: List Patterns

> List, Table, and Kanban patterns for GenHub

## When to Use

- Displaying collections of items
- Task boards (Kanban)
- Data tables
- Card grids

## Prerequisites

- Check `docs/indexes/components.md` for existing list components
- Know GenHub responsive breakpoints

---

## Quick Reference

### Simple Card List
```tsx
'use client'

interface ItemListProps {
  items: Item[]
  onItemClick?: (item: Item) => void
}

export function ItemList({ items, onItemClick }: ItemListProps) {
  if (items.length === 0) {
    return <EmptyState message="No items found" />
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-[#001B51]/30 transition-colors cursor-pointer"
        >
          <h3 className="font-medium">{item.title}</h3>
          <p className="text-sm text-gray-600">{item.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### Card Grid
```tsx
export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
```

---

## Kanban Board

### Full Kanban Implementation
```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { updateTaskStatus } from '@/app/actions/tasks'

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'gray' },
  { id: 'in_progress', title: 'In Progress', color: 'blue' },
  { id: 'review', title: 'Review', color: 'yellow' },
  { id: 'completed', title: 'Completed', color: 'green' },
]

interface KanbanBoardProps {
  tasks: Task[]
}

export function KanbanBoard({ tasks: initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: any) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id
    const newStatus = over.id

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )

    // Server update
    await updateTaskStatus(taskId, newStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(t => t.status === column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({ column, tasks }: { column: Column; tasks: Task[] }) {
  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full bg-${column.color}-500`} />
        <h3 className="font-semibold">{column.title}</h3>
        <span className="ml-auto text-sm text-gray-500">{tasks.length}</span>
      </div>

      {/* Droppable area */}
      <SortableContext
        id={column.id}
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[200px]">
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
```

### Sortable Task Card
```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-white border-2 border-gray-200 rounded-lg cursor-grab active:cursor-grabbing"
    >
      <h4 className="font-medium text-sm">{task.title}</h4>
      <div className="flex items-center gap-2 mt-2">
        <PriorityBadge priority={task.priority} size="sm" />
        {task.due_date && (
          <span className="text-xs text-gray-500">
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}
```

---

## Data Table

### Simple Table
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TaskTableProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assignee</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map(task => (
          <TableRow
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="cursor-pointer hover:bg-gray-50"
          >
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell><StatusBadge status={task.status} /></TableCell>
            <TableCell><PriorityBadge priority={task.priority} /></TableCell>
            <TableCell>{task.due_date ? formatDate(task.due_date) : '-'}</TableCell>
            <TableCell>{task.assignee?.name || 'Unassigned'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Sortable Table
```tsx
'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type SortField = 'title' | 'status' | 'due_date' | 'priority'
type SortOrder = 'asc' | 'desc'

export function SortableTaskTable({ tasks }: { tasks: Task[] }) {
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const aVal = a[sortField] ?? ''
    const bVal = b[sortField] ?? ''
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            onClick={() => handleSort('title')}
            className="cursor-pointer hover:bg-gray-100"
          >
            <span className="flex items-center gap-1">
              Title <SortIcon field="title" />
            </span>
          </TableHead>
          {/* ... other headers */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTasks.map(task => (
          <TableRow key={task.id}>
            <TableCell>{task.title}</TableCell>
            {/* ... other cells */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## Filtering & Search

### Filter Bar
```tsx
'use client'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
}

export function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="pl-9 border-2"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-40 border-2">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

### Using Filters
```tsx
export function TasksContainer({ tasks }: { tasks: Task[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <TaskList tasks={filteredTasks} />
    </>
  )
}
```

---

## Empty States

```tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        {icon || <FolderKanban className="w-8 h-8 text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="bg-[#001B51]">
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

## Anti-Patterns

```tsx
// WRONG: No loading state
{tasks.map(task => <TaskCard task={task} />)}

// CORRECT: Handle all states
{isLoading ? (
  <LoadingSkeleton />
) : tasks.length === 0 ? (
  <EmptyState title="No tasks" />
) : (
  tasks.map(task => <TaskCard key={task.id} task={task} />)
)}

// WRONG: No key prop
{tasks.map(task => <TaskCard task={task} />)}

// CORRECT: Unique key
{tasks.map(task => <TaskCard key={task.id} task={task} />)}

// WRONG: Filtering on every render
const filtered = expensiveFilter(tasks)  // Runs every render!

// CORRECT: Memoize
const filtered = useMemo(() => expensiveFilter(tasks), [tasks, filters])
```

---

## Affected Documentation

After creating list components:
- Add to `docs/indexes/components.md`

---

## Checklist

- [ ] Empty state handled
- [ ] Loading state handled
- [ ] Unique keys for list items
- [ ] Mobile responsive (stack on small screens)
- [ ] Filter/search client-side or server-side appropriately
- [ ] Drag-and-drop with optimistic updates
- [ ] Pagination for large lists
