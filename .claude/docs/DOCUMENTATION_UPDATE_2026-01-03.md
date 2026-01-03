# Documentation Update Summary

**Date**: January 3, 2026
**Purpose**: Update all outdated markdown documentation to reflect current codebase state

---

## Files Updated

### 1. `.claude/docs/law/DB_SCHEMA.md`

**Updated Sections**:

#### Enums
- **project_type**: Changed order to `residential, cafe, restaurant, commercial_office, industrial` (cafe and restaurant are now separate, not combined as 'restaurant_cafe')
- **phase_status**: Removed 'on_hold' status (current values: not_started, in_progress, completed)

#### Tables

**company_users**:
- Removed `invitation_token` and `activated_at` columns
- Added `invited_at` and `joined_at` columns
- Added UNIQUE constraint: `UNIQUE(company_id, user_id)`

**projects**:
- Updated status column type: `status project_status`
- Added `actual_cost decimal(12,2)` column
- Clarified budget type: `budget decimal(12,2)`
- Removed `image_url`, `latitude`, `longitude` columns (not in current schema)

**project_phases**:
- Renamed `order_index` to `display_order`
- Added `start_date date` and `end_date date` columns
- Added `description text` column
- Removed `started_at`, `completed_at`, `notes` columns
- Added constraints: `UNIQUE(project_id, name)`, `UNIQUE(project_id, display_order)`

**project_team**:
- Added note about chat_participants trigger being conditional
- Added CHECK constraint note: Either user_id OR subcontractor_id must be set

**tasks**:
- Clarified priority enum values: `(low, medium, high)`
- Removed task_type, approval workflow fields (approval_status, approval_notes, approved_by, approved_at, receipt_photo_url)
- Added `subcontractor_id uuid FK` column
- Added `blocker_reason text` column (was `blocked_reason`)
- Added `display_order int` column
- Changed cost types: `planned_cost decimal(10,2)`, `actual_cost decimal(10,2)`
- Removed `start_date` column

**3D Spatial Tables**:
- Added `default_3d_models` table to schema overview
- Updated `projects_3d_models` table:
  - Added `xkt_file_url`, `glb_file_url`, `ifc_file_url` columns
  - Added `is_active bool` (only one per project)
  - Added `bounds jsonb`, `floors jsonb` columns
  - Added `processing_status` enum
  - Added `is_default bool`, `default_model_id uuid FK` columns
  - Removed `is_primary`, `coordinate_system`, `processed`, `processing_error` columns

- Added `default_3d_models` table:
  ```sql
  id uuid PK, project_type enum, name text, description,
  model_id text (e.g., 'default-residential-layout'),
  xkt_file_url text, thumbnail_url text, is_active bool,
  metadata jsonb, created_at, updated_at
  ```
  - System-wide default models for each project type
  - UNIQUE(project_type) WHERE is_active = true
  - Used when user creates new project with no uploaded model

---

### 2. `.claude/docs/law/SPATIAL_VIEWER.md`

**Updated Sections**:

#### Quick Reference
- Added `default_3d_models` to database tables
- Added `app/actions/default-models.ts` to server actions
- Added note: "Supports all 5 project types (residential, cafe, restaurant, commercial_office, industrial)"

#### When to Use
- Added: "User creates a new project (auto-loads default model for project type)"
- Added: "Project has no custom model uploaded (uses default model)"

#### Critical Gotchas

**Section 1: Xeokit Viewer Lifecycle**
- Updated cleanup pattern to include null checks:
  ```typescript
  return () => {
    if (viewer?.scene?.canvas) {
      fullCleanup(viewer);
    }
    if (viewer?.scene?.canvas?.pluginManager) {
      viewer.scene.canvas.pluginManager.destroy();
    }
  };
  ```

**Section 2: Model URL Format & Default Models**
- Added "Default Models" to section title
- Added default model detection pattern:
  ```typescript
  const isPlaceholderURL = modelHighURL?.startsWith('defaults/') || modelHighURL?.startsWith('/defaults/');
  const hasValidProjectType = ['residential', 'cafe', 'restaurant', 'commercial_office', 'industrial'].includes(projectType || '');
  const shouldUseDefaultModel = (!modelHighURL || isPlaceholderURL) && hasValidProjectType;
  ```
