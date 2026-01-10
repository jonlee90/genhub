# Skill: Spatial Markers

> 3D spatial viewer and marker patterns for GenHub

## When to Use

- IFC model viewing
- Adding markers to 3D models
- Linking markers to tasks
- Spatial annotation workflows

## Prerequisites

- Check `.claude/docs/law/SPATIAL_VIEWER.md` for full architecture
- IFC.js for 3D rendering
- Model files stored in Supabase Storage

---

## Quick Reference

### Database Schema
```sql
-- IFC models
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
  updated_at timestamptz
)

-- Spatial markers
spatial_markers (
  id uuid PRIMARY KEY,
  model_id uuid REFERENCES ifc_models(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id),
  position jsonb NOT NULL,  -- {x, y, z}
  normal jsonb,             -- {x, y, z} surface normal
  element_id text,          -- IFC element ID
  marker_type marker_type DEFAULT 'issue',
  title text NOT NULL,
  description text,
  status marker_status DEFAULT 'open',
  priority marker_priority DEFAULT 'medium',
  created_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  photos text[],
  created_at timestamptz,
  updated_at timestamptz
)
```

### Marker Types
```typescript
type MarkerType = 'issue' | 'note' | 'measurement' | 'photo' | 'task'
type MarkerStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type MarkerPriority = 'low' | 'medium' | 'high' | 'critical'
```

---

## Server Actions

### Upload IFC Model
```typescript
export async function uploadIfcModel(
  projectId: string,
  file: File
) {
  const supabase = await createClient()

  // Upload to storage
  const fileName = `${projectId}/${Date.now()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('ifc-models')
    .upload(fileName, file)

  if (uploadError) return { error: uploadError.message }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('ifc-models')
    .getPublicUrl(fileName)

  // Create model record
  const { data, error } = await supabase
    .from('ifc_models')
    .insert({
      project_id: projectId,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      status: 'processing',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/app/projects/${projectId}`)
  return { data }
}
```

### Create Spatial Marker
```typescript
export async function createSpatialMarker(input: {
  modelId: string
  position: { x: number; y: number; z: number }
  normal?: { x: number; y: number; z: number }
  elementId?: string
  markerType: MarkerType
  title: string
  description?: string
  priority?: MarkerPriority
  taskId?: string
  assignedTo?: string
}) {
  const supabase = await createClient()
  const session = await auth()

  const { data, error } = await supabase
    .from('spatial_markers')
    .insert({
      model_id: input.modelId,
      position: input.position,
      normal: input.normal,
      element_id: input.elementId,
      marker_type: input.markerType,
      title: input.title,
      description: input.description,
      priority: input.priority || 'medium',
      status: 'open',
      task_id: input.taskId,
      assigned_to: input.assignedTo,
      created_by: session.user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/app/spatial/${input.modelId}`)
  return { data }
}
```

### Get Markers for Model
```typescript
export async function getModelMarkers(modelId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('spatial_markers')
    .select(`
      *,
      created_by_user:users!created_by(id, name, image),
      assigned_to_user:users!assigned_to(id, name, image),
      task:tasks(id, title, status)
    `)
    .eq('model_id', modelId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
```

### Link Marker to Task
```typescript
export async function linkMarkerToTask(markerId: string, taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('spatial_markers')
    .update({ task_id: taskId })
    .eq('id', markerId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function createTaskFromMarker(markerId: string, projectId: string) {
  const supabase = await createClient()

  // Get marker details
  const { data: marker } = await supabase
    .from('spatial_markers')
    .select('*')
    .eq('id', markerId)
    .single()

  if (!marker) return { error: 'Marker not found' }

  // Create task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title: marker.title,
      description: `From spatial marker: ${marker.description || ''}`,
      priority: marker.priority,
      assignee_id: marker.assigned_to,
    })
    .select()
    .single()

  if (taskError) return { error: taskError.message }

  // Link marker to task
  await supabase
    .from('spatial_markers')
    .update({ task_id: task.id })
    .eq('id', markerId)

  revalidatePath(`/app/projects/${projectId}`)
  return { data: task }
}
```

---

## 3D Viewer Integration

### Viewer Component
```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import * as OBC from '@thatopen/components'
import * as THREE from 'three'

interface SpatialViewerProps {
  modelUrl: string
  markers: SpatialMarker[]
  onMarkerCreate?: (position: Vector3, normal: Vector3) => void
  onMarkerClick?: (marker: SpatialMarker) => void
}

export function SpatialViewer({
  modelUrl,
  markers,
  onMarkerCreate,
  onMarkerClick,
}: SpatialViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewer, setViewer] = useState<OBC.Components | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const initViewer = async () => {
      const components = new OBC.Components()
      const worlds = components.get(OBC.Worlds)
      const world = worlds.create<OBC.SimpleWorld>()

      world.scene = new OBC.SimpleScene(components)
      world.renderer = new OBC.SimpleRenderer(components, containerRef.current!)
      world.camera = new OBC.SimpleCamera(components)

      // Load IFC
      const fragments = components.get(OBC.FragmentsManager)
      const loader = components.get(OBC.IfcLoader)

      await loader.setup()
      const model = await loader.load(modelUrl)
      world.scene.three.add(model)

      // Setup camera
      world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0)

      setViewer(components)
      setIsLoading(false)
    }

    initViewer()

    return () => {
      viewer?.dispose()
    }
  }, [modelUrl])

  // Render markers
  useEffect(() => {
    if (!viewer) return

    markers.forEach(marker => {
      const sprite = createMarkerSprite(marker)
      viewer.get(OBC.Worlds).list.values().next().value.scene.three.add(sprite)
    })
  }, [viewer, markers])

  // Click handler for creating markers
  const handleClick = (e: React.MouseEvent) => {
    if (!viewer || !onMarkerCreate) return

    const rect = containerRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast to find intersection
    const raycaster = new THREE.Raycaster()
    const camera = viewer.get(OBC.Worlds).list.values().next().value.camera.three
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

    const scene = viewer.get(OBC.Worlds).list.values().next().value.scene.three
    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const hit = intersects[0]
      onMarkerCreate(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0))
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px]"
      onClick={handleClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
    </div>
  )
}
```

### Marker Sprite
```typescript
function createMarkerSprite(marker: SpatialMarker): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = 64
  canvas.height = 64

  // Draw marker based on type
  const colors = {
    issue: '#DC2626',
    note: '#3B82F6',
    measurement: '#10B981',
    photo: '#8B5CF6',
    task: '#F59E0B',
  }

  context.fillStyle = colors[marker.marker_type]
  context.beginPath()
  context.arc(32, 32, 24, 0, Math.PI * 2)
  context.fill()

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)

  sprite.position.set(marker.position.x, marker.position.y, marker.position.z)
  sprite.scale.set(0.5, 0.5, 0.5)
  sprite.userData = { markerId: marker.id }

  return sprite
}
```

---

## UI Components

### Marker Panel
```tsx
'use client'

