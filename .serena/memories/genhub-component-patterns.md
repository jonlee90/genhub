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

### Always ResponsiveModal
```typescript
// ResponsiveModal auto-switches desktop (dialog) / mobile (bottom sheet)
<ResponsiveModal open={open} onOpenChange={setOpen} title="Edit" icon={Edit}>
  {children}
</ResponsiveModal>
```
> See full patterns: Serena memory `genhub-reuse-registry`

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

## Cross-References
- Reusable patterns: Serena memory `genhub-reuse-registry`
- Duplication hotspots: Serena memory `genhub-duplication-hotspots`
- Architecture: `.claude/docs/architecture-index.md`
