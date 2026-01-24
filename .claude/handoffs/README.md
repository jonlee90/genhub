# Handoffs Directory

Cross-tool context transfer documents for Claude Code ↔ OpenCode GPT-5.2-Codex coordination.

## Workflow Overview

```
┌─────────────────┐     ┌─────────────────────────────────────┐
│  Claude Code    │────>│  OpenCode GPT-5.2-Codex             │
│  (Implementation)│     │  (Review + Refactor + Debug)        │
└─────────────────┘     └─────────────────────────────────────┘
         │                              │
         │ claude-to-opencode-*.md      │ opencode-to-claude-*.md
         └──────────────────────────────┘
```

## Naming Convention

| Direction | Format |
|-----------|--------|
| Claude → OpenCode | `claude-to-opencode-{YYYYMMDD-HHMM}.md` |
| OpenCode → Claude | `opencode-to-claude-{YYYYMMDD-HHMM}.md` |

---

## Claude → OpenCode Handoff Template

```markdown
# Claude → OpenCode Handoff

**Timestamp:** {YYYYMMDD-HHMM}
**Task:** {Task name/description}
**Status:** COMPLETE | PARTIAL

## Summary
{What was implemented}

## Files Modified
- `path/to/file1.tsx` - {brief description}
- `path/to/file2.ts` - {brief description}

## Implementation Details
{Key decisions made, patterns used}

## Known Issues
{Any issues or concerns}

## Expected Behavior
{How to verify the implementation works}

## Review Requests
- [ ] Check reusability opportunities
- [ ] Verify no code duplication
- [ ] Optimize Tailwind classes if needed
- [ ] Ensure 100% working

## Context Files (Optional)
{List any related files OpenCode should read for context}
```

---

## OpenCode → Claude Response Template

```markdown
# OpenCode → Claude Handoff

**Timestamp:** {YYYYMMDD-HHMM}
**Original Task:** {Task name from Claude}
**Review Status:** APPROVED | NEEDS_WORK | BLOCKED

## Validation Results
- TypeScript: PASS | FAIL
- ESLint: PASS | FAIL
- Build: PASS | FAIL

## Review Summary
{Brief overview of findings}

## Changes Made

### Refactoring Applied
- `file.tsx:line` - {what was changed}

### Reusability Actions
- Created: {new components/utilities if any}
- Used existing: {components that were substituted}
- Extracted: {patterns moved to shared locations}

### Bug Fixes
- {any bugs found and fixed}

## Remaining Issues
{If status is NEEDS_WORK or BLOCKED, list what needs attention}

## Component Inventory Updates
{If new reusable components were created}

## Metrics
| Metric | Before | After |
|--------|--------|-------|
| Lines of code | X | Y |
| Components | X | Y |
```

---

## Workflow Steps

### 1. Claude Completes Task
- Implements the feature/fix
- Runs initial validation (tsc, lint)
- Creates handoff document

### 2. OpenCode Receives Handoff
- Reads handoff document
- Loads project context from `.opencode/rules/genhub-patterns.md`
- Understands what was implemented

### 3. OpenCode Reviews
- Runs full validation (tsc, lint, build)
- Scans for reusability opportunities
- Checks for code duplication
- Analyzes HTML structure and Tailwind classes

### 4. OpenCode Refactors (if needed)
- Extracts reusable components
- Optimizes Tailwind classes
- Simplifies HTML structure
- Fixes any bugs found

### 5. OpenCode Debugs
- Verifies everything works 100%
- Checks for runtime errors
- Tests affected functionality

### 6. OpenCode Responds
- Creates response handoff document
- Documents all changes made
- Reports final status

---

## Quick Commands

### For Claude
After completing a task:
```
Create handoff in .claude/handoffs/claude-to-opencode-{timestamp}.md
```

### For OpenCode
```bash
# Review latest handoff
opencode run --agent reviewer --prompt "/review-handoff"

# Or with specific file
opencode run --agent reviewer --prompt "/review-handoff claude-to-opencode-20260124-1530.md"
```

---

## Audit Trail

All handoff documents are kept for:
- Decision traceability
- Pattern learning
- Debugging history
- Team coordination