export function MarkerPanel({ markers, selectedId, onSelect }: MarkerPanelProps) {
  return (
    <div className="w-80 border-l bg-white overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Markers ({markers.length})</h3>
      </div>
      <div className="divide-y">
        {markers.map(marker => (
          <div
            key={marker.id}
            onClick={() => onSelect(marker)}
            className={cn(
              "p-3 cursor-pointer hover:bg-gray-50",
              selectedId === marker.id && "bg-blue-50"
            )}
          >
            <div className="flex items-center gap-2">
              <MarkerTypeIcon type={marker.marker_type} />
              <span className="font-medium">{marker.title}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {marker.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <MarkerStatusBadge status={marker.status} />
              <MarkerPriorityBadge priority={marker.priority} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Create Marker Modal
```tsx
export function CreateMarkerModal({
  isOpen,
  onClose,
  position,
  normal,
  modelId,
}: CreateMarkerModalProps) {
  const [markerType, setMarkerType] = useState<MarkerType>('issue')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await createSpatialMarker({
      modelId,
      position,
      normal,
      markerType,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as MarkerPriority,
    })

    if (result.data) {
      toast.success('Marker created')
      onClose()
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Marker">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(['issue', 'note', 'photo', 'task'] as MarkerType[]).map(type => (
            <Button
              key={type}
              type="button"
              variant={markerType === type ? 'default' : 'outline'}
              onClick={() => setMarkerType(type)}
            >
              {type}
            </Button>
          ))}
        </div>

        <Input name="title" required placeholder="Title" />
        <Textarea name="description" placeholder="Description" />

        <Select name="priority" defaultValue="medium">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" className="w-full">Create Marker</Button>
      </form>
    </BaseModal>
  )
}
```

---

## Anti-Patterns

```typescript
// WRONG: Storing position as separate columns
position_x, position_y, position_z
// Use JSONB for flexibility

// WRONG: Loading full model on every navigation
// Cache model in memory or use progressive loading

// WRONG: Too many markers rendered as DOM elements
// Use WebGL sprites for markers

// WRONG: No cleanup of 3D resources
// Always dispose viewer/textures/geometries
```

---

## Checklist

- [ ] IFC model stored in Supabase Storage
- [ ] Position stored as JSONB {x, y, z}
- [ ] Marker linked to model (required)
- [ ] Task link optional
- [ ] Viewer cleanup on unmount
- [ ] Marker sprites for performance
- [ ] Company isolation via model → project
- [ ] Mobile touch support for marker placement
