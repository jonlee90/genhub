# 3D Spatial Viewer Enhancement - Implementation Tasks

> **Feature:** Interactive 3D spatial task linking, unique project models, material visibility, and client portal integration
>
> **Requirements:** [APPROVED] `.claude/docs/requirements/3d-spatial-viewer-enhancement.md`
> **Design:** [COMPLETE] `.claude/docs/designs/3d-spatial-viewer-enhancement.md`

---

## Overview

This feature transforms GenHub's 3D Spatial Viewer from a passive visualization tool into an active project management interface. GCs and PMs can:

- **Click on 3D surfaces** to create tasks or link existing tasks to spatial locations
- **Load unique 3D models** per project type (residential, cafe, restaurant, commercial_office, industrial)
- **View materials** automatically via task relationships (no manual linking)
- **Attach files/photos** to spatial markers and tasks
- **Grant clients full read-only access** to the 3D model and all project data
- **Use on mobile devices** with optimized touch gestures and responsive UI

---

## Implementation Phases

### Phase 1: Server Actions + Types
**Agent:** agent-backend-engineer
**Time:** 2-3 hours
**Status:** Ready to start

**Tasks:**
- Create `createTaskAtLocation` server action
- Create `linkTaskToLocation` server action
- Create `uploadMarkerAttachment` server action
- Enhance `getMarkersByProject` with filters
- Add TypeScript type definitions
- Verify database types

**Key Deliverables:**
- `app/actions/spatial.ts` with 3 new server actions
- Enhanced marker filtering
- Type-safe inputs/outputs

**[📄 View Phase 1 Tasks](./phase-1-server-actions.md)**

---

### Phase 2: UI Components (Context Menu + Modals)
**Agent:** agent-frontend-engineer
**Time:** 4-5 hours
**Status:** Requires Phase 1 complete

**Tasks:**
- Create `SpatialMarkerContextMenu` component
- Create `MarkerCreationModal` component
- Create `MarkerFilterPanel` component
- Create `SpatialMarkerPin` component
- Enhance `TaskLinker` with create mode
- Enhance `MaterialMarkers` with status badges

**Key Deliverables:**
- 4 new client components
- Enhanced TaskLinker (create + link modes)
- Material status badges

**[📄 View Phase 2 Tasks](./phase-2-ui-components.md)**

---

### Phase 3: SpatialViewer Integration
**Agent:** agent-frontend-engineer
**Time:** 3-4 hours
**Status:** Requires Phase 1 + 2 complete

**Tasks:**
- Enhance `SpatialViewer` component
- Enhance `InteractionLayer` component
- Implement default model loading
- Wire context menu actions
- Implement marker callbacks
- Update `ProjectDetailContent` and page

**Key Deliverables:**
- Fully integrated 3D click-to-create workflow
- Default model loading per project type
- Marker rendering and filtering

**[📄 View Phase 3 Tasks](./phase-3-spatialviewer-integration.md)**

---

### Phase 4: Task Detail Panel + Material Visibility
**Agent:** agent-frontend-engineer
**Time:** 3-4 hours
**Status:** Requires Phase 1, 2, 3 complete

**Tasks:**
- Create `TaskDetailPanel` component (slide-out drawer)
- Create `MaterialTab`, `ExpensesTab`, `AttachmentsTab`, `ActivityTab`
- Integrate material visibility badges
- Wire panel to marker clicks

**Key Deliverables:**
- Comprehensive task detail panel
- Material visibility via task links
- Expense and attachment views

**[📄 View Phase 4 Tasks](./phase-4-task-detail-panel.md)**

---

### Phase 5: Client Portal Integration
**Agent:** agent-frontend-engineer
**Time:** 1-2 hours
**Status:** Requires Phase 1, 2, 3, 4 complete

**Tasks:**
- Create `ClientSpatialViewer` component (read-only)
- Update `TaskDetailPanel` for client mode
- Create client portal project detail page
- Create `getClientPermissions` server action
- Update client navigation

**Key Deliverables:**
- Full client read-only 3D access
- Budget visibility toggles
- Permission enforcement

**[📄 View Phase 5 Tasks](./phase-5-client-portal.md)**

---

### Phase 6: Mobile Optimization
**Agent:** agent-frontend-engineer
**Time:** 2-3 hours
**Status:** Requires Phase 1, 2, 3, 4, 5 complete

