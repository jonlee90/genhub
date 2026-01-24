# Form Validation & Input Masking - Requirements

## Overview
Implement comprehensive form validation and input masking across all GenHub forms to improve data quality, user experience, and prevent submission errors. This feature ensures all forms validate inputs in real-time and disable submit buttons until valid, with appropriate input masks for specific field types.

## Personas
- **Primary**: All Users (GC, PM, Foreman, Worker, Sub) - Input data accurately with clear feedback
- **Secondary**: Admin - Ensure data quality across the platform

---

## User Stories

### US-1: Real-Time Field Validation
**As a** GenHub user,
**I want** immediate feedback when I enter invalid data in form fields,
**So that** I can correct errors before attempting to submit the form.

**Acceptance Criteria (EARS):**
- WHEN user types in an email field THE SYSTEM SHALL validate email format on blur and display error message if invalid
- WHEN user types in a phone field THE SYSTEM SHALL validate 10-digit US phone format on blur
- WHEN user types in a required field THE SYSTEM SHALL display error if field is empty on blur
- WHEN user types in a numeric field THE SYSTEM SHALL validate number format and constraints (min/max)
- WHEN validation error occurs THE SYSTEM SHALL display red border and error message below field within 100ms
- WHEN user corrects invalid field THE SYSTEM SHALL remove error state immediately

**Priority:** Critical

### US-2: Submit Button Disabled State
**As a** GenHub user,
**I want** submit/continue buttons to remain disabled until all required fields are valid,
**So that** I don't waste time submitting invalid forms.

**Acceptance Criteria (EARS):**
- WHEN form has validation errors THE SYSTEM SHALL keep submit button disabled with 50% opacity
- WHEN all required fields are valid THE SYSTEM SHALL enable submit button
- WHEN form is submitting THE SYSTEM SHALL disable submit button and show loading spinner
- IF user hovers over disabled button THEN THE SYSTEM SHALL show tooltip indicating validation status
- WHILE form is validating THE SYSTEM SHALL maintain current button state

**Priority:** Critical

### US-3: Currency Input Masking
**As a** user entering budget or cost data,
**I want** currency fields to automatically format as I type,
**So that** I can easily read and verify dollar amounts.

**Acceptance Criteria (EARS):**
- WHEN user types in currency field THE SYSTEM SHALL format as $X,XXX.XX
- WHEN user enters decimal values THE SYSTEM SHALL limit to 2 decimal places
- WHEN user pastes unformatted number THE SYSTEM SHALL apply currency mask
- WHEN user deletes characters THE SYSTEM SHALL maintain proper formatting
- WHILE user types THE SYSTEM SHALL show currency symbol ($) as prefix

**Priority:** High

### US-4: Phone Number Masking
**As a** user entering phone numbers,
**I want** phone fields to automatically format as (XXX) XXX-XXXX,
**So that** I can easily read and verify phone numbers.

**Acceptance Criteria (EARS):**
- WHEN user types digits THE SYSTEM SHALL format as (XXX) XXX-XXXX
- WHEN user enters non-numeric characters THE SYSTEM SHALL ignore them
- WHEN user types more than 10 digits THE SYSTEM SHALL truncate to 10
- WHEN user deletes characters THE SYSTEM SHALL maintain proper mask structure
- IF phone number is incomplete THEN THE SYSTEM SHALL show validation error on blur

**Priority:** High

### US-5: Email Validation
**As a** user entering email addresses,
**I want** email fields to validate format,
**So that** I ensure valid contact information.

**Acceptance Criteria (EARS):**
- WHEN user enters email THE SYSTEM SHALL validate format using RFC 5322 pattern
- WHEN email is invalid THE SYSTEM SHALL display "Please enter a valid email address"
- WHEN email is valid THE SYSTEM SHALL remove error state
- WHILE user is typing THE SYSTEM SHALL NOT show validation errors (wait for blur)

**Priority:** High

### US-6: Date Validation
**As a** user entering project timelines,
**I want** date fields to validate logical constraints,
**So that** I don't enter impossible date ranges.

**Acceptance Criteria (EARS):**
- WHEN user enters end date before start date THE SYSTEM SHALL display "End date must be after start date"
- WHEN user enters past date for future event THE SYSTEM SHALL warn if appropriate
- WHEN date fields are related THE SYSTEM SHALL cross-validate on both field changes
- IF start date changes THEN THE SYSTEM SHALL revalidate end date

**Priority:** High

