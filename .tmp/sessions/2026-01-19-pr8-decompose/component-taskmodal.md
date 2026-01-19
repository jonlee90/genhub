# Component Plan — TaskModal Decomposition

## Overview

Extract large tab panels/sections from `TaskModal.tsx` into smaller components under `components/tasks/task-modal/` while preserving behavior.

## Tasks

1. Identify major sections in `TaskModal.tsx` (tabs, sidebar, header, footer).
2. Extract each into a new component file with explicit props.
3. Replace inline markup with new components.
4. Lint updated files.

## Validation

- `npm run lint -- --file components/tasks/TaskModal.tsx`
- `npm run lint -- --file components/tasks/task-modal/*.tsx`
