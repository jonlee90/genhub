# Form Validation & Input Masking - Implementation Tasks

## References
- Requirements: `.claude/specs/form-validation-masking/requirements.md`
- Design: `.claude/specs/form-validation-masking/design.md`

---

## Phase 1: Foundation & Dependencies

### Task 1.1: Install Dependencies
- **Agent:** backend-engineer
- **Output:** Updated `package.json` and `package-lock.json`
- **Requirements:**
  - Install `react-hook-form@^7.53.2`
  - Install `@hookform/resolvers@^3.9.1`
  - Install `react-currency-input-field@^3.8.0`
  - Verify Zod version `^4.1.13` already installed
  - Run `npm install` and verify no conflicts
- **Acceptance:**
  - [ ] All dependencies installed successfully
  - [ ] `npm run build` passes without errors
  - [ ] No version conflicts in package.json

### Task 1.2: Create Validation Schemas
- **Agent:** backend-engineer
- **Skill:** `skills/backend/validation-schemas.md`
- **Output:** `lib/validation/schemas.ts`
- **Requirements:**
  - Create field-level Zod schemas (email, phone, zipCode, currency, requiredString, date)
  - Create form-level schemas (createProject, createTask, createExpense, inviteTeamMember, addSubcontractor)
  - Add cross-field validations (e.g., end_date > start_date)
  - Export all schemas with TypeScript types
  - Add JSDoc comments for each schema
- **Acceptance:**
  - [ ] All schemas compile without errors
  - [ ] Schemas use proper Zod refinements for complex validation
  - [ ] TypeScript types inferred correctly from schemas

### Task 1.3: Create Error Messages Constants
- **Agent:** backend-engineer
- **Output:** `lib/validation/error-messages.ts`
- **Requirements:**
  - Create ERROR_MESSAGES object with standard messages
  - Functions for dynamic messages (e.g., maxLength)
  - Export error message helpers
- **Acceptance:**
  - [ ] All error messages follow GenHub tone
  - [ ] Messages are concise and actionable
  - [ ] Type-safe message helpers

### Task 1.4: Create useValidatedForm Hook
- **Agent:** backend-engineer
- **Skill:** `skills/backend/custom-hooks.md`
- **Output:** `hooks/useValidatedForm.ts`
- **Requirements:**
  - Wrap React Hook Form's useForm
  - Integrate Zod resolver via @hookform/resolvers
  - Add computed properties: isValid, isSubmitting, canSubmit
  - Set default mode to 'onBlur'
  - Add TypeScript generics for type safety
- **Acceptance:**
  - [ ] Hook compiles with proper TypeScript types
  - [ ] Returns all React Hook Form methods
  - [ ] canSubmit correctly computed from isValid && !isSubmitting

---

## Phase 2: Input Components

### Task 2.1: Create CurrencyInput Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/ui/CurrencyInput.tsx`
- **Dependencies:** Task 1.1 (react-currency-input-field must be installed)
- **Requirements:**
  - Wrap react-currency-input-field
  - Match MobileInput styling (h-14, rounded-xl, etc.)
  - Support label, error, hint props
  - Use $ prefix, 2 decimal places, no negative values
  - Dark mode support
  - Mobile-optimized (inputMode="decimal")
  - ARIA attributes for accessibility
- **Acceptance:**
  - [ ] Matches GenHub design system
  - [ ] Formats as $X,XXX.XX while typing
  - [ ] Error state shows red border + message
  - [ ] Works in dark mode
  - [ ] Touch target is 56px

### Task 2.2: Create PhoneInput Component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/ui/PhoneInput.tsx`
- **Dependencies:** Task 2.1
- **Requirements:**
  - Extend MobileInput component
  - Use existing formatPhoneNumber utility
  - Format as (XXX) XXX-XXXX while typing
  - Truncate to 10 digits
  - inputMode="tel" for phone keyboard
  - Forward ref support
- **Acceptance:**
  - [ ] Formats phone number on change
  - [ ] Prevents non-numeric input
  - [ ] Works with React Hook Form register
  - [ ] Maintains focus during formatting

### Task 2.3: Update MobileInput for React Hook Form Compatibility
- **Agent:** frontend-engineer
- **Output:** `components/mobile/MobileInput.tsx`
- **Dependencies:** Task 2.2
- **Requirements:**
  - Ensure forwardRef is properly implemented
  - Test with React Hook Form register
  - Verify error prop works with RHF errors
  - No breaking changes to existing usage
