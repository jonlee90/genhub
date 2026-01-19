# Codex Tasks Directory

Task tracking for GPT Codex work on GenHub.

## Purpose

Track GPT Codex tasks for:
- Progress visibility
- Handoff coordination
- Audit trail

## File Format

`{feature-name}-{YYYYMMDD}.md`

## Template

```markdown
# Task: {Feature Name}
**Started**: {ISO timestamp}
**Status**: in-progress | blocked | complete
**Profile**: genhub-ui | genhub-feature | genhub-refactor | genhub-testing

## Objective
{What needs to be done}

## Progress
- [ ] Step 1
- [ ] Step 2

## Files Modified
- path/to/file.tsx

## Notes
{Any relevant context}
```
