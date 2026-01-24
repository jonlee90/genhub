# Master Plan — Projects Detail Dark Mode

## Overview

Update the project detail page styles to fully support dark mode, aligning with existing GenHub color patterns and removing hardcoded colors. Behavior remains unchanged; only visual styling is adjusted.

## Architecture

- Update Tailwind class variants in the page layout and project detail content components.
- Use existing construction CSS variables and dark mode gray palette for gradients, borders, text, and interactive states.
- Keep server/client boundaries intact with no logic changes.

## Components (Dependency Order)

1. **Page Layout (projects/[id]/page.tsx)**
   - Scope: Adjust blueprint grid opacity and back button hover to include dark mode variants.
   - Interfaces: None (styling-only changes).
   - Dependencies: Tailwind classes, existing CSS variables.
   - Risks: Blueprint grid visibility in dark mode.
   - Status: Complete (already compliant).

2. **Hero + Stats Styling (ProjectDetailContent.tsx)**
   - Scope: Update hero gradient, divider/text colors, description border/text, location text, grid separators, progress/health tracks, stat values/labels for dark mode.
   - Interfaces: Existing component props and data flow unchanged.
   - Dependencies: Tailwind classes, construction CSS variables.
   - Risks: Contrast consistency across light/dark themes.
   - Status: Complete (already compliant).

3. **Tab Navigation Styling (ProjectDetailContent.tsx)**
   - Scope: Add dark variants for tab borders, inactive states, hover/active backgrounds, and text.
   - Interfaces: Existing tab state logic unchanged.
   - Dependencies: Tailwind classes in tab button markup.
   - Risks: Active/inactive state clarity in dark mode.
   - Status: Complete (already compliant).

## Validation

- `npm run lint -- --file app/app/projects/[id]/page.tsx`
- `npm run lint -- --file components/projects/ProjectDetailContent.tsx`
- Manual: Toggle dark mode and verify contrast on project detail page.

## Rollout / Handoff

- No migrations required.
- Confirm with design expectations if blueprint grid opacity needs adjustment.
