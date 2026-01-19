# Component Plan — Cleanup Pass

## Overview

Delete unused modal components and duplicates after PR2, keeping imports clean and references updated.

## Tasks

1. Identify unused modal files and duplicates.
2. Remove unused files and update references.
3. Run lint on affected files.

## Validation

- `npm run lint -- --file <affected files>`
- `rg "BaseModal|BottomSheetModal" components/`
