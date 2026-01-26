# Phase Template Icons & Template Seeding - Requirements

## Overview
Enhance phase templates with visual icons and implement comprehensive template seeding to provide new companies with pre-configured phase and task templates from a reference company. This improves UX by making phase identification easier and eliminates manual setup for new companies.

## Personas
- **Primary**: Admin - Configure phase templates with icons for their project types
- **Secondary**: PM - Visual phase identification in project views
- **Secondary**: GC - Quick visual scanning of project phases and progress

---

## User Stories

### US-1: Icon Selection for Phase Templates
**As an** Admin,
**I want** to assign visual icons to phase templates in settings,
**So that** phases are easier to identify and the UI is more visually engaging.

**Acceptance Criteria (EARS):**
- WHEN admin creates a new phase template THE SYSTEM SHALL display an icon dropdown with construction/PM-themed Lucide icons
- WHEN admin edits an existing phase template THE SYSTEM SHALL show the current icon and allow selection of a different icon
- IF admin does not select an icon THEN THE SYSTEM SHALL use a default icon (Sparkles)
- WHEN admin saves a phase template with an icon THE SYSTEM SHALL persist the icon name to the database
- WHEN phase template is displayed THE SYSTEM SHALL render the selected Lucide icon component

**Priority:** High

### US-2: Icon Display in PhaseStation
**As a** PM,
**I want** to see phase icons in the project timeline view,
**So that** I can quickly identify phases visually without reading names.

**Acceptance Criteria (EARS):**
- WHEN PhaseStation component renders a phase THE SYSTEM SHALL display the icon from the phase template (if available)
- IF phase has no template icon THEN THE SYSTEM SHALL fall back to the current name-based icon logic
- WHEN hovering over a phase station THE SYSTEM SHALL show the icon consistently in tooltips
- WHILE phase is current/completed THE SYSTEM SHALL maintain icon visibility with appropriate styling

**Priority:** High

### US-3: Default Template Seeding on Company Creation
**As a** new Admin (company owner),
**I want** my company to automatically receive default phase and task templates,
**So that** I can start creating projects immediately without manual template setup.

**Acceptance Criteria (EARS):**
- WHEN a new company is created THE SYSTEM SHALL copy phase templates from reference company (7633050c-f24e-4f8d-8396-22198b852bf6) for the "Cafe" project type
- WHEN phase templates are copied THE SYSTEM SHALL also copy all associated task templates with correct relationships
- WHEN templates are seeded THE SYSTEM SHALL preserve icon names, descriptions, order, and all template properties
- IF reference company templates are unavailable THEN THE SYSTEM SHALL log a warning but complete company creation successfully
- WHEN templates are copied THE SYSTEM SHALL set the new company_id while maintaining all other attributes

**Priority:** Critical

### US-4: Fill Missing Templates for Existing Companies
**As an** existing company Admin,
**I want** missing templates to be backfilled from the reference company,
**So that** I have access to all standard phase and task templates.

**Acceptance Criteria (EARS):**
- WHEN migration runs THE SYSTEM SHALL identify companies without "Cafe" project type templates
- WHEN missing templates are detected THE SYSTEM SHALL copy phase and task templates from reference company
- WHEN backfilling templates THE SYSTEM SHALL not duplicate existing templates (check by name + project_type)
- WHEN backfill completes THE SYSTEM SHALL log the number of companies updated and templates created

**Priority:** High

---

## Out of Scope
- Custom icon uploads (Lucide library only)
- Icon color customization (uses existing phase status colors)
- Editing seeded templates after creation (admins can edit via settings UI)
- Template versioning or updates to existing templates
- Seeding templates for project types other than "Cafe"

## Dependencies
- Existing `phase_templates` table
- Existing `task_templates` table
- PhaseStation.tsx component
- PhaseTemplateManager.tsx component
- Company creation trigger (20260119000001_seed_default_configs_on_company_create.sql)
- Reference company ID: 7633050c-f24e-4f8d-8396-22198b852bf6 must have complete templates

## Non-Functional Requirements
- **Performance**: Icon dropdown should render <100ms with ~20-30 icon options
- **Mobile**: Icon selector must have 44px+ touch targets on mobile
- **Consistency**: Use only Lucide icons (no Heroicons, FontAwesome, etc.)
- **Data Integrity**: Template seeding must be transactional (all or nothing)
- **Offline**: Icon selection works offline (no external API calls)

---

## Construction-Themed Icon Candidates (Lucide)

**Recommended icons for construction project phases:**
- `Rocket` - Project Initiation, Planning
- `FileText` - Design, Pre-Construction, Documentation
- `ShoppingCart` - Procurement, Materials Ordering
- `FolderKanban` - Execution, Construction Phase
- `CheckCircle2` - Closeout, Completion, Post-Construction
- `Hammer` - Construction Work, Framing, Rough-In
- `Wrench` - MEP (Mechanical/Electrical/Plumbing)
- `PaintBucket` - Finishing, Painting
- `Ruler` - Layout, Surveying
- `HardHat` - Site Work, Foundations
- `Truck` - Delivery, Logistics
- `ClipboardCheck` - Inspections, Punch List
- `Key` - Handover, Occupancy
- `Building` - Superstructure, Core & Shell
- `Layers` - Multi-phase, General Project Phases
- `Sparkles` - Default/Fallback icon

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to design)
