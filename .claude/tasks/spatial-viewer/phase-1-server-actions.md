# Phase 1: Server Actions + Types

## Status
- **Phase:** 1 of 6
- **Complexity:** Medium
- **Agent:** agent-backend-engineer
- **Estimated Time:** 2-3 hours
- **Prerequisites:** None (can start immediately)

---

## Scope

Create server actions for spatial marker CRUD operations, task linking, and file uploads. Add TypeScript type definitions for spatial inputs/outputs.

**In Scope:**
- Create `app/actions/spatial.ts` with 3 new server actions
- Enhance existing `getMarkersByProject` with filters
- Add TypeScript interfaces for spatial operations
- Regenerate database types after verification

**Out of Scope:**
- UI components (Phase 2)
- Database migrations (schema already exists)
- Client-side integration (Phase 3)

---

## Tasks

### Task 1.1: Create `createTaskAtLocation` Server Action

**File:** `app/actions/spatial.ts`

**Implementation Requirements:**
- [x] Create server action function with signature:
  ```typescript
  export async function createTaskAtLocation(
    taskData: CreateTaskInput,
    position: Position3D,
    elementId?: string
  ): Promise<{ data?: { task: Task, marker: SpatialMarker }, error?: string }>
  ```
- [x] Verify user role (GC/PM only) via `is_user_gc_admin()` or `role = 'project_manager'`
- [x] Verify project access via company RLS
- [x] INSERT task into `tasks` table → get `task_id`
- [x] INSERT spatial marker into `spatial_markers` with `task_id`, `position`, `element_id`
- [x] Revalidate project page: `revalidatePath(/app/projects/${projectId})`
- [x] Return `{ data: { task, marker } }` on success
- [x] Error handling:
  - Role check failure → `{ error: 'Permission denied' }`
  - Invalid project_id → `{ error: 'Project not found' }`
  - Invalid phase_id → `{ error: 'Phase not found' }`
  - Task creation failure → `{ error: 'Failed to create task' }`

**Implemented:** 2026-01-04

**Input Types:**
```typescript
interface CreateTaskInput {
  project_id: string;
  phase_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  planned_cost?: number;
}

interface Position3D {
  x: number;
  y: number;
  z: number;
  normal?: { x: number; y: number; z: number };
}
```

**Reference:**
- Design: API Specification > createTaskAtLocation (lines 313-358)
- Requirements: REQ-2 (Interactive Task Linking)

---

### Task 1.2: Create `linkTaskToLocation` Server Action

**File:** `app/actions/spatial.ts`

**Implementation Requirements:**
- [x] Create server action function with signature:
  ```typescript
  export async function linkTaskToLocation(
    taskId: string,
    position: Position3D,
    elementId?: string
  ): Promise<{ data?: SpatialMarker, error?: string }>
  ```
- [x] Verify user role (GC/PM only)
- [x] Verify task exists and user has access (via project → company)
- [x] Check if task already has spatial marker (warn if duplicate, but allow)
- [x] INSERT spatial marker with `task_id`, `position`, `element_id`
- [x] Revalidate project page
- [x] Return `{ data: marker }` on success
- [x] Error handling:
  - Task not found → `{ error: 'Task not found' }`
  - Task already linked → `{ error: 'Task already has a spatial marker' }` (non-blocking warning)
  - Permission denied → `{ error: 'Permission denied' }`

**Implemented:** 2026-01-04

**Reference:**
- Design: API Specification > linkTaskToLocation (lines 362-383)
- Requirements: REQ-2 (Interactive Task Linking)

---

### Task 1.3: Create `uploadMarkerAttachment` Server Action

**File:** `app/actions/spatial.ts`

**Implementation Requirements:**
- [x] Create server action function with signature:
  ```typescript
  export async function uploadMarkerAttachment(
    markerId: string,
    file: File,
    contentType: 'photo' | 'file'
  ): Promise<{ data?: MarkerContent, error?: string }>
  ```
- [x] Verify user role (GC/PM only)
- [x] Verify marker exists and user has access
- [x] Validate file size (<10MB) and type (no exe/bat/sh)
- [x] Upload to Supabase Storage: `marker-content/{marker_id}/{file_name}`
- [x] Generate thumbnail if image (JPG, PNG, HEIC, WEBP)
- [x] INSERT into `marker_content` table
- [x] Return `{ data: markerContent }` on success
- [x] Error handling:
  - File too large → `{ error: 'File size must be under 10MB' }`
  - Invalid file type → `{ error: 'File type not supported' }`
  - Upload failure → `{ error: 'Failed to upload file' }`

**Implemented:** 2026-01-04

