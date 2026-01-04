# GenHub PWA - Critical Rules

> **Minimal essential rules that apply to ALL agents. Agents have their own embedded references.**

## Construction Theme (ALWAYS)

- **Primary**: #001B51 (Navy Blue)
- **Accent**: #3C3C3C (Dark Gray)
- **Icons**: Lucide (construction context)
- **Modals**: BaseModal (not Dialog)

## Critical Don'ts

❌ **NEVER import Supabase in client components** (`'use client'`)
❌ **NO riveted borders, hazard stripes, custom fonts**
✅ **USE MCP Supabase** (backend-engineer uses MCP Supabase for all database operations)

## Agent Structure (Optimized)

### Primary Agents (3 Core Agents)

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **frontend-engineer** | Full frontend lifecycle | All UI work - research, planning, and implementation. Uses `frontend-design` plugin. Plans first for complex features, implements directly for simple tasks. |
| **backend-engineer** | Supabase + Next.js server | Database, Server Actions, API routes, auth. |
| **code-reviewer** | Review, debug, test, security | After implementations. Reviews code, fixes issues, runs checks. |

### Agent Workflow

```
Complex UI Feature:
1. frontend-engineer → Plans architecture, then implements using frontend-design plugin
2. code-reviewer → Reviews and fixes issues

Simple UI Change:
1. frontend-engineer → Direct implementation with plugin
2. code-reviewer → Quick review

Backend Work:
1. backend-engineer → Implements database API Supabase
2. code-reviewer → Security audit
```

## Agent Quick Reference

| Agent | For | Tools |
|-------|-----|-------|
| frontend-engineer | UI | frontend-design plugin |
| backend-engineer | Database/Server | MCP Supabase, Server Actions |
| code-reviewer | Review/debug | Read, Grep, Bash |

**Workflow**: /kc:impl → frontend/backend → code-reviewer → /kc:build


## Session Context

Check `.claude/tasks/context_session_x.md` before/after work

---

**Law Docs** (agents read when needed, not always):
- `docs/law/SYSTEM.md` - Architecture
- `docs/law/DB_SCHEMA.md` - Database
- `docs/law/UI_RULES.md` - Design system
- `docs/law/SPATIAL_VIEW.md` - components/projects/spatial (Only read this if task involves spatial and need more information)

## Token Discipline (ALL AGENTS)

### Core Principle
**"Grep → Locate → Read with Context"** (never read-everything-first)

### Patterns
1. **Grep before Read**: `Grep → pattern` → `Read (offset=line-5, limit=30)`
2. **Filter build output**: `npm run build 2>&1 | grep -E "error|Error" -A 3`
3. **Parallel tool calls**: Batch independent Reads in single message
4. **Full Read only**: Small files (<200 lines), configs, migrations

### Agent Budgets
| Agent | Simple | Complex | Max |
|-------|--------|---------|-----|
| backend-engineer | 3-8k | 10-20k | 25k |
| frontend-engineer | 5-10k | 12-25k | 35k |
| code-reviewer | 2-4k | 6-12k | 15k |
