---
name: handoff-to-opencode
description: Create a handoff document for OpenCode GPT-5.2-Codex after completing a task
args:
  - name: task_name
    description: Name of the completed task
    required: true
  - name: files
    description: Comma-separated list of modified files
    required: true
---

# Create OpenCode Handoff

After completing a task, use this command to create a handoff document for OpenCode GPT-5.2-Codex.

## What This Does

1. Creates a timestamped handoff file in `.claude/handoffs/`
2. Includes task summary and modified files
3. Lists review requests for OpenCode
4. Provides context for reusability analysis

## Usage

```
/handoff-to-opencode "Add project status filter" "components/projects/ProjectFilter.tsx,app/actions/projects.ts"
```

## Template Used

```markdown
# Claude → OpenCode Handoff

**Timestamp:** {auto-generated}
**Task:** {task_name}
**Status:** COMPLETE

## Summary
{Describe what was implemented}

## Files Modified
{List from files argument}

## Implementation Details
{Key decisions made}

## Review Requests
- [ ] Check reusability opportunities
- [ ] Verify no code duplication
- [ ] Optimize Tailwind classes if needed
- [ ] Ensure 100% working
```

## After Creating Handoff

Run OpenCode:
```bash
opencode run --agent reviewer --prompt "/review-handoff"
```
