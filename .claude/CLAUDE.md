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
