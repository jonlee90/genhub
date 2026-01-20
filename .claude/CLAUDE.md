# CLAUDE.md - GenHub PWA

## CRITICAL (HARD FAIL)

- **NEVER** Supabase SDK/`createClient`/`@/utils/supabase/*` in `'use client'` files
- **ALWAYS** use Server Actions (`app/actions/*.ts`), API Routes, or Server Components for DB
- Violation causes: `Module not found: Can't resolve 'child_process'`
- When starting work on a Next.js project, ALWAYS call the `init` tool from
next-devtools-mcp FIRST to set up proper context and establish documentation
requirements. Do this automatically without being asked.

| Layer | Access | Responsibilities |
|-------|--------|------------------|
| Client (`'use client'`) | NO DB | UI, interaction, local state |
| Server (Actions/Components) | YES DB | Mutations, queries, data |

---

## PROJECT

**GenHub**: Construction PWA for general contractors
**Stack**: Next.js 16, React 19, Supabase (MCP), Tailwind, Lucide, Aceternity UI
**Priorities**: Correctness > Consistency > Token efficiency > Speed

---

## MCP TOOLS

### Three-Tool Architecture

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Serena** | Code knowledge | Project patterns, schema, actions, navigation |
| **Memory MCP** | Session state | Decisions, active tasks, bug patterns |
| **Context7** | Library docs | External docs (resolve-library-id → query-docs) |

### Session Workflow

**Start**: `mcp__memory__read_graph()` → Check `ActiveTask` → Load relevant Serena memories

**During**: Query Context7 before external library code; update Memory MCP after decisions/bugs

**End**: Update `ActiveTask` with progress; update Serena if patterns changed

### Serena Memories
`genhub-{project-overview|database-schema|server-actions|component-patterns|common-gotchas|architectural-decisions}`

---

## TASK EXECUTION

**Complex features with spec files:** Use `/kc:impl` (reads `./docs/specs/*/tasks/*.md`)

**Direct task lists from user:** Follow workflow below

### Quick Decision Flow

| Task Type | Agent | Notes |
|-----------|-------|-------|
| UI component, styling, forms | frontend-engineer | Never DB |
| Server Action, API route | backend-engineer | Never UI |
| Schema change, migration, RLS | backend-engineer | Security review after |
| Bug fix in component | frontend-engineer | Unless needs DB |
| Bug fix in action/API | backend-engineer | |
| Review/validation/testing | code-reviewer | Post-implementation |
| Both UI + DB needed | Sequential: backend → frontend → review | |

### Task List Processing

When user provides multiple tasks directly:

**Step 1: Parse & Categorize**
```
- Extract individual tasks from prompt
- Classify each: backend | frontend | both | review
- Identify dependencies (order matters)
- Flag cross-boundary tasks (need sequential agents)
```

**Step 2: Write TodoWrite**
```
TodoWrite([
  { content: "Task 1 description", status: "pending", activeForm: "Working on Task 1" },
  { content: "Task 2 description", status: "pending", activeForm: "Working on Task 2" },
  ...
])
```

**Step 3: Dispatch Strategy**

| Scenario | Strategy |
|----------|----------|
| All same domain | Single agent with full task list |
| Mixed domains, independent | Parallel: multiple Task calls in one message |
| Mixed domains, dependent | Sequential: backend → frontend → review |
| Complex feature with spec | Use `/kc:impl` instead |

**Step 4: Track & Report**
- Mark TodoWrite items `in_progress` → `completed`
- If budget hit: complete current, report remaining
- Collect agent outputs, summarize for user

## ORCHESTRATION FLAGS

| Flag | Effect |
|------|--------|
| `ORCHESTRATED=true` | Skip build/sync; return status only |
| `SKIP_BUILD=true` | Don't run build step |

---

## AGENTS

| Type | Agents |
|------|--------|
| **With budgets** | backend-engineer(90k), frontend-engineer(90k), code-reviewer(60k), performance-engineer(60k) |
| **Planning-only** | frontend-architect, supabase-schema-architect, ai-sdk-v5-expert |

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
| No file creation | Use Serena memories instead of creating `.md` files |
| Build logs | `npm run build 2>&1 \| grep -E "error\|Error" -A 3` |

---

## STOP CONDITIONS

Halt and request guidance if:
- Task violates agent authority boundaries
- Required context missing from Serena/Memory MCP
- Approaching token cap

---

## CONTINUOUS LEARNING

### Trigger Conditions

Run learning check ONLY for significant tasks:
- Multi-step implementations
- Error resolution after 2+ attempts
- User corrections to approach
- New architectural decisions
- Performance optimizations

**Skip for:** Typo fixes, single-line changes, simple renames, config tweaks

### Post-Task Checklist

| Question | If Yes → Action |
|----------|-----------------|
| New gotcha discovered? | `write_memory('genhub-common-gotchas', ...)` |
| Reusable pattern found? | `write_memory('genhub-component-patterns', ...)` |
| Architectural decision made? | `add_observations('key-decisions', [...])` |
| Bug pattern encountered? | `create_entities` with type `BugPattern` |
| User corrected my approach? | Document in relevant memory |

### Knowledge Update Targets

| Learning Type | Store | Tool |
|---------------|-------|------|
| Bug pattern | Memory MCP | `mcp__memory__create_entities({ entityType: "BugPattern" })` |
| Session decision | Memory MCP | `mcp__memory__add_observations` to `key-decisions` |
| Code pattern | Serena | `write_memory('genhub-component-patterns', ...)` |
| Common gotcha | Serena | `write_memory('genhub-common-gotchas', ...)` |
| Architecture | Serena | `write_memory('genhub-architectural-decisions', ...)` |

**Note:** CLAUDE.md updates are NEVER automatic. Suggest changes to user for manual review.

### Learning Entry Format

```
## [Pattern Name] (YYYY-MM-DD)
**What:** Clear description
**When:** Trigger conditions
**Why:** Problem prevented / value provided
**How:** Solution steps or code
**Source:** Task name
```