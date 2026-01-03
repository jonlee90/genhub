# 3D Spatial Viewer - Developer Guide

**Version:** 1.0
**Last Updated:** January 2, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [File Structure](#file-structure)
4. [Database Schema](#database-schema)
5. [Server Actions API](#server-actions-api)
6. [Component API](#component-api)
7. [Xeokit Integration](#xeokit-integration)
8. [Offline & IndexedDB](#offline--indexeddb)
9. [Performance Optimization](#performance-optimization)
10. [Security & RLS](#security--rls)
11. [Extending the Viewer](#extending-the-viewer)
12. [Testing](#testing)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  React Components                                            │
│  ├─ SpatialViewer (Main orchestrator)                       │
│  ├─ 3DViewerCanvas (Xeokit wrapper)                         │
│  ├─ MarkerAnnotationPanel (Marker CRUD UI)                  │
│  ├─ ClientSpatialViewer (Read-only client view)             │
│  └─ FloorPlanViewer (2D fallback)                           │
├─────────────────────────────────────────────────────────────┤
│  State Management                                            │
│  ├─ React useState/useEffect (local state)                  │
│  ├─ useRealtimeMarkers hook (Supabase realtime)             │
│  └─ IndexedDB (offline cache)                               │
├─────────────────────────────────────────────────────────────┤
│  3D Rendering Engine                                         │
│  └─ Xeokit SDK (WebGL 2.0)                                  │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Server (Edge)                       │
├─────────────────────────────────────────────────────────────┤
│  Server Actions (app/actions/spatial.ts)                    │
│  ├─ uploadIFCFile()                                         │
│  ├─ createMarker()                                          │
│  ├─ updateMarker()                                          │
│  ├─ getProjectMarkers()                                     │
│  └─ attachMarkerContent()                                   │
├─────────────────────────────────────────────────────────────┤
│  API Routes (app/api/ifc/)                                  │
│  ├─ POST /convert - Background IFC to XKT conversion        │
│  └─ POST /upload - Chunked file upload                      │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (Backend)                         │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                         │
│  ├─ projects_3d_models (model metadata, versions)           │
│  ├─ spatial_markers (3D positions, types)                   │
│  ├─ marker_content (photos, files, notes)                   │
│  └─ model_elements (IFC element index - future)             │
├─────────────────────────────────────────────────────────────┤
│  Storage Buckets                                             │
│  ├─ ifc-models (original .ifc files)                        │
│  ├─ xkt-models (converted .xkt files)                       │
│  └─ marker-photos (photos, thumbnails)                      │
├─────────────────────────────────────────────────────────────┤
│  Realtime Subscriptions                                      │
│  └─ spatial_markers table (live marker updates)             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Model Upload Flow**
```
User uploads .ifc → uploadIFCFile() server action
  → Save to Supabase Storage (ifc-models bucket)
  → Create record in projects_3d_models (status: pending)
  → Queue background IFC → XKT conversion
  → Conversion service processes file
  → Save .xkt to Supabase Storage (xkt-models bucket)
  → Update projects_3d_models (status: ready, xkt_file_url)
  → Revalidate project page
  → User sees model in viewer
```

**2. Marker Creation Flow**
```
User clicks on 3D model → handleElementClick()
  → Get 3D position (x, y, z) and surface normal
  → Open marker creation dialog
  → User fills title, type, description
  → createMarker() server action
  → Insert into spatial_markers table
  → Trigger Supabase realtime broadcast
  → All connected users see new marker instantly
```

**3. Realtime Collaboration Flow**
```
User A creates marker → Supabase realtime broadcast
  → User B's useRealtimeMarkers hook receives event
  → New marker added to local state
  → 3D viewer updates with new marker pin
  → Activity timeline shows "User A added marker"
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | React framework, App Router |
| **React** | 19.x | UI component library |
| **TypeScript** | 5.x | Type safety |
| **Xeokit SDK** | 2.x | WebGL-based BIM viewer |
| **Tailwind CSS** | 3.x | Styling |
| **Aceternity UI** | Latest | Construction-themed components |
| **Lucide React** | Latest | Icon library |

### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, storage, realtime |
| **next-auth** | Authentication |
| **Server Actions** | Type-safe server mutations |

### Libraries

- `@dnd-kit/core` - Drag and drop (future use)
- `idb` - IndexedDB wrapper for offline storage
- `react-dropzone` - File upload UI

---

## File Structure

```
components/projects/spatial/
├── SpatialViewer.tsx                    # Main viewer orchestrator
├── 3DViewerCanvas.tsx                   # Xeokit canvas wrapper
├── MarkerAnnotationPanel.tsx            # Marker CRUD panel
├── ClientSpatialViewer.tsx              # Client portal read-only view
├── FloorPlanViewer.tsx                  # 2D floor plan viewer
├── FloorPlanUploader.tsx                # Floor plan upload UI
├── OnboardingTour.tsx                   # First-time user tutorial
├── SpatialViewerWithOnboarding.tsx      # Wrapper with onboarding
│
├── ModelLoader.tsx                      # XKT model loading logic
├── CameraControls.tsx                   # Camera manipulation UI
├── LODManager.tsx                       # Level of detail optimization
├── InteractionLayer.tsx                 # 3D click/selection handling
├── MarkerPlacement.tsx                  # Marker creation UI
│
├── MarkerPanel.tsx                      # Marker list sidebar
├── MarkerListItem.tsx                   # Individual marker list item
├── MarkerFilters.tsx                    # Type/status/floor filters
├── MarkerSearch.tsx                     # Full-text marker search
├── MarkerClusterer.tsx                  # Cluster nearby markers
├── PhaseFilter.tsx                      # Filter by project phase
│
├── ContentDrawer.tsx                    # Content tabs (photos/files/notes)
├── PhotoUploader.tsx                    # Photo upload with preview
├── PhotoGallery.tsx                     # Photo grid gallery
├── FileUploader.tsx                     # File attachment upload
├── FileList.tsx                         # File list with download
├── NoteEditor.tsx                       # Note creation/editing
├── NotesList.tsx                        # Notes list
├── NoteItem.tsx                         # Individual note display
├── ActivityTimeline.tsx                 # Marker activity log
│
├── TaskLinker.tsx                       # Link marker to task modal
├── MaterialMarkers.tsx                  # Material-specific markers
├── PhotoLocationSuggester.tsx           # AI photo location detection
│
├── ModelManagementPanel.tsx             # Model version management
├── ViewerToolbar.tsx                    # Toolbar with camera/tools
├── ModelStatsDisplay.tsx                # Model metadata display
├── IFCUploader.tsx                      # IFC file upload UI
│
├── LoadingStates.tsx                    # Loading skeletons
├── ErrorBoundary.tsx                    # Error handling wrapper
├── ConflictDialog.tsx                   # Offline sync conflict resolution
└── Empty3DState.tsx                     # Empty state prompts

app/actions/
└── spatial.ts                           # Server actions for spatial domain

lib/xeokit/
├── viewer-manager.ts                    # Singleton viewer lifecycle
├── performance-optimizer.ts             # LOD, FPS, memory tuning
├── mobile-optimizer.ts                  # Mobile-specific optimizations
├── memory-manager.ts                    # WebGL cleanup, leak prevention
└── default-models.ts                    # Procedural default models

lib/offline/
├── sync-manager.ts                      # Offline sync logic
├── indexed-db.ts                        # IndexedDB schema
└── conflict-resolver.ts                 # Conflict resolution

types/
└── spatial.d.ts                         # TypeScript types for spatial domain

supabase/migrations/
├── 20260102004741_create_projects_3d_models.sql
├── 20260102004742_create_spatial_markers.sql
└── 20260102004743_create_marker_content.sql
```

---

## Database Schema

### Table: `projects_3d_models`

Stores 3D BIM/IFC model metadata, versions, and processing status.

```sql
CREATE TABLE public.projects_3d_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  file_name text NOT NULL,
  original_file_url text NOT NULL,
  xkt_file_url text,
  lod_medium_url text,
  lod_low_url text,
  thumbnail_url text,
  file_size_bytes bigint NOT NULL,
  element_count integer DEFAULT 0,
  bounds jsonb, -- {minX, minY, minZ, maxX, maxY, maxZ}
  floors jsonb, -- [{id, name, elevation}]
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  processing_status spatial_processing_status DEFAULT 'pending',
  processing_error text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT projects_3d_models_project_version_unique UNIQUE(project_id, version)
);
```

**Indexes:**
- `idx_projects_3d_models_project_active` on (project_id, is_active)
- `idx_projects_3d_models_status` on (processing_status)

**Enums:**
```sql
CREATE TYPE spatial_processing_status AS ENUM (
  'pending', 'processing', 'ready', 'failed'
);
```

---

### Table: `spatial_markers`

Stores spatial markers with 3D position, type, status, and relationships.

```sql
CREATE TABLE public.spatial_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  model_id uuid REFERENCES public.projects_3d_models(id) ON DELETE SET NULL,
  type spatial_marker_type NOT NULL DEFAULT 'note',
  status spatial_marker_status NOT NULL DEFAULT 'open',

  -- 3D position and orientation
  position_x numeric NOT NULL,
  position_y numeric NOT NULL,
  position_z numeric NOT NULL,
  normal_x numeric,
  normal_y numeric,
  normal_z numeric,

  -- IFC element reference
  element_id text,
  element_type text,
  element_name text,

  -- Spatial hierarchy
  floor_id text,
  floor_name text,
  room_id text,
  room_name text,

  -- Marker metadata
  title text NOT NULL,
  description text,

  -- Relationships
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  cluster_id uuid,

  -- Activity tracking
  content_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),

  created_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Indexes:**
- `idx_spatial_markers_project` on (project_id)
- `idx_spatial_markers_model` on (model_id)
- `idx_spatial_markers_position` on (position_x, position_y, position_z)
- `idx_spatial_markers_floor` on (floor_id)
- `idx_spatial_markers_type_status` on (type, status)
- `idx_spatial_markers_task` on (task_id)

**Enums:**
```sql
CREATE TYPE spatial_marker_type AS ENUM (
  'issue', 'note', 'photo', 'inspection', 'rfi',
  'safety', 'material', 'progress'
);

CREATE TYPE spatial_marker_status AS ENUM (
  'open', 'in_progress', 'resolved', 'closed'
);
```

---

### Table: `marker_content`

Polymorphic content attachments (photos, files, notes, activity logs).

```sql
CREATE TABLE public.marker_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid NOT NULL REFERENCES public.spatial_markers(id) ON DELETE CASCADE,
  type marker_content_type NOT NULL,

  -- Photo fields
  photo_url text,
  photo_thumbnail_url text,
  photo_width integer,
  photo_height integer,
  photo_exif jsonb,

  -- File fields
  file_url text,
  file_name text,
  file_size_bytes bigint,
  file_mime_type text,

  -- Note fields
  text_content text,
  text_format text DEFAULT 'plain', -- 'plain', 'markdown', 'html'

  created_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Indexes:**
- `idx_marker_content_marker` on (marker_id)
- `idx_marker_content_type` on (type)

**Enums:**
```sql
CREATE TYPE marker_content_type AS ENUM (
  'photo', 'file', 'note'
);
```

---

### Row Level Security (RLS)

All tables have RLS enabled with policies based on company membership.

**Example Policy (spatial_markers):**
```sql
-- SELECT: Company members can view markers
CREATE POLICY "Users can view spatial markers for company projects"
ON public.spatial_markers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = spatial_markers.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- INSERT: Company members can create markers
CREATE POLICY "Company members can create spatial markers"
ON public.spatial_markers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = spatial_markers.project_id
    AND p.company_id = get_user_company_id(next_auth.uid())
  )
);

-- UPDATE: Creator or GC/PM can update
CREATE POLICY "Users can update own markers or GC/PM can update all"
ON public.spatial_markers FOR UPDATE
USING (
  created_by = next_auth.uid() OR
  (is_user_gc_admin(next_auth.uid()) AND ...)
);

-- DELETE: Creator or GC Admin can delete
CREATE POLICY "Users can delete own markers or GC admin can delete all"
ON public.spatial_markers FOR DELETE
USING (
  created_by = next_auth.uid() OR
  (is_user_gc_admin(next_auth.uid()) AND ...)
);
```

---

## Server Actions API

All server actions are in `app/actions/spatial.ts`.

### Model Operations

#### `uploadIFCFile(projectId, formData)`

Upload IFC file to Supabase Storage and queue conversion.

```typescript
export async function uploadIFCFile(
  projectId: string,
  formData: FormData
): Promise<{ success: boolean; data?: Project3DModel; error?: string }>;
```

**Request:**
```typescript
const formData = new FormData();
formData.append('file', ifcFile); // File object

const result = await uploadIFCFile(projectId, formData);
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: "uuid",
    project_id: "uuid",
    version: 1,
    file_name: "building.ifc",
    original_file_url: "https://...",
    processing_status: "pending",
    ...
  }
}
```

**Validation:**
- File must be .ifc extension
- Max file size: 500MB
- User must have project access (company member)

---

#### `getActiveModel(projectId)`

Get the currently active 3D model for a project.

```typescript
export async function getActiveModel(
  projectId: string
): Promise<{ success: boolean; data?: Project3DModel; error?: string }>;
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: "uuid",
    xkt_file_url: "https://supabase.../model.xkt",
    processing_status: "ready",
    bounds: { minX: 0, minY: 0, minZ: 0, maxX: 100, maxY: 100, maxZ: 50 },
    floors: [
      { id: "floor-1", name: "Ground Floor", elevation: 0 },
      { id: "floor-2", name: "First Floor", elevation: 3.5 }
    ],
    ...
  }
}
```

---

#### `setActiveModel(modelId)`

Set a specific model version as active (only one active per project).

```typescript
export async function setActiveModel(
  modelId: string
): Promise<{ success: boolean; error?: string }>;
```

---

### Marker Operations

#### `createMarker(data)`

Create a new spatial marker.

```typescript
export async function createMarker(
  data: SpatialMarkerInsert
): Promise<CreateMarkerResponse>;
```

**Request:**
```typescript
const result = await createMarker({
  project_id: "uuid",
  model_id: "uuid",
  type: "issue",
  status: "open",
  position_x: 10.5,
  position_y: 5.2,
  position_z: 2.0,
  normal_x: 0,
  normal_y: 0,
  normal_z: 1,
  element_id: "ifc-element-guid",
  element_type: "IfcWall",
  element_name: "Wall: Exterior - Brick",
  floor_id: "floor-1",
  floor_name: "Ground Floor",
  title: "Crack in exterior wall",
  description: "Vertical crack approximately 2 feet long",
  task_id: "task-uuid" // Optional
});
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: "marker-uuid",
    created_by: "user-uuid",
    created_at: "2026-01-02T12:00:00Z",
    ...
  }
}
```

---

#### `updateMarker(markerId, updates)`

Update an existing marker.

```typescript
export async function updateMarker(
  markerId: string,
  updates: SpatialMarkerUpdate
): Promise<{ success: boolean; data?: SpatialMarker; error?: string }>;
```

**Example:**
```typescript
await updateMarker("marker-uuid", {
  status: "resolved",
  description: "Fixed by John on 1/2/2026"
});
```

---

#### `deleteMarker(markerId)`

Delete a marker (also deletes all attached content via CASCADE).

```typescript
export async function deleteMarker(
  markerId: string
): Promise<{ success: boolean; error?: string }>;
```

---

#### `getProjectMarkers(projectId, filters?)`

Get all markers for a project with optional filtering.

```typescript
export async function getProjectMarkers(
  projectId: string,
  filters?: MarkerFilters
): Promise<GetMarkersResponse>;
```

**Filters:**
```typescript
interface MarkerFilters {
  type?: 'issue' | 'note' | 'photo' | 'inspection' | 'rfi' | 'safety' | 'material' | 'progress';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  floor_id?: string;
  task_id?: string;
  phase_id?: string;
  created_by?: string;
}
```

**Example:**
```typescript
const { data: markers } = await getProjectMarkers(projectId, {
  type: 'issue',
  status: 'open',
  floor_id: 'floor-1'
});
```

---

### Content Operations

#### `attachPhoto(markerId, formData)`

Upload and attach a photo to a marker.

```typescript
export async function attachPhoto(
  markerId: string,
  formData: FormData
): Promise<AttachContentResponse>;
```

**Request:**
```typescript
const formData = new FormData();
formData.append('photo', photoFile);
formData.append('caption', 'Crack detail view');

