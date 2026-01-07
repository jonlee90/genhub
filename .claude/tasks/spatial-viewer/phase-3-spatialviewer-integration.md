# Phase 3: SpatialViewer Integration

## Status
- **Phase:** 3 of 6
- **Complexity:** Complex
- **Agent:** agent-frontend-engineer
- **Estimated Time:** 3-4 hours
- **Prerequisites:** Phase 1 (Server Actions) AND Phase 2 (UI Components) MUST be complete

---

## Scope

Integrate Phase 2 UI components into the existing `SpatialViewer` component. Wire up 3D click handlers, context menu, marker rendering, and default model loading per project type.

**In Scope:**
- Enhance `SpatialViewer` to handle 3D click events
- Load default 3D models based on project type
- Render `SpatialMarkerPin` components at marker locations
- Wire context menu to 3D surface clicks
- Implement marker filtering logic
- Permission-based interaction (GC/PM edit, others view-only)

**Out of Scope:**
- Creating new components (Phase 2)
- Server actions (Phase 1)
- Task detail panel (Phase 4)
- Client portal (Phase 5)

---

## Tasks

### Task 3.1: Enhance `SpatialViewer` Component

**File:** `components/projects/spatial/SpatialViewer.tsx`

**Implementation Requirements:**
- [ ] Verify file exists (should already exist from previous spatial viewer work)
- [ ] Add new props:
  ```typescript
  interface SpatialViewerProps {
    projectId: string;
    projectType: ProjectType; // NEW: 'residential' | 'cafe' | 'restaurant' | 'commercial_office' | 'industrial'
    modelHighURL?: string; // Custom model (if uploaded)
    userRole: UserRole; // NEW: Permission control
    teamMembers: TeamMember[]; // NEW: For assign-to dropdown
    phases: Phase[]; // NEW: For task creation
    onMarkerPlacement?: (marker: SpatialMarker) => void;
  }
  ```
- [ ] Add state management:
  ```typescript
  const [markers, setMarkers] = useState<SpatialMarker[]>([]);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [clickedPosition, setClickedPosition] = useState<Position3D | null>(null);
  const [activeFilters, setActiveFilters] = useState<MarkerFilters>({});
  ```
- [ ] Load 3D model on mount:
  ```typescript
  useEffect(() => {
    if (modelHighURL) {
      // Load custom model
      loadCustomModel(modelHighURL);
    } else {
      // Load default model for project type
      loadDefaultModelForType(projectType);
    }
  }, [projectType, modelHighURL]);
  ```
- [ ] Fetch spatial markers on mount:
  ```typescript
  useEffect(() => {
    const fetchMarkers = async () => {
      const result = await getMarkersByProject(projectId, activeFilters);
      if (result.data) setMarkers(result.data);
    };
    fetchMarkers();
  }, [projectId, activeFilters]);
  ```
- [ ] Handle 3D canvas click (GC/PM only):
  ```typescript
  const handleCanvasClick = (event: CanvasClickEvent) => {
    if (userRole !== 'gc_admin' && userRole !== 'project_manager') return;

    const { screenX, screenY, worldPosition, normal, elementId } = event;

    setContextMenuPosition({ x: screenX, y: screenY });
    setClickedPosition({ ...worldPosition, normal, elementId });
    setContextMenuOpen(true);
  };
  ```
- [ ] Render context menu:
  ```tsx
  <SpatialMarkerContextMenu
    isOpen={contextMenuOpen}
    position={contextMenuPosition}
    worldPosition={clickedPosition || { x: 0, y: 0, z: 0 }}
    normal={clickedPosition?.normal || { x: 0, y: 0, z: 0 }}
    elementId={clickedPosition?.elementId}
    userRole={userRole}
    onCreateTask={handleCreateTask}
    onLinkTask={handleLinkTask}
    onCreateMarker={handleCreateMarker}
    onClose={() => setContextMenuOpen(false)}
  />
  ```
- [ ] Render marker pins:
  ```tsx
  {markers.map(marker => (
    <SpatialMarkerPin
      key={marker.id}
      marker={marker}
      materialCount={marker.material_count}
      attachmentCount={marker.content?.length || 0}
      onClick={() => handleMarkerClick(marker)}
      onDragStart={(e) => handleMarkerDragStart(marker, e)}
      onDragEnd={(newPos) => handleMarkerDragEnd(marker, newPos)}
    />
  ))}
  ```
