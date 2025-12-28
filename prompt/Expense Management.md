We are building a next js project based on an existing next js template that have auth, payment built already, below are rules you have to follow:

<frontend rules>
1. MUST Use 'use client' directive for client-side components; In Next.js, page components are server components by default, and React hooks like useEffect can only be used in client components.
2. The UI has to look great, using polished component from aceternity, tailwind when possible; Don't recreate aceternity components, make sure you use 'aceternity@latest add xxx' CLI to add components
3. MUST adding debugging log & comment for every single feature we implement
4. Make sure to concatenate strings correctly using backslash
7. Use stock photos from picsum.photos where appropriate, only valid URLs you know exist
8. Don't update aceternity components unless otherwise specified
9. Configure next.config.js image remotePatterns to enable stock photos from picsum.photos
11. MUST implement the navigation elements items in their rightful place i.e. Left sidebar, Top header
12. Accurately implement necessary grid layouts
13. Follow proper import practices:
   - Use @/ path aliases
   - Keep component imports organized
   - Update current src/app/page.tsx with new comprehensive code
   - Don't forget root route (page.tsx) handling
   - You MUST complete the entire prompt before stopping
</frontend rules>

<styling_requirements>
- You ALWAYS tries to use the aceternity/ui library.
- You MUST USE the builtin Tailwind CSS variable based colors as used in the examples, like bg-primary or text-primary-foreground.
- You DOES NOT use indigo or blue colors unless specified in the prompt.
- You MUST generate responsive designs.
- The React Code Block is rendered on top of a white background. If v0 needs to use a different background color, it uses a wrapper element with a background color Tailwind class.
</styling_requirements>

<frameworks_and_libraries>
- You prefers Lucide React for icons, and aceternity/ui for components.
- You MAY use other third-party libraries if necessary or requested by the user.
- You imports the aceternity/ui components from "@/components/ui"
- You DOES NOT use fetch or make other network requests in the code.
- You DOES NOT use dynamic imports or lazy loading for components or libraries. Ex: const Confetti = dynamic(...) is NOT allowed. Use import Confetti from 'react-confetti' instead.
- Prefer using native Web APIs and browser features when possible. For example, use the Intersection Observer API for scroll-based animations or lazy loading.
</frameworks_and_libraries>

# Expense Management Implementation Guide

## Task
Implement the Expense Management feature for GenHub PWA, enabling users to submit expenses with receipts, have them reviewed/approved, and see them linked to tasks/materials/budget.

---

## Implementation Steps

### 1. **Database Preparation**

- Ensure the following tables exist in Supabase (add columns if missing):

```sql
create table expense (
  id identity primary key,
  user_id uuid not null references user(id),
  amount numeric not null,
  category text not null,
  status text not null default 'submitted', -- 'submitted', 'reviewed', 'approved', 'rejected'
  receipt_url text,
  linked_task_id integer references task(id),
  linked_material_id integer references material(id),
  description text,
  reviewer_id uuid references user(id),
  reviewed_at timestamp with time zone,
  approved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
```

- **Debug log:**  
  - Log table creation/migration output.
  - Log any errors if columns are missing or fail to migrate.

---

### 2. **API & Server Actions**

- **Create server actions in `app/actions/expenses.ts`:**
  - `createExpense`
  - `reviewExpense`
  - `approveExpense`
  - `rejectExpense`
  - `getExpensesForUser`
  - `getExpensesForReview`

- **Example: `createExpense`**
  ```typescript
  // app/actions/expenses.ts
  import { getSupabaseClient } from '@/utils/supabase/server';

  export async function createExpense({ userId, amount, category, receiptUrl, linkedTaskId, linkedMaterialId, description }) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('expense').insert([{
      user_id: userId,
      amount,
      category,
      receipt_url: receiptUrl,
      linked_task_id: linkedTaskId,
      linked_material_id: linkedMaterialId,
      description,
      status: 'submitted'
    }]).select().single();

    if (error) {
      console.log('[EXPENSE][CREATE][ERROR]', error);
      throw error;
    }
    console.log('[EXPENSE][CREATE][SUCCESS]', data);
    return data;
  }
  ```
- **Debug log:**  
  - Log all API calls with `[EXPENSE][ACTION][STATUS]` format.
  - Log input params and returned data/errors.

---

### 3. **Expense Submission UI**

- **Page:** `app/app/expenses/page.tsx`
- **Component:** `components/expenses/ExpenseForm.tsx`
- **UI Requirements:**
  - Use aceternity/ui `Form`, `Input`, `Textarea`, `Select`, and `Button`.
  - Use aceternity/ui `Dropzone` for receipt upload.
  - Use Tailwind variable colors (`bg-primary`, `text-primary-foreground`, etc.).
  - Responsive: single column on mobile, two columns on desktop.
  - Show a preview of uploaded receipt.
  - Show linked task/material selectors (dropdowns populated from Supabase).
  - Show clear error/success messages (use aceternity/ui `Alert`).

- **Debug log:**  
  - Log form submission start, success, and error.
  - Log uploaded file info and Supabase storage response.

---

### 4. **Receipt Upload & AI OCR Integration**