await attachPhoto(markerId, formData);
```

---

#### `attachFile(markerId, formData)`

Upload and attach a file to a marker.

```typescript
export async function attachFile(
  markerId: string,
  formData: FormData
): Promise<AttachContentResponse>;
```

---

#### `addNote(markerId, text)`

Add a text note to a marker.

```typescript
export async function addNote(
  markerId: string,
  text: string,
  format?: 'plain' | 'markdown' | 'html'
): Promise<AttachContentResponse>;
```

---

## Component API

### `<SpatialViewer />`

Main viewer orchestrator component.

```typescript
interface SpatialViewerProps {
  projectId: string;
  modelHighURL?: string | null;
  modelMediumURL?: string;
  modelLowURL?: string;
  thumbnailURL?: string;
  projectType?: string; // For loading default models
  onMarkerPlacement?: (
    position: { x: number; y: number; z: number },
    normal: { x: number; y: number; z: number }
  ) => void;
  className?: string;
}
```

**Usage:**
```tsx
import { SpatialViewer } from '@/components/projects/spatial/SpatialViewer';

<SpatialViewer
  projectId={project.id}
  modelHighURL={activeModel?.xkt_file_url}
  thumbnailURL={activeModel?.thumbnail_url}
  projectType={project.type}
  onMarkerPlacement={(pos, normal) => {
    console.log('Marker placed at:', pos, normal);
  }}