**Tasks:**
- Implement touch gesture controls
- Implement bottom sheet variant of TaskDetailPanel
- Implement responsive marker sizing
- Handle device orientation changes
- Implement marker selection menu (overlapping markers)
- WebGL fallback message
- Mobile performance optimizations

**Key Deliverables:**
- Touch gesture support (rotate, zoom, pan, long-press)
- Mobile-optimized UI (bottom sheet)
- Responsive marker sizing (32px+ touch targets)
- Performance optimizations (30+ FPS on mobile)

**[📄 View Phase 6 Tasks](./phase-6-mobile-optimization.md)**

---

## Quick Start

### For Backend Engineer (Phase 1)

```bash
# 1. Read requirements and design
cat .claude/docs/requirements/3d-spatial-viewer-enhancement.md
cat .claude/docs/designs/3d-spatial-viewer-enhancement.md

# 2. Read Phase 1 tasks
cat .claude/tasks/spatial-viewer/phase-1-server-actions.md

# 3. Verify database schema
npx supabase gen types typescript --project-id $PROJECT_REF --schema public > types/database.types.ts

# 4. Implement server actions
code app/actions/spatial.ts

# 5. Test with API client (Postman/Insomnia)
```

### For Frontend Engineer (Phase 2-6)

```bash
# 1. Wait for Phase 1 completion (server actions available)

# 2. Read Phase 2 tasks
cat .claude/tasks/spatial-viewer/phase-2-ui-components.md

# 3. Create UI components
mkdir -p components/projects/spatial
code components/projects/spatial/SpatialMarkerContextMenu.tsx

# 4. Test in browser
npm run dev
# Navigate to /app/projects/[id]
```

---

## Task File Locations

| File | Phase | Agent |
|------|-------|-------|
| `phase-1-server-actions.md` | Backend | agent-backend-engineer |
| `phase-2-ui-components.md` | Frontend | agent-frontend-engineer |
| `phase-3-spatialviewer-integration.md` | Frontend | agent-frontend-engineer |
| `phase-4-task-detail-panel.md` | Frontend | agent-frontend-engineer |
| `phase-5-client-portal.md` | Frontend | agent-frontend-engineer |
| `phase-6-mobile-optimization.md` | Frontend | agent-frontend-engineer |

---

## Estimated Total Effort

| Phase | Hours | Agent |
|-------|-------|-------|
| Phase 1 | 2-3 | Backend |
| Phase 2 | 4-5 | Frontend |
| Phase 3 | 3-4 | Frontend |
| Phase 4 | 3-4 | Frontend |
| Phase 5 | 1-2 | Frontend |
| Phase 6 | 2-3 | Frontend |
| **Total** | **15-21 hours** | Mixed |

---

## Key Design Decisions

### 1. Material Visibility via Tasks (Not Direct Linking)
**Rationale:** Tasks are the primary work unit. Materials belong to work items, not locations. Avoids duplicate tracking.

### 2. Soft Delete for Markers
**Rationale:** Preserves audit trail. Allows "undo" functionality. Required for construction compliance.

### 3. Context Menu for Marker Creation
**Rationale:** Industry-standard pattern in CAD/BIM tools. Low UI clutter. Location-aware.

### 4. Default Models as Procedural Geometry
**Rationale:** Flexibility, small file size, version control friendly, dynamic adaptation.

### 5. TaskDetailPanel as Slide-Out Drawer
**Rationale:** Context preservation (3D view remains visible). Multi-tasking support. Industry pattern.

---

## Dependencies

### External
- **Xeokit SDK v2.5+** (already integrated)
- **Supabase MCP** (for database queries)
- **Aceternity UI** (for components)
- **Lucide icons** (for all icons)

### Internal
- Existing `SpatialViewer` component
- Existing `TaskLinker` component
- Existing `MaterialMarkers` component
- Existing `BaseModal` component
- Existing `PhotoUploader`/`FileUploader` components

### Database
- `spatial_markers` table (already exists)
- `marker_content` table (already exists)
- `default_3d_models` table (already exists)
- `tasks` table (already exists)
- `material_assignments` table (already exists)

**No database migrations needed!**

---

## Success Criteria

