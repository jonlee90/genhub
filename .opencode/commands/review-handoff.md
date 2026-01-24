---
name: review-handoff
description: Review code from Claude handoff and perform reusability/refactoring analysis
---

# Review Claude Handoff

Read the latest handoff from Claude and perform a complete review cycle:

1. **Read Handoff**
   - Check `.claude/handoffs/` for latest `claude-to-opencode-*.md`
   - Understand what task was completed
   - Note which files were modified

2. **Validate Changes**
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build 2>&1 | grep -E "error|Error" -A 3
   ```

3. **Reusability Scan**
   - Check if any code duplicates existing components
   - Identify patterns that should be extracted
   - Compare against component inventory

4. **Refactoring Assessment**
   - Check for HTML structure issues (div soup)
   - Check for Tailwind class redundancy
   - Check for opportunities to simplify

5. **Debug & Fix**
   - Address any issues found
   - Ensure everything works 100%

6. **Write Response**
   - Create handoff response in `.claude/handoffs/opencode-to-claude-{timestamp}.md`
   - Document changes made
   - List any new reusable components created

## Usage

```
/review-handoff
```

Or with specific handoff:

```
/review-handoff claude-to-opencode-20260124-1530.md
```