/>
```

---

### `<ThreeDViewerCanvas />`

Core Xeokit canvas wrapper.

```typescript
interface ThreeDViewerCanvasProps {
  projectId: string;
  modelUrl?: string;
  initialCamera?: CameraState;
  className?: string;
  onReady?: (viewer: Viewer) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface CameraState {
  eye: [number, number, number];
  look: [number, number, number];
  up: [number, number, number];
}
```

**Usage:**
```tsx
<ThreeDViewerCanvas
  projectId={projectId}
  modelUrl={xktFileUrl}
  onReady={(viewer) => {
    console.log('Viewer ready:', viewer);
    // Access xeokit viewer instance
  }}
  onProgress={(progress) => {
    console.log('Loading:', progress + '%');
  }}
/>
```

---

### `<ClientSpatialViewer />`

Read-only viewer for client portal.

```typescript
interface ClientSpatialViewerProps {
  projectId: string;
  modelHighURL?: string | null;
  thumbnailURL?: string;
  markers: SpatialMarker[]; // Only client-visible markers
  onRequestInformation?: (markerId: string, message: string) => Promise<void>;
}
```

**Usage:**
```tsx
<ClientSpatialViewer
  projectId={projectId}
  modelHighURL={activeModel?.xkt_file_url}
  markers={clientVisibleMarkers}
  onRequestInformation={async (markerId, message) => {
    await createClientNote(markerId, message);
  }}
/>
```

---

### `<FloorPlanViewer />`

2D floor plan viewer with marker placement.

```typescript
interface FloorPlanViewerProps {
  projectId: string;
  floorPlans: FloorPlan[];
  markers: SpatialMarker[];
  onMarkerClick?: (marker: SpatialMarker) => void;
  onPlaceMarker?: (position: { x: number; y: number; floor: string }) => void;
}

interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
  elevation: number;
}
```

**Usage:**
```tsx
<FloorPlanViewer
  projectId={projectId}
  floorPlans={[
    { id: 'floor-1', name: 'Ground Floor', imageUrl: '...', elevation: 0 },
    { id: 'floor-2', name: 'First Floor', imageUrl: '...', elevation: 3.5 }
  ]}
  markers={markers}
  onPlaceMarker={(pos) => {
    console.log('Marker placed at 2D:', pos);
  }}
