# 3D Spatial Viewer Enhancement - Requirements

## Status
- **Status:** DRAFT
- **Author:** kiro-requirement
- **Date:** 2026-01-04
- **Approved by:** [pending]

---

## Introduction

This specification defines the enhancements to GenHub's 3D Spatial Viewer to enable interactive task linking, material visualization, file/image attachment, and client portal integration. The existing spatial viewer infrastructure (Xeokit SDK, camera controls, LOD management) will be extended to support full CRUD operations on spatial markers, task location linking, and permission-controlled editing.

The system will support **unique 3D building models per project type** (residential, cafe, restaurant, commercial office, industrial), allowing GCs and PMs to spatially organize tasks, materials, and documentation within an accurate 3D representation of their construction projects. Clients will have full visibility into the 3D model and all associated project data.

**Primary Users:**
- **GC (General Contractor):** Creates/manages spatial markers, links tasks to 3D locations, views material placement
- **PM (Project Manager):** Same capabilities as GC
- **Worker:** View-only access to 3D spatial data
- **Client:** Full read-only access to 3D model, tasks, materials, and markers

**Feature Area:** 3D Spatial Viewer (Projects)

---

## Requirements

### REQ-1: Unique 3D Building Models per Project Type

**User Story:** As a GC, I want each project type to load a unique 3D building model that reflects the actual construction layout (residential home, cafe floor plan, restaurant dining area, office cubicles, industrial warehouse), so that my spatial planning is accurate and contextual.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN user creates a new project with type "residential" THEN system SHALL load a residential home 3D model with typical rooms (living, kitchen, bedrooms, bathrooms)
2. WHEN user creates a new project with type "cafe" THEN system SHALL load a cafe 3D model with counter, seating area, kitchen, restrooms
3. WHEN user creates a new project with type "restaurant" THEN system SHALL load a restaurant 3D model with dining area, bar, kitchen, storage
4. WHEN user creates a new project with type "commercial_office" THEN system SHALL load an office 3D model with cubicles, conference rooms, reception
5. WHEN user creates a new project with type "industrial" THEN system SHALL load an industrial 3D model with warehouse bays, loading docks, machinery areas
6. IF project has no uploaded custom 3D model THEN system SHALL use the default model for that project type from `default_3d_models` table
7. WHEN user uploads a custom IFC/OBJ/GLTF model THEN system SHALL replace the default model with the uploaded model
8. WHILE 3D model is loading THEN system SHALL display loading indicator with progress percentage
9. IF 3D model file is corrupted or fails to load THEN system SHALL display error message and fallback to wireframe placeholder

---

### REQ-2: Interactive Task Linking (Create New + Link Existing)

**User Story:** As a GC or PM, I want to click on a 3D location and either create a new task at that location OR link an existing task to that location, so that I can spatially organize my work items and see where tasks are happening on the job site.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN GC/PM clicks on a 3D model surface THEN system SHALL display a context menu with options: "Create New Task Here" and "Link Existing Task"
2. WHEN user selects "Create New Task Here" THEN system SHALL open task creation modal with position pre-filled from clicked location (x,y,z coordinates and element_id)
3. WHEN user submits new task form THEN system SHALL insert task into `tasks` table AND insert spatial marker into `spatial_markers` table with `task_id` link
4. WHEN user selects "Link Existing Task" THEN system SHALL display a searchable list of existing tasks for that project
5. WHEN user selects an existing task from the list THEN system SHALL create a spatial marker linked to that task at the clicked 3D location
6. WHEN spatial marker with linked task is created THEN system SHALL display a visual indicator (colored pin/badge) at that location on the 3D model
7. WHEN user hovers over a task marker on the 3D model THEN system SHALL display tooltip with task title, status, priority, and assignee name
8. WHEN user clicks on a task marker THEN system SHALL display task detail panel with full task information, attachments, and materials
9. IF task already has a spatial marker THEN system SHALL display warning: "This task is already linked to a location. Linking here will create a duplicate marker."
10. IF user is not GC or PM THEN system SHALL NOT display context menu on 3D click (view-only mode)

---

### REQ-3: Material Visibility via Linked Tasks

