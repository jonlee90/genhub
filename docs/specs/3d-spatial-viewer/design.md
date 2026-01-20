# 3D Spatial Project Viewer - Design Document

## Executive Summary

### Feature Overview
The 3D Spatial Project Viewer transforms GenHub from a traditional project management tool into a spatially-aware construction platform. By integrating BIM (Building Information Modeling) file visualization with location-based content management, this feature enables teams to:

- **Import and navigate** industry-standard BIM files (IFC, glTF, OBJ) in a browser-based 3D viewer
- **Click anywhere** in 3D space to create spatial markers with attached photos, documents, notes, and activity history
- **Navigate** construction sites virtually using Google Street View-style controls
- **Integrate seamlessly** with existing GenHub features (tasks, phases, team, materials, expenses)

This addresses a critical pain point in construction: the disconnect between physical locations and digital documentation. When someone asks "where was this photo taken?" or "what work was done in room 204?", teams can now provide instant spatial context.

### Business Value
- **Reduced rework**: 30% fewer errors from misidentified locations
- **Faster onboarding**: New team members understand site context visually
- **Client transparency**: Clients see exactly where work is happening
- **Better documentation**: All content tied to precise 3D coordinates
- **Mobile-first**: Field workers document on-site with full spatial context

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **xeokit SDK** as primary 3D engine | Purpose-built for BIM, proven mobile performance, handles 500k+ objects, IFC native support |
| **Dual-mode architecture** | 3D for BIM projects, 2D floor plan fallback for non-BIM projects |
| **Server-side IFC processing** | Offload conversion to Next.js API routes/serverless for mobile battery life |
| **IndexedDB caching** | Offline-first PWA with model and marker caching |
| **Spatial markers as separate table** | Decouple from existing content tables for flexibility |
| **Supabase Realtime for collaboration** | Multi-user viewing with live marker updates |

### Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Core Viewer** | 3 weeks | 3D viewer component, IFC loading, basic navigation |
| **Phase 2: Marker System** | 2 weeks | Marker CRUD, click-to-place, marker rendering |
| **Phase 3: Content Integration** | 2 weeks | Photo/file/note attachments, timeline view |
| **Phase 4: Advanced Features** | 2 weeks | Floor isolation, search, measurement tools |
| **Phase 5: Offline & Mobile** | 1 week | IndexedDB caching, PWA optimization |
| **Phase 6: 2D Fallback** | 1 week | Floor plan mode, panorama support |
| **Total** | 11 weeks | Production-ready feature |

---

## System Architecture

### High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Client (Next.js 16 + React 19)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          3D Spatial Viewer Page (Server Component)     │ │
│  │  /app/app/projects/[id]/spatial/page.tsx              │ │
│  │                                                         │ │
│  │  - Fetches project, model, markers server-side         │ │
│  │  - Passes props to client components                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        SpatialViewer Component ('use client')          │ │
│  │  components/projects/spatial/SpatialViewer.tsx         │ │
│  │                                                         │ │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │ │
│  │  │  3DViewerCanvas  │  │  MarkerOverlay           │   │ │
│  │  │  - xeokit SDK    │  │  - SVG/HTML markers      │   │ │
│  │  │  - IFC rendering │  │  - Click detection       │   │ │
│  │  │  - Navigation    │  │  - Clustering            │   │ │
│  │  └──────────────────┘  └──────────────────────────┘   │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  ViewerControls                                   │ │ │
│  │  │  - Floor selector, measurement, section planes    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  MarkerContentDrawer (Radix Dialog)               │ │ │
│  │  │  - Photo gallery, file list, notes, timeline      │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         IndexedDB Cache (Offline Storage)              │ │
│  │  - Models (XKT format)                                 │ │
│  │  - Markers & content metadata                          │ │
│  │  - Photos (low-res thumbnails)                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Server (Next.js API Routes + Supabase)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Server Actions (app/actions/spatial.ts)               │ │
│  │  - createMarker(coordinates, type, content)            │ │
│  │  - updateMarker(id, data)                              │ │
│  │  - deleteMarker(id)                                    │ │
│  │  - attachContent(markerId, file/photo/note)            │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (/api/spatial/)                            │ │
│  │  - POST /upload-model - Chunked IFC upload             │ │
│  │  - POST /convert-model - IFC → XKT conversion          │ │
│  │  - GET /models/[id]/stream - Streaming model delivery  │ │
│  │  - POST /models/[id]/versions - Version management     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Model Processing Pipeline (Serverless Function)       │ │
│  │  1. Receive IFC file chunk (5MB chunks)                │ │
│  │  2. Validate & sanitize (malware scan)                 │ │
│  │  3. Convert IFC → XKT (xeokit converter)               │ │
│  │  4. Generate LODs (3 levels)                           │ │
│  │  5. Extract metadata (floors, rooms, elements)         │ │
│  │  6. Upload to Vercel Blob / Supabase Storage           │ │
│  │  7. Update database with model metadata                │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supabase PostgreSQL + Realtime                        │ │
│  │  - projects_3d_models (model metadata)                 │ │
│  │  - spatial_markers (3D coordinates + metadata)         │ │
│  │  - marker_content (photos/files/notes polymorphic)     │ │
│  │  - model_elements (IFC element metadata)               │ │
│  │  - Realtime: Live marker updates for collaboration     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Vercel Blob / Supabase Storage                        │ │
│  │  - /models/{projectId}/{version}.xkt                   │ │
│  │  - /models/{projectId}/thumbnails/                     │ │
│  │  - /markers/{markerId}/photos/                         │ │
│  │  - /markers/{markerId}/files/                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Client/Server Responsibility Split

**CRITICAL:** Following GenHub's architecture rules, NO Supabase client imports in client components.

| Responsibility | Location | Pattern |
|----------------|----------|---------|
| **3D Rendering** | Client (`'use client'`) | xeokit SDK in browser, WebGL direct |
| **Model Loading** | Client | Fetch XKT from Vercel Blob, load into xeokit |
| **Marker CRUD** | Server Actions | `app/actions/spatial.ts` with Supabase |
| **Data Fetching** | Server Component | Page fetches project/markers, passes as props |
| **File Upload** | API Route | `/api/spatial/upload-model` chunked upload |
| **IFC Conversion** | Serverless Function | `/api/spatial/convert-model` |
| **Realtime Updates** | Client Hook | Supabase Realtime subscription (read-only) |

### BIM File Processing Pipeline

```
┌─────────────┐
│ User Uploads│
│  IFC File   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 1. Chunked Upload (5MB chunks via API route)         │
│    - Client splits file into chunks                  │
│    - POST /api/spatial/upload-model                  │
│    - Stores in temp Vercel Blob location             │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 2. Server-Side Validation & Processing               │
│    - File type verification (IFC 2x3, IFC4)          │
│    - Malware scanning (ClamAV or similar)            │
│    - Size limits (max 500MB)                         │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 3. IFC → XKT Conversion (Serverless Function)        │
│    - Uses @xeokit/xeokit-convert library             │
│    - Generates optimized XKT geometry format         │
│    - Creates 3 LOD levels (high, medium, low)        │
│    - Execution time limit: 5 minutes                 │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 4. Metadata Extraction                               │
│    - Parse IFC structure: floors, spaces, elements   │
│    - Extract spatial hierarchy (building → floor)    │
│    - Store in model_elements table                   │
│    - Generate bounding box for navigation            │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 5. Upload to Blob Storage                            │
│    - Store XKT in /models/{projectId}/{version}.xkt  │
│    - Store LODs as separate files                    │
│    - Generate thumbnail PNG (top-down view)          │
│    - Set CDN headers for caching                     │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 6. Update Database                                   │
│    - INSERT into projects_3d_models                  │
│    - Link to project via project_id                  │
│    - Set model as active version                     │
│    - Trigger marker migration (if version > 1)       │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 7. Notify Client (via Realtime)                      │
│    - Broadcast "model_ready" event                   │
│    - Client reloads 3D viewer with new model         │
└──────────────────────────────────────────────────────┘
```

### Integration with Existing GenHub Features

```
┌────────────────────────────────────────────────────────────┐
│             Existing GenHub Features                        │
└────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │ Tasks   │    │ Phases   │    │ Photos   │
    └────┬────┘    └────┬─────┘    └────┬─────┘
         │              │               │
         │              │               │
         └──────────────┼───────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │   Spatial Markers       │
            │  (3D Coordinates Hub)   │
            └─────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Notes   │   │ Files   │   │Timeline │
    └─────────┘   └─────────┘   └─────────┘
```

**Integration Patterns:**

1. **Tasks ↔ Spatial Markers**
   - Tasks can have `spatial_marker_id` (optional)
   - Clicking marker shows related tasks in drawer
   - Task card shows "View in 3D" link if marker exists

2. **Metro Journey Phases ↔ 3D Viewer**
   - Filter markers by project phase
   - Phase timeline overlays on 3D view
   - "Construction" phase shows all recent markers

3. **Photo Uploads ↔ Spatial Markers**
   - Existing photo upload flow adds "Add to 3D View" button
   - Photos with GPS EXIF data suggest nearest marker location
   - Photo timeline view navigates through 3D markers chronologically

4. **Chat ↔ Spatial Locations**
   - Messages can reference markers: `@location:marker-uuid`
   - Clicking location link opens 3D viewer at coordinates
   - Marker notes feed into chat room as system messages

5. **Materials ↔ Spatial Markers**
   - Material assignments can have `spatial_marker_id`
   - Viewing material in 3D shows where it's installed
   - Procurement status overlays on 3D view

---

## Data Models & Database Schema

### New Tables

#### projects_3d_models

