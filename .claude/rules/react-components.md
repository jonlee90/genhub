---
paths:
  - "components/**/*.tsx"
  - "components/**/*.jsx"
  - "app/**/page.tsx"
  - "app/**/layout.tsx"
---

# React Component Rules

## Blocking
- Use `ResponsiveModal` only -- never raw `<Dialog` from Radix
- Use Lucide icons only -- never heroicons or fontawesome
- 44px minimum touch targets: `min-h-[44px] min-w-[44px]` on buttons/links

## Styling
- Primary: `#001B51`, Accent: `#3C3C3C`
- Viewport: `dvh` not `vh`
- Safe area: `pb-[env(safe-area-inset-bottom)]`
- Include `dark:` variants for all color classes
- Include `active:` states alongside `hover:` states

## Imports
```typescript
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { Check, X, Plus } from 'lucide-react'
import type { Task, Project } from '@/types/db/core'
```

## DB Access
- `'use client'` components: NEVER import Supabase client
- Data fetching: via Server Components or Server Actions only
