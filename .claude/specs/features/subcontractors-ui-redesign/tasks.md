# Subcontractors UI Redesign - Implementation Tasks

## References
- Requirements: `.claude/specs/features/subcontractors-ui-redesign/requirements.md`
- Design: `.claude/specs/features/subcontractors-ui-redesign/design.md`

---

## Phase 1: Create New Modal Component

### Task 1.1: Create SubcontractorModal base structure
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/SubcontractorModal.tsx`
- **Requirements:**
  - Create new SubcontractorModal component using ResponsiveModal wrapper
  - Accept props: `isOpen`, `onClose`, `mode`, `subcontractor`, `companyId`
  - Set up form state using `useValidatedForm` hook
  - Implement mode detection (create vs edit)
  - Add useEffect to reset form when modal opens or subcontractor changes
  - Include proper TypeScript interfaces
- **Acceptance:**
  - [ ] Component compiles without errors
  - [ ] ResponsiveModal imported from `@/components/ui/ResponsiveModal`
  - [ ] Form state initialized with useValidatedForm
  - [ ] Mode prop correctly switches between 'create' and 'edit'
  - [ ] Default values load correctly in edit mode

### Task 1.2: Create form section components
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/subcontractor-modal/` directory with section components
- **Requirements:**
  - Create `BasicInfoSection.tsx` (company name, trade, contact name)
  - Create `ContactSection.tsx` (email, phone, address)
  - Create `LicenseSection.tsx` (license number)
  - Create `InsuranceSection.tsx` (insurance provider)
  - Create `PerformanceSection.tsx` (star rating selector with 44px targets)
  - Create `NotesSection.tsx` (textarea)
  - All sections accept register, control, errors props
  - Use Lucide icons matching design spec
  - Apply construction-blue icon backgrounds
- **Acceptance:**
  - [ ] All 6 section components created
  - [ ] Each section has proper TypeScript props interface
  - [ ] Icons imported from lucide-react (individual imports)
  - [ ] Star rating buttons have min-h-[44px] min-w-[44px]
  - [ ] PhoneInput used in ContactSection (Controller wrapper)
  - [ ] Select used in BasicInfoSection for trade (Controller wrapper)

### Task 1.3: Create modal status alert components
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/subcontractor-modal/StatusAlerts.tsx`
- **Requirements:**
  - Create `SuccessAlert` component (green, CheckCircle2 icon)
  - Create `ErrorAlert` component (red, XCircle icon)
  - Match styling from TaskModal status alerts
  - Use Alert and AlertDescription from shadcn
  - Support dark mode (dark:bg-green-950, dark:bg-red-950)
- **Acceptance:**
  - [ ] SuccessAlert renders with green theme
  - [ ] ErrorAlert accepts message prop and displays it
  - [ ] Icons properly imported from lucide-react
  - [ ] Dark mode classes applied
  - [ ] Border-2 styling matches design spec

### Task 1.4: Create modal footer component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** `components/team/subcontractor-modal/ModalFooter.tsx`
- **Requirements:**
  - Create ModalFooter with Cancel and Submit buttons
  - Accept props: onCancel, isPending, isSuccess, canSubmit
  - Submit button shows different states: Normal, Pending (Loader2), Success (CheckCircle2)
  - Cancel button disabled during pending
  - Apply min-h-[44px] to both buttons
  - Use construction-blue for submit button
- **Acceptance:**
  - [ ] Footer renders with proper button layout
  - [ ] Pending state shows "Saving..." with spinner
  - [ ] Success state shows "Saved!" with check icon
  - [ ] Submit disabled when canSubmit is false
  - [ ] Touch targets meet 44px minimum

### Task 1.5: Implement form submission logic
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated `components/team/SubcontractorModal.tsx`
- **Dependencies:** Tasks 1.1-1.4
- **Requirements:**
  - Implement onSubmit handler using useTransition
  - Call createSubcontractor or updateSubcontractor based on mode
  - Handle success: setIsSuccess, toast, auto-close after 1000ms
  - Handle error: setError, toast, keep modal open
  - Reset form on close via handleClose callback
  - Map form data to Server Action format
- **Acceptance:**
  - [ ] Form submits to correct Server Action based on mode
  - [ ] Success path: Toast → Success alert → Auto-close
  - [ ] Error path: Toast → Error alert → Stay open
  - [ ] Form resets when modal closes
  - [ ] isPending state disables inputs during submission

### Task 1.6: Integrate all sections into SubcontractorModal
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated `components/team/SubcontractorModal.tsx`
- **Dependencies:** Tasks 1.1-1.5
- **Requirements:**
  - Import all section components
  - Import StatusAlerts and ModalFooter
  - Render sections in correct order within form
  - Apply space-y-6 to form container
  - Pass register, control, errors, watch, setValue to sections
  - Set ResponsiveModal icon based on mode (Plus vs Pencil)
  - Set ResponsiveModal title based on mode
- **Acceptance:**
  - [ ] All sections render in specified order
  - [ ] Form sections properly spaced (space-y-6)
  - [ ] Status alerts appear above form sections
  - [ ] Footer appears below all sections
  - [ ] Modal icon switches based on mode
  - [ ] Modal title switches based on mode

---

## Phase 2: Update SubcontractorCard

### Task 2.1: Add onEdit prop to SubcontractorCard
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated `components/team/SubcontractorCard.tsx`
- **Dependencies:** Task 1.6 (modal exists)
- **Requirements:**
  - Add `onEdit: (subcontractor: Subcontractor) => void` to props interface
  - Remove local `editModalOpen` state
  - Remove `EditSubcontractorModal` import and render
  - Update "Edit Details" menu item to call `onEdit(subcontractor)`
  - Keep all other functionality (deactivate dialog, card display)
- **Acceptance:**
  - [ ] Props interface includes onEdit callback
  - [ ] No local modal state in component
  - [ ] EditSubcontractorModal import removed
  - [ ] Edit menu item calls onEdit with subcontractor
  - [ ] Component compiles without errors

---

## Phase 3: Update SubcontractorList

### Task 3.1: Add modal state to SubcontractorList
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated `components/team/SubcontractorList.tsx`
- **Dependencies:** Task 2.1
- **Requirements:**
  - Add state: `const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')`
  - Add state: `const [isModalOpen, setIsModalOpen] = useState(false)`
  - Add state: `const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null)`
  - Remove `isAddModalOpen` state (replaced by isModalOpen)
  - Remove `AddSubcontractorModal` import
