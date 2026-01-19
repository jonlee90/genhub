# Master Plan — PR2 Modal Migration to ResponsiveModal

## Overview

Migrate all feature modals to the shared `ResponsiveModal` component for a unified desktop/mobile experience. Behavior remains unchanged; this is a refactor only.

## Architecture

- Standardize modal shells with `ResponsiveModal` and its header/footer slots.
- Remove direct `BaseModal` and `BottomSheetModal` usage in feature components.
- Preserve existing internal modal content and actions; only swap wrappers and props.
- Keep `AlertDialog` usage as-is for destructive confirms (out of scope).

## Components (Dependency Order)

1. **Modal Shell Conformance**
   - Scope: Define the migration approach and shared prop mappings for `ResponsiveModal`.
   - Interfaces: `ResponsiveModalProps` mapping for `isOpen`, `onClose`, `title`, `subtitle`, `leftActions`, `rightActions`, `showFooter`, `formKey`.
   - Dependencies: `ResponsiveModal`, shared `Button`, `Badge`, `cn` helper.
   - Risks: Missing aria labels or footer alignment.

2. **Settings Modals**
   - Scope: Migrate `TaskTypeManager`, `TaskTemplateManager`, `PhaseTemplateManager`, `ModelUploadModal`.
   - Interfaces: Add `ariaLabel`, ensure header actions map to `leftActions`/`rightActions`.
   - Dependencies: `ResponsiveModal`.
   - Risks: Nested forms using `formKey`.

3. **Chat Modals**
   - Scope: Migrate `NewDMModal`, `DeleteConfirmDialog`.
   - Interfaces: Use `showFooter` and action slots.
   - Dependencies: `ResponsiveModal`.
   - Risks: Destructive confirm UX parity.

4. **Expenses Modals**
   - Scope: Migrate `VendorCombobox`, `ExpenseDetailModal`, `CreateExpenseModal`.
   - Interfaces: Respect existing form submit handlers via `formKey`.
   - Dependencies: `ResponsiveModal`.
   - Risks: Footer buttons tied to forms.

5. **Tasks Modals**
   - Scope: Migrate `MaterialDeliveryPrompt`, `BlockedReasonModal`, `TaskDetail`.
   - Interfaces: Preserve subtitle/badges.
   - Dependencies: `ResponsiveModal`.
   - Risks: Large modal content layout.

6. **Team Modals**
   - Scope: Migrate `EditSubcontractorModal`, `AddSubcontractorModal`, `InviteTeamMemberModal`.
   - Interfaces: Ensure close actions wire correctly.
   - Dependencies: `ResponsiveModal`.
   - Risks: Multi-step forms.

7. **Projects Modals**
   - Scope: Migrate `AddSubcontractorModal`, `AddMemberModal`, `CreateProjectForm`, `ManagePhasesModal`.
   - Interfaces: Map header/footer actions.
   - Dependencies: `ResponsiveModal`.
   - Risks: Form submission with nested buttons.

8. **Projects Spatial Modals**
   - Scope: Migrate `MarkerListSheet`, `MarkerFilterSheet`, `TaskLinkerEnhanced`, `ConflictDialog`, `MarkerCreationModal`, `TaskLinker`.
   - Interfaces: Replace `BottomSheetModal` usage with `ResponsiveModal` snap points.
   - Dependencies: `ResponsiveModal`.
   - Risks: Mobile sheet behavior parity.

9. **Projects Files Modals**
   - Scope: Migrate `FileVersionHistory`, `PhotoGallerySection`, `DocumentsSection`, `FilePreviewModal`.
   - Interfaces: Ensure `showFooter` and actions preserved.
   - Dependencies: `ResponsiveModal`.
   - Risks: Gallery navigation alignment.

## Validation

- `npx tsc --noEmit`
- `npm run lint`
- Manual spot-check: open at least one modal per domain on desktop and mobile widths.
- Verify no direct feature imports of `BaseModal` or `BottomSheetModal` remain.

## Rollout / Handoff

- Confirm `ResponsiveModal` is the only modal wrapper in feature components.
- Update PR plan checklist with completed files.