/>
```

---

### `<OnboardingTour />`

Interactive first-time user tutorial.

```typescript
interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}
```

**Usage:**
```tsx
<OnboardingTour
  onComplete={() => {
    localStorage.setItem('spatial-onboarding-complete', 'true');
  }}
  onSkip={() => {
    localStorage.setItem('spatial-onboarding-skipped', 'true');
  }}
/>
```

---

## Xeokit Integration

### Viewer Initialization

```typescript
import { viewerManager } from '@/lib/xeokit/viewer-manager';

const viewer = viewerManager.getOrCreateViewer(
  projectId,
  canvasElement,
  {
    transparent: false,
    backgroundColor: [0.95, 0.95, 0.97],
  }
);
```

### Loading Models

```typescript
import { Viewer } from '@xeokit/xeokit-sdk';

const model = viewer.scene.createModel({
  id: modelId,
  src: xktFileUrl,
  edges: true,
});

model.on('loaded', () => {
  console.log('Model loaded successfully');
  viewer.cameraFlight.flyTo(model);
});

model.on('error', (error) => {
  console.error('Model load error:', error);
});
```

### Camera Controls

```typescript
// Fly to model bounding box
viewer.cameraFlight.flyTo({
  aabb: model.aabb,
  duration: 1.0
});

