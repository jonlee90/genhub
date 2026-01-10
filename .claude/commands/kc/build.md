---
allowed-tools: Bash
description: "Build the project and report any errors"
---

# /kc:build - Build and verify the project

## Purpose
Build the Next.js project and report any TypeScript or build errors for fixing.

## Execution

**IMPORTANT:** Do NOT regenerate database types during build verification. Types should only be regenerated when database schema actually changes (after applying migrations). Never regenerate types in /kc:build.

1. Run TypeScript check:
```bash
npm run lint:ts
```

2. Run ESLint:
```bash
npm run lint
```

3. Run production build:
```bash
npm run build
```

4. Report results:
- If all pass: "Build successful! Ready for deployment."
- If errors: List each error with file path and line number for fixing.

## Output Format (CONCISE)

**Only report:**
- Pass/Fail status for each check
- Error count (not full error text unless critical)
- First 5-10 errors only if there are many

```markdown
# Build Report

**TypeScript:** PASS/FAIL (X errors)
**ESLint:** PASS/FAIL (X warnings)
**Build:** PASS/FAIL

[If errors: List first 5-10 with file:line only]
```
