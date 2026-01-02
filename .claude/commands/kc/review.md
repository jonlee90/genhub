---
allowed-tools: Bash, Read, Glob, Grep, mcp__supabase__get_advisors
description: "Quick code review of recent changes"
---

# /kc:review - Quick code review

## Purpose
Perform a quick review of recently changed files, checking for common issues.

## Usage
```
/kc:review [file-path]  # Review specific file
/kc:review              # Review recent git changes
```

## Execution

### 1. Identify files to review

If file path provided, review that file.
Otherwise, check recent changes:
```bash
git diff --name-only HEAD~1
```

### 2. Quick checks

For each file:

**TypeScript/React files (.ts, .tsx)**:
- Check for 'use client' directive if needed
- Look for `any` types
- Check for proper error handling
- Verify imports are correct

**Server Actions (app/actions/*.ts)**:
- Verify auth check at start
- Check for Zod validation
- Verify revalidatePath usage

**Database changes**:
```
mcp__supabase__get_advisors type: "security"
```

### 3. Run static analysis
```bash
npm run lint:ts
```

## Output Format

```markdown
# Quick Review: [file(s)]

## Issues Found

| Severity | File | Line | Issue |
|----------|------|------|-------|
| :red_circle: Critical | ... | ... | ... |
| :yellow_circle: Medium | ... | ... | ... |
| :green_circle: Low | ... | ... | ... |

## Recommendations
- [List of fixes needed]

## Verdict
PASS / NEEDS FIXES
```

## Severity Guide

- :red_circle: **Critical**: Security, auth, data exposure
- :large_orange_circle: **High**: Functionality, performance
- :yellow_circle: **Medium**: Best practices, maintainability
- :green_circle: **Low**: Style, minor improvements
