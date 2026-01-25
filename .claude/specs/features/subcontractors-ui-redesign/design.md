# Subcontractors UI Redesign - Technical Design

## Overview
This design specifies the refactoring of the subcontractors page to match the tasks page UI patterns. The primary changes involve replacing the custom EditSubcontractorModal with ResponsiveModal, reorganizing the page header, and ensuring consistent mobile-first design patterns.

## Requirements Reference
See: `.claude/specs/features/subcontractors-ui-redesign/requirements.md`

---

## Architecture Overview

### Component Diagram
```
SubcontractorsPage (Server Component)
  ├── BlueprintBackground (shared)
  ├── Industrial Header
  │   ├── Title ("SUBCONTRACTORS")
  │   └── Construction border
  ├── Stats Grid (StatCard x4)
  └── SubcontractorList (Client)
      ├── Action Bar
      │   ├── Section Title
      │   └── Add Button (if canManage)
      ├── Search Input
      ├── Grid Layout (SubcontractorCard x N)
      │   └── SubcontractorCard
      │       ├── Card Content
      │       ├── Actions Menu (DropdownMenu)
      │       └── Deactivate Dialog (AlertDialog)
      └── SubcontractorModal (ResponsiveModal)
          └── SubcontractorForm
              ├── TaskModalStatusAlerts (success/error)
              ├── Form Sections
              │   ├── Basic Info (company, trade, contact)
              │   ├── Contact Details (email, phone, address)
              │   ├── License Info
              │   ├── Insurance Info
              │   ├── Performance Rating (star selector)
              │   └── Notes
              └── Footer Actions (Cancel, Submit)
```

### Data Flow
```
1. User opens page
   → Server Component fetches data via getSubcontractorsPageData()
   → Passes subcontractors, stats, role, companyId to SubcontractorList

2. User clicks "Add Subcontractor"
   → setIsAddModalOpen(true)
   → ResponsiveModal opens (BottomSheet on mobile, BaseModal on desktop)
   → Form renders with empty default values

3. User clicks "Edit" on card
   → setEditingSubcontractor(subcontractor)
   → setIsEditModalOpen(true)
   → ResponsiveModal opens with pre-populated form data

4. User submits form
   → useTransition for pending state
   → Call createSubcontractor() or updateSubcontractor() Server Action
   → On success: toast, revalidate, close modal after 1000ms
   → On error: display error alert, keep modal open

5. User clicks "Deactivate"
   → AlertDialog confirms
   → Call deactivateSubcontractor() Server Action
   → On success: toast, revalidate
```

---

## UI Specification

### Component Hierarchy

#### SubcontractorList (Client Component)
**File:** `components/team/SubcontractorList.tsx`

**Changes Required:**
1. Replace AddSubcontractorModal import with unified SubcontractorModal
2. Add state for modal mode: `const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')`
3. Add state for editing subcontractor: `const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null)`
4. Single modal instance handles both create and edit

**Props:** (No changes)
```typescript
interface SubcontractorListProps {
  subcontractors: Subcontractor[];
  currentUserRole: UserRole;
  companyId: string;
}
```

#### SubcontractorCard (Client Component)
**File:** `components/team/SubcontractorCard.tsx`

**Changes Required:**
1. Add `onEdit` callback prop: `onEdit: (subcontractor: Subcontractor) => void`
2. Replace EditSubcontractorModal render with onEdit callback
3. Remove local editModalOpen state
4. Remove EditSubcontractorModal import

**Updated Props:**
```typescript
interface SubcontractorCardProps {
  subcontractor: Subcontractor;
  canManage: boolean;
  isGCAdmin: boolean;
  onEdit: (subcontractor: Subcontractor) => void; // NEW
}
```

#### SubcontractorModal (NEW - Client Component)
**File:** `components/team/SubcontractorModal.tsx`

**Purpose:** Unified modal for create and edit operations using ResponsiveModal

**Props:**
```typescript
interface SubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  subcontractor?: Subcontractor | null;
  companyId: string;
}
```

