# 3D Spatial Viewer - Agent Reference

> **Law document** for Claude agents working on the 3D Spatial Viewer feature.

---

## Quick Reference

**Location**: `components/projects/spatial/*`
**Database**: `projects_3d_models`, `default_3d_models`, `spatial_markers`, `marker_content`
**Server Actions**: `app/actions/spatial.ts`, `app/actions/default-models.ts`
**Technology**: Xeokit SDK (WebGL), Supabase Realtime, IndexedDB
**Default Models**: Supports all 5 project types (residential, cafe, restaurant, commercial_office, industrial)

**When to Use**:
- User needs to upload/view BIM/IFC models
- User creates a new project (auto-loads default model for project type)
- User needs to place 3D markers (issues, notes, photos)
- Client portal needs read-only 3D view
- User needs 2D floor plan fallback
- User needs offline support for job sites
- Project has no custom model uploaded (uses default model)

---

## Architecture Patterns

### Component Hierarchy

```
SpatialViewer (Orchestrator)
├── 3DViewerCanvas (Xeokit wrapper)
│   ├── ModelLoader (XKT loading)
│   ├── CameraControls (Camera UI)
│   ├── LODManager (Level of detail)
│   └── InteractionLayer (Click handling)
│
├── MarkerAnnotationPanel (Marker CRUD)
│   ├── MarkerPanel (Sidebar list)
│   │   ├── MarkerListItem
│   │   ├── MarkerFilters (Type/Status/Floor)
│   │   └── MarkerSearch
│   │
│   └── ContentDrawer (Photos/Files/Notes)
│       ├── PhotoUploader + PhotoGallery
│       ├── FileUploader + FileList
│       ├── NoteEditor + NotesList
│       └── ActivityTimeline
│
├── ViewerToolbar (Camera presets, tools)
├── ModelManagementPanel (Version control)
└── IFCUploader (File upload UI)
```

**Alternative Views**:
- `ClientSpatialViewer` - Read-only client portal
- `FloorPlanViewer` - 2D fallback when no 3D model
- `SpatialViewerWithOnboarding` - First-time user tutorial

---

## Critical Gotchas

### 0. Database Field Names (Updated Jan 2026)

**Spatial Markers** - Use correct column names:
```typescript
// ❌ WRONG (old names)
marker.marker_type    // Use: marker.type
marker.position.x     // Use: marker.position_x, marker.position_y, marker.position_z
marker.assigned_to    // REMOVED - link via task_id instead

// ✅ CORRECT
marker.type           // 'issue'|'note'|'photo'|'inspection'|'rfi'|'safety'|'material'|'progress'
marker.status         // 'open'|'in_progress'|'resolved'|'closed'
marker.position_x, marker.position_y, marker.position_z
```

**Marker Content** - Field names changed:
```typescript
// ❌ WRONG (old names)
content.content_type  // Use: content.type
content.text_content  // Use: content.note_text
content.url           // Use: content.file_url or content.photo_url
content.uploaded_by   // Use: content.created_by

// ✅ CORRECT
content.type          // 'photo'|'file'|'note'
content.note_text     // text content for notes
content.file_url, content.photo_url, content.photo_thumbnail_url
content.created_by    // ⚠️ References next_auth.users - can't auto-join
```

### 1. Xeokit Viewer Lifecycle

**NEVER create multiple viewers on the same canvas**:
```typescript
// ❌ BAD: Creates memory leak
const viewer = new Viewer({ canvasId: 'canvas' });
// ...unmount
const viewer2 = new Viewer({ canvasId: 'canvas' }); // Memory leak!

// ✅ GOOD: Use singleton manager
import { viewerManager } from '@/lib/xeokit/viewer-manager';
const viewer = viewerManager.getOrCreateViewer(projectId, canvas, config);
```

**ALWAYS cleanup on unmount with null checks**:
```typescript
useEffect(() => {
  const viewer = viewerManager.getOrCreateViewer(...);
  return () => {
    if (viewer?.scene?.canvas) {
      fullCleanup(viewer); // Destroys models, textures, WebGL context
    }
    // Additional cleanup for pluginManager if used
    if (viewer?.scene?.canvas?.pluginManager) {
      viewer.scene.canvas.pluginManager.destroy();
    }
  };
}, []);
```

### 2. Model URL Format & Default Models

**XKT files MUST be served with correct CORS headers**:
- Supabase Storage automatically handles this
- If using external CDN, ensure CORS allows origin

