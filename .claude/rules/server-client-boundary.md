---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
priority: critical
---

# Server/Client Component Boundary Rules

> **CRITICAL:** Violating these rules causes runtime errors in Next.js 16

## Rule 1: Client Components Cannot Import Async Server Components

### ❌ WRONG Pattern
```tsx
// File: components/TabContainer.tsx
'use client'

import { AsyncDataTab } from './AsyncDataTab'  // async Server Component

export function TabContainer() {
  return <AsyncDataTab />  // ERROR: async Client Component
}
```

### ✅ CORRECT Pattern A: Client Wrapper with Server Actions
```tsx
// File: components/AsyncDataTabClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { getData } from '@/app/actions/data'
import { DataTabContent } from './DataTabContent'
import { Skeleton } from '@/components/ui/skeleton'

export function AsyncDataTabClient({ id }: { id: string }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await getData(id)

        if (!isMounted) return

        if (!result.success) {
          setError(result.error)
          return
        }

        setData(result.data)
      } catch (err) {
        if (!isMounted) return
        setError('Unexpected error')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [id])

  if (isLoading) return <Skeleton />
  if (error) return <ErrorDisplay error={error} />

  return <DataTabContent data={data} />
}
```

### ✅ CORRECT Pattern B: Server Component Composition (Preferred)
```tsx
// File: app/page.tsx (Server Component)
import { AsyncDataTab } from '@/components/AsyncDataTab'

export default async function Page() {
  return (
    <div>
      <AsyncDataTab id="123" />
    </div>
  )
}
```

## Rule 2: Use `Promise.all()` for Parallel Server Action Calls

### ❌ WRONG: Sequential (Waterfall)
```tsx
useEffect(() => {
  const data1 = await getUsers()
  const data2 = await getPosts()  // Waits for data1
}, [])
```

### ✅ CORRECT: Parallel
```tsx
useEffect(() => {
  const [data1, data2] = await Promise.all([
    getUsers(),
    getPosts()  // Runs in parallel
  ])
}, [])
```

## Rule 3: Always Extract JSX Outside Try/Catch

### ❌ WRONG
```tsx
export async function ServerTab() {
  try {
    const data = await fetch()
    return <Component data={data} />  // JSX in try
  } catch (error) {
    return <Error />  // JSX in catch
  }
}
```

### ✅ CORRECT
```tsx
export async function ServerTab() {
  let data = null
  let error = null

  try {
    const result = await fetch()
    data = result.data
  } catch (err) {
    error = err.message
  }

  if (error) return <Error message={error} />
  return <Component data={data} />
}
```

## Rule 4: Check Component Type Before Import

**Before importing a component in a client component, verify:**

1. Does the imported component have `'use client'` directive?
2. Is the imported component an async function?
3. Does the imported component call Server Actions at the top level?

**If any answer is NO, create a client wrapper instead.**

## Rule 5: Use Proper Loading States

### ❌ WRONG: No Loading State
```tsx
'use client'
export function Tab() {
  const [data, setData] = useState(null)
  useEffect(() => { fetchData() }, [])
  return <Content data={data} />  // Renders null initially
}
```

### ✅ CORRECT: With Skeleton
```tsx
'use client'
export function Tab() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Skeleton />
  return <Content data={data} />
}
```

## When This Applies

**High-Risk Scenarios:**
- Tab components with conditional rendering
- Modal/drawer content that fetches data
- Dynamic imports of components
- Nested component hierarchies with mixed server/client

**Detection:**
- Look for `'use client'` at top of file
- Look for `async function Component()` being imported
- Look for `await` at top level of imported component

## Reference Implementation

See `components/estimates/EstimatesTabClient.tsx` for complete pattern.

## ESLint Check (Future)

Consider adding this to `.eslintrc.json`:
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["**/components/**"],
        "message": "Check if importing async Server Component into Client Component"
      }]
    }]
  }
}
```
