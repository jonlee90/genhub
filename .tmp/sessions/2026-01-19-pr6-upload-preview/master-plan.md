# Master Plan — PR6 Upload + Preview Unification

## Overview

Unify duplicate upload preview UI and introduce dynamic imports for heavy spatial components. This is a refactor + perf change with no user-facing behavior changes.

## Architecture

- Extract shared preview block into `FileUploadPanel` component.
- Replace duplicate `<img>` previews with `next/image` and consistent sizing.
- Use `next/dynamic` for heavy spatial components (`ClientSpatialViewer`).

## Components (Dependency Order)

1. **FileUploadPanel Extraction**
   - Scope: Create shared upload preview panel used by both photo/document uploaders.
   - Dependencies: `components/projects/spatial/PhotoUploader.tsx`, `components/projects/files/ProjectPhotoUploader.tsx`.
   - Risks: Layout differences in upload card spacing.

2. **Image Optimization**
   - Scope: Replace preview `<img>` blocks with `next/image` and add `sizes`.
   - Dependencies: Same as above.
   - Risks: Missing width/height or layout shifts.

3. **Dynamic Import for Spatial Viewer**
   - Scope: `ClientSpatialViewer` loaded via `next/dynamic`.
   - Dependencies: `components/projects/spatial/ClientSpatialViewer.tsx`.
   - Risks: SSR mismatch if component renders on server.

## Validation

- `npm run lint -- --file components/projects/spatial/PhotoUploader.tsx`
- `npm run lint -- --file components/projects/files/ProjectPhotoUploader.tsx`
- `npm run lint -- --file components/projects/spatial/ClientSpatialViewer.tsx`
- Manual spot check for upload preview UI and spatial view load.

## Rollout / Handoff

- If UI parity issues, revert to previous preview markup in the affected uploader.