**Component Structure:**
```tsx
export function SubcontractorModal({
  isOpen,
  onClose,
  mode,
  subcontractor,
  companyId,
}: SubcontractorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state using useValidatedForm
  const { register, control, handleSubmit, formState, reset, watch, setValue } =
    useValidatedForm({ defaultValues: getDefaultValues() });

  // Reset form when modal opens or subcontractor changes
  useEffect(() => {
    if (isOpen) {
      reset(mode === 'edit' && subcontractor
        ? mapSubcontractorToFormData(subcontractor)
        : getEmptyFormData()
      );
    }
  }, [isOpen, mode, subcontractor, reset]);

  const handleClose = useCallback(() => {
    setError(null);
    setIsSuccess(false);
    reset();
    onClose();
  }, [onClose, reset]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = mode === 'create'
        ? await createSubcontractor(toFormData(data))
        : await updateSubcontractor({ id: subcontractor!.id, ...data });

      if (result.success) {
        setIsSuccess(true);
        toast.success(result.message);
        setTimeout(() => handleClose(), 1000);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={mode === 'create' ? Plus : Pencil}
      title={mode === 'create' ? 'Add Subcontractor' : 'Edit Subcontractor'}
      maxWidth="3xl"
      closeOnBackdropClick={!isPending}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Success/Error Alerts (from TaskModal pattern) */}
        {isSuccess && <SuccessAlert />}
        {error && <ErrorAlert message={error} />}

        {/* Form Sections */}
        <BasicInfoSection register={register} control={control} errors={formState.errors} />
        <ContactSection register={register} control={control} errors={formState.errors} />
        <LicenseSection register={register} errors={formState.errors} />
        <InsuranceSection register={register} errors={formState.errors} />
        <PerformanceSection rating={watch('rating')} setValue={setValue} />
        <NotesSection register={register} errors={formState.errors} />

        {/* Footer Actions */}
        <ModalFooter
          onCancel={handleClose}
          isPending={isPending}
          isSuccess={isSuccess}
          canSubmit={formState.isValid}
        />
      </form>
    </ResponsiveModal>
  );
}
```

---

## Form Sections Design

### Basic Info Section
**Fields:**
- Company Name (required) - Input with Building2 icon
- Trade Specialization (required) - Select with FileText icon
- Contact Name (required) - Input with User icon

**Layout:** Full width fields, vertical stack

### Contact Section
**Fields:**
- Email (required) - Input[type=email] with Mail icon
- Phone (optional) - PhoneInput with Phone icon
- Address (optional) - Textarea with MapPin icon

**Layout:** Email full width, Phone/Address full width

### License Section
**Header:** "License Information" with FileText icon and border-t divider

**Fields:**
- License Number (optional) - Input
- License Expiry (optional) - Not shown in current form, can add later

**Layout:** Grid 1 column

### Insurance Section
**Header:** "Insurance Information" with Shield icon and border-t divider

**Fields:**
- Provider (optional) - Input
- Insurance Expiry (optional) - Not shown in current form, can add later

**Layout:** Grid 1 column

### Performance Section
**Component:** Star rating selector (1-5 stars)

**Behavior:**
- Click star to set rating (1-5)
- Click same star again to clear rating (0)
- Display current rating as "X/5" or "Not rated"
- Each star must have 44px touch target

### Notes Section
**Field:** Textarea, 3 rows, optional

---

## Visual Design Tokens

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Page Title | text-5xl | text-2xl | font-black, tracking-tighter, construction-blue |
| Modal Max Width | 3xl (768px) | 100vw | ResponsiveModal handles breakpoint |
| Touch Targets | min-h-[44px] | min-h-[44px] | All buttons, stars, menu triggers |
| Section Dividers | border-t-2 border-gray-200 | Same | Between form sections |
| Icon Backgrounds | p-1 bg-construction-blue/10 rounded | Same | Label icons |
| Blueprint Grid | 40px x 40px | Same | 0.03 opacity |
| Construction Border | h-1 bg-construction-blue | Same | Top of page header |

---

## Modal Behavior

### Opening States
| Trigger | Action |
|---------|--------|
| "Add Subcontractor" button | Open modal in 'create' mode, empty form |
| "Edit Details" menu item | Open modal in 'edit' mode, pre-populated form |

### Closing Conditions
| Condition | Behavior |
|-----------|----------|
| Click backdrop (not pending) | Close modal, reset state |
| Press Escape key | Close modal, reset state |
| Click Cancel button | Close modal, reset state |
| Submit success (after 1000ms) | Close modal, reset state |
| Drag down >50px on mobile | Close modal, reset state |

### Pending State (Form Submission)
- Disable all form inputs
- Disable Cancel button
- Submit button shows Loader2 icon + "Saving..."
- Backdrop click disabled
- Escape key disabled

### Success State (After Save)
- Green success alert appears
- Submit button shows CheckCircle2 + "Saved!"
- Form remains disabled
- Modal auto-closes after 1000ms

### Error State (Save Failed)
- Red error alert appears
- Form inputs re-enabled
- Submit button back to normal
- User can correct and retry

---

## Accessibility

