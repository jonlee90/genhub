# 3D Spatial Project Viewer - Implementation Tasks

**Feature:** 3D Spatial Project Viewer with BIM file support and spatial markers
**Status:** Ready for Implementation
**Estimated Total Duration:** 11 weeks

---

## Phase 1: Foundation & Database (2 weeks)

### P1.1 - [ ] Create database schema for 3D models table
**Description:** Implement the `projects_3d_models` table with all required fields for storing BIM model metadata, versions, processing status, and LOD file URLs.

**Files to Create/Modify:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_projects_3d_models.sql`
- `types/database.types.ts` (regenerate after migration)

**Dependencies:** None

**Acceptance Criteria:**
- [ ] Table created with all columns from design (id, project_id, version, file_name, original_file_url, xkt_file_url, lod_*_url, thumbnail_url, file_size_bytes, element_count, bounds, floors, metadata, is_active, processing_status, processing_error, timestamps)
- [ ] UNIQUE constraint on (project_id, version)
- [ ] Indexes created: idx_projects_3d_models_project_active, idx_projects_3d_models_status
- [ ] RLS policies implemented: "View 3D models" (SELECT), "Manage 3D models" (ALL for GC/PM)
- [ ] Table comment added explaining purpose
- [ ] Column comments added for bounds and floors JSONB fields
- [ ] Migration successfully applied via MCP Supabase
- [ ] TypeScript types regenerated and match schema

**Complexity:** M

**Technical Considerations:**
- Use MCP Supabase tools exclusively (`mcp__supabase__apply_migration`)
- Verify RLS policies using `mcp__supabase__get_advisors type:"security"`
- JSONB bounds format: `{minX, minY, minZ, maxX, maxY, maxZ}` (all numeric)
- JSONB floors format: `[{id: string, name: string, elevation: number}]`
- processing_status enum values: 'pending', 'processing', 'ready', 'failed'
- Reference existing `get_user_company_id()` and company_users patterns from DB_SCHEMA.md

---

### P1.2 - [ ] Create database schema for spatial markers table
**Description:** Implement the `spatial_markers` table with 3D coordinates, element associations, and polymorphic links to existing GenHub entities (tasks, phases).

**Files to Create/Modify:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_spatial_markers.sql`
- `types/database.types.ts` (regenerate)

**Dependencies:** P1.1

**Acceptance Criteria:**
- [ ] Enums created: spatial_marker_type (photo, document, note, issue, progress, task, material), spatial_marker_status (active, resolved, archived)
- [ ] Table created with all columns: id, project_id, model_id, type, status, position_x/y/z, normal_x/y/z, element_id/type/name, floor_id/name, room_id/name, title, description, task_id, phase_id, cluster_id, content_count, last_activity_at, timestamps
- [ ] Foreign key references: project_id → projects, model_id → projects_3d_models (ON DELETE SET NULL), task_id → tasks, phase_id → project_phases
- [ ] Indexes created: idx_spatial_markers_project, _model, _position, _floor, _type_status, _task
- [ ] RLS policies: "View spatial markers" (SELECT for company), "Create" (INSERT for company), "Update" (creator or GC/PM), "Delete" (creator or GC admin)
- [ ] Table and column comments added
- [ ] Migration applied and TypeScript types regenerated

**Complexity:** M

**Technical Considerations:**
- position_x/y/z use `numeric` type for precision (not float/double)
- Spatial index using cube extension is commented out (future optimization)
- Reference existing `is_user_gc_admin()` helper function
- ON DELETE CASCADE for project_id (cleanup when project deleted)
- ON DELETE SET NULL for model_id (preserve markers when model version deleted)

---

### P1.3 - [ ] Create database schema for marker content table
**Description:** Implement the `marker_content` table for polymorphic content attachments (photos, files, notes, activity logs) to spatial markers.

**Files to Create/Modify:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_marker_content.sql`
- `types/database.types.ts` (regenerate)

**Dependencies:** P1.2

**Acceptance Criteria:**
- [ ] Enum created: marker_content_type (photo, file, note, activity)
- [ ] Table created with columns: id, marker_id, type, photo_url, photo_thumbnail_url, photo_width, photo_height, photo_exif, file_url, file_name, file_size_bytes, file_mime_type, note_text, note_format, activity_type, activity_data, created_by, timestamps
- [ ] Foreign key: marker_id → spatial_markers (ON DELETE CASCADE)
- [ ] Indexes: idx_marker_content_marker, _type, _created_by
- [ ] RLS policies: "View marker content" (SELECT for company), "Create" (INSERT for company), "Update" (creator or GC/PM), "Delete" (creator or GC admin)
- [ ] Comments added for polymorphic field usage
- [ ] Migration applied and types regenerated

**Complexity:** M

**Technical Considerations:**
- Polymorphic design: only relevant fields populated based on `type`
- photo_exif stores JSONB with GPS, camera, orientation metadata
- note_format supports: 'plain', 'markdown', 'html'
- activity_type for auto-generated logs: 'task_completed', 'marker_created', 'model_updated', etc.
- activity_data stores JSONB with event-specific details

---

### P1.4 - [ ] Create database schema for model elements table
**Description:** Implement the `model_elements` table for storing IFC element metadata extracted during model processing (floors, rooms, walls, etc.).

**Files to Create/Modify:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_model_elements.sql`
- `types/database.types.ts` (regenerate)

**Dependencies:** P1.1

**Acceptance Criteria:**
- [ ] Table created with columns: id, model_id, element_guid, element_type, element_name, floor_id, floor_name, room_id, room_name, properties (JSONB), bounds (JSONB), parent_element_id, created_at
- [ ] Foreign key: model_id → projects_3d_models (ON DELETE CASCADE)
- [ ] Indexes: idx_model_elements_model, _element_guid, _element_type, _floor_id
- [ ] RLS policy: "View model elements" (SELECT for company members)
- [ ] Comments explaining IFC element hierarchy
- [ ] Migration applied and types regenerated

**Complexity:** S

**Technical Considerations:**
- element_guid is IFC GlobalId (22-character base64 encoded)
- element_type examples: 'IfcWall', 'IfcDoor', 'IfcWindow', 'IfcSpace', 'IfcBuildingStorey'
- properties JSONB stores IFC property sets (Pset_WallCommon, etc.)
- bounds JSONB format matches projects_3d_models.bounds
- parent_element_id enables spatial hierarchy (Building → Floor → Room → Element)

---

### P1.5 - [ ] Create Server Actions for 3D model CRUD operations
**Description:** Implement server actions for creating, reading, updating, and deleting 3D model records with proper error handling and revalidation.

**Files to Create/Modify:**
- `app/actions/spatial.ts` (new file)

**Dependencies:** P1.1, P1.2, P1.3, P1.4 (all tables exist)

**Acceptance Criteria:**
- [ ] `createModelRecord(projectId, fileData)` - Insert new model with processing_status='pending'
- [ ] `getProjectModels(projectId)` - Fetch all model versions for project
- [ ] `getActiveModel(projectId)` - Fetch currently active model version
- [ ] `updateModelProcessingStatus(modelId, status, metadata?)` - Update processing status and metadata
- [ ] `setActiveModelVersion(projectId, modelId)` - Set model as active, unset others
- [ ] `deleteModelVersion(modelId)` - Soft delete (or hard delete if no markers)
- [ ] All actions use `createClient()` from `@/utils/supabase/server`
- [ ] All actions call `revalidatePath('/app/projects/[id]/spatial')` on success
- [ ] All actions return `{ success: boolean, data?: T, error?: string }`
- [ ] TypeScript types from database.types.ts used for parameters and returns
- [ ] Error handling for Supabase errors (network, permissions, constraints)

**Complexity:** M

