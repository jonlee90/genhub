# Component Plan — Tab Navigation Styling (ProjectDetailContent.tsx)

## Overview

Add dark mode variants to tab navigation borders, inactive states, and hover/active backgrounds. Keep tab behavior unchanged.

## Interface

- None (styling-only changes to existing markup).

## Tasks

1. Add dark variant to the bottom accent line.
2. Update inactive tab backgrounds/text/hover/active classes with dark variants.
3. Verify active/inactive contrast in dark mode.

## Tests / Validation

- `npm run lint -- --file components/projects/ProjectDetailContent.tsx` (or project lint fallback)
- Manual: Toggle dark mode and confirm tab states and hover visibility.

## Risks / Notes

- Active tab shadow/contrast should remain clear in dark mode.
