# Spatial Domain Reference

> 3D spatial viewer and marker patterns for GenHub

Last updated: 2026-01-09

---

## Overview

The Spatial domain handles IFC model viewing and 3D marker placement. Users can upload building models, place issue/note markers in 3D space, and link them to tasks.

---

## Data Model

### IFC Models
```sql
ifc_models (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  version integer DEFAULT 1,
  status model_status DEFAULT 'processing',
  metadata jsonb,
  created_at timestamptz,
  created_by uuid
)
```

### Spatial Markers
```sql
spatial_markers (
  id uuid PRIMARY KEY,
  model_id uuid REFERENCES ifc_models(id),
  task_id uuid REFERENCES tasks(id),

  -- 3D position
  position jsonb NOT NULL,  -- {x, y, z}
  normal jsonb,             -- surface normal
  element_id text,          -- IFC element ID

  -- Marker info
  marker_type marker_type DEFAULT 'issue',
  title text NOT NULL,
  description text,
  status marker_status DEFAULT 'open',
  priority marker_priority DEFAULT 'medium',

  -- Assignment
  created_by uuid,
  assigned_to uuid,
  photos text[],

  -- Timestamps
  created_at timestamptz,
  resolved_at timestamptz
)
```

---

## Relationships

```
projects
  └── ifc_models (1:N)
        └── spatial_markers (1:N)
              ├── marker_photos (1:N)
              ├── marker_comments (1:N)
              └── tasks (N:1, optional)
```

---

## Server Actions

### Location
`app/actions/spatial.ts`

### Available Actions

| Action | Purpose | Auth |
|--------|---------|------|
| getModels | List project models | user |
| getModel | Get model with markers | user |
| uploadModel | Upload IFC file | user |
| deleteModel | Remove model | admin |
| getMarkers | Get markers for model | user |
| createMarker | Add marker to model | user |
| updateMarker | Update marker | user |
| resolveMarker | Mark as resolved | user |
| linkMarkerToTask | Connect to task | user |
| createTaskFromMarker | Generate task | user |

---

## UI Components

### Location
`components/spatial/`

### Key Components

| Component | Purpose |
|-----------|---------|
| SpatialViewer | Main 3D viewer canvas |
| ModelUpload | IFC file upload |
| MarkerPanel | Sidebar marker list |
| MarkerDetail | Single marker view |
| MarkerForm | Create/edit marker |
| MarkerSprite | 3D marker visualization |

### Viewer Architecture
```
SpatialViewerPage
├── SpatialViewer (3D canvas)
│   ├── IFC Model (loaded via IFC.js)
│   └── MarkerSprites (THREE.Sprite)
├── MarkerPanel (sidebar)
│   ├── MarkerFilters
│   └── MarkerList
└── CreateMarkerModal
```

---

## 3D Implementation

### IFC.js Setup
```typescript
import * as OBC from '@thatopen/components'

const components = new OBC.Components()
const worlds = components.get(OBC.Worlds)
const world = worlds.create<OBC.SimpleWorld>()

world.scene = new OBC.SimpleScene(components)
world.renderer = new OBC.SimpleRenderer(components, container)
world.camera = new OBC.SimpleCamera(components)

// Load IFC
const loader = components.get(OBC.IfcLoader)
await loader.setup()
const model = await loader.load(modelUrl)
world.scene.three.add(model)
```

### Marker Placement
```typescript
// Raycast on click to get 3D position
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(x, y)
raycaster.setFromCamera(mouse, camera)

const intersects = raycaster.intersectObjects(scene.children, true)
if (intersects.length > 0) {
  const hit = intersects[0]
  const position = hit.point
  const normal = hit.face?.normal

  // Create marker at this position
  await createMarker({
    modelId,
    position: { x: position.x, y: position.y, z: position.z },
    normal: normal ? { x: normal.x, y: normal.y, z: normal.z } : undefined,
    elementId: hit.object.userData?.expressID,
  })
}
```

### Marker Sprites
```typescript
function createMarkerSprite(marker: SpatialMarker): THREE.Sprite {
  const colors = {
    issue: '#DC2626',
    note: '#3B82F6',
    measurement: '#10B981',
    photo: '#8B5CF6',
    task: '#F59E0B',
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 64
  canvas.height = 64

  ctx.fillStyle = colors[marker.marker_type]
  ctx.beginPath()
  ctx.arc(32, 32, 24, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)

  sprite.position.set(
    marker.position.x,
    marker.position.y,
    marker.position.z
  )
  sprite.scale.set(0.5, 0.5, 0.5)
  sprite.userData = { markerId: marker.id }

  return sprite
}
```

---

## Business Rules

### Marker Types
| Type | Use Case | Color |
|------|----------|-------|
| issue | Problems, defects | Red |
| note | General annotations | Blue |
| measurement | Dimensions, specs | Green |
| photo | Photo documentation | Purple |
| task | Linked to task | Orange |

### Marker Status Flow
```
open → in_progress → resolved → closed
open → closed  (dismissed)
resolved → open  (reopened)
```

### Task Linking
- Marker can link to existing task OR
- Marker can create new task (inherits title, priority, assignee)
- When task completes, marker auto-resolves

---

## Performance

### Large Model Handling
```typescript
// Progressive loading for large models
const fragments = components.get(OBC.FragmentsManager)
const streamer = components.get(OBC.IfcStreamer)
await streamer.setupWithIfcJson(modelMetadata)
```

### Marker Optimization
- Use THREE.Sprite for markers (billboarded)
- Limit visible markers by view distance
- Use marker clustering when zoomed out
- Cache marker sprites, update on change

---

## Mobile Considerations

### Touch Controls
```typescript
// Orbit controls for touch
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN,
}

// Tap to select marker
canvas.addEventListener('touchend', (e) => {
  if (!wasPinchGesture && !wasSwipeGesture) {
    handleMarkerSelection(e.changedTouches[0])
  }
})
```

### Responsive Viewer
- Mobile: Viewer fullscreen, markers in bottom sheet
- Tablet: Split view (60% viewer, 40% panel)
- Desktop: Side-by-side (70% viewer, 30% panel)

---

## Access Control

### RLS Policy
```sql
-- Access via model → project → company
CREATE POLICY "markers_company_access" ON spatial_markers
  FOR ALL TO authenticated
  USING (
    model_id IN (
      SELECT m.id FROM ifc_models m
      JOIN projects p ON p.id = m.project_id
      WHERE p.company_id = get_user_company_id(next_auth.uid())
    )
  );
```

---

## See Also

- `docs/law/SPATIAL_VIEWER.md` - Full architecture
- `skills/domain/spatial-markers.md` - Implementation patterns
- `docs/backend/SCHEMA_SPATIAL.md` - Schema details
