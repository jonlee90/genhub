# CLAUDE.md - GenHub PWA Global Rules

> GLOBAL, NON-NEGOTIABLE rules. Follow BEFORE agent-specific prompts.

## CRITICAL SAFETY RULES (HARD FAIL)

### 1. Supabase Client Isolation
```
NEVER in 'use client' files:
  - import from '@/utils/supabase/*'
  - import { createClient } from '@supabase/supabase-js'
  - any direct Supabase SDK usage

ALWAYS use:
  - Server Actions (app/actions/*.ts)
  - API Routes (app/api/*)
  - Server Components for data fetching
```

Violation causes build failure: `Module not found: Can't resolve 'child_process'`

### 2. Architecture Separation
- Client components (`'use client'`): UI rendering, user interaction, local state
- Server Actions/Routes: ALL database queries, auth checks, mutations
- No file may mix both responsibilities

## PROJECT CONTEXT

**GenHub**: Construction PWA for general contractors.

**Stack**: Next.js 14+, Supabase (via MCP), Tailwind CSS, Lucide icons, Aceternity UI

**Priorities** (ordered):
1. Correctness & safety
2. Token efficiency
3. Architectural consistency
4. Visual consistency
5. Delivery speed

## DESIGN SYSTEM

### Colors
- Primary: `#001B51` (Navy)
- Accent: `#3C3C3C` (Gray)

### UI Requirements
- Icons: Lucide only
- Modals: `BaseModal` component only (not `Dialog`)
- Style: Clean, professional, minimal decoration

### Forbidden
- Riveted borders, hazard stripes, decorative frames
- Custom fonts (use system/Tailwind defaults)
- Gratuitous animations

## AGENT MODEL

| Agent | Authority | Tools |
|-------|-----------|-------|
| frontend-engineer | UI components, styling, client state | frontend-design plugin |
| backend-engineer | Database, APIs, auth, server logic | MCP Supabase |
| code-reviewer | Validation, testing, fixes | Read, Grep, Bash |

**Boundaries are strict.** If task crosses agent authority, handoff explicitly.

### Workflow
```
Complex: Plan -> Implement -> Review -> Build
Simple: Implement -> Quick Review
Backend: MCP Supabase + Server Actions -> Security Audit
```

Canonical: `/kc:impl -> agent execution -> code-reviewer -> /kc:build`

## TOKEN DISCIPLINE

### Read Strategy
1. Grep/search first, then Read with offset+limit
2. Batch multiple small reads in one tool call
3. Full file reads only for: <200 lines, configs, migrations
4. Build logs: `npm run build 2>&1 | grep -E "error|Error" -A 3`

### Budgets (hard caps)
- backend-engineer: 25k max (typical: 3-20k)
- frontend-engineer: 35k max (typical: 5-25k)
- code-reviewer: 15k max (typical: 2-12k)

Stop early and request continuation if approaching cap.

## CONTEXT MANAGEMENT

Before work: Read `.claude/tasks/context_session_x.md`
After work: Update with changes, files touched, next steps

### Law Docs (read only when relevant)
| Doc | When |
|-----|------|
| `.claude/docs/law/SYSTEM.md` | Architecture changes |
| `.claude/docs/law/DB_SCHEMA.md` | Database work |
| `.claude/docs/law/UI_RULES.md` | UI consistency |
| `.claude/docs/law/SPATIAL_VIEWER.md` | 3D/spatial views |

## STOP CONDITIONS

Halt and request guidance if:
- Task requires Supabase in client component
- Task violates agent authority boundaries
- Design rules conflict
- Required context file missing
- Approaching token cap

---
END
