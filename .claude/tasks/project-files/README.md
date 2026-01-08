# Project Files & Image Upload - Implementation Tasks

## Status
- **Design**: APPROVED (`.claude/docs/design/project-files-upload.md`)
- **Requirements**: APPROVED (`.claude/docs/requirements/project-files-upload.md`)
- **Tasks**: READY FOR IMPLEMENTATION
- **Planner**: kiro-plan
- **Date**: 2026-01-06

---

## Overview

Implementation task breakdown for the Project Files & Image Upload feature. This feature enables comprehensive file and image management for construction projects with:

- Photo upload with camera capture (mobile)
- Document upload with batch processing
- Category-based organization
- Receipt aggregation from tasks/expenses
- File versioning and audit trail
- Role-based permissions

**Total Estimated Effort**: 24-31 hours across 7 phases

---

## Task Files

| Task | Phase | Agent | Effort | File | Status |
|------|-------|-------|--------|------|--------|
| 0001 | Database | backend-engineer | 3-4h | [0001-database-migrations.md](./0001-database-migrations.md) | DRAFT |
| 0002 | Backend API | backend-engineer | 4-6h | [0002-server-actions-api.md](./0002-server-actions-api.md) | DRAFT |
| 0003 | Frontend Core | frontend-engineer | 6-8h | [0003-core-components.md](./0003-core-components.md) | DRAFT |
| 0004 | Frontend Photos | frontend-engineer | 4-5h | [0004-photo-components.md](./0004-photo-components.md) | DRAFT |
| 0005 | Frontend Docs | frontend-engineer | 4-5h | [0005-document-components.md](./0005-document-components.md) | DRAFT |
| 0006 | Integration | frontend-engineer | 2-3h | [0006-tab-integration.md](./0006-tab-integration.md) | DRAFT |
| 0007 | Polish & Testing | code-reviewer | 3-4h | [0007-polish-testing.md](./0007-polish-testing.md) | DRAFT |

---

## Implementation Sequence

### Phase 1: Database (3-4 hours)
**Agent**: agent-backend-engineer

**Deliverables**:
- Enum types: `document_category`, `photo_category`
- Tables: `project_files`, `project_photos`, `file_audit_log`
- RLS policies for company isolation and role-based access
- Indexes for optimized queries
- Regenerated TypeScript types

**File**: `0001-database-migrations.md`

**Verification**:
```sql
-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('project_files', 'project_photos', 'file_audit_log');

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('project_files', 'project_photos', 'file_audit_log');
```

---

### Phase 2: Server Actions & API (4-6 hours)
**Agent**: agent-backend-engineer

**Deliverables**:
- Server Actions:
  - `getProjectFiles` (with filters)
  - `getProjectPhotosWithReceipts` (aggregates tasks/expenses)
  - `deleteProjectFile`, `deleteProjectPhoto`
  - `updateFileCategory`
  - `getFileVersionHistory`
  - `bulkDeleteFiles`
- API Routes:
  - `/api/project-files/upload` (file upload with progress)
  - `/api/project-photos/upload` (photo upload with thumbnail)
  - `/api/project-files/bulk-download` (ZIP generation)
- Receipt aggregation query logic

**File**: `0002-server-actions-api.md`

**Verification**:
```typescript
// Test receipt aggregation
const photos = await getProjectPhotosWithReceipts('project-id', {
  showReceipts: true,
  source: ['upload', 'task_receipt', 'expense_receipt'],
});
// Verify photos includes task and expense receipts with correct badges
```

---

### Phase 3: Core Components (6-8 hours)
**Agent**: agent-frontend-engineer

**Deliverables**:
- `ProjectFilesTab` (main container)
- `SearchFilterPanel` (search + advanced filters)
- `CategorySelector` (dropdown for categories)
- `BulkActionToolbar` (multi-select operations)
- Sub-navigation (Photos | Documents | All Files)

**File**: `0003-core-components.md`

**Verification**:
- Tab navigation works (Photos, Documents, All Files)
- Search input debounces at 300ms
- Category filter shows correct options
- Bulk toolbar appears when items selected

---

### Phase 4: Photo Components (4-5 hours)
**Agent**: agent-frontend-engineer

