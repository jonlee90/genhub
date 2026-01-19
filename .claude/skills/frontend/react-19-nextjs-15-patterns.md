# Skill: React 19 & Next.js 15 Patterns

> Modern patterns for React 19 and Next.js 15 App Router

## When to Use

- Building new pages or features
- Optimizing data fetching performance
- Implementing streaming and progressive enhancement
- Deciding between Server and Client Components

## Prerequisites

- Understanding of async/await
- Familiarity with React Server Components
- Knowledge of Next.js App Router

---

## Quick Reference

### Decision Tree: Server vs Client Component

```
Does component need interactivity (onClick, useState, etc.)?
├─ NO → Server Component (default, no 'use client')
│        - Fetch data with await
│        - Direct database access
│        - Better performance
│
└─ YES → Client Component ('use client')
         - UI interactions
         - Browser APIs
         - Hooks (useState, useEffect, etc.)
```

### Parallel Data Fetching

```tsx
// Server Component - fetches run in parallel
export default async function Page() {
  // Start all fetches immediately
  const userPromise = getUser()
  const postsPromise = getPosts()
  const commentsPromise = getComments()

  // Await together
  const [user, posts, comments] = await Promise.all([
    userPromise,
    postsPromise,
    commentsPromise
  ])

  return <Dashboard user={user} posts={posts} comments={comments} />
}
```

### Streaming with Suspense

```tsx
export default async function Page() {
  const criticalData = await getCriticalData()

  return (
    <>
      <Header data={criticalData} />

      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </>
  )
}
```

---

## React 19 Features

### 1. use() Hook for Promises

**Unwrap promises in render (not just effects)**

```tsx
import { use } from 'react'

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // use() suspends component until promise resolves
  const user = use(userPromise)

  return <div>{user.name}</div>
}

// Usage in parent
export default async function Page() {
  const userPromise = fetchUser()

  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  )
}
```

**use() with Context**

```tsx
import { use } from 'react'

function Component() {
  const theme = use(ThemeContext)  // Same as useContext, but can be conditional

  if (condition) {
    const data = use(DataContext)  // Conditional context access
    return <div>{data}</div>
  }

  return <div className={theme.className}>...</div>
}
```

### 2. Improved Server Components

**Direct Database Access**

```tsx
// app/projects/page.tsx - Server Component
import { createClient } from '@/utils/supabase/server'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return <ProjectList projects={projects || []} />
}
```

**Pass Data to Client Components**

```tsx
// Server Component
export default async function Page() {
  const data = await fetchData()

  return <ClientComponent data={data} />  // Pass as props
}

// Client Component
'use client'
export function ClientComponent({ data }: { data: Data }) {
  const [selected, setSelected] = useState(data[0])
  return <div onClick={() => setSelected(data[1])}>{selected.name}</div>
}
```

### 3. Suspense Boundaries Strategy

**Progressive Loading**

```tsx
export default async function DashboardPage() {
  // Critical data - fetch immediately
  const user = await getUser()

  return (
    <div>
      {/* Header shows immediately */}
      <Header user={user} />

      {/* Analytics loads separately */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Analytics userId={user.id} />
      </Suspense>

      {/* Recent activity loads separately */}
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity userId={user.id} />
      </Suspense>
    </div>
  )
}

// Separate Server Component
async function Analytics({ userId }: { userId: string }) {
  const analytics = await getAnalytics(userId)  // Slow query
  return <AnalyticsWidget data={analytics} />
}
```

---

## Next.js 15 Features

### 1. Parallel Routes & Streaming

**Fetch Multiple Sources in Parallel**

```tsx
export default async function Page() {
  // All three start immediately
  const [projects, tasks, team] = await Promise.all([
    getProjects(),
    getTasks(),
    getTeam(),
  ])

  return <Dashboard projects={projects} tasks={tasks} team={team} />
}
```

### 2. Server Actions with useActionState

**Form Handling**

```tsx
'use client'

import { useActionState } from 'react'
import { createProject } from '@/app/actions/projects'

export function CreateProjectForm() {
  const [state, formAction, isPending] = useActionState(createProject, null)

  return (
    <form action={formAction}>
      {state?.error && <div className="text-red-600">{state.error}</div>}

      <input name="name" required />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}
```

### 3. Dynamic Imports with next/dynamic

**Code Splitting for Heavy Components**

```tsx
import dynamic from 'next/dynamic'

// Only loads when modal opens
const TaskModal = dynamic(
  () => import('@/components/tasks/TaskModal').then(mod => ({
    default: mod.TaskModal
  })),
  {
    ssr: false,  // Don't render on server
    loading: () => <ModalSkeleton />
  }
)

export function TaskBoard() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Open</button>
      {isModalOpen && <TaskModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
```

### 4. React.cache() for Deduplication

**Prevent Duplicate Fetches**

```tsx
// lib/data.ts
import { cache } from 'react'

// Deduplicated within a single request
export const getProject = cache(async (id: string) => {
  console.log('Fetching project:', id)  // Only logs once per request
  const supabase = await createClient()
  return supabase.from('projects').select('*').eq('id', id).single()
})

// Usage in multiple components
export default async function Page({ params }) {
  const project1 = await getProject(params.id)  // Fetches
  const project2 = await getProject(params.id)  // Uses cache
  // Only 1 database query executed!
}
```

---

## Performance Patterns

### 1. Waterfall Elimination

**WRONG: Sequential Fetching (Waterfall)**

