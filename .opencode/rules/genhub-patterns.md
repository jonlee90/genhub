# GenHub Patterns for OpenCode

## Project Context

**GenHub**: Construction PWA for general contractors
**Stack**: Next.js 16, React 19, Supabase, Tailwind CSS, Lucide Icons

---

## Critical Rules

### 1. No Supabase in Client Components

```tsx
// FORBIDDEN in 'use client' files
import { createClient } from '@/utils/supabase/client'

// CORRECT: Use Server Actions or props from Server Components
import { getTasks } from '@/app/actions/tasks'
```

### 2. Design System Colors

```tsx
// Primary
"text-[#001B51]" "bg-[#001B51]"

// Success
"text-[#059669]" "bg-[#059669]"

// Error
"text-[#DC2626]" "bg-[#DC2626]"

// Warning
"text-[#F59E0B]" "bg-[#F59E0B]"

// Secondary
"text-[#3C3C3C]"

// DO NOT use other custom hex colors
```

### 3. Mobile-First Touch Targets

```tsx
// All interactive elements need:
className="min-h-[44px] min-w-[44px]"

// Touch feedback:
className="active:scale-[0.98] transition-transform"
```

### 4. Server Action Pattern

```typescript
// app/actions/*.ts
export async function createTask(data: TaskInput) {
  const { user, companyId } = await getUserContext()

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...data, company_id: companyId })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/tasks')
  return { data: task }
}
```

### 5. Component File Structure

```tsx
// Order of contents
1. 'use client' (if needed)
2. imports (external → internal → relative)
3. types/interfaces
4. component function
5. export
```

---

## Existing Components (Use These)

| Component | Path | Use For |
|-----------|------|---------|
| Button | `components/ui/Button` | All buttons |
| Card | `components/ui/Card` | Card layouts |
| Dialog | `components/ui/Dialog` | Modals |
| Input | `components/ui/Input` | Form inputs |
| Badge | `components/ui/Badge` | Status indicators |
| LoadingSpinner | `components/ui/LoadingSpinner` | Loading states |
| EmptyState | `components/ui/EmptyState` | Empty data |

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `TaskCard.tsx` |
| Hook | camelCase with use | `useTaskForm.ts` |
| Utility | camelCase | `formatDate.ts` |
| Type | PascalCase | `Task.ts` |
| Action | camelCase | `tasks.ts` |

---

## Import Aliases

```typescript
import { X } from '@/components/ui/X'      // UI components
import { Y } from '@/app/actions/Y'        // Server actions
import { Z } from '@/lib/utils'            // Utilities
import type { T } from '@/types/T'         // Types
```

---

## Testing Requirements

Before marking task complete:

```bash
npx tsc --noEmit        # Type check
npm run lint            # Linting
npm run build           # Build check
```

---

## Handoff Context

OpenCode receives handoffs from Claude Code in `.claude/handoffs/`.
OpenCode writes responses back to the same directory.

Read handoff files to understand:
- What was implemented
- Which files changed
- Any known issues
- Expected behavior
