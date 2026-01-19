# Skill: Component Patterns

> Component architecture patterns for GenHub

## When to Use

- Creating new UI components
- Refactoring existing components
- Deciding client vs server component
- Component composition patterns

## Prerequisites

- Read `docs/indexes/components.md` to check existing components
- Understand 'use client' implications

---

## Quick Reference

### Client Component Template
```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
// Performance: Direct imports instead of barrel file (saves 200-800ms)
import HardHat from 'lucide-react/icons/hard-hat'

interface ComponentNameProps {
  // Required props
  title: string
  items: Item[]
  // Optional props
  className?: string
  children?: React.ReactNode
  onItemClick?: (item: Item) => void
}

export function ComponentName({
  title,
  items,
  className,
  children,
  onItemClick,
}: ComponentNameProps) {
  console.log('[ComponentName] Rendering:', { title })

  // Performance: Memoize computed values
  const itemCount = useMemo(() => items.length, [items])

  // Performance: Memoize callbacks to prevent child re-renders
  const handleClick = useCallback((item: Item) => {
    onItemClick?.(item)
  }, [onItemClick])

  return (
    <div className={cn(
      "bg-white rounded-lg",
      "border-2 border-gray-200",
      "shadow-construction",
      className
    )}>
      {children}
    </div>
  )
}
```

### Server Component Template
```tsx
// No 'use client' - this is a Server Component
import { createClient } from '@/utils/supabase/server'

interface PageProps {
  params: { id: string }
}

export default async function ProjectPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) {
    return <div>Project not found</div>
  }

  // Pass data to client component as props
  return <ProjectDetail project={project} />
}
```

---

## Component Types

### 1. Display Component (Presentational)
```tsx
'use client'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#001B51]/30 cursor-pointer"
    >
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-gray-600">{task.description}</p>
    </div>
  )
}
```

### 2. Container Component (Data + Logic)
```tsx
'use client'

import { useState, useEffect } from 'react'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: (task: Task) => void
}

export function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const [filter, setFilter] = useState<string>('all')

  const filteredTasks = tasks.filter(task =>
    filter === 'all' || task.status === filter
  )

  return (
    <div>
      <TaskFilters value={filter} onChange={setFilter} />
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskUpdate(task)}
          />
        ))}
      </div>
    </div>
  )
}
```

### 3. Compound Component
```tsx
'use client'

import { createContext, useContext, useState } from 'react'

// Context
const AccordionContext = createContext<{
  openItem: string | null
  toggle: (id: string) => void
} | null>(null)

// Root
export function Accordion({ children }: { children: React.ReactNode }) {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const toggle = (id: string) => setOpenItem(prev => prev === id ? null : id)

  return (
    <AccordionContext.Provider value={{ openItem, toggle }}>
      <div className="space-y-2">{children}</div>
    </AccordionContext.Provider>
  )
}

// Item
Accordion.Item = function AccordionItem({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  const context = useContext(AccordionContext)
  if (!context) throw new Error('AccordionItem must be within Accordion')

  const isOpen = context.openItem === id

  return (
    <div className="border rounded-lg">
      <button onClick={() => context.toggle(id)} className="w-full p-4 text-left">
        {title}
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  )
}

// Usage
<Accordion>
  <Accordion.Item id="1" title="Section 1">Content 1</Accordion.Item>
  <Accordion.Item id="2" title="Section 2">Content 2</Accordion.Item>
</Accordion>
```

### 4. Controlled vs Uncontrolled
```tsx
'use client'

interface SearchInputProps {
  // Controlled
  value?: string
  onChange?: (value: string) => void
  // Uncontrolled
  defaultValue?: string
  onSearch?: (value: string) => void
}

export function SearchInput({
  value,
  onChange,
  defaultValue,
  onSearch,
}: SearchInputProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')

  // Use external value if controlled
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (isControlled) {
      onChange?.(newValue)
    } else {
      setInternalValue(newValue)
    }
  }

  return (
    <input
      value={currentValue}
      onChange={handleChange}
      onKeyDown={(e) => e.key === 'Enter' && onSearch?.(currentValue)}
    />
  )
}
```

