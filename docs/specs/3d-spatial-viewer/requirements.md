# Requirements Document

## Introduction

The 3D Spatial Project Viewer is a major feature enhancement for GenHub PWA that enables construction teams to visualize projects in 3D space and attach contextual content (photos, files, notes, history) to specific spatial locations within a building model. Think of it as "Google Street View meets Construction Documentation" - users can navigate through a 3D model of their construction project and access all relevant documentation tied to exact physical locations.

This feature addresses a critical pain point in construction management: the disconnect between physical locations and digital documentation. When someone asks "where was this photo taken?" or "what work was done in room 204?", project teams currently struggle to provide spatial context. The 3D Spatial Viewer solves this by making location the organizing principle for all project content.

The viewer will integrate with existing GenHub features (projects, tasks, phases, team) while adding a new dimension of spatial awareness to construction project management.

---

## Requirements

### Requirement 1: BIM/CAD Model Loading and Display

**User Story:** As a Project Manager, I want to upload and view 3D building models in my project, so that my team can visualize the construction site digitally.

#### Acceptance Criteria

1. WHEN a user uploads an IFC file (IFC 2x3 or IFC 4) THEN the system SHALL parse the file and render a navigable 3D model within 30 seconds for files under 50MB.

2. WHEN an IFC file is uploaded THEN the system SHALL extract and display building elements (floors, walls, rooms, doors, windows) as selectable objects.

3. IF no BIM file is available THEN the system SHALL allow users to create a simplified 3D representation using floor plan images or basic room geometry.

4. WHEN viewing a model THEN the system SHALL support pan, zoom, rotate, and first-person navigation controls on both desktop and mobile devices.

5. WHEN a model contains multiple floors THEN the system SHALL provide floor-level filtering to isolate specific floors for viewing.

6. WHEN the user is on a mobile device (PWA) THEN the system SHALL optimize model rendering for performance using Level of Detail (LOD) techniques.

7. IF the model file exceeds 100MB THEN the system SHALL display a warning and offer cloud-based processing with streaming delivery.

---

### Requirement 2: Spatial Marker System

**User Story:** As a Field Worker, I want to place markers at specific locations in the 3D model, so that I can attach photos, notes, and documents to exact physical spots in the building.

#### Acceptance Criteria

1. WHEN a user clicks on a surface in the 3D model THEN the system SHALL create a spatial marker with precise 3D coordinates (x, y, z).

2. WHEN a marker is created THEN the system SHALL prompt the user to select a marker type (photo, document, note, issue, progress update).

3. WHEN viewing the 3D model THEN the system SHALL display all markers as icons at their spatial positions with visual indicators for marker type.

4. WHEN a user hovers over a marker (desktop) or taps a marker (mobile) THEN the system SHALL display a preview of the attached content.

5. WHEN multiple markers exist within 1 meter of each other THEN the system SHALL cluster them with a count indicator to prevent visual clutter.

6. IF a marker is placed on a BIM element (e.g., wall, door) THEN the system SHALL associate the marker with that element's metadata.

7. WHEN the model is updated (new version uploaded) THEN the system SHALL attempt to preserve marker positions relative to their associated BIM elements.

---

### Requirement 3: Photo Documentation with Spatial Context

**User Story:** As a Foreman, I want to attach site photos to specific locations in the 3D model, so that anyone can see exactly where in the building each photo was taken.

#### Acceptance Criteria

1. WHEN a user creates a photo marker THEN the system SHALL allow uploading photos from camera or file system.

2. WHEN a photo is uploaded THEN the system SHALL display a thumbnail on the marker and store the full-resolution image.

3. WHEN viewing a photo marker THEN the system SHALL display the photo in a lightbox with metadata (date taken, uploaded by, location description).

4. WHEN multiple photos exist at a marker THEN the system SHALL display them in a timeline/gallery view sorted by date.

5. IF the photo contains EXIF GPS data AND the project has geocoordinates THEN the system SHALL suggest the nearest spatial location in the model.

6. WHEN viewing the model THEN the system SHALL provide a "Photo Tour" mode that navigates through all photo markers chronologically.

---

### Requirement 4: File and Document Attachments

**User Story:** As a Project Manager, I want to attach documents (PDFs, drawings, specs) to spatial locations, so that workers can access relevant documentation while standing at that location on-site.

#### Acceptance Criteria

1. WHEN a user creates a document marker THEN the system SHALL accept PDF, DOC/DOCX, XLS/XLSX, DWG, and image files up to 50MB.

2. WHEN a document is attached THEN the system SHALL display a file type icon and filename on the marker.

3. WHEN a user clicks a document marker THEN the system SHALL open a document preview (PDF/image) or download link (other formats).

