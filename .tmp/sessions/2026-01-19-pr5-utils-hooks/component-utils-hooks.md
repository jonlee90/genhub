# Component Plan — Utilities & Haptic Hook

## Overview

Centralize `getInitials` and `stockStatusConfig` helpers, and ensure all haptic interactions use the shared hook.

## Tasks

1. Add canonical `getInitials` to `lib/utils.ts` and replace all local implementations.
2. Add `stockStatusConfig` to `lib/utils.ts` or `lib/materials.ts` and update materials components.
3. Migrate mobile components to `useHapticFeedback` hook (if any remaining).

## Validation

- `npm run lint -- --file lib/utils.ts`
- `npm run lint -- --file lib/hooks/useHapticFeedback.ts`
- Lint on affected components
