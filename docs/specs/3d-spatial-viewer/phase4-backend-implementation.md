# Phase 4: GenHub Integration - Backend Implementation

## Overview
This document describes the backend implementation for Phase 4 of the 3D Spatial Viewer, which integrates spatial markers with existing GenHub features (phases, tasks, materials).

## Implementation Status

### ✅ Completed
- Migration files created
- Server actions extended
- Type safety maintained
- RLS policies follow existing patterns

### ⏳ Pending
- Database migrations need to be applied
- TypeScript types need to be regenerated

---

## Database Migrations

### Migration Files Created

1. **`20260102120000_add_spatial_marker_to_tasks.sql`**
   - Adds `spatial_marker_id` column to `tasks` table
   - Creates index for performance
   - Allows NULL (optional linking)

2. **`20260102120001_add_spatial_marker_to_materials.sql`**
   - Adds `spatial_marker_id` column to `material_assignments` table
   - Creates index for performance
   - Allows NULL (optional linking)

### How to Apply Migrations

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/fozwbpqgkcduwxqvmkjd/editor
2. Open SQL Editor
3. Copy and paste each migration file content
4. Execute each migration

**Option 2: Using psql (if available)**
```bash
export DATABASE_URL="postgresql://postgres:nFwEEIhrfh8eP3I9@db.fozwbpqgkcduwxqvmkjd.supabase.co:5432/postgres"
psql $DATABASE_URL -f supabase/migrations/20260102120000_add_spatial_marker_to_tasks.sql
psql $DATABASE_URL -f supabase/migrations/20260102120001_add_spatial_marker_to_materials.sql
```

**Option 3: Using Node.js script**
```bash
node scripts/apply-migrations.js
```

---

## Server Actions Implemented

### P4.1 - Phase Integration (`app/actions/spatial.ts`)

#### `getMarkersByPhase(projectId: string, phaseId: string)`
- Filters markers by project phase
- Returns all markers associated with a specific phase
- Maintains company-scoped access control

**Usage:**
```typescript
const { success, data: markers } = await getMarkersByPhase(projectId, phaseId);
```

---

### P4.2 - Task Integration (`app/actions/tasks.ts`)

#### `linkTaskToMarker(taskId: string, markerId: string)`
- Links a task to a spatial marker for location context
- Validates both task and marker belong to the same project
- Logs activity in task_activity table
- Revalidates all relevant paths

**Usage:**
```typescript
const { success, task } = await linkTaskToMarker(taskId, markerId);
```

#### `getTasksByMarker(markerId: string)`
- Returns all tasks linked to a specific spatial marker
- Includes assignee and phase information
- Respects RLS policies

**Usage:**
```typescript
const { success, tasks } = await getTasksByMarker(markerId);
```

#### `logTaskCompletionToMarker(taskId: string)`
- Automatically called when task status changes to 'completed'
- Creates activity content on linked marker
- Activity type: 'task_completed'
- Stores task metadata in activity_data

**Auto-triggered by `updateTaskStatus()` when:**
```typescript
status === 'completed' && existingTask.status !== 'completed'
```

---

### P4.3 - Photo Integration (`app/actions/spatial.ts`)

#### `findNearestMarker(projectId: string, latitude: number, longitude: number, radiusMeters?: number)`
- Finds nearest marker based on GPS coordinates from photo EXIF
- Uses Haversine formula for distance calculation
- Default search radius: 50 meters
- Returns marker with distance property

**Usage:**
```typescript
const { success, data: marker } = await findNearestMarker(
  projectId,
  photoLatitude,
  photoLongitude,
  100 // optional radius in meters
);

if (marker) {
  console.log(`Found marker ${marker.id} at ${marker.distance.toFixed(2)}m`);
}
```

**Algorithm:**
- Fetches all markers with photo content containing GPS data
- Calculates distance using Haversine formula
- Filters by radius and returns nearest match
- Returns null if no markers found within radius

---

### P4.5 - Materials Integration (`app/actions/materials.ts`)

#### `linkMaterialToMarker(assignmentId: string, markerId: string)`
- Links a material assignment to a spatial marker
- Validates both assignment and marker belong to the same project
- Updates material_assignments.spatial_marker_id

**Usage:**
```typescript
const { success, data } = await linkMaterialToMarker(assignmentId, markerId);
```