- **Acceptance:**
  - [ ] Three new state variables added
  - [ ] Old add modal state removed
  - [ ] AddSubcontractorModal import removed
  - [ ] Component compiles without errors

### Task 3.2: Create handleEdit and handleAdd callbacks
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated `components/team/SubcontractorList.tsx`
- **Dependencies:** Task 3.1
- **Requirements:**
  - Create `handleAdd` function: Sets mode to 'create', clears editingSubcontractor, opens modal
  - Create `handleEdit` function: Sets mode to 'edit', sets editingSubcontractor, opens modal
  - Create `handleCloseModal` function: Resets all modal state
  - Update "Add Subcontractor" button onClick to call handleAdd
  - Pass handleEdit to SubcontractorCard as onEdit prop
- **Acceptance:**
  - [ ] handleAdd sets mode='create' and opens modal
  - [ ] handleEdit sets mode='edit', editingSubcontractor, and opens modal
  - [ ] handleCloseModal resets all modal state
  - [ ] Add button calls handleAdd
  - [ ] SubcontractorCard receives onEdit={handleEdit}

### Task 3.3: Render unified SubcontractorModal
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated `components/team/SubcontractorList.tsx`
- **Dependencies:** Tasks 3.1, 3.2, 1.6
- **Requirements:**
  - Import SubcontractorModal (dynamic import for code splitting)
  - Render single SubcontractorModal at bottom of component
  - Pass props: isOpen, onClose, mode, subcontractor (editingSubcontractor), companyId
  - Remove old AddSubcontractorModal render
- **Acceptance:**
  - [ ] SubcontractorModal dynamically imported
  - [ ] Single modal instance rendered
  - [ ] Props correctly passed based on state
  - [ ] Old add modal render removed
  - [ ] Modal opens for both create and edit flows

---

## Phase 4: Page Header Consistency

### Task 4.1: Update page title styling
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated `app/app/team/subcontractors/page.tsx`
- **Requirements:**
  - Ensure title uses text-2xl md:text-5xl (matches tasks page)
  - Ensure font-black and tracking-tighter applied
  - Ensure construction-blue color
  - Ensure leading-none for tight line height
  - Construction border (h-1 bg-construction-blue) at top
- **Acceptance:**
  - [ ] Title responsive: text-2xl on mobile, text-5xl on desktop
  - [ ] Title uses font-black tracking-tighter
  - [ ] Title color is construction-blue
  - [ ] 1px blue border at top of header section

