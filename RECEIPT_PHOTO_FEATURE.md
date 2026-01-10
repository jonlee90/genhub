# Receipt Photo Upload Feature for Tasks

## Overview

Added receipt photo upload functionality to the task module, allowing users to attach receipt photos when creating or editing tasks. This feature is especially useful for purchase-type tasks and provides documentation similar to the expense module.

## Implementation Summary

### 1. Database Migration

**File:** `supabase/migrations/20260101_add_receipt_photo_to_tasks.sql`

Added `receipt_photo_url` column to the `tasks` table:

```sql
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS receipt_photo_url text;

COMMENT ON COLUMN public.tasks.receipt_photo_url IS 'URL to receipt photo uploaded by user for task documentation (especially for purchase tasks)';
```

**Status:** Migration file created, needs to be applied via MCP Supabase

### 2. New Component: TaskReceiptUpload

**File:** `components/tasks/TaskReceiptUpload.tsx`

A reusable component for uploading or capturing receipt photos with the following features:

- **File Upload**: Upload from device gallery
- **Camera Capture**: Take photo directly (mobile/PWA support via `capture="environment"`)
- **Image Preview**: Show preview with remove option
- **Loading States**: Processing indicator while loading image
- **Construction Theme**: Matches GenHub design system (#001B51 primary color, Lucide icons)
- **Responsive**: Works on desktop and mobile with compact mode option
- **Accessibility**: Proper aria-labels and keyboard navigation

**Props:**
- `receiptUrl`: Optional existing receipt URL
- `onReceiptChange`: Callback when receipt changes (file, preview URL)
- `disabled`: Disable upload during form submission
- `showLabel`: Show/hide label (default: true)
- `compact`: Use compact layout (default: false)

### 3. Updated CreateTaskForm

**File:** `components/tasks/CreateTaskForm.tsx`

**Changes:**
- Added import for `TaskReceiptUpload` component
- Added state for receipt file and preview:
  ```tsx
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  ```
- Integrated `TaskReceiptUpload` component after cost fields
- Added hidden input for `receipt_photo_url` in form submission

**Location:** After planned cost field, before navigation buttons (Step 2: Details)

### 4. Updated TaskModal

**File:** `components/tasks/TaskModal.tsx`

**Changes:**
- Added import for `TaskReceiptUpload` component
- Added state for receipt with initialization from existing task:
  ```tsx
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(() => {
    if (mode === 'edit' && task?.receipt_photo_url) return task.receipt_photo_url;
    return null;
  });
  ```
- Updated `handleSubmit` to include `receipt_photo_url` in form data
- Integrated `TaskReceiptUpload` component after cost fields

**Location:** After costs row, before materials section

### 5. Updated Server Actions

**File:** `app/actions/tasks.ts`

**Schema Updates:**
- **createTaskSchema**: Added `receipt_photo_url` field with URL validation
- **updateTaskSchema**: Added `receipt_photo_url` field with URL validation

**createTask Function:**
- Added `receipt_photo_url` to `rawData` parsing from FormData
- Added `receipt_photo_url` to `taskData` insert object
- Field is optional and nullable (set to null if not provided)

**updateTask Function:**
- Schema already updated to support `receipt_photo_url` field
- Will handle updates when form includes receipt URL

## Design Decisions

### 1. Construction-Themed Design

The upload component follows GenHub's construction industry theme:
- **Primary Color**: #001B51 (Navy Blue) for active states
- **Icons**: Lucide icons (Upload, Camera, X, FileText)
- **Hover States**: Blue highlights on upload buttons
- **Borders**: Dashed borders for upload areas (matches expense module)

### 2. Similar to Expense Module

Intentionally designed to match the expense receipt upload UX:
- Same two-button layout (Upload File / Take Photo)
- Same preview with remove button
- Same processing indicator
- Consistent spacing and sizing

### 3. Mobile-First PWA Support

- **Camera Capture**: Uses `capture="environment"` attribute for direct camera access on mobile
- **Touch-Friendly**: Large tap targets (p-6 sm:p-8 on buttons)
- **Responsive Grid**: 1 column on mobile, 2 columns on desktop for upload buttons
- **Compact Mode**: Optional compact layout for tighter spaces

### 4. Accessibility

- Proper `aria-label` attributes on file inputs
- Hidden file inputs with button triggers for better UX
- Semantic HTML structure
- Keyboard-accessible buttons

## Usage Examples

### Basic Usage (CreateTaskForm)

```tsx
<TaskReceiptUpload
  receiptUrl={receiptPreview}
  onReceiptChange={(file, preview) => {
    setReceiptFile(file);
    setReceiptPreview(preview);
  }}
  disabled={isPending}
  showLabel={true}
/>
```

### With Existing Receipt (TaskModal Edit Mode)

```tsx
const [receiptPreview, setReceiptPreview] = useState<string | null>(() => {
  if (mode === 'edit' && task?.receipt_photo_url) return task.receipt_photo_url;
  return null;
});

<TaskReceiptUpload
  receiptUrl={receiptPreview}
  onReceiptChange={(file, preview) => {
    setReceiptFile(file);
    setReceiptPreview(preview);
  }}
  disabled={isPending}
  showLabel={true}
  compact={false}
/>
```

### Compact Mode

```tsx
<TaskReceiptUpload
  receiptUrl={receiptPreview}
  onReceiptChange={handleReceiptChange}
  showLabel={false}
  compact={true}
/>
```

## Testing Checklist

- [ ] **Database Migration**: Apply migration via MCP Supabase and regenerate types
- [ ] **Create Task**: Upload receipt when creating a new task
- [ ] **Edit Task**: Upload receipt when editing an existing task
- [ ] **Update Task**: Change existing receipt photo
- [ ] **Remove Receipt**: Delete uploaded receipt photo
- [ ] **Camera Capture**: Test camera capture on mobile device
- [ ] **File Upload**: Test file upload from gallery
- [ ] **Preview**: Verify image preview displays correctly
- [ ] **Form Submission**: Verify receipt URL is included in form data
- [ ] **Database**: Verify receipt_photo_url is saved to tasks table
- [ ] **Task Display**: Verify receipt photo displays when viewing task
- [ ] **Responsive**: Test on mobile, tablet, and desktop
- [ ] **Accessibility**: Test keyboard navigation and screen readers

## Next Steps

1. **Apply Database Migration**:
   ```bash
   # Use MCP Supabase to apply migration
   mcp__supabase__apply_migration name:"add_receipt_photo_to_tasks" query:"<migration SQL>"

   # Regenerate TypeScript types
   npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
   ```

2. **Upload Handling** (Future Enhancement):
   - Currently stores base64 data URL directly
   - Should upload to Supabase Storage and store public URL
   - Add upload function in server action:
     ```tsx
     // In real implementation:
     const receiptUrl = await uploadReceiptToStorage(receiptFile);
     formData.append('receipt_photo_url', receiptUrl);
     ```

3. **OCR Processing** (Future Enhancement):
   - Add AI OCR processing for receipt data extraction
   - Extract vendor, amount, line items
   - Auto-populate task fields from receipt data
   - Similar to expense receipt OCR

4. **Display in Task Detail**:
   - Add receipt photo display in task detail view
   - Show thumbnail with click to expand
   - Add download/share options

## Files Modified

1. `supabase/migrations/20260101_add_receipt_photo_to_tasks.sql` (NEW)
2. `components/tasks/TaskReceiptUpload.tsx` (NEW)
3. `components/tasks/CreateTaskForm.tsx` (MODIFIED)
4. `components/tasks/TaskModal.tsx` (MODIFIED)
5. `app/actions/tasks.ts` (MODIFIED)

## Dependencies

- `framer-motion`: Animations for upload transitions
- `lucide-react`: Icons (Upload, Camera, X, FileText, Loader2)
- `next/image`: Image preview display
- `zod`: Schema validation for receipt_photo_url

## Configuration

No additional configuration needed. The feature works with existing:
- Tailwind CSS configuration (construction theme colors)
- Next.js Image configuration (for preview display)
- Form handling patterns (FormData submission)

## Notes

- Receipt photos are optional for all task types
- Especially useful for `purchase` task type to document purchase orders
- Can be used for any task to attach supporting documentation
- Follows the same patterns as the expense module for consistency
- In production, should integrate with Supabase Storage for file uploads
- Current implementation uses base64 data URLs (temporary solution for POC)

---

**Implementation Date**: January 1, 2026
**Developer**: Claude (via frontend-design skill)
**Status**: Complete (pending migration application)