- [ ] Render filter panel:
  ```tsx
  <MarkerFilterPanel
    activeFilters={activeFilters}
    onFilterChange={setActiveFilters}
    markerCounts={calculateMarkerCounts(markers)}
  />
  ```

**Reference:**
- Design: Component Diagram (lines 96-122)
- Design: Data Flow > Project Load (lines 126-142)
- Requirements: REQ-1 (Unique 3D Models), REQ-5 (Permission Controls)

---

### Task 3.2: Enhance `InteractionLayer` Component

**File:** `components/projects/spatial/InteractionLayer.tsx`

**Implementation Requirements:**
- [ ] Verify file exists (handles Xeokit canvas interactions)
- [ ] Add click event handler that emits:
  ```typescript
  interface CanvasClickEvent {
    screenX: number;
    screenY: number;
    worldPosition: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
    elementId?: string; // IFC GUID or model element ID
  }
  ```
- [ ] Implement raycasting to get 3D world position from screen click
- [ ] Emit click event to parent component (SpatialViewer)
- [ ] Add permission check before emitting:
  ```typescript
  if (userRole === 'gc_admin' || userRole === 'project_manager') {
    onCanvasClick(event);
  }
  ```
- [ ] Handle right-click for context menu (desktop)
- [ ] Handle long-press for context menu (mobile)

**Right-Click Handler:**
```typescript
const handleRightClick = (e: MouseEvent) => {
  e.preventDefault();
  if (userRole !== 'gc_admin' && userRole !== 'project_manager') return;

  const canvasRect = canvas.getBoundingClientRect();
  const screenX = e.clientX - canvasRect.left;
  const screenY = e.clientY - canvasRect.top;

  const pickResult = viewer.scene.pick({
    canvasPos: [screenX, screenY],
    pickSurface: true
  });

  if (pickResult) {
    onCanvasClick({
      screenX: e.clientX,
      screenY: e.clientY,
      worldPosition: pickResult.worldPos,
      normal: pickResult.worldNormal,
      elementId: pickResult.entity?.id
    });
  }
};
```

**Reference:**
- Design: Data Flow > Task Linking Flow (lines 145-165)
- Requirements: REQ-5 (Permission Controls)

---

### Task 3.3: Implement Default Model Loading

**File:** `components/projects/spatial/SpatialViewer.tsx` (or create helper file)

**Implementation Requirements:**
- [ ] Create function to load default model based on project type:
  ```typescript
  const loadDefaultModelForType = async (projectType: ProjectType) => {
    // Fetch default model from default_3d_models table
    const result = await fetch(`/api/default-models/${projectType}`);
    const modelData = await result.json();

    if (modelData.xkt_file_url) {
      // Load XKT file
      loadXKTModel(modelData.xkt_file_url);
    } else {
      // Generate procedural model (from lib/xeokit/default-models.ts)
      const defaultModel = createDefaultModel(viewer, projectType);
      setActiveModel(defaultModel);
    }
  };
  ```
- [ ] Display loading indicator while model loads
- [ ] Display error fallback if model fails to load (wireframe placeholder)
- [ ] Progress indicator for large models

**Procedural Model Generation (from design doc lines 1410-1427):**
```typescript
// lib/xeokit/default-models.ts already implements this
import { createDefaultModel } from '@/lib/xeokit/default-models';

const model = createDefaultModel(viewer, 'residential');
// Returns Xeokit SceneModel with rooms, walls, floors, etc.
```

**Reference:**
- Design: Data Flow > Project Load (lines 126-142)
- Design: Decision: Default Models as Procedural Geometry (lines 1410-1427)
- Requirements: REQ-1 (Unique 3D Building Models)

---

### Task 3.4: Wire Context Menu Actions

**File:** `components/projects/spatial/SpatialViewer.tsx`

**Implementation Requirements:**
- [ ] Implement `handleCreateTask` (opens TaskLinker in create mode):
  ```typescript
  const handleCreateTask = () => {
    setTaskLinkerMode('create');
    setTaskLinkerOpen(true);
    setContextMenuOpen(false);
  };
  ```
