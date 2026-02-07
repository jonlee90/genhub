---
paths:
  - "tests/**/*.spec.ts"
  - "tests/**/*.test.ts"
  - "playwright.config.ts"
---

# Testing Rules

## Runner
- Playwright for E2E: `npm test`
- Headed mode: `npm run test:headed`
- Debug: `npm run test:debug`

## Patterns
- Test files go in `tests/` directory
- Use `.spec.ts` extension
- Tests need a running dev server
- Keep tests focused on user-visible behavior