**Default Model Detection**:
```typescript
// Check if modelURL is a placeholder (indicates default model should be used)
const isPlaceholderURL = modelHighURL?.startsWith('defaults/') || modelHighURL?.startsWith('/defaults/');
const hasValidProjectType = ['residential', 'cafe', 'restaurant', 'commercial_office', 'industrial'].includes(projectType || '');
const shouldUseDefaultModel = (!modelHighURL || isPlaceholderURL) && hasValidProjectType;

// Load default model
if (viewer && shouldUseDefaultModel) {
  await createDefaultModel(viewer, projectType!);
}
```

**Model loading pattern**:
```typescript
// ❌ BAD: Direct URL to viewer without default model fallback
<ThreeDViewerCanvas modelUrl={activeModel.xkt_file_url} />

// ✅ GOOD: Supports both custom and default models
<SpatialViewer
  projectId={projectId}
  modelHighURL={activeModel?.xkt_file_url}
  projectType={project.project_type}
  onMarkerPlacement={handleMarkerPlacement}
/>
```

### 3. Marker Position Precision

**ALWAYS use `numeric` type in database, NOT `float` or `double`**:
```sql
-- ✅ GOOD
position_x numeric NOT NULL,
position_y numeric NOT NULL,
position_z numeric NOT NULL

-- ❌ BAD (precision loss)
position_x float NOT NULL
```

**TypeScript coordinates are numbers**:
```typescript
interface Position3D {
  x: number; // Maps to numeric in DB
  y: number;
  z: number;
}
```

### 4. Client Portal Security

**NEVER show all markers to clients**:
```typescript
// ❌ BAD: Leaks internal markers
const { data: markers } = await supabase
  .from('spatial_markers')
  .select('*')
  .eq('project_id', projectId);

// ✅ GOOD: Filter client-visible only
const { data: markers } = await supabase
  .from('spatial_markers')
  .select('*')
  .eq('project_id', projectId)
  .eq('is_client_visible', true); // Critical filter
```

### 5. Realtime Subscription Cleanup

**ALWAYS unsubscribe on unmount**:
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`project:${projectId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'spatial_markers' }, handleChange)
    .subscribe();

  return () => {
    channel.unsubscribe(); // Critical: prevents memory leak
  };
}, [projectId]);
```

### 6. Offline Sync Conflicts

**ALWAYS handle conflicts in UI**:
```typescript
const conflicts = await syncManager.sync();
if (conflicts.length > 0) {
  // Show ConflictDialog - user chooses resolution
  <ConflictDialog conflicts={conflicts} onResolve={...} />
}
```

---

## Database Patterns

### Table Relationships

```
default_3d_models (system-wide)
  ├─ project_type: enum (residential, cafe, restaurant, commercial_office, industrial)
  ├─ model_id: text (e.g., 'default-residential-layout')
  ├─ xkt_file_url: text (generated XKT geometry)
  └─ is_active: boolean (only one per project type)

projects (existing)
  ↓ (1:N)
projects_3d_models
  ├─ version: integer (unique per project)
  ├─ is_active: boolean (only one active per project)
  ├─ processing_status: enum (pending, processing, ready, failed)
  ├─ is_default: boolean (true if from default_3d_models)
  └─ default_model_id → default_3d_models (SET NULL)

spatial_markers
  ├─ project_id → projects (CASCADE)
  ├─ model_id → projects_3d_models (SET NULL)
  ├─ task_id → tasks (SET NULL)
  └─ phase_id → project_phases (SET NULL)
    ↓ (1:N)
marker_content
  ├─ type: 'photo' | 'file' | 'note' (NOT 'content_type')
  ├─ note_text: text (NOT 'text_content')
  ├─ created_by → next_auth.users (⚠️ can't auto-join via PostgREST)
  └─ polymorphic fields (only relevant fields populated)
```

### Key Constraints

1. **Unique Active Model**:
```sql
-- Only one is_active=true per project
-- Enforced at application level (update old active to false before setting new)
```

2. **Marker Foreign Keys**:
```sql
-- model_id ON DELETE SET NULL (preserve markers when model version deleted)
-- task_id ON DELETE SET NULL (preserve markers when task deleted)
-- project_id ON DELETE CASCADE (cleanup all markers when project deleted)
```

3. **Content Cascade**:
```sql
-- marker_content.marker_id ON DELETE CASCADE
-- Deleting marker deletes all photos/files/notes
```

### RLS Policy Pattern