- **Component:** `components/expenses/ReceiptUpload.tsx`
- **Implementation:**
  - Use aceternity/ui `Dropzone` for file upload.
  - On file drop, upload to Supabase Storage (bucket: `receipts`).
  - After upload, call AI OCR utility (`utils/ai.ts`) to extract amount/category.
  - Autofill form fields with OCR result (if available).
  - Show loading state during OCR.
  - Show extracted data and allow user to edit.

- **Debug log:**  
  - Log file upload start, progress, and completion.
  - Log OCR request/response and any errors.

---

### 5. **Expense List & Review Table**

- **Component:** `components/expenses/ExpenseTable.tsx`
- **Page:** `app/app/expenses/page.tsx`
- **UI Requirements:**
  - Use aceternity/ui `Table` for listing expenses.
  - Columns: Date, Amount, Category, Status, Linked Task/Material, Receipt (thumbnail), Actions.
  - Status badge: color-coded (`bg-primary` for approved, `bg-muted` for submitted, etc.).
  - Actions: View, Review (if reviewer), Approve/Reject (modal).
  - Responsive: horizontal scroll on mobile.

- **Debug log:**  
  - Log table data fetch start, success, and error.
  - Log action button clicks and modal opens.

---

### 6. **Expense Review Modal**

- **Component:** `components/expenses/ExpenseReviewModal.tsx`
- **UI Requirements:**
  - Use aceternity/ui `Dialog` for modal.
  - Show all expense details, receipt image, and linked items.
  - Approve/Reject buttons (aceternity/ui `Button`).
  - Optional: comment box for reviewer.
  - On action, call `reviewExpense`/`approveExpense`/`rejectExpense` server action.

- **Debug log:**  
  - Log modal open/close.
  - Log approve/reject action start, success, and error.

---

### 7. **Linking Expenses to Tasks/Materials**

- **In ExpenseForm:**
  - Fetch tasks/materials for the user from Supabase.
  - Use aceternity/ui `Select` to allow linking.
  - On submit, store `linked_task_id` and/or `linked_material_id`.

- **Debug log:**  
  - Log fetch of tasks/materials.
  - Log selected values.

---

### 8. **Expense Status Updates & Notifications**

- **On status change (approve/reject):**
  - Update `status` in Supabase.
  - Optionally, trigger notification (call notification action in `app/actions/notifications.ts`).

- **Debug log:**  
  - Log status update action and notification trigger.

---

### 9. **Styling & Responsiveness**

- **All UI must:**
  - Use aceternity/ui components.
  - Use Tailwind variable colors (e.g., `bg-primary`, `text-primary-foreground`).
  - Be fully responsive (test on mobile and desktop).
  - Use Lucide icons for actions (e.g., `Check`, `X`, `FileText`).

---

### 10. **Error Handling & User Feedback**

- **All forms and actions:**
  - Show clear error messages using aceternity/ui `Alert`.
  - Show loading spinners during async actions.
  - Show success toast/snackbar on completion.

- **Debug log:**  
  - Log all errors with context (action, params, error object).

---

## **Summary Table of Components/Files**

| File/Component                                 | Purpose                                 |
|------------------------------------------------|-----------------------------------------|
| `app/app/expenses/page.tsx`                    | Expense dashboard page                  |
| `components/expenses/ExpenseForm.tsx`          | Expense submission form                 |
| `components/expenses/ReceiptUpload.tsx`        | Receipt upload & OCR                    |
| `components/expenses/ExpenseTable.tsx`         | List of expenses                        |
| `components/expenses/ExpenseReviewModal.tsx`   | Modal for reviewing/approving expenses  |
| `app/actions/expenses.ts`                      | Server actions for expense CRUD         |
| `utils/ai.ts`                                  | AI OCR utility for receipts             |

---

## **Developer Constraints & Guidelines**

- **Do not** use any UI library except aceternity/ui and Lucide icons.
- **Do not** use indigo/blue colors unless specified.
- **Do not** use fetch directly; always use Supabase client utilities.
- **Do not** use dynamic imports.
- **Always** log all async actions and errors for debugging.
- **Always** use responsive layouts and variable-based Tailwind colors.
- **All file uploads** must go to Supabase Storage, not local or third-party.
- **All expense actions** must be protected by auth (middleware already in place).

---

## **Example Debug Log Statements**

- `[EXPENSE][CREATE][START]` – when form is submitted
- `[EXPENSE][CREATE][SUCCESS]` – on successful insert
- `[EXPENSE][CREATE][ERROR]` – on error
- `[EXPENSE][RECEIPT][UPLOAD][START]` – on file upload start
- `[EXPENSE][RECEIPT][UPLOAD][SUCCESS]` – on upload success
- `[EXPENSE][OCR][START]` – on OCR request
- `[EXPENSE][OCR][RESULT]` – on OCR result
- `[EXPENSE][REVIEW][APPROVE][START]` – on approve click
- `[EXPENSE][REVIEW][APPROVE][SUCCESS]` – on approve success
- `[EXPENSE][REVIEW][REJECT][START]` – on reject click
- `[EXPENSE][REVIEW][REJECT][SUCCESS]` – on reject success

---

**Ready for implementation.**  
Follow the above steps and constraints for a robust, beautiful, and debuggable Expense Management feature.