// Fit to view
viewer.cameraFlight.fitToView({
  aabb: viewer.scene.aabb
});

// Set camera position manually
viewer.camera.eye = [100, 100, 100];
viewer.camera.look = [0, 0, 0];
viewer.camera.up = [0, 0, 1];

// Toggle orthographic/perspective
viewer.camera.projection = 'ortho'; // or 'perspective'
```

### Entity Selection

```typescript
// Highlight selected element
viewer.scene.setObjectsHighlighted(['ifc-element-guid'], true);

// Get clicked entity
viewer.scene.on('pick', (pickResult) => {
  if (pickResult.entity) {
    const elementId = pickResult.entity.id;
    const worldPos = pickResult.worldPos; // [x, y, z]
    const worldNormal = pickResult.worldNormal; // [nx, ny, nz]

    console.log('Clicked:', elementId, 'at', worldPos);
  }
});

// Deselect all
viewer.scene.setObjectsHighlighted(viewer.scene.highlightedObjectIds, false);
```

### Performance Optimization

```typescript
import { optimizeViewer, getPerformanceStats } from '@/lib/xeokit/performance-optimizer';

// Apply performance optimizations
optimizeViewer(viewer, {
  enableLOD: true,
  enableCulling: true,
  targetFPS: 30,
  memoryLimit: 2048, // MB
});