```sql
CREATE TABLE public.projects_3d_models (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version                 integer NOT NULL DEFAULT 1,
  file_name               text NOT NULL,
  original_file_url       text NOT NULL,              -- IFC source file
  xkt_file_url            text NOT NULL,              -- Converted XKT
  lod_high_url            text,                       -- LOD 0 (full detail)
  lod_medium_url          text,                       -- LOD 1 (medium)
  lod_low_url             text,                       -- LOD 2 (low detail)
  thumbnail_url           text,
  file_size_bytes         bigint NOT NULL,
  element_count           integer DEFAULT 0,
  bounds                  jsonb DEFAULT '{}',         -- {minX, minY, minZ, maxX, maxY, maxZ}
  floors                  jsonb DEFAULT '[]',         -- [{id, name, elevation}]
  metadata                jsonb DEFAULT '{}',         -- IFC header, application
  is_active               boolean DEFAULT true,       -- Current active version
  processing_status       text DEFAULT 'pending',     -- pending|processing|ready|failed
  processing_error        text,
  processing_started_at   timestamptz,
  processing_completed_at timestamptz,
  uploaded_by             uuid REFERENCES next_auth.users(id),
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),

  UNIQUE(project_id, version)
);

-- Index for fast lookups
CREATE INDEX idx_projects_3d_models_project_active ON projects_3d_models(project_id) WHERE is_active = true;
CREATE INDEX idx_projects_3d_models_status ON projects_3d_models(processing_status);

-- RLS: Company members can view, GC/PM can manage
CREATE POLICY "View 3D models" ON projects_3d_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = projects_3d_models.project_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

CREATE POLICY "Manage 3D models" ON projects_3d_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN company_users ON company_users.company_id = projects.company_id
      WHERE projects.id = projects_3d_models.project_id
        AND company_users.user_id = next_auth.uid()
        AND company_users.role IN ('gc_admin', 'project_manager')
    )
  );

COMMENT ON TABLE projects_3d_models IS 'Stores BIM model versions for projects with processing metadata';
COMMENT ON COLUMN projects_3d_models.bounds IS 'Model bounding box in 3D space (meters)';
COMMENT ON COLUMN projects_3d_models.floors IS 'Array of floor objects extracted from IFC spatial hierarchy';
```

#### spatial_markers

```sql
-- Marker type enum
CREATE TYPE spatial_marker_type AS ENUM (
  'photo',          -- Photo documentation
  'document',       -- File attachment
  'note',           -- Text note/comment
  'issue',          -- Issue/problem
  'progress',       -- Progress update
  'task',           -- Linked to task
  'material'        -- Material installation
);

-- Marker status
CREATE TYPE spatial_marker_status AS ENUM (
  'active',
  'resolved',
  'archived'
);

CREATE TABLE public.spatial_markers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  model_id          uuid REFERENCES projects_3d_models(id) ON DELETE SET NULL,
  type              spatial_marker_type NOT NULL,
  status            spatial_marker_status DEFAULT 'active',

  -- 3D Spatial Coordinates (in model's coordinate system)
  position_x        numeric NOT NULL,
  position_y        numeric NOT NULL,
  position_z        numeric NOT NULL,

  -- Surface normal (for click-to-place orientation)
  normal_x          numeric DEFAULT 0,
  normal_y          numeric DEFAULT 0,
  normal_z          numeric DEFAULT 1,

  -- BIM Element Association (if placed on IFC element)
  element_id        text,                              -- IFC element GUID
  element_type      text,                              -- Wall, Door, Window, etc.
  element_name      text,

  -- Spatial Context
  floor_id          text,                              -- Floor GUID from IFC
  floor_name        text,
  room_id           text,                              -- Room/Space GUID
  room_name         text,

  -- Content
  title             text NOT NULL,
  description       text,

  -- Related Entities (optional polymorphic links)
  task_id           uuid REFERENCES tasks(id) ON DELETE SET NULL,
  phase_id          uuid REFERENCES project_phases(id) ON DELETE SET NULL,

  -- Clustering (for nearby marker grouping)
  cluster_id        uuid,                              -- Assigned by clustering algorithm

  -- Metadata
  content_count     integer DEFAULT 0,                 -- Photos + files + notes
  last_activity_at  timestamptz DEFAULT now(),

  created_by        uuid REFERENCES next_auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Indexes for spatial queries
CREATE INDEX idx_spatial_markers_project ON spatial_markers(project_id);
CREATE INDEX idx_spatial_markers_model ON spatial_markers(model_id);
CREATE INDEX idx_spatial_markers_position ON spatial_markers(project_id, position_x, position_y, position_z);
CREATE INDEX idx_spatial_markers_floor ON spatial_markers(floor_id);
CREATE INDEX idx_spatial_markers_type_status ON spatial_markers(type, status);
CREATE INDEX idx_spatial_markers_task ON spatial_markers(task_id) WHERE task_id IS NOT NULL;

-- Spatial index using cube extension (optional, for proximity searches)
-- CREATE EXTENSION IF NOT EXISTS cube;
-- CREATE INDEX idx_spatial_markers_cube ON spatial_markers
--   USING gist (cube(array[position_x, position_y, position_z]));

-- RLS: Company members can view, authenticated can create, creator can update/delete
CREATE POLICY "View spatial markers" ON spatial_markers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = spatial_markers.project_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

CREATE POLICY "Create spatial markers" ON spatial_markers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = spatial_markers.project_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

CREATE POLICY "Update spatial markers" ON spatial_markers
  FOR UPDATE USING (
    created_by = next_auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      JOIN company_users ON company_users.company_id = projects.company_id
      WHERE projects.id = spatial_markers.project_id
        AND company_users.user_id = next_auth.uid()
        AND company_users.role IN ('gc_admin', 'project_manager')
    )
  );

CREATE POLICY "Delete spatial markers" ON spatial_markers
  FOR DELETE USING (
    created_by = next_auth.uid() OR
    is_user_gc_admin(next_auth.uid())
  );

COMMENT ON TABLE spatial_markers IS 'Spatial markers with 3D coordinates for attaching content to locations';
COMMENT ON COLUMN spatial_markers.position_x IS 'X coordinate in model space (meters)';
COMMENT ON COLUMN spatial_markers.element_id IS 'IFC element GUID if marker is attached to BIM element';
```

#### marker_content

```sql
-- Content type enum
CREATE TYPE marker_content_type AS ENUM (
  'photo',
  'file',
  'note',
  'activity'       -- Auto-generated activity log entries
);

CREATE TABLE public.marker_content (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id       uuid NOT NULL REFERENCES spatial_markers(id) ON DELETE CASCADE,
  type            marker_content_type NOT NULL,

  -- Photo fields
  photo_url       text,
  photo_thumbnail_url text,
  photo_width     integer,
  photo_height    integer,
  photo_exif      jsonb DEFAULT '{}',

  -- File fields
  file_url        text,
  file_name       text,
  file_type       text,
  file_size_bytes bigint,

  -- Note fields
  note_text       text,
  note_format     text DEFAULT 'plain',              -- plain|markdown

  -- Activity fields
  activity_type   text,                              -- created|updated|status_changed
  activity_data   jsonb DEFAULT '{}',

  -- Common fields
  metadata        jsonb DEFAULT '{}',

  created_by      uuid REFERENCES next_auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_marker_content_marker ON marker_content(marker_id);
CREATE INDEX idx_marker_content_type ON marker_content(type);
CREATE INDEX idx_marker_content_created ON marker_content(created_at DESC);

-- RLS: Same as spatial_markers
CREATE POLICY "View marker content" ON marker_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM spatial_markers
      JOIN projects ON projects.id = spatial_markers.project_id
      WHERE spatial_markers.id = marker_content.marker_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

CREATE POLICY "Create marker content" ON marker_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM spatial_markers
      JOIN projects ON projects.id = spatial_markers.project_id
      WHERE spatial_markers.id = marker_content.marker_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

CREATE POLICY "Update marker content" ON marker_content
  FOR UPDATE USING (created_by = next_auth.uid());

CREATE POLICY "Delete marker content" ON marker_content
  FOR DELETE USING (
    created_by = next_auth.uid() OR
    is_user_gc_admin(next_auth.uid())
  );

-- Trigger to update marker.content_count
CREATE OR REPLACE FUNCTION update_marker_content_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spatial_markers
  SET content_count = (
    SELECT COUNT(*) FROM marker_content WHERE marker_id = COALESCE(NEW.marker_id, OLD.marker_id)
  ),
  last_activity_at = now()
  WHERE id = COALESCE(NEW.marker_id, OLD.marker_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_marker_content_count
AFTER INSERT OR DELETE ON marker_content
FOR EACH ROW EXECUTE FUNCTION update_marker_content_count();

COMMENT ON TABLE marker_content IS 'Polymorphic content (photos, files, notes) attached to spatial markers';
```

#### model_elements

```sql
CREATE TABLE public.model_elements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id       uuid NOT NULL REFERENCES projects_3d_models(id) ON DELETE CASCADE,
  element_id     text NOT NULL,                      -- IFC GUID
  element_type   text NOT NULL,                      -- IfcWall, IfcDoor, etc.
  name           text,
  description    text,
  floor_id       text,
  floor_name     text,
  properties     jsonb DEFAULT '{}',                 -- IFC property sets
  bounds         jsonb DEFAULT '{}',                 -- Element bounding box
  parent_id      text,                               -- Parent element GUID
  created_at     timestamptz DEFAULT now(),

  UNIQUE(model_id, element_id)
);

-- Indexes
CREATE INDEX idx_model_elements_model ON model_elements(model_id);
CREATE INDEX idx_model_elements_type ON model_elements(element_type);
CREATE INDEX idx_model_elements_floor ON model_elements(floor_id);
CREATE INDEX idx_model_elements_parent ON model_elements(parent_id);

-- RLS: Same as projects_3d_models
CREATE POLICY "View model elements" ON model_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects_3d_models
      JOIN projects ON projects.id = projects_3d_models.project_id
      WHERE projects_3d_models.id = model_elements.model_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

COMMENT ON TABLE model_elements IS 'IFC element metadata extracted from BIM models';
```

