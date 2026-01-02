# Phase 3 Marker System - Quick Reference

> **Copy-paste ready integration guide for Phase 3 marker content system**

---

## Installation

```bash
npm install --save sharp exifr marked dompurify fuse.js @vercel/blob
```

---

## Import Statements

```tsx
// Photo management
import { PhotoGallery } from '@/components/projects/spatial/PhotoGallery'

// File management
import { FileList } from '@/components/projects/spatial/FileList'

// Notes & comments
import { NotesList } from '@/components/projects/spatial/NotesList'

// Marker placement
import { MarkerPlacement } from '@/components/projects/spatial/MarkerPlacement'

// Marker panel
import { MarkerPanel } from '@/components/projects/spatial/MarkerPanel'

// Content drawer
import { ContentDrawer } from '@/components/projects/spatial/ContentDrawer'

// Mutation hooks
import { useMarkerMutations } from '@/hooks/use-marker-mutations'
```

---

## Basic Usage

### Photo Gallery

```tsx
<PhotoGallery
  markerId={marker.id}
  photos={markerContent.filter(c => c.type === 'photo')}
/>
```

### File List

```tsx
<FileList
  markerId={marker.id}
  files={markerContent.filter(c => c.type === 'file')}
/>
```

### Notes List

```tsx
<NotesList
  markerId={marker.id}
  notes={markerContent.filter(c => c.type === 'note')}
  currentUserId={user.id}
/>
```

---

## Complete Integration Example

```tsx
'use client'

import { useState } from 'react'
import { ContentDrawer } from '@/components/projects/spatial/ContentDrawer'
import { PhotoGallery } from '@/components/projects/spatial/PhotoGallery'
import { FileList } from '@/components/projects/spatial/FileList'
import { NotesList } from '@/components/projects/spatial/NotesList'
import { ActivityTimeline } from '@/components/projects/spatial/ActivityTimeline'
import type { SpatialMarker, MarkerContent } from '@/types/spatial'

interface MarkerViewerProps {
  marker: SpatialMarker
  content: MarkerContent[]
  userId: string
}

export function MarkerViewer({ marker, content, userId }: MarkerViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Filter content by type
  const photos = content.filter(c => c.type === 'photo')
  const files = content.filter(c => c.type === 'file')
  const notes = content.filter(c => c.type === 'note')

  return (
    <>
      {/* Marker click handler */}
      <button onClick={() => setIsOpen(true)}>
        View Marker Details
      </button>

      {/* Content drawer */}
      <ContentDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        marker={marker}
        content={content}
        onEdit={() => {/* Handle edit */}}
        onDelete={() => {/* Handle delete */}}
        tabContent={{
          photos: <PhotoGallery markerId={marker.id} photos={photos} />,
          files: <FileList markerId={marker.id} files={files} />,
          notes: <NotesList markerId={marker.id} notes={notes} currentUserId={userId} />,
          activity: <ActivityTimeline content={content} />,
        }}
      />
    </>
  )
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Vercel Blob (required for photo/file uploads)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Vercel Blob public URL (optional, auto-detected)
NEXT_PUBLIC_BLOB_URL=https://your-project.public.blob.vercel-storage.com
```

---

## API Routes

### Photo Upload

**Endpoint**: `POST /api/spatial/upload-photo`

**Request** (multipart/form-data):
```typescript
{
  file: File,
  markerId: string
}
```

**Response**:
```typescript
{
  success: true,
  content: MarkerContent
}
```

### File Upload

**Endpoint**: `POST /api/spatial/upload-file`

**Request** (multipart/form-data):
```typescript
{
  file: File,
  markerId: string
}
```

**Response**:
```typescript
{
  success: true,
  content: MarkerContent
}
```

---

## Server Actions

```tsx
import {
  createMarker,
  updateMarker,
  deleteMarker,
  attachContentToMarker,
  updateMarkerContent,
  deleteMarkerContent,
} from '@/app/actions/spatial'

// Create marker
const result = await createMarker({
  project_id: projectId,
  type: 'issue',
  title: 'Title',
  description: 'Description',
  position_x: 0,
  position_y: 0,
  position_z: 0,
  floor_name: 'Floor 1',
})

// Attach content
const content = await attachContentToMarker({
  marker_id: markerId,
  type: 'note',
  content: 'Note content',
  metadata: { mentions: ['user-123'] },
})

// Update content
const updated = await updateMarkerContent(contentId, {
  content: 'Updated content',
})

// Delete content
const deleted = await deleteMarkerContent(contentId)
```

---

## Mutation Hooks

```tsx
import { useMarkerMutations } from '@/hooks/use-marker-mutations'

function MyComponent() {
  const { createNote, updateContent, deleteContent } = useMarkerMutations()

  const handleCreateNote = async () => {
    await createNote({
      marker_id: markerId,
      type: 'note',
      content: 'Note content',
      metadata: { mentions: [] },
    })
    // Toast notification shown automatically
    // Page refreshed automatically
  }

  const handleUpdateContent = async () => {
    await updateContent(contentId, {
      content: 'Updated content',
    })
  }

  const handleDeleteContent = async () => {
    await deleteContent(contentId)
  }

  return (/* ... */)
}
```