// Monitor FPS
const stats = getPerformanceStats(viewer);
console.log('FPS:', stats.fps);
console.log('Memory:', stats.memoryUsage + 'MB');
```

### Mobile Optimization

```typescript
import { applyMobileOptimizations, detectDevice } from '@/lib/xeokit/mobile-optimizer';

if (detectDevice().isMobile) {
  applyMobileOptimizations(viewer, {
    disableEdges: true,
    reduceLODQuality: true,
    enableGestureControls: true,
  });
}
```

### Memory Management

```typescript
import { fullCleanup, startMemoryMonitoring } from '@/lib/xeokit/memory-manager';

// Monitor memory usage
const cleanup = startMemoryMonitoring(viewer, {
  warningThreshold: 1024, // MB
  criticalThreshold: 2048, // MB
  onWarning: () => console.warn('High memory usage'),
  onCritical: () => {
    // Reduce LOD quality or reload model
  }
});

// Cleanup on unmount
useEffect(() => {
  return () => {
    fullCleanup(viewer);
    cleanup();
  };
}, [viewer]);
```

---

## Offline & IndexedDB

### IndexedDB Schema

```typescript
// lib/offline/indexed-db.ts
const DB_NAME = 'genhub-spatial';
const DB_VERSION = 1;

interface OfflineModel {
  id: string;
  projectId: string;
  xktData: ArrayBuffer;
  cachedAt: Date;
}