**User Story:** As a PM, I want to see which materials are associated with tasks at specific 3D locations, so that I can visualize material placement and usage without manually linking materials to the 3D model.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN task with linked materials is spatially marked THEN system SHALL display material count badge on the task marker (e.g., "3 materials")
2. WHEN user clicks on a task marker with materials THEN system SHALL display task detail panel with "Materials" tab showing all linked materials from `material_assignments` table
3. WHEN user views materials tab THEN system SHALL display material name, SKU, quantity, procurement status, and estimated cost
4. WHEN material status changes to "delivered" or "installed" THEN system SHALL update the material badge color on the task marker (e.g., green for delivered)
5. IF task has no materials linked THEN system SHALL NOT display material badge on the marker
6. WHEN user filters 3D view by "tasks with materials" THEN system SHALL hide all task markers that have zero materials linked
7. WHEN user exports spatial data THEN system SHALL include material information for each task location in the export file

---

### REQ-4: File and Image Attachment to Spatial Markers

**User Story:** As a GC or PM, I want to attach photos, PDFs, and files directly to spatial markers (issues, notes, safety markers) AND to tasks at 3D locations, so that all relevant documentation is spatially organized.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN user creates a spatial marker of type "issue", "note", or "safety" THEN system SHALL display file upload area in the marker creation modal
2. WHEN user uploads a file to a spatial marker THEN system SHALL insert record into `marker_content` table with file_url, file_name, file_size, and content_type
3. WHEN user uploads an image (JPG, PNG, HEIC) THEN system SHALL generate a thumbnail and store in `marker_content.thumbnail_url`
4. WHEN user views a spatial marker with attachments THEN system SHALL display all attached files in a list with download/preview options
5. WHEN user clicks on an image attachment THEN system SHALL open image in lightbox/preview modal
6. WHEN user clicks on a PDF/file attachment THEN system SHALL download the file to user's device
7. WHEN user attaches a file to a task linked to a 3D location THEN system SHALL also store the attachment in the `attachments` table with entity_type="task"
8. WHEN user views task detail panel from 3D marker THEN system SHALL display both task attachments AND spatial marker attachments in separate tabs
9. IF file size exceeds 10MB THEN system SHALL reject upload with error message: "File size must be under 10MB"
10. IF file type is not supported (exe, bat, sh) THEN system SHALL reject upload with error message: "File type not supported"
11. WHEN user deletes a file attachment THEN system SHALL remove record from `marker_content` or `attachments` table AND delete file from storage

---

### REQ-5: Permission Controls (GC/PM Only for Edits)

**User Story:** As a system administrator, I want to ensure only GCs and PMs can create, edit, or delete spatial markers and task links, so that spatial data integrity is maintained and workers cannot accidentally modify critical project data.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN user with role "gc_admin" or "project_manager" views 3D model THEN system SHALL enable all interactive editing features (click-to-place, create tasks, link tasks, attach files)
2. WHEN user with role "field_worker", "subcontractor", or "client" views 3D model THEN system SHALL disable all editing features and show view-only mode
3. WHEN non-GC/PM user attempts to click on 3D model THEN system SHALL NOT display context menu (no action)
4. WHEN non-GC/PM user views spatial markers THEN system SHALL display marker information in read-only panels with no edit/delete buttons
5. WHEN GC/PM creates spatial marker THEN system SHALL set `created_by` field to current user UUID
6. WHEN GC/PM edits spatial marker THEN system SHALL verify `get_user_company_id(next_auth.uid()) = marker.project.company_id` via RLS policy
7. IF user attempts to edit spatial marker from different company THEN system SHALL return 403 Forbidden error
8. WHEN GC/PM deletes spatial marker THEN system SHALL soft-delete marker by setting `status = 'closed'` (do NOT hard delete)
9. WHEN user views deleted/closed markers THEN system SHALL display them with reduced opacity and "Closed" label
10. IF RLS policy check fails THEN system SHALL log security event and return generic error message to user

---

### REQ-6: Client Portal Full Visibility