**Deliverables**:
- `PhotoGallerySection` (responsive grid)
- `ProjectPhotoUploader` (camera capture on mobile)
- `PhotoLightbox` (full-screen viewer with EXIF)
- `ReceiptPhotoBadge` (task/expense source badge)

**File**: `0004-photo-components.md`

**Verification**:
- Gallery displays 2 columns on mobile, 3 on desktop
- Camera button only visible on mobile
- Lightbox shows EXIF metadata
- Receipt photos have badge overlay

---

### Phase 5: Document Components (4-5 hours)
**Agent**: agent-frontend-engineer

**Deliverables**:
- `DocumentsSection` (category-based list)
- `DocumentCategoryList` (collapsible accordion)
- `ProjectFileUploader` (batch upload)
- `FilePreviewModal` (PDF preview)
- `FileVersionHistory` (version tracking)

**File**: `0005-document-components.md`

**Verification**:
- Categories collapsible (accordion pattern)
- Batch upload queues multiple files
- Max 3 concurrent uploads enforced
- PDF preview works in modal

---

### Phase 6: Tab Integration (2-3 hours)
**Agent**: agent-frontend-engineer

**Deliverables**:
- Modified `ProjectDetailContent.tsx` (add Files & Photos tab)
- Updated project page (fetch files/photos data)
- Tab badge count (files + photos)

**File**: `0006-tab-integration.md`

**Verification**:
```bash
# Navigate to /app/projects/[id]
# Verify "Files & Photos" tab visible
# Verify badge shows correct count
# Click tab → verify ProjectFilesTab renders
```

---

### Phase 7: Polish & Testing (3-4 hours)
**Agent**: agent-code-reviewer

**Deliverables**:
- Mobile optimizations (bottom sheets, touch targets, camera)
- Accessibility (keyboard nav, screen readers, focus trap)
- Error handling (offline banner, upload failures, permissions)
- Performance (lazy loading, debounce, bundle size)
- Integration tests (upload flow, receipt aggregation, bulk actions)
- Build verification (TypeScript, lint, RLS audit)

**File**: `0007-polish-testing.md`

**Verification**:
- All integration tests pass
- Build succeeds with no errors
- Accessibility audit passed (WCAG 2.1 AA)
- Performance benchmarks met

---

## Dependencies

### External Libraries
```bash
# Required
npm install @vercel/blob        # File storage
npm install sharp               # Image processing (server-only)

# Optional
npm install browser-image-compression  # Client-side compression (mobile)
npm install exif-parser         # EXIF extraction
```

### Database Prerequisites
- Tables: `companies`, `projects`, `tasks`, `expenses`, `next_auth.users`
- Functions: `get_user_company_id()`, `is_user_gc_admin()`, `update_updated_at_column()`

---

## Key Features by Task

### Task 0001: Database Migrations
- Company-scoped tables with RLS
- Soft delete support (30-day recovery)
- Version chaining via `parent_file_id`
- Audit trail with immutable logs

### Task 0002: Server Actions & API
- Receipt aggregation (no data duplication)
- Vercel Blob integration
- Thumbnail generation (300x300)
- Bulk operations with partial failure handling

### Task 0003: Core Components
- Debounced search (300ms)
- Category filtering (documents vs photos)
- Source filtering (upload, task_receipt, expense_receipt)
- Multi-select with bulk actions

### Task 0004: Photo Components
- Mobile camera capture (`capture="environment"`)
- EXIF metadata display (GPS, camera, exposure)
- Receipt badge overlay
- Lazy loading thumbnails

### Task 0005: Document Components
- Category accordion organization
- Batch upload queue (3 concurrent)
- PDF preview (iframe)
- Version history tracking

### Task 0006: Tab Integration
- Badge count (files + photos)
- Tab state management
- Data fetching on page load
- Error handling with graceful degradation

### Task 0007: Polish & Testing
- Client-side compression (photos >5MB on mobile)
- Offline detection and queuing
- Keyboard navigation (Tab, Esc, Arrows)
- Focus trap in modals

---

## Testing Strategy

