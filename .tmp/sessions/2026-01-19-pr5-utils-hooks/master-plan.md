# Master Plan — PR5 Utility Migration & Hook Extraction

## Overview

Centralize duplicated helpers into shared utilities and extract haptic logic into a dedicated hook. This is a refactor-only change with no behavior changes.

## Architecture

- Add `getInitials` and `stockStatusConfig` to `lib/utils.ts` (or `lib/materials.ts` if already exists).
- Extract haptic logic into `lib/hooks/useHapticFeedback.ts` if not already present; otherwise, migrate callers to the existing hook.
- Update all callers to import from shared utilities/hooks.

## Components (Dependency Order)

1. **Utility Consolidation**
   - Scope: Add `getInitials` and `stockStatusConfig` to shared utils.
   - Dependencies: `lib/utils.ts` (or `lib/materials.ts`).
   - Risks: Behavior differences if signatures vary.

2. **Hook Extraction**
   - Scope: Ensure `useHapticFeedback` is available and migrate call sites.
   - Dependencies: `lib/hooks/useHapticFeedback.ts`.
   - Risks: SSR guard and platform checks must be preserved.

3. **Caller Migration**
   - Scope: Update all components to use shared helpers/hook.
   - Dependencies: Utilities + hook.
   - Risks: Missing imports or mismatched signatures.

## Validation

- `npm run lint -- --file lib/utils.ts`
- `npm run lint -- --file lib/hooks/useHapticFeedback.ts`
- Targeted lint for updated component files
- Manual spot check of avatar initials and haptic behavior.

## Rollout / Handoff

- If regressions occur, revert individual files to local helper implementations.
