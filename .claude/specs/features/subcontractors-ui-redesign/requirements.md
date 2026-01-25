# Subcontractors UI Redesign - Requirements

## Overview
Redesign the `/app/team/subcontractors` page to follow the same UI patterns and interaction design as the `/app/tasks` page. This will ensure consistency across the GenHub application and provide a modern, mobile-first experience for managing subcontractors.

## Personas
- **Primary**: GC (General Contractor Admin) - Manages subcontractor directory, adds/edits subcontractors, monitors compliance
- **Secondary**: PM (Project Manager) - Views and edits subcontractor information, coordinates with subs on projects
- **Tertiary**: Foreman - Views subcontractor contact information for on-site coordination

---

## User Stories

### US-1: Consistent Modal Experience
**As a** GC or PM,
**I want** the subcontractor add/edit modal to use ResponsiveModal (same as tasks),
**So that** I get a consistent mobile experience with drawer on mobile and centered modal on desktop.

**Acceptance Criteria (EARS):**
- WHEN user opens add/edit subcontractor modal on mobile (<768px) THE SYSTEM SHALL display a bottom drawer with drag-to-dismiss
- WHEN user opens add/edit subcontractor modal on desktop (≥768px) THE SYSTEM SHALL display a centered modal dialog
- WHEN user drags down on mobile drawer THE SYSTEM SHALL dismiss the modal if drag exceeds threshold
- IF user taps backdrop THE SYSTEM SHALL close the modal
- WHEN modal opens THE SYSTEM SHALL focus the first input field within 100ms

**Priority:** Critical

### US-2: Industrial Header Consistency
**As a** user,
**I want** the subcontractors page header to match the tasks page visual design,
**So that** the application feels cohesive and professional.

**Acceptance Criteria (EARS):**
- WHEN page loads THE SYSTEM SHALL display "SUBCONTRACTORS" title in construction blue, font-black, tracking-tighter
- WHEN page loads THE SYSTEM SHALL render blueprint grid background at 0.03 opacity
- WHEN viewport is mobile (<768px) THE SYSTEM SHALL use text-2xl title size
- WHEN viewport is desktop (≥768px) THE SYSTEM SHALL use text-5xl title size
- WHILE page is visible THE SYSTEM SHALL show 1px construction-blue border at top

**Priority:** High

### US-3: Add Button Placement
**As a** GC or PM,
**I want** the "Add Subcontractor" button positioned consistently with tasks page,
**So that** I can quickly access the creation flow.

**Acceptance Criteria (EARS):**
- WHEN user has admin or PM role THE SYSTEM SHALL display "Add Subcontractor" button in page header
- WHEN user taps/clicks add button THE SYSTEM SHALL open ResponsiveModal with empty form
- WHEN button is rendered THE SYSTEM SHALL use min-h-[44px] for touch accessibility
- IF user role is worker or foreman THEN THE SYSTEM SHALL NOT display add button

**Priority:** High

### US-4: Mobile Touch Targets
**As a** user on mobile device,
**I want** all interactive elements to meet 44px minimum touch target,
**So that** I can reliably tap controls without errors.

**Acceptance Criteria (EARS):**
- WHEN any button is rendered THE SYSTEM SHALL apply min-h-[44px] min-w-[44px] classes
- WHEN star rating is displayed THE SYSTEM SHALL ensure each star has 44px touch area
- WHEN dropdown menu triggers are rendered THE SYSTEM SHALL meet 44px minimum size
- IF touch target is less than 44px THEN THE SYSTEM SHALL add padding to meet requirement

**Priority:** Critical

### US-5: Form Field Organization
**As a** GC or PM,
**I want** subcontractor form fields organized in logical sections,
**So that** I can efficiently enter and validate information.

**Acceptance Criteria (EARS):**
- WHEN modal opens THE SYSTEM SHALL group fields into: Basic Info, Contact, License, Insurance, Performance
- WHEN user fills required fields (company name, contact name, email, trade) THE SYSTEM SHALL enable submit button
- WHEN validation fails THE SYSTEM SHALL display field-specific error messages below each input
- WHILE user types in validated field THE SYSTEM SHALL show live validation feedback within 300ms

**Priority:** High

### US-6: Loading and Success States
**As a** user,
**I want** clear visual feedback during save operations,
**So that** I know when my changes are processing and when they succeed.

**Acceptance Criteria (EARS):**
- WHEN user submits form THE SYSTEM SHALL disable all inputs and show spinner icon on submit button
- WHEN save completes successfully THE SYSTEM SHALL display green success alert for 1000ms
- WHEN save completes successfully THE SYSTEM SHALL show CheckCircle2 icon in submit button
- IF save fails THEN THE SYSTEM SHALL display red error alert with specific message
- WHEN modal closes after success THE SYSTEM SHALL revalidate page data

**Priority:** High

### US-7: Dark Mode Support
**As a** user with dark mode preference,
**I want** all subcontractor UI elements to respect dark mode,
**So that** I have consistent visual comfort across the app.

**Acceptance Criteria (EARS):**
- WHEN system dark mode is enabled THE SYSTEM SHALL apply dark:bg-gray-800 to cards
- WHEN modal is opened in dark mode THE SYSTEM SHALL use dark:bg-gray-900 background
- WHEN text is rendered THE SYSTEM SHALL use dark:text-white or dark:text-gray-300 for readability
- WHILE dark mode is active THE SYSTEM SHALL maintain 4.5:1 minimum contrast ratio

**Priority:** Medium

### US-8: Empty State Design
**As a** user viewing empty subcontractor list,
**I want** a helpful empty state with clear call-to-action,
**So that** I understand how to add my first subcontractor.

**Acceptance Criteria (EARS):**
- WHEN no subcontractors exist THE SYSTEM SHALL display HardHat icon in gray-100 circle
- WHEN empty state is shown THE SYSTEM SHALL display "No subcontractors yet" heading
- WHEN user has permission THE SYSTEM SHALL show "Add Subcontractor" button in empty state
- IF user is searching and no results THEN THE SYSTEM SHALL show "No subcontractors found" with clear filters message

**Priority:** Medium

---

## Out of Scope
- Changing subcontractor data model or database schema
- Modifying Server Actions functionality (create, update, deactivate)
- Adding new features beyond UI consistency
- Bulk operations or batch imports
- Document upload UI redesign (maintain existing behavior)
- Multi-step wizard for subcontractor creation

## Dependencies
- Existing ResponsiveModal component (`components/ui/ResponsiveModal/index.tsx`)
- Existing Server Actions (`app/actions/subcontractors.ts`)
- Existing subcontractor data fetching (`lib/team.ts`)
- PhoneInput component for phone field formatting
- useValidatedForm hook for form validation
- Blueprint background pattern (shared component)

## Non-Functional Requirements
- **Performance**: Modal should open within 200ms on mobile, 100ms on desktop
- **Performance**: Form validation feedback within 300ms of input change
- **Security**: All role-based permissions maintained (admin/PM for create/edit, admin-only for deactivate)
- **Mobile**: Touch targets minimum 44px on all interactive elements
- **Mobile**: Responsive layout breakpoint at 768px (mobile vs desktop)
- **Mobile**: Bottom drawer on mobile with drag-to-dismiss (≥50px drag distance)
- **Accessibility**: Form fields have proper labels and ARIA attributes
- **Accessibility**: Error messages announced to screen readers
- **Accessibility**: Keyboard navigation through all interactive elements

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to design)