- Updated example to use `<SpatialViewer>` component with `projectType` prop

#### Database Patterns

**Table Relationships**:
- Added `default_3d_models` table to relationship diagram
- Updated `projects_3d_models` table:
  - Added `is_default: boolean (true if from default_3d_models)`
  - Added `default_model_id → default_3d_models (SET NULL)`

#### Performance Patterns

**Memory Management**:
- Updated "Full cleanup on unmount" section with comprehensive null checks:
  ```typescript
  useEffect(() => {
    return () => {
      if (viewer?.scene?.canvas) {
        fullCleanup(viewer);
      }
      if (viewer?.scene?.canvas?.pluginManager) {
        viewer.scene.canvas.pluginManager.destroy();
      }
      viewerManager.destroyViewer(projectId);
    };
  }, [viewer, projectId]);
  ```

#### Common Tasks

**Added: Use Default Model for Project Type**
```typescript
// When creating a project, default model is automatically assigned
// Based on project_type: residential, cafe, restaurant, commercial_office, industrial

const shouldUseDefaultModel = (!modelHighURL || modelHighURL?.startsWith('defaults/'))
  && hasValidProjectType;

if (viewer && shouldUseDefaultModel) {
  await createDefaultModel(viewer, projectType);
  // Creates procedurally generated 3D model for the project type
  // Model IDs: default-residential-layout, default-cafe-layout, etc.
}
```

---

## Current State Summary

### Database Schema

**5 Project Types** (separate cafe and restaurant):
- residential
- cafe
- restaurant
- commercial_office
- industrial

**Phase Status** (3 values):
- not_started
- in_progress
- completed

**Project Status** (4 values):
- active
- on_hold
- completed
- archived

**Task Priority** (3 values):
- low
- medium
- high

### 3D Spatial Viewer

**Supports All 5 Project Types**:
- Each project type has a default 3D model
- Default models are procedurally generated
- Model IDs: `default-{type}-layout` (e.g., `default-cafe-layout`)
- Placeholder URLs: `defaults/` or `/defaults/` trigger default model loading

**Default Model Flow**:
1. User creates new project with project_type
2. If no custom model uploaded, `modelHighURL` is set to placeholder (e.g., `defaults/cafe`)
3. `SpatialViewer` component detects placeholder URL
4. `createDefaultModel()` generates 3D geometry for project type
5. Model is displayed in viewer immediately

**Critical Fixes Applied**:
- Null checks in cleanup functions prevent errors
- `pluginManager` validation added to 3DViewerCanvas
- Proper null checks in interaction cleanup
- `destroyXeokit` function has comprehensive null safety

---

## Files Not Updated (Already Accurate)

- `.claude/docs/law/SYSTEM.md` - Architecture patterns are current
- `.claude/docs/law/UI_RULES.md` - Design system is current
- `.claude/rules/supabase_use.md` - Supabase client usage is current
- `.claude/rules/supabase_types.md` - Type generation is current
- `.claude/rules/frontend_mdc.md` - Frontend patterns are current
- `.claude/rules/create_supabase_table.md` - Table creation patterns are current
- `GENHUB_README.md` - User-facing README is current

---

## Key Takeaways for Agents

### When Working with Database
1. **Project types**: 5 separate types (cafe and restaurant are not combined)
2. **Phase status**: Only 3 values (no 'on_hold')
3. **Tasks**: priority is enum (low, medium, high), no approval workflow fields
4. **Company users**: Use invited_at/joined_at, not invitation_token/activated_at
5. **3D Models**: Check for default_3d_models when project has no custom model

### When Working with 3D Viewer
1. **Always include null checks** before destroying viewer or plugins
2. **Support all 5 project types** with default models
3. **Detect placeholder URLs** (`defaults/` prefix) for default model loading
4. **Use createDefaultModel()** when no custom model exists
5. **Cleanup pattern**: Check `viewer?.scene?.canvas` before any destruction

### When Reading Documentation
1. **DB_SCHEMA.md**: Authoritative source for table structure
2. **SPATIAL_VIEWER.md**: Complete 3D viewer patterns and gotchas
3. **SYSTEM.md**: Architecture and agent workflow
4. **UI_RULES.md**: Design system and component patterns

---

**Last Updated**: January 3, 2026
**Next Review**: After major schema changes or feature additions