### Task 4.2: Verify blueprint background
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Verified `app/app/team/subcontractors/page.tsx`
- **Requirements:**
  - Confirm blueprint grid background exists
  - Confirm opacity-[0.03]
  - Confirm 40px x 40px grid size
  - Confirm construction-blue color
  - Match pattern from tasks page
- **Acceptance:**
  - [ ] Blueprint background renders
  - [ ] Grid size is 40px x 40px
  - [ ] Opacity is 0.03
  - [ ] Color uses construction-blue CSS variable

---

## Phase 5: Mobile Optimization

### Task 5.1: Verify touch targets across all components
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Updated components with touch target fixes
- **Dependencies:** All Phase 1-3 tasks
- **Requirements:**
  - Audit all buttons: min-h-[44px] min-w-[44px]
  - Audit star rating: 44px x 44px per star
  - Audit dropdown triggers: min-h-[44px]
  - Audit action menu (MoreVertical): 44px x 44px
  - Add padding where needed to meet 44px minimum
- **Acceptance:**
  - [ ] All interactive elements ≥44px in both dimensions
  - [ ] Star rating buttons have proper touch area
  - [ ] Dropdown menu triggers meet 44px
  - [ ] Action menu icon button is 44px x 44px
  - [ ] Manual testing on mobile device confirms easy tapping

### Task 5.2: Test mobile drawer behavior
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Testing report and any fixes
- **Dependencies:** Task 3.3
- **Requirements:**
  - Test on mobile viewport (<768px)
  - Verify modal opens as bottom drawer
  - Verify drag-to-dismiss works (≥50px drag)
  - Verify snap points (half, full)
  - Verify backdrop dismisses modal
  - Verify safe area padding on iOS
- **Acceptance:**
  - [ ] Drawer opens from bottom on mobile
  - [ ] Drag down ≥50px dismisses modal
  - [ ] Snap points work correctly
  - [ ] Backdrop click closes modal
  - [ ] Safe area insets respected

### Task 5.3: Test desktop modal behavior
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Testing report and any fixes
- **Dependencies:** Task 3.3
- **Requirements:**
  - Test on desktop viewport (≥768px)
  - Verify modal opens as centered dialog
  - Verify max-width of 3xl (768px)
  - Verify backdrop dismisses modal
  - Verify Escape key dismisses modal
  - Verify focus management (first input focused on open)
- **Acceptance:**
  - [ ] Modal centered on desktop
  - [ ] Max-width enforced at 3xl
  - [ ] Backdrop click closes modal
  - [ ] Escape key closes modal
  - [ ] Focus moves to first input on open

---

## Phase 6: Testing & Polish

### Task 6.1: Test complete user flows
- **Agent:** code-reviewer
- **Output:** Testing report with pass/fail for each flow
- **Dependencies:** All previous tasks
- **Requirements:**
  - Test Flow 1: Add new subcontractor (all required fields → submit → success)
  - Test Flow 2: Edit existing subcontractor (modify fields → submit → success)
  - Test Flow 3: Validation errors (empty required fields → error messages)
  - Test Flow 4: Server error handling (network error → error alert)
  - Test Flow 5: Deactivate subcontractor (confirm dialog → success)
  - Test Flow 6: Permission checks (worker role → no add button)
- **Acceptance:**
  - [ ] All 6 flows tested and documented
  - [ ] Success paths work end-to-end
  - [ ] Error paths display proper messages
  - [ ] Permissions enforced correctly

### Task 6.2: Test dark mode
- **Agent:** code-reviewer
- **Output:** Dark mode testing report
- **Dependencies:** All previous tasks
- **Requirements:**
  - Enable system dark mode
  - Verify all text readable (contrast ≥4.5:1)
  - Verify card backgrounds (dark:bg-gray-800)
  - Verify modal backgrounds (dark:bg-gray-900)
  - Verify icon visibility
  - Verify alert backgrounds (dark:bg-green-950, dark:bg-red-950)
- **Acceptance:**
  - [ ] All text has sufficient contrast
  - [ ] Backgrounds properly styled for dark mode
  - [ ] Icons visible in dark mode
  - [ ] No white flashes or jarring transitions

### Task 6.3: Accessibility audit
- **Agent:** code-reviewer
- **Output:** Accessibility audit report
- **Dependencies:** All previous tasks
- **Requirements:**
  - Test keyboard navigation (Tab through all fields)
  - Test screen reader (modal title, field labels, errors announced)
  - Test focus management (modal open → focus, modal close → return)
  - Verify ARIA attributes on form fields
  - Verify error messages have role="alert"
  - Test with actual screen reader (VoiceOver or NVDA)
