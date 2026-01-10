# GenHub Component Patterns

## Critical Rules

### Never Supabase in Client
```typescript
// WRONG - causes build failure
'use client'
import { createClient } from '@supabase/supabase-js'

// CORRECT
import { getProjects } from '@/app/actions/projects'
```

### Always BaseModal
```typescript
<BaseModal isOpen={open} onClose={() => setOpen(false)} title="Edit" icon={Edit}>
```

## Key Components (210+)

| Directory | Components |
|-----------|------------|
| ui/ | Button, Card, BaseModal, Input |
| dashboard/ | KPICard, TaskProgressWidget |
| tasks/ | TaskCard, TaskKanban, GanttView |
| projects/ | ProjectCard, PhaseTimeline |

## Props Patterns
```typescript
interface CardProps { entity: T; onEdit?: () => void }
interface FormProps { defaultValues?: T; onSuccess?: () => void }
interface ListProps { entities: T[]; onSelect?: (e: T) => void }
```

## Design
- Colors: `#001B51` primary, `#3C3C3C` accent
- Icons: Lucide only (w-4/w-5/w-6)
- Spacing: `p-4 md:p-6`