**All spatial tables use company-based RLS**:
```sql
-- SELECT: Company members can view
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = spatial_markers.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
)

-- INSERT: Company members can create
WITH CHECK (same as SELECT)

-- UPDATE: Creator or GC/PM
USING (
  created_by = next_auth.uid() OR
  is_user_gc_admin(next_auth.uid())
)

-- DELETE: Creator or GC Admin only
USING (
  created_by = next_auth.uid() OR
  is_user_gc_admin(next_auth.uid())
)
```

---

## Performance Patterns

### LOD (Level of Detail)

**3-tier system based on camera distance**:
```typescript
const lodConfig = {
  near: { distance: 10, quality: 'high' },   // Full detail
  medium: { distance: 50, quality: 'medium' }, // Reduced polygons
  far: { distance: 100, quality: 'low' }      // Bounding boxes only
};
```

**Apply automatically via LODManager component**:
```tsx
<LODManager viewer={viewer} lodConfig={lodConfig} />
```

### Memory Management

**Monitor memory usage**:
```typescript
import { startMemoryMonitoring } from '@/lib/xeokit/memory-manager';

const cleanup = startMemoryMonitoring(viewer, {
  warningThreshold: 1024, // MB
  criticalThreshold: 2048, // MB
  onCritical: () => {
    // Reduce LOD quality or show warning
  }
});
```

**Full cleanup on unmount with null checks**:
```typescript
useEffect(() => {
  return () => {
    // CRITICAL: Null check before cleanup to prevent errors
    if (viewer?.scene?.canvas) {
      fullCleanup(viewer); // Destroys all models, textures, WebGL context
    }

    // Clean up pluginManager if exists
    if (viewer?.scene?.canvas?.pluginManager) {
      viewer.scene.canvas.pluginManager.destroy();
    }

    // Remove from singleton manager
    viewerManager.destroyViewer(projectId);
  };
}, [viewer, projectId]);
```

### Mobile Optimization

**Detect device and apply optimizations**:
```typescript
import { detectDevice, applyMobileOptimizations } from '@/lib/xeokit/mobile-optimizer';

if (detectDevice().isMobile) {
  applyMobileOptimizations(viewer, {
    disableEdges: true,        // Edges expensive on mobile GPU
    reduceLODQuality: true,    // Start at medium LOD
    enableGestureControls: true // Touch gestures
  });
}
```

### Marker Clustering

**Cluster markers when many are close**:
```typescript
<MarkerClusterer
  markers={markers}
  clusterRadius={50} // pixels
  enabled={markers.length > 100} // Only cluster when needed
/>
```

---

## Security Considerations

### File Upload Validation

**Server-side validation in server action**:
```typescript
// ✅ GOOD: Validate on server
export async function uploadIFCFile(projectId: string, formData: FormData) {
  const file = formData.get('file') as File;

  // Validate extension
  if (!file.name.toLowerCase().endsWith('.ifc')) {
    return { error: 'Only .IFC files are supported' };
  }

  // Validate size
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return { error: 'File size must be less than 500MB' };
  }

  // Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return projectCheck;

  // Upload to Supabase Storage
}
```

### Storage Bucket Policies

**Ensure RLS on storage**:
```sql
CREATE POLICY "Users can upload IFC models for company projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ifc-models' AND
  auth.uid() IN (
    SELECT user_id FROM company_users
    WHERE company_id = get_user_company_id(auth.uid())
  )
);
```

### Client Portal Isolation

**Use separate component with filtered props**:
```tsx
// ❌ BAD: Reusing full viewer with client flag
<SpatialViewer isClientView={true} />

// ✅ GOOD: Dedicated component with restricted API
<ClientSpatialViewer
  markers={clientVisibleMarkersOnly}
  onRequestInformation={handleClientNote}
  // No onPlaceMarker, no onDeleteMarker
/>
```

---

## Extending the Viewer

### Adding New Marker Types

1. **Update database enum**:
```sql
ALTER TYPE spatial_marker_type ADD VALUE 'new_type';
```

2. **Update TypeScript types**:
```typescript
// types/spatial.d.ts
export type SpatialMarkerType =
  | 'issue' | 'note' | 'photo' | 'inspection'
  | 'rfi' | 'safety' | 'material' | 'progress'
  | 'new_type'; // Add here
```

3. **Add UI config**:
```typescript
// components/projects/spatial/MarkerPanel.tsx
const markerTypeConfig: Record<SpatialMarkerType, MarkerTypeConfig> = {
  new_type: {
    icon: NewIcon,
    label: 'New Type',
    color: '#FF5733',
    description: 'Description for new type'
  }
};
```

