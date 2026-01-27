# GenHub Project Overview

## What is GenHub?
Construction PWA for general contractors - project management, tasks, materials, expenses, team collaboration.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + RLS)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React only

## Critical Safety Rules
- **NEVER** import Supabase in `'use client'` files
- **ALWAYS** use Server Actions (`app/actions/*.ts`)
- **Modals**: `BaseModal` only - NEVER `Dialog`

## Directory Structure
```
app/actions/     # Server Actions (35+ files)
components/      # UI components (210+)
.claude/agents/  # 8 specialized agents
.claude/skills/  # 27 task-specific skills
```

## Agent Authority
| Agent | Authority | Budget |
|-------|-----------|--------|
| frontend-engineer | UI, styling | 45k |
| backend-engineer | Database, APIs | 35k |
| orchestrator | Coordination | 20k |

## Design System
- Primary: `#001B51` | Accent: `#3C3C3C`
- Success: `#059669` | Error: `#DC2626`

## Knowledge System
| Document | Purpose |
|----------|---------|
| `.claude/docs/architecture-index.md` | File placement, module map |
| `.claude/docs/dependency-graph.md` | Impact analysis, critical paths |
| `.claude/docs/context-strategy.md` | What to load when |
| Serena: `genhub-reuse-registry` | Reusable patterns |
| Serena: `genhub-duplication-hotspots` | Known duplication areas |
