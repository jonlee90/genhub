# Multi-AI Coordination Strategy

Claude Code + GPT-5.2-Codex coordination for GenHub development.

---

## Overview

| Tool | Strengths | Use For |
|------|-----------|---------|
| **Claude Code** | MCP database access, Serena code analysis, security | Backend, migrations, Server Actions, reviews |
| **GPT Codex** | Long-horizon sessions (7+ hrs), context compaction | UI components, large refactors, test suites |

**Decision Rule**: Database/security → Claude Code. UI-heavy/long-running → GPT Codex.

---

## Task Division Matrix

| Task Type | Primary Tool | Reason |
|-----------|--------------|--------|
| Database migrations | Claude Code | MCP `apply_migration` |
| Server Actions | Claude Code | Serena + existing patterns |
| RLS policies | Claude Code | MCP `get_advisors` security audit |
| Code review | Claude Code | code-reviewer agent |
| UI components (3+) | GPT Codex | Long-horizon, visual work |
| Large refactors | GPT Codex | Context compaction |
| Test suite creation | GPT Codex | Long autonomous sessions |
| Full page UI | GPT Codex | Multi-file coordination |

---

## Codex Profiles

Located in `~/.codex/config.toml`:

| Profile | Reasoning | Context | Use Case |
|---------|-----------|---------|----------|
| `genhub-ui` | Low | 100k | Quick UI tweaks |
| `genhub-refactor` | High | 500k | Large code reorganization |
| `genhub-feature` | High | 1M | Full feature development |
| `genhub-testing` | Medium | 200k | Test suite creation |

Usage: `codex --profile genhub-feature`

---

## Coordination Workflows

### Backend + Frontend Feature

```
1. Claude Code: Create migrations, Server Actions, types
2. Claude Code: Create handoff → .claude/handoffs/claude-to-codex-{ts}.md
3. GPT Codex: Load genhub-feature profile, read handoff
4. GPT Codex: Implement UI, wire Server Actions
5. Claude Code: Review with code-reviewer, run /kc:build
```

### Frontend-Only Feature

```
1. GPT Codex: Implement UI components
2. GPT Codex: Create task doc → .claude/codex-tasks/{feature}.md
3. Claude Code: Code review if needed
```

### Large Refactor

```
1. Claude Code: Plan refactor, identify breaking changes
2. Claude Code: Create handoff with scope
3. GPT Codex: Execute refactor with genhub-refactor profile
4. Claude Code: Review, run build, validate
```

---

## Handoff Protocol

### Directories

- `.claude/handoffs/` - Cross-tool context transfer
- `.claude/codex-tasks/` - GPT Codex task tracking

### File Naming

- Claude → Codex: `claude-to-codex-{YYYYMMDD-HHMM}.md`
- Codex → Claude: `codex-to-claude-{YYYYMMDD-HHMM}.md`

### Handoff Content

**Claude → Codex**:
- Server Actions created (signatures, return types)
- Types available
- UI requirements
- Reference components

**Codex → Claude**:
- Components built
- Server Actions needed
- Type requirements
- Blockers

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Codex doing database work | Build failure (`child_process`) | Always defer to Claude |
| Claude doing large UI refactors | Token limits | Handoff to Codex |
| Parallel modifications | Conflicts | Sequential when same module |
| Missing handoffs | Lost context | Always document interfaces |
| Codex using Supabase | Hard fail | Use Server Actions only |

---

## Quick Reference

### Starting a Feature

1. Decide: Backend-first or Frontend-first?
2. Backend-first: Claude Code creates Server Actions → Handoff → Codex UI
3. Frontend-first: Codex builds UI shell → Handoff → Claude Code backend

### When to Switch Tools

**Switch to Claude Code when**:
- Need database migration
- Need new Server Action
- Security concern
- Performance needs query optimization

**Switch to GPT Codex when**:
- Building 3+ UI components
- Refactoring across many files
- Creating test suite
- Long autonomous session needed

---

## Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `AGENTS.md` | Project root | GPT Codex instructions |
| `config.toml` | `~/.codex/` | Codex profiles |
| `CLAUDE.md` | `.claude/` | Claude Code instructions |
| Handoffs | `.claude/handoffs/` | Context transfer |
| Tasks | `.claude/codex-tasks/` | Codex tracking |