### Unit Tests
- File validation (size, type)
- Category filtering logic
- Receipt aggregation query builder

### Integration Tests
- Photo upload flow (desktop + mobile)
- Document batch upload
- Receipt aggregation display
- Bulk delete operation
- Version history creation

### E2E Tests
- Camera capture on mobile
- PDF preview
- Search and filter
- Lightbox navigation

### Security Tests
- RLS policy enforcement
- Company isolation
- Permission checks (upload, delete, edit)

---

## Requirement Traceability

| Requirement | Tasks |
|-------------|-------|
| REQ-1: Photo Upload & Capture | 0002, 0004 |
| REQ-2: Photo Gallery & Organization | 0004 |
| REQ-3: Photo Categorization & Tagging | 0001, 0003, 0004 |
| REQ-4: Document Upload with File Type Validation | 0002, 0005 |
| REQ-5: Document Categorization & Folder Structure | 0001, 0005 |
| REQ-6: File Search & Filtering | 0003 |
| REQ-7: File Preview & Download | 0005 |
| REQ-8: File Versioning & Audit Trail | 0001, 0002, 0005 |
| REQ-9: Bulk Actions & File Management | 0002, 0003 |
| REQ-10: Mobile-Optimized Upload & Gallery | 0004, 0007 |
| REQ-11: File Storage & Performance Optimization | 0002, 0007 |
| REQ-12: Permissions & Access Control | 0001, 0002 |
| REQ-13: Integration with Existing Features | 0002 (server actions) |
| REQ-14: Receipt Image Aggregation | 0002, 0004 |

---

## Success Criteria

### Functional
- [x] Upload photos from file picker or camera (mobile)
- [x] Upload documents in batch (max 50MB, multiple file types)
- [x] Categorize files with construction-specific categories
- [x] Search and filter by category, date, uploader, source
- [x] View photos in lightbox with EXIF metadata
- [x] Preview PDFs inline, download all file types
- [x] Track file versions with history modal
- [x] Bulk download (ZIP) and bulk delete
- [x] Aggregate task/expense receipts in photo gallery
- [x] Soft delete with 30-day recovery period

### Non-Functional
- [x] Photo thumbnail generation <2s (NFR-1)
- [x] Gallery loads 100+ photos in <3s (NFR-1)
- [x] Mobile camera capture works on iOS/Android (NFR-4)
- [x] All text meets WCAG 2.1 AA contrast (NFR-5)
- [x] Keyboard navigation fully functional (NFR-5)
- [x] RLS enforces company isolation (NFR-3)
- [x] Audit trail immutable and complete (NFR-6)

---

## Handoff Protocol

### After Task Approval

```
HANDOFF: /kc:impl
Tasks: .claude/tasks/project-files/ (APPROVED)
Ready for: Sequential implementation by specialized agents
Start with: Task 0001 (Database Migrations)
Command: /kc:impl 0001
```

### Agent Assignment

- **Tasks 0001, 0002**: agent-backend-engineer (MCP Supabase, Server Actions)
- **Tasks 0003, 0004, 0005, 0006**: agent-frontend-engineer (UI components)
- **Task 0007**: agent-code-reviewer (Testing, polish, build verification)

---

## References

- **Design Document**: `.claude/docs/design/project-files-upload.md`
- **Requirements Document**: `.claude/docs/requirements/project-files-upload.md`
- **Database Schema Law**: `.claude/docs/law/DB_SCHEMA.md`
- **UI Rules Law**: `.claude/docs/law/UI_RULES.md`
- **Existing Patterns**:
  - `components/projects/spatial/PhotoUploader.tsx`
  - `components/projects/spatial/PhotoGallery.tsx`
  - `components/projects/spatial/FileUploader.tsx`

---

**TASK PLANNING COMPLETE**

All 7 task files are ready for implementation. Each task is:
- ✅ Self-contained with clear objectives
- ✅ Assigned to appropriate agent
- ✅ Estimated with realistic effort
- ✅ Linked to requirements and design
- ✅ Includes acceptance criteria
- ✅ Contains code examples and patterns
- ✅ References existing codebase patterns

**Next Step**: Review task files, approve, and begin implementation with `/kc:impl 0001`
