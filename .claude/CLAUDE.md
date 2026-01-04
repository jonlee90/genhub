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
| agent-agent-frontend-engineer | UI components, styling, client state | frontend-design plugin |
| agent-agent-backend-engineer | Database, APIs, auth, server logic | MCP Supabase |
| agent-agent-code-reviewer | Validation, testing, fixes | Read, Grep, Bash |

**Boundaries are strict.** If task crosses agent authority, handoff explicitly.

### Workflow
```
Complex: Plan -> Implement -> Review -> Build
Simple: Implement -> Quick Review
Backend: MCP Supabase + Server Actions -> Security Audit
```

Canonical: `/kc:impl -> agent execution -> agent-code-reviewer -> /kc:build`

## TOKEN DISCIPLINE

### Read Strategy
1. Grep/search first, then Read with offset+limit
2. Batch multiple small reads in one tool call
3. Full file reads only for: <200 lines, configs, migrations
4. Build logs: `npm run build 2>&1 | grep -E "error|Error" -A 3`

### Budgets (hard caps)
- agent-backend-engineer: 25k max (typical: 3-20k)
- agent-frontend-engineer: 35k max (typical: 5-25k)
- agent-code-reviewer: 15k max (typical: 2-12k)

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

## 11. AGENT ACTION LOGGING & AUDIT REPORTING (MANDATORY)

All agents MUST log their actions during task execution and produce an **Audit Report** at the end of each task.

This system exists to:
- Improve agent prompts over time
- Identify token waste and unnecessary reads
- Detect authority or rule violations
- Surface unclear rules and missing documentation
- Make agents progressively better with real evidence

---

### ACTION LOGGING (INTERNAL, LIGHTWEIGHT)

During execution, agents MUST internally track the following.
❌ Do NOT stream logs during execution  
✅ Logs are summarized ONLY in the final Audit Report

Agents MUST track:
- Agent name
- Task type (UI / Backend / Review)
- Task complexity (Simple / Complex)
- Files read (path + reason)
- Files modified (path + reason)
- Tools used (Grep, Read, MCP Supabase, frontend-design, etc.)
- Planning decision (Plan-first vs Direct-implement)
- Handoffs to other agents (if any)
- Blockers, ambiguities, or missing context

---

### AUDIT REPORT (REQUIRED FINAL OUTPUT)

At the end of EVERY task, agents MUST append an **Audit Report** after their normal output.

#### REQUIRED FORMAT (DO NOT MODIFY)

```md
## 🧾 Agent Audit Report

**Agent:** frontend-engineer | backend-engineer | code-reviewer  
**Task Type:** UI / Backend / Review  
**Task Complexity:** Simple / Complex  

### Actions Taken
- Planned before implementation: Yes / No
- Tools used:
  - Grep
  - Read
  - MCP Supabase
  - frontend-design
- Files read:
  - path/to/file.ts – reason
- Files modified:
  - path/to/file.ts – reason

### Decisions & Reasoning
- Key architectural or implementation decisions
- Tradeoffs considered
- CLAUDE.md rules relied upon

### Issues Encountered
- Ambiguous requirements
- Missing or outdated documentation
- Conflicting rules or constraints

### Token & Efficiency Notes
- Estimated token usage
- Any unnecessary reads or rework
- Suggestions to reduce token usage next time

### Improvement Suggestions
- Prompt improvements recommended
- Rules that should be clarified or added
- Docs that should be updated

---
END