#### `getMaterialsByMarker(markerId: string)`
- Returns all material assignments linked to a marker
- Includes material details and associated task
- Respects company-scoped RLS

**Usage:**
```typescript
const { success, data: materials } = await getMaterialsByMarker(markerId);
```

---

## RLS Policies

All new columns inherit existing RLS policies from their parent tables:

### tasks.spatial_marker_id
- **SELECT**: Company members can view
- **INSERT**: Managers can insert
- **UPDATE**: Assignees and managers can update
- **DELETE**: Managers can delete

### material_assignments.spatial_marker_id
- **SELECT**: Company members can view
- **INSERT**: Members can insert
- **UPDATE**: Submitter/GC/PM can update
- **DELETE**: Submitter/GC Admin can delete

No new RLS policies required - existing policies cover the new columns.

---

## Integration Points

### Task Status Change Hook
When a task status changes to 'completed', the system automatically:
1. Checks if task has a linked spatial marker
2. Creates marker_content with type='activity'
3. Stores task completion metadata

**Activity Data Structure:**
```typescript
{
  task_id: string;
  task_title: string;
  completed_by: string; // user UUID
  completed_at: string; // ISO timestamp
}
```

### Photo Upload Flow (Future)
When a photo is uploaded with GPS metadata:
1. Extract GPS coordinates from EXIF
2. Call `findNearestMarker()` with coordinates
3. If marker found within radius, auto-link photo to marker
4. If no marker found, optionally create new marker at GPS location

---

## Type Regeneration

After applying migrations, regenerate TypeScript types:

```bash
npx supabase gen types typescript \
  --project-id fozwbpqgkcduwxqvmkjd \
  --schema public \
  > types/database.types.ts
```

This will update the following types:
- `Database['public']['Tables']['tasks']['Row']`
- `Database['public']['Tables']['material_assignments']['Row']`

---

## Testing Checklist

After applying migrations and regenerating types:

- [ ] Verify migrations applied successfully
- [ ] Check RLS policies are enforced
- [ ] Test `getMarkersByPhase()` returns correct markers
- [ ] Test `linkTaskToMarker()` creates link successfully
- [ ] Test `getTasksByMarker()` returns linked tasks
- [ ] Test task completion creates marker activity
- [ ] Test `findNearestMarker()` with GPS coordinates
- [ ] Test `linkMaterialToMarker()` creates link
- [ ] Test `getMaterialsByMarker()` returns materials
- [ ] Verify all revalidatePath calls work correctly
- [ ] Test build with `npm run build`

---

## API Response Format

All server actions follow the standard GenHub pattern:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string }

// Optional message
{ success: true, data: T, message?: string }
```

---

## Performance Considerations

### Indexes Created
- `idx_tasks_spatial_marker` on tasks(spatial_marker_id)
- `idx_material_assignments_spatial_marker` on material_assignments(spatial_marker_id)

### Optimizations
- All queries use explicit company_id filters
- RLS policies use `SELECT` wrapper for auth functions
- Indexes on foreign key columns for fast joins

### GPS Distance Calculation
- Current implementation fetches all markers and calculates in-memory
- For production with large datasets, consider:
  - Adding GPS columns to spatial_markers table
  - Using PostGIS extension for spatial queries
  - Implementing server-side distance calculation

---

## Next Steps

1. **Apply Migrations** (see "How to Apply Migrations" above)
2. **Regenerate Types** (see "Type Regeneration" above)
3. **Run Tests** (see "Testing Checklist" above)
4. **Frontend Integration** - Connect UI components to new server actions
5. **Documentation** - Update user-facing docs with new features

---

## Files Modified

### Server Actions
- `app/actions/spatial.ts` (P4.1, P4.3)
- `app/actions/tasks.ts` (P4.2)
- `app/actions/materials.ts` (P4.5)

### Migrations
- `supabase/migrations/20260102120000_add_spatial_marker_to_tasks.sql`
- `supabase/migrations/20260102120001_add_spatial_marker_to_materials.sql`

### Documentation
- `docs/specs/3d-spatial-viewer/phase4-backend-implementation.md` (this file)

---

## Questions & Support

For questions or issues with this implementation:
1. Check DB_SCHEMA.md for database structure
2. Review existing server action patterns in app/actions/
3. Verify RLS policies in Supabase dashboard
4. Check browser console and server logs for errors
