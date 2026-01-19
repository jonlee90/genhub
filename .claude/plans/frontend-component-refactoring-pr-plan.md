# PR-Ready Refactor Plan (Frontend Components)

This plan converts the audit findings into a sequence of small, reviewable PRs. Each PR is scoped to avoid behavior changes and align with Vercel React/Next.js best practices.

## Goals

- Reduce duplicate UI blocks and helper logic.
- **Standardize ALL modals to use `ResponsiveModal`** (unified desktop/mobile experience).
- Standardize card and widget surfaces.
- Improve bundle and runtime performance using Vercel guidance.
- Keep behavior identical; focus on refactor only.

---

## PR 1 — Shared UI Primitives

**Scope**: Introduce shared primitives used across multiple domains.

**Changes**

- Add `components/ui/CardSurface.tsx` (or reuse existing `Card`) with standardized padding/border/rounded/shadow variants.
- Add `components/ui/WidgetCard.tsx` + `WidgetHeader.tsx` + `WidgetSkeleton.tsx` for dashboard widgets.
- Add `components/ui/FormField.tsx` with label/hint/error and consistent spacing.
- Add `components/ui/FileUploadPanel.tsx` for dropzone + progress + validation messaging.
- Add `components/ui/TopAccentBar.tsx` for repeated gradient accents (header + modals).

**Targets**

- Card shells: `components/tasks/TaskCard.tsx`, `components/materials/MaterialCard.tsx`, `components/expenses/ExpenseCard.tsx`, `components/team/TeamMemberCard.tsx`, `components/dashboard/KPICard.tsx`.
- Widget shells: all dashboard widgets (`components/dashboard/*Widget.tsx`).
- Form layouts: `components/expenses/CreateExpenseModal.tsx`, `components/tasks/TaskModal.tsx`, `components/settings/ModelUploadModal.tsx`.

**Vercel best practices**

- `rendering-hoist-jsx` for static header/footer JSX.
- `rerender-memo` for card primitives.

---

## PR 2 — Modal Migration to ResponsiveModal (PRIORITY)

**Scope**: Migrate ALL modals to use `ResponsiveModal` for unified desktop/mobile experience. This is the **canonical modal component** going forward.

### ResponsiveModal API Reference

```tsx
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

<ResponsiveModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={ClipboardList}
  title="Modal Title"
  subtitle="Optional subtitle"
  badges={<Badge>Status</Badge>}
  leftActions={<Button variant="ghost">Cancel</Button>}
  rightActions={<Button>Save</Button>}
  showFooter
  theme="default"
  maxWidth="xl"
  snapPoints={["half", "full"]}
  initialSnapPoint="half"
  enableDragToDismiss
  closeOnBackdropClick
  closeOnEscape
  formKey="optional-form-id"
  className="optional"
  contentClassName="optional"
  headerClassName="optional"
  footerClassName="optional"
  ariaLabel="Modal title"
  ariaDescribedBy="modal-description"
>
  <div>Modal content</div>
</ResponsiveModal>;
```

### Migration Targets (29 files, verified via modal imports)

**Settings Domain (4 files)**

- [ ] `components/settings/TaskTypeManager.tsx`
- [ ] `components/settings/TaskTemplateManager.tsx`
- [ ] `components/settings/PhaseTemplateManager.tsx`
- [ ] `components/settings/ModelUploadModal.tsx`

**Chat Domain (2 files)**

- [ ] `components/chat/NewDMModal.tsx`
- [ ] `components/chat/DeleteConfirmDialog.tsx`

**Expenses Domain (3 files)**

- [ ] `components/expenses/VendorCombobox.tsx`
- [ ] `components/expenses/ExpenseDetailModal.tsx`
- [ ] `components/expenses/CreateExpenseModal.tsx`

**Tasks Domain (3 files)**

- [ ] `components/tasks/MaterialDeliveryPrompt.tsx`
- [ ] `components/tasks/BlockedReasonModal.tsx`
- [ ] `components/tasks/TaskDetail.tsx`

**Team Domain (3 files)**

- [ ] `components/team/EditSubcontractorModal.tsx`
- [ ] `components/team/AddSubcontractorModal.tsx`
- [ ] `components/team/InviteTeamMemberModal.tsx`

**Projects Domain (4 files)**

- [ ] `components/projects/AddSubcontractorModal.tsx`
- [ ] `components/projects/AddMemberModal.tsx`
- [ ] `components/projects/CreateProjectForm.tsx`
- [ ] `components/projects/ManagePhasesModal.tsx`