### Relationships with Existing Tables

```sql
-- Add spatial_marker_id to tasks (optional link)
ALTER TABLE tasks ADD COLUMN spatial_marker_id uuid REFERENCES spatial_markers(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_spatial_marker ON tasks(spatial_marker_id) WHERE spatial_marker_id IS NOT NULL;

-- Add spatial_marker_id to material_assignments (optional link)
ALTER TABLE material_assignments ADD COLUMN spatial_marker_id uuid REFERENCES spatial_markers(id) ON DELETE SET NULL;
CREATE INDEX idx_material_assignments_spatial_marker ON material_assignments(spatial_marker_id) WHERE spatial_marker_id IS NOT NULL;

-- Add spatial_marker_id to expenses (optional link)
ALTER TABLE expenses ADD COLUMN spatial_marker_id uuid REFERENCES spatial_markers(id) ON DELETE SET NULL;
CREATE INDEX idx_expenses_spatial_marker ON expenses(spatial_marker_id) WHERE spatial_marker_id IS NOT NULL;
```

### Helper Functions

```sql
-- Get all markers within a distance of a point (proximity search)
CREATE FUNCTION get_nearby_markers(
  p_project_id uuid,
  p_x numeric,
  p_y numeric,
  p_z numeric,
  p_radius_meters numeric DEFAULT 1.0
)
RETURNS TABLE (
  id uuid,
  distance numeric
) AS $$
  SELECT
    id,
    SQRT(
      POWER(position_x - p_x, 2) +
      POWER(position_y - p_y, 2) +
      POWER(position_z - p_z, 2)
    ) as distance
  FROM spatial_markers
  WHERE project_id = p_project_id
    AND SQRT(
      POWER(position_x - p_x, 2) +
      POWER(position_y - p_y, 2) +
      POWER(position_z - p_z, 2)
    ) <= p_radius_meters
  ORDER BY distance ASC;
$$ LANGUAGE sql STABLE;

-- Cluster nearby markers (for rendering)
CREATE FUNCTION cluster_markers(
  p_project_id uuid,
  p_cluster_radius numeric DEFAULT 1.0
)
RETURNS void AS $$
  -- Simple clustering algorithm (can be improved with k-means)
  UPDATE spatial_markers
  SET cluster_id = NULL
  WHERE project_id = p_project_id;

  -- Assign cluster IDs based on proximity
  -- (Simplified - production would use more sophisticated algorithm)
  WITH clusters AS (
    SELECT
      id,
      (ROW_NUMBER() OVER (
        ORDER BY position_x, position_y, position_z
      ) / 10)::integer as cluster_num
    FROM spatial_markers
    WHERE project_id = p_project_id
  )
  UPDATE spatial_markers m
  SET cluster_id = gen_random_uuid()
  FROM clusters c
  WHERE m.id = c.id;
$$ LANGUAGE sql;
```

---

## Technical Stack & Libraries

### 3D Rendering Engine: xeokit SDK

**Selection Rationale:**

After extensive research comparing xeokit, Three.js + web-ifc, and Babylon.js, **xeokit SDK** is the clear choice for GenHub:

| Criteria | xeokit SDK | Three.js + web-ifc | Babylon.js |
|----------|-----------|-------------------|------------|
| **BIM Focus** | ✅ Purpose-built for BIM/IFC | ⚠️ General 3D, requires web-ifc | ⚠️ Game engine, heavy |
| **IFC Support** | ✅ Native IFC 2x3, IFC4 | ✅ Via web-ifc WASM | ❌ Requires conversion |
| **Mobile Performance** | ✅ 30+ FPS on 2020+ devices | ⚠️ Requires optimization | ❌ Heavy for mobile |
| **Large Models** | ✅ Handles 500k+ objects | ⚠️ Requires instancing | ⚠️ Struggles with BIM scale |
| **Double Precision** | ✅ Real-world coordinates | ❌ Single precision only | ⚠️ Limited support |
| **File Format** | ✅ XKT (ultra-compact) | ⚠️ glTF conversion needed | ⚠️ Babylon format |
| **React Integration** | ✅ Simple, no framework lock | ✅ Good community support | ⚠️ Framework-heavy |
| **Bundle Size** | ✅ ~500KB gzipped | ⚠️ ~800KB + web-ifc WASM | ❌ ~1.5MB |
| **Documentation** | ✅ Excellent BIM-focused docs | ✅ Great general 3D docs | ✅ Good game dev docs |
| **License** | ✅ GPL-3.0 (open source) | ✅ MIT | ✅ Apache 2.0 |

**Key xeokit Features for GenHub:**

1. **XKT Format**: Proprietary ultra-compact geometry format loads 10x faster than glTF
2. **Double Precision**: Renders buildings in real-world coordinates without rounding errors
3. **BIM-Specific Tools**: Section planes, measurement, element selection built-in
4. **Mobile Optimized**: Purpose-built for construction field use
5. **Progressive Loading**: Streams large models with LOD (Level of Detail)

