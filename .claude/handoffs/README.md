# Handoffs Directory

Cross-tool context transfer documents for Claude Code ↔ GPT Codex coordination.

## Naming Convention

- Claude → Codex: `claude-to-codex-{YYYYMMDD-HHMM}.md`
- Codex → Claude: `codex-to-claude-{YYYYMMDD-HHMM}.md`

## Template

See `AGENTS.md` for handoff templates.

## Workflow

1. Tool A completes its portion of work
2. Tool A creates handoff document here
3. Tool B reads handoff and continues work
4. Handoff documents are kept for audit trail