**Projects Spatial (6 files)**

- [ ] `components/projects/spatial/MarkerListSheet.tsx`
- [ ] `components/projects/spatial/MarkerFilterSheet.tsx`
- [ ] `components/projects/spatial/TaskLinkerEnhanced.tsx`
- [ ] `components/projects/spatial/ConflictDialog.tsx`
- [ ] `components/projects/spatial/MarkerCreationModal.tsx`
- [ ] `components/projects/spatial/TaskLinker.tsx`

**Projects Files (4 files)**

- [ ] `components/projects/files/FileVersionHistory.tsx`
- [ ] `components/projects/files/PhotoGallerySection.tsx`
- [ ] `components/projects/files/DocumentsSection.tsx`
- [ ] `components/projects/files/FilePreviewModal.tsx`

### Already Using ResponsiveModal ✓

- `components/tasks/TaskModal.tsx`

### Verified Modal Import Appendix

**BaseModal imports (30 files)**

- `components/chat/DeleteConfirmDialog.tsx`
- `components/chat/NewDMModal.tsx`
- `components/expenses/CreateExpenseModal.tsx`
- `components/expenses/ExpenseDetailModal.tsx`
- `components/expenses/VendorCombobox.tsx`
- `components/projects/AddMemberModal.tsx`
- `components/projects/AddSubcontractorModal.tsx`
- `components/projects/CreateProjectForm.tsx`
- `components/projects/ManagePhasesModal.tsx`
- `components/projects/files/DocumentsSection.tsx`
- `components/projects/files/FilePreviewModal.tsx`
- `components/projects/files/FileVersionHistory.tsx`
- `components/projects/files/PhotoGallerySection.tsx`
- `components/projects/spatial/ConflictDialog.tsx`
- `components/projects/spatial/MarkerCreationModal.tsx`
- `components/projects/spatial/TaskLinker.tsx`
- `components/projects/spatial/TaskLinkerEnhanced.tsx`
- `components/projects/spatial/MarkerFilterSheet.tsx`
- `components/projects/spatial/MarkerListSheet.tsx`
- `components/settings/ModelUploadModal.tsx`
- `components/settings/PhaseTemplateManager.tsx`
- `components/settings/TaskTemplateManager.tsx`
- `components/settings/TaskTypeManager.tsx`
- `components/tasks/BlockedReasonModal.tsx`
- `components/tasks/MaterialDeliveryPrompt.tsx`
- `components/tasks/TaskDetail.tsx`
- `components/team/AddSubcontractorModal.tsx`
- `components/team/EditSubcontractorModal.tsx`
- `components/team/InviteTeamMemberModal.tsx`

**BottomSheetModal direct imports (2 files)**

- `components/projects/spatial/MarkerFilterSheet.tsx`
- `components/projects/spatial/MarkerListSheet.tsx`

**ResponsiveModal direct imports (1 file)**

- `components/tasks/TaskModal.tsx`

**AlertDialog usage (8 files, out of scope)**

- `components/projects/ProjectSettings.tsx`
- `components/settings/TaskTypeManager.tsx`
- `components/settings/TaskTemplateManager.tsx`
- `components/settings/PhaseTemplateManager.tsx`
- `components/settings/ProjectTypeManager.tsx`
- `components/team/TeamMemberTable.tsx`
- `components/tasks/TaskMaterialsList.tsx`
- `components/team/SubcontractorCard.tsx`

**Dependency trace notes**

- `components/settings/ModelUploadModal.tsx` uses `BaseModal` and is imported by `components/settings/DefaultModelCard.tsx`.

### Migration Steps Per File

1. Replace import: `BaseModal` or `BottomSheetModal` → `ResponsiveModal`
2. Update props to match `ResponsiveModalProps` interface
3. Remove any manual mobile detection logic (ResponsiveModal handles this)
4. Test on both desktop and mobile viewports
5. Verify theme consistency

### AlertDialog Usage (Out of Scope)

AlertDialog is used for destructive confirmations and should remain unless we explicitly decide to replace it with `ResponsiveModal`.

- `components/projects/ProjectSettings.tsx`
- `components/settings/TaskTypeManager.tsx`
- `components/settings/TaskTemplateManager.tsx`
- `components/settings/PhaseTemplateManager.tsx`
- `components/settings/ProjectTypeManager.tsx`
- `components/team/TeamMemberTable.tsx`
- `components/tasks/TaskMaterialsList.tsx`
- `components/team/SubcontractorCard.tsx`

**Vercel best practices**

- `server-serialization` when passing large modal props (trim to needed fields).

