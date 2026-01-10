# Set Primary Project Photo - Technical Design

## Overview

This feature adds the ability to set a project photo as the "primary" or "cover" image by updating the existing `image_url` column on the `projects` table. The implementation leverages existing infrastructure with minimal additions: one new Server Action and UI enhancements to PhotoGallerySection and PhotoLightbox components.

## Requirements Reference

See: `.claude/specs/set-primary-project-photo/requirements.md`

---

## Architecture Overview

### Component Diagram

```
ProjectFilesTab (existing)
├── PhotoGallerySection (enhanced)
│   ├── Photo Grid Items
│   │   ├── Star Action Button (new)
│   │   └── "Cover" Badge (new)
│   └── PhotoLightbox (enhanced)
│       ├── "Set as Cover" Button (new)
│       └── "Current Cover" Indicator (new)
│
└── Server Actions
    └── setProjectPrimaryPhoto (new)
        └── Updates projects.image_url
```

### Data Flow

```
User clicks "Set as Cover"
       │
       ▼
PhotoLightbox/PhotoGallerySection
       │
       ▼
setProjectPrimaryPhoto(projectId, photoUrl)
       │
       ▼
Supabase: UPDATE projects SET image_url = ?
       │
       ▼
revalidatePath('/app/projects/[id]')
revalidatePath('/app/projects')
       │
       ▼
UI refreshes with updated primary indicator
ProjectCard shows new image
```

---

## Data Model

### Existing Table: `projects`

The `image_url` column already exists and is nullable:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| image_url | text | NULL | Primary/cover photo URL |

**No migration required.** The existing column perfectly serves this purpose.

### Existing Table: `project_photos`

Used to fetch gallery photos. No changes needed.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Photo ID |
| photo_url | text | Full URL of uploaded photo |
| thumbnail_url | text | Thumbnail URL |
| project_id | uuid | FK to projects |
| ... | ... | Other existing columns |

---

## Server Actions

### `setProjectPrimaryPhoto(projectId: string, photoUrl: string | null): Promise<SetPrimaryPhotoResult>`

**Purpose:** Set or clear the primary photo for a project

**File:** `app/actions/project-photos.ts` (add to existing file)

**Input:**
```typescript
interface SetPrimaryPhotoInput {
  projectId: string;
  photoUrl: string | null;  // null to clear primary photo
}
```

**Output:**
```typescript
interface SetPrimaryPhotoResult {
  data?: { success: true; imageUrl: string | null };
  error?: string;
}
```

**Implementation Logic:**
1. Get user context (auth check)
2. Verify user has access to project (company_id check or project_team membership)
3. If photoUrl is provided, verify it's a valid photo from project_photos table
4. Update `projects.image_url` with the provided URL (or null)
5. Revalidate paths: `/app/projects/${projectId}` and `/app/projects`
6. Return success or error

**Validation:**
- `projectId` must be valid UUID
- `photoUrl` if provided, must be a valid URL from an existing project_photos record
- User must have edit permissions on the project

**Revalidates:**
- `/app/projects/${projectId}` - Project detail page
- `/app/projects` - Project list (so ProjectCard updates)

---

## UI Specification

### Component Hierarchy (Changes Only)

```
PhotoGallerySection (enhanced)
├── Photo Grid
│   └── Photo Item (enhanced)
│       ├── Existing: Selection checkbox
│       ├── Existing: Receipt badge
│       ├── NEW: Cover photo badge (top-right, below receipt badge)
│       └── Hover Actions
│           ├── Existing: Eye (view)
│           ├── NEW: Star (set as cover)
│           └── Existing: Trash (delete)
│
PhotoLightbox (enhanced)
├── Existing: Photo display
├── Existing: EXIF metadata
├── NEW: "Current Cover Photo" indicator (if current)
└── Actions
    ├── NEW: "Set as Cover" button (if not current, source=upload)
    ├── NEW: "Remove as Cover" button (if current)
    ├── Existing: Delete button
    └── Existing: View Source button
```

### Key Component Changes

#### PhotoGallerySection - Photo Grid Item

**New Props (passed through):**
```typescript
interface PhotoGridItemProps {
  photo: UnifiedPhoto;
  isPrimary: boolean;          // NEW: Is this the current cover photo?
  onSetPrimary: (photoUrl: string) => void;  // NEW: Handler for setting primary
  // ... existing props
}
```

**New UI Elements:**

1. **Cover Photo Badge** (top-right, visible when `isPrimary && source === 'upload'`):
```jsx
{isPrimary && photo.source === 'upload' && (
  <div className="absolute top-2 right-2 z-10">
    <div className="px-2 py-1 bg-[#001B51] text-white rounded text-xs font-bold flex items-center gap-1">
      <Star className="h-3 w-3 fill-current" />
      Cover
    </div>
  </div>
)}
```