### Keyboard Navigation
1. Tab order: Form fields top to bottom, Cancel → Submit
2. Escape key closes modal (unless pending)
3. Enter key submits form (from any input)
4. Arrow keys navigate Select dropdowns

### Screen Reader Support
- Modal has `role="dialog"` and `aria-labelledby` (from ResponsiveModal)
- Form fields have explicit `<Label>` with `htmlFor` linking to input IDs
- Error messages have `role="alert"` and are announced when they appear
- Success/error alerts use Alert component with proper ARIA

### Focus Management
- Modal opens → focus first input (company name)
- Modal closes → focus returns to trigger button
- Error occurs → no focus change (user stays in form)

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| Validation failure (client) | Show field-specific error below input | "Company name is required" |
| Validation failure (server) | Show alert + field errors | "Validation failed" + field errors |
| Duplicate email | Show error alert | "A subcontractor with email X already exists" |
| Network error | Show error alert | "An unexpected error occurred. Please try again." |
| Unauthorized | Show error alert | "Insufficient permissions" |
| Deactivation with active projects | Show error alert | "Cannot deactivate. Assigned to N active projects" |

---

## Mobile-Specific Considerations

### Bottom Drawer Behavior
- Initial snap point: "half" (50% viewport height)
- Snap points: ["half", "full"]
- Drag threshold: 50px downward to dismiss
- Backdrop: Semi-transparent dark overlay

### Touch Interactions
- Star rating: 44px x 44px minimum per star
- Buttons: min-h-[44px] min-w-[44px]
- Dropdown triggers: min-h-[44px]
- Action menu (3-dot): 44px x 44px

### Safe Areas
- Bottom drawer respects `pb-[env(safe-area-inset-bottom)]`
- Fixed elements avoid notch areas

---

## Performance Considerations

### Code Splitting
- SubcontractorModal dynamically imported: `dynamic(() => import('./SubcontractorModal'), { ssr: false })`
- Modal only loads when first opened
- Reduces initial page bundle size

### Memoization
- SubcontractorCard: Wrap with `memo()` to prevent re-renders
- Form sections: Consider memoizing if performance issues arise

### Revalidation
- After create/update/deactivate: `revalidatePath('/app/team/subcontractors')`
- Server Actions handle revalidation automatically
- No manual cache invalidation needed in components

---

## Migration Path

### Phase 1: Create New Modal
1. Create `components/team/SubcontractorModal.tsx`
2. Extract form sections into separate components
3. Implement ResponsiveModal wrapper
4. Add success/error alert components (match TaskModal pattern)

### Phase 2: Update SubcontractorCard
1. Add `onEdit` prop
2. Remove local modal state
3. Call `onEdit(subcontractor)` instead of opening local modal

### Phase 3: Update SubcontractorList
1. Add modal state (mode, isOpen, editingSubcontractor)
2. Replace AddSubcontractorModal with new SubcontractorModal
3. Pass `onEdit` callback to SubcontractorCard
4. Single modal instance for both create and edit

### Phase 4: Cleanup
1. Delete `AddSubcontractorModal.tsx`
2. Delete `EditSubcontractorModal.tsx`
3. Update imports

---

## Security Considerations
- RLS enforces company isolation (existing behavior maintained)
- Role checks in Server Actions (admin/PM for create/edit, admin for deactivate)
- No sensitive data in client state (form data only during editing)
- CSRF protection via Server Actions (automatic)

---

## Testing Checklist

### Desktop (≥768px)
- [ ] Modal opens as centered dialog
- [ ] Modal has max-width of 3xl (768px)
- [ ] Title size is text-5xl
- [ ] Blueprint grid visible at 0.03 opacity
- [ ] Form sections clearly separated

### Mobile (<768px)
- [ ] Modal opens as bottom drawer
- [ ] Drawer can be dragged to dismiss
- [ ] Title size is text-2xl
- [ ] All touch targets ≥44px
- [ ] Drawer respects safe areas

### Form Functionality
- [ ] Create mode: Empty form, submit calls createSubcontractor
- [ ] Edit mode: Pre-populated form, submit calls updateSubcontractor
- [ ] Required fields prevent submission when empty
- [ ] Star rating: Click to set/unset
- [ ] Phone input formats correctly
- [ ] Success state shows for 1000ms then closes

### Permissions
- [ ] Admin/PM: See "Add Subcontractor" button
- [ ] Worker/Foreman: No add button
- [ ] Admin: Can deactivate
- [ ] PM: Cannot deactivate

### Dark Mode
- [ ] All backgrounds respect dark mode
- [ ] Text contrast ≥4.5:1
- [ ] Icons visible in dark mode

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to tasks)
