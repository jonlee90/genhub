# Project Files & Image Upload - Requirements

## Status
- **Status**: DRAFT (Updated with Receipt Integration)
- **Author**: kiro-requirement
- **Date**: 2026-01-06
- **Last Updated**: 2026-01-06 (Added REQ-14: Receipt Aggregation)
- **Approved by**: Pending

---

## Introduction

This feature enables comprehensive file and image management for GenHub construction projects. Users need the ability to upload, organize, and access project documentation and site photos with construction-specific categorization and workflow support.

**Key Update (2026-01-06)**: Added **REQ-14: Receipt Image Aggregation** to integrate existing receipt images from Tasks (`tasks.receipt_photo_url`) and Expenses (`expenses.receipt_url`) modules into the unified project photo gallery. This is a **read integration** - receipts are uploaded in their respective modules and referenced (not duplicated) in the project files view.

**Primary Users**: General Contractors (GC), Project Managers (PM), Field Workers, Subcontractors

**Business Value**:
- Reduce time searching for project documents by 82% (industry standard: 9.1 hours/week wasted on disorganized photos)
- Enable field teams to achieve 93% faster photo retrieval through standardized organization
- Create bulletproof audit trails with time-stamped documentation
- Protect against liability claims with comprehensive site condition documentation
- Facilitate real-time collaboration with centralized, cloud-based file access

**Integration Points**:
- Project detail page (`/app/projects/[id]`)
- Existing spatial viewer photo/file upload patterns (PhotoUploader, FileUploader, PhotoGallery components)
- Supabase storage for file hosting
- Database tables: `projects`, `project_files` (new), `project_photos` (new)

---

## Requirements

### REQ-1: Photo Upload & Capture

**User Story**: As a Field Worker, I want to upload construction site photos from my device or camera, so that I can document site conditions and progress in real-time.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user clicks "Upload Photos" button on project page THEN system SHALL display photo upload interface with drag-and-drop zone
2. WHEN user is on mobile device THEN system SHALL provide both "Choose File" and "Camera" buttons for photo capture
3. WHEN user is on desktop THEN system SHALL show only "Choose File" button (camera hidden on non-mobile devices)
4. WHEN user drags photo files over upload zone THEN system SHALL highlight zone with hover state (border color changes to construction-blue)
5. IF selected file is not JPEG, PNG, or WebP format THEN system SHALL reject file and display error message "Invalid file format. Please upload JPEG, PNG, or WebP images."
6. IF selected file exceeds 10MB THEN system SHALL reject file and display error message "File too large. Maximum size is 10MB per photo."
7. WHEN file validation passes THEN system SHALL generate thumbnail preview and display upload progress bar
8. WHILE photo is uploading THEN system SHALL show progress percentage (0-100%) and animated loader
9. WHEN upload completes successfully THEN system SHALL add photo to gallery and display success toast "Photo uploaded successfully"
10. IF upload fails THEN system SHALL display error message and allow user to retry or cancel

---

### REQ-2: Photo Gallery & Organization

**User Story**: As a PM, I want to view project photos in an organized gallery with categories and filters, so that I can quickly find specific site documentation.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user navigates to project Photos tab THEN system SHALL display grid gallery of uploaded photos (2 columns mobile, 3 columns desktop)
2. WHEN gallery has no photos THEN system SHALL display empty state with icon, message "No Photos Yet", and "Upload Photo" call-to-action button
3. WHEN user hovers over photo thumbnail THEN system SHALL display overlay with view/delete actions
4. WHEN user clicks photo thumbnail THEN system SHALL open lightbox with full-size image
5. WHEN lightbox is open THEN system SHALL display:
   - Full-size photo (max 70% viewport height)
   - Close button (top-right, white X on dark background)
   - Delete button (bottom metadata bar, red destructive style)
   - Photo filename
   - EXIF metadata (if available): date taken, camera model, GPS coordinates, exposure settings
6. WHEN user clicks outside lightbox THEN system SHALL close lightbox and return to gallery
7. WHEN user clicks delete in lightbox THEN system SHALL prompt "Delete this photo?" confirmation
8. IF user confirms deletion THEN system SHALL remove photo from storage and gallery, display success toast
9. WHEN photos load THEN system SHALL use lazy loading for thumbnails (load as user scrolls)
10. WHEN photo has thumbnail version THEN system SHALL display thumbnail in grid (for faster load), full-size in lightbox

---

### REQ-3: Photo Categorization & Tagging

**User Story**: As a PM, I want to categorize photos by type (Progress, Safety, Inspection, etc.), so that stakeholders can find relevant documentation quickly.

**Priority**: Should Have

#### Acceptance Criteria