2. **Star Action Button** (in hover overlay, only for direct uploads):
```jsx
{photo.source === 'upload' && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onSetPrimary(photo.url);
    }}
    className={cn(
      "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
      isPrimary
        ? "bg-[#001B51] text-white cursor-default"
        : "bg-white/20 hover:bg-white/30"
    )}
    disabled={isPrimary}
    aria-label={isPrimary ? "Current cover photo" : "Set as cover photo"}
  >
    <Star className={cn("w-4 h-4", isPrimary ? "fill-current" : "")} />
  </button>
)}
```

#### PhotoLightbox Enhancement

**New Props:**
```typescript
interface PhotoLightboxProps {
  // ... existing props
  isPrimary: boolean;                          // NEW
  onSetPrimary: (photoUrl: string) => void;    // NEW
  onRemovePrimary: () => void;                 // NEW
}
```

**New UI Elements:**

1. **Current Cover Indicator** (in metadata bar):
```jsx
{isPrimary && (
  <div className="flex items-center gap-2 mb-2">
    <div className="px-2 py-1 bg-[#001B51] text-white rounded text-xs font-bold flex items-center gap-1">
      <Star className="h-3 w-3 fill-current" />
      Current Cover Photo
    </div>
  </div>
)}
```

2. **Set as Cover Button** (in actions area, only for direct uploads that are not current):
```jsx
{photo.source === 'upload' && !isPrimary && (
  <Button
    variant="secondary"
    size="sm"
    onClick={() => onSetPrimary(photo.url)}
    disabled={isSettingPrimary}
    className="bg-[#001B51] hover:bg-[#001B51]/90 text-white"
  >
    {isSettingPrimary ? (
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
    ) : (
      <Star className="h-4 w-4 mr-2" />
    )}
    Set as Cover
  </Button>
)}
```

3. **Remove as Cover Button** (only when current):
```jsx
{isPrimary && (
  <Button
    variant="outline"
    size="sm"
    onClick={onRemovePrimary}
    disabled={isRemovingPrimary}
    className="border-white/20 text-white hover:bg-white/10"
  >
    {isRemovingPrimary ? (
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
    ) : (
      <X className="h-4 w-4 mr-2" />
    )}
    Remove as Cover
  </Button>
)}
```

#### PhotoGallerySection Container

**New State & Logic:**
```typescript
// Need project's current image_url to determine primary
interface PhotoGallerySectionProps {
  // ... existing props
  projectImageUrl: string | null;  // NEW: Current project image_url
  onPrimaryPhotoChange: () => void; // NEW: Callback to refresh project data
}

// Check if photo is primary
const isPrimaryPhoto = (photo: UnifiedPhoto) => {
  return projectImageUrl === photo.url;
};

// Handle setting primary
const handleSetPrimary = async (photoUrl: string) => {
  const result = await setProjectPrimaryPhoto(projectId, photoUrl);
  if (result.error) {
    toast.error(`Failed to set cover photo: ${result.error}`);
  } else {
    toast.success('Cover photo updated');
    onPrimaryPhotoChange();
  }
};

// Handle removing primary
const handleRemovePrimary = async () => {
  const result = await setProjectPrimaryPhoto(projectId, null);
  if (result.error) {
    toast.error(`Failed to remove cover photo: ${result.error}`);
  } else {
    toast.success('Cover photo removed');
    onPrimaryPhotoChange();
  }
};
```

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| Not authenticated | 401 | "Please sign in to continue" |
| No project access | 403 | "You don't have permission to edit this project" |
| Photo not found | 404 | "Photo not found or has been deleted" |
| Invalid photo source | 400 | "Only uploaded photos can be set as cover" |
| Database error | 500 | "Failed to update cover photo. Please try again." |
| Network timeout | - | "Connection timeout. Please check your network." |

---

## Security Considerations

1. **RLS Policy**: Project update follows existing RLS on projects table (company_id check)
2. **Photo Validation**: Only URLs from project_photos table are accepted (prevents arbitrary URL injection)
3. **Source Validation**: Only 'upload' source photos can be primary (no receipts)
4. **Auth Check**: Server Action validates user session before any mutation

---

## Mobile Considerations

1. **Touch Targets**: Star button and Cover badge are 44px minimum touch target
2. **Badge Positioning**: Cover badge positioned to not overlap with selection checkbox
3. **Hover States**: On mobile, tap shows actions; second tap performs action
4. **Button Layout**: In lightbox, buttons stack vertically on small screens

---

## Performance Considerations

1. **Single Query**: Setting primary is a single UPDATE query
2. **Revalidation**: Only revalidates necessary paths
3. **Optimistic UI**: Consider adding optimistic update for immediate feedback
4. **No Extra Fetches**: Primary status determined by comparing URLs (already have project.image_url)

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to tasks)

---

**Next Step:** Do you approve this design to proceed to task planning?