---

## PR 3 — Dashboard Widget Consolidation

**Scope**: Replace repeated widget wrappers with the shared widget primitives.

**Changes**

- Replace duplicated wrapper classes in all widget components with `WidgetCard`/`WidgetHeader`.
- Normalize skeleton components to use `WidgetSkeleton`.

**Targets**

- `components/dashboard/ProjectStatusWidget.tsx`
- `components/dashboard/TaskProgressWidget.tsx`
- `components/dashboard/BudgetSummaryWidget.tsx`
- `components/dashboard/ScheduleHealthWidget.tsx`
- `components/dashboard/TeamActivityWidget.tsx`
- `components/dashboard/MaterialsStatusWidget.tsx`

---

## PR 4 — Chat Metadata Batching

**Scope**: Remove N+1 fetches per message.

**Changes**

- Introduce a batched hook to fetch reactions, reply counts, and attachments for visible messages.
- Cache results with SWR or an in-memory map.

**Targets**

- `components/chat/MessageList.tsx`
- `components/chat/MessageItem.tsx`

**Vercel best practices**

- `client-swr-dedup`
- `async-parallel`

---

## PR 5 — Utility Migration & Hook Extraction

**Scope**: Consolidate remaining duplicate helpers and extract shared hooks.

### Already Centralized in `lib/utils.ts` ✓

- `formatDate()`, `formatDistanceToNow()`, `formatShortDistance()`
- `formatCurrency()`, `formatBudget()`, `formatBudgetFull()`
- `formatPercent()`, `formatPercentWhole()`
- `getBudgetVarianceDisplay()`, `getScheduleStatusDisplay()`

### Still Need Migration

**`getInitials` helper** - duplicated in 21 files:

- Add to `lib/utils.ts`
- Update callers:
  - `components/chat/MessageItem.tsx`
  - `components/chat/SearchMessages.tsx`
  - `components/chat/ChatMemberList.tsx`
  - `components/chat/ChatRoomItem.tsx`
  - `components/chat/previews/UserPreview.tsx`
  - `components/chat/previews/TaskPreview.tsx`
  - `components/projects/AddSubcontractorModal.tsx`
  - `components/projects/AddMemberModal.tsx`
  - `components/projects/ProjectTeam.tsx`
  - `components/projects/TeamCostRow.tsx`
  - `components/tasks/MobileTaskCard.tsx`
  - `components/tasks/TaskCard.tsx`
  - `components/tasks/TaskList.tsx`
  - `components/tasks/AssigneeMultiSelect.tsx`
  - `components/tasks/TaskModal.tsx`
  - `components/tasks/TaskDetail.tsx`
  - `components/tasks/PrimaryAssigneeSelector.tsx`
  - `components/team/TeamMemberCard.tsx`
  - `components/team/TeamMemberTable.tsx`
  - `components/dashboard/TeamActivityWidget.tsx`
  - `components/app/MoreMenu.tsx`

**`stockStatusConfig` helper** - duplicated in materials:

- Add to `lib/utils.ts` or `lib/materials.ts`
- Update callers:
  - `components/materials/MaterialCard.tsx`
  - `components/materials/ProductCard.tsx`

### New Hook: `useHapticFeedback`

Extract haptic logic from 7 files to `lib/hooks/useHapticFeedback.ts`:

```typescript
// lib/hooks/useHapticFeedback.ts
export function useHapticFeedback() {
  const trigger = useCallback((pattern?: "light" | "medium" | "heavy") => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const duration =
        pattern === "heavy" ? 50 : pattern === "medium" ? 25 : 10;
      navigator.vibrate(duration);
    }
  }, []);
  return { trigger };
}
```

**Migration targets:**

- `components/mobile/FilterButton.tsx`
- `components/mobile/FloatingActionButton.tsx`
- `components/mobile/TouchButton.tsx`
- `components/mobile/SwipeableCard.tsx`
- `components/mobile/SegmentedControl.tsx`
- `components/mobile/MobileStatusTabs.tsx`
- `components/ui/FilterTabs.tsx`

---

## PR 6 — Project Upload + Preview Unification + Dynamic Imports

**Scope**: Merge duplicate preview/progress UI, use `next/image`, and add dynamic imports for heavy components.

**Changes**

- Extract shared preview block into `FileUploadPanel`.
- Replace `<img>` with `next/image` for preview blocks.
- Add `next/dynamic` for heavy spatial components.

**Targets**

- `components/projects/spatial/PhotoUploader.tsx`
- `components/projects/files/ProjectPhotoUploader.tsx`
- `components/projects/spatial/ClientSpatialViewer.tsx` (dynamic import)