```tsx
export default async function Page() {
  const user = await getUser()           // 100ms
  const projects = await getProjects()   // 150ms
  const tasks = await getTasks()         // 120ms
  // Total: 370ms ❌
}
```

**CORRECT: Parallel Fetching**

```tsx
export default async function Page() {
  const [user, projects, tasks] = await Promise.all([
    getUser(),      // All start together
    getProjects(),
    getTasks(),
  ])
  // Total: 150ms (longest query) ✅
}
```

### 2. Defer Await Pattern

**WRONG: Await Blocks Unused Branches**

```tsx
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)  // Always waits

  if (skipProcessing) {
    return { skipped: true }  // userData not needed!
  }

  return processUserData(userData)
}
```

**CORRECT: Defer Await Until Needed**

```tsx
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    return { skipped: true }  // Returns immediately
  }

  const userData = await fetchUserData(userId)  // Only awaits if needed
  return processUserData(userData)
}
```

### 3. Partial Dependencies (better-all)

**When data depends on other data**

```tsx
import { all } from 'better-all'

const { user, config, profile } = await all({
  async user() {
    return fetchUser()
  },
  async config() {
    return fetchConfig()  // Runs in parallel with user
  },
  async profile() {
    const u = await this.$.user  // Waits for user, but config still runs
    return fetchProfile(u.id)
  }
})
```

### 4. Deferred (Background) Loading

**Load non-critical data after initial render**

```tsx
'use client'

import { useDeferredData } from '@/hooks/use-deferred-data'

export function Dashboard({ projectId }: { projectId: string }) {
  // Initial render shows skeletons
  const { data, loading } = useDeferredData({
    fetchFn: () => getProjectStats(projectId),
    delay: 800,  // Wait 800ms after mount
    cacheKey: `project-${projectId}-stats`,
  })

  return (
    <div>
      <ProjectHeader projectId={projectId} />  {/* Shows immediately */}

      {loading && !data ? (
        <Skeleton />
      ) : (
        <StatsWidget stats={data} />  {/* Fades in after 800ms */}
      )}
    </div>
  )
}
```

---

## Examples

### Example 1: Optimized Project Detail Page

```tsx
// app/projects/[id]/page.tsx
import { Suspense } from 'react'

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch critical data in parallel
  const [project, phases] = await Promise.all([
    getProject(id),
    getProjectPhases(id),
  ])

  if (!project) notFound()

  return (
    <div>
      {/* Critical content shows immediately */}
      <ProjectHeader project={project} />
      <PhaseJourney phases={phases} />

      {/* Non-critical sections stream in */}
      <Suspense fallback={<TeamSkeleton />}>
        <ProjectTeam projectId={id} />
      </Suspense>

      <Suspense fallback={<TasksSkeleton />}>
        <ProjectTasks projectId={id} />
      </Suspense>
    </div>
  )
}

// Separate Server Component for team
async function ProjectTeam({ projectId }: { projectId: string }) {
  const team = await getProjectTeam(projectId)  // Fetches independently
  return <TeamList team={team} />
}
```

### Example 2: Form with Server Action

```tsx
// app/actions/tasks.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createTask(prevState: any, formData: FormData) {
  const title = formData.get('title') as string

  if (!title) {
    return { error: 'Title is required' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .insert({ title })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks')
  return { success: true }
}

// components/tasks/CreateTaskForm.tsx
'use client'

import { useActionState } from 'react'
import { createTask } from '@/app/actions/tasks'

export function CreateTaskForm() {
  const [state, formAction, isPending] = useActionState(createTask, null)

  return (
    <form action={formAction}>
      {state?.error && (
        <div className="text-red-600">{state.error}</div>
      )}

      <input name="title" placeholder="Task title" required />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  )
}
```

---

## Anti-Patterns

```tsx
// WRONG: Fetching in Client Component
'use client'
export function TaskList() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks)
  }, [])

  return <div>{tasks.map(...)}</div>
}

// CORRECT: Fetch in Server Component, pass as props
export default async function TasksPage() {
  const tasks = await getTasks()
  return <TaskList tasks={tasks} />
}

'use client'
export function TaskList({ tasks }: { tasks: Task[] }) {
  return <div>{tasks.map(...)}</div>
}

// WRONG: Sequential awaits (waterfall)
const user = await getUser()
const posts = await getPosts()
const comments = await getComments()

// CORRECT: Parallel fetching
const [user, posts, comments] = await Promise.all([
  getUser(),
  getPosts(),
  getComments(),
])

// WRONG: Over-suspense (each item suspended separately)
{items.map(item => (
  <Suspense key={item.id} fallback={<Skeleton />}>
    <ItemComponent item={item} />
  </Suspense>
))}

// CORRECT: Suspend the whole list
<Suspense fallback={<ListSkeleton />}>
  {items.map(item => (
    <ItemComponent key={item.id} item={item} />
  ))}
</Suspense>
```

---

## Affected Documentation

After implementing these patterns:
- Update page-creation.md examples
- Update component-patterns.md Server Component section
- Reference this skill in performance optimization guides

---

## Checklist

- [ ] Server Components fetch data with `await` (not useEffect)
- [ ] Client Components use `'use client'` directive
- [ ] Parallel fetches use `Promise.all()`
- [ ] Suspense boundaries for slow sections
- [ ] Heavy components use `next/dynamic`
- [ ] Forms use Server Actions with `useActionState`
- [ ] No waterfalls (sequential awaits)
- [ ] React.cache() used for deduplication