1. WHEN user uploads photo THEN system SHALL prompt for category selection from dropdown:
   - Site Progress
   - Safety Documentation
   - Permits & Approvals
   - Inspection Reports
   - Material Receipts
   - Change Orders
   - Defects/Issues
   - Before/After
   - Task Receipts (read-only, from tasks module)
   - Expense Receipts (read-only, from expenses module)
   - General
2. IF user does not select category THEN system SHALL default to "General"
3. WHEN user views photo in lightbox THEN system SHALL display category badge
4. WHEN user is in gallery view THEN system SHALL provide filter dropdown to show only photos of selected category
5. WHEN category filter is applied THEN system SHALL display filtered count "Showing 5 of 23 photos"
6. WHEN user clears filter THEN system SHALL restore all photos
7. WHEN user uploads photo THEN system SHALL allow optional text tags (e.g., "foundation", "floor-2", "electrical")
8. WHEN user searches by tag THEN system SHALL filter gallery to matching photos
9. WHEN photo is categorized as "Safety Documentation" or "Inspection Reports" THEN system SHALL automatically tag as high-importance and prevent deletion by non-admin users

---

### REQ-4: Document Upload with File Type Validation

**User Story**: As a PM, I want to upload construction documents (PDFs, CAD files, contracts, reports) with proper validation, so that all project files are centralized and accessible.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user clicks "Upload Documents" button on project page THEN system SHALL display file upload interface
2. WHEN user selects files THEN system SHALL accept multiple files simultaneously (batch upload)
3. WHEN files are selected THEN system SHALL validate each file against allowed types:
   - Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
   - CAD/Drawings: DWG, DXF, SVG
   - Images: JPEG, PNG, WebP, GIF
   - Archives: ZIP, RAR, 7Z
4. IF file type is not allowed THEN system SHALL reject file and display error "[filename]: File type not supported"
5. IF file size exceeds 50MB THEN system SHALL reject file and display error "[filename]: File too large. Maximum size is 50MB."
6. WHEN batch upload contains both valid and invalid files THEN system SHALL upload valid files and display error summary for rejected files
7. WHEN file validation passes THEN system SHALL display file in upload queue with filename, size, and status ("Pending", "Uploading", "Success", "Error")
8. WHILE file is uploading THEN system SHALL show individual progress bar for each file (0-100%)
9. WHEN system uploads multiple files THEN system SHALL upload up to 3 files concurrently (parallel uploads)
10. WHEN upload completes successfully THEN system SHALL add file to document list and display success toast "[filename] uploaded"
11. IF upload fails THEN system SHALL mark file with error status, display error message, and allow user to retry or remove from queue

---

### REQ-5: Document Categorization & Folder Structure

**User Story**: As a GC, I want documents organized by construction-specific categories (Contracts, Permits, Reports, Drawings), so that I can comply with document management best practices.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user uploads document THEN system SHALL require category selection from dropdown:
   - **Contracts & Agreements** (contracts, change orders, amendments)
   - **Permits & Approvals** (building permits, inspections, certificates)
   - **Drawings & Blueprints** (architectural, structural, MEP, as-builts)
   - **Reports** (daily reports, progress reports, inspection reports)
   - **Financial** (invoices, receipts, payment applications, budget)
   - **Safety & Compliance** (safety plans, incident reports, certifications)
   - **Meeting Notes** (meeting minutes, RFIs, submittals)
   - **Specifications** (technical specs, material specs, product data)
   - **General**
2. WHEN user views documents tab THEN system SHALL display files grouped by category with collapsible sections
3. WHEN category section is expanded THEN system SHALL show files in list view with:
   - File icon (based on type: PDF, Word, Excel, CAD, Image, Archive)
   - Filename (truncated with ellipsis if too long)
   - File size (formatted: KB, MB)
   - Upload date (relative: "2 hours ago", "3 days ago")
   - Uploaded by (user name/avatar)
   - Download button
   - Delete button (trash icon, visible on hover)
4. WHEN user clicks category header THEN system SHALL expand/collapse that category section
5. WHEN documents tab loads THEN system SHALL default all categories to collapsed (except if URL has category anchor)
6. WHEN user uploads file to specific category THEN system SHALL automatically expand that category to show new file
7. WHEN category has no files THEN system SHALL display empty state "No [Category] documents yet"
8. WHEN user changes file category (via edit modal) THEN system SHALL move file to new category section and revalidate permissions

---

### REQ-6: File Search & Filtering

**User Story**: As a PM, I want to search and filter files by name, category, date, and uploader, so that I can quickly find specific documents without manual browsing.

**Priority**: Should Have

#### Acceptance Criteria