- **Acceptance:**
  - [ ] Full keyboard navigation works
  - [ ] Screen reader announces modal title
  - [ ] Field labels properly linked to inputs
  - [ ] Errors announced when they appear
  - [ ] Focus returns to trigger on close

---

## Phase 7: Cleanup & Documentation

### Task 7.1: Delete old modal files
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/vercel-react-best-practices.md`
- **Output:** Removed files
- **Dependencies:** Tasks 3.3 (new modal working)
- **Requirements:**
  - Delete `components/team/AddSubcontractorModal.tsx`
  - Delete `components/team/EditSubcontractorModal.tsx`
  - Verify no other files import these components
  - Run build to confirm no broken imports
- **Acceptance:**
  - [ ] AddSubcontractorModal.tsx deleted
  - [ ] EditSubcontractorModal.tsx deleted
  - [ ] No grep results for imports of deleted files
  - [ ] Build passes without errors

### Task 7.2: Update component documentation
- **Agent:** frontend-engineer OR backend-engineer
- **Output:** Updated docs/indexes/components.md
- **Requirements:**
  - Run `/kc:sync-docs` command
  - Verify SubcontractorModal listed in components index
  - Verify old modal files removed from index
  - Add JSDoc comments to SubcontractorModal if missing
- **Acceptance:**
  - [ ] docs/indexes/components.md updated
  - [ ] SubcontractorModal documented
  - [ ] Old modals removed from docs
  - [ ] JSDoc comments present

### Task 7.3: Performance verification
- **Agent:** code-reviewer
- **Output:** Performance report
- **Dependencies:** All previous tasks
- **Requirements:**
  - Measure modal open time (target: <200ms mobile, <100ms desktop)
  - Verify SubcontractorModal is dynamically imported
  - Check bundle size impact (should be minimal due to code splitting)
  - Test form validation response time (target: <300ms)
  - Verify no unnecessary re-renders on SubcontractorCard
- **Acceptance:**
  - [ ] Modal opens within target times
  - [ ] Dynamic import confirmed (not in initial bundle)
  - [ ] Form validation fast (<300ms)
  - [ ] SubcontractorCard memoized or minimal re-renders

---

## Execution Order

```
Sequential Dependencies:

Phase 1 (Modal Creation):
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6

Phase 2 (Card Update):
2.1 (requires 1.6)

Phase 3 (List Update):
3.1 → 3.2 → 3.3 (requires 2.1, 1.6)

Phase 4 (Header):
4.1 → 4.2 (can run parallel with Phase 3)

Phase 5 (Mobile):
5.1 → 5.2 → 5.3 (requires 3.3)

Phase 6 (Testing):
6.1 → 6.2 → 6.3 (requires all Phase 1-5)

Phase 7 (Cleanup):
7.1 → 7.2 → 7.3 (requires 6.x)

Parallelizable:
- Phase 4 can start after Phase 1 completes
- Tasks 1.2, 1.3, 1.4 can run in parallel
- Tasks 5.2 and 5.3 can run in parallel
- Tasks 6.2 and 6.3 can run in parallel
```

---

## Estimated Effort
- **Phase 1 (Modal Creation):** 6 tasks (~3-4 hours)
- **Phase 2 (Card Update):** 1 task (~30 minutes)
- **Phase 3 (List Update):** 3 tasks (~1-2 hours)
- **Phase 4 (Header):** 2 tasks (~30 minutes)
- **Phase 5 (Mobile):** 3 tasks (~1-2 hours)
- **Phase 6 (Testing):** 3 tasks (~2 hours)
- **Phase 7 (Cleanup):** 3 tasks (~1 hour)
- **Total:** 21 tasks (~9-12 hours)

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ResponsiveModal behavior differs from old modals | High | Test thoroughly on both mobile and desktop |
| Form validation breaks during refactor | Medium | Keep validation logic identical, test each field |
| Server Actions fail after changes | High | No Server Action changes, only client UI |
| Dynamic import delays modal open | Low | Preload on button hover (future optimization) |
| Touch targets still too small | Medium | Manual testing on real devices, iterate |

---

**Status:** READY FOR IMPLEMENTATION

**Implementation Notes:**
- Start with Phase 1 (modal creation) to establish foundation
- Phase 2-3 can proceed quickly once modal is stable
- Phase 4 is independent and can run parallel
- Phase 5-6 are critical for user experience validation
- Phase 7 completes the migration cleanly
