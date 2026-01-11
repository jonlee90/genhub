# GenHub Domain: Spatial (3D)

## Marker Status Workflow
```
open → in_progress → resolved → closed
```

## Enums
- **Marker Type**: issue | note | photo | inspection | rfi | safety | material | progress
- **Marker Status**: open | in_progress | resolved | closed

## Tables
- `projects_3d_models` - Project models (→ projects)
- `default_3d_models` - System-wide defaults
- `company_default_models` - Company's picks (→ default_3d_models)
- `default_marker_configs` - Marker presets (→ default_3d_models)
- `spatial_markers` - 3D markers (→ projects_3d_models)
- `marker_content` - Rich content (→ spatial_markers)
- `model_elements` - Named parts (→ projects_3d_models)

## Marker Structure
```typescript
// Marker with 3D position
spatial_markers: {
  model_id, marker_type, status,
  position_x, position_y, position_z,
  normal_x, normal_y, normal_z, // surface normal
  task_id? // optional link to task
}

// Rich content per marker
marker_content: {
  marker_id, content_type, content_data
}
```

## Key Actions (app/actions/spatial.ts)
| Action | Purpose |
|--------|---------|
| getProjectModels | List 3D models |
| getActiveModel | Get current model |
| getSpatialMarkers | Get markers for model |
| createMarker | Add marker |
| updateMarker | Update marker |
| deleteMarker | Remove marker |
| linkMarkerToTask | Connect to task |

## Task Integration
```typescript
// From tasks.ts
linkTaskToMarker(taskId, markerId)
getTasksByMarker(markerId)
logTaskCompletionToMarker(taskId)
```

## Common Patterns
- One active model per project at a time
- Markers have 3D position + normal vector
- Markers can optionally link to tasks
- No revalidation (real-time or manual refresh)

## Gotchas
- Position stored as separate x/y/z columns
- Normal vector for placing markers on surfaces
- Model elements = clickable named parts
- Marker configs = presets for marker types