- **Acceptance:**
  - [ ] Works with {...register('field')} spread
  - [ ] Works with existing non-RHF forms
  - [ ] All existing forms still function

---

## Phase 3: Form Component Migrations

### Task 3.1: Migrate InviteTeamMemberModal
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/form-migration.md`
- **Output:** `components/team/InviteTeamMemberModal.tsx`
- **Dependencies:** Tasks 1.4, 2.1, 2.2, 2.3
- **Requirements:**
  - Replace custom state with useValidatedForm hook
  - Use inviteTeamMemberSchema
  - Replace Input with MobileInput
  - Add error display for each field
  - Disable submit button based on canSubmit
  - Remove useActionState form validation (keep for server action only)
- **Acceptance:**
  - [ ] Form validates on blur
  - [ ] Submit button disabled until valid
  - [ ] Error messages display correctly
  - [ ] Existing functionality preserved
  - [ ] No console errors

### Task 3.2: Migrate AddSubcontractorModal
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/form-migration.md`
- **Output:** `components/team/AddSubcontractorModal.tsx`
- **Dependencies:** Task 3.1
- **Requirements:**
  - Replace custom validation with useValidatedForm
  - Use addSubcontractorSchema
  - Add PhoneInput for phone field
  - Keep existing file upload logic
  - Update submit button disabled logic
- **Acceptance:**
  - [ ] Phone field uses PhoneInput component
  - [ ] All fields validate correctly
  - [ ] File upload still works
  - [ ] Rating selector works with Controller
  - [ ] Trade type dropdown works

### Task 3.3: Migrate CreateExpenseModal
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/form-migration.md`
- **Output:** `components/expenses/CreateExpenseModal.tsx`
- **Dependencies:** Task 3.2
- **Requirements:**
  - Replace custom validation with useValidatedForm
  - Use createExpenseSchema
  - Replace amount input with CurrencyInput
  - Use Controller for Select components
  - Keep taskContext pre-fill logic
  - Update isValid check for submit button
- **Acceptance:**
  - [ ] Amount field uses CurrencyInput
  - [ ] Currency formatting works correctly
  - [ ] Task context pre-fill works
  - [ ] OCR preview still functional
  - [ ] Validation prevents submission

### Task 3.4: Enhance CreateProjectForm Validation
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/form-migration.md`
- **Output:** `components/projects/CreateProjectForm.tsx`
- **Dependencies:** Task 3.3
- **Requirements:**
  - Replace custom validation logic with useValidatedForm
  - Use createProjectSchema
  - Add step validation with trigger() method
  - Replace budget input with CurrencyInput
  - Replace phone input with PhoneInput
  - Keep multi-step navigation logic
  - Add zip code validation
  - Cross-validate start_date and end_date
- **Acceptance:**
  - [ ] Step validation works (Continue button disabled until step valid)
  - [ ] Budget shows currency formatting
  - [ ] Phone shows (XXX) XXX-XXXX format
  - [ ] ZIP code validates format
  - [ ] End date must be after start date
  - [ ] All 4 steps validate correctly
  - [ ] Form submits only when all steps valid

### Task 3.5: Migrate TaskModal
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/form-migration.md`
- **Output:** `components/tasks/TaskModal.tsx`
- **Dependencies:** Task 3.4
- **Requirements:**
  - Replace custom validation in useTaskFormState
  - Use createTaskSchema
  - Add CurrencyInput for planned_cost and actual_cost
  - Keep step navigation for create mode
  - Validate required fields (title, project_id, phase_id)
  - Update submit button disabled logic
- **Acceptance:**
  - [ ] Cost fields use CurrencyInput
  - [ ] Title validation works
  - [ ] Project/phase validation works
  - [ ] Multi-assignee logic still works
  - [ ] Edit mode preserves data
  - [ ] Approval workflow unaffected

### Task 3.6: Migrate AssignMaterialModal
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/form-migration.md`
- **Output:** `components/materials/AssignMaterialModal.tsx`
- **Dependencies:** Task 3.5
- **Requirements:**
  - Add validation schema for material assignment
  - Use useValidatedForm hook
  - Validate project, phase, task selection
  - Validate quantity (positive number)
  - Update submit button disabled logic
