# Component Plan — Upload Preview Unification

## Overview

Create a shared `FileUploadPanel` component for upload previews and switch preview images to `next/image`. Add dynamic import for `ClientSpatialViewer`.

## Tasks

1. Extract shared upload preview UI into `components/projects/files/FileUploadPanel.tsx`.
2. Update `PhotoUploader` and `ProjectPhotoUploader` to use the shared panel.
3. Replace preview `<img>` tags with `next/image` and `sizes`.
4. Dynamically import `ClientSpatialViewer` where used.

## Validation

- `npm run lint -- --file components/projects/spatial/PhotoUploader.tsx`
- `npm run lint -- --file components/projects/files/ProjectPhotoUploader.tsx`
- `npm run lint -- --file components/projects/files/FileUploadPanel.tsx`
- `npm run lint -- --file components/projects/spatial/ClientSpatialViewer.tsx`