### Functional Requirements Met
- ✅ REQ-1: Unique 3D models per project type
- ✅ REQ-2: Interactive task linking (create + link)
- ✅ REQ-3: Material visibility via linked tasks
- ✅ REQ-4: File/image attachments to markers
- ✅ REQ-5: Permission controls (GC/PM edit, others view-only)
- ✅ REQ-6: Client portal full visibility
- ✅ REQ-7: Visual marker indicators and filtering
- ✅ REQ-8: Spatial marker CRUD operations
- ✅ REQ-9: Task detail panel integration
- ✅ REQ-10: Mobile and touch device support

### Non-Functional Requirements Met
- ✅ NFR-1: Performance (3D load < 5s, 30+ FPS mobile)
- ✅ NFR-2: Security (RLS enforcement, permission checks)
- ✅ NFR-3: Accessibility (keyboard nav, ARIA labels, WCAG AA)
- ✅ NFR-4: Data integrity (soft deletes, audit trail, FK constraints)

---

## Testing Strategy

### Unit Tests
- Server actions (Phase 1)
- Component rendering (Phase 2, 4)
- Permission checks (all phases)

### Integration Tests
- Full flow: Right-click → Create Task → Task appears on 3D model
- Full flow: Right-click → Link Task → Marker appears on 3D model
- Full flow: Filter markers → Only filtered markers visible

### E2E Tests
- Materials visible via task link (full workflow)
- Client portal read-only enforcement
- Mobile touch gestures (rotate, zoom, pan, long-press)

### Manual Testing Checklist
- [ ] Test with GC admin account (full permissions)
- [ ] Test with PM account (full permissions)
- [ ] Test with Worker account (view-only)
- [ ] Test with Client account (view-only, no costs if disabled)
- [ ] Test on desktop (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile (iPhone, Android)
- [ ] Test different project types (residential, cafe, restaurant, office, industrial)
- [ ] Test custom model upload (if project has uploaded model)

---

## Related Documentation

### Requirements & Design
- **Requirements:** `.claude/docs/requirements/3d-spatial-viewer-enhancement.md`
- **Design:** `.claude/docs/designs/3d-spatial-viewer-enhancement.md`

### Law Docs
- **Database Schema:** `.claude/docs/law/DB_SCHEMA.md` (spatial_markers, marker_content, default_3d_models)
- **UI Rules:** `.claude/docs/law/UI_RULES.md` (page layout, component patterns)
- **Spatial Viewer:** `.claude/docs/law/SPATIAL_VIEWER.md` (Xeokit patterns)
- **System Architecture:** `.claude/docs/law/SYSTEM.md` (agent boundaries, workflow)

### Code Patterns
- **Server Actions:** `app/actions/tasks.ts` (server action structure)
- **UI Components:** `components/ui/BaseModal.tsx`, `components/ui/PhotoUploader.tsx`
- **Spatial Components:** `components/projects/spatial/SpatialViewer.tsx`

---

## Implementation Commands

### Start Phase 1 (Backend)
```bash
/kc:impl phase-1-server-actions
```

### Start Phase 2 (Frontend)
```bash
/kc:impl phase-2-ui-components
```

### Continue Sequentially
```bash
/kc:impl phase-3-spatialviewer-integration
/kc:impl phase-4-task-detail-panel
/kc:impl phase-5-client-portal
/kc:impl phase-6-mobile-optimization
```

### After All Phases Complete
```bash
/kc:review
/kc:build
```

---

## Token Budget Summary

| Phase | Estimated Tokens | Agent |
|-------|------------------|-------|
| Phase 1 | 8-12k | Backend |
| Phase 2 | 15-20k | Frontend |
| Phase 3 | 12-18k | Frontend |
| Phase 4 | 12-18k | Frontend |
| Phase 5 | 8-12k | Frontend |
| Phase 6 | 10-15k | Frontend |
| **Total** | **65-95k tokens** | Mixed |

All within agent budget caps (Backend: 25k max, Frontend: 35k max per session).

---

## Notes

- **No database migrations needed** – all required tables and columns already exist
- **RLS policies assumed to exist** – if missing, see Phase 1 checklist in design doc
- **Default models already implemented** – `lib/xeokit/default-models.ts` has procedural generation
- **DO NOT use Dialog component** – BaseModal is required by CLAUDE.md
- **DO NOT import Supabase in client components** – all data fetching via server actions
- **Lucide icons only** – no other icon libraries

---

**Ready to begin implementation. Start with Phase 1.**