**Technical Considerations:**
- NO client-side Supabase imports (server actions only)
- Use `'use server'` directive at top of file
- Import types: `import { Database } from '@/types/database.types'`
- setActiveModelVersion must use transaction to ensure only one active model
- Check for dependent markers before hard delete
- Validate projectId access (user's company owns project)

---

### P1.6 - [ ] Create Server Actions for spatial marker CRUD operations
**Description:** Implement server actions for marker lifecycle management including creation with 3D coordinates, updates, deletion, and content attachments.

**Files to Create/Modify:**
- `app/actions/spatial.ts` (extend existing file)

**Dependencies:** P1.5

**Acceptance Criteria:**
- [ ] `createMarker(data)` - Create marker with position_x/y/z, type, title, project_id, model_id, optional element association
- [ ] `getProjectMarkers(projectId, filters?)` - Fetch markers with optional filters (type, status, floor_id, task_id, phase_id)
- [ ] `getMarkerById(markerId)` - Fetch single marker with content count
- [ ] `updateMarker(markerId, data)` - Update marker fields (title, description, status, position)
- [ ] `deleteMarker(markerId)` - Delete marker (cascades to marker_content)
- [ ] `attachContentToMarker(markerId, content)` - Add photo/file/note content
- [ ] `getMarkerContent(markerId)` - Fetch all content items for marker
- [ ] `deleteMarkerContent(contentId)` - Remove content attachment
- [ ] All actions follow same error handling and revalidation pattern as P1.5
- [ ] Actions increment `content_count` and update `last_activity_at` on marker when content added

**Complexity:** L

**Technical Considerations:**
- createMarker validates position_x/y/z are within model bounds (if model_id provided)
- getProjectMarkers supports filtering by multiple criteria (AND logic)
- attachContentToMarker handles polymorphic content (type determines which fields to populate)
- When attaching photo, validate image mime type and size limits
- When attaching file, validate file size (<50MB) and allowed types
- Use Supabase RLS - don't manually filter by user, let policies handle it
- Increment content_count using `UPDATE spatial_markers SET content_count = content_count + 1 WHERE id = ?`

---

### P1.7 - [ ] Create API route for chunked IFC file upload
**Description:** Implement resumable chunked file upload API endpoint to handle large IFC files (up to 500MB) with progress tracking.

**Files to Create/Modify:**
- `app/api/spatial/upload-model/route.ts` (new file)
- `lib/upload-helpers.ts` (new file for shared upload utilities)

**Dependencies:** P1.5

**Acceptance Criteria:**
- [ ] POST `/api/spatial/upload-model` accepts multipart form data with chunk metadata
- [ ] Request body: `{ projectId, fileName, chunkIndex, totalChunks, chunkData }`
- [ ] Stores chunks in temporary Vercel Blob location: `/temp/uploads/{uploadId}/chunk-{index}`
- [ ] When final chunk received, assembles complete file and validates IFC format
- [ ] File validation: Check magic bytes for IFC header (`ISO-10303-21`)
- [ ] Creates model record via `createModelRecord()` server action with processing_status='pending'
- [ ] Returns upload progress: `{ uploadId, chunksReceived, totalChunks, complete: boolean }`
- [ ] If upload times out (30 min), cleans up incomplete chunks
- [ ] Auth check: Verify user has access to projectId via session
- [ ] Error responses follow GenHub API patterns (see SYSTEM.md)

**Complexity:** L

**Technical Considerations:**
- Use Next.js 16 route handlers with `export async function POST(request: Request)`
- Import auth: `import { auth } from '@/lib/auth'`
- Each chunk max 5MB (configured in client upload component)
- uploadId generated server-side: `crypto.randomUUID()`
- Store chunk metadata in temporary database table or in-memory map with TTL
- Use Vercel Blob SDK: `import { put } from '@vercel/blob'`
- Cleanup: Delete temp chunks after successful assembly or after timeout
- For large file assembly, consider streaming instead of loading all into memory
- Set appropriate timeout for API route (5 min for file assembly)

---

### P1.8 - [ ] Create API route for IFC to XKT conversion
**Description:** Implement serverless function to convert uploaded IFC files to xeokit's optimized XKT format with LOD generation.

**Files to Create/Modify:**
- `app/api/spatial/convert-model/route.ts` (new file)
- `lib/ifc-converter.ts` (new file for conversion logic)
- `package.json` (add @xeokit/xeokit-convert dependency)

**Dependencies:** P1.7

**Acceptance Criteria:**
- [ ] POST `/api/spatial/convert-model` accepts `{ modelId }` in request body
- [ ] Fetches model record and downloads original IFC file from storage
- [ ] Converts IFC to XKT using @xeokit/xeokit-convert library
- [ ] Generates 3 LOD levels: high (full detail), medium (simplified), low (bounding boxes)
- [ ] Uploads XKT files to Vercel Blob: `/models/{projectId}/{modelId}/model.xkt`, `/models/{projectId}/{modelId}/lod-medium.xkt`, `/models/{projectId}/{modelId}/lod-low.xkt`
- [ ] Updates model record with xkt_file_url, lod_*_url, processing_status='ready'
- [ ] On error, updates processing_status='failed' with processing_error message
- [ ] Returns `{ success: boolean, modelId, xktUrl?, error? }`
- [ ] Execution time limit: 5 minutes (configure in vercel.json)
- [ ] Cleanup: Delete original IFC from temp location after successful conversion

**Complexity:** XL

**Technical Considerations:**
- This is compute-intensive, may require serverless function with increased memory (1024MB)
- xeokit-convert is Node.js only (not browser compatible)
- Consider using child_process to spawn converter in separate process for memory isolation
- If conversion exceeds time limit, queue to background job service (future enhancement)
- Generate thumbnail: Render top-down view using xeokit in headless browser (puppeteer) or skip for MVP
- Extract metadata: Parse IFC spatial hierarchy (IfcBuildingStorey → floors array)
- Populate model_elements table with extracted IFC elements
- Error handling: Catch IFC parsing errors, malformed files, unsupported IFC versions
- Security: Validate IFC file is not malicious (basic validation, full malware scan is future enhancement)

---

### P1.9 - [ ] Create API route for streaming model delivery
**Description:** Implement optimized model file delivery with CDN caching headers and range request support for progressive loading.

**Files to Create/Modify:**
- `app/api/spatial/models/[modelId]/stream/route.ts` (new file)

**Dependencies:** P1.8

**Acceptance Criteria:**
- [ ] GET `/api/spatial/models/{modelId}/stream?lod={high|medium|low}` returns XKT file as stream
- [ ] Fetches model record and determines correct XKT file URL based on `lod` query param
- [ ] Proxies file from Vercel Blob storage with appropriate headers
- [ ] Response headers: `Content-Type: application/octet-stream`, `Cache-Control: public, max-age=31536000, immutable`
- [ ] Supports HTTP range requests for progressive loading (206 Partial Content)
- [ ] Auth check: Verify user has access to project associated with model
- [ ] Returns 404 if model not found or processing_status != 'ready'
- [ ] Returns 403 if user lacks permission to access project
- [ ] Logs access for analytics (optional)

**Complexity:** M

**Technical Considerations:**
- Use Next.js streaming response: `new Response(stream, { headers })`
- Range request support for mobile progressive loading (important for 50MB+ files)
- Set aggressive cache headers since XKT files are immutable (version-based URLs)
- RLS check: Query spatial_markers or projects_3d_models to verify user access
- Consider adding ETag header for conditional requests (future enhancement)
- Monitor bandwidth usage (Vercel Blob egress costs)

---

### P1.10 - [ ] Create TypeScript types for spatial domain
**Description:** Define comprehensive TypeScript interfaces and types for spatial markers, 3D coordinates, model metadata, and API responses.

**Files to Create/Modify:**
- `types/spatial.d.ts` (new file)

**Dependencies:** P1.4 (database types regenerated)

**Acceptance Criteria:**
- [ ] `SpatialMarker` interface matching spatial_markers table
- [ ] `MarkerContent` interface matching marker_content table
- [ ] `Project3DModel` interface matching projects_3d_models table
- [ ] `ModelElement` interface matching model_elements table
- [ ] `Position3D` type: `{ x: number, y: number, z: number }`
- [ ] `Normal3D` type: `{ x: number, y: number, z: number }`
- [ ] `BoundingBox` type matching JSONB bounds format
- [ ] `FloorInfo` type matching JSONB floors format
- [ ] `MarkerWithContent` type (marker joined with content array)
- [ ] `UploadChunkMetadata` interface for chunked upload state
- [ ] `ModelProcessingStatus` enum/type
- [ ] API response types: `CreateMarkerResponse`, `UploadModelResponse`, etc.
- [ ] Export all types from single file for easy import

**Complexity:** S

**Technical Considerations:**
- Extend database.types.ts types where possible (don't duplicate)
- Use `Database['public']['Tables']['spatial_markers']['Row']` as base for SpatialMarker
- Add helper types for common queries: `type MarkerWithProject = SpatialMarker & { project: Project }`
- Use strict typing: avoid `any`, prefer `unknown` for polymorphic content
- Document complex types with JSDoc comments
- Future-proof: Leave room for adding fields without breaking changes

---

## Phase 2: 3D Rendering Core (2 weeks)

### P2.1 - [ ] Integrate xeokit SDK into project
**Description:** Install and configure xeokit-sdk with proper TypeScript declarations and Next.js compatibility.

**Files to Create/Modify:**
- `package.json` (add dependencies)
- `lib/xeokit/index.ts` (xeokit initialization utilities)
- `types/xeokit.d.ts` (TypeScript declarations if needed)

**Dependencies:** None (can start in parallel with Phase 1)

**Acceptance Criteria:**
- [ ] Dependencies installed: `@xeokit/xeokit-sdk` (latest stable)
- [ ] Verify xeokit works in Next.js client components (browser-only, no SSR issues)
- [ ] Create xeokit initialization helper: `initXeokit(canvasElement, options)`
- [ ] Create cleanup helper: `destroyXeokit(viewer)` for proper WebGL context disposal
- [ ] TypeScript types working (either from @types or custom declarations)
- [ ] Test in development build (no console errors)
- [ ] Test in production build (optimized, tree-shaken)
- [ ] Document any Next.js specific configuration needed

**Complexity:** M

**Technical Considerations:**
- xeokit requires browser environment (use `'use client'` directive)
- Check if xeokit has side effects that break SSR (wrap in dynamic import with ssr: false if needed)
- Verify WebGL2 context creation works on target browsers (Chrome, Firefox, Safari, Edge)
- Consider lazy loading xeokit SDK to reduce initial bundle size
- xeokit global instance management (avoid memory leaks with multiple viewer instances)
- Check license compatibility (xeokit SDK is open source)

---

### P2.2 - [ ] Create 3DViewerCanvas component
**Description:** Implement the core 3D viewer React component that manages xeokit viewer lifecycle, canvas rendering, and WebGL context.

**Files to Create/Modify:**
- `components/projects/spatial/3DViewerCanvas.tsx` (new file)
- `lib/xeokit/viewer-manager.ts` (new file for viewer state management)

**Dependencies:** P2.1

**Acceptance Criteria:**
- [ ] Component renders HTML5 canvas element with proper sizing (fills container)
- [ ] Initializes xeokit Viewer on mount with WebGL2 context
- [ ] Accepts props: `modelUrl`, `onReady`, `onError`, `initialCamera?`
- [ ] Loads XKT model from URL when modelUrl changes
- [ ] Displays loading progress indicator while model loads
- [ ] Fires `onReady(viewer)` callback when model fully loaded
- [ ] Fires `onError(error)` callback on load failure or WebGL errors
- [ ] Cleans up viewer and WebGL context on unmount (prevents memory leaks)
- [ ] Handles canvas resize responsively (window resize, container resize)
- [ ] Responsive: Canvas uses 100% container width/height, maintains aspect ratio
- [ ] Mobile: Touch events work for pan/zoom/rotate

**Complexity:** L

**Technical Considerations:**
- Use `useEffect` hook for viewer initialization and cleanup
- Store viewer instance in `useRef` to persist across re-renders
- Use ResizeObserver API to detect canvas container size changes
- Handle edge cases: model URL changes while previous model loading, component unmounted during load
- WebGL context lost handling: Listen for 'webglcontextlost' event, attempt restore
- Mobile: Enable touch controls via xeokit config: `{ input: { pointerEnabled: true } }`
- Performance: Debounce resize handler (avoid excessive viewer.scene.canvas.boundary updates)
- Debug: Add console.log statements for lifecycle events (per frontend_mdc.md requirement)

---

### P2.3 - [ ] Implement camera controls and navigation
**Description:** Add intuitive camera controls for desktop (mouse) and mobile (touch) with preset camera positions and navigation modes.

**Files to Create/Modify:**
- `components/projects/spatial/CameraControls.tsx` (new file)
- `lib/xeokit/camera-presets.ts` (new file for preset camera positions)

**Dependencies:** P2.2

**Acceptance Criteria:**
- [ ] Mouse controls: Left-drag rotate, right-drag pan, scroll wheel zoom
- [ ] Touch controls: One-finger rotate, two-finger pinch zoom, two-finger drag pan
- [ ] Keyboard controls: WASD for first-person movement, arrow keys for camera orbit, +/- for zoom
- [ ] Preset camera views: Top, Front, Side, Isometric (buttons in UI)
- [ ] "Fit to view" button: Automatically frames entire model in viewport
- [ ] "Reset camera" button: Returns to initial camera position
- [ ] First-person mode toggle: WASD walking navigation vs orbit mode
- [ ] Camera position persisted in URL query params (enables sharing specific views)
- [ ] Smooth camera transitions (animated, not instant jumps)
- [ ] Camera speed configurable (slow for precision, fast for large models)
- [ ] Component exposes imperative API: `setCameraPosition(eye, look, up)`, `flyTo(target)`

**Complexity:** M

**Technical Considerations:**
- Use xeokit's CameraControl plugin for mouse/touch handling
- Camera state: `{ eye: [x,y,z], look: [x,y,z], up: [0,0,1] }` (Z-up coordinate system)
- Fit-to-view: Calculate from model bounding box (viewer.scene.getAABB())
- First-person mode: Use xeokit's CameraFlightAnimation with walk constraints
- URL persistence: Use Next.js router query params, e.g., `?camera=x,y,z,lx,ly,lz`
- Accessibility: Camera controls must be keyboard accessible (focus management)
- Mobile: Larger touch targets (min 44x44px) for control buttons
- Performance: Throttle camera update events to avoid excessive re-renders

---

### P2.4 - [ ] Implement IFC to XKT conversion service
**Description:** Build the server-side service that converts uploaded IFC files to optimized XKT format using xeokit-convert.

**Files to Create/Modify:**
- `lib/services/ifc-conversion-service.ts` (new file)
- `scripts/test-ifc-conversion.ts` (test script for local development)

**Dependencies:** P1.8 (API route defined), P2.1 (xeokit SDK available)

**Acceptance Criteria:**
- [ ] Service exports `convertIFCtoXKT(inputPath, outputPath, options)` function
- [ ] Accepts IFC 2x3 and IFC 4 file formats
- [ ] Generates XKT file with full geometry (high LOD)
- [ ] Optionally generates simplified LODs (medium and low) via options parameter
- [ ] Returns conversion result: `{ success: boolean, xktPath?, metadata?, error? }`
- [ ] Metadata includes: element count, floor count, bounding box, IFC application info
- [ ] Handles large files (50MB+) without memory overflow (stream processing if possible)
- [ ] Conversion completes within 5 minutes for 50MB IFC files
- [ ] Error handling: Invalid IFC format, corrupted files, unsupported IFC versions
- [ ] Cleanup: Deletes temporary files on success or failure
- [ ] Test script validates conversion with sample IFC file

**Complexity:** XL

**Technical Considerations:**
- Use @xeokit/xeokit-convert CLI tool via child_process.spawn()
- Alternative: Use xeokit's JavaScript API directly (if available)
- Memory management: Node.js serverless functions have 1GB memory limit (adjust if needed)
- Execution time: Vercel serverless functions have 10s default timeout (configure to 300s in vercel.json)
- LOD generation: xeokit-convert may not support automatic LOD (may need manual implementation)
- For LOD: Simplify geometry by reducing polygon count (use decimation algorithm or skip for MVP)
- Bounding box: Parse IFC coordinate system and calculate from IfcSite or IfcBuilding
- Floor extraction: Parse IfcBuildingStorey elements, extract Name and Elevation properties
- Security: Validate IFC file doesn't exploit parser vulnerabilities (use try-catch, limit parse time)
- Future: Queue long conversions to background job service (BullMQ, Inngest, etc.)

---

### P2.5 - [ ] Create model loading with progress indicator
**Description:** Implement robust model loading state management with progress tracking, error states, and retry logic.

**Files to Create/Modify:**
- `components/projects/spatial/ModelLoader.tsx` (new file)
- `hooks/use-model-loading.ts` (new file for loading state hook)

**Dependencies:** P2.2, P2.4

**Acceptance Criteria:**
- [ ] Component displays loading UI while model downloads and parses
- [ ] Progress bar shows: 0-50% download, 50-100% parsing
- [ ] Loading states: 'idle', 'downloading', 'parsing', 'ready', 'error'
- [ ] Error UI displays specific error messages: network error, parse error, WebGL error, permission denied
- [ ] Retry button on error (attempts reload up to 3 times with exponential backoff)
- [ ] Cancel button allows aborting download in progress
- [ ] Skeleton loader shows model thumbnail (if available) with blur effect during load
- [ ] Loading overlay fades out smoothly when model ready (CSS transition)
- [ ] Mobile: Loading UI adapts to small screens (smaller progress bar, concise text)
- [ ] Accessibility: Loading state announced to screen readers (aria-live)

**Complexity:** M

**Technical Considerations:**
- Use custom hook: `const { loadModel, state, progress, error, retry, cancel } = useModelLoading()`
- Track download progress via fetch API with response.body.getReader() (streaming)
- Track parse progress via xeokit's progress events (if exposed)
- Error types: NetworkError, ParseError, WebGLError, AuthError (use TypeScript discriminated unions)
- Exponential backoff: Retry after 1s, 2s, 4s delays
- Cancel: Use AbortController to cancel fetch request
- Fallback: If XKT unavailable, show message prompting to upload model
- Cache: Store loaded model in IndexedDB to avoid re-download (Phase 5 integration)

---

### P2.6 - [ ] Implement Level of Detail (LOD) system
**Description:** Create dynamic LOD system that switches between high/medium/low detail models based on camera distance and device capabilities.

**Files to Create/Modify:**
- `components/projects/spatial/LODManager.tsx` (new file)
- `lib/xeokit/lod-selector.ts` (new file for LOD selection logic)

**Dependencies:** P2.3, P2.4 (LOD files available)

**Acceptance Criteria:**
- [ ] System loads low LOD initially for fast first paint (progressive enhancement)
- [ ] Switches to medium LOD when camera within medium distance threshold
- [ ] Switches to high LOD when camera close to model or user zooms in
- [ ] LOD thresholds configurable: `{ low: Infinity, medium: 100m, high: 20m }` (from camera to model center)
- [ ] Mobile devices cap at medium LOD to preserve memory/performance
- [ ] Desktop loads high LOD by default for quality
- [ ] LOD changes smoothly (crossfade transition, not instant swap)
- [ ] Displays LOD indicator badge in UI: "High Detail", "Medium Detail", "Low Detail"
- [ ] User can manually override LOD (force high detail even on mobile)
- [ ] Fires analytics event when LOD changes (for performance monitoring)

**Complexity:** M

**Technical Considerations:**
- Calculate camera distance: `distance(cameraPosition, modelBounds.center)`
- LOD URLs: high = xkt_file_url, medium = lod_medium_url, low = lod_low_url
- Crossfade: Load new LOD in background, swap when ready, fade out old LOD
- Memory: Unload previous LOD model from xeokit to free memory
- Mobile detection: Use device memory API (`navigator.deviceMemory < 4GB → force medium LOD`)
- Performance: Monitor FPS, downgrade LOD if FPS drops below 30 (adaptive LOD)
- Edge case: If medium/low LOD not available, stay on high LOD
- Future: Implement frustum-based LOD (different detail for visible vs non-visible parts)

---

### P2.7 - [ ] Implement basic object interaction (click detection)
**Description:** Add click/tap detection on 3D objects to enable marker placement and element inspection.

**Files to Create/Modify:**
- `components/projects/spatial/InteractionLayer.tsx` (new file)
- `hooks/use-3d-interaction.ts` (new file)

**Dependencies:** P2.2

**Acceptance Criteria:**
- [ ] Click on 3D surface highlights the clicked element (visual feedback)
- [ ] Returns intersection data: `{ elementId, position: {x,y,z}, normal: {x,y,z}, surfaceType }`
- [ ] Works with both mouse clicks and touch taps
- [ ] Hover shows tooltip with element name (desktop only)
- [ ] Right-click shows context menu (future enhancement, not MVP)
- [ ] Click detection ignores empty space (no object hit)
- [ ] Fires `onElementClick(element)` callback with element metadata
- [ ] Fires `onSurfaceClick(position, normal)` callback for marker placement
- [ ] Visual feedback: Highlight fades after 2 seconds (CSS animation)
- [ ] Mobile: Touch-hold gesture shows element info (1 second hold)

**Complexity:** M

**Technical Considerations:**
- Use xeokit's PickResult API: `viewer.scene.pick({ canvasPos: [x, y] })`
- PickResult returns: entity (IFC element), worldPos (3D coordinates), worldNormal (surface orientation)
- Map xeokit entity ID to IFC element GUID (stored in model_elements table)
- Highlight: Use xeokit's Entity.highlighted property or overlay colored mesh
- Raycasting: xeokit handles GPU-based picking (fast, no CPU overhead)
- Touch: Distinguish between tap (click) and hold (inspect) using touch event timers
- Debounce: Prevent double-clicks from firing multiple events
- Edge case: Handle clicks on transparent/glass objects (IFC IfcWindow with transparency)

---

## Phase 3: Marker System (2 weeks)

### P3.1 - [ ] Implement click-to-place marker functionality
**Description:** Enable users to click anywhere in 3D space to create a new spatial marker with precise coordinates and surface normal.

**Files to Create/Modify:**
- `components/projects/spatial/MarkerPlacement.tsx` (new file)
- `hooks/use-marker-placement.ts` (new file)

**Dependencies:** P2.7 (click detection), P1.6 (createMarker action)

**Acceptance Criteria:**
- [ ] "Place Marker" button toggles placement mode (cursor changes to crosshair)
- [ ] Click on 3D surface shows marker preview at clicked position
- [ ] Preview includes: marker icon, position indicator, surface normal visualization
- [ ] Opens quick form: marker type selector, title input, optional description
- [ ] Form validates: title required (1-100 chars), type required
- [ ] "Confirm" button creates marker via `createMarker()` server action
- [ ] "Cancel" button removes preview and exits placement mode
- [ ] Newly created marker immediately appears in 3D view
- [ ] Success toast: "Marker created at [Floor Name]"
- [ ] Error toast if creation fails: "Failed to create marker: [error message]"
- [ ] Mobile: Touch-friendly placement (large tap targets, simplified form)

**Complexity:** M

**Technical Considerations:**
- Use state machine: 'idle' → 'placing' → 'confirming' → 'creating' → 'idle'
- Store picked position and normal in state until confirmed
- Marker preview: Render temporary HTML/CSS marker overlay at 3D position (project 3D to 2D screen coords)
- Call `createMarker()` server action with: `{ project_id, model_id, position_x, position_y, position_z, normal_x, normal_y, normal_z, type, title, description }`
- Optimistic UI: Show marker immediately, rollback if server action fails
- Sync: After creation, marker appears for all users via Supabase Realtime (Phase 5)
- Validation: Check position is within model bounds before allowing placement
- Floor detection: Determine floor_id by checking position_z against floor elevations

---

### P3.2 - [ ] Create MarkerPanel component (display markers list)
**Description:** Build side panel component that displays all markers for the current project with filtering, sorting, and click-to-navigate.

**Files to Create/Modify:**
- `components/projects/spatial/MarkerPanel.tsx` (new file)
- `components/projects/spatial/MarkerListItem.tsx` (new file)

**Dependencies:** P1.6 (getProjectMarkers action)

**Acceptance Criteria:**
- [ ] Panel displays scrollable list of markers with virtualization (for 1000+ markers)
- [ ] Each marker shows: type icon, title, floor name, timestamp, content count badge
- [ ] Click marker in list navigates 3D camera to marker position (smooth flyTo animation)
- [ ] Search input filters markers by title (debounced, 300ms delay)
- [ ] Filter dropdowns: type (all/photo/document/note/issue/progress/task/material), status (all/active/resolved/archived), floor (all/floor1/floor2/...)
- [ ] Sort options: Recent (last_activity_at desc), Oldest (created_at asc), Floor (floor_name asc)
- [ ] Selected marker highlighted in list and in 3D view
- [ ] "Create Marker" button at top of panel (opens placement mode)
- [ ] Empty state: "No markers yet. Click 'Create Marker' to get started."
- [ ] Responsive: Panel collapses to bottom sheet on mobile, full-height sidebar on desktop

**Complexity:** M

**Technical Considerations:**
- Fetch markers on page load via server component, pass as props to panel
- Use React virtualization: `react-window` or `@tanstack/react-virtual` for long lists
- Filter/sort in client state (don't refetch from server for each filter change)
- FlyTo: Use camera controls from P2.3: `cameraControls.flyTo(marker.position, duration: 1000)`
- Highlight: Set marker.highlighted = true in xeokit, unhighlight others
- Mobile bottom sheet: Use Radix Dialog or Vaul drawer component
- Debounce search: Use `useDeferredValue` or `useDebounce` hook
- Accessibility: Keyboard navigation through marker list (arrow keys), screen reader support

---

### P3.3 - [ ] Create ContentDrawer component (show marker content)
**Description:** Implement drawer component that displays detailed marker information including attached photos, files, notes, and activity timeline.

**Files to Create/Modify:**
- `components/projects/spatial/ContentDrawer.tsx` (new file)
- `components/projects/spatial/PhotoGallery.tsx` (new file)
- `components/projects/spatial/FileList.tsx` (new file)
- `components/projects/spatial/NotesList.tsx` (new file)
- `components/projects/spatial/ActivityTimeline.tsx` (new file)

**Dependencies:** P1.6 (getMarkerContent action), P3.2

**Acceptance Criteria:**
- [ ] Drawer opens when marker clicked in 3D view or marker panel
- [ ] Header shows: marker title, type badge, status badge, edit/delete buttons (if permitted)
- [ ] Tabs: Photos, Files, Notes, Activity
- [ ] Photos tab: Grid gallery, click to open lightbox, download button, delete button (creator only)
- [ ] Files tab: List with file icon, name, size, download button, delete button (creator only)
- [ ] Notes tab: Threaded comments, reply button, rich text formatting (bold, lists), @mentions
- [ ] Activity tab: Timeline of all events (marker created, photo added, task completed, etc.)
- [ ] "Add Photo" button opens file picker, uploads via `attachContentToMarker()` action
- [ ] "Add File" button opens file picker, uploads via `attachContentToMarker()` action
- [ ] "Add Note" button opens text editor, saves via `attachContentToMarker()` action
- [ ] Drawer closes via X button, backdrop click, or ESC key
- [ ] Mobile: Drawer slides from bottom, covers 80% of screen

**Complexity:** L

**Technical Considerations:**
- Use Radix Dialog for drawer (drawer is a full-screen dialog on mobile)
- Tabs: Use Radix Tabs component with Aceternity UI styling
- Photo gallery: Grid layout with aspect ratio preservation, lazy load images
- Lightbox: Use simple-react-lightbox or custom modal
- File upload: Handle via FormData, POST to server action, show upload progress
- Rich text editor: Use simple contentEditable with basic formatting (avoid heavy deps like Quill)
- @mentions: Parse @username syntax, link to user profiles (future enhancement)
- Activity timeline: Fetch from marker_content where type='activity', sort by created_at desc
- Delete: Confirm dialog before deletion, call `deleteMarkerContent()` action
- RLS: Server actions enforce permissions (creator or GC/PM can delete)

---

### P3.4 - [ ] Implement marker CRUD operations (Server Actions)
**Description:** Already completed in P1.6, but this task focuses on client-side integration and error handling for marker operations.

**Files to Create/Modify:**
- `hooks/use-marker-mutations.ts` (new file for client-side mutation hooks)

**Dependencies:** P1.6, P3.1, P3.2, P3.3

**Acceptance Criteria:**
- [ ] Hook exports: `useCreateMarker()`, `useUpdateMarker()`, `useDeleteMarker()`
- [ ] Each hook returns: `{ mutate, isLoading, error, reset }`
- [ ] `useCreateMarker()` wraps `createMarker()` server action with optimistic updates
- [ ] `useUpdateMarker()` wraps `updateMarker()` server action with optimistic updates
- [ ] `useDeleteMarker()` wraps `deleteMarker()` server action with confirm dialog
- [ ] Optimistic updates: Immediately add/update/remove marker from client state, rollback on error
- [ ] Error handling: Show toast notification with error message
- [ ] Success handling: Show toast notification, close forms/dialogs
- [ ] Revalidation: Automatically refresh marker list after mutation
- [ ] Loading states: Disable buttons during mutation, show spinner

**Complexity:** M

**Technical Considerations:**
- Use React hooks pattern, not React Query (keep deps minimal)
- Optimistic update: Append marker to local state before server response
- Rollback: Remove marker from state if server action returns error
- Toast: Use Aceternity UI toast component or Radix Toast
- Confirm dialog: "Are you sure you want to delete this marker? This action cannot be undone."
- Revalidation: Use Next.js `useRouter().refresh()` or manual state update
- TypeScript: Ensure type safety for mutate functions (parameters match server action types)

---

### P3.5 - [ ] Implement photo attachment to markers
**Description:** Enable users to upload photos from camera or file system and attach them to spatial markers with thumbnail generation.

**Files to Create/Modify:**
- `components/projects/spatial/PhotoUploader.tsx` (new file)
- `app/api/spatial/upload-photo/route.ts` (new file)
- `lib/image-processing.ts` (new file for thumbnail generation)

**Dependencies:** P3.3 (ContentDrawer), P1.6 (attachContentToMarker action)

**Acceptance Criteria:**
- [ ] Photo upload button in ContentDrawer Photos tab
- [ ] Supports file picker (input type=file accept=image/*) and camera capture (capture=environment on mobile)
- [ ] Client-side image preview before upload (show thumbnail)
- [ ] Client-side validation: max 10MB per photo, formats: JPEG, PNG, WebP
- [ ] Upload progress bar (0-100%)
- [ ] Server generates thumbnail (max 400px width, maintains aspect ratio)
- [ ] Extracts EXIF metadata: GPS coordinates, camera model, timestamp, orientation
- [ ] Uploads full-size image and thumbnail to Vercel Blob: `/markers/{markerId}/photos/{photoId}.jpg`, `/markers/{markerId}/photos/{photoId}_thumb.jpg`
- [ ] Creates marker_content record via `attachContentToMarker()` with type='photo'
- [ ] Photo appears immediately in gallery (optimistic UI)
- [ ] Error handling: Upload failed, invalid format, file too large

**Complexity:** L

**Technical Considerations:**
- Use HTML5 File API for file picker
- Camera capture: `<input type="file" accept="image/*" capture="environment" />`
- Client preview: Use FileReader API to generate data URL
- EXIF extraction: Use exif-js library (browser-compatible)
- Image orientation: Apply EXIF orientation transform before upload (rotate if needed)
- Thumbnail generation: Use Canvas API in browser or server-side with Sharp library
- Upload: POST to `/api/spatial/upload-photo` with FormData, track progress via onUploadProgress
- Compression: Optionally compress large photos before upload (use browser-image-compression library)
- Multiple photos: Support batch upload (select multiple files)

---

### P3.6 - [ ] Implement file attachment to markers
**Description:** Enable users to attach documents, drawings, and other file types to spatial markers with file type icons and download functionality.

**Files to Create/Modify:**
- `components/projects/spatial/FileUploader.tsx` (new file)
- `app/api/spatial/upload-file/route.ts` (new file)

**Dependencies:** P3.3 (ContentDrawer), P1.6 (attachContentToMarker action)

**Acceptance Criteria:**
- [ ] File upload button in ContentDrawer Files tab
- [ ] Supports file picker (input type=file) with multiple file selection
- [ ] Accepted file types: PDF, DOC/DOCX, XLS/XLSX, DWG, DXF, images (JPEG, PNG), ZIP (max 50MB per file)
- [ ] Client-side validation: file size, file type
- [ ] Upload progress bar for each file (batch upload)
- [ ] Generates file type icon based on mime type (PDF icon, Word icon, Excel icon, etc.)
- [ ] Stores file in Vercel Blob: `/markers/{markerId}/files/{fileId}_{fileName}`
- [ ] Creates marker_content record with type='file', file_url, file_name, file_size_bytes, file_mime_type
- [ ] File appears in list immediately (optimistic UI)
- [ ] Download button generates signed download URL (secure, time-limited)
- [ ] Error handling: Upload failed, invalid type, file too large

**Complexity:** M

**Technical Considerations:**
- Mime type detection: Use file.type from File API, validate against whitelist
- File icons: Use Lucide icons (FileText for PDF, FileSpreadsheet for Excel, etc.)
- Batch upload: Upload files sequentially or in parallel (limit 3 concurrent)
- Signed URLs: Generate via Vercel Blob SDK with expiration (e.g., 1 hour)
- Security: Validate file extension matches mime type (prevent .exe disguised as .pdf)
- Virus scanning: Future enhancement (use ClamAV or third-party API)
- Large files: Consider resumable upload for files >10MB (similar to P1.7 chunked upload)

---

### P3.7 - [ ] Implement notes and comments on markers
**Description:** Add rich text note and comment functionality to markers with threaded discussions and @mentions.

**Files to Create/Modify:**
- `components/projects/spatial/NoteEditor.tsx` (new file)
- `components/projects/spatial/NoteItem.tsx` (new file)
- `lib/text-formatting.ts` (new file for simple markdown/rich text)

**Dependencies:** P3.3 (ContentDrawer), P1.6 (attachContentToMarker action)

**Acceptance Criteria:**
- [ ] "Add Note" button opens text editor in ContentDrawer Notes tab
- [ ] Text editor supports: Bold (**text**), italic (*text*), bulleted lists (- item), numbered lists (1. item)
- [ ] Editor supports @mentions: Type @username, shows autocomplete dropdown, inserts mention
- [ ] "Save" button creates marker_content record with type='note', note_text, note_format='markdown'
- [ ] Notes display with formatting rendered (convert markdown to HTML)
- [ ] Each note shows: author avatar, author name, timestamp, note text, reply button
- [ ] Reply button opens nested editor (threaded comments, 1 level deep only)
- [ ] Edit button (creator only) makes note editable inline
- [ ] Delete button (creator only) removes note with confirm dialog
- [ ] Notes sorted by created_at desc (newest first)
- [ ] Empty state: "No notes yet. Add one to start the discussion."

**Complexity:** M

**Technical Considerations:**
- Rich text: Use contentEditable div with simple formatting toolbar (avoid heavy editors)
- Markdown: Use simple parser (marked or custom regex for bold/italic/lists)
- @mentions: Parse @username, fetch matching users, store as `@[User Name](userId)` in markdown
- Render mentions: Convert to clickable links to user profile (future enhancement)
- Threading: Store parent_content_id in marker_content for replies (extend schema in P1.3 if not already present)
- XSS prevention: Sanitize HTML output (use DOMPurify or escape HTML)
- Accessibility: Contenteditable editor must have aria-label, keyboard shortcuts (Cmd+B for bold)

---

### P3.8 - [ ] Implement marker clustering for dense areas
**Description:** Automatically group nearby markers into clusters to prevent visual clutter and improve performance.

**Files to Create/Modify:**
- `components/projects/spatial/MarkerClusterer.tsx` (new file)
- `lib/clustering/cluster-algorithm.ts` (new file)

**Dependencies:** P3.1, P3.2 (markers rendered in 3D)

**Acceptance Criteria:**
- [ ] Markers within 1 meter of each other automatically cluster into single cluster icon
- [ ] Cluster icon shows count badge: "5 markers"
- [ ] Click cluster icon zooms camera to cluster and expands markers (unclusters)
- [ ] As camera zooms in, clusters automatically uncluster (distance-based)
- [ ] Clustering updates dynamically as camera moves (debounced, not every frame)
- [ ] Cluster color indicates predominant marker type (e.g., blue for photo, yellow for issue)
- [ ] Hover on cluster shows preview of marker titles (tooltip)
- [ ] Clustering can be toggled off in viewer settings (show all markers unclustered)
- [ ] Performance: Clustering algorithm runs in <50ms for 1000 markers

**Complexity:** M

**Technical Considerations:**
- Clustering algorithm: Use k-means or DBSCAN (density-based spatial clustering)
- Simple approach: Grid-based clustering (divide 3D space into cells, group markers in same cell)
- Distance calculation: Euclidean distance in 3D space: `sqrt((x1-x2)^2 + (y1-y2)^2 + (z1-z2)^2)`
- Cluster threshold: 1 meter = 1 unit in model coordinate system (verify with IFC scale)
- Debounce: Recalculate clusters only when camera stops moving (use 500ms debounce)
- Cluster icon: Render as HTML overlay at cluster centroid position
- Uncluster: On click, set cluster_id=null, re-render individual markers
- Future: Store cluster_id in database (persist clusters across sessions)

---

### P3.9 - [ ] Implement marker filtering and search
**Description:** Add comprehensive filtering and search functionality to quickly find markers by type, status, location, content, or keywords.

**Files to Create/Modify:**
- `components/projects/spatial/MarkerFilters.tsx` (new file)
- `components/projects/spatial/MarkerSearch.tsx` (new file)

**Dependencies:** P3.2 (MarkerPanel)

**Acceptance Criteria:**
- [ ] Search input searches: marker title, description, note text, file names (full-text search)
- [ ] Filter by type: Checkboxes for photo, document, note, issue, progress, task, material (multi-select)
- [ ] Filter by status: Checkboxes for active, resolved, archived (multi-select)
- [ ] Filter by floor: Dropdown with floor names from model metadata (single-select)
- [ ] Filter by date range: Date picker for created_at (from - to)
- [ ] Filter by creator: Dropdown with team members (single-select)
- [ ] "Clear filters" button resets all filters
- [ ] Filtered markers highlighted in 3D view, non-matching markers dimmed (opacity 0.3)
- [ ] Filter count badge: "5 active filters"
- [ ] Search results ordered by relevance (title match > description match > note match)

**Complexity:** M

**Technical Considerations:**
- Full-text search: Use client-side Fuse.js library for fuzzy search (lightweight)
- Alternative: Use Supabase full-text search (tsvector) for server-side search (better for large datasets)
- Multi-select filters: Use OR logic within same category, AND logic across categories
- Example: (type='photo' OR type='document') AND status='active' AND floor_id='floor-1'
- Date range: Use date picker component (Radix Calendar or react-day-picker)
- Dimming: Set marker opacity in 3D view, or hide non-matching markers entirely (toggle option)
- Performance: Apply filters client-side on already-fetched markers (no server round-trip)
- URL persistence: Store filter state in URL query params (enables sharing filtered views)

---

## Phase 4: GenHub Integration (2 weeks)

### P4.1 - [ ] Integrate with Metro Journey phases (phase filtering)
**Description:** Connect spatial markers to project phases and enable filtering by phase in the 3D viewer.

**Files to Create/Modify:**
- `components/projects/spatial/PhaseFilter.tsx` (new file)
- `app/actions/spatial.ts` (extend with phase-related queries)

**Dependencies:** P3.9 (filtering system), existing Metro Journey implementation

**Acceptance Criteria:**
- [ ] Phase filter dropdown shows all project phases (from project_phases table)
- [ ] Selecting phase filters markers to only those with matching phase_id
- [ ] Unassigned markers (phase_id=null) shown when "All Phases" selected
- [ ] When creating marker, optional "Link to Phase" dropdown pre-populated with current project phase
- [ ] Phase badge displayed on marker card in MarkerPanel
- [ ] 3D view color-codes markers by phase (different colors for Initiation, Planning, Construction, etc.)
- [ ] "View in 3D" link added to MetroStepper phase cards (navigates to 3D viewer filtered by phase)
- [ ] Phase timeline overlay in 3D viewer (shows phase progress bar)

**Complexity:** M

**Technical Considerations:**
- Fetch project_phases via existing server action (likely `getProjectPhases()`)
- Store selected phase_id in marker creation form state
- Phase colors: Use GenHub phase color scheme (from UI_RULES.md or existing Phase components)
- MetroStepper integration: Add button to existing PhaseCard component
- Link format: `/app/projects/{projectId}/spatial?phase={phaseId}`
- Timeline overlay: Horizontal bar at top of 3D viewer showing phase milestones

---

### P4.2 - [ ] Integrate with task system (link tasks to markers)
**Description:** Enable linking tasks to spatial markers and adding "View in 3D" functionality to task cards.

**Files to Create/Modify:**
- `components/tasks/TaskCard.tsx` (modify existing)
- `components/projects/spatial/TaskLinker.tsx` (new file)
- `app/actions/tasks.ts` (extend with spatial_marker_id field)

**Dependencies:** P3.1 (markers exist), existing task system

**Acceptance Criteria:**
- [ ] Task creation/edit form includes "Location" field with "Set in 3D View" button
- [ ] "Set in 3D View" button opens 3D viewer in marker placement mode, links task to placed marker
- [ ] TaskCard displays location badge if spatial_marker_id exists (e.g., "Floor 2, Room 204")
- [ ] TaskCard includes "View in 3D" button if spatial_marker_id exists
- [ ] Clicking "View in 3D" navigates to spatial viewer and flies camera to marker position
- [ ] Marker ContentDrawer shows linked tasks in dedicated "Tasks" section
- [ ] Task status changes reflected in marker type/color (e.g., completed tasks = green marker)
- [ ] When task completed, auto-creates activity log entry in marker content

**Complexity:** M

**Technical Considerations:**
- Update tasks table schema: Add `spatial_marker_id uuid REFERENCES spatial_markers(id)` column (migration)
- TaskLinker component: Modal with embedded 3D viewer for marker selection
- Location badge: Fetch floor_name and room_name from marker, display as "📍 Floor 2, Room 204"
- "View in 3D" link: `/app/projects/{projectId}/spatial?marker={markerId}`
- Auto-activity log: On task status change to 'completed', call `attachContentToMarker()` with type='activity'
- Marker type: If marker linked to task, display as type='task' with task priority color

---

### P4.3 - [ ] Integrate with photo system (GPS → nearest marker suggestion)
**Description:** When uploading photos with GPS EXIF data, suggest the nearest spatial marker location for attachment.

**Files to Create/Modify:**
- `components/projects/spatial/PhotoLocationSuggester.tsx` (new file)
- `app/actions/spatial.ts` (add `findNearestMarker()` function)

**Dependencies:** P3.5 (photo upload), P1.6 (spatial queries)

**Acceptance Criteria:**
- [ ] When photo uploaded with GPS coordinates, system calculates nearest marker within 50m radius
- [ ] If nearest marker found, shows suggestion: "This photo appears to be near [Marker Title]. Attach here?"
- [ ] "Attach Here" button attaches photo to suggested marker
- [ ] "Create New Marker" button creates new marker at GPS-derived 3D position
- [ ] If project has geocoordinates set, converts GPS (lat/lon) to model coordinates (x,y,z)
- [ ] If project lacks geocoordinates, prompts user to set project location on map
- [ ] Suggestion shown as toast notification with 10-second timeout (user can dismiss)

**Complexity:** M

**Technical Considerations:**
- GPS to model coordinates: Requires project-level geocoordinate calibration (future enhancement)
- For MVP: Calculate nearest marker in 2D (ignore Z coordinate), use lat/lon distance
- Distance formula: Haversine distance for GPS coordinates
- Nearest marker query: Find markers with smallest Euclidean distance to photo GPS position
- Radius: 50 meters = reasonable proximity for construction sites
- Geocoordinate calibration: Store project origin (lat/lon) and rotation in projects table
- If no calibration: Fall back to manual marker selection (show all markers in dropdown)

---

### P4.4 - [ ] Integrate with chat system (reference markers in messages)
**Description:** Enable referencing spatial markers in chat messages with clickable links that navigate to 3D viewer.

**Files to Create/Modify:**
- `components/chat/MessageInput.tsx` (modify existing)
- `components/chat/MessageItem.tsx` (modify existing to render marker links)
- `lib/chat/message-parser.ts` (extend with marker link parsing)

**Dependencies:** Existing chat system, P3.1 (markers exist)

**Acceptance Criteria:**
- [ ] Message input supports `@location:marker-uuid` syntax for referencing markers
- [ ] Typing `@location` shows autocomplete dropdown with searchable marker list
- [ ] Selecting marker inserts `@location:{markerId}` token in message
- [ ] Message renderer converts `@location:{markerId}` to clickable link: "📍 [Marker Title]"
- [ ] Clicking marker link opens 3D viewer in new tab/modal at marker position
- [ ] Marker link shows preview tooltip on hover with marker thumbnail
- [ ] When marker mentioned, notification sent to marker creator (optional)

**Complexity:** M

**Technical Considerations:**
- Autocomplete: Fetch markers via `getProjectMarkers()`, filter by title as user types
- Message parsing: Use regex to detect `@location:{uuid}` pattern
- Link rendering: Replace token with `<a href="/app/projects/{projectId}/spatial?marker={markerId}">📍 {title}</a>`
- Fetch marker title for link text: Query marker by ID (lightweight query)
- Preview tooltip: Fetch marker thumbnail from first photo attachment (if exists)
- Security: Validate user has access to marker before rendering link (RLS handles this)

---

### P4.5 - [ ] Integrate with materials system (track installation locations)
**Description:** Link material assignments to spatial markers to track where materials are installed in the building.

**Files to Create/Modify:**
- `components/materials/MaterialAssignment.tsx` (modify existing)
- `components/projects/spatial/MaterialMarkers.tsx` (new file)

**Dependencies:** Existing materials system, P3.1 (markers exist)

**Acceptance Criteria:**
- [ ] Material assignment form includes "Installation Location" field with "Set in 3D View" button
- [ ] "Set in 3D View" opens 3D viewer, allows placing marker, links material to marker
- [ ] Materials dashboard shows "View in 3D" button for assigned materials
- [ ] Clicking "View in 3D" navigates to spatial viewer, shows all markers for that material (if installed in multiple locations)
- [ ] Marker type='material' displays material name and quantity badge
- [ ] Marker color-coded by material status: Ordered (blue), Delivered (green), Installed (gray)
- [ ] Material procurement status changes auto-update marker visual state in 3D view

**Complexity:** M

**Technical Considerations:**
- Update material_assignments table: Add `spatial_marker_id uuid` column (or create join table if many-to-many)
- Material markers: Special rendering (icon = material type, badge = quantity)
- Status color mapping: Ordered = #3B82F6 (blue), Delivered = #10B981 (green), Installed = #6B7280 (gray)
- Multiple locations: If material installed in 10+ locations, create one marker per location, group by material
- Future: Material heatmap overlay (show density of specific material across building)

---

### P4.6 - [ ] Update ProjectDetail page to include 3D viewer tab
**Description:** Add "3D View" tab to existing project detail page layout with conditional rendering based on model availability.

**Files to Create/Modify:**
- `app/app/projects/[id]/page.tsx` (modify existing)
- `components/projects/ProjectTabs.tsx` (modify existing or create if not exists)

**Dependencies:** P2.2 (3DViewerCanvas), P3.2 (MarkerPanel), all Phase 1-3 work

**Acceptance Criteria:**
- [ ] Project detail page includes new "3D View" tab alongside existing tabs (Overview, Tasks, etc.)
- [ ] Tab badge shows marker count (e.g., "3D View (24)")
- [ ] If no 3D model uploaded, tab shows empty state: "No 3D model uploaded. Upload a BIM file to enable spatial features." with "Upload Model" button
- [ ] If model processing, shows processing status: "Model processing... (45%)" with spinner
- [ ] If model ready, renders full 3D viewer with marker panel
- [ ] Tab uses responsive layout: sidebar + viewer on desktop, stacked on mobile
- [ ] URL structure: `/app/projects/{projectId}?tab=spatial` or `/app/projects/{projectId}/spatial`

**Complexity:** M

**Technical Considerations:**
- Server component: Fetch project, active model, markers in page.tsx
- Pass data as props to client components: `<SpatialViewer model={model} markers={markers} />`
- Conditional rendering: Check model.processing_status, show appropriate UI state
- Empty state: Use Aceternity UI empty state component with Upload button
- Upload button: Opens file picker, triggers chunked upload flow (P1.7)
- Tab navigation: Use Next.js Link with query param or route segment

---

### P4.7 - [ ] Update TaskCard to show 3D location icon
**Description:** Add visual indicator and quick action to task cards when task has associated spatial marker.

**Files to Create/Modify:**
- `components/tasks/TaskCard.tsx` (modify existing)

**Dependencies:** P4.2 (task-marker linking)

**Acceptance Criteria:**
- [ ] TaskCard displays 📍 location icon badge if `spatial_marker_id` exists
- [ ] Hovering badge shows tooltip: "Floor 2, Room 204" (marker location)
- [ ] Clicking badge navigates to 3D viewer at marker position
- [ ] Badge color-coded by marker type (photo=blue, issue=red, progress=green)
- [ ] If task has location, "Set Location" button changes to "Update Location"
- [ ] Location badge responsive: Icon only on mobile, icon + text on desktop

**Complexity:** S

**Technical Considerations:**
- Fetch marker data: Join spatial_markers in task query (or fetch separately)
- Badge component: Reusable `<LocationBadge marker={marker} />` component
- Tooltip: Use Radix Tooltip with delay (500ms)
- Icon: Use Lucide MapPin icon
- Link: Same as P4.2 - `/app/projects/{projectId}/spatial?marker={markerId}`

---

## Phase 5: Offline & Performance (2 weeks)

### P5.1 - [ ] Set up Service Worker for model caching
**Description:** Implement PWA service worker to cache 3D models and enable offline access to spatial viewer.

**Files to Create/Modify:**
- `public/service-worker.js` (new file)
- `app/manifest.json` (update with spatial viewer capabilities)
- `lib/pwa/sw-registration.ts` (new file)

**Dependencies:** None (can start in parallel)

**Acceptance Criteria:**
- [ ] Service worker registers on app load (client-side)
- [ ] Caches static assets: xeokit SDK, viewer scripts, CSS
- [ ] Caches XKT model files on first load (cache-first strategy)
- [ ] Caches marker data (network-first with fallback to cache)
- [ ] Offline: Service worker serves cached model when network unavailable
- [ ] Cache invalidation: Clears old model versions when new version uploaded
- [ ] Manifest updated: Add "3D Viewer" to app shortcuts
- [ ] Install prompt: Shows "Install GenHub PWA for offline 3D viewing" banner

**Complexity:** M

**Technical Considerations:**
- Use Workbox library for service worker management (recommended by Next.js)
- Cache strategy: Static assets (cache-first), API data (network-first), models (cache-first with size limit)
- Cache size limit: 100MB total (per browser, configurable)
- Cache eviction: LRU (least recently used) when quota exceeded
- Model caching: Only cache active model version, evict old versions
- Registration: Register in `_app.tsx` or root layout client component
- Testing: Use Chrome DevTools > Application > Service Workers

---

### P5.2 - [ ] Implement IndexedDB for offline model and marker storage
**Description:** Create IndexedDB schema and API for storing 3D models, markers, and content offline with quota management.

**Files to Create/Modify:**
- `lib/offline/indexeddb.ts` (new file)
- `lib/offline/storage-manager.ts` (new file for quota management)

**Dependencies:** P5.1 (service worker)

**Acceptance Criteria:**
- [ ] IndexedDB schema created with object stores: models, markers, marker_content, sync_queue
- [ ] `storeModel(modelId, xktBlob, metadata)` - Store model file with metadata
- [ ] `getModel(modelId)` - Retrieve cached model
- [ ] `storeMarkers(projectId, markers)` - Store marker array
- [ ] `getMarkers(projectId)` - Retrieve cached markers
- [ ] `storeMarkerContent(markerId, content)` - Store photos/files/notes
- [ ] `getMarkerContent(markerId)` - Retrieve cached content
- [ ] `clearOldCache(daysToKeep)` - Delete entries older than X days (default 7)
- [ ] Quota management: Check available storage, warn user if low (<100MB)
- [ ] Quota exceeded: Prompt user to clear old data or increase quota (browser settings)

**Complexity:** M

**Technical Considerations:**
- Use idb library (wrapper around IndexedDB API, more ergonomic)
- Schema version: Start with v1, migrate if schema changes
- Object stores: models (key: modelId), markers (key: projectId), marker_content (key: markerId)
- Indexes: markers.projectId, marker_content.markerId for efficient queries
- Blob storage: Store XKT files as Blob objects (binary data)
- Quota API: Use `navigator.storage.estimate()` to check available quota
- Thumbnail caching: Store low-res photo thumbnails (not full-res) to save quota
- Sync queue: Store offline-created markers for background sync (P5.3)

---

### P5.3 - [ ] Implement background sync for offline-created markers
**Description:** Enable creating markers while offline and automatically sync them to server when connection restored.

**Files to Create/Modify:**
- `lib/offline/sync-manager.ts` (new file)
- `public/service-worker.js` (extend with sync event handler)

**Dependencies:** P5.2 (IndexedDB), P1.6 (createMarker action)

**Acceptance Criteria:**
- [ ] When offline, `createMarker()` stores marker in IndexedDB sync_queue with status='pending'
- [ ] Marker immediately appears in 3D viewer with "pending sync" badge
- [ ] When online, background sync automatically uploads queued markers
- [ ] Sync progress indicator: "Syncing 3 markers..."
- [ ] On sync success, marker status changes to 'synced', badge removed
- [ ] On sync failure (e.g., conflict), marker status='error', shows retry button
- [ ] User can manually trigger sync via "Sync Now" button in settings
- [ ] Sync respects rate limits (max 10 markers per second)
- [ ] After sync, revalidates marker list to fetch server-assigned IDs

**Complexity:** L

**Technical Considerations:**
- Background Sync API: Register sync event in service worker (not supported in Safari, use fallback)
- Fallback: Poll for connection status every 30s, trigger sync when online
- Sync queue: Array of pending markers in IndexedDB, remove after successful upload
- Conflict resolution: If marker position conflicts (two users placed marker at same spot), auto-cluster or prompt user
- Optimistic IDs: Use temporary UUIDs for offline markers, replace with server IDs after sync
- Retry logic: Exponential backoff for failed syncs (1s, 2s, 4s, 8s)
- User feedback: Toast notifications for sync status ("All markers synced ✓")

---

### P5.4 - [ ] Implement conflict resolution for offline edits
**Description:** Handle conflicts when multiple users edit the same marker while offline and sync later.

**Files to Create/Modify:**
- `lib/offline/conflict-resolver.ts` (new file)
- `components/projects/spatial/ConflictDialog.tsx` (new file)

**Dependencies:** P5.3 (background sync)

**Acceptance Criteria:**
- [ ] Detects conflicts: Marker edited offline, but server version changed since last sync
- [ ] Conflict types: Title changed, position moved, content added, marker deleted
- [ ] Shows conflict resolution dialog: "This marker was edited by [User] while you were offline."
- [ ] Resolution options: "Keep Mine", "Keep Theirs", "Merge Changes"
- [ ] "Keep Mine" overwrites server version with local edits (requires permission check)
- [ ] "Keep Theirs" discards local edits, uses server version
- [ ] "Merge Changes" attempts auto-merge (e.g., append both notes, average position)
- [ ] Auto-merge for non-conflicting changes: Local added photo, server added note → merge both
- [ ] Conflict log: Stores resolved conflicts in activity timeline

**Complexity:** M

**Technical Considerations:**
- Conflict detection: Compare `updated_at` timestamp (server vs local)
- Last-write-wins: If no conflict dialog, default to server version (safer)
- Merge strategy: For notes/photos, merge is append; for position, merge is average
- Permission check: User can only "Keep Mine" if they have update permission
- Conflict dialog: Use Radix AlertDialog with Aceternity UI styling
- Future: Use CRDTs (Conflict-free Replicated Data Types) for automatic merging

---

### P5.5 - [ ] Optimize model loading performance (batching, instancing)
**Description:** Implement performance optimizations for loading and rendering large BIM models with 100k+ elements.

**Files to Create/Modify:**
- `lib/xeokit/performance-optimizer.ts` (new file)
- `components/projects/spatial/3DViewerCanvas.tsx` (modify)

**Dependencies:** P2.2 (3DViewerCanvas)

**Acceptance Criteria:**
- [ ] Batching: Group similar elements (all walls, all doors) into single draw call
- [ ] Instancing: Reuse geometry for repeated elements (windows, columns)
- [ ] Frustum culling: Only render elements visible in camera view (cull off-screen objects)
- [ ] Occlusion culling: Skip rendering elements hidden behind other elements (future enhancement)
- [ ] Progressive loading: Load visible floors first, background load other floors
- [ ] Memory pooling: Reuse vertex buffers for destroyed objects (avoid GC churn)
- [ ] Target: 60 FPS on desktop for 100k element model, 30 FPS on mobile for 50k elements
- [ ] Performance monitor: Display FPS, draw calls, triangle count in debug overlay

**Complexity:** L

**Technical Considerations:**
- xeokit built-in: Check if xeokit already implements batching/instancing (it should)
- Frustum culling: xeokit CameraControl should handle this automatically
- Progressive loading: Load by floor (parse floors from model metadata, load sequentially)
- Performance API: Use `requestAnimationFrame` to measure frame time, calculate FPS
- Debug overlay: Toggle with `?debug=true` query param, show stats in corner
- WebGL stats: Use xeokit.stats or custom WebGL info query
- Future: Web Workers for off-thread model parsing (reduce main thread blocking)

---

### P5.6 - [ ] Optimize for mobile devices (texture compression, geometry simplification)
**Description:** Apply mobile-specific optimizations to ensure smooth 30 FPS performance on mid-range phones.

**Files to Create/Modify:**
- `lib/xeokit/mobile-optimizer.ts` (new file)

**Dependencies:** P2.6 (LOD system), P5.5 (performance optimizations)

**Acceptance Criteria:**
- [ ] Device detection: Identify mobile vs desktop via user agent or screen size
- [ ] Texture compression: Use KTX2/Basis textures for materials (smaller, GPU-native)
- [ ] Geometry simplification: Reduce triangle count by 50% for mobile (via LOD system)
- [ ] Shadow rendering: Disable shadows on mobile (expensive for low-end GPUs)
- [ ] Anti-aliasing: Disable MSAA on mobile, use FXAA (cheaper post-process AA)
- [ ] Resolution scaling: Render at 0.75x native resolution on low-end devices, upscale
- [ ] Memory limit: Cap model size at 50MB for mobile (prompt user to use desktop for larger models)
- [ ] Battery optimization: Reduce frame rate to 30 FPS on mobile, pause rendering when tab inactive

**Complexity:** M

**Technical Considerations:**
- Device detection: `navigator.userAgent` or `window.matchMedia('(pointer: coarse)')`
- Texture compression: xeokit may support KTX2 via texture loader (check docs)
- Geometry simplification: Use low LOD model exclusively on mobile
- Shadow toggle: `viewer.scene.shadowsEnabled = false`
- AA toggle: `viewer.scene.antialias = false`, apply FXAA via post-process shader
- Resolution scaling: Render to smaller canvas, CSS upscale (devicePixelRatio = 0.75)
- Pause rendering: Listen for `visibilitychange` event, stop render loop when hidden

---

### P5.7 - [ ] Implement memory management and cleanup
**Description:** Ensure proper cleanup of WebGL resources, textures, and geometry to prevent memory leaks and browser crashes.

**Files to Create/Modify:**
- `lib/xeokit/memory-manager.ts` (new file)
- `hooks/use-memory-monitor.ts` (new file)

**Dependencies:** P2.2 (3DViewerCanvas)

**Acceptance Criteria:**
- [ ] Viewer cleanup: Destroy viewer instance, release WebGL context on component unmount
- [ ] Texture disposal: Delete all textures from GPU memory on model unload
- [ ] Geometry disposal: Delete all vertex buffers from GPU memory on model unload
- [ ] Event listener cleanup: Remove all event listeners on unmount (camera, mouse, resize)
- [ ] Memory monitor: Track GPU memory usage, warn if exceeds 500MB
- [ ] Memory leak detection: Use Chrome DevTools Memory Profiler to verify no leaks
- [ ] Automatic cleanup: If memory exceeds threshold, auto-unload old LODs or reduce quality
- [ ] Force GC: Trigger garbage collection after large model unload (if browser supports)

**Complexity:** M

**Technical Considerations:**
- WebGL cleanup: `viewer.destroy()` should handle most cleanup (verify in xeokit docs)
- Manual cleanup: Ensure all references nulled (viewer, scene, camera) to enable GC
- Memory API: Use `performance.memory.usedJSHeapSize` (Chrome only, not standardized)
- GPU memory: Difficult to measure directly, estimate from texture/geometry sizes
- Memory warnings: Show toast if memory usage high: "Memory usage high. Close other tabs or switch to low detail mode."
- Safari memory: iOS Safari aggressively kills tabs, ensure graceful recovery on resume

---

### P5.8 - [ ] Implement comprehensive loading states and error handling
**Description:** Create polished loading, error, and empty states for all 3D viewer scenarios with user-friendly messaging.

**Files to Create/Modify:**
- `components/projects/spatial/LoadingStates.tsx` (new file)
- `components/projects/spatial/ErrorBoundary.tsx` (new file)

**Dependencies:** P2.5 (model loading)

**Acceptance Criteria:**
- [ ] Loading states: Model downloading, parsing, rendering first frame
- [ ] Each state shows: spinner, progress bar, estimated time, "Cancel" button
- [ ] Error states: Network error, WebGL not supported, model corrupt, permission denied, quota exceeded
- [ ] Each error shows: friendly message, suggested action, "Try Again" button, "Contact Support" link
- [ ] Empty states: No model uploaded, model processing, no markers yet
- [ ] Each empty state shows: illustration, explanation, primary action button
- [ ] WebGL fallback: If WebGL2 not supported, show message with link to browser upgrade guide
- [ ] Error boundary: Catches React errors, logs to analytics, shows crash recovery UI

**Complexity:** M

**Technical Considerations:**
- Loading skeleton: Use Aceternity UI Skeleton component with model thumbnail background
- Error messages: User-friendly, avoid technical jargon (e.g., "Couldn't load 3D model" not "XKT parse error")
- WebGL detection: `!!window.WebGL2RenderingContext` and `canvas.getContext('webgl2')`
- Error boundary: Use React Error Boundary component, log to Sentry or console
- Crash recovery: "Something went wrong. Refresh to try again." with Refresh button
- Analytics: Track errors with context (model size, device, browser) for debugging

---

## Phase 6: Client Portal & Polish (1 week)

### P6.1 - [ ] Implement client portal read-only mode
**Description:** Create simplified, read-only 3D viewer experience for client users with filtered content.

**Files to Create/Modify:**
- `components/projects/spatial/ClientSpatialViewer.tsx` (new file)
- `app/app/client/[projectId]/spatial/page.tsx` (new file)

**Dependencies:** All Phase 1-5 work

**Acceptance Criteria:**
- [ ] Client users access via `/app/client/{projectId}/spatial` route
- [ ] Viewer shows only approved/public markers (filter by marker visibility setting)
- [ ] Clients cannot create, edit, or delete markers (buttons hidden)
- [ ] Clients can view photos, approved documents, and progress notes (no internal notes)
- [ ] Simplified UI: No marker placement, no clustering controls, no advanced filters
- [ ] "Request Information" button allows clients to leave comments on markers (creates note with client flag)
- [ ] Navigation limited: Cannot switch to edit mode or access admin features
- [ ] Responsive: Optimized for client viewing on tablets/iPads

**Complexity:** M

**Technical Considerations:**
- Route protection: Check user role in middleware, redirect if not client
- RLS: Database policies already filter by company, add client-specific filtering
- Marker visibility: Add `is_client_visible` boolean column to spatial_markers (default false)
- Filter: `WHERE is_client_visible = true` for client queries
- UI simplification: Render different toolbar for clients (view-only controls)
- Request info: Creates note with `{ is_client_note: true, requires_response: true }`
- Notifications: Notify PM when client requests info on marker

---

### P6.2 - [ ] Implement permissions and access control verification
**Description:** Audit and verify all RLS policies, server actions, and API routes enforce proper access control.

**Files to Create/Modify:**
- `tests/security/rls-policies.test.ts` (new file)
- `scripts/security-audit.ts` (new file)

**Dependencies:** All database tables (Phase 1)

**Acceptance Criteria:**
- [ ] Security audit script validates: All tables have RLS enabled, all tables have SELECT policy, insert/update/delete policies enforce creator or role check
- [ ] Test suite covers: User can only view markers in their company, user can only edit markers they created (or if PM/GC), user cannot delete other users' markers (unless GC admin), client users have read-only access
- [ ] Server actions validate: User has access to project before creating marker, user has permission before updating/deleting, file uploads validate user quota and permissions
- [ ] API routes check: Authentication required (401 if not authenticated), project access verified (403 if unauthorized), rate limiting applied (429 if exceeded)
- [ ] No SQL injection vulnerabilities (all queries use parameterized statements)
- [ ] No XSS vulnerabilities (all user input sanitized before rendering)

**Complexity:** M

**Technical Considerations:**
- Use MCP Supabase `get_advisors type:"security"` to check RLS policies
- Test framework: Use Vitest or Jest with Supabase client mocking
- Security checklist: OWASP Top 10, RLS best practices, Next.js security guide
- Parameterized queries: Supabase client uses parameterized queries by default (safe)
- XSS prevention: React escapes by default, but sanitize markdown/HTML with DOMPurify
- CSRF protection: Next.js API routes use CSRF tokens automatically

---

### P6.3 - [ ] Implement 2D floor plan fallback mode
**Description:** Add fallback mode for projects without BIM files using uploaded 2D floor plan images with marker placement.

**Files to Create/Modify:**
- `components/projects/spatial/FloorPlanViewer.tsx` (new file)
- `components/projects/spatial/FloorPlanUploader.tsx` (new file)

**Dependencies:** P3.1 (marker placement)

**Acceptance Criteria:**
- [ ] If no 3D model, viewer offers "Upload Floor Plan" option
- [ ] Accepts image uploads: PNG, JPG, PDF (converted to image)
- [ ] Displays floor plan as background in 2D canvas (pan, zoom, rotate)
- [ ] Click on floor plan places 2D marker (x, y coordinates, z = floor number)
- [ ] Markers rendered as pins on 2D plan
- [ ] Multi-floor support: Upload multiple floor plans, toggle between floors
- [ ] Floor plan calibration: Set scale (e.g., "this wall is 10 meters") for accurate measurements
- [ ] Measurement tool: Ruler to measure distances on floor plan
- [ ] Export: Generate annotated floor plan PDF with all markers

**Complexity:** M

**Technical Considerations:**
- 2D canvas: Use HTML5 Canvas or SVG for rendering (lighter than WebGL)
- Pan/zoom: Use libraries like Panzoom or implement custom with mouse/touch events
- Marker storage: Use same spatial_markers table, z = floor index (0, 1, 2)
- Floor plans: Store in Vercel Blob, reference in projects table (floor_plan_url)
- Multi-floor: Store array of floor plan URLs, switch via dropdown
- PDF annotation: Use jsPDF or pdf-lib to overlay markers on floor plan PDF
- Future: Support 360° panoramas (use Photo Sphere Viewer library)

---

### P6.4 - [ ] Create user onboarding and tutorial
**Description:** Build interactive tutorial to guide first-time users through 3D viewer features.

**Files to Create/Modify:**
- `components/projects/spatial/OnboardingTour.tsx` (new file)
- `lib/onboarding/tour-steps.ts` (new file)

**Dependencies:** All Phase 1-5 features

**Acceptance Criteria:**
- [ ] Tutorial triggers on first visit to 3D viewer (check localStorage flag)
- [ ] Step-by-step walkthrough: 1) Navigate the model (pan, zoom, rotate), 2) Click to inspect elements, 3) Place a marker, 4) Attach a photo, 5) Filter markers
- [ ] Each step highlights UI element (spotlight effect), shows instructional text
- [ ] "Next", "Back", "Skip Tutorial" buttons
- [ ] Progress indicator: "Step 3 of 5"
- [ ] Tutorial can be restarted from settings: "View Tutorial Again"
- [ ] Mobile: Simplified tutorial (fewer steps, larger touch targets)
- [ ] Completion: Shows success message, sets localStorage flag to prevent auto-trigger

**Complexity:** S

**Technical Considerations:**
- Use library: Shepherd.js or Intro.js (lightweight tour libraries)
- Alternative: Custom tour with Radix Popover components
- LocalStorage key: `genhub_spatial_viewer_tour_completed_{userId}`
- Spotlight effect: CSS with high z-index overlay, circular cutout for highlighted element
- Skip: Respect user preference, don't show again unless manually requested
- Analytics: Track tutorial completion rate, identify drop-off steps

---

### P6.5 - [ ] Implement feature flag system
**Description:** Create feature flag system to control 3D viewer feature rollout and A/B testing.

**Files to Create/Modify:**
- `lib/feature-flags/index.ts` (new file)
- `app/api/feature-flags/route.ts` (new file)

**Dependencies:** None (can implement anytime)

**Acceptance Criteria:**
- [ ] Feature flags stored in database (feature_flags table) or environment variables
- [ ] Flags: `spatial_viewer_enabled`, `spatial_viewer_beta`, `client_portal_3d`, `offline_mode_enabled`, `2d_floor_plan_mode`
- [ ] Server-side check: `isFeatureEnabled('spatial_viewer_enabled', userId)` returns boolean
- [ ] Client-side hook: `const { enabled } = useFeatureFlag('spatial_viewer_beta')`
- [ ] Admin UI: Dashboard to toggle flags per company or user (future enhancement)
- [ ] Gradual rollout: Enable for 10% of users, then 50%, then 100%
- [ ] A/B testing: Show different UI variants, track which performs better
- [ ] Disable gracefully: If feature disabled, show "Feature unavailable" message (not 404)

**Complexity:** S

**Technical Considerations:**
- Simple approach: Environment variables (`NEXT_PUBLIC_SPATIAL_VIEWER_ENABLED=true`)
- Advanced: Database table with `{ flag_name, enabled, company_id, user_id, rollout_percentage }`
- Libraries: LaunchDarkly, Flagsmith, or custom implementation
- Server-side: Check flag in server component before rendering viewer
- Client-side: Check flag in client component, show loading skeleton while fetching flag state
- Gradual rollout: Hash userId, enable if `hash(userId) % 100 < rollout_percentage`

---

### P6.6 - [ ] Final testing and bug fixes
**Description:** Comprehensive testing across devices, browsers, and scenarios to identify and fix bugs.

**Files to Create/Modify:**
- `tests/e2e/spatial-viewer.spec.ts` (new file for E2E tests)
- `docs/testing/test-plan.md` (new file documenting test coverage)

**Dependencies:** All Phase 1-6 features complete

**Acceptance Criteria:**
- [ ] Unit tests: All server actions, utilities, hooks (80%+ coverage)
- [ ] Integration tests: API routes, database queries, file uploads
- [ ] E2E tests: Full user flows (upload model, place marker, attach photo, view in client portal)
- [ ] Browser testing: Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Device testing: Desktop (Windows, Mac), Mobile (iOS, Android), Tablet (iPad)
- [ ] Performance testing: Large models (100k+ elements), many markers (1000+), slow networks (3G)
- [ ] Accessibility testing: Keyboard navigation, screen reader compatibility, color contrast
- [ ] Security testing: SQL injection, XSS, CSRF, unauthorized access attempts
- [ ] Bug tracking: All identified bugs logged in issue tracker, prioritized, and fixed
- [ ] Regression testing: Re-test after fixes to ensure no new bugs introduced

**Complexity:** L

**Technical Considerations:**
- Testing framework: Vitest (unit), Playwright (E2E)
- Coverage tool: Istanbul/nyc or Vitest's built-in coverage
- E2E scenarios: Happy path (upload → view → place marker → attach photo) and error paths (network failure, invalid file, permission denied)
- Performance testing: Use Chrome DevTools Lighthouse, WebPageTest
- Accessibility: Use axe-core, pa11y, or manual WCAG 2.1 checklist
- Security: Use OWASP ZAP, manual penetration testing
- Device testing: Use BrowserStack or real devices
- Bug fixes: High priority (P0: crashes, data loss), Medium (P1: feature broken), Low (P2: UI polish)

---

### P6.7 - [ ] Create documentation (user guide, developer docs)
**Description:** Write comprehensive documentation for end users and developers.

**Files to Create/Modify:**
- `docs/user-guide/3d-spatial-viewer.md` (new file)
- `docs/developer/spatial-viewer-api.md` (new file)
- `.claude/docs/law/SPATIAL_VIEWER.md` (new file - add to authoritative docs)

**Dependencies:** All features complete

**Acceptance Criteria:**
- [ ] User guide covers: How to upload a BIM file, how to navigate the 3D model, how to place markers, how to attach photos/files/notes, how to filter and search markers, how to use offline mode, troubleshooting common issues
- [ ] Developer guide covers: Architecture overview, database schema, API reference (server actions, API routes), component API, xeokit integration, IndexedDB schema, extending the viewer (custom marker types, plugins), performance tuning
- [ ] SPATIAL_VIEWER.md added to `.claude/docs/law/` as authoritative reference for future agents
- [ ] Screenshots and videos: Annotated screenshots for user guide, screen recordings for complex flows
- [ ] Inline docs: JSDoc comments for all public functions, components, hooks
- [ ] API reference: Auto-generated from TypeScript types (using TypeDoc or similar)

**Complexity:** M

**Technical Considerations:**
- Documentation format: Markdown for easy versioning and viewing in GitHub
- User guide: Non-technical language, step-by-step instructions, lots of visuals
- Developer guide: Technical, assumes familiarity with React, Next.js, Supabase
- SPATIAL_VIEWER.md format: Follow SYSTEM.md structure (architecture, patterns, gotchas)
- Screenshots: Use consistent window size, annotate with arrows/labels
- Videos: Use Loom or similar, embed in docs as YouTube/Vimeo links
- Hosting: Docs in repo for developers, export user guide to help center (Zendesk, Intercom)

---

### P6.8 - [ ] Performance benchmarking and optimization verification
**Description:** Measure actual performance against targets and optimize bottlenecks.

**Files to Create/Modify:**
- `scripts/performance-benchmark.ts` (new file)
- `docs/performance/benchmark-results.md` (new file)

**Dependencies:** P5.5, P5.6 (performance optimizations implemented)

**Acceptance Criteria:**
- [ ] Benchmark suite measures: Model load time (IFC upload → XKT ready), first render time (XKT load → first frame), FPS (average over 60s), memory usage (peak GPU + CPU), marker operations (create, update, delete latency)
- [ ] Target verification: Desktop 60 FPS ✓, mobile 30 FPS ✓, load time <10s for 50MB model ✓, marker ops <500ms ✓
- [ ] Benchmarks run on: High-end desktop (RTX 3080), mid-range desktop (GTX 1060), high-end mobile (iPhone 13), mid-range mobile (Samsung A52)
- [ ] Results documented: Baseline, after optimizations, percentage improvement
- [ ] Bottleneck identification: Profile with Chrome DevTools, identify top 3 slowest operations
- [ ] Optimization: Fix identified bottlenecks, re-run benchmarks, verify improvement
- [ ] Regression prevention: Add benchmark CI job, alert if performance degrades >10%

**Complexity:** M

**Technical Considerations:**
- Benchmark framework: Use console.time/timeEnd or performance.mark/measure
- FPS measurement: Sample every frame for 60 seconds, calculate average, min, max
- Memory measurement: Use performance.memory API (Chrome only)
- Automated benchmarks: Playwright scripts that load model, perform actions, measure
- Profiling: Chrome DevTools Performance tab, identify long tasks (>50ms)
- Common bottlenecks: Model parsing (CPU), geometry upload (GPU), marker rendering (DOM)
- Optimization: Lazy load markers (render only visible), debounce resize, virtualize lists
- CI integration: Run benchmarks on every PR, fail if FPS drops below threshold

---

## Summary

**Total Tasks:** 68
**Estimated Duration:** 11 weeks
**Team Size:** 2-3 developers (frontend + backend + performance specialist)

### Critical Path
Phase 1 (Database + APIs) → Phase 2 (3D Rendering) → Phase 3 (Markers) → Phase 4 (Integration) → Phase 5 (Offline) → Phase 6 (Polish)

### Key Risks & Mitigations
1. **xeokit SDK complexity**: Mitigate with P2.1 early integration test
2. **Large model performance**: Mitigate with P2.6 LOD system and P5.5 optimizations
3. **Offline sync conflicts**: Mitigate with P5.4 conflict resolution strategy
4. **Browser compatibility**: Mitigate with P5.8 WebGL fallback and P6.6 cross-browser testing

### Testing Strategy
- Unit tests: All server actions and utilities (P1.5-P1.10, ongoing)
- Integration tests: API routes and database operations (P1.7-P1.9, P6.2)
- E2E tests: Full user flows (P6.6)
- Performance tests: Benchmarking (P6.8)
- Security tests: RLS policies and access control (P6.2)

### Documentation Requirements
- User guide for end users (P6.7)
- Developer API reference (P6.7)
- Authoritative architecture doc for agents (P6.7)

---

**Next Steps:**
1. Review this task list with the team
2. Create GitHub issues/tickets for each task
3. Assign tasks to developers
4. Begin Phase 1 implementation

**Questions or modifications needed?**