---

## Props Patterns

### Required vs Optional
```tsx
interface Props {
  // Required
  id: string
  title: string

  // Optional with default
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'

  // Optional handlers
  onClick?: () => void
  onClose?: () => void

  // Optional styling
  className?: string
}

export function Component({
  id,
  title,
  variant = 'default',
  size = 'md',
  onClick,
  onClose,
  className,
}: Props) {
  // ...
}
```

### Children Patterns
```tsx
// Simple children
interface CardProps {
  children: React.ReactNode
}

// Render prop
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}

// Slot pattern
interface LayoutProps {
  header?: React.ReactNode
  sidebar?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}
```

### Event Handlers
```tsx
interface ButtonProps {
  // Standard handler
  onClick?: () => void

  // With event
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void

  // Async handler
  onClick?: () => Promise<void>
}

// Usage with loading state
export function AsyncButton({ onClick, children }: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!onClick) return
    setIsLoading(true)
    try {
      await onClick()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? <Loader2 className="animate-spin" /> : children}
    </button>
  )
}
```

---

## File Organization

### Component Folder Structure
```
components/
├── ui/                    # Base UI components (shadcn)
│   ├── button.tsx
│   ├── card.tsx
│   └── BaseModal.tsx
├── projects/              # Feature-specific
│   ├── ProjectCard.tsx
│   ├── ProjectList.tsx
│   └── ProjectDetail.tsx
├── tasks/
│   ├── TaskCard.tsx
│   ├── TaskBoard.tsx
│   └── TaskDetail/
│       ├── index.tsx      # Main export
│       ├── TaskHeader.tsx
│       └── TaskComments.tsx
└── shared/                # Shared across features
    ├── StatusBadge.tsx
    ├── PriorityBadge.tsx
    └── UserAvatar.tsx
```

### Barrel Exports
```tsx
// components/tasks/index.ts
export { TaskCard } from './TaskCard'
export { TaskBoard } from './TaskBoard'
export { TaskDetail } from './TaskDetail'

// Usage
import { TaskCard, TaskBoard } from '@/components/tasks'
```

---

## Performance Optimization Patterns

### Direct Icon Imports
**ALWAYS use direct imports for Lucide icons to save 200-800ms per page**

```tsx
// WRONG: Barrel import (slow, loads all icons)
import { HardHat, Wrench, Building } from 'lucide-react'

// CORRECT: Direct import (fast, tree-shakeable)
import HardHat from 'lucide-react/icons/hard-hat'
import Wrench from 'lucide-react/icons/wrench'
import Building from 'lucide-react/icons/building-2'
```

### useMemo for Expensive Computations
```tsx
'use client'

export function TaskList({ tasks }: { tasks: Task[] }) {
  // WRONG: Recalculates on every render
  const completedCount = tasks.filter(t => t.status === 'completed').length

  // CORRECT: Memoized, only recalculates when tasks change
  const completedCount = useMemo(
    () => tasks.filter(t => t.status === 'completed').length,
    [tasks]
  )

  // When to use useMemo:
  // - Filtering/mapping arrays
  // - Complex calculations
  // - Creating objects/arrays passed as props
  // - Expensive string manipulations
}
```

### useCallback for Event Handlers
```tsx
'use client'

export function TaskCard({ task, onUpdate }: Props) {
  // WRONG: New function on every render -> child re-renders
  const handleClick = () => {
    onUpdate(task.id)
  }

  // CORRECT: Stable reference -> child won't re-render unnecessarily
  const handleClick = useCallback(() => {
    onUpdate(task.id)
  }, [task.id, onUpdate])

  // When to use useCallback:
  // - Callbacks passed to memoized child components
  // - Functions passed to useEffect dependencies
  // - Event handlers in lists
}
```