4. WHEN documents are attached to BIM elements THEN the system SHALL allow categorizing by document type (shop drawing, specification, RFI, submittal).

5. WHEN searching documents THEN the system SHALL return results with spatial context (room, floor, element).

---

### Requirement 5: Notes and Comments System

**User Story:** As a Team Member, I want to leave notes and comments at specific locations in the model, so that I can communicate spatial information to my colleagues.

#### Acceptance Criteria

1. WHEN a user creates a note marker THEN the system SHALL provide a text input field with formatting options (bold, lists, mentions).

2. WHEN a note is created THEN the system SHALL record the author, timestamp, and location context.

3. WHEN a note exists at a location THEN other team members SHALL be able to reply, creating a threaded discussion.

4. WHEN a user is mentioned in a note THEN the system SHALL send a notification with a link to the exact spatial location.

5. WHEN viewing notes THEN the system SHALL support filtering by author, date range, and status (open/resolved).

6. WHEN a note represents an issue THEN the system SHALL allow marking it as "resolved" with a resolution note.

---

### Requirement 6: Timeline and History Tracking

**User Story:** As a Client, I want to see the history of work at each location over time, so that I can understand how construction has progressed.

#### Acceptance Criteria

1. WHEN a location has multiple content items THEN the system SHALL display them in a chronological timeline view.

2. WHEN viewing a location's timeline THEN the system SHALL show all activities (photos, notes, task completions, document uploads) with timestamps.

3. WHEN the project has multiple model versions THEN the system SHALL allow comparing the same location across time.

4. WHEN viewing the timeline THEN the system SHALL filter by date range, content type, or team member.

5. WHEN an element's status changes in the BIM model THEN the system SHALL log this as a timeline event.

---

### Requirement 7: Integration with Existing GenHub Features

**User Story:** As a GC Admin, I want the 3D viewer to integrate with existing GenHub tasks, phases, and team management, so that spatial data enhances rather than duplicates existing workflows.

#### Acceptance Criteria

1. WHEN a task is associated with a spatial location THEN the system SHALL display the task's marker in the 3D view with status color coding.

2. WHEN viewing the 3D model THEN the system SHALL allow filtering markers by project phase.

3. WHEN a team member is assigned to a task with spatial location THEN they SHALL see the location highlighted in their task view.

4. WHEN creating a marker THEN the system SHALL allow linking it to an existing task, phase, or project milestone.

5. WHEN viewing project phases in Metro Journey THEN the system SHALL provide a quick link to view that phase's spatial markers in 3D.

6. WHEN chat messages reference spatial locations THEN the system SHALL generate a clickable link to open the 3D view at that location.

---

### Requirement 8: Access Control and Client Portal

**User Story:** As a Client, I want read-only access to the 3D viewer to monitor progress, so that I can see construction updates without being able to modify documentation.

#### Acceptance Criteria

1. WHEN a client user accesses the 3D viewer THEN the system SHALL provide read-only access by default.

2. WHEN setting up the client portal THEN the system SHALL allow GC Admin to configure which content types are visible to clients.

3. WHEN viewing as a client THEN the system SHALL hide internal notes, issues, and RFIs unless explicitly shared.

4. WHEN a client views the 3D model THEN the system SHALL display a simplified interface focused on progress photos and approved documents.

5. IF client approval is required THEN the system SHALL allow clients to leave approval comments at specific locations.

---

### Requirement 9: Offline Support and Field Usage

**User Story:** As a Field Worker on a job site, I want to access the 3D model and create markers offline, so that I can document work even when there's no internet connection.

#### Acceptance Criteria

1. WHEN a user enables offline mode THEN the system SHALL download the 3D model and recent markers for local storage.

2. WHEN offline THEN the system SHALL allow creating new markers (photos, notes) that queue for sync.

3. WHEN connectivity is restored THEN the system SHALL automatically sync queued markers with conflict resolution for simultaneous edits.

4. WHEN downloading for offline THEN the system SHALL allow selecting specific floors or areas to limit storage usage.

5. WHEN offline markers are synced THEN the system SHALL notify the user of successful uploads.

6. WHEN storage is limited THEN the system SHALL prioritize caching photos in reduced resolution with full resolution on-demand.

---

### Requirement 10: Navigation and Spatial Search

**User Story:** As a User, I want to quickly navigate to specific rooms, floors, or marked locations in the 3D model, so that I don't waste time manually searching.

#### Acceptance Criteria

1. WHEN viewing the 3D model THEN the system SHALL provide a search bar for rooms, floors, and element names.

2. WHEN a search result is selected THEN the system SHALL animate the camera to that location.

3. WHEN viewing a BIM model THEN the system SHALL display a building tree structure for hierarchical navigation (Building > Floor > Room > Element).

4. WHEN in first-person navigation mode THEN the system SHALL allow keyboard (WASD) and touch controls for movement.

