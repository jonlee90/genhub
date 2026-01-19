# Component Plan — TaskDetail Decomposition

## Overview

Extract large sections from `TaskDetail.tsx` into smaller components under `components/tasks/detail/` with no behavior changes.

## Tasks

1. Identify large sections (summary header, assignee list, materials, expenses, activity).
2. Extract sections into subcomponents in `components/tasks/detail/`.
3. Replace inline markup with new components.
4. Lint updated files.

## Validation

- `npm run lint -- --file components/tasks/TaskDetail.tsx`
- `npm run lint -- --file components/tasks/detail/*.tsx`
