# Spatial Schema Reference

> Database schema for 3D spatial viewer and markers

Last updated: 2026-01-09

---

## Tables Overview

| Table | Purpose | RLS |
|-------|---------|-----|
| ifc_models | IFC model files | project-scoped |
| spatial_markers | 3D markers on models | project-scoped |
| marker_photos | Photos attached to markers | project-scoped |
| marker_comments | Comments on markers | project-scoped |

---

## IFC Models Table

```sql
CREATE TABLE public.ifc_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- File info
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,

  -- Status
  version integer DEFAULT 1,
  status model_status DEFAULT 'processing',

  -- Metadata
  metadata jsonb DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES next_auth.users(id)
);

-- Indexes
CREATE INDEX idx_ifc_models_project ON ifc_models(project_id);
CREATE INDEX idx_ifc_models_status ON ifc_models(status);
```

### Metadata Structure
```typescript
interface IfcModelMetadata {
  buildingName?: string
  levels?: number
  elements?: number
  boundingBox?: {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
  }
}
```

---

## Spatial Markers Table

```sql
CREATE TABLE public.spatial_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES ifc_models(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,

  -- 3D Position
  position jsonb NOT NULL,  -- {x, y, z}
  normal jsonb,             -- {x, y, z} surface normal
  element_id text,          -- IFC element ID

  -- Marker info
  marker_type marker_type DEFAULT 'issue',
  title text NOT NULL,
  description text,
  status marker_status DEFAULT 'open',
  priority marker_priority DEFAULT 'medium',

  -- Assignment
  created_by uuid REFERENCES next_auth.users(id),
  assigned_to uuid REFERENCES next_auth.users(id),

  -- Photos
  photos text[] DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Indexes
CREATE INDEX idx_markers_model ON spatial_markers(model_id);
CREATE INDEX idx_markers_task ON spatial_markers(task_id);
CREATE INDEX idx_markers_status ON spatial_markers(status);
CREATE INDEX idx_markers_type ON spatial_markers(marker_type);
CREATE INDEX idx_markers_assigned ON spatial_markers(assigned_to);
```

### Position Structure
```typescript
interface Vector3 {
  x: number
  y: number
  z: number
}

interface MarkerPosition {
  position: Vector3  // World coordinates
  normal?: Vector3   // Surface normal for orientation
}
```

---

## Marker Photos Table

```sql
CREATE TABLE public.marker_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid NOT NULL REFERENCES spatial_markers(id) ON DELETE CASCADE,

  -- Photo info
  url text NOT NULL,
  thumbnail_url text,
  caption text,

  -- Metadata
  taken_at timestamptz,
  location jsonb,  -- GPS coordinates if available

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES next_auth.users(id)
);

CREATE INDEX idx_marker_photos_marker ON marker_photos(marker_id);
```

---

## Marker Comments Table

```sql
CREATE TABLE public.marker_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid NOT NULL REFERENCES spatial_markers(id) ON DELETE CASCADE,

  -- Comment
  content text NOT NULL,

  -- Author
  user_id uuid NOT NULL REFERENCES next_auth.users(id),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_marker_comments_marker ON marker_comments(marker_id);
```

---

## RLS Policies

### IFC Models RLS
```sql
ALTER TABLE public.ifc_models ENABLE ROW LEVEL SECURITY;

-- Project-scoped access
CREATE POLICY "ifc_models_company_access" ON ifc_models
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE company_id = get_user_company_id(next_auth.uid())
    )
  );
```

### Spatial Markers RLS
```sql
ALTER TABLE public.spatial_markers ENABLE ROW LEVEL SECURITY;

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

## Key Queries

### Get markers for model
```sql
SELECT
  m.*,
  u1.name as created_by_name,
  u2.name as assigned_to_name,
  t.title as task_title,
  t.status as task_status
FROM spatial_markers m
LEFT JOIN next_auth.users u1 ON u1.id = m.created_by
LEFT JOIN next_auth.users u2 ON u2.id = m.assigned_to
LEFT JOIN tasks t ON t.id = m.task_id
WHERE m.model_id = $1
ORDER BY m.created_at DESC;
```

### Get markers by status
```sql
SELECT * FROM spatial_markers
WHERE model_id = $1 AND status = 'open'
ORDER BY priority DESC, created_at ASC;
```

### Get markers near position
```sql
SELECT *,
  SQRT(
    POWER((position->>'x')::float - $2, 2) +
    POWER((position->>'y')::float - $3, 2) +
    POWER((position->>'z')::float - $4, 2)
  ) as distance
FROM spatial_markers
WHERE model_id = $1
ORDER BY distance ASC
LIMIT 10;
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

## See Also

- `docs/law/SPATIAL_VIEWER.md` - Full spatial viewer architecture
- `skills/domain/spatial-markers.md` - Marker patterns
- `docs/backend/SCHEMA_CORE.md` - Core tables