- **Acceptance:**
  - [ ] Cannot submit without project/task selection
  - [ ] Quantity must be positive
  - [ ] "_empty" placeholder values rejected
  - [ ] Cost calculation still works

---

## Phase 4: Additional Forms

### Task 4.1: Migrate EmailSignInForm
- **Agent:** frontend-engineer
- **Output:** `components/auth/EmailSignInForm.tsx`
- **Dependencies:** Task 3.6
- **Requirements:**
  - Replace custom email validation with useValidatedForm
  - Create simple email schema
  - Keep success/error state logic
  - Update submit button disabled logic
- **Acceptance:**
  - [ ] Email validates on blur
  - [ ] Submit disabled until valid email
  - [ ] Success state still works

### Task 4.2: Migrate EditSubcontractorModal
- **Agent:** frontend-engineer
- **Output:** `components/team/EditSubcontractorModal.tsx`
- **Dependencies:** Task 4.1
- **Requirements:**
  - Use addSubcontractorSchema (same as add modal)
  - Pre-populate form with existing data
  - Use PhoneInput for phone field
  - Validate changes before submit
- **Acceptance:**
  - [ ] Form pre-populates correctly
  - [ ] Phone formatting works
  - [ ] Validation prevents invalid updates

### Task 4.3: Add Validation to Remaining Settings Forms
- **Agent:** frontend-engineer
- **Output:** Multiple files in `components/settings/`
- **Dependencies:** Task 4.2
- **Requirements:**
  - PhaseTemplateManager.tsx - validate phase names
  - ProjectTypeManager.tsx - validate type names
  - TaskTypeManager.tsx - validate task type config
  - TaskTemplateManager.tsx - validate template names
- **Acceptance:**
  - [ ] All settings forms validate
  - [ ] Required fields cannot be empty
  - [ ] Submit buttons disabled when invalid

---

## Phase 5: Documentation & Testing

### Task 5.1: Create Form Migration Guide
- **Agent:** backend-engineer OR frontend-engineer
- **Output:** `docs/guides/form-validation.md`
- **Requirements:**
  - Document useValidatedForm hook usage
  - Provide examples for simple and multi-step forms
  - Document all validation schemas
  - Show Controller usage for Select/custom components
  - Migration checklist for converting old forms
- **Acceptance:**
  - [ ] Guide covers all common patterns
  - [ ] Code examples are tested and working
  - [ ] Troubleshooting section included

### Task 5.2: Add TypeScript Type Exports
- **Agent:** backend-engineer
- **Output:** `types/forms.ts`
- **Requirements:**
  - Export inferred types from Zod schemas
  - Create type helpers for form data
  - Document type usage in forms
- **Acceptance:**
  - [ ] All form types exported
  - [ ] Types match Zod schemas
  - [ ] No 'any' types used

### Task 5.3: Create Unit Tests for Validation Schemas
- **Agent:** backend-engineer
- **Output:** `lib/validation/__tests__/schemas.test.ts`
- **Requirements:**
  - Test each field-level schema (email, phone, currency, etc.)
  - Test form-level schemas
  - Test cross-field validations (date ranges)
  - Test edge cases (empty strings, special characters, etc.)
- **Acceptance:**
  - [ ] All schemas have test coverage
  - [ ] Tests pass consistently
  - [ ] Edge cases covered

### Task 5.4: Integration Testing with Playwright
- **Agent:** frontend-engineer
- **Output:** `tests/forms/validation.spec.ts`
- **Requirements:**
  - Test InviteTeamMemberModal validation flow
  - Test CreateProjectForm multi-step validation
  - Test CreateExpenseModal currency input
  - Test submit button disabled states
  - Test error message display
- **Acceptance:**
  - [ ] All test scenarios pass
  - [ ] Mobile viewport tested
  - [ ] Accessibility checks pass

### Task 5.5: Update Component Index Documentation
- **Agent:** backend-engineer OR frontend-engineer
- **Output:** Updated index files
- **Requirements:**
  - Run `/kc:sync-docs` to update component indexes
  - Verify CurrencyInput and PhoneInput documented
  - Update form component documentation
- **Acceptance:**
  - [ ] docs/indexes/components.md includes new components
  - [ ] docs/indexes/hooks.md includes useValidatedForm
  - [ ] All index files are current

---

## Phase 6: Performance & Polish