interface OfflineMarker extends SpatialMarker {
  syncStatus: 'synced' | 'pending' | 'conflict';
  localUpdatedAt: Date;
}

const db = await openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore('models', { keyPath: 'id' });
    db.createObjectStore('markers', { keyPath: 'id' });
    db.createObjectStore('pending_uploads', { keyPath: 'id' });
  }
});
```

### Caching Model

```typescript
import { cacheModel, getCachedModel } from '@/lib/offline/indexed-db';

// Download and cache XKT model
const response = await fetch(xktFileUrl);
const xktData = await response.arrayBuffer();

await cacheModel({
  id: modelId,
  projectId: projectId,
  xktData: xktData,
  cachedAt: new Date()
});

// Load from cache
const cached = await getCachedModel(modelId);
if (cached) {
  const blob = new Blob([cached.xktData]);
  const url = URL.createObjectURL(blob);
  // Load into xeokit viewer
}
```

### Offline Sync

```typescript
import { SyncManager } from '@/lib/offline/sync-manager';

const syncManager = new SyncManager(projectId);

// Queue offline marker creation
await syncManager.queueMarkerCreate({
  // marker data
});

// Sync when online
window.addEventListener('online', async () => {
  const conflicts = await syncManager.sync();
  if (conflicts.length > 0) {
    // Show conflict resolution UI
  }
});
```

### Conflict Resolution

```typescript
import { resolveConflict } from '@/lib/offline/conflict-resolver';

interface Conflict {
  markerId: string;
  localVersion: SpatialMarker;
  remoteVersion: SpatialMarker;
}

const resolved = await resolveConflict(conflict, 'keep-local');
// or 'keep-remote', 'merge'
```

---

## Performance Optimization

### Level of Detail (LOD)

```typescript
import { LODManager } from '@/components/projects/spatial/LODManager';

<LODManager
  viewer={viewer}
  lodConfig={{
    near: { distance: 10, quality: 'high' },
    medium: { distance: 50, quality: 'medium' },
    far: { distance: 100, quality: 'low' }
  }}
/>
```

### Culling

```typescript
// Enable frustum culling (objects outside camera view)
viewer.scene.cullingEnabled = true;

// Enable backface culling
viewer.scene.backfaces = false;
```

### Lazy Loading

```typescript
// Only load visible floors
const visibleFloors = ['floor-1', 'floor-2'];
viewer.scene.setObjectsVisible(viewer.scene.objectIds, false);
viewer.scene.setObjectsVisible(getFloorObjectIds(visibleFloors), true);
```

### Marker Clustering

```typescript
import { MarkerClusterer } from '@/components/projects/spatial/MarkerClusterer';

<MarkerClusterer
  markers={markers}
  clusterRadius={50} // pixels
  onClusterClick={(cluster) => {
    // Zoom to cluster bounds
  }}
/>
```

---

## Security & RLS

### Authentication Context

All server actions verify user authentication via `next-auth`:

```typescript
import { auth } from '@/lib/auth';

const session = await auth();
if (!session?.user?.id) {
  return { error: 'Not authenticated' };
}
```

### Company Isolation

All queries filter by company membership:

```typescript
const { data: companyUser } = await supabase
  .from('company_users')
  .select('company_id, role')
  .eq('user_id', session.user.id)
  .eq('status', 'active')
  .single();

// Verify project belongs to user's company
const { data: project } = await supabase
  .from('projects')
  .select('id')
  .eq('id', projectId)
  .eq('company_id', companyUser.company_id)
  .single();
```

### Client Portal Restrictions

Client-visible markers are filtered at query time:

```typescript
// Only show markers where is_client_visible = true
const { data: markers } = await supabase
  .from('spatial_markers')
  .select('*')
  .eq('project_id', projectId)
  .eq('is_client_visible', true); // Client portal filter
```

### File Upload Security

Storage bucket policies enforce access control:

```sql
-- Supabase Storage Policy: ifc-models bucket
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