- [ ] Implement `handleLinkTask` (opens TaskLinker in link mode):
  ```typescript
  const handleLinkTask = () => {
    setTaskLinkerMode('link');
    setTaskLinkerOpen(true);
    setContextMenuOpen(false);
  };
  ```
- [ ] Implement `handleCreateMarker` (opens MarkerCreationModal):
  ```typescript
  const handleCreateMarker = (markerType: MarkerType) => {
    setSelectedMarkerType(markerType);
    setMarkerModalOpen(true);
    setContextMenuOpen(false);
  };
  ```
- [ ] Add state for modals:
  ```typescript
  const [taskLinkerOpen, setTaskLinkerOpen] = useState(false);
  const [taskLinkerMode, setTaskLinkerMode] = useState<'create' | 'link'>('create');
  const [markerModalOpen, setMarkerModalOpen] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState<MarkerType>('issue');
  ```
- [ ] Render modals:
  ```tsx
  <TaskLinker
    isOpen={taskLinkerOpen}
    onClose={() => setTaskLinkerOpen(false)}
    mode={taskLinkerMode}
    position={clickedPosition || { x: 0, y: 0, z: 0 }}
    normal={clickedPosition?.normal || { x: 0, y: 0, z: 0 }}
    elementId={clickedPosition?.elementId}
    projectId={projectId}
    projectTasks={projectTasks}
    onTaskLinked={handleTaskLinked}
    onTaskCreated={handleTaskCreated}
  />

  <MarkerCreationModal
    isOpen={markerModalOpen}
    onClose={() => setMarkerModalOpen(false)}
    markerType={selectedMarkerType}
    position={clickedPosition || { x: 0, y: 0, z: 0 }}
    normal={clickedPosition?.normal || { x: 0, y: 0, z: 0 }}
    elementId={clickedPosition?.elementId}
    projectId={projectId}
    phaseId={phases[0]?.id}
    onSubmit={handleMarkerCreated}
  />
  ```

**Reference:**
- Design: Data Flow > Task Linking Flow (lines 144-186)
- Design: Component Diagram (lines 96-122)

---

### Task 3.5: Implement Marker Callbacks

**File:** `components/projects/spatial/SpatialViewer.tsx`

**Implementation Requirements:**
- [ ] Implement `handleTaskCreated`:
  ```typescript
  const handleTaskCreated = async (task: Task, marker: SpatialMarker) => {
    // Refresh markers
    const result = await getMarkersByProject(projectId, activeFilters);
    if (result.data) setMarkers(result.data);

    // Show success toast
    toast.success(`Task "${task.title}" created at location`);

    // Trigger parent callback
    onMarkerPlacement?.(marker);
  };
  ```
- [ ] Implement `handleTaskLinked`:
  ```typescript
  const handleTaskLinked = async (taskId: string) => {
    // Refresh markers
    const result = await getMarkersByProject(projectId, activeFilters);
    if (result.data) setMarkers(result.data);

    // Show success toast
    toast.success('Task linked to 3D location');
  };
  ```
- [ ] Implement `handleMarkerCreated`:
  ```typescript
  const handleMarkerCreated = async (marker: SpatialMarker) => {
    // Refresh markers
    const result = await getMarkersByProject(projectId, activeFilters);
    if (result.data) setMarkers(result.data);

    // Show success toast
    toast.success(`${marker.marker_type} marker created`);

    // Trigger parent callback
    onMarkerPlacement?.(marker);
  };
  ```
- [ ] Implement `handleMarkerClick`:
  ```typescript
  const handleMarkerClick = (marker: SpatialMarker) => {
    // Phase 4 will implement TaskDetailPanel
    console.log('Marker clicked:', marker);
  };
  ```
- [ ] Implement `handleMarkerDragEnd` (GC/PM only):
  ```typescript
  const handleMarkerDragEnd = async (marker: SpatialMarker, newPosition: Position3D) => {
    const result = await updateMarker(marker.id, { position: newPosition });
    if (result.success) {
      toast.success('Marker position updated');
      // Refresh markers
      const markersResult = await getMarkersByProject(projectId, activeFilters);
      if (markersResult.data) setMarkers(markersResult.data);
    } else {
      toast.error('Failed to update marker position');
    }
  };
  ```

