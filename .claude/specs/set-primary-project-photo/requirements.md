# Set Primary Project Photo - Requirements

## Overview

Enable users to designate a photo as the "primary" or "cover" image for a project, which will then be displayed in ProjectCard components throughout the app. This feature enhances project visual identity and provides at-a-glance recognition in project listings.

## Personas

- **Primary**: PM (Project Manager) - Wants to set a representative photo that captures the project's current state or identity
- **Secondary**: GC (General Contractor) - Wants to see professional project thumbnails across all projects for quick identification
- **Secondary**: Foreman - May want to update the cover photo as project progresses through phases

---

## User Stories

### US-1: Set Photo as Primary from Gallery

**As a** PM,
**I want** to select a photo from the Files & Photos gallery and set it as the project's primary image,
**So that** the project card displays a meaningful visual that represents the project.

**Acceptance Criteria (EARS):**

- WHEN user views a photo in the PhotoLightbox THE SYSTEM SHALL display a "Set as Cover" button if the photo is from a direct upload (source === 'upload')
- WHEN user clicks "Set as Cover" button THE SYSTEM SHALL update the project's image_url to the selected photo URL within 500ms
- WHEN photo is set as primary THE SYSTEM SHALL display a visual indicator (badge/star) on that photo in the gallery
- IF photo is already the primary photo THEN THE SYSTEM SHALL display the button as disabled or show "Current Cover"
- WHEN primary photo is successfully set THE SYSTEM SHALL display a success toast notification
- IF update fails THEN THE SYSTEM SHALL display an error toast with the failure reason

**Priority:** Critical

---

### US-2: Set Photo as Primary from Photo Grid

**As a** PM,
**I want** to set a photo as primary directly from the gallery grid without opening the lightbox,
**So that** I can quickly update the cover photo with fewer clicks.

**Acceptance Criteria (EARS):**

- WHEN user hovers over a photo in PhotoGallerySection THE SYSTEM SHALL display a "star" action button alongside existing actions (view, delete)
- WHEN user clicks the star button THE SYSTEM SHALL set that photo as the project's primary image
- IF the photo is already primary THEN THE SYSTEM SHALL display a filled star icon
- WHEN action completes THE SYSTEM SHALL show success toast and refresh the gallery to update badges

**Priority:** High

---

### US-3: Visual Indication of Current Primary Photo

**As a** PM,
**I want** to clearly see which photo is currently set as the project cover,
**So that** I know the current state and can decide whether to change it.

**Acceptance Criteria (EARS):**

- WHEN a photo in the gallery is the current primary photo THE SYSTEM SHALL display a "Cover Photo" badge on the thumbnail
- WHILE viewing the PhotoLightbox for the primary photo THE SYSTEM SHALL display "Current Cover Photo" status indicator
- WHEN the primary photo is deleted THE SYSTEM SHALL clear the project's image_url

**Priority:** High

---

### US-4: Remove Primary Photo

**As a** PM,
**I want** to remove the current primary photo designation,
**So that** the project card returns to showing the default placeholder.

**Acceptance Criteria (EARS):**

- WHEN viewing the current primary photo in the lightbox THE SYSTEM SHALL display a "Remove as Cover" option
- WHEN user clicks "Remove as Cover" THE SYSTEM SHALL clear the project's image_url to null
- WHEN primary photo is removed THE SYSTEM SHALL display the default placeholder gradient in ProjectCard

**Priority:** Medium

---

### US-5: Receipt Photos Cannot Be Set as Primary

**As a** PM,
**I want** receipt photos to be excluded from the "Set as Cover" feature,
**So that** project cards display appropriate professional images rather than receipts.

**Acceptance Criteria (EARS):**

- IF photo source is 'task_receipt' or 'expense_receipt' THEN THE SYSTEM SHALL NOT display the "Set as Cover" option
- WHILE hovering over receipt photos THE SYSTEM SHALL NOT show the star action button

**Priority:** Medium

---

## Out of Scope

- Automatic primary photo selection based on AI/ML analysis
- Multiple cover photos or photo carousels in ProjectCard
- Photo cropping or editing before setting as primary
- Separate "cover photo" upload flow (must use existing gallery)
- Client portal visibility controls for cover photos

## Dependencies

- Existing `projects` table with `image_url` column (confirmed present)
- Existing `project_photos` table and gallery implementation
- Existing `PhotoGallerySection` and `PhotoLightbox` components
- Existing `updateProject` Server Action (needs extension)

## Non-Functional Requirements

- **Performance**: Setting primary photo should complete within 500ms
- **Security**: Only project team members with edit permissions can set primary photo
- **Mobile**: Touch targets for star button must be 44px minimum
- **Offline**: Feature requires online connection; graceful error handling if offline

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to design)

---

**Next Step:** Do you approve these requirements to proceed to the design phase?