### Lazy State Initialization
```tsx
'use client'

export function ExpensiveComponent() {
  // WRONG: Runs expensive calc on every render (even though useState only uses it once)
  const [data, setData] = useState(expensiveCalculation())

  // CORRECT: Function only runs once on mount
  const [data, setData] = useState(() => expensiveCalculation())

  // When to use:
  // - Reading from localStorage
  // - Computing initial values from props
  // - Parsing JSON
  // - Any expensive synchronous operation
}
```

### Extract Memoized Components
```tsx
// WRONG: Entire parent re-renders when count changes
export function Dashboard({ tasks }: { tasks: Task[] }) {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ExpensiveChart data={tasks} />  {/* Re-renders unnecessarily */}
    </div>
  )
}

// CORRECT: Chart isolated from count updates
const MemoizedChart = memo(function Chart({ data }: { data: Task[] }) {
  return <ExpensiveChart data={data} />
})

export function Dashboard({ tasks }: { tasks: Task[] }) {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <MemoizedChart data={tasks} />  {/* Only re-renders when tasks change */}
    </div>
  )
}
```

### Deferred Data Loading Pattern
```tsx
'use client'

import { useDeferredData } from '@/hooks/use-deferred-data'

export function ProjectOverview({ projectId }: { projectId: string }) {
  // Load non-critical data after initial render
  const { data, loading, hasFetched } = useDeferredData({
    fetchFn: () => getProjectStats(projectId),
    delay: 800, // Wait 800ms after mount
    cacheKey: `project-${projectId}-stats`,
  })

  return (
    <div>
      {/* Critical UI renders immediately */}
      <ProjectHeader projectId={projectId} />

      {/* Deferred data shows skeleton then content */}
      {loading && !data ? (
        <StatsSkeleton />
      ) : data ? (
        <StatsWidget stats={data} />
      ) : null}
    </div>
  )
}
```

---

## Anti-Patterns

```tsx
// WRONG: Supabase in client component
'use client'
import { createClient } from '@/utils/supabase/server'  // NEVER!

// WRONG: Props drilling deeply
<GrandParent>
  <Parent data={data}>
    <Child data={data}>
      <GrandChild data={data} />  // Use Context instead
    </Child>
  </Parent>
</GrandParent>

// WRONG: Massive component doing everything
export function TaskPage() {
  // 500 lines of mixed concerns
}

// CORRECT: Split into focused components
export function TaskPage() {
  return (
    <>
      <TaskHeader />
      <TaskBoard />
      <TaskSidebar />
    </>
  )
}

// WRONG: any types
interface Props {
  data: any  // No type safety!
}

// CORRECT: Proper typing
interface Props {
  data: Task
}
```

---

## Styling Patterns

### Using cn() for Conditional Classes
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  // Base styles
  "p-4 rounded-lg border-2",
  // Conditional styles
  isActive && "border-[#001B51] bg-[#001B51]/5",
  isDisabled && "opacity-50 cursor-not-allowed",
  // Override from props
  className
)}>
```

### Variant Pattern
```tsx
const variants = {
  default: "bg-[#001B51] text-white",
  outline: "border-2 border-[#001B51] text-[#001B51]",
  ghost: "text-[#001B51] hover:bg-[#001B51]/10",
} as const

interface ButtonProps {
  variant?: keyof typeof variants
}

<button className={cn(variants[variant ?? 'default'], className)}>
```

---

## Affected Documentation

After creating components:
- Add to `docs/indexes/components.md`
- Update relevant feature documentation

---

## Checklist

- [ ] TypeScript interface defined for props
- [ ] 'use client' only when needed
- [ ] Debug logging included
- [ ] Responsive (mobile-first)
- [ ] Using cn() for class merging
- [ ] No Supabase imports in client components
- [ ] Proper event handler types
- [ ] Added to components index