**Vercel best practices**

- `bundle-dynamic-imports` for heavy uploader dependencies.
- `image-optimization` for preview thumbnails.

---

## PR 7 — Cleanup & Deletions (Verify Usage First)

**Scope**: Remove unused modals, examples, duplicates, and dead code.

### Unused Modals/Components (DELETE)

These components have NO actual imports in the codebase (only referenced in docs/specs):

| File                                                 | Lines  | Reason                                      |
| ---------------------------------------------------- | ------ | ------------------------------------------- |
| `components/projects/spatial/ConflictDialog.tsx`     | ~100   | No imports found - only in docs             |
| `components/projects/spatial/TaskLinkerEnhanced.tsx` | ~200   | No imports found - superseded by TaskLinker |
| `components/mobile/BottomSheetModal/example.tsx`     | ~50    | Example file, not used                      |
| `components/ui/BaseModal/BaseModal.example.tsx`      | 10.9KB | Example file, not used                      |
| `components/ui/StateSelect.example.tsx`              | 5.2KB  | Example file, not used                      |

### Duplicate Modals (CONSOLIDATE)

**AddSubcontractorModal** exists in TWO locations with DIFFERENT purposes:

| File                                            | Lines | Purpose                               | Used By                 |
| ----------------------------------------------- | ----- | ------------------------------------- | ----------------------- |
| `components/projects/AddSubcontractorModal.tsx` | 424   | Add EXISTING subcontractor to project | `ProjectTeam.tsx`       |
| `components/team/AddSubcontractorModal.tsx`     | 609   | CREATE new subcontractor              | `SubcontractorList.tsx` |

**Action**:

1. Rename `projects/AddSubcontractorModal.tsx` → `projects/AssignSubcontractorModal.tsx` for clarity
2. OR merge into single modal with mode prop (`mode: 'create' | 'assign'`)
3. Update all imports

### Dead Code Cleanup

| File                                       | Issue                  | Action                        |
| ------------------------------------------ | ---------------------- | ----------------------------- |
| `components/mobile/index.ts`               | Barrel export          | **KEEP** - verify usage first |
| `components/projects/ProjectCard.tsx`      | Unused skeleton export | Remove dead export            |
| `components/projects/PhaseDetailPanel.tsx` | Commented block        | Remove commented code         |

### Verification Commands

```bash
# Before deleting any file, verify no imports
rg "from.*ConflictDialog" --type-add 'tsx:*.tsx' -t tsx -g '!*.md' -g '!docs/*'
rg "from.*TaskLinkerEnhanced" --type-add 'tsx:*.tsx' -t tsx -g '!*.md' -g '!docs/*'
rg "from.*BottomSheetModal/example" --type ts --type tsx
rg "from.*BaseModal.example" --type ts --type tsx
rg "from.*StateSelect.example" --type ts --type tsx

# Verify mobile/index.ts usage
rg "from ['\"']@/components/mobile['\"]" --type ts --type tsx

# Check for duplicate modal imports
rg "AddSubcontractorModal" --type-add 'tsx:*.tsx' -t tsx -l
```

### Post-Migration Cleanup (After PR 2)

After migrating all modals to `ResponsiveModal`, these internal components become candidates for deprecation:

| Component                              | Status          | Action                             |
| -------------------------------------- | --------------- | ---------------------------------- |
| `components/ui/BaseModal/*`            | Internal only   | Keep as ResponsiveModal dependency |
| `components/mobile/BottomSheetModal/*` | Internal only   | Keep as ResponsiveModal dependency |
| `components/ui/dialog.tsx`             | Radix primitive | Keep for AlertDialog only          |

**Note**: `BaseModal` and `BottomSheetModal` should NOT be deleted as they are used internally by `ResponsiveModal`. However, add lint rule or comment to prevent direct imports in feature components.

---

## PR 8 — Large Component Decomposition (NEW)

**Scope**: Split monolithic components for maintainability.

**Targets**

| Component               | Lines | Decomposition Strategy                              |
| ----------------------- | ----- | --------------------------------------------------- |
| `TaskModal.tsx`         | 1,372 | Extract tab panels to separate files                |
| `TaskDetail.tsx`        | 1,271 | Share structure with TaskModal, extract sections    |
| `CreateProjectForm.tsx` | 954   | Extract form sections as sub-components             |
| `SpatialViewer.tsx`     | ~800  | Extract sub-viewers (floor plan, markers, controls) |

**Suggested Structure for TaskModal:**