1. WHEN user is on Photos or Documents tab THEN system SHALL display search bar at top of page
2. WHEN user types in search bar THEN system SHALL filter files in real-time (debounced 300ms)
3. WHEN search matches filename THEN system SHALL display matching files and hide non-matching files
4. WHEN search has no results THEN system SHALL display empty state "No files match '[search term]'"
5. WHEN user clears search THEN system SHALL restore all files
6. WHEN user clicks "Filter" button THEN system SHALL display filter panel with options:
   - Category (multi-select checkboxes)
   - Date Range (from/to date pickers)
   - Uploaded By (multi-select user list)
   - File Type (Document, Image, CAD, Archive)
7. WHEN filters are applied THEN system SHALL update file list and display active filter count "3 filters active"
8. WHEN user clicks "Clear Filters" THEN system SHALL reset all filters and display all files
9. WHEN user applies filter THEN system SHALL persist filter state in URL query params (for shareable links)
10. WHEN user shares filtered URL THEN recipient SHALL see same filtered view

---

### REQ-7: File Preview & Download

**User Story**: As a user, I want to preview common file types (PDF, images) and download all files, so that I can review documents without leaving the platform.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user clicks PDF file THEN system SHALL open inline PDF viewer in modal (using browser native PDF viewer or iframe)
2. WHEN user clicks image file THEN system SHALL open lightbox with full-size image
3. WHEN user clicks non-previewable file (Word, Excel, CAD, Archive) THEN system SHALL show file details modal with:
   - Filename
   - File type icon
   - File size
   - Upload date
   - Uploaded by
   - Download button
   - Delete button (if user has permission)
4. WHEN user clicks download button THEN system SHALL initiate file download with original filename
5. WHEN file is downloading THEN system SHALL display download progress indicator (browser-native or custom)
6. WHEN user clicks "Download All" (bulk action) THEN system SHALL create ZIP archive of selected files and download
7. IF user selects files from multiple categories for bulk download THEN system SHALL maintain category folder structure in ZIP
8. WHEN PDF preview loads THEN system SHALL display loading spinner until PDF renders
9. IF PDF preview fails THEN system SHALL fallback to download-only mode with error message "Preview not available. Click to download."

---

### REQ-8: File Versioning & Audit Trail

**User Story**: As a PM, I want to see version history and audit trails for critical documents (contracts, drawings), so that I can track changes and maintain compliance.

**Priority**: Could Have

#### Acceptance Criteria

1. WHEN user uploads file with same name as existing file in same category THEN system SHALL prompt "File with this name already exists. Upload as new version?"
2. IF user confirms new version THEN system SHALL:
   - Increment version number (e.g., "Contract_v1.pdf" → "Contract_v2.pdf")
   - Link new version to original file (parent-child relationship)
   - Preserve original file (do not overwrite)
   - Add version badge to file list
3. WHEN user clicks versioned file THEN system SHALL display "View Versions" button
4. WHEN user clicks "View Versions" THEN system SHALL show version history modal with:
   - Version number
   - Upload date
   - Uploaded by
   - File size
   - Change notes (optional text field on upload)
   - Download button for each version
   - "Set as Current" button (to promote older version)
5. WHEN user sets older version as current THEN system SHALL mark that version as latest and update file list
6. WHEN critical document (Contracts, Permits, Drawings) is uploaded/modified/deleted THEN system SHALL log action to audit trail with:
   - Action type (upload, delete, version update, category change)
   - User who performed action
   - Timestamp
   - Previous state (if applicable)
7. WHEN user views audit trail THEN system SHALL display chronological log of all file actions for that project
8. WHEN user is GC or PM THEN system SHALL allow viewing full audit trail
9. IF user is Field Worker or Subcontractor THEN system SHALL restrict audit trail to own actions only

---

### REQ-9: Bulk Actions & File Management

**User Story**: As a PM, I want to perform bulk operations (download, delete, move) on multiple files, so that I can efficiently manage large document sets.

**Priority**: Should Have

#### Acceptance Criteria

1. WHEN user is on Documents or Photos tab THEN system SHALL display checkbox next to each file/photo
2. WHEN user clicks checkbox THEN system SHALL mark file as selected with visual highlight
3. WHEN user clicks "Select All" checkbox (header) THEN system SHALL select all visible files in current view/filter
4. WHEN files are selected THEN system SHALL display bulk action toolbar with:
   - Selected count "5 files selected"
   - Download button
   - Delete button
   - Move to Category dropdown (documents only)
   - Cancel/Clear Selection button