### Task 6.1: Bundle Size Analysis
- **Agent:** frontend-engineer
- **Output:** Bundle analysis report
- **Requirements:**
  - Run `npm run build` with bundle analyzer
  - Check react-hook-form bundle size
  - Verify tree-shaking is working
  - Document actual bundle impact
- **Acceptance:**
  - [ ] react-hook-form is <30kb gzipped
  - [ ] No duplicate dependencies
  - [ ] Total bundle size increase <50kb

### Task 6.2: Accessibility Audit
- **Agent:** frontend-engineer
- **Output:** Accessibility fixes (if needed)
- **Requirements:**
  - Test all forms with screen reader (VoiceOver/NVDA)
  - Verify ARIA attributes on all inputs
  - Check error announcement
  - Test keyboard navigation
  - Verify focus management
- **Acceptance:**
  - [ ] Screen reader announces errors
  - [ ] All inputs have proper labels
  - [ ] Keyboard navigation works
  - [ ] Focus visible on all inputs

### Task 6.3: Mobile Testing
- **Agent:** frontend-engineer
- **Output:** Mobile UX fixes (if needed)
- **Requirements:**
  - Test on iOS Safari and Chrome
  - Verify virtual keyboard types (email, tel, numeric)
  - Check input zoom (must not zoom with 16px font)
  - Test currency input on mobile
  - Verify touch targets (56px minimum)
- **Acceptance:**
  - [ ] No zoom on input focus
  - [ ] Correct keyboards appear
  - [ ] Touch targets are adequate
  - [ ] Formatting works smoothly

---

## Execution Order

```
Sequential Dependencies:

Phase 1 (Foundation):
1.1 → 1.2 → 1.3 → 1.4

Phase 2 (Components):
1.4 → 2.1 → 2.2 → 2.3

Phase 3 (Critical Forms):
2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6

Phase 4 (Additional Forms):
3.6 → 4.1 → 4.2 → 4.3

Phase 5 (Docs & Tests):
4.3 → 5.1
4.3 → 5.2
4.3 → 5.3
4.3 → 5.4
5.4 → 5.5

Phase 6 (Polish):
5.5 → 6.1
5.5 → 6.2
5.5 → 6.3

Parallelizable:
- Tasks 5.1, 5.2, 5.3, 5.4 can run in parallel after 4.3
- Tasks 6.1, 6.2, 6.3 can run in parallel after 5.5
```

---

## Estimated Effort

- **Phase 1 (Foundation):** 4 tasks - ~4 hours
- **Phase 2 (Components):** 3 tasks - ~3 hours
- **Phase 3 (Critical Forms):** 6 tasks - ~8 hours
- **Phase 4 (Additional Forms):** 3 tasks - ~4 hours
- **Phase 5 (Docs & Tests):** 5 tasks - ~5 hours
- **Phase 6 (Polish):** 3 tasks - ~3 hours

**Total:** 24 tasks, ~27 hours estimated

---

## Risk Mitigation

### Risk: Breaking Existing Forms
**Mitigation:**
- Migrate one form at a time
- Test thoroughly before moving to next form
- Keep backward compatibility in shared components

### Risk: Bundle Size Impact
**Mitigation:**
- Use tree-shaking properly
- Monitor bundle size after each phase
- Consider code-splitting if needed

### Risk: Mobile Performance
**Mitigation:**
- Test on real devices early
- Use debouncing for expensive validations
- Keep validation logic simple

### Risk: TypeScript Complexity
**Mitigation:**
- Use Zod's infer utility for types
- Create helper types for common patterns
- Document complex type usage

---

## Success Metrics

- [ ] All 20+ forms have client-side validation
- [ ] Submit buttons disabled when forms invalid
- [ ] Currency fields format as $X,XXX.XX
- [ ] Phone fields format as (XXX) XXX-XXXX
- [ ] Email/ZIP validation works consistently
- [ ] No increase in form submission errors (server-side metrics)
- [ ] Bundle size increase <50kb gzipped
- [ ] Accessibility score maintains 100%
- [ ] Mobile experience smooth (no input zoom)
- [ ] Zero TypeScript errors in forms

---

**Status:** READY FOR IMPLEMENTATION

**Notes for Implementer:**
- Start with Phase 1 to set foundation
- Test each migrated form thoroughly before proceeding
- Maintain existing functionality during migration
- Use OpenCode review after Phase 3 and Phase 6
