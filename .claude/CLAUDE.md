# CLAUDE.md - GenHub PWA

> Construction PWA for general contractors | Mobile-first | Next.js 16 + React 19 + Supabase

## Build & Test

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run lint:ts      # TypeScript check (tsc --noEmit)
npm test             # Playwright E2E tests
npm run db:gen-types # Regenerate Supabase types after migration
```

## BLOCKING RULES

| Rule | Result |
|------|--------|
| No Supabase in `'use client'` components | **REJECT** |
| Server Actions for all DB access | **REJECT** direct DB in components |
| `ResponsiveModal` only (never raw `<Dialog`) | **REJECT** |
| Lucide icons only (never heroicons/fontawesome) | **REJECT** |
| 44px touch targets (`min-h-[44px] min-w-[44px]`) | **FIX** |
| Load skill before editing (see rules/) | **STOP** |

## SKILL LOADING

| Editing... | Load FIRST |
|------------|------------|
| `*.tsx`, `*.jsx`, `components/**` | `vercel-react-best-practices` |
| `app/actions/**`, `app/api/**` | `postgres-best-practices:postgres-best-practices` |
| `supabase/migrations/**` | `postgres-best-practices:postgres-best-practices` |

Path-specific rules auto-apply from `.claude/rules/` -- see `react-components.md`, `server-actions.md`, `database-migrations.md`, `testing.md`.

## AGENT DISPATCH

| Task | Agent |
|------|-------|
| UI, styling, forms | `frontend-engineer` |
| Server Action, API, DB | `backend-engineer` |
| Review/testing | `code-reviewer` |
| UI + DB feature | `backend-engineer` -> `frontend-engineer` -> `code-reviewer` |

## DESIGN TOKENS

Primary `#001B51` | Accent `#3C3C3C` | Touch 44px min | Viewport `dvh` | Safe area `pb-[env(safe-area-inset-bottom)]` | Lucide icons | `ResponsiveModal`

## OUTPUT FORMAT

```
Status: completed | failed | partial (N/M)
Files: path/file.ts - description
Skills Applied: [rules used]
Mobile Checks: 44px | active states | dark mode | safe areas
Build: pass | fail
Handoff: -> {agent}: {reason}
```

## KNOWLEDGE SYSTEM

| Resource | When |
|----------|------|
| `.claude/docs/architecture-index.md` | File placement, module map |
| `.claude/docs/dependency-graph.md` | Refactors, impact analysis |
| `.claude/docs/context-strategy.md` | Deciding what context to load |
| Serena: `genhub-reuse-registry` | Before creating components |
| Serena: `genhub-duplication-hotspots` | Before creating patterns |

## IMPORTS

```typescript
// Server-side
import { auth } from '@/auth'
import { createClient } from '@/utils/supabase/server'

// Client-side
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { Check, X, Plus } from 'lucide-react'
import type { Task, Project } from '@/types/db/core'
```

## STOP CONDITIONS

Halt and ask: build fails 2x same error | crosses agent boundary | security critical | TSX edit without skill | token budget >70%

## SPEC WORKFLOW

Specs in `.claude/specs/{feature}/` require approval markers before implementation:
- `requirements.APPROVED` -> `design.APPROVED` -> `tasks.APPROVED`
- Create markers: `touch .claude/specs/{feature}/{phase}.APPROVED`

## COMMANDS

| Command | Purpose |
|---------|---------|
| `/kc:spec {feature}` | Create spec: requirements -> design -> tasks |
| `/kc:impl {task-id}` | Execute task from spec |
| `/kc:build` | Verify build passes |