### Custom Camera Behaviors

**Create controller class**:
```typescript
// lib/xeokit/camera/custom-controller.ts
export class CustomCameraController {
  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.init();
  }

  init() {
    // Bind custom events
    this.viewer.scene.canvas.canvas.addEventListener('dblclick', this.handleDoubleClick);
  }

  handleDoubleClick = (event: MouseEvent) => {
    // Custom behavior on double-click
  }

  destroy() {
    this.viewer.scene.canvas.canvas.removeEventListener('dblclick', this.handleDoubleClick);
  }
}
```

### Xeokit Plugins

**Follow xeokit plugin pattern**:
```typescript
// lib/xeokit/plugins/measurement-plugin.ts
export class MeasurementPlugin {
  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.measurements = [];
  }

  startMeasurement() {
    // Listen for picks
    this.viewer.scene.on('pick', this.handlePick);
  }

  handlePick = (result: any) => {
    // Calculate distance between two points
  }

  destroy() {
    this.viewer.scene.off('pick', this.handlePick);
  }
}
```

---

## Testing Strategies

### Unit Tests

**Test server actions**:
```typescript
// __tests__/spatial/marker-crud.test.ts
import { createMarker, updateMarker, deleteMarker } from '@/app/actions/spatial';

describe('Marker CRUD', () => {
  it('creates marker with valid data', async () => {
    const result = await createMarker({
      project_id: 'test-project',
      type: 'issue',
      position_x: 10,
      position_y: 5,
      position_z: 2,
      title: 'Test issue'
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBeDefined();
  });

  it('rejects marker without project access', async () => {
    // Mock user without access
    const result = await createMarker({ /* ... */ });
    expect(result.error).toContain('access denied');
  });
});
```

### E2E Tests (Playwright)

**Test full user flow**:
```typescript
// tests/e2e/spatial-viewer.spec.ts
test('user can upload model and place marker', async ({ page }) => {
  await page.goto('/app/projects/test-project');
  await page.click('text=3D Model');

  // Upload model
  await page.setInputFiles('input[type=file]', 'test-model.ifc');
  await page.waitForSelector('[data-testid="model-loaded"]');

  // Place marker
  await page.click('button:has-text("Place Marker")');
  await page.click('canvas#xeokit-canvas', { position: { x: 200, y: 200 } });
  await page.fill('input[name="title"]', 'Test marker');
  await page.click('button:has-text("Create")');

  // Verify marker appears
  await expect(page.locator('text=Test marker')).toBeVisible();
});
```

### Performance Tests

**Benchmark model loading**:
```typescript
// scripts/benchmark-model-load.ts
async function benchmarkModelLoad(xktUrl: string) {
  const start = performance.now();
  const viewer = new Viewer({ /* ... */ });
  const model = viewer.scene.createModel({ src: xktUrl });
  await new Promise(resolve => model.on('loaded', resolve));
  const loadTime = performance.now() - start;

  console.log(`Model loaded in ${loadTime}ms`);
  return { loadTime, elementCount: Object.keys(model.objects).length };
}
```

---

## Common Tasks

### Upload IFC Model
```typescript
// Server Action
await uploadIFCFile(projectId, formData);

// Background conversion queued automatically
// Check status via getActiveModel()
```

### Use Default Model for Project Type
```typescript
// When creating a project, default model is automatically assigned
// Based on project_type: residential, cafe, restaurant, commercial_office, industrial

// In SpatialViewer component:
const shouldUseDefaultModel = (!modelHighURL || modelHighURL?.startsWith('defaults/'))
  && hasValidProjectType;

if (viewer && shouldUseDefaultModel) {
  await createDefaultModel(viewer, projectType);
  // Creates procedurally generated 3D model for the project type
  // Model IDs: default-residential-layout, default-cafe-layout, etc.
}
```

### Create Marker on Click
```typescript
const handleElementClick = (result: IntersectionResult) => {
  const position = result.worldPos; // [x, y, z]
  const normal = result.worldNormal; // [nx, ny, nz]

  await createMarker({
    project_id: projectId,
    position_x: position[0],
    position_y: position[1],
    position_z: position[2],
    normal_x: normal[0],
    normal_y: normal[1],
    normal_z: normal[2],
    title: markerTitle,
    type: markerType
  });
};
```

### Filter Markers by Floor
```typescript
const floorMarkers = markers.filter(m => m.floor_id === selectedFloorId);
```