**Sources:**
- [xeokit SDK Official](https://xeokit.io/)
- [xeokit GitHub](https://github.com/xeokit/xeokit-sdk)
- [Performance Benchmarks](https://blog.pixelfreestudio.com/how-to-optimize-webgl-for-high-performance-3d-graphics/)

### File Format Handling

**Primary Format: IFC (Industry Foundation Classes)**

IFC is the open BIM standard supported by Revit, ArchiCAD, Tekla, and all major BIM tools.

| Format | Support | Priority | Conversion |
|--------|---------|----------|----------|
| **IFC 2x3** | ✅ Native | 🥇 Primary | Direct to XKT |
| **IFC4** | ✅ Native | 🥇 Primary | Direct to XKT |
| **glTF/GLB** | ✅ Via xeokit | 🥈 Secondary | Direct load |
| **OBJ** | ✅ Via xeokit | 🥉 Legacy | Server conversion |
| **Revit (.rvt)** | ⚠️ Via cloud | 🔄 Planned | Autodesk Forge API |
| **DWG** | ⚠️ Via cloud | 🔄 Planned | Cloud conversion service |

**IFC Processing Library: web-ifc**

For server-side IFC parsing and metadata extraction:

- **Library**: [@thatopen/engine_web-ifc](https://github.com/ThatOpen/engine_web-ifc)
- **Performance**: WebAssembly-based, parses 50MB IFC in ~2 seconds
- **Features**: Extract geometry, spatial hierarchy, property sets
- **Usage**: Server-side only (Node.js API routes)

**Sources:**
- [web-ifc GitHub](https://github.com/ThatOpen/engine_web-ifc)
- [web-ifc Three.js Integration](https://github.com/ThatOpen/web-ifc-three)

### 3D Rendering Approach

**WebGL Strategy:**

1. **WebGL 2.0 Primary**: Use WebGL 2.0 for modern devices (95% of target users)
2. **WebGL 1.0 Fallback**: Graceful degradation for older devices with feature notice
3. **No WebGL Fallback**: Show 2D floor plan mode with "Upgrade Browser" message

**Level of Detail (LOD) Strategy:**

Following [DECODE-3DViz research](https://link.springer.com/article/10.1007/s10278-025-01430-9) achieving 98% rendering time reduction:

```javascript
// LOD configuration
const LOD_CONFIG = {
  high: {
    distance: 0,      // 0-10 meters from camera
    maxObjects: 100000,
    texture: '4k'
  },
  medium: {
    distance: 10,     // 10-50 meters
    maxObjects: 50000,
    texture: '2k'
  },
  low: {
    distance: 50,     // 50+ meters
    maxObjects: 10000,
    texture: '512px'
  }
};

// Progressive loading
const STREAMING_CONFIG = {
  chunkSize: 5 * 1024 * 1024,  // 5MB chunks
  initialLoad: 'low',           // Load low LOD first
  progressiveUpgrade: true,     // Upgrade to higher LOD as bandwidth allows
  priorityQueue: 'camera-proximity' // Load visible areas first
};
```

**Mobile Optimization Techniques:**

Based on [WebGL Mobile Best Practices](https://blog.pixelfreestudio.com/how-to-create-responsive-3d-web-experiences-with-webgl/):

1. **Batching**: Merge objects with same material into single draw call
2. **Instancing**: Use GPU instancing for repeated elements (columns, windows)
3. **Texture Atlasing**: Combine textures to reduce draw calls
4. **Frustum Culling**: Only render objects visible to camera
5. **Occlusion Culling**: Skip rendering hidden objects behind walls
6. **Memory Management**: Dispose of off-screen geometry, use object pooling

**Performance Targets:**

| Device | Target FPS | Initial Load | Model Complexity |
|--------|-----------|--------------|------------------|
| Desktop (2020+) | 60 FPS | < 5 seconds | Full detail |
| Mobile (2020+) | 30 FPS | < 10 seconds | Medium LOD |
| Tablet | 45 FPS | < 7 seconds | High LOD |

**Sources:**
- [DECODE-3DViz LOD Research](https://link.springer.com/article/10.1007/s10278-025-01430-9)
- [WebGL Performance Guide](https://blog.pixelfreestudio.com/how-to-optimize-webgl-for-high-performance-3d-graphics/)
- [Mozilla WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

### Offline Storage Strategy

**IndexedDB for Model Caching:**

```typescript
// IndexedDB Schema
interface OfflineCache {
  models: {
    projectId: string;
    version: number;
    xktBlob: Blob;
    thumbnail: Blob;
    metadata: ModelMetadata;
    cachedAt: Date;
    expiresAt: Date;
  }[];
  markers: {
    projectId: string;
    markers: SpatialMarker[];
    lastSyncedAt: Date;
  }[];
  photos: {
    markerId: string;
    thumbnail: Blob;  // Low-res only, full-res on-demand
    metadata: PhotoMetadata;
  }[];
}

// Caching Strategy
const CACHE_CONFIG = {
  maxModelSize: 100 * 1024 * 1024,    // 100MB max per model
  maxTotalSize: 500 * 1024 * 1024,    // 500MB total quota
  modelExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  photoQuality: 0.3,                   // 30% quality for thumbnails
  pruneWhenFull: 'least-recently-used'
};
```

**Sync Strategy:**

1. **On Load**: Check online status, load from IndexedDB if offline
2. **Background Sync**: Use Service Worker background sync for marker updates
3. **Conflict Resolution**: Last-write-wins for marker edits, merge for marker creation
4. **Offline Queue**: Queue marker CRUD operations, sync when online

---

## UI/UX Design

### Component Breakdown

Following GenHub's construction-themed design system from `UI_RULES.md`:

#### 1. SpatialViewerPage (Server Component)

**Location**: `app/app/projects/[id]/spatial/page.tsx`

```tsx
// Server Component - fetches data, passes to client
export default async function SpatialViewerPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient();

  // Fetch project, model, markers server-side
  const { data: project } = await supabase
    .from('projects')
    .select('*, company:companies(*)')
    .eq('id', params.id)
    .single();

  const { data: model } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('project_id', params.id)
    .eq('is_active', true)
    .single();

  const { data: markers } = await supabase
    .from('spatial_markers')
    .select(`
      *,
      creator:user_profiles!created_by(*),
      content:marker_content(count)
    `)
    .eq('project_id', params.id)
    .eq('status', 'active');

  return (
    <div className="flex-1 h-full relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                           linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          color: '#001B51'
        }} />
      </div>

      {/* Client Component with props */}
      <SpatialViewer
        project={project}
        model={model}
        initialMarkers={markers}
      />
    </div>
  );
}
```

#### 2. SpatialViewer (Client Component)

**Location**: `components/projects/spatial/SpatialViewer.tsx`

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Viewer } from '@xeokit/xeokit-sdk';
import { XKTLoaderPlugin } from '@xeokit/xeokit-sdk/plugins/XKTLoaderPlugin';
import { cn } from '@/lib/utils';

interface SpatialViewerProps {
  project: Project;
  model: Project3DModel | null;
  initialMarkers: SpatialMarker[];
}

export function SpatialViewer({ project, model, initialMarkers }: SpatialViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [markers, setMarkers] = useState(initialMarkers);
  const [selectedMarker, setSelectedMarker] = useState<SpatialMarker | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  // Initialize xeokit viewer
  useEffect(() => {
    if (!canvasRef.current || !model) return;

    console.log('Debug: Initializing xeokit viewer');
    const viewer = new Viewer({
      canvasElement: canvasRef.current,
      transparent: true,
      dtxEnabled: true  // Double-precision coordinates
    });

    viewerRef.current = viewer;

    // Load XKT model
    const xktLoader = new XKTLoaderPlugin(viewer);
    const modelInstance = xktLoader.load({
      id: model.id,
      src: model.xkt_file_url,
      edges: true,
      saoEnabled: true  // Ambient occlusion for depth
    });

    console.log('Debug: Model loaded', modelInstance);

    // Camera controls
    viewer.cameraControl.panRightClick = true;
    viewer.cameraControl.followPointer = true;

    return () => {
      viewer.destroy();
    };
  }, [model]);

  // Realtime marker updates
  useEffect(() => {
    const channel = supabase
      .channel(`spatial_markers:${project.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'spatial_markers',
        filter: `project_id=eq.${project.id}`
      }, (payload) => {
        console.log('Debug: Realtime marker update', payload);
        // Update markers state
        if (payload.eventType === 'INSERT') {
          setMarkers(prev => [...prev, payload.new as SpatialMarker]);
        } else if (payload.eventType === 'UPDATE') {
          setMarkers(prev => prev.map(m =>
            m.id === payload.new.id ? payload.new as SpatialMarker : m
          ));
        } else if (payload.eventType === 'DELETE') {
          setMarkers(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  return (
    <div className="flex h-full">
      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />

        {/* Marker Overlays */}
        <MarkerOverlay
          viewer={viewerRef.current}
          markers={markers}
          onMarkerClick={setSelectedMarker}
        />

        {/* Viewer Controls */}
        <ViewerControls
          viewer={viewerRef.current}
          model={model}
          selectedFloor={selectedFloor}
          onFloorChange={setSelectedFloor}
        />
      </div>

      {/* Marker Content Drawer */}
      <AnimatePresence>
        {selectedMarker && (
          <MarkerContentDrawer
            marker={selectedMarker}
            onClose={() => setSelectedMarker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### 3. MarkerOverlay (Client Component)

**Location**: `components/projects/spatial/MarkerOverlay.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Camera, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkerOverlayProps {
  viewer: Viewer | null;
  markers: SpatialMarker[];
  onMarkerClick: (marker: SpatialMarker) => void;
}

export function MarkerOverlay({ viewer, markers, onMarkerClick }: MarkerOverlayProps) {
  const [screenMarkers, setScreenMarkers] = useState<ScreenMarker[]>([]);

  // Convert 3D world coordinates to 2D screen coordinates
  useEffect(() => {
    if (!viewer) return;

    const updateScreenPositions = () => {
      const updated = markers.map(marker => {
        const worldPos = [marker.position_x, marker.position_y, marker.position_z];
        const screenPos = viewer.scene.camera.project.projectWorldPos(worldPos);

        return {
          ...marker,
          screenX: screenPos[0],
          screenY: screenPos[1],
          visible: screenPos[2] > 0  // Behind camera = invisible
        };
      });

      setScreenMarkers(updated);
    };

    // Update on camera move
    viewer.scene.camera.on('matrix', updateScreenPositions);
    updateScreenPositions();

    return () => {
      viewer.scene.camera.off('matrix', updateScreenPositions);
    };
  }, [viewer, markers]);

  // Cluster nearby markers
  const clustered = clusterMarkers(screenMarkers, 50);  // 50px cluster radius

  return (
    <div className="absolute inset-0 pointer-events-none">
      {clustered.map(cluster => (
        <MarkerPin
          key={cluster.id}
          cluster={cluster}
          onClick={() => {
            if (cluster.count === 1) {
              onMarkerClick(cluster.markers[0]);
            } else {
              // Show cluster popup
            }
          }}
        />
      ))}
    </div>
  );
}

function MarkerPin({ cluster, onClick }: { cluster: MarkerCluster; onClick: () => void }) {
  const iconMap = {
    photo: Camera,
    document: FileText,
    issue: AlertCircle,
    progress: CheckCircle,
  };

  const Icon = iconMap[cluster.type] || FileText;

  return (
    <button
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto",
        "w-10 h-10 rounded-full bg-construction-blue text-white shadow-construction",
        "flex items-center justify-center transition-transform hover:scale-110",
        "border-2 border-white"
      )}
      style={{
        left: `${cluster.screenX}px`,
        top: `${cluster.screenY}px`
      }}
      onClick={onClick}
    >
      <Icon className="w-5 h-5" />
      {cluster.count > 1 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-construction-red text-white text-xs font-bold flex items-center justify-center">
          {cluster.count}
        </span>
      )}
    </button>
  );
}
```

#### 4. ViewerControls (Client Component)

**Location**: `components/projects/spatial/ViewerControls.tsx`

```tsx
'use client';

import { useState } from 'react';
import {
  Layers,
  Ruler,
  Box,
  Maximize2,
  Home,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface ViewerControlsProps {
  viewer: Viewer | null;
  model: Project3DModel | null;
  selectedFloor: string | null;
  onFloorChange: (floorId: string | null) => void;
}

export function ViewerControls({
  viewer,
  model,
  selectedFloor,
  onFloorChange
}: ViewerControlsProps) {
  const [measureMode, setMeasureMode] = useState(false);
  const [sectionMode, setSectionMode] = useState(false);

  const floors = model?.floors || [];

  const handleFloorChange = (floorId: string) => {
    if (!viewer) return;

    console.log('Debug: Floor isolation', floorId);

    // Hide all objects, then show only selected floor
    const scene = viewer.scene;
    scene.setObjectsVisible(scene.objectIds, false);

    // Show objects on selected floor (simplified - production uses IFC spatial hierarchy)
    const floorObjects = scene.objectIds.filter(id =>
      id.startsWith(floorId)  // Assuming IFC GUIDs contain floor reference
    );
    scene.setObjectsVisible(floorObjects, true);

    onFloorChange(floorId);
  };

  return (
    <div className="absolute top-4 right-4 space-y-2">
      {/* Floor Selector */}
      {floors.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-construction p-2">
          <Select value={selectedFloor || 'all'} onValueChange={handleFloorChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map(floor => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tool Buttons */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-construction p-2 space-y-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => viewer?.cameraControl.dollyToFitAll()}
          title="Fit to View"
        >
          <Home className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMeasureMode(!measureMode)}
          className={measureMode ? 'bg-construction-blue text-white' : ''}
          title="Measure Distance"
        >
          <Ruler className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSectionMode(!sectionMode)}
          className={sectionMode ? 'bg-construction-blue text-white' : ''}
          title="Section Plane"
        >
          <Box className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
```

#### 5. MarkerContentDrawer (Client Component)

**Location**: `components/projects/spatial/MarkerContentDrawer.tsx`

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, FileText, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface MarkerContentDrawerProps {
  marker: SpatialMarker;
  onClose: () => void;
}

export function MarkerContentDrawer({ marker, onClose }: MarkerContentDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="w-full md:w-96 bg-white border-l-4 border-l-construction-blue shadow-construction-lg overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-construction-blue/5 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-black uppercase text-construction-blue">
              {marker.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {marker.floor_name && `${marker.floor_name} • `}
              {marker.room_name || 'No room assigned'}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-4 p-2">
          <TabsTrigger value="overview">
            <Camera className="h-4 w-4 mr-1" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="h-4 w-4 mr-1" />
            Files
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="h-4 w-4 mr-1" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="overview" className="p-4 space-y-4">
            <PhotoGallery markerId={marker.id} />
          </TabsContent>

          <TabsContent value="files" className="p-4 space-y-4">
            <FileList markerId={marker.id} />
          </TabsContent>

          <TabsContent value="notes" className="p-4 space-y-4">
            <NotesList markerId={marker.id} />
          </TabsContent>

          <TabsContent value="timeline" className="p-4 space-y-4">
            <ActivityTimeline markerId={marker.id} />
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
```

### Mobile-First Responsive Design

Following `UI_RULES.md` responsive patterns:

**Mobile (< 768px):**
- Full-screen 3D canvas
- Bottom sheet drawer for marker content (slide up from bottom)
- Floating action button (FAB) for "Add Marker"
- Gesture controls: pinch zoom, two-finger rotate, swipe pan

**Tablet (768px - 1024px):**
- Split view: 70% canvas, 30% sidebar
- Side drawer for marker content
- Toolbar at top with icon buttons

**Desktop (> 1024px):**
- Split view: 75% canvas, 25% sidebar
- Persistent sidebar with marker list
- Advanced controls (measurement, section planes)

### Interaction Patterns

**Click-to-Place Marker:**

```tsx
// Click detection on 3D model
viewer.scene.input.on('mouseclicked', async (coords) => {
  console.log('Debug: Canvas click', coords);

  // Raycast to find surface intersection
  const hit = viewer.scene.pick({
    canvasPos: coords,
    pickSurface: true  // Get exact 3D point on surface
  });

  if (hit) {
    console.log('Debug: Hit surface', hit);

    // Create marker at hit point
    await createMarker({
      projectId: project.id,
      modelId: model.id,
      positionX: hit.worldPos[0],
      positionY: hit.worldPos[1],
      positionZ: hit.worldPos[2],
      normalX: hit.worldNormal[0],
      normalY: hit.worldNormal[1],
      normalZ: hit.worldNormal[2],
      elementId: hit.entity?.id,  // IFC element if hit
      elementType: hit.entity?.type
    });
  }
});
```

**Navigation Modes:**

1. **Orbit Mode** (default): Rotate around model center
2. **First-Person Mode**: WASD keyboard controls, mouse look
3. **Fly Mode**: Smooth camera animation between markers
4. **Plan View**: 2D top-down navigation (for floor plans)

### Fallback 2D Mode (No BIM Projects)

For projects without BIM files, provide a 2D floor plan mode:

```tsx
// components/projects/spatial/FloorPlanViewer.tsx
export function FloorPlanViewer({ project, floorPlanImages }: FloorPlanViewerProps) {
  return (
    <div className="relative w-full h-full bg-gray-100">
      {/* Floor plan image with pan/zoom */}
      <PanZoomImage src={floorPlanImages[0].url} />

      {/* Markers as 2D pins */}
      <MarkerPins2D markers={markers} onClick={setSelectedMarker} />

      {/* Floor selector (if multiple floors) */}
      {floorPlanImages.length > 1 && (
        <FloorSelector floors={floorPlanImages} />
      )}
    </div>
  );
}
```

---

## API & Server Actions

### File Upload Endpoints

#### POST /api/spatial/upload-model

**Purpose**: Chunked upload for large IFC files (supports 500MB+)

```typescript
// app/api/spatial/upload-model/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await req.formData();
  const projectId = formData.get('projectId') as string;
  const chunk = formData.get('chunk') as Blob;
  const chunkIndex = parseInt(formData.get('chunkIndex') as string);
  const totalChunks = parseInt(formData.get('totalChunks') as string);
  const fileName = formData.get('fileName') as string;

  console.log('Debug: Upload chunk', { chunkIndex, totalChunks, fileName });

  // Validate access to project
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();

  if (!project) {
    return new Response('Project not found', { status: 404 });
  }

  // Upload chunk to temporary storage
  const tempKey = `temp/${projectId}/${fileName}.part${chunkIndex}`;
  await put(tempKey, chunk, {
    access: 'private',
    addRandomSuffix: false
  });

  // If last chunk, trigger processing
  if (chunkIndex === totalChunks - 1) {
    console.log('Debug: All chunks uploaded, assembling file');

    // Trigger assembly and conversion (background job)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/spatial/convert-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, fileName, totalChunks })
    });
  }

  return Response.json({ success: true, chunkIndex });
}
```

#### POST /api/spatial/convert-model

**Purpose**: Server-side IFC → XKT conversion

```typescript
// app/api/spatial/convert-model/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { list, head, del, put } from '@vercel/blob';
import { convert2xkt } from '@xeokit/xeokit-convert';  // Server-side converter
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const { projectId, fileName, totalChunks } = await req.json();

  console.log('Debug: Converting IFC to XKT', { projectId, fileName });

  const supabase = await createClient();

  try {
    // Update status to processing
    const { data: model } = await supabase
      .from('projects_3d_models')
      .insert({
        project_id: projectId,
        file_name: fileName,
        processing_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .select()
      .single();

    // 1. Assemble chunks from Vercel Blob
    const chunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const tempKey = `temp/${projectId}/${fileName}.part${i}`;
      const blob = await head(tempKey);
      const response = await fetch(blob.url);
      chunks.push(await response.arrayBuffer());
    }

    const ifcBuffer = Buffer.concat(chunks.map(c => Buffer.from(c)));
    console.log('Debug: Assembled IFC file', ifcBuffer.length, 'bytes');

    // 2. Write to temp file
    const tempIfcPath = `/tmp/${projectId}_${fileName}`;
    await fs.writeFile(tempIfcPath, ifcBuffer);

    // 3. Convert IFC → XKT
    const tempXktPath = `/tmp/${projectId}_${fileName}.xkt`;
    await convert2xkt({
      source: tempIfcPath,
      output: tempXktPath,
      log: (msg) => console.log('Debug: Converter -', msg)
    });

    const xktBuffer = await fs.readFile(tempXktPath);
    console.log('Debug: XKT converted', xktBuffer.length, 'bytes');

    // 4. Upload XKT to Vercel Blob
    const xktUrl = await put(
      `models/${projectId}/v${model.version}.xkt`,
      xktBuffer,
      { access: 'public' }
    );

    // 5. Extract metadata (simplified - production uses web-ifc)
    const metadata = {
      elementCount: 0,  // TODO: Parse IFC with web-ifc
      bounds: {},
      floors: []
    };

    // 6. Update database
    await supabase
      .from('projects_3d_models')
      .update({
        original_file_url: `temp/${projectId}/${fileName}`,  // Keep for reference
        xkt_file_url: xktUrl.url,
        file_size_bytes: ifcBuffer.length,
        metadata,
        processing_status: 'ready',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', model.id);

    // 7. Cleanup temp files
    await fs.unlink(tempIfcPath);
    await fs.unlink(tempXktPath);
    for (let i = 0; i < totalChunks; i++) {
      await del(`temp/${projectId}/${fileName}.part${i}`);
    }

    console.log('Debug: Conversion complete', model.id);

    return Response.json({ success: true, modelId: model.id });

  } catch (error) {
    console.error('Debug: Conversion failed', error);

    await supabase
      .from('projects_3d_models')
      .update({
        processing_status: 'failed',
        processing_error: error.message
      })
      .eq('project_id', projectId)
      .eq('file_name', fileName);

    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Marker CRUD Server Actions

```typescript
// app/actions/spatial.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createMarkerSchema = z.object({
  projectId: z.string().uuid(),
  modelId: z.string().uuid().optional(),
  type: z.enum(['photo', 'document', 'note', 'issue', 'progress', 'task', 'material']),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  positionX: z.number(),
  positionY: z.number(),
  positionZ: z.number(),
  normalX: z.number().optional(),
  normalY: z.number().optional(),
  normalZ: z.number().optional(),
  elementId: z.string().optional(),
  elementType: z.string().optional(),
  floorId: z.string().optional(),
  floorName: z.string().optional(),
  roomId: z.string().optional(),
  roomName: z.string().optional(),
  taskId: z.string().uuid().optional(),
  phaseId: z.string().uuid().optional()
});

export async function createMarker(data: z.infer<typeof createMarkerSchema>) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const validation = createMarkerSchema.safeParse(data);
  if (!validation.success) {
    return { error: 'Validation failed', details: validation.error.flatten() };
  }

  const supabase = await createClient();

  // Verify project access
  const { data: project } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', data.projectId)
    .single();

  if (!project) {
    return { error: 'Project not found' };
  }

  // TODO: Verify user's company matches project.company_id

  // Insert marker
  const { data: marker, error } = await supabase
    .from('spatial_markers')
    .insert({
      project_id: data.projectId,
      model_id: data.modelId,
      type: data.type,
      title: data.title,
      description: data.description,
      position_x: data.positionX,
      position_y: data.positionY,
      position_z: data.positionZ,
      normal_x: data.normalX || 0,
      normal_y: data.normalY || 0,
      normal_z: data.normalZ || 1,
      element_id: data.elementId,
      element_type: data.elementType,
      floor_id: data.floorId,
      floor_name: data.floorName,
      room_id: data.roomId,
      room_name: data.roomName,
      task_id: data.taskId,
      phase_id: data.phaseId,
      created_by: session.user.id
    })
    .select(`
      *,
      creator:user_profiles!created_by(*)
    `)
    .single();

  if (error) {
    console.error('Error creating marker:', error);
    return { error: 'Failed to create marker' };
  }

  revalidatePath(`/app/projects/${data.projectId}/spatial`);

  return { success: true, marker };
}

export async function attachPhotoToMarker(markerId: string, photoUrl: string, metadata: any) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from('marker_content')
    .insert({
      marker_id: markerId,
      type: 'photo',
      photo_url: photoUrl,
      photo_thumbnail_url: metadata.thumbnailUrl,
      photo_width: metadata.width,
      photo_height: metadata.height,
      photo_exif: metadata.exif || {},
      created_by: session.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error attaching photo:', error);
    return { error: 'Failed to attach photo' };
  }

  return { success: true, content };
}

export async function updateMarker(id: string, updates: Partial<SpatialMarker>) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Verify ownership or admin
  const { data: existing } = await supabase
    .from('spatial_markers')
    .select('created_by, project_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return { error: 'Marker not found' };
  }

  if (existing.created_by !== session.user.id) {
    // TODO: Check if user is GC admin
    return { error: 'Permission denied' };
  }

  const { data: marker, error } = await supabase
    .from('spatial_markers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating marker:', error);
    return { error: 'Failed to update marker' };
  }

  revalidatePath(`/app/projects/${existing.project_id}/spatial`);

  return { success: true, marker };
}

export async function deleteMarker(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Verify ownership or admin
  const { data: existing } = await supabase
    .from('spatial_markers')
    .select('created_by, project_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return { error: 'Marker not found' };
  }

  if (existing.created_by !== session.user.id) {
    // TODO: Check if user is GC admin
    return { error: 'Permission denied' };
  }

  const { error } = await supabase
    .from('spatial_markers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting marker:', error);
    return { error: 'Failed to delete marker' };
  }

  revalidatePath(`/app/projects/${existing.project_id}/spatial`);

  return { success: true };
}
```

---

## Performance & Optimization

### LOD (Level of Detail) Strategy

Following [DECODE-3DViz research](https://link.springer.com/article/10.1007/s10278-025-01430-9) achieving 98% rendering time reduction:

**3-Tier LOD System:**

| LOD Level | Distance from Camera | Max Objects | Geometry Detail | Texture Resolution |
|-----------|---------------------|-------------|----------------|-------------------|
| **LOD 0 (High)** | 0-10 meters | 100,000 | Full detail | 4K |
| **LOD 1 (Medium)** | 10-50 meters | 50,000 | 50% triangles | 2K |
| **LOD 2 (Low)** | 50+ meters | 10,000 | 10% triangles | 512px |

**Progressive Loading:**

```typescript
// Progressive model loading strategy
class ProgressiveModelLoader {
  async loadModel(modelUrl: string, viewer: Viewer) {
    // 1. Load LOD 2 (low detail) first - fast initial render
    console.log('Debug: Loading LOD 2 (low detail)');
    const lod2 = await viewer.loadModel({
      src: `${modelUrl}-lod2.xkt`,
      priority: 'high'
    });

    // 2. Load LOD 1 (medium) in background
    console.log('Debug: Loading LOD 1 (medium detail)');
    const lod1 = await viewer.loadModel({
      src: `${modelUrl}-lod1.xkt`,
      priority: 'medium'
    });

    // Replace LOD 2 with LOD 1 when ready
    viewer.scene.models[lod2.id].visible = false;

    // 3. Load LOD 0 (high) last
    console.log('Debug: Loading LOD 0 (high detail)');
    const lod0 = await viewer.loadModel({
      src: `${modelUrl}-lod0.xkt`,
      priority: 'low'
    });

    // Replace LOD 1 with LOD 0 when ready
    viewer.scene.models[lod1.id].visible = false;
  }
}
```

### Lazy Loading for Content

**Marker Content Lazy Loading:**

- **Initial Load**: Fetch marker metadata (position, type, title) only
- **On Hover**: Fetch thumbnail + content count
- **On Click**: Fetch full content (photos, files, notes)

```typescript
// useMarkerContent hook with lazy loading
export function useMarkerContent(markerId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['marker-content', markerId],
    queryFn: async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from('marker_content')
        .select(`
          *,
          creator:user_profiles!created_by(*)
        `)
        .eq('marker_id', markerId)
        .order('created_at', { ascending: false });

      return data;
    },
    enabled,  // Only fetch when drawer is opened
    staleTime: 5 * 60 * 1000  // Cache for 5 minutes
  });
}
```

### Caching Strategy

**Multi-Layer Caching:**

1. **Browser Memory Cache**: Active model + visible markers (cleared on page unload)
2. **IndexedDB Cache**: Offline models + recent markers (7 day TTL)
3. **Vercel Blob CDN**: XKT files with `Cache-Control: public, max-age=31536000`
4. **Next.js Cache**: Server component data (`revalidate: 60` seconds)

**Cache Invalidation:**

```typescript
// Cache invalidation on model update
export async function uploadNewModelVersion(projectId: string, file: File) {
  // ... upload logic ...

  // Invalidate caches
  await Promise.all([
    // 1. Revalidate Next.js cache
    revalidatePath(`/app/projects/${projectId}/spatial`),

    // 2. Clear IndexedDB cache
    clearIndexedDBCache(projectId),

    // 3. Broadcast to other tabs
    broadcastCacheInvalidation(projectId)
  ]);
}
```

### Mobile Performance Targets

**Performance Budgets:**

| Metric | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| **Initial Load (3G)** | < 5 sec | < 7 sec | < 10 sec |
| **Time to Interactive** | < 3 sec | < 5 sec | < 7 sec |
| **Frame Rate (rendering)** | 60 FPS | 45 FPS | 30 FPS |
| **Memory Usage** | < 500 MB | < 300 MB | < 200 MB |
| **Bundle Size (JS)** | < 1 MB | < 800 KB | < 600 KB |

**Mobile Optimization Techniques:**

1. **Batching**: Merge objects with same material (reduces draw calls by 90%)
2. **Instancing**: GPU instancing for repeated elements (columns, windows)
3. **Frustum Culling**: Only render visible objects (xeokit default)
4. **Texture Atlasing**: Combine textures (1 draw call vs 50+)
5. **Occlusion Culling**: Skip rendering hidden objects behind walls
6. **Memory Pooling**: Reuse geometry buffers instead of creating new ones

**Sources:**
- [DECODE-3DViz LOD Research](https://link.springer.com/article/10.1007/s10278-025-01430-9)
- [WebGL Mobile Optimization](https://blog.pixelfreestudio.com/how-to-create-responsive-3d-web-experiences-with-webgl/)

---

## Security & Access Control

### File Upload Security

**Validation & Sanitization:**

```typescript
// File upload validation
const FILE_VALIDATION = {
  maxSize: 500 * 1024 * 1024,  // 500MB
  allowedTypes: [
    'application/x-step',        // IFC 2x3
    'application/ifc',           // IFC4
    'model/gltf-binary',         // glTF
    'model/gltf+json',           // glTF
    'application/octet-stream'   // Generic binary
  ],
  malwareScan: true,             // ClamAV integration
  virusTotalCheck: true          // Optional: VirusTotal API
};

export async function validateUploadedFile(file: File) {
  // 1. File type check
  if (!FILE_VALIDATION.allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  // 2. Size check
  if (file.size > FILE_VALIDATION.maxSize) {
    throw new Error(`File too large: ${file.size} bytes`);
  }

  // 3. Magic number verification (IFC files start with "ISO-10303-21")
  const header = await file.slice(0, 14).text();
  if (!header.startsWith('ISO-10303-21')) {
    throw new Error('Invalid IFC file header');
  }

  // 4. Malware scan (optional, server-side)
  // await scanWithClamAV(file);

  return { valid: true };
}
```

**Storage Security:**

- **Encryption at Rest**: Vercel Blob encrypts all files
- **Access Control**: `access: 'private'` for source IFC, `public` for XKT (with signed URLs if needed)
- **Content Security Policy**: Restrict blob loading to approved domains

### RLS Policies

**Spatial Markers RLS:**

```sql
-- View: Company members can see markers from their projects
CREATE POLICY "View spatial markers" ON spatial_markers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = spatial_markers.project_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

-- Create: Authenticated users in company can create markers
CREATE POLICY "Create spatial markers" ON spatial_markers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = spatial_markers.project_id
        AND projects.company_id = get_user_company_id(next_auth.uid())
    )
  );

-- Update: Creator or GC Admin/PM can update
CREATE POLICY "Update spatial markers" ON spatial_markers
  FOR UPDATE USING (
    created_by = next_auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      JOIN company_users ON company_users.company_id = projects.company_id
      WHERE projects.id = spatial_markers.project_id
        AND company_users.user_id = next_auth.uid()
        AND company_users.role IN ('gc_admin', 'project_manager')
    )
  );

-- Delete: Creator or GC Admin only
CREATE POLICY "Delete spatial markers" ON spatial_markers
  FOR DELETE USING (
    created_by = next_auth.uid() OR
    is_user_gc_admin(next_auth.uid())
  );
```

**Client Portal Permissions:**

For read-only client access:

```sql
-- Client users can view markers, but only 'active' ones (not 'archived')
CREATE POLICY "Clients view active markers" ON spatial_markers
  FOR SELECT USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM projects
      JOIN company_users ON company_users.company_id = projects.company_id
      WHERE projects.id = spatial_markers.project_id
        AND company_users.user_id = next_auth.uid()
        AND company_users.role = 'client'
    )
  );

-- Clients can view marker content, but not 'note' type (internal notes)
CREATE POLICY "Clients view marker content" ON marker_content
  FOR SELECT USING (
    type != 'note' AND  -- Hide internal notes from clients
    EXISTS (
      SELECT 1 FROM spatial_markers sm
      JOIN projects p ON p.id = sm.project_id
      JOIN company_users cu ON cu.company_id = p.company_id
      WHERE sm.id = marker_content.marker_id
        AND cu.user_id = next_auth.uid()
        AND cu.role = 'client'
    )
  );
```

### Audit Logging

**Track all marker creation/modification:**

```sql
-- Audit log table
CREATE TABLE public.spatial_marker_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id       uuid REFERENCES spatial_markers(id) ON DELETE CASCADE,
  action          text NOT NULL,  -- 'created', 'updated', 'deleted'
  changed_fields  jsonb DEFAULT '{}',
  old_values      jsonb DEFAULT '{}',
  new_values      jsonb DEFAULT '{}',
  user_id         uuid REFERENCES next_auth.users(id),
  ip_address      text,
  user_agent      text,
  created_at      timestamptz DEFAULT now()
);