### US-7: Numeric Input Validation
**As a** user entering quantities or measurements,
**I want** numeric fields to validate ranges and format,
**So that** I enter realistic values.

**Acceptance Criteria (EARS):**
- WHEN user enters negative value in positive-only field THE SYSTEM SHALL show error "Value must be positive"
- WHEN user enters value outside min/max range THE SYSTEM SHALL show range constraint error
- WHEN user enters non-numeric characters THE SYSTEM SHALL prevent input or show error
- WHEN user enters decimal in integer field THE SYSTEM SHALL round or reject based on context

**Priority:** High

### US-8: ZIP Code Validation
**As a** user entering location data,
**I want** ZIP code fields to validate US postal codes,
**So that** I ensure accurate project locations.

**Acceptance Criteria (EARS):**
- WHEN user enters ZIP code THE SYSTEM SHALL accept 5-digit or 9-digit (XXXXX-XXXX) format
- WHEN ZIP is invalid format THE SYSTEM SHALL display "Please enter a valid ZIP code"
- WHEN user types 6th digit THE SYSTEM SHALL insert hyphen for extended ZIP

**Priority:** Medium

### US-9: Multi-Step Form Validation
**As a** user completing multi-step forms (e.g., Create Project),
**I want** validation on each step before proceeding,
**So that** I fix errors early in the process.

**Acceptance Criteria (EARS):**
- WHEN user clicks "Continue" on step THE SYSTEM SHALL validate current step fields
- IF current step has errors THEN THE SYSTEM SHALL prevent navigation and show errors
- WHEN all step fields are valid THE SYSTEM SHALL allow navigation to next step
- WHEN user returns to previous step THE SYSTEM SHALL preserve entered values

**Priority:** High

### US-10: Reusable Validation Patterns
**As a** developer,
**I want** reusable validation schemas and hooks,
**So that** I can apply consistent validation across all forms.

**Acceptance Criteria (EARS):**
- WHEN form component mounts THE SYSTEM SHALL use Zod schema for field validation
- WHEN validation rules change THE SYSTEM SHALL update single schema definition
- WHEN new form is created THE SYSTEM SHALL reuse existing validation patterns
- WHILE validation runs THE SYSTEM SHALL provide type-safe error messages

**Priority:** High

---

## Out of Scope
- Server-side validation (already exists in Server Actions)
- Custom regex patterns for non-standard formats
- Internationalization of phone/date formats (US-only for now)
- File upload validation (separate feature)
- Autocomplete/autofill suggestions

## Dependencies
- Existing form components (MobileInput, Input, ResponsiveModal)
- Server Actions (validation schemas may be shared)
- Existing phone mask utilities (lib/hooks/usePhoneMask.ts)

## Non-Functional Requirements
- **Performance**: Validation must complete within 50ms to feel instant
- **Accessibility**: Error messages must have proper ARIA attributes
- **Mobile**: Virtual keyboards must show appropriate types (numeric, email, tel)
- **Bundle Size**: Validation library must be tree-shakeable (<20kb gzipped)

---

## Current State Analysis

### Existing Forms
**Project Forms:**
- CreateProjectForm.tsx - Has validation, uses custom logic
- ManagePhasesModal.tsx - Minimal validation
- AddMemberModal.tsx - Minimal validation
- AddSubcontractorModal.tsx - Basic validation
- ProjectSettings.tsx - Needs validation

**Task Forms:**
- TaskModal.tsx - Uses custom state management, minimal validation
- CreateTaskForm.tsx - Needs comprehensive validation

**Expense Forms:**
- CreateExpenseModal.tsx - Basic validation, needs masking
- ExpenseDetailModal.tsx - Needs validation

**Material Forms:**
- AssignMaterialModal.tsx - Basic validation

**Team Forms:**
- InviteTeamMemberModal.tsx - Uses Server Action validation only
- EditSubcontractorModal.tsx - Needs client validation
- AddSubcontractorModal.tsx - Has phone masking, needs more

**Auth Forms:**
- EmailSignInForm.tsx - Has custom email validation
- AdminSignupForm.tsx - Needs validation

### Existing Validation Patterns
**Good Examples:**
- CreateProjectForm: Step-based validation, touchedFields tracking, validateField callback
- Phone masking: formatPhoneNumber, extractPhoneDigits utilities

**Gaps:**
- No unified validation library (Zod already installed)
- Inconsistent error display patterns
- No currency masking
- Submit buttons don't consistently check validation state
- No form-level validation state management

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to design)