5. WHEN viewing a complex model THEN the system SHALL provide section/clipping planes to see inside the building.

6. WHEN navigating THEN the system SHALL display a mini-map showing current position and nearby markers.

---

### Requirement 11: Model Version Control

**User Story:** As a Project Manager, I want to upload updated 3D models as construction progresses, so that the viewer reflects the current state of the building.

#### Acceptance Criteria

1. WHEN a new model version is uploaded THEN the system SHALL store both versions and allow switching between them.

2. WHEN a new version is uploaded THEN the system SHALL attempt to map existing markers to corresponding elements in the new model.

3. IF a marker's element no longer exists in the new model THEN the system SHALL flag the marker as "orphaned" and retain its coordinates.

4. WHEN viewing history THEN the system SHALL indicate which model version each content item was created on.

5. WHEN uploading a new version THEN the system SHALL show a comparison summary of added/modified/removed elements.

---

### Requirement 12: Performance and Mobile Optimization

**User Story:** As a Mobile User on a construction site, I want the 3D viewer to run smoothly on my phone, so that I can use it effectively in the field.

#### Acceptance Criteria

1. WHEN rendering on mobile THEN the system SHALL target 30+ FPS on devices from 2020 or newer.

2. WHEN loading a large model on mobile THEN the system SHALL use progressive loading to show content within 5 seconds.

3. WHEN memory usage exceeds device limits THEN the system SHALL gracefully reduce detail rather than crash.

4. WHEN touching the screen THEN the system SHALL provide responsive gesture controls (pinch zoom, two-finger rotate, swipe pan).

5. WHEN running as a PWA THEN the system SHALL maintain WebGL context across app lifecycle events.

6. IF WebGL 2.0 is not available THEN the system SHALL fall back to WebGL 1.0 with reduced features and display a notice.

---

### Requirement 13: Fallback for Projects Without BIM

**User Story:** As a Small Contractor without BIM files, I want to use the spatial documentation features with floor plans and photos, so that I can still benefit from location-based organization.

#### Acceptance Criteria

1. IF no 3D model is uploaded THEN the system SHALL offer a "2D Floor Plan Mode" using uploaded plan images.

2. WHEN in 2D mode THEN the system SHALL allow placing markers on the floor plan image.

3. WHEN floor plans are uploaded THEN the system SHALL allow stacking multiple floors and switching between them.

4. WHEN the user has 360-degree panoramic photos THEN the system SHALL allow creating a walkthrough experience.

5. IF photogrammetry images are provided THEN the system SHALL offer integration with external processing services to generate 3D models.

---

## Non-Functional Requirements

### NFR-1: Security
- All uploaded files SHALL be scanned for malware before processing.
- BIM files MAY contain proprietary information and SHALL be stored encrypted at rest.
- Access to 3D viewer and markers SHALL respect existing GenHub RLS policies.

### NFR-2: Performance
- Initial model load time SHALL be under 10 seconds for models under 50MB on desktop (4G connection).
- Model rendering SHALL maintain 60 FPS on desktop, 30 FPS on mobile.
- Marker operations (create, edit, delete) SHALL complete within 500ms.

### NFR-3: Scalability
- System SHALL support models with up to 500,000 elements.
- System SHALL support up to 10,000 markers per project.
- System SHALL support up to 100 concurrent viewers per project.

### NFR-4: Compatibility
- Viewer SHALL work in Chrome, Firefox, Safari, and Edge (2023+ versions).
- Viewer SHALL work on iOS 14+ and Android 10+.
- Viewer SHALL work as PWA with service worker caching.

### NFR-5: Accessibility
- Navigation controls SHALL be keyboard accessible.
- Markers SHALL have accessible labels for screen readers.
- Color-coding SHALL be supplemented with icons/patterns for colorblind users.

---

## Technical Considerations

### Recommended Libraries
- **Primary 3D Engine**: [xeokit SDK](https://xeokit.io/) - Purpose-built for BIM/IFC, WebGL-based, supports large models with double precision
- **Alternative**: [Three.js with web-ifc](https://github.com/ThatOpen/web-ifc-viewer) - More flexible, larger community, good React integration
- **IFC Parsing**: [web-ifc](https://github.com/ThatOpen/engine_web-ifc) - WebAssembly-based IFC parser

### File Format Priority
1. IFC (primary - open BIM standard)
2. glTF/GLB (web-optimized 3D)
3. OBJ (legacy support)
4. DWG (with server-side conversion)
5. Revit (.rvt) (via cloud processing service)

### Storage Considerations
- 3D models stored in Vercel Blob or cloud object storage
- Model processing may require serverless functions for large files
- Marker coordinates stored in PostgreSQL with spatial indexing (PostGIS extension if needed)
