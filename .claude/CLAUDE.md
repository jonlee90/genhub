# GenHub PWA - Project Instructions

## Core Documentation Reference (MANDATORY)

**Before starting ANY work, agents MUST reference these authoritative documentation files:**

| Document | Location | Purpose |
|----------|----------|---------|
| **SYSTEM.md** | [.claude/docs/law/SYSTEM.md](docs/law/SYSTEM.md) | Architecture rules, tech stack, data flow patterns, security |
| **DB_SCHEMA.md** | [.claude/docs/law/DB_SCHEMA.md](docs/law/DB_SCHEMA.md) | Database tables, RLS policies, relationships, queries |
| **UI_RULES.md** | [.claude/docs/law/UI_RULES.md](docs/law/UI_RULES.md) | Design system, colors, components, responsive patterns |

### When to Reference Each Document:
- **SYSTEM.md** → Architecture decisions, which client to use, error handling, agent workflows
- **DB_SCHEMA.md** → Writing queries, creating tables, understanding relationships, RLS policies
- **UI_RULES.md** → Building components, applying colors, using icons, responsive design

> **These files are THE authoritative source of truth. Always check them before making assumptions.**

---

## Design System
**GenHub PWA - Construction Industry Theme**
- **Primary Color**: #001B51 (Navy Blue - professional, trustworthy)
- **Accent Color**: #3C3C3C (Dark Gray - industrial, professional)
- **Accent Light**: #7A7A7A (Mid Gray - lighter shade for accents)
- **Background**: White, clean modern design
- **Industry**: Construction (hard hats, blueprints, tools, building materials)
- **Icons**: Construction-themed (Lucide icons with construction context)
- **Aesthetic**: Professional, trustworthy, industrial strength

## Critical Integration Requirements

### UI/UX Design
**ALWAYS use the `frontend-design:frontend-design` plugin for any UI work.**
This ensures high-quality, construction-themed, production-grade interfaces.

### Database Operations
**ALWAYS use MCP Supabase for any database work:**
- `mcp__supabase__list_tables` - Check schema
- `mcp__supabase__execute_sql` - Run queries
- `mcp__supabase__apply_migration` - Apply DDL changes
- `mcp__supabase__get_advisors` - Security/performance checks
- `mcp__supabase__get_logs` - Debug issues
- `mcp__supabase__generate_typescript_types` - Update types

### Supabase Client Architecture

> **⚠️ CRITICAL: DO NOT import Supabase clients in client components (`'use client'`)**

| Component Type | Data Fetching | Mutations |
|---------------|---------------|-----------|
| Server Component | `createClient()` from `server.ts` | N/A |
| Client Component | **Props from parent** | **Server Actions** |
| API Route | `createClient()` from `server.ts` | Same |

**Why?** `client.ts` imports `auth` → imports `nodemailer` (server-only) → build errors.

**Correct patterns:**
```tsx
// Server component fetches data, passes to client
const data = await supabase.from('tasks').select('*');
return <ClientComponent tasks={data} />;

// Client component uses server action for mutations
const result = await createTask(formData);
```

## Agent Structure (Optimized)

### Primary Agents (4 Core Agents)

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **frontend-architect** | UI planning & Aceternity research | Before complex UI features. Creates plans, does NOT implement. |
| **frontend-builder** | UI implementation | Implements UI using `frontend-design` plugin. Use after architect creates plan or for simple UI. |
| **backend-engineer** | Supabase + Next.js server | Database, Server Actions, API routes, auth. ALWAYS uses MCP Supabase. |
| **code-reviewer** | Review, debug, test, security | After implementations. Reviews code, fixes issues, runs checks. |

### Agent Workflow

```
Complex UI Feature:
1. frontend-architect → Creates plan in .claude/docs/ui-plans/
2. frontend-builder → Implements using frontend-design plugin
3. code-reviewer → Reviews and fixes issues

Simple UI Change:
1. frontend-builder → Direct implementation with plugin
2. code-reviewer → Quick review

Backend Work:
1. backend-engineer → Implements with MCP Supabase
2. code-reviewer → Security audit
```

### Specialized Agents (Use When Needed)

| Agent | Purpose |
|-------|---------|
| **supabase-nextjs-expert** | Supabase + Next.js integration |
| **vercel-ai-sdk-v5-expert** | AI SDK integration tasks |
| **kiro-requirement** | Requirements analysis |
| **kiro-design** | Feature design documents |
| **kiro-plan** | Implementation task lists |
| **kiro-executor** | Execute from specs |
| **technical-documentation-writer** | User manuals & tutorials |

## Skills (Slash Commands)

| Skill | Purpose |
|-------|---------|
| `/kc:nextjs` | Next.js development, optimization, and PWA |
| `/kc:impl [task]` | Implement task from specs |
| `/kc:build` | Build and verify project |
| `/kc:db-check` | Database health check |
| `/kc:review [file]` | Quick code review |
| `/kc:bug-fix` | Debug and fix bugs |
| `/kc:update-doc` | Update documentation |

## Session Context

### Rules
- Before starting work, check `.claude/tasks/context_session_x.md` for context
- If session file doesn't exist, create one
- After finishing work, update the session file with what was done
- Sub-agents continuously add context to the session file

### Session File Structure
```markdown
# Session X Context

## Current Task
[What we're working on]

## Completed
- [List of completed items]

## In Progress
- [Current work]

## Next Steps
- [Planned work]

## Key Decisions
- [Important decisions made]
```

## Documentation Structure

```
.claude/
├── agents/           # Agent definitions
├── commands/kc/      # Skills (slash commands)
├── docs/
│   ├── law/         # AUTHORITATIVE DOCS (SYSTEM.md, DB_SCHEMA.md, UI_RULES.md)
│   ├── specs/       # Feature specifications
│   └── ui-plans/    # UI implementation plans
├── rules/           # Project rules
├── system/          # System documentation
└── tasks/           # Session context files
```

## Project Rules

Reference these files for specific guidelines:
- [add_new_files_project_structure_rules.md](rules/add_new_files_project_structure_rules.md) - Project structure
- [create_supabase_table.md](rules/create_supabase_table.md) - Database table creation
- [frontend_mdc.md](rules/frontend_mdc.md) - Frontend component rules
- [git.md](rules/git.md) - Git conventional commits
- [project_requirements.md](rules/project_requirements.md) - Feature requirements
- [supabase_use.md](rules/supabase_use.md) - Supabase client usage

## Quick Reference

### Creating UI Components
```
1. Use frontend-design:frontend-design skill
2. Apply construction theme colors
3. Use Lucide icons with construction context
4. Add debug console.log statements
5. Run code-reviewer when done
```

### Database Changes
```
1. mcp__supabase__list_tables (check current state)
2. mcp__supabase__apply_migration (apply changes)
3. mcp__supabase__get_advisors type:"security" (verify)
4. mcp__supabase__generate_typescript_types (update types)
5. Save migration locally to supabase/migrations/
```

### Before Deployment
```
1. /kc:build (verify build passes)
2. /kc:db-check (verify database security)
3. code-reviewer (final review)
```
