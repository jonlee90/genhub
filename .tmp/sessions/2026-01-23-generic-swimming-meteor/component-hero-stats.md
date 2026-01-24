# Component Plan — Hero + Stats Styling (ProjectDetailContent.tsx)

## Overview

Update hero card and quick stats section styling to provide complete dark mode variants and remove any hardcoded colors. No logic changes.

## Interface

- None (styling-only changes to existing markup).

## Tasks

1. Ensure hero header gradient has dark variants.
2. Replace any hardcoded colors with construction variables.
3. Add dark variants for description border/text and location text.
4. Add dark variants for grid separators and progress/health tracks.
5. Add dark variants for stat labels and values.

## Tests / Validation

- `npm run lint -- --file components/projects/ProjectDetailContent.tsx` (or project lint fallback)
- Manual: Toggle dark mode and verify contrast across hero + stats.

## Risks / Notes

- Ensure construction accent/blue remains consistent against dark backgrounds.
