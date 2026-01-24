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

## Server Action Pattern

```typescript
'use server'
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({ /* fields */ })

export async function createEntity(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.format() }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('table')
    .insert({ ...parsed.data, user_id: session.user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/app/route')
  return { data }
}
```

## Touch Button Pattern

```tsx
<button className="
  w-full h-14 px-6 bg-[#001B51] text-white font-semibold
  rounded-xl flex items-center justify-center gap-2
  active:scale-[0.98] active:bg-[#001B51]/90
  transition-all duration-150 disabled:opacity-50
">
  <Check className="w-5 h-5" /> Save
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

## Common Imports

```typescript
// Server Actions
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'

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

All agents should return this structure:

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

## Learning Entry Format

When updating Serena memories:

```markdown
## [Pattern Name] (YYYY-MM-DD)
**What:** Clear description
**When:** Trigger conditions
**Why:** Problem prevented / value provided
**How:** Solution steps or code
**Source:** Task name
```
