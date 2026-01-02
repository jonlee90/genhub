---
allowed-tools: Bash
description: "Build the project and report any errors"
---

# /kc:build - Build and verify the project

## Purpose
Build the Next.js project and report any TypeScript or build errors for fixing.

## Execution

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

## Output Format

```markdown
# Build Report

## TypeScript Check
- Status: PASS/FAIL
- Errors: [list if any]

## ESLint
- Status: PASS/FAIL
- Warnings: [count]
- Errors: [list if any]

## Production Build
- Status: PASS/FAIL
- Build time: [time]
- Errors: [list if any]

## Next Steps
[Recommendations based on results]
```