5. WHEN user clicks bulk download THEN system SHALL create ZIP archive of selected files and initiate download
6. WHEN user clicks bulk delete THEN system SHALL prompt "Delete [N] files? This cannot be undone."
7. IF user confirms bulk delete THEN system SHALL delete all selected files and display success toast "[N] files deleted"
8. WHEN user selects bulk move category THEN system SHALL move all selected files to new category and refresh view
9. IF bulk action fails for some files THEN system SHALL display error summary "5 of 10 files deleted. 5 failed: [filenames]"
10. WHEN user clicks cancel THEN system SHALL deselect all files and hide bulk action toolbar

---

### REQ-10: Mobile-Optimized Upload & Gallery

**User Story**: As a Field Worker, I want a mobile-optimized file upload and gallery experience, so that I can document site conditions efficiently from my phone.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user accesses photo gallery on mobile THEN system SHALL display 2-column grid (1 column on narrow screens <480px)
2. WHEN user taps "Upload Photo" on mobile THEN system SHALL display bottom sheet modal (not centered modal)
3. WHEN bottom sheet opens THEN system SHALL show "Camera" button (using `capture="environment"` for rear camera)
4. WHEN user taps camera button THEN system SHALL open device camera app for immediate photo capture
5. WHEN photo is captured via camera THEN system SHALL auto-load preview and initiate upload (skip file picker step)
6. WHEN user uploads file on mobile THEN system SHALL compress image client-side if >5MB (using browser APIs) before upload
7. WHEN mobile keyboard is open THEN system SHALL adjust bottom sheet height to remain visible
8. WHEN user swipes down on bottom sheet THEN system SHALL close upload modal
9. WHEN user taps photo thumbnail on mobile THEN system SHALL open full-screen lightbox optimized for touch gestures:
   - Swipe left/right to navigate between photos
   - Pinch to zoom
   - Double-tap to zoom in/out
10. WHEN mobile connection is slow/offline THEN system SHALL display offline banner and queue uploads for retry when online

---

### REQ-11: File Storage & Performance Optimization

**User Story**: As a system, I want efficient file storage and delivery, so that users experience fast uploads/downloads regardless of file size.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN photo is uploaded THEN system SHALL generate thumbnail (300x300px) and compressed version (1200px max dimension) for gallery display
2. WHEN user opens lightbox THEN system SHALL serve full-resolution original image
3. WHEN file is uploaded to Supabase Storage THEN system SHALL organize by path structure: `[company_id]/projects/[project_id]/photos/[file_id]`
4. WHEN file is uploaded THEN system SHALL generate secure signed URL with 7-day expiration
5. WHEN signed URL expires THEN system SHALL auto-refresh URL when user accesses file
6. WHEN gallery loads THEN system SHALL lazy-load thumbnails (load on scroll, not all at once)
7. WHEN user scrolls gallery THEN system SHALL load thumbnails in viewport +500px buffer zone
8. WHEN file is deleted THEN system SHALL remove from both database and Supabase Storage (cascade delete)
9. WHEN project is archived THEN system SHALL retain all files but flag for potential cleanup after retention period (7 years per construction industry standard)
10. WHEN storage quota is reached THEN system SHALL prevent new uploads and display error "Storage limit reached. Contact support to upgrade."

---

### REQ-12: Permissions & Access Control

**User Story**: As a GC, I want to control who can upload, view, and delete project files, so that sensitive documents remain secure.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user is GC or PM on project THEN system SHALL allow upload, view, edit, delete of all files
2. WHEN user is Field Worker on project THEN system SHALL allow:
   - Upload photos and documents
   - View all files
   - Delete only own uploaded files
3. WHEN user is Subcontractor on project THEN system SHALL allow:
   - Upload files to assigned tasks only
   - View files in own assigned tasks only
   - Cannot delete any files
4. WHEN user is Client on project THEN system SHALL allow:
   - View photos and approved documents only (flagged as client-visible)
   - Cannot upload or delete
