---
name: genhub-patterns
description: GenHub code patterns, templates, and conventions. Load when implementing new features, Server Actions, or components.
globs:
  - "app/actions/**/*.ts"
  - "components/**/*.tsx"
  - "app/app/**/*.tsx"
---

# GenHub Code Patterns

Reference patterns for implementing GenHub features consistently.

## getUserContext Pattern (Required for ALL Server Actions)

```typescript
async function getUserContext() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single()

  if (!companyUser) return { error: 'No active company' }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase
  }
}
```

## Server Action Pattern

```typescript
'use server'
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().uuid(),
})

export async function createEntity(input: unknown) {
  // 1. Auth check
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  // 2. Validation
  const parsed = CreateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.format() }

  // 3. Authorization (verify belongs to company)
  const { data: project } = await ctx.supabase
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .eq('company_id', ctx.companyId)
    .single()

  if (!project) return { error: 'Project not found' }

  // 4. Mutation
  const { data, error } = await ctx.supabase
    .from('entities')
    .insert({
      ...parsed.data,
      company_id: ctx.companyId,
      created_by: ctx.userId,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // 5. Revalidate
  revalidatePath(`/app/projects/${parsed.data.projectId}`)

  return { data }
}
```

## Touch Button Pattern

```tsx
// Primary Button
<button className="
  w-full h-14 px-6 bg-[#001B51] text-white font-semibold
  rounded-xl flex items-center justify-center gap-2
  active:scale-[0.98] active:bg-[#001B51]/90
  transition-all duration-150 disabled:opacity-50
">
  <Check className="w-5 h-5" /> Save
</button>

// Secondary Button
<button className="
  w-full h-14 px-6 bg-white text-[#001B51] font-semibold
  border-2 border-[#001B51] rounded-xl
  flex items-center justify-center gap-2
  active:scale-[0.98] active:bg-gray-50
  transition-all duration-150 disabled:opacity-50
">
  <X className="w-5 h-5" /> Cancel
</button>
```

## ResponsiveModal Usage

```tsx
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

<ResponsiveModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Building2}
  title="Title"
  rightActions={<Button>Confirm</Button>}
>
  {children}
</ResponsiveModal>
```

## Server Action Integration (Client)

```tsx
'use client'
import { useTransition } from 'react'
import { createTask } from '@/app/actions/tasks'

export function TaskForm({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createTask(formData)
      if (result.error) { /* handle error */ }
    })
  }

  return (
    <form action={handleSubmit}>
      <input name="projectId" type="hidden" value={projectId} />
      <button type="submit" disabled={isPending} className="h-14 min-w-[44px] ...">
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

## Common Imports

```typescript
// Server Actions
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Client Components
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { Check, X, Plus } from 'lucide-react'

// Types
import type { Task, Project } from '@/types/db/core'
```

## Design System

| Element | Value |
|---------|-------|
| Primary | `#001B51` |
| Accent | `#3C3C3C` |
| Success | `#059669` |
| Error | `#DC2626` |
| Touch targets | 44px minimum |
| Mobile viewport | `dvh` not `vh` |
| Safe areas | `pb-[env(safe-area-inset-bottom)]` |

## Personas

| Persona | Role | Primary Goals |
|---------|------|---------------|
| **GC** | General Contractor | Manage company, projects, subs, finances |
| **PM** | Project Manager | Track phases, tasks, timelines, reports |
| **Foreman** | Site Supervisor | Coordinate crews, tasks, report issues |
| **Worker** | Field Worker | Complete tasks, log materials, expenses |
| **Sub** | Subcontractor | Submit bids, complete work, invoice |
| **Client** | Project Client | View progress, approve changes |

## Agent Completion Format

```
**Status:** ✓ completed | ✗ failed | ⚠️ partial (N/M)

**Tasks:**
- [x] Task 1 description
- [x] Task 2 description
- [ ] Task 3 (remaining)

**Files Changed:**
- `path/to/file.ts` - Description

**Build:** ✓ pass | ✗ fail (details)

**Handoff:** (if needed) → {agent}: {reason}
```