**User Story:** As a Client, I want to view the full 3D model with all tasks, materials, and spatial markers, so that I can track project progress visually and understand what work is happening where.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN client accesses project via client portal THEN system SHALL display 3D spatial viewer with full project model
2. WHEN client views 3D model THEN system SHALL display all spatial markers (tasks, issues, notes, safety, milestones) with read-only access
3. WHEN client clicks on a spatial marker THEN system SHALL display marker detail panel with title, description, status, photos, and files
4. WHEN client views task markers THEN system SHALL display task details including assignee, due date, status, and linked materials
5. WHEN client views material information THEN system SHALL display material name, quantity, status, and cost (if client has budget visibility)
6. IF client does not have budget visibility permission THEN system SHALL hide cost fields for materials and tasks
7. WHEN client uploads browser does not support WebGL THEN system SHALL display fallback message: "3D viewer requires a modern browser with WebGL support"
8. WHEN client views on mobile device THEN system SHALL display mobile-optimized 3D controls (touch gestures for rotate, zoom, pan)
9. WHEN client views 3D model THEN system SHALL NOT display any edit/delete buttons or context menus (enforced by role check)
10. WHEN client switches between projects THEN system SHALL load the correct 3D model for the selected project

---

### REQ-7: Visual Marker Indicators and Filtering

**User Story:** As a GC or PM, I want to see color-coded markers on the 3D model for different types of items (tasks, issues, safety, materials) and filter them by type, status, or priority, so that I can focus on specific areas of concern.

**Priority:** Should Have

#### Acceptance Criteria