5. WHEN user attempts unauthorized action (e.g., delete someone else's file) THEN system SHALL display error "You don't have permission to perform this action"
6. WHEN file is uploaded THEN system SHALL record uploader's user ID for permission checks
7. WHEN file is marked as "client-visible" (checkbox on upload) THEN system SHALL make file accessible in Client Portal
8. WHEN sensitive document (Contracts, Financial) is uploaded THEN system SHALL default client-visible to OFF (require explicit opt-in)
9. WHEN user lacks view permission for file THEN system SHALL return 403 error (not 404) with message "Access denied"
10. WHEN RLS policy checks file access THEN system SHALL verify:
    - User is in project team (`project_team` table)
    - User role has required permission level
    - File is not deleted (soft delete check)

---

### REQ-13: Integration with Existing Features

**User Story**: As a user, I want file uploads integrated with tasks, expenses, and spatial markers, so that documentation is linked to relevant project entities.

**Priority**: Should Have

#### Acceptance Criteria

1. WHEN user uploads file from task detail page THEN system SHALL auto-link file to that task
2. WHEN user views task detail THEN system SHALL display "Attachments" tab with linked files
3. WHEN user uploads receipt in expense form THEN system SHALL auto-link to expense record
4. WHEN user adds photo to spatial marker THEN system SHALL link photo to marker (existing functionality via spatial viewer)
5. WHEN file is linked to task THEN system SHALL display task badge in file list (e.g., "Task #42: Pour Foundation")
6. WHEN user clicks task badge THEN system SHALL navigate to task detail page
7. WHEN task is deleted THEN system SHALL unlink files (but preserve files in project gallery)
8. WHEN user uploads multiple files to task THEN system SHALL maintain upload order for display consistency
9. WHEN user removes file from task attachments THEN system SHALL prompt "Remove from task or delete permanently?"
10. IF user chooses "Remove from task" THEN system SHALL unlink file but keep in project gallery

---

### REQ-14: Receipt Image Aggregation from Tasks & Expenses

**User Story**: As a PM, I want to see all receipt images from tasks and expenses in the project photo gallery, so that I have a unified view of all project documentation without duplicating data.

**Priority**: Must Have

#### Acceptance Criteria

1. WHEN user views project Photos tab THEN system SHALL aggregate and display receipt images from:
   - `tasks.receipt_photo_url` (task receipts)
   - `expenses.receipt_url` (expense receipts)
   - Direct photo uploads to `project_photos` table
2. WHEN task receipt is displayed in gallery THEN system SHALL show metadata badge "Task Receipt: [Task Title]"
3. WHEN expense receipt is displayed in gallery THEN system SHALL show metadata badge "Expense Receipt: [Expense Description]"
4. WHEN user clicks task receipt photo THEN system SHALL open lightbox with full image and metadata showing linked task name, amount (if applicable), date
5. WHEN user clicks expense receipt photo THEN system SHALL open lightbox with full image and metadata showing expense description, amount, date, status
6. WHEN user clicks "View Source" button in receipt lightbox THEN system SHALL navigate to the source task detail or expense detail page
7. WHEN user attempts to delete receipt image from gallery THEN system SHALL display error "Cannot delete from here. Edit the source task/expense to remove."
8. WHEN user applies category filter "Task Receipts" THEN system SHALL display only photos from `tasks.receipt_photo_url`
9. WHEN user applies category filter "Expense Receipts" THEN system SHALL display only photos from `expenses.receipt_url`
10. WHEN user applies category filter "All Receipts" THEN system SHALL display both task and expense receipts combined
11. WHEN gallery aggregates receipts THEN system SHALL use SQL JOIN or separate queries to fetch from tasks and expenses tables (no data duplication)
12. WHEN receipt image URL is invalid or expired THEN system SHALL display placeholder with "Image not available" and link to source record
13. WHEN user toggles "Show Receipts" filter option THEN system SHALL hide/show receipt images from tasks and expenses (default: shown)
14. WHEN receipt is uploaded to task/expense THEN system SHALL automatically appear in project gallery within 5 seconds (via cache revalidation)
15. WHEN task or expense is deleted THEN system SHALL automatically remove associated receipt from gallery view

---

## Non-Functional Requirements

### NFR-1: Performance

1. Photo thumbnail generation SHALL complete within 2 seconds of upload
2. Gallery page with 100+ photos SHALL load initial view within 3 seconds
3. File upload progress SHALL update at minimum 200ms intervals
4. Search/filter results SHALL display within 300ms of user input (debounced)
5. Lightbox SHALL open within 500ms of thumbnail click
6. Batch download ZIP generation SHALL support up to 500MB total size

### NFR-2: Storage & Scalability

1. System SHALL support up to 10,000 files per project
2. Individual file size limit: 50MB (documents), 10MB (photos)
3. Company storage quota: 50GB (free tier), 500GB (pro tier)
4. Storage quota enforcement SHALL check before upload (prevent over-quota uploads)
5. File retention period: 7 years minimum (construction industry compliance)

### NFR-3: Security

1. All file URLs SHALL use signed URLs with expiration (7-day default)
2. File uploads SHALL require authentication (no anonymous uploads)
3. File access SHALL enforce RLS policies at database and storage level
4. Sensitive file types (DWG, financial docs) SHALL require role-based permissions
5. File deletion SHALL be soft delete (flag as deleted, preserve 30 days for recovery)

### NFR-4: Mobile & Offline

1. Mobile camera capture SHALL use device rear camera by default
2. Upload queue SHALL persist in browser storage if user navigates away
3. Failed uploads SHALL auto-retry up to 3 times with exponential backoff
4. Offline mode SHALL display banner "You're offline. Uploads will resume when connected."
5. Touch targets for mobile actions SHALL be minimum 44x44px

### NFR-5: Accessibility

1. File upload zone SHALL be keyboard-accessible (Tab to focus, Enter to open file picker)
2. Lightbox SHALL support keyboard navigation (Esc to close, Arrow keys for next/prev photo)
3. File list SHALL use semantic HTML (table with proper headers)
4. All images SHALL have descriptive alt text (filename or custom description)
5. Color-blind safe status indicators (use icons + color, not color alone)

### NFR-6: Compliance & Audit

1. File audit trail SHALL be immutable (append-only log)
2. Critical document changes SHALL trigger email notification to project stakeholders
3. File metadata SHALL include SHA-256 hash for integrity verification
4. Deleted files SHALL be recoverable by admin for 30 days (soft delete)
5. EXIF GPS data SHALL be preserved for site location verification

---

## Constraints

### Technical Constraints

1. **Storage Backend**: Supabase Storage (S3-compatible, integrated with RLS)
2. **Max Concurrent Uploads**: 3 files at once (prevent browser/network overload)
3. **Image Processing**: Client-side compression for mobile (no server-side processing)
4. **Supported Browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
5. **Mobile OS**: iOS 13+, Android 8+

### Business Constraints

1. **Naming Convention**: Files auto-renamed on upload to format `[ProjectName]_[Date]_[OriginalName]` (max 100 characters)
2. **Archive Folder**: Completed projects moved to "Archive" after 90 days inactive (viewable, not editable)
3. **Free Tier Limits**: 50GB storage, 1000 files per project
4. **Client Portal**: Only photos/documents marked "client-visible" appear in client portal

### Integration Constraints

1. **Existing Components**: Reuse `PhotoUploader`, `FileUploader`, `PhotoGallery` patterns from spatial viewer
2. **Database Tables**: New tables `project_files`, `project_photos` must integrate with existing `projects` table
3. **UI Consistency**: Must follow UI_RULES.md design system (construction theme, blueprint grid, industrial header)

---

## Out of Scope (Future Iterations)

1. **Advanced OCR**: Auto-extracting text from scanned documents (beyond basic EXIF for photos)
2. **AI-Powered Tagging**: Auto-categorization of photos based on image content analysis
3. **Version Comparison**: Visual diff for CAD/drawing files
4. **Collaborative Annotations**: Markup/comments on PDF drawings (use external tool for now)
5. **Video Upload**: Construction progress videos (photos only for initial release)
6. **Email-to-Upload**: Forward documents via email to auto-import to project
7. **Integration with External DMS**: Sync with Procore, Autodesk BIM 360 (manual upload only for now)
8. **Automated Backups**: Scheduled exports to external storage (rely on Supabase backups)

---

## Open Questions

- [ ] **Q1**: Should we auto-extract EXIF GPS coordinates and plot photos on project map/floor plan?
- [ ] **Q2**: Do we need OCR for material receipts uploaded as photos (vs. dedicated expense OCR)?
- [ ] **Q3**: Should "critical documents" (Contracts, Permits) require multi-user approval before deletion?
- [ ] **Q4**: What's the file retention policy after project completion? Archive or auto-delete after N years?
- [ ] **Q5**: Should we implement blockchain-based file integrity verification for legal compliance?
- [ ] **Q6**: Do we need integration with DocuSign for contract e-signatures (or keep out of scope)?
- [ ] **Q7**: Should receipt images from tasks/expenses support inline editing (e.g., rotate, crop) in the gallery, or only in the source module?
- [ ] **Q8**: When filtering by "All Receipts", should the gallery show combined task + expense receipts sorted chronologically, or grouped by source type?

---

## Glossary

| Term | Definition |
|------|------------|
| **EXIF** | Exchangeable Image File Format - metadata embedded in photos (camera, GPS, timestamp) |
| **RLS** | Row-Level Security - Supabase database access control at row granularity |
| **Lightbox** | Modal overlay for viewing full-size images |
| **Thumbnail** | Small preview image (300x300px) for gallery display |
| **Soft Delete** | Marking record as deleted without removing from database (allows recovery) |
| **Signed URL** | Time-limited secure URL for accessing private files in cloud storage |
| **Batch Upload** | Uploading multiple files simultaneously (up to 3 concurrent) |
| **Client Portal** | Public-facing project view for clients (read-only, curated content) |
| **Audit Trail** | Immutable log of all file actions (upload, delete, modify) for compliance |
| **Construction Document Management** | Industry best practice: categorize by phase, use uniform naming, centralize storage |
| **Critical Documents** | High-importance files requiring stricter permissions: Contracts, Permits, Drawings, Financial |

---

## Research References

This requirements document is informed by construction industry best practices research:

**Photo Documentation Best Practices**:
- Field teams achieve 93% faster photo retrieval through standardized naming conventions
- Time-stamped images create bulletproof audit trails for compliance and liability protection
- AI-generated logs from site photos reduce reporting time by up to 90%
- Paper-based punch lists waste 127 hours per project on average (digital cuts this by 82%)
- Source: [OpenSpace - Best Practices for Construction Site Photo Documentation](https://www.openspace.ai/blog/best-practices-for-construction-site-photo-documentation-what-to-capture-and-why-it-matters/)

**Document Categorization Standards**:
- Strategic segmentation by project phase (Planning, Design, Construction, Closeout)
- Uniform naming conventions with date, project name, document type, version
- Metadata integration for enhanced searchability and context
- Version control with standard numbering for revisions
- Centralized cloud storage for geographically dispersed teams
- Source: [Egnyte - Construction File Management Guide](https://www.egnyte.com/guides/aec/construction-file-management)

**File Organization Efficiency**:
- Construction teams waste 9.1 hours weekly searching disorganized project photos (smart documentation cuts this by 82%)
- Establishing "Archive" folders instead of deletion preserves access while reducing clutter
- 3-2-1 backup rule: three copies, two media formats, one offsite
- Source: [CrewCost - Organizing Construction Documents Best Practices](https://crewcost.com/blog/organizing-construction-documents-best-practices-for-general-contractors/)

**Key Document Categories**:
- Contracts & Compliance (contracts, change orders, certifications)
- Drawings & Specifications (architectural, structural, MEP, as-builts)
- Reports (daily logs, progress reports, inspection reports)
- Financial (invoices, receipts, payment applications, budget tracking)
- Safety & Compliance (safety plans, incident reports, OSHA documentation)
- Source: [Autodesk - Construction File Management Tips](https://www.autodesk.com/blogs/construction/construction-file-management/)

---

## UI/UX Recommendations (Based on Research & Existing Patterns)

### Photo Gallery UI
1. **Grid Layout**: 2 columns (mobile), 3 columns (desktop) - matches existing `PhotoGallery` component pattern
2. **Thumbnail Hover**: Display view/delete overlays (matches spatial viewer pattern)
3. **Lightbox**: Full-screen modal with EXIF metadata bar at bottom (existing implementation in `PhotoGallery.tsx`)
4. **Empty State**: Icon + message + CTA button (follows GenHub empty state pattern from UI_RULES.md)

### Document List UI
1. **Category Sections**: Collapsible accordion sections (follows construction phase segmentation best practice)
2. **File Icons**: Type-specific icons (PDF, Word, Excel, CAD, Image, Archive) using Lucide icons
3. **List View Columns**: Icon | Filename | Size | Date | Uploaded By | Actions
4. **Bulk Actions Toolbar**: Sticky bar at top when files selected (checkbox selection pattern)

### Upload Interface UI
1. **Drag-and-Drop Zone**: Dashed border, hover highlight (matches existing `FileUploader` component)
2. **Mobile Camera**: Bottom sheet modal with Camera + Choose File buttons (existing `PhotoUploader` pattern)
3. **Progress Indicators**: Individual progress bars per file (existing batch upload in `FileUploader.tsx`)
4. **Category Selector**: Dropdown modal on upload (new requirement, integrate with upload flow)

### Construction Theme Consistency
- **Colors**: Construction blue (#001B51), status green (#059669), error red (#DC2626)
- **Fonts**: UPPERCASE titles, font-black for headers (per UI_RULES.md)
- **Borders**: border-2 for cards, border-l-4 for section headers
- **Icons**: Lucide React only (Upload, Camera, FileText, Trash2, Download, Filter)
- **Modals**: Use `BaseModal` component (construction-themed, responsive, bottom sheet on mobile)

---

## Implementation Notes

### Reusable Components (From Existing Codebase)
- **PhotoUploader** (`components/projects/spatial/PhotoUploader.tsx`): Drag-and-drop, camera capture, validation, progress
- **FileUploader** (`components/projects/spatial/FileUploader.tsx`): Batch upload, concurrent uploads (max 3), individual progress bars
- **PhotoGallery** (`components/projects/spatial/PhotoGallery.tsx`): Grid gallery, lightbox, EXIF metadata display

### New Components Needed
- **DocumentList**: Category-based accordion list for documents
- **FileSearchFilter**: Search bar + filter panel (category, date, user, type)
- **BulkActionToolbar**: Checkbox selection + bulk download/delete/move
- **FileCategorySelector**: Modal dropdown for categorization on upload
- **FileVersionHistory**: Modal for viewing file versions and audit trail

### Database Schema (New Tables)
```sql
-- Project files table
CREATE TABLE project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES next_auth.users(id),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL, -- bytes
  file_type text NOT NULL, -- MIME type
  category text NOT NULL, -- 'contracts', 'permits', 'drawings', etc.
  tags text[], -- Array of custom tags
  client_visible boolean DEFAULT false,
  version_number integer DEFAULT 1,
  parent_file_id uuid REFERENCES project_files(id), -- For versioning
  metadata jsonb, -- Additional metadata (hash, etc.)
  deleted_at timestamp with time zone, -- Soft delete
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Project photos table (extends existing spatial marker photos)
CREATE TABLE project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES next_auth.users(id),
  filename text NOT NULL,
  photo_url text NOT NULL,
  thumbnail_url text,
  file_size bigint NOT NULL,
  category text NOT NULL, -- 'progress', 'safety', 'inspection', etc.
  tags text[],
  exif_data jsonb, -- GPS, camera, timestamp, exposure
  client_visible boolean DEFAULT false,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- File audit trail
CREATE TABLE file_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid, -- References project_files OR project_photos
  file_type text NOT NULL, -- 'document' or 'photo'
  action text NOT NULL, -- 'upload', 'delete', 'version_update', 'category_change'
  performed_by uuid NOT NULL REFERENCES next_auth.users(id),
  previous_state jsonb, -- State before action
  new_state jsonb, -- State after action
  created_at timestamp with time zone DEFAULT now()
);
```

### Server Actions Needed
```typescript
// app/actions/project-files.ts
export async function uploadProjectFile(formData: FormData) { ... }
export async function uploadProjectPhoto(formData: FormData) { ... }
export async function deleteProjectFile(fileId: string) { ... }
export async function getProjectFiles(projectId: string, filters: FileFilters) { ... }
export async function bulkDownloadFiles(fileIds: string[]) { ... }
export async function updateFileCategory(fileId: string, category: string) { ... }
export async function getFileVersionHistory(fileId: string) { ... }

// Receipt aggregation (cross-module read integration)
export async function getProjectPhotosWithReceipts(projectId: string, filters: PhotoFilters) {
  // Aggregates:
  // 1. Direct uploads from project_photos table
  // 2. Task receipts via JOIN with tasks table (tasks.receipt_photo_url)
  // 3. Expense receipts via JOIN with expenses table (expenses.receipt_url)
  // Returns unified array with source metadata
}
```

### Data Aggregation Pattern
```typescript
// Unified photo object for gallery display
interface ProjectPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  category: string;
  source: 'upload' | 'task_receipt' | 'expense_receipt';
  source_id?: string; // Task ID or Expense ID
  source_title?: string; // Task title or Expense description
  uploaded_by: string;
  created_at: string;
  metadata?: {
    exif?: object;
    task_name?: string;
    expense_amount?: number;
    expense_status?: string;
  };
  is_deletable: boolean; // False for receipt references
}

// Example aggregation query
const photos = await supabase.from('project_photos')
  .select('*')
  .eq('project_id', projectId)
  .union(
    supabase.from('tasks')
      .select('id, title, receipt_photo_url, created_at')
      .eq('project_id', projectId)
      .not('receipt_photo_url', 'is', null)
  )
  .union(
    supabase.from('expenses')
      .select('id, description, receipt_url, amount, status, created_at')
      .eq('project_id', projectId)
      .not('receipt_url', 'is', null)
  );
```

---

**END OF REQUIREMENTS DOCUMENT**

Sources:
- [OpenSpace - Best Practices for Construction Site Photo Documentation](https://www.openspace.ai/blog/best-practices-for-construction-site-photo-documentation-what-to-capture-and-why-it-matters/)
- [Egnyte - Construction File Management Guide](https://www.egnyte.com/guides/aec/construction-file-management)
- [CrewCost - Organizing Construction Documents Best Practices](https://crewcost.com/blog/organizing-construction-documents-best-practices-for-general-contractors/)
- [Autodesk - Construction File Management Tips](https://www.autodesk.com/blogs/construction/construction-file-management/)
- [Raken - Photo Documentation Best Practices](https://www.rakenapp.com/ebooks/best-practices-for-photo-documentation-and-boosting-visibility)
- [DroneDeploy - Mastering Construction Photo Documentation](https://dronedeploy.com/blog/mastering-construction-photo-documentation-a-guide-to-project-success)