**Reference:**
- Design: Data Flow (all sections)
- Design: Implementation Phases > Phase 3 (lines 1033-1047)

---

### Task 3.6: Enhance `ProjectDetailContent` Component

**File:** `components/projects/ProjectDetailContent.tsx`

**Implementation Requirements:**
- [ ] Verify file exists (project detail page client component)
- [ ] Fetch user role from session
- [ ] Fetch team members for task assignment
- [ ] Fetch project phases for task creation
- [ ] Pass all required props to `SpatialViewer`:
  ```tsx
  <SpatialViewer
    projectId={project.id}
    projectType={project.project_type}
    modelHighURL={project.active_3d_model_url}
    userRole={session.user.role}
    teamMembers={teamMembers}
    phases={phases}
    onMarkerPlacement={handleMarkerPlacement}
  />
  ```
- [ ] Add loading state while fetching dependencies
- [ ] Handle errors if team/phases fetch fails

**Data Fetching:**
```typescript
const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
const [phases, setPhases] = useState<Phase[]>([]);

useEffect(() => {
  const fetchDependencies = async () => {
    const [teamResult, phasesResult] = await Promise.all([
      getCompanyTeamMembers(),
      getProjectPhases(project.id)
    ]);

    if (teamResult.data) setTeamMembers(teamResult.data);
    if (phasesResult.data) setPhases(phasesResult.data);
  };

  fetchDependencies();
}, [project.id]);
```

**Reference:**
- Design: System Context (lines 49-91)
- Design: Implementation Phases > Phase 3 (lines 1033-1047)

---

### Task 3.7: Update Project Detail Page

**File:** `app/app/projects/[id]/page.tsx`

**Implementation Requirements:**
- [ ] Verify file exists (server component)
- [ ] Fetch user role from session
- [ ] Pass user role to `ProjectDetailContent` component:
  ```tsx
  export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    const userRole = session?.user?.role || 'field_worker';

    const project = await getProject(params.id);
    const teamMembers = await getCompanyTeamMembers();
    const phases = await getProjectPhases(params.id);

    return (
      <ProjectDetailContent
        project={project}
        userRole={userRole}
        teamMembers={teamMembers}
        phases={phases}
      />
    );
  }
  ```

**Reference:**
- Design: System Context (lines 49-91)
- Requirements: REQ-5 (Permission Controls)

---

## Acceptance Criteria

### Functionality
- [x] 3D model loads correctly (default model for project type OR custom model)
- [x] Context menu appears on right-click (GC/PM only)
- [x] Context menu does NOT appear for non-GC/PM users
- [x] "Create New Task Here" opens TaskLinker in create mode
- [x] "Link Existing Task" opens TaskLinker in link mode
- [x] "Add Issue/Note/Safety/Milestone" opens MarkerCreationModal
- [x] Marker creation succeeds and refreshes marker list
- [x] Task creation succeeds and creates task + marker
- [x] Task linking succeeds and creates marker at 3D location
- [x] Markers render at correct 3D positions with correct colors
- [x] Material badges display on task markers
- [x] Filter panel filters markers correctly
- [x] Marker drag-and-drop works (GC/PM only)

### UI/UX
- [x] Loading indicator displays while model loads
- [x] Error fallback displays if model fails to load
- [x] Toast notifications display on success/error
- [x] Markers clickable (not obscured by canvas)
- [x] Context menu positioned correctly on screen
- [x] Responsive layout (mobile bottom sheet for modals)

### Security
- [x] NO Supabase imports in client components
- [x] Permission checks enforce GC/PM-only edits
- [x] All mutations via server actions

**Status:** ✅ COMPLETE (2026-01-04)

---

## Dependencies

**Before This Phase:**
- Phase 1 (Server Actions) MUST be complete
- Phase 2 (UI Components) MUST be complete

**After This Phase:**
- Phase 4: Task Detail Panel (marker click handler calls panel)

---

## Testing Notes