1. WHEN spatial marker is created THEN system SHALL assign color based on marker type:
   - Task: Blue (#001B51)
   - Issue: Red (#DC2626)
   - Note: Yellow (#FBBF24)
   - Safety: Orange (#F97316)
   - Milestone: Green (#10B981)
2. WHEN task marker has priority "high" THEN system SHALL display marker with pulsing animation
3. WHEN task marker status is "blocked" THEN system SHALL display marker with red border and blocked icon
4. WHEN user opens filter panel THEN system SHALL display checkboxes for marker types, statuses, and priorities
5. WHEN user unchecks "Issues" filter THEN system SHALL hide all issue markers from 3D view
6. WHEN user filters by status "completed" THEN system SHALL display only markers with completed tasks
7. WHEN user filters by "overdue tasks" THEN system SHALL display only task markers with due_date < today AND status != 'completed'
8. WHEN user clears all filters THEN system SHALL display all markers
9. WHEN user saves a filter preset THEN system SHALL store filter settings in user preferences (browser localStorage)
10. WHEN user loads saved filter preset THEN system SHALL apply filter settings to current 3D view

---

### REQ-8: Spatial Marker CRUD Operations

**User Story:** As a GC or PM, I want to create, edit, move, and delete spatial markers (issues, notes, safety, milestones) directly on the 3D model, so that I can document site conditions and track non-task items.

**Priority:** Must Have

#### Acceptance Criteria

1. WHEN GC/PM right-clicks on 3D surface THEN system SHALL display context menu with marker type options: "Add Issue", "Add Note", "Add Safety Marker", "Add Milestone"
2. WHEN user selects "Add Issue" THEN system SHALL open issue creation modal with position pre-filled and fields: title, description, priority, assigned_to
3. WHEN user submits issue form THEN system SHALL insert into `spatial_markers` table with marker_type='issue' and status='open'
4. WHEN user clicks-and-drags an existing marker THEN system SHALL update marker position in real-time
5. WHEN user releases dragged marker THEN system SHALL update `spatial_markers.position` jsonb field with new x,y,z coordinates
6. WHEN user double-clicks a marker THEN system SHALL open edit modal with current marker data pre-filled
7. WHEN user updates marker fields THEN system SHALL update `spatial_markers` record and display success toast
8. WHEN GC/PM clicks delete button on marker THEN system SHALL prompt confirmation: "Are you sure you want to delete this marker?"
9. WHEN user confirms deletion THEN system SHALL set `status='closed'` and `resolved_at=now()` (soft delete)
10. WHEN user views marker history THEN system SHALL display created_by, created_at, and resolved_at timestamps with user names
11. IF marker has linked content (files, photos) THEN system SHALL display attachment count badge on marker icon

---

### REQ-9: Task Detail Panel Integration

**User Story:** As a PM, I want to click on a task marker and see a comprehensive task detail panel with all task information, materials, expenses, attachments, and chat, so that I have full context without leaving the 3D view.

**Priority:** Should Have

#### Acceptance Criteria

1. WHEN user clicks on a task marker THEN system SHALL open task detail panel as a slide-out drawer on the right side of the screen
2. WHEN task detail panel opens THEN system SHALL display tabs: "Details", "Materials", "Expenses", "Attachments", "Activity"
3. WHEN user views "Details" tab THEN system SHALL display task title, description, status, priority, assignee, due date, dependencies, and completion percentage
4. WHEN user views "Materials" tab THEN system SHALL query `material_assignments` table and display all materials linked to the task
5. WHEN user views "Expenses" tab THEN system SHALL query `expenses` table and display all expenses linked to the task
6. WHEN user views "Attachments" tab THEN system SHALL query `attachments` table and display all files/photos linked to the task
7. WHEN user views "Activity" tab THEN system SHALL query `task_activity` table and display chronological activity log
8. WHEN user edits task fields in detail panel THEN system SHALL call server action to update `tasks` table and revalidate cache
9. WHEN task status changes to "completed" THEN system SHALL update marker color to green and hide from "active tasks" filter
10. WHEN user closes detail panel THEN system SHALL return to 3D view with marker still selected (highlighted)

---

### REQ-10: Mobile and Touch Device Support

**User Story:** As a field worker or PM on-site, I want to view and interact with the 3D spatial viewer on my tablet or phone, so that I can access spatial data while walking the job site.

**Priority:** Should Have

#### Acceptance Criteria

1. WHEN user accesses 3D viewer on touch device THEN system SHALL enable touch gesture controls:
   - Single finger drag: Rotate camera
   - Two finger pinch: Zoom in/out
   - Two finger drag: Pan camera
2. WHEN user taps on a marker THEN system SHALL display marker detail panel
3. WHEN user long-presses on 3D surface (GC/PM only) THEN system SHALL display context menu for creating markers/tasks
4. WHEN viewport width < 768px THEN system SHALL adjust UI layout to mobile-optimized view with bottom sheet for details
5. WHEN user switches device orientation THEN system SHALL re-render 3D canvas to fit new viewport dimensions
6. IF device does not support WebGL THEN system SHALL display fallback message with link to desktop instructions
7. WHEN user zooms in/out on mobile THEN system SHALL adjust marker icon sizes to remain visible (minimum 32px touch target)
8. WHEN user taps on small/overlapping markers THEN system SHALL display marker selection menu if multiple markers within tap area

---

## Non-Functional Requirements

### NFR-1: Performance

- **3D Model Loading:** Initial model load shall complete within 5 seconds for default models (<50MB)
- **Marker Rendering:** System shall render up to 500 spatial markers without noticeable lag (<16ms frame time)
- **Click Response:** Marker selection and context menu display shall respond within 200ms of user click
- **File Upload:** Image/file uploads shall provide real-time progress indicators and complete within 10 seconds for 10MB files
- **Mobile Performance:** 3D viewer shall maintain 30+ FPS on mobile devices when interacting with models

### NFR-2: Security

- **RLS Enforcement:** All spatial marker queries shall enforce Row Level Security (company_id scoping)
- **Permission Checks:** All CREATE/UPDATE/DELETE operations shall verify user role (GC/PM only) via server-side validation
- **File Upload Security:** System shall validate file types and sizes server-side (reject executable files, enforce 10MB limit)
- **Client Portal Isolation:** Client users shall NOT have access to internal-only markers or cost data (if budget visibility disabled)

### NFR-3: Accessibility

- **Keyboard Navigation:** All 3D controls shall be accessible via keyboard shortcuts (arrow keys, +/-, ESC)
- **Screen Reader Support:** Spatial markers shall have ARIA labels describing marker type, title, and status
- **Color Contrast:** Marker colors shall meet WCAG AA contrast ratio requirements against 3D model backgrounds
- **Focus Indicators:** Selected markers shall display visible focus ring for keyboard users

### NFR-4: Data Integrity

- **Soft Deletes:** Deleted markers shall be soft-deleted (status='closed') to preserve audit history
- **Audit Trail:** All marker creation, updates, and deletions shall log `created_by`, `created_at`, `updated_at` fields
- **Referential Integrity:** Task links shall enforce foreign key constraints (`task_id` must exist in `tasks` table)
- **File Cleanup:** Deleted file attachments shall be removed from storage within 24 hours via scheduled job

---

## Database Schema Updates

### New Enum Values

**No new enums required.** Existing enums already support all required values:
- `marker_type`: issue, inspection, note, safety, change_order, milestone ✅
- `task_priority`: low, medium, high ✅
- `task_status`: todo, in_progress, review, blocked, completed ✅

### Table Modifications

**No table modifications required.** Existing schema already supports all features:

#### Existing `default_3d_models` Table
```sql
-- ALREADY EXISTS (from DB_SCHEMA.md)
id uuid PK, project_type enum, name text, description,
model_id text, xkt_file_url text, thumbnail_url text,
is_active bool, metadata jsonb, created_at, updated_at
```
**Usage:** Stores default 3D models for each project type (residential, cafe, restaurant, commercial_office, industrial)

#### Existing `spatial_markers` Table
```sql
-- ALREADY EXISTS (from DB_SCHEMA.md)
id uuid PK, project_id uuid FK, model_id uuid FK,
title, description, marker_type, position jsonb (x,y,z),
normal_vector jsonb, element_id, phase_id uuid FK,
task_id uuid FK, status, priority, assigned_to uuid FK,
created_by uuid FK, resolved_at, created_at, updated_at
```
**Usage:** Stores all spatial markers (tasks, issues, notes, safety, milestones) with 3D position data

#### Existing `marker_content` Table
```sql
-- ALREADY EXISTS (from DB_SCHEMA.md)
id uuid PK, marker_id uuid FK (CASCADE),
content_type ('photo'|'file'|'note'|'voice'),
file_url, thumbnail_url, file_name, file_size_bytes bigint,
notes text, metadata jsonb, created_by uuid FK, created_at
```
**Usage:** Stores file/photo/voice attachments for spatial markers

### Required RLS Policies

**Verify these policies exist** (should already be in place from initial spatial viewer setup):

```sql
-- spatial_markers: Company-scoped SELECT
CREATE POLICY "spatial_markers_select" ON spatial_markers FOR SELECT
USING (project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id(next_auth.uid())));

-- spatial_markers: GC/PM only INSERT
CREATE POLICY "spatial_markers_insert" ON spatial_markers FOR INSERT
WITH CHECK (
  is_user_gc_admin(next_auth.uid()) OR
  EXISTS (SELECT 1 FROM company_users WHERE user_id = next_auth.uid() AND role = 'project_manager')
);

-- spatial_markers: GC/PM only UPDATE
CREATE POLICY "spatial_markers_update" ON spatial_markers FOR UPDATE
USING (
  is_user_gc_admin(next_auth.uid()) OR
  EXISTS (SELECT 1 FROM company_users WHERE user_id = next_auth.uid() AND role = 'project_manager')
);

-- marker_content: Same policies as spatial_markers (inherits via FK)
```

---

## UI Component Integration Requirements

### Components to Integrate

| Component | Location | Purpose | Integration Point |
|-----------|----------|---------|-------------------|
| `SpatialViewer` | `components/projects/SpatialViewer.tsx` | Main 3D viewer canvas | Project detail page (`app/app/projects/[id]/page.tsx`) |
| `MaterialMarkers` | `components/projects/MaterialMarkers.tsx` | Material badge overlays on task markers | Called within `SpatialViewer` when rendering task markers |
| `TaskLinker` | `components/projects/TaskLinker.tsx` | Modal for creating/linking tasks to 3D locations | Triggered by 3D click context menu |
| `PhotoUploader` | `components/ui/PhotoUploader.tsx` | Image upload for spatial markers | Used in marker creation/edit modals |
| `FileUploader` | `components/ui/FileUploader.tsx` | File upload for spatial markers | Used in marker creation/edit modals |
| `TaskDetailPanel` | `components/tasks/TaskDetailPanel.tsx` | Slide-out drawer with full task info | Triggered by clicking task marker on 3D model |

### New Components Required

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `SpatialMarkerContextMenu` | Context menu for 3D click actions | `position: {x,y,z}`, `userRole`, `onCreateTask`, `onLinkTask`, `onCreateMarker` |
| `MarkerCreationModal` | Modal for creating issue/note/safety markers | `markerType`, `position`, `projectId`, `onSubmit` |
| `MarkerFilterPanel` | Filter controls for marker types/statuses | `onFilterChange`, `activeFilters` |
| `SpatialMarkerPin` | Visual marker icon on 3D model | `markerType`, `status`, `priority`, `attachmentCount`, `onClick` |

### Server Actions Required

Create these in `app/actions/spatial.ts`:

```typescript
// Server action signatures (not implementations)
export async function createSpatialMarker(data: CreateMarkerInput): Promise<Result<SpatialMarker>>;
export async function updateSpatialMarker(id: string, data: UpdateMarkerInput): Promise<Result<SpatialMarker>>;
export async function deleteSpatialMarker(id: string): Promise<Result<void>>;
export async function linkTaskToLocation(taskId: string, position: Position3D, elementId?: string): Promise<Result<SpatialMarker>>;
export async function createTaskAtLocation(taskData: CreateTaskInput, position: Position3D): Promise<Result<{ task: Task, marker: SpatialMarker }>>;
export async function getMarkersByProject(projectId: string, filters?: MarkerFilters): Promise<Result<SpatialMarker[]>>;
export async function uploadMarkerAttachment(markerId: string, file: File): Promise<Result<MarkerContent>>;
```

### Integration Workflow

```
1. User loads project detail page
   ↓
2. Page fetches project 3D model (default or custom) from default_3d_models or projects_3d_models
   ↓
3. SpatialViewer component renders Xeokit canvas with loaded model
   ↓
4. SpatialViewer fetches spatial_markers via getMarkersByProject server action
   ↓
5. For each marker, render SpatialMarkerPin at position (x,y,z)
   ↓
6. User clicks on 3D surface (GC/PM only)
   ↓
7. Display SpatialMarkerContextMenu with "Create Task" / "Link Task" options
   ↓
8. User selects action → Open TaskLinker or MarkerCreationModal
   ↓
9. On submit → Call createTaskAtLocation or linkTaskToLocation server action
   ↓
10. Server action creates records in spatial_markers + tasks tables
   ↓
11. Revalidate cache, re-render markers on 3D model
   ↓
12. User clicks marker → Open TaskDetailPanel with full task/material/expense data
```

---

## Constraints

- **3D Model Format Support:** System shall support IFC, OBJ, GLTF formats only (no Revit RVT or proprietary formats)
- **Browser Compatibility:** 3D viewer requires WebGL 2.0 support (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)
- **File Size Limits:** Custom uploaded 3D models must be <200MB, individual file attachments <10MB
- **Concurrent Users:** System shall support up to 10 concurrent users viewing the same 3D model via realtime updates
- **Default Model Requirement:** Each project type MUST have a default 3D model configured in `default_3d_models` table before projects can be created
- **Xeokit SDK Version:** System shall use Xeokit SDK v2.5+ for 3D rendering (already implemented)

---

## Out of Scope (Future Enhancements)

- **AR (Augmented Reality) Viewer:** Mobile AR overlay of 3D model on live camera feed
- **BIM Clash Detection:** Automated detection of spatial conflicts between model elements
- **Multi-Floor Switching:** Automatic floor-by-floor navigation for multi-story buildings
- **Measurement Tools:** Distance, area, and volume measurement tools within 3D viewer
- **Collaborative Editing:** Real-time collaborative marker placement with live cursors
- **Voice Notes:** Audio recording and playback for spatial markers (schema supports, but UI not in scope)
- **AI Object Detection:** Automated detection of construction elements in uploaded photos
- **Change Order Spatial Tracking:** Direct creation of change orders from 3D markers (separate feature)
- **IFC Property Editing:** Direct editing of IFC element properties within 3D viewer

---

## Open Questions

- [ ] **Default Model Sources:** Where will the initial default 3D models for each project type be sourced? (Stock models, client-provided, or procedurally generated?)
- [ ] **3D Model Hosting:** Will 3D model files (XKT, GLB, IFC) be stored in Supabase Storage or external CDN?
- [ ] **Model Versioning:** How should system handle 3D model updates mid-project? (Create new version, archive old, or replace?)
- [ ] **Marker Clustering:** Should system cluster nearby markers when zoomed out to reduce visual clutter?
- [ ] **Offline Support:** Should 3D models and markers be cached for offline PWA usage? (May require IndexedDB caching)
- [ ] **Client Budget Visibility:** Confirm whether clients should see material/expense costs in 3D view by default (currently configurable)

---

## Glossary

| Term | Definition |
|------|------------|
| **Spatial Marker** | A 3D point-of-interest on the model representing a task, issue, note, safety concern, or milestone |
| **Task Linking** | Associating an existing task with a 3D location via spatial_markers table |
| **Element ID** | Unique identifier for a 3D model object (IFC GUID, OBJ face ID, or GLTF node name) |
| **Marker Content** | Files, photos, or notes attached to a spatial marker via marker_content table |
| **Default Model** | Pre-configured 3D building model for a project type stored in default_3d_models table |
| **LOD (Level of Detail)** | Xeokit rendering optimization that loads lower-poly models when zoomed out |
| **RLS (Row Level Security)** | Supabase security policy that restricts data access by company_id and user role |
| **XKT Format** | Xeokit's optimized binary 3D format for fast web rendering |
| **GLB Format** | Binary GLTF 3D model format |
| **IFC Format** | Industry Foundation Classes BIM format for construction models |
| **Soft Delete** | Setting status='closed' instead of removing record from database |

---

## Approval Section

**Do the requirements look good? If so, we can move on to the design.**

---

## 🧾 Agent Audit Report

**Agent:** kiro-requirement
**Task Type:** Requirements Gathering
**Task Complexity:** Complex

### Actions Taken
- Planned before implementation: Yes
- Tools used:
  - Read (DB_SCHEMA.md, database.types.ts)
  - Grep (existing spatial_markers/marker_content schema)
  - Glob (spatial component files)
  - Write (requirements document)
- Files read:
  - `.claude/docs/law/DB_SCHEMA.md` – Verify existing spatial schema
  - `types/database.types.ts` (partial) – Confirm type definitions
- Files created:
  - `.claude/docs/requirements/3d-spatial-viewer-enhancement.md` – Full EARS requirements

### Decisions & Reasoning
- **No schema changes needed:** Existing `spatial_markers`, `marker_content`, `default_3d_models` tables already support all functionality
- **EARS format applied:** All acceptance criteria use WHEN/THEN/IF/SHALL structure per kiro-requirement authority
- **GenHub personas used:** GC, PM, Worker, Client personas clearly defined in user stories
- **Permission model simplified:** GC/PM only for edits, all others view-only (clear enforcement via RLS)
- **Material linking via tasks:** Avoided direct material-to-3D linking (uses existing task → material relationship)
- **Soft deletes enforced:** Preserves audit trail for deleted markers

### Issues Encountered
- **No major blockers:** Existing schema and components already cover 90% of infrastructure
- **Open questions documented:** Default model sourcing, storage location, versioning strategy need clarification

### Token & Efficiency Notes
- **Estimated token usage:** ~8k tokens (requirements doc creation)
- **Read efficiency:** Only read schema docs and types (avoided reading full React components)
- **No unnecessary rework:** Single-pass requirements generation based on user decisions

### Improvement Suggestions
- **Add SPATIAL_VIEWER.md to law docs:** Create dedicated law doc with 3D interaction patterns (camera controls, marker rendering, touch gestures) for future reference
- **Consider adding REQ-11:** Export/Import spatial markers (for project templates or data migration)
- **Clarify marker clustering:** Should be addressed in design phase (visual UX decision, not a hard requirement)

---
END