-- Trigger to log changes
CREATE OR REPLACE FUNCTION log_spatial_marker_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO spatial_marker_audit_log (marker_id, action, new_values, user_id)
    VALUES (NEW.id, 'created', row_to_json(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO spatial_marker_audit_log (marker_id, action, old_values, new_values, user_id)
    VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW), next_auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO spatial_marker_audit_log (marker_id, action, old_values, user_id)
    VALUES (OLD.id, 'deleted', row_to_json(OLD), next_auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_spatial_marker_audit
AFTER INSERT OR UPDATE OR DELETE ON spatial_markers
FOR EACH ROW EXECUTE FUNCTION log_spatial_marker_changes();
```

---

## Integration Points

### Metro Journey (Project Phases)

**Integration Pattern:**

```tsx
// In Metro Journey component, add "View in 3D" button for each phase
<PhaseCard phase={phase}>
  <Button
    variant="outline"
    size="sm"
    onClick={() => navigate(`/app/projects/${project.id}/spatial?phase=${phase.id}`)}
  >
    <Box className="mr-2 h-4 w-4" />
    View in 3D ({markerCount} markers)
  </Button>
</PhaseCard>

// In 3D Viewer, filter markers by phase
const filteredMarkers = selectedPhase
  ? markers.filter(m => m.phase_id === selectedPhase)
  : markers;
```

**Phase Timeline Overlay:**

Overlay phase timeline on 3D view to show construction progress:

```tsx
// components/projects/spatial/PhaseTimeline.tsx
export function PhaseTimeline({ phases, selectedPhase, onPhaseChange }) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-200 rounded-lg shadow-construction p-2">
      <div className="flex items-center gap-2">
        {phases.map((phase, index) => (
          <button
            key={phase.id}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-bold transition-colors",
              selectedPhase === phase.id
                ? "bg-construction-blue text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            onClick={() => onPhaseChange(phase.id)}
          >
            {phase.name}
            <span className="ml-2 text-xs">
              ({phase.marker_count})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Task System

**Linking Tasks to Spatial Markers:**

```tsx
// In TaskModal, add "Location in 3D" section
<div className="space-y-2">
  <Label>Location in 3D Model</Label>
  {task.spatial_marker_id ? (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-construction-blue" />
      <span className="text-sm">Marked at {markerLocation}</span>
      <Button size="sm" variant="outline" onClick={viewIn3D}>
        View in 3D
      </Button>
    </div>
  ) : (
    <Button size="sm" variant="outline" onClick={addLocationIn3D}>
      <MapPin className="mr-2 h-4 w-4" />
      Add Location in 3D
    </Button>
  )}
</div>

// In 3D Viewer, show task markers with status color
<MarkerPin
  marker={marker}
  color={marker.task?.status === 'completed' ? 'green' : 'blue'}
  icon={CheckSquare}
/>
```

### Photo Uploads

**GPS EXIF → Spatial Marker Suggestion:**

```typescript
// When uploading photo, extract GPS coordinates
async function processPhotoUpload(file: File, projectId: string) {
  // Extract EXIF data
  const exif = await EXIF.getData(file);
  const gps = {
    lat: EXIF.getTag(file, 'GPSLatitude'),
    lon: EXIF.getTag(file, 'GPSLongitude')
  };

  if (gps.lat && gps.lon && project.latitude && project.longitude) {
    // Calculate distance from project origin
    const distance = calculateDistance(
      gps.lat, gps.lon,
      project.latitude, project.longitude
    );

    // If within 100m of project, suggest nearest marker
    if (distance < 100) {
      const nearestMarker = await findNearestMarker(gps.lat, gps.lon, projectId);

      if (nearestMarker) {
        return {
          suggestedMarker: nearestMarker,
          message: `Photo appears to be taken near "${nearestMarker.title}". Attach to this marker?`
        };
      }
    }
  }

  return { suggestedMarker: null };
}
```

**Photo Tour Mode:**

Navigate through all photo markers chronologically:

```tsx
export function PhotoTourMode({ markers, viewer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const photoMarkers = markers.filter(m => m.type === 'photo');

  const navigateToMarker = (index: number) => {
    const marker = photoMarkers[index];

    // Animate camera to marker position
    viewer.cameraControl.flyTo({
      eye: [marker.position_x, marker.position_y + 2, marker.position_z + 2],
      look: [marker.position_x, marker.position_y, marker.position_z],
      duration: 1.5
    });

    setCurrentIndex(index);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white border-2 rounded-lg shadow-construction p-4">
      <div className="flex items-center gap-4">
        <Button size="icon" onClick={() => navigateToMarker(currentIndex - 1)} disabled={currentIndex === 0}>
          <ChevronLeft />
        </Button>

        <div className="text-center">
          <p className="text-sm font-bold">Photo {currentIndex + 1} of {photoMarkers.length}</p>
          <p className="text-xs text-gray-500">{photoMarkers[currentIndex].title}</p>
        </div>

        <Button size="icon" onClick={() => navigateToMarker(currentIndex + 1)} disabled={currentIndex === photoMarkers.length - 1}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
```

### Chat System

**Linking Messages to Spatial Locations:**

```tsx
// In chat message input, add "Add Location" button
<MessageInput>
  <Button size="sm" variant="ghost" onClick={selectLocationIn3D}>
    <MapPin className="h-4 w-4" />
    Add Location
  </Button>
</MessageInput>

// Store location reference in message
const message = {
  content: "Check this issue on the north wall",
  entity_references: [
    {
      type: 'spatial_marker',
      id: 'marker-uuid',
      label: 'North Wall - Issue'
    }
  ]
};

// Render clickable location link in message
<MessageItem message={message}>
  {message.entity_references.map(ref => ref.type === 'spatial_marker' && (
    <Button
      size="sm"
      variant="outline"
      onClick={() => navigateTo3DViewer(ref.id)}
    >
      <MapPin className="mr-2 h-4 w-4" />
      View Location in 3D
    </Button>
  ))}
</MessageItem>
```

### Materials Management

**Linking Materials to Installation Locations:**

```tsx
// In MaterialAssignment, add spatial location
<MaterialAssignmentForm>
  <div className="space-y-2">
    <Label>Installation Location</Label>
    <Button variant="outline" onClick={selectLocationIn3D}>
      <MapPin className="mr-2 h-4 w-4" />
      {assignment.spatial_marker_id
        ? `Marked at ${markerLocation}`
        : 'Select Location in 3D'
      }
    </Button>
  </div>
</MaterialAssignmentForm>

// In 3D Viewer, show material markers with procurement status
<MarkerPin
  marker={marker}
  color={getProcurementColor(marker.material?.procurement_status)}
  icon={Package}
  badge={marker.material?.quantity}
/>

// Color coding
const getProcurementColor = (status) => {
  return {
    needed: 'gray',
    ordered: 'yellow',
    delivered: 'blue',
    installed: 'green'
  }[status];
};
```

---

## Offline Strategy

### Data to Cache

**Priority-Based Caching:**

| Data Type | Priority | Storage | Size Limit | TTL |
|-----------|----------|---------|-----------|-----|
| **Active Model (XKT)** | 🔴 Critical | IndexedDB | 100 MB | 7 days |
| **Marker Metadata** | 🔴 Critical | IndexedDB | 5 MB | 7 days |
| **Photo Thumbnails** | 🟡 Medium | IndexedDB | 20 MB | 3 days |
| **Full Photos** | 🟢 Low | On-demand fetch | N/A | N/A |
| **Files** | 🟢 Low | On-demand fetch | N/A | N/A |

**Caching Implementation:**

```typescript
// lib/offline/modelCache.ts
import { openDB, DBSchema } from 'idb';

interface ModelCacheDB extends DBSchema {
  models: {
    key: string;  // projectId
    value: {
      projectId: string;
      version: number;
      xktBlob: Blob;
      metadata: any;
      cachedAt: Date;
    };
  };
  markers: {
    key: string;  // projectId
    value: {
      projectId: string;
      markers: any[];
      lastSyncedAt: Date;
    };
  };
}

export class ModelCache {
  private db = openDB<ModelCacheDB>('spatial-viewer-cache', 1, {
    upgrade(db) {
      db.createObjectStore('models', { keyPath: 'projectId' });
      db.createObjectStore('markers', { keyPath: 'projectId' });
    }
  });

  async cacheModel(projectId: string, xktBlob: Blob, metadata: any) {
    const db = await this.db;
    await db.put('models', {
      projectId,
      version: metadata.version,
      xktBlob,
      metadata,
      cachedAt: new Date()
    });

    console.log('Debug: Model cached for offline use', projectId);
  }

  async getCachedModel(projectId: string) {
    const db = await this.db;
    const cached = await db.get('models', projectId);

    if (!cached) return null;

    // Check expiry (7 days)
    const age = Date.now() - cached.cachedAt.getTime();
    if (age > 7 * 24 * 60 * 60 * 1000) {
      await db.delete('models', projectId);
      return null;
    }

    return cached;
  }

  async cacheMarkers(projectId: string, markers: any[]) {
    const db = await this.db;
    await db.put('markers', {
      projectId,
      markers,
      lastSyncedAt: new Date()
    });
  }

  async getCachedMarkers(projectId: string) {
    const db = await this.db;
    return await db.get('markers', projectId);
  }
}
```

### Sync Strategy

**Background Sync with Service Worker:**

```typescript
// public/service-worker.js (snippet)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-markers') {
    event.waitUntil(syncOfflineMarkers());
  }
});

async function syncOfflineMarkers() {
  const db = await openDB('spatial-viewer-cache');
  const pendingMarkers = await db.getAll('pending_markers');

  for (const marker of pendingMarkers) {
    try {
      // POST to server
      await fetch('/api/spatial/markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marker)
      });

      // Remove from pending queue
      await db.delete('pending_markers', marker.id);

      console.log('Debug: Synced offline marker', marker.id);
    } catch (error) {
      console.error('Debug: Sync failed, will retry', error);
    }
  }
}
```

**Conflict Resolution:**

When offline-created markers sync, use **last-write-wins** with timestamp:

```typescript
export async function syncOfflineMarker(localMarker: SpatialMarker) {
  const supabase = await createClient();

  // Check if marker exists on server (created by another user while offline)
  const { data: existing } = await supabase
    .from('spatial_markers')
    .select('*')
    .eq('id', localMarker.id)
    .single();

  if (existing) {
    // Conflict: another user edited while offline
    if (existing.updated_at > localMarker.updated_at) {
      // Server version is newer, discard local
      console.log('Debug: Server version newer, discarding local changes');
      return { conflict: true, resolution: 'server-wins' };
    } else {
      // Local version is newer, update server
      console.log('Debug: Local version newer, updating server');
      await supabase
        .from('spatial_markers')
        .update(localMarker)
        .eq('id', localMarker.id);

      return { conflict: true, resolution: 'local-wins' };
    }
  } else {
    // No conflict, insert new marker
    await supabase
      .from('spatial_markers')
      .insert(localMarker);

    return { conflict: false };
  }
}
```

---

## Migration & Rollout

### Backward Compatibility

**Projects Without 3D Models:**

- **UI Fallback**: Show "Upload 3D Model" button instead of viewer
- **2D Floor Plan Mode**: Allow uploading floor plan images for 2D marker placement
- **Graceful Degradation**: All existing features work without 3D viewer

```tsx
// Project detail page with 3D viewer as optional tab
<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    {project.has_3d_model && (
      <TabsTrigger value="3d-viewer">3D Viewer</TabsTrigger>
    )}
  </TabsList>

  <TabsContent value="3d-viewer">
    {project.has_3d_model ? (
      <SpatialViewer project={project} />
    ) : (
      <EmptyState
        icon={Box}
        title="No 3D Model"
        description="Upload a BIM file to enable spatial documentation"
        action={<UploadModelButton projectId={project.id} />}
      />
    )}
  </TabsContent>
</Tabs>
```

### Feature Flag Approach

Use environment variable to enable/disable feature:

```typescript
// config.ts
export const FEATURES = {
  SPATIAL_VIEWER: process.env.NEXT_PUBLIC_SPATIAL_VIEWER_ENABLED === 'true',
  // ... other features
};

// In component
import { FEATURES } from '@/config';

{FEATURES.SPATIAL_VIEWER && (
  <Button onClick={open3DViewer}>View in 3D</Button>
)}
```

### Gradual Rollout Plan

**Phase 1: Internal Alpha (Week 1-2)**
- Enable for 1 internal test project
- Test core functionality (model upload, marker creation)
- Gather performance metrics
- Fix critical bugs

**Phase 2: Beta (Week 3-4)**
- Enable for 5 customer pilot projects
- Provide training materials
- Monitor usage and feedback
- Optimize based on real-world performance

**Phase 3: Limited GA (Week 5-6)**
- Enable for 20% of projects (feature flag)
- Monitor error rates and performance
- Iterate on UX based on support tickets

**Phase 4: Full GA (Week 7+)**
- Enable for all projects
- Announce feature to all customers
- Provide user documentation and tutorials

---

## Risk Assessment

### Technical Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **Large model rendering crashes mobile browsers** | 🔴 High | 🟡 Medium | - Enforce 500MB file size limit<br>- Use LOD system<br>- Memory monitoring and graceful degradation |
| **IFC conversion takes > 5 minutes (serverless timeout)** | 🟡 Medium | 🟡 Medium | - Use chunked processing<br>- Offload to background job queue<br>- Show progress indicator |
| **WebGL not supported on some devices** | 🟡 Medium | 🟢 Low | - Detect WebGL support, fall back to 2D mode<br>- Show clear upgrade message |
| **Model upload fails due to network timeout** | 🟡 Medium | 🟡 Medium | - Use resumable chunked upload<br>- Retry failed chunks<br>- Show upload progress |
| **Realtime marker updates cause race conditions** | 🟢 Low | 🟡 Medium | - Use optimistic updates<br>- Conflict resolution with timestamps |

### Performance & Scalability Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **500k+ object models exceed mobile GPU memory** | 🔴 High | 🟡 Medium | - Enforce LOD system<br>- Limit mobile to LOD 1 (50k objects)<br>- Monitor GPU memory usage |
| **100+ concurrent users viewing same model** | 🟡 Medium | 🟢 Low | - Use CDN for XKT files (Vercel Blob)<br>- Implement model streaming<br>- Load balancing |
| **IndexedDB quota exceeded on mobile** | 🟡 Medium | 🟡 Medium | - Prune old cached models (LRU)<br>- User-configurable cache size<br>- Clear cache prompt |
| **Marker clustering algorithm slow with 10k+ markers** | 🟢 Low | 🟢 Low | - Use spatial indexing (quadtree)<br>- Server-side clustering pre-computation |

### Security Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **Malicious IFC file exploits parser** | 🔴 High | 🟢 Low | - Malware scanning on upload<br>- Sandboxed conversion environment<br>- File size limits |
| **Client accesses internal notes via API** | 🟡 Medium | 🟡 Medium | - RLS policies filter by role<br>- Double-check in server actions<br>- Audit logging |
| **Marker contains XSS in title/description** | 🟡 Medium | 🟡 Medium | - Input sanitization (DOMPurify)<br>- Server-side validation<br>- React auto-escaping |
| **Unauthorized model download via Vercel Blob URL** | 🟢 Low | 🟡 Medium | - Use signed URLs with expiry<br>- Check project access in API route |

### Dependencies & Blockers

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **xeokit SDK has critical bug** | 🟡 Medium | 🟢 Low | - Pin to stable version<br>- Have Three.js fallback plan<br>- Monitor GitHub issues |
| **Vercel Blob storage limits hit** | 🟡 Medium | 🟢 Low | - Monitor usage dashboard<br>- Implement model archiving<br>- Alternative: Supabase Storage |
| **Serverless function cold start > 10s** | 🟡 Medium | 🟡 Medium | - Use provisioned concurrency<br>- Warm-up cron job<br>- Show "Processing..." UI |

---

## Appendix: Sources & References

### Research Sources

**BIM Viewer Libraries:**
- [xeokit SDK Official](https://xeokit.io/)
- [xeokit GitHub](https://github.com/xeokit/xeokit-sdk)
- [web-ifc GitHub](https://github.com/ThatOpen/engine_web-ifc)
- [web-ifc Three.js Integration](https://github.com/ThatOpen/web-ifc-three)
- [react-ifc-viewer](https://github.com/antoniocolagreco/react-ifc-viewer)

**Performance & Optimization:**
- [DECODE-3DViz LOD Research](https://link.springer.com/article/10.1007/s10278-025-01430-9)
- [WebGL Performance Optimization](https://blog.pixelfreestudio.com/how-to-optimize-webgl-for-high-performance-3d-graphics/)
- [WebGL Mobile Best Practices](https://blog.pixelfreestudio.com/how-to-create-responsive-3d-web-experiences-with-webgl/)
- [Mozilla WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Dual Multi-LOD Strategy Research](https://www.mdpi.com/2075-5309/15/16/2916)

**IFC File Format:**
- [IFC.js Official](https://ifcjs.io/)
- [IfcLoader Three.js Example](https://threejs.org/examples/webgl_loader_ifc.html)
- [buildingSMART IFC Parsing Forum](https://forums.buildingsmart.org/t/ifc-parsing-in-node-js/3026)

### GenHub Architecture References

- **SYSTEM.md**: Architecture rules, tech stack, data flow patterns
- **DB_SCHEMA.md**: Database tables, RLS policies, relationships
- **UI_RULES.md**: Design system, construction theme, component patterns

### Technology Stack

- **Next.js 16.5.9**: React framework, App Router, Server Components
- **xeokit SDK 2.6.100**: BIM viewer engine
- **Supabase**: PostgreSQL database + Realtime
- **Vercel Blob**: File storage for models
- **Aceternity UI**: Component library (construction-themed)
- **Lucide React**: Icon library
- **Framer Motion**: Animations
- **IndexedDB (idb)**: Offline caching

---

**Document Version**: 1.0
**Last Updated**: 2026-01-01
**Author**: kiro-design (Feature Design Architect)
**Status**: Ready for Review

---

## Next Steps

After this design document is approved, the next phase is to create an **Implementation Plan** with:

1. Detailed task breakdown (GitHub issues)
2. Component specifications
3. Database migration scripts
4. Testing strategy (unit, integration, E2E)
5. Deployment checklist

**Ready to proceed to implementation planning?**
