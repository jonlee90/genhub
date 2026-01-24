# Component Plan — Page Layout (projects/[id]/page.tsx)

## Overview

Add dark mode adjustments for the blueprint grid background opacity and back button hover state on the project detail page. No logic or data changes.

## Interface

- None (styling-only changes to existing markup).

## Tasks

1. Update blueprint grid container to include dark mode opacity variant if needed.
2. Update back button hover background to include dark mode variant.
3. Validate lint for the file and manually verify dark mode visuals.

## Tests / Validation

- `npm run lint -- --file app/app/projects/[id]/page.tsx`
- Manual: Toggle dark mode and confirm blueprint grid visibility and hover state contrast.

## Risks / Notes

- Blueprint grid opacity may need fine-tuning in dark mode for subtle visibility.
