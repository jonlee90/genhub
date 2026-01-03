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
❌ **NO MCP Supabase** (backend-engineer uses psql directly)

## Agent Quick Reference

| Agent | For | Tools |
|-------|-----|-------|
| frontend-engineer | UI | frontend-design plugin |
| backend-engineer | Database/Server | psql, Server Actions |
| code-reviewer | Review/debug | Read, Grep, Bash |
| kiro-design | Design docs | Conditional law doc access |

**Workflow**: frontend/backend → code-reviewer → /kc:build

## Skills

- `/kc:build` - Verify build
- `/kc:db-check` - Database security
- `/kc:review` - Quick review

## Session Context

Check `.claude/tasks/context_session_x.md` before/after work

---

**Law Docs** (agents read when needed, not always):
- `docs/law/SYSTEM.md` - Architecture
- `docs/law/DB_SCHEMA.md` - Database
- `docs/law/UI_RULES.md` - Design system

## Token Optimization (MANDATORY)

**CRITICAL:** Follow `.claude/rules/token_optimization.md` for ALL operations.

**Quick Rules:**
1. Use Grep instead of Read for searches (90% savings)
2. Use `head_limit` in Grep (90% savings)
3. Use offset/limit in Read for large files (90% savings)
4. Filter build output with grep/tail (90% savings)
5. Concise documentation - bullet points only (70% savings)
