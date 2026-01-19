# Master Plan — PR7 Cleanup & Deletions

## Overview

Remove unused modal components, duplicates, and dead code after PR2 migration. Focus on safe deletions with explicit usage checks.

## Architecture

- Confirm no direct `BaseModal`/`BottomSheetModal` usage remains in app components.
- Remove duplicate modal components or unused example files.
- Keep `ResponsiveModal` as the canonical modal standard (per user direction).

## Components (Dependency Order)

1. **Usage Audit**
   - Scope: Identify unused modal files and duplicates.
   - Dependencies: `rg`/lint checks; verify import usage.
   - Risks: Deleting files still referenced.

2. **Cleanup Pass**
   - Scope: Remove unused modal components, duplicates, and example files.
   - Dependencies: Confirm via search and typecheck.
   - Risks: Broken imports.

3. **Verification**
   - Scope: Lint targeted files.
   - Dependencies: Updated imports.

## Validation

- `npm run lint -- --file <affected files>`
- Optional `rg "BaseModal|BottomSheetModal" components/` to confirm removal.

## Rollout / Handoff

- If any module still references removed files, revert that deletion or keep file.
