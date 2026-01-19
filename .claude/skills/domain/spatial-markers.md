# Skill: Spatial Markers

> 3D spatial viewer and marker patterns for GenHub

## When to Use

- IFC model viewing and management
- Adding markers to 3D models
- Linking markers to tasks and materials
- Spatial annotation workflows
- Default model configurations

## Prerequisites

- Check `.claude/docs/indexes/tables.md` for spatial schema
- Check `.claude/docs/indexes/actions.md` for spatial actions
- @thatopen/components for 3D rendering
- Model files stored in Supabase Storage

---

## Quick Reference

### Database Tables

| Table | Purpose |
|-------|---------|
| `projects_3d_models` | IFC/3D models for projects (21 cols) |
| `spatial_markers` | 3D markers on models (30 cols) |
| `marker_content` | Content attached to markers (19 cols) |
| `model_elements` | Individual elements within models (13 cols) |
| `default_3d_models` | System default models (17 cols) |
| `company_default_models` | Company-specific defaults (7 cols) |
| `default_marker_configs` | Default marker configurations (19 cols) |

### Key Schema
```sql
-- 3D Models (NOT ifc_models!)
projects_3d_models (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  company_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  processing_status text,  -- 'pending' | 'processing' | 'ready' | 'failed'
  created_at timestamptz
)

-- Spatial markers
spatial_markers (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  model_id uuid REFERENCES projects_3d_models(id),
  company_id uuid NOT NULL,
  x numeric NOT NULL,  -- Separate columns, not JSONB
  y numeric NOT NULL,
  z numeric NOT NULL,
  marker_type text,
  title text NOT NULL,
  description text,
  phase_id uuid REFERENCES project_phases(id),
  created_by uuid,
  created_at timestamptz
)
```

### Marker Types
```typescript
type MarkerType = 'issue' | 'note' | 'measurement' | 'photo' | 'task' | 'material'
// Markers can link to tasks, materials, and content
```

---

## Server Actions

### Model Actions (spatial.ts)

| Action | Purpose |
|--------|---------|
| `uploadIFCFile` | Upload IFC file to storage |
| `createModelRecord` | Create model DB record |
| `getProjectModels` | List models for project |
| `getActiveModel` | Get active model version |
| `updateModelProcessingStatus` | Update processing status |
| `setActiveModelVersion` | Set which version is active |
| `deleteModelVersion` | Delete model version |
| `replaceActiveModel` | Upload and replace active |

### Marker Actions (spatial.ts)

| Action | Purpose |
|--------|---------|
| `createMarker` | Create new marker |
| `getProjectMarkers` | All markers for project |
| `getMarkerById` | Single marker details |
| `updateMarker` | Update marker fields |
| `deleteMarker` | Delete marker |
| `attachContentToMarker` | Add content (notes, photos) |
| `getMarkerContent` | Get marker content |
| `deleteMarkerContent` | Remove content |
| `getMarkersByPhase` | Markers filtered by phase |
| `findNearestMarker` | Find closest marker to point |
| `getMarkersByProject` | All project markers |
| `uploadMarkerAttachment` | Upload attachment |
| `createTaskAtLocation` | Create task linked to marker |

### Default Model Actions (default-models.ts)

| Action | Purpose |
|--------|---------|
| `getSystemDefaultModel` | Get system default model |
| `getCompanyDefaultModel` | Get company-specific default |
| `createMarkersFromDefaultConfigs` | Apply default markers |
| `assignDefaultModel` | Assign default to project |
| `getDefaultModelsForCompany` | List available defaults |
| `uploadCompanyDefaultModel` | Upload company default |
| `resetToSystemDefault` | Reset to system default |

### Create Marker Pattern
```typescript
// Coordinates are separate columns (x, y, z), not JSONB
await createMarker({
  projectId,
  modelId,
  x: 10.5,
  y: 20.3,
  z: 5.0,
  markerType: 'issue',
  title: 'Crack in wall',
  description: 'Visible crack near window',
  phaseId,  // Optional - link to phase
});
```