---

## Styling Examples

### Button Styles

```tsx
// Primary button
<button className="bg-[#001B51] hover:bg-[#002B71] text-white font-bold uppercase px-4 py-2 rounded-lg">
  ACTION
</button>

// Secondary button
<button className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg">
  Cancel
</button>

// Danger button
<button className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg">
  DELETE
</button>
```

### Card Styles

```tsx
<div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-shadow">
  {/* Content */}
</div>
```

### Section Header

```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="p-2 bg-[#001B51] rounded-lg">
    <Icon className="w-5 h-5 text-white" />
  </div>
  <div>
    <h2 className="text-lg font-bold uppercase tracking-tight">Section Title</h2>
    <p className="text-sm text-gray-600">Description</p>
  </div>
</div>
```

---

## File Type Icons

```tsx
import {
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  FileCode,
  Archive,
  File,
} from 'lucide-react'

// Get icon by MIME type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.includes('pdf')) return FileText
  if (mimeType.includes('spreadsheet')) return FileSpreadsheet
  if (mimeType.includes('dwg') || mimeType.includes('dxf')) return FileCode
  if (mimeType.includes('zip')) return Archive
  return File
}
```

---

## Responsive Breakpoints

```tsx
// Mobile: < 480px (default)
// Mobile portrait: ≥ 480px (sm:)
// Tablet: ≥ 768px (md:)
// Desktop: ≥ 1024px (lg:)

<div className="
  p-4              // Mobile
  sm:p-6           // Mobile portrait
  md:p-8           // Tablet+
  lg:p-12          // Desktop+
">
  <div className="
    grid
    grid-cols-1      // Mobile
    sm:grid-cols-2   // Mobile portrait
    md:grid-cols-3   // Tablet+
  ">
    {/* Content */}
  </div>
</div>
```

---

## Toast Notifications

```tsx
import { toast } from 'sonner'

// Success
toast.success('Success!', {
  description: 'Operation completed successfully',
})

// Error
toast.error('Error!', {
  description: 'Something went wrong',
})

// Info
toast('Info', {
  description: 'This is an info message',
})
```

---

## Type Definitions

```typescript
import type {
  SpatialMarker,
  SpatialMarkerInsert,
  SpatialMarkerUpdate,
  MarkerContent,
  MarkerContentInsert,
  MarkerContentUpdate,
} from '@/types/spatial'

// Marker type
type MarkerType = 'issue' | 'rfi' | 'progress' | 'safety' | 'quality' | 'coordination' | 'other'

// Content type
type ContentType = 'photo' | 'file' | 'note'

// Marker status
type MarkerStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
```

---

## Troubleshooting

### Photos not uploading?
1. Check `BLOB_READ_WRITE_TOKEN` in `.env.local`
2. Verify file size < 10MB
3. Verify file type is JPEG/PNG/WebP
4. Check browser console for errors

### Files not uploading?
1. Check `BLOB_READ_WRITE_TOKEN` in `.env.local`
2. Verify file size < 50MB
3. Verify file type is supported
4. Check browser console for errors

### Notes not saving?
1. Check user authentication
2. Verify `createNote` server action is imported
3. Check browser console for errors
4. Verify database connection

### TypeScript errors?
1. Run `npm run lint:ts` to see all errors
2. Verify `types/spatial.ts` is up to date
3. Verify imports are correct
4. Check for missing type definitions

---

## Performance Tips

1. **Lazy load images**: Use `loading="lazy"` on `<img>` tags
2. **Virtualize long lists**: Use `@tanstack/react-virtual` for 100+ items
3. **Debounce search**: Wait 300ms before searching
4. **Optimize images**: Serve WebP, use responsive images
5. **Cache API calls**: Use SWR or React Query for better caching

---

## Common Patterns

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
    <Icon className="w-8 h-8 text-blue-500" />
  </div>
  <h3 className="font-bold text-[#001B51] mb-2 uppercase tracking-tight">
    NO ITEMS YET
  </h3>
  <p className="text-sm text-gray-600 mb-4">
    Get started by adding your first item.
  </p>
  <button className="bg-[#001B51] text-white font-bold px-4 py-2 rounded-lg">
    ADD ITEM
  </button>
</div>
```

### Loading State

```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="w-8 h-8 text-[#001B51] animate-spin" />
</div>
```

### Error State

```tsx
<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
  <p className="text-sm text-red-600">{error}</p>
</div>
```

---

## Resources

- [Full Documentation](./.claude/docs/implementation/PHASE3-FINAL-SUMMARY.md)
- [Phase 3 Plan](./.claude/docs/implementation/phase3-marker-system.md)
- [UI Rules](./../../law/UI_RULES.md)
- [Database Schema](./../../law/DB_SCHEMA.md)

---

**Last Updated**: 2026-01-02
**Status**: Production Ready ✅
