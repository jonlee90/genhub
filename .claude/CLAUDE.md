# CLAUDE.md - GenHub PWA

## CRITICAL (HARD FAIL)

- **NEVER** Supabase SDK/`createClient`/`@/utils/supabase/*` in `'use client'` files
- **ALWAYS** use Server Actions (`app/actions/*.ts`), API Routes, or Server Components for DB
- Violation causes: `Module not found: Can't resolve 'child_process'`

| Layer | Access | Responsibilities |
|-------|--------|------------------|
| Client (`'use client'`) | NO DB | UI, interaction, local state |
| Server (Actions/Components) | YES DB | Mutations, queries, data |

---

## PROJECT

**GenHub**: Construction PWA for general contractors
**Stack**: Next.js 15, React 19, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities**: Correctness > Token efficiency > Consistency > Speed

---

## BEFORE WORK

1. Load skills: `.claude/skills/index.md`
2. Load Serena memories: `genhub-{project-overview|database-schema|server-actions|component-patterns|common-gotchas}`
3. **For coding tasks**: `task-orchestrator` skill auto-triggers for delegation decisions
4. **For React/Next.js tasks**: Run `/vercel-react-best-practices` before writing code

---

## TASK EXECUTION

**The `task-orchestrator` skill auto-triggers for coding tasks requiring delegation.**

| Task Complexity | Action |
|-----------------|--------|
| Single domain (backend OR frontend only) | Delegate directly to appropriate agent |
| Multi-domain (backend + frontend) | Sequential orchestration (backend → frontend → review) |
| Multiple independent tasks | Parallel dispatch (multiple Task calls in one message) |

Decision flow:
1. Analyze task scope and domains
2. Check `task-orchestrator` skill for delegation guidance
3. Follow Quick Decision Flow for agent selection

---

## AGENTS (strict boundaries)

**With budgets**: backend-engineer(70k), frontend-engineer(80k), code-reviewer(30k), performance-engineer(50k)

**Planning-only**: frontend-architect, supabase-schema-architect, ai-sdk-v5-expert, technical-documentation-writer

**Skills for orchestration**: `task-orchestrator` (auto-triggers for delegation decisions)

**Audit agents**: `.claude/agents/audit/` (7 specialists)

---

## DOCS & COMMANDS

- **Indexes**: `.claude/docs/indexes/` (tables, actions, components, enums, routes)
- **Core/Backend/Frontend/Domain**: `.claude/docs/{core|backend|frontend|domain}/`
- **Commands**: `.claude/skills/index.md` for all `/kc:*` commands

---

## TOKEN DISCIPLINE

| Rule | Implementation |
|------|----------------|
| Search first | Grep/Glob before reading full files |
| Targeted reads | `offset`+`limit` for files >200 lines |
| Skip verification | Don't re-read after Edit with unique `old_string` |
| Batch edits | Combine adjacent changes into single Edit call |
| Serena for code | `find_symbol` + `replace_symbol_body` over full reads |
| Parallel calls | Group independent reads/searches in one message |
| No random files | NEVER create `.md` files — edit existing or use Serena memories |
| Build logs | `npm run build 2>&1 \| grep -E "error\|Error" -A 3` |

---

## ORCHESTRATION FLAGS

| Flag | Effect |
|------|--------|
| `ORCHESTRATED=true` | Skip build/sync; return status only |
| `SKIP_BUILD=true` | Don't run `/kc:build` |
| `SKIP_SYNC=true` | Don't run `/kc:sync-docs` |

---

## STOP CONDITIONS

Halt and request guidance if:
- Task requires Supabase in client component
- Task violates agent authority boundaries
- Required context file missing
- Approaching token cap

---

## POST-TASK CONTEXT/TOKEN REPORTING

**RULE: After completing any non-trivial task, generate a context/token report in `.claude/reports/token/{task-name}-{date}.md`**

### Report Requirements

Each report must include:

1. **Overview**
   - Task name & description
   - Completion status
   - Build/test results

2. **Files Referenced**
   - Files read (count, total lines)
   - Files created (count, total lines)
   - Files modified (count, changes)
   - Files deleted (count, total lines)

3. **Agents & Skills Used**
   - Agent name | Purpose | Est. tokens
   - Skill name | Purpose | Est. tokens

4. **Token Usage Summary**
   - Category breakdown table
   - Subtotals by activity
   - Grand total

5. **Optimizations Applied**
   - What token-saving techniques were used
   - Checklist format (✅/❌)

6. **Token Efficiency Metrics**
   - Files read/created/modified/deleted counts
   - Build errors/warnings
   - Token efficiency ratio (tokens per line)

7. **Recommendations**
   - 3-5 specific suggestions for improving token efficiency
   - Actionable, context-specific

### Report Location
- Path: `.claude/reports/token/{task-name}-{date}.md`
- Example: `.claude/reports/token/slide-menu-redesign-2026-01-19.md`
- Format: Markdown (for easy reading in Git/IDE)