```
components/tasks/
├── TaskModal.tsx              # Main orchestrator
├── task-modal/
│   ├── DetailsTab.tsx
│   ├── MaterialsTab.tsx
│   ├── ExpensesTab.tsx
│   ├── ActivityTab.tsx
│   ├── AttachmentsTab.tsx
│   └── index.ts
```

---

## PR 9 — Skeleton/Loading State Unification (NEW)

**Scope**: Consolidate skeleton components into shared primitives.

**Current State** (6 separate implementations):

- `components/tasks/TaskListSkeleton.tsx`
- `components/expenses/ExpensesListSkeleton.tsx`
- `components/team/TeamListSkeleton.tsx`
- `components/projects/ProjectListSkeleton.tsx`
- `components/materials/MaterialsListSkeleton.tsx`
- `components/mobile/SkeletonCard.tsx`

**Target**: Create unified skeleton primitives in `components/ui/`:

- `ListSkeleton.tsx` - configurable list skeleton
- `CardSkeleton.tsx` - configurable card skeleton
- `TableSkeleton.tsx` - configurable table skeleton

---

## PR 10 — Memoization Audit (NEW)

**Scope**: Review excessive memoization patterns.

**High-Priority Files** (excessive useCallback/useMemo):
| File | Count | Action |
|------|-------|--------|
| `SpatialViewer.tsx` | 25 | Audit necessity, remove unused |
| `GanttChart.tsx` | 14 | Review render patterns |
| `TaskDetail.tsx` | 11 | Consolidate after decomposition |
| `ProjectDetailContent.tsx` | 11 | Review after modal migration |

**Guidelines:**

- Only memoize if preventing expensive re-renders
- Prefer component composition over memoization
- Use React DevTools Profiler to verify benefits

---

## Validation Checklist (Per PR)

```bash
# Type safety
npx tsc --noEmit

# Lint
npm run lint

# Build verification
npm run build

# Check for unused exports after deletions
npm run lint -- --rule 'import/no-unused-modules: warn'

# Verify no broken imports
rg "from ['\"']@/components/mobile['\"]" --type ts --type tsx
```

- Targeted Playwright snapshots if UI touched.

---

## Suggested PR Titles

1. `refactor(ui): add shared card/modal primitives`
2. `refactor(modal): migrate all modals to ResponsiveModal`
3. `refactor(dashboard): standardize widget shells`
4. `refactor(chat): batch message metadata fetches`
5. `refactor(utils): centralize getInitials + stockStatusConfig + useHapticFeedback`
6. `refactor(projects): unify upload previews + dynamic imports`
7. `chore: remove unused examples and dead code`
8. `refactor(tasks): decompose large modal components`
9. `refactor(ui): unify skeleton/loading components`
10. `perf: audit and optimize memoization patterns`

---

## Implementation Order (Recommended)

```
Phase 1 - Foundation (PRs 1, 2)
├── PR 1: Shared UI Primitives
└── PR 2: Modal Migration to ResponsiveModal ← HIGHEST PRIORITY

Phase 2 - Domain Consolidation (PRs 3, 4, 5)
├── PR 3: Dashboard Widget Consolidation
├── PR 4: Chat Metadata Batching
└── PR 5: Utility Migration & Hook Extraction

Phase 3 - Optimization (PRs 6, 7, 8, 9, 10)
├── PR 6: Upload/Preview Unification + Dynamic Imports
├── PR 7: Cleanup & Deletions
├── PR 8: Large Component Decomposition
├── PR 9: Skeleton/Loading Unification
└── PR 10: Memoization Audit
```

---

## Success Metrics

| Metric                                   | Current                                    | Target                   |
| ---------------------------------------- | ------------------------------------------ | ------------------------ |
| Modal implementations                    | 4 (BaseModal, BottomSheet, Dialog, custom) | 1 (ResponsiveModal)      |
| Files using direct BaseModal/BottomSheet | 35                                         | 0                        |
| `getInitials` definitions                | 21                                         | 1                        |
| Haptic implementations                   | 7                                          | 1 hook                   |
| Skeleton components                      | 6                                          | 3 unified                |
| Unused modal/component files             | 5                                          | 0 (deleted)              |
| Duplicate modal names                    | 1 (AddSubcontractorModal x2)               | 0 (renamed/consolidated) |
| Example files in components/             | 3                                          | 0 (moved or deleted)     |
| Type errors                              | 0                                          | 0                        |
| Build status                             | Pass                                       | Pass                     |
| Visual regressions                       | 0                                          | 0                        |