**File Validation Constants:**
```typescript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/heic', 'image/webp',
  'application/pdf', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

**Reference:**
- Design: API Specification > uploadMarkerAttachment (lines 386-423)
- Requirements: REQ-4 (File and Image Attachment)

---

### Task 1.4: Enhance `getMarkersByProject` with Filters

**File:** `app/actions/spatial.ts`

**Implementation Requirements:**
- [x] Add `filters` parameter to existing function:
  ```typescript
  export async function getMarkersByProject(
    projectId: string,
    filters?: MarkerFilters
  ): Promise<{ data?: SpatialMarker[], error?: string }>
  ```
- [x] Implement filter interface:
  ```typescript
  interface MarkerFilters {
    markerTypes?: ('issue' | 'note' | 'safety' | 'milestone')[];
    statuses?: ('open' | 'in_progress' | 'resolved' | 'closed')[];
    priorities?: ('low' | 'medium' | 'high')[];
    phaseId?: string;
    hasTask?: boolean;
    hasMaterials?: boolean; // Filter markers whose linked tasks have materials
  }
  ```
- [x] Implement query with LEFT JOIN to tasks and material_assignments
- [x] Apply filters dynamically based on provided filter object
- [x] Return markers with:
  - `task_title`, `task_status` (if linked)
  - `material_count` (count of materials linked to task)
  - `content` (JSON array of marker_content records)

**Implemented:** 2026-01-04

**Query Pattern:**
```sql
SELECT sm.*, t.title as task_title, t.status as task_status,
  (SELECT COUNT(*) FROM material_assignments ma WHERE ma.task_id = sm.task_id) as material_count,
  (SELECT json_agg(mc.*) FROM marker_content mc WHERE mc.marker_id = sm.id) as content
FROM spatial_markers sm
LEFT JOIN tasks t ON sm.task_id = t.id
WHERE sm.project_id = $1
  AND (array_length($2, 1) IS NULL OR sm.marker_type = ANY($2))
  AND (array_length($3, 1) IS NULL OR sm.status = ANY($3))
  AND ($4 IS NULL OR sm.phase_id = $4)
  AND ($5 IS NULL OR (sm.task_id IS NOT NULL) = $5)
ORDER BY sm.created_at DESC;
```

**Reference:**
- Design: API Specification > getMarkersByProject (lines 426-461)
- Requirements: REQ-7 (Visual Marker Indicators and Filtering)

---

### Task 1.5: Add TypeScript Type Definitions

**File:** `app/actions/spatial.ts` (top of file)

**Implementation Requirements:**
- [x] Export all input/output interfaces:
  ```typescript
  export interface CreateTaskInput { ... }
  export interface Position3D { ... }
  export interface MarkerFilters { ... }
  export interface MarkerContent { ... }
  ```
- [x] Ensure types match `database.types.ts` enums
- [x] Add JSDoc comments for developer guidance

**Implemented:** 2026-01-04 (imported from @/types/spatial)

**Reference:**
- Design: API Specification (all sections)

---

### Task 1.6: Verify Database Types

**File:** `types/database.types.ts`

**Implementation Requirements:**
- [x] Verify `spatial_markers` table types exist
- [x] Verify `marker_content` table types exist
- [x] Verify enums: `marker_type`, `task_status`, `task_priority`, `marker_status`
- [x] If types missing or outdated → regenerate: `npx supabase gen types typescript --project-id $PROJECT_REF --schema public > types/database.types.ts`

**Verified:** 2026-01-04 (all types present, no regeneration needed)

**Reference:**
- Design: Data Model > Schema (lines 213-304)
- `.claude/docs/law/DB_SCHEMA.md`

---

## Acceptance Criteria

### Functionality
- [x] `createTaskAtLocation` creates task AND spatial marker with 3D position
- [x] `linkTaskToLocation` creates spatial marker linked to existing task
- [x] `uploadMarkerAttachment` uploads file to Supabase Storage and creates marker_content record
- [x] `getMarkersByProject` returns markers with filters applied (markerTypes, statuses, hasMaterials)
- [x] All server actions enforce GC/PM role check (non-GC/PM users get permission error)
- [x] All server actions revalidate project page on success

### Security
- [x] RLS policies enforced (company isolation via project_id)
- [x] Role checks implemented server-side (not just client-side)
- [x] File upload validates size and type server-side
- [x] No direct Supabase client imports in client components

### Code Quality
- [x] All functions have TypeScript signatures with proper return types
- [x] Error handling covers all edge cases
- [x] JSDoc comments explain input/output
- [x] Code follows GenHub server action patterns (from existing `app/actions/tasks.ts`)

**Status:** ✅ COMPLETE (2026-01-04)

---

## Dependencies

**Before This Phase:**
- None (database schema already exists)

**After This Phase:**
- Phase 2: UI Components (needs server action signatures)
- Phase 3: SpatialViewer Integration (calls server actions)

---

## Testing Notes

**Manual Testing:**
- Use API testing tool (Postman, Insomnia) to call server actions directly
- Verify role checks by testing with different user roles
- Verify file upload with various file types and sizes
- Verify filters return correct subset of markers

**Unit Tests (Optional):**
- `tests/actions/spatial.test.ts` (create task, link task, upload file)

---

## Files Modified

| File | Action | Lines |
|------|--------|-------|
| `app/actions/spatial.ts` | Create (if not exists) or Enhance | ~300-400 |
| `types/database.types.ts` | Verify/Regenerate | N/A |

---

## References

- **Requirements:** `.claude/docs/requirements/3d-spatial-viewer-enhancement.md`
- **Design:** `.claude/docs/designs/3d-spatial-viewer-enhancement.md` (API Specification section)
- **Law Docs:** `.claude/docs/law/DB_SCHEMA.md` (spatial_markers, marker_content tables)
- **Existing Patterns:** `app/actions/tasks.ts` (server action structure)

---

## Notes

- **No database migrations needed** – all required tables and columns already exist
- **RLS policies assumed to exist** – if missing, see Phase 1 checklist in design doc (lines 994-1002)
- **Token budget:** Estimate 8-12k tokens for implementation (backend agent typical)
- **MCP Supabase:** Use MCP tools for all database queries (required by CLAUDE.md)

---

## Next Phase

After Phase 1 completion → **Phase 2: UI Components (Context Menu + Modals)**