---

## Extending the Viewer

### Adding Custom Marker Types

1. **Update database enum:**
```sql
ALTER TYPE spatial_marker_type ADD VALUE 'custom_type';
```

2. **Update TypeScript types:**
```typescript
// types/spatial.d.ts
export type SpatialMarkerType =
  | 'issue' | 'note' | 'photo' | 'inspection'
  | 'rfi' | 'safety' | 'material' | 'progress'
  | 'custom_type'; // Add here
```

3. **Add UI for new type:**
```tsx
// components/projects/spatial/MarkerPanel.tsx
const markerTypeConfig = {
  custom_type: {
    icon: CustomIcon,
    label: 'Custom Type',
    color: '#FF5733'
  }
};
```

### Creating Plugins

```typescript
// lib/xeokit/plugins/custom-plugin.ts
export class CustomPlugin {
  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.init();
  }

  init() {
    this.viewer.scene.on('tick', () => {
      // Custom per-frame logic
    });
  }

  destroy() {
    // Cleanup
  }
}

// Usage
import { CustomPlugin } from '@/lib/xeokit/plugins/custom-plugin';
const plugin = new CustomPlugin(viewer);
```

### Custom Camera Behaviors

```typescript
// lib/xeokit/camera/orbit-controller.ts
export class OrbitController {
  constructor(viewer: Viewer, target: [number, number, number]) {
    this.viewer = viewer;
    this.target = target;
  }

  orbit(angle: number) {
    const radius = 100;
    const x = this.target[0] + radius * Math.cos(angle);
    const y = this.target[1] + radius * Math.sin(angle);
    this.viewer.camera.eye = [x, y, 50];
    this.viewer.camera.look = this.target;
  }
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/spatial/marker-creation.test.ts
import { createMarker } from '@/app/actions/spatial';

describe('createMarker', () => {
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
    // Mock user without project access
    const result = await createMarker({ /* ... */ });
    expect(result.error).toContain('access denied');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/spatial-viewer.spec.ts
import { test, expect } from '@playwright/test';

test('3D viewer loads and displays model', async ({ page }) => {
  await page.goto('/app/projects/test-project');
  await page.click('text=3D Model');

  // Wait for viewer canvas
  const canvas = page.locator('canvas#xeokit-canvas');
  await expect(canvas).toBeVisible();

  // Wait for model to load
  await page.waitForSelector('[data-testid="model-loaded"]');
});

test('user can place marker', async ({ page }) => {
  await page.goto('/app/projects/test-project');
  await page.click('button:has-text("Place Marker")');

  // Click on canvas
  await page.click('canvas#xeokit-canvas', { position: { x: 200, y: 200 } });

  // Fill marker form
  await page.fill('input[name="title"]', 'Test marker');
  await page.selectOption('select[name="type"]', 'issue');
  await page.click('button:has-text("Create")');

  // Verify marker appears in list
  await expect(page.locator('text=Test marker')).toBeVisible();
});
```

### Performance Tests

```typescript
// scripts/performance-benchmark.ts
import { Viewer } from '@xeokit/xeokit-sdk';

async function benchmarkModelLoad(xktUrl: string) {
  const start = performance.now();

  const viewer = new Viewer({ /* ... */ });
  const model = viewer.scene.createModel({ src: xktUrl });

  await new Promise((resolve) => model.on('loaded', resolve));

  const loadTime = performance.now() - start;
  console.log(`Model loaded in ${loadTime}ms`);

  return { loadTime, elementCount: Object.keys(model.objects).length };
}
```

---

## Additional Resources

### Xeokit Documentation
- Official docs: https://xeokit.github.io/xeokit-sdk/docs/
- Examples: https://xeokit.github.io/xeokit-sdk/examples/

### Supabase
- Realtime: https://supabase.com/docs/guides/realtime
- Storage: https://supabase.com/docs/guides/storage
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### Next.js
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- App Router: https://nextjs.org/docs/app

---

**Document Version:** 1.0
**Last Updated:** January 2, 2026
**Maintainer:** GenHub Development Team