### Load Cached Model Offline
```typescript
import { getCachedModel } from '@/lib/offline/indexed-db';

const cached = await getCachedModel(modelId);
if (cached) {
  const blob = new Blob([cached.xktData]);
  const url = URL.createObjectURL(blob);
  viewer.scene.createModel({ src: url });
}
```

### Sync Offline Changes
```typescript
import { SyncManager } from '@/lib/offline/sync-manager';

const syncManager = new SyncManager(projectId);
const conflicts = await syncManager.sync();

if (conflicts.length > 0) {
  // Show conflict resolution UI
  <ConflictDialog conflicts={conflicts} onResolve={...} />
}
```

---

## Troubleshooting

### Model Doesn't Load

**Check**:
1. `processing_status === 'ready'` in database
2. `xkt_file_url` is not null
3. CORS headers on storage bucket
4. Browser console for WebGL errors

**Common Causes**:
- IFC conversion still pending/failed
- Supabase Storage bucket policy missing
- Model file corrupted
- WebGL 2.0 not supported (old browsers)

### Memory Leak

**Symptoms**:
- Browser tab uses 2GB+ RAM
- Viewer becomes sluggish
- GPU process crashes

**Solutions**:
1. Check `fullCleanup()` called on unmount
2. Verify no duplicate viewer instances (use `viewerManager`)
3. Enable memory monitoring (`startMemoryMonitoring`)
4. Reduce LOD quality for large models

### Markers Not Syncing

**Check**:
1. Supabase realtime subscription active
2. RLS policies allow user to view markers
3. Browser not blocking realtime connection
4. Offline sync queue cleared

**Debug**:
```typescript
const channel = supabase.channel(`project:${projectId}`);
console.log('Realtime status:', channel.state); // Should be 'joined'
```

### Offline Sync Conflict

**Cause**: Same marker edited offline by multiple users

**Resolution**:
1. Show `<ConflictDialog />` with both versions
2. User chooses: keep local, keep remote, or merge
3. Apply resolution and mark as synced

---

## References

**Code Locations**:
- Components: `components/projects/spatial/`
- Server Actions: `app/actions/spatial.ts`
- Database: `supabase/migrations/2026010200474*_create_*.sql`
- Types: `types/spatial.d.ts`
- Xeokit Utils: `lib/xeokit/`
- Offline: `lib/offline/`

**External Docs**:
- Xeokit SDK: https://xeokit.github.io/xeokit-sdk/docs/
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- IFC Format: https://technical.buildingsmart.org/standards/ifc/

**Related Features**:
- Tasks (task linking)
- Materials (material markers)
- Client Portal (read-only view)
- Offline PWA (IndexedDB caching)

---

## Decision Log

**Why Xeokit SDK?**
- Industry-standard BIM viewer
- WebGL-based, works in all modern browsers
- Supports IFC/XKT formats natively
- LOD and performance optimizations built-in

**Why XKT instead of IFC?**
- XKT is 10x smaller than IFC
- Loads 100x faster in browser
- Optimized for WebGL rendering
- Trade-off: requires server-side conversion

**Why numeric for coordinates?**
- Float precision loss causes marker drift
- Numeric preserves exact 3D position
- Critical for large-scale models (100m+ dimensions)

**Why ON DELETE SET NULL for model_id?**
- Preserve markers when model version deleted
- Markers still valid, just not linked to model
- User can re-link to newer model version

**Why separate ClientSpatialViewer?**
- Security: Prevent accidental exposure of internal markers
- UX: Simplified UI for clients (no advanced tools)
- Performance: Client doesn't need realtime edits

---

## Future Improvements

**Planned**:
- Multi-user presence (see who's viewing model)
- @mentions in marker notes
- Measurement tool (distances, areas, volumes)
- Section planes (cut through model)
- BIM clash detection
- VR/AR support (WebXR)

**Under Consideration**:
- Revit plugin (direct .rvt upload)
- Point cloud support (.e57, .las)
- 4D simulation (time-based phases)
- AI-powered marker suggestions

---

**Document Version**: 1.1
**Last Updated**: January 7, 2026
**Maintainer**: GenHub Core Team

---

## Changelog

### v1.1 (2026-01-07)
- Added Section 0: Database Field Names - Critical gotcha for renamed fields
- Updated marker_content relationship notes (type vs content_type, note_text vs text_content)
- Added cross-schema join warning for created_by → next_auth.users
- Documented that assigned_to was removed (use task_id linking instead)
