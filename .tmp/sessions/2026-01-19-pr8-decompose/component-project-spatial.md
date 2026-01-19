# Component Plan — Project Form + Spatial Viewer Decomposition

## Overview

Extract large sections from `CreateProjectForm.tsx` and `SpatialViewer.tsx` into smaller subcomponents without behavior changes.

## Tasks

1. Identify major sections in `CreateProjectForm.tsx` (header, sections, footer).
2. Extract sections to `components/projects/create/` subcomponents.
3. Identify major sections in `SpatialViewer.tsx` and extract to `components/projects/spatial/` subcomponents.
4. Replace inline markup with new components.
5. Lint updated files.

## Validation

- `npm run lint -- --file components/projects/CreateProjectForm.tsx`
- `npm run lint -- --file components/projects/spatial/SpatialViewer.tsx`
- `npm run lint -- --file components/projects/create/*.tsx`