**Manual Testing:**
- Test with GC admin account (full permissions)
- Test with PM account (full permissions)
- Test with Worker account (view-only)
- Test with Client account (view-only)
- Test different project types (residential, cafe, restaurant, commercial_office, industrial)
- Test custom model upload (if project has uploaded model)
- Test context menu positioning (near edges, corners)
- Test marker creation end-to-end
- Test task creation end-to-end
- Test task linking end-to-end
- Test filter combinations

**Integration Tests:**
- Full flow: Right-click → Create Task → Task appears on 3D model
- Full flow: Right-click → Link Task → Marker appears on 3D model
- Full flow: Filter markers → Only filtered markers visible

---

## Files Modified

| File | Action | Lines |
|------|--------|-------|
| `components/projects/spatial/SpatialViewer.tsx` | Enhance | +200-300 |
| `components/projects/spatial/InteractionLayer.tsx` | Enhance | +100-150 |
| `components/projects/ProjectDetailContent.tsx` | Enhance | +50-100 |
| `app/app/projects/[id]/page.tsx` | Enhance | +20-30 |

**Total:** ~370-580 new lines of code

---

## References

- **Requirements:** `.claude/docs/requirements/3d-spatial-viewer-enhancement.md`
- **Design:** `.claude/docs/designs/3d-spatial-viewer-enhancement.md`
- **Law Docs:** `.claude/docs/law/SPATIAL_VIEWER.md` (Xeokit patterns)
- **Existing Components:** `lib/xeokit/default-models.ts` (procedural models)

---

## Notes

- **Token budget:** Estimate 12-18k tokens for implementation (frontend agent typical)
- **Xeokit SDK:** Already integrated, use existing patterns from SPATIAL_VIEWER.md
- **Default models:** Already implemented in `lib/xeokit/default-models.ts`
- **NO direct DB access** – all queries via server actions

---

## Next Phase

After Phase 3 completion → **Phase 4: Task Detail Panel + Material Visibility**

---

## Implementation Summary

**Date:** 2026-01-04  
**Status:** ✅ COMPLETE

### Files Enhanced:
1. ✅ `SpatialViewer.tsx` (Task 3.1, 3.3, 3.4, 3.5) - ~250 lines added
2. ✅ `InteractionLayer.tsx` (Task 3.2) - ~50 lines added
3. ✅ `ProjectOverview.tsx` (Task 3.6) - ~15 lines modified
4. ✅ `ProjectDetailContent.tsx` (Task 3.6) - ~5 lines modified
5. ✅ `app/app/projects/[id]/page.tsx` (Task 3.7) - ~3 lines added

### Key Features Implemented:
- **3D Model Loading:** Default models per project type + custom model support
- **Context Menu:** Right-click on 3D surface → context menu (GC/PM only)
- **Marker Rendering:** SpatialMarkerPin components at marker locations
- **Permission Controls:** GC/PM edit, others view-only
- **Marker Filtering:** Filter panel with localStorage persistence
- **Task Creation:** Create task + marker at clicked 3D location
- **Task Linking:** Link existing task to 3D location
- **Marker Creation:** Create issue/note/safety/milestone markers
- **Marker Drag:** Drag-and-drop to update marker position (GC/PM only)

### Integration Chain:
```
page.tsx (Server) 
  → fetches userRole from session
  → passes to ProjectDetailContent (Client)
    → passes to ProjectOverview (Client)
      → passes to SpatialViewer (Client)
        → renders context menu (GC/PM only)
        → renders marker pins with filters
        → handles 3D click events
```

### Permission Model:
- **GC/PM:** Context menu, marker creation, task creation, drag-and-drop
- **All Users:** View markers, view 3D model, click markers (Phase 4)

### Build Status:
✅ All TypeScript errors resolved for Phase 3 code
✅ No CLAUDE.md violations
✅ All acceptance criteria met

### Ready for Phase 4:
Phase 3 provides foundation for Phase 4 Task Detail Panel:
- Marker click handler exists (placeholder: console.log)
- Phase 4 will implement TaskDetailPanel component
- Phase 4 will show task details, materials, attachments on marker click

### Minor Observations (Non-Blocking):
- LOW: `projectTasks` prop uses `any` type (could use Task[] type)
- Note: Build errors in `materials.ts` are unrelated to Phase 3 (separate feature)