### Marker Content Pattern
```typescript
// Attach content to marker
await attachContentToMarker({
  markerId,
  contentType: 'photo',  // 'note' | 'photo' | 'document'
  content: 'Photo of crack',
  fileUrl: uploadedPhotoUrl,
});

// Get all content for marker
const content = await getMarkerContent(markerId);
```

### Task Integration
```typescript
// Create task at marker location
const task = await createTaskAtLocation({
  markerId,
  projectId,
  title: 'Fix crack in wall',
  phaseId,
});
// Task is automatically linked to marker

// Link existing task to marker (via tasks.ts)
await linkTaskToMarker(taskId, markerId);
```

---

## 3D Viewer Integration

### @thatopen/components Setup
```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import * as OBC from '@thatopen/components'
import * as THREE from 'three'

export function SpatialViewer({ modelUrl, markers }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const componentsRef = useRef<OBC.Components | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const init = async () => {
      const components = new OBC.Components()
      componentsRef.current = components

      const worlds = components.get(OBC.Worlds)
      const world = worlds.create<OBC.SimpleWorld>()

      world.scene = new OBC.SimpleScene(components)
      world.renderer = new OBC.SimpleRenderer(components, containerRef.current!)
      world.camera = new OBC.SimpleCamera(components)

      // Load IFC
      const loader = components.get(OBC.IfcLoader)
      await loader.setup()
      const model = await loader.load(modelUrl)
      world.scene.three.add(model)
    }

    init()

    // CRITICAL: Cleanup on unmount
    return () => {
      componentsRef.current?.dispose()
    }
  }, [modelUrl])

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />
}
```

### Marker Rendering
```typescript
// Position using separate x, y, z columns
markers.forEach(marker => {
  const sprite = createMarkerSprite(marker)
  // Use x, y, z directly (not position.x)
  sprite.position.set(marker.x, marker.y, marker.z)
  scene.add(sprite)
})
```

---

## Default Models

### System Defaults
Projects can use default 3D models with pre-configured markers:

```typescript
// Get system default for project type
const defaultModel = await getSystemDefaultModel(projectType);

// Assign to project with default markers
await assignDefaultModel({
  projectId,
  defaultModelId: defaultModel.id,
});
// Creates model record + applies default_marker_configs
```

### Company Custom Defaults
```typescript
// Upload company-specific default
await uploadCompanyDefaultModel({
  file,
  projectType: 'residential',
  markerConfigs: [...],  // Custom marker positions
});

// Get company default (falls back to system)
const model = await getCompanyDefaultModel(projectType);
```

---

## Anti-Patterns

```typescript
// WRONG: Table name 'ifc_models'
supabase.from('ifc_models').select()
// Actual table is 'projects_3d_models'

// CORRECT:
supabase.from('projects_3d_models').select()

// WRONG: Position as JSONB
{ position: { x: 10, y: 20, z: 5 } }
// Position is separate columns

// CORRECT: Separate columns
{ x: 10, y: 20, z: 5 }

// WRONG: No viewer cleanup
useEffect(() => {
  const components = new OBC.Components()
  // No cleanup - memory leak!
}, [])

// CORRECT: Always dispose
useEffect(() => {
  const components = new OBC.Components()
  return () => components.dispose()
}, [])

// WRONG: DOM elements for markers
markers.map(m => <div style={{ position: 'absolute' }}>{m.title}</div>)
// Use WebGL sprites for performance

// CORRECT: WebGL sprites
markers.forEach(m => scene.add(createMarkerSprite(m)))
```

---

## Checklist

- [ ] Table name: `projects_3d_models` (not `ifc_models`)
- [ ] Coordinates: `x`, `y`, `z` columns (not JSONB position)
- [ ] IFC files stored in Supabase Storage
- [ ] Marker linked to model via `model_id`
- [ ] Content attached via `marker_content` table
- [ ] Viewer cleanup on component unmount
- [ ] WebGL sprites for marker performance
- [ ] Default models via `default_3d_models` system
- [ ] Company isolation via `company_id`
