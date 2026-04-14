# Subcontractor ↔ Expense Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bidirectionally sync subcontractor payments and expenses — recording a payment auto-creates an expense (Flow A), and creating an expense with a subcontractor auto-creates a contract + payment (Flow B).

**Architecture:** A `skipExpenseSync` flag on `createPayment()` breaks the loop between the two flows. Two new nullable FK columns on `expenses` (`subcontractor_payment_id`, `subcontractor_id`) serve as the bidirectional links. The financial summary is simplified to expenses-only, eliminating double-counting.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL), Server Actions, React Hook Form, Zod, Lucide icons, `ResponsiveModal`, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/20260413100001_add_subcontractor_expense_link.sql` | CREATE — add two FK columns to expenses + backfill migration |
| `app/actions/subcontractor-payments.ts` | MODIFY — add `skipExpenseSync` flag + Flow A expense auto-creation |
| `app/actions/expenses.ts` | MODIFY — add `subcontractor_id` to schema + Flow B contract/payment sync |
| `app/actions/project-financials.ts` | MODIFY — remove subcontractor_payments query, simplify to expenses-only |
| `components/expenses/CreateExpenseModal.tsx` | MODIFY — add subcontractor picker combobox |
| `types/db/` | REGENERATE — `npm run db:gen-types` after migration |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260413100001_add_subcontractor_expense_link.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260413100001_add_subcontractor_expense_link.sql

-- Add FK linking expense → the payment that created it (Flow A)
-- Also used by Flow B to link the auto-created payment back to this expense
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS subcontractor_payment_id UUID
  REFERENCES public.subcontractor_payments(id) ON DELETE SET NULL;

-- Add FK linking expense → a specific subcontractor (Flow B trigger)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS subcontractor_id UUID
  REFERENCES public.subcontractors(id) ON DELETE SET NULL;

-- Index for fast lookups by payment (checking for duplicates in Flow A)
CREATE INDEX IF NOT EXISTS idx_expenses_subcontractor_payment_id
  ON public.expenses(subcontractor_payment_id)
  WHERE subcontractor_payment_id IS NOT NULL;

-- Index for fast lookups by subcontractor
CREATE INDEX IF NOT EXISTS idx_expenses_subcontractor_id
  ON public.expenses(subcontractor_id)
  WHERE subcontractor_id IS NOT NULL;

-- Backfill expense for the existing $200 payment
INSERT INTO public.expenses (
  company_id, project_id, description, amount, category,
  expense_date, vendor_name, status, submitted_by, submitted_at,
  ocr_processed, subcontractor_payment_id, subcontractor_id
)
SELECT
  sc.company_id,
  sc.project_id,
  'Payment to ' || s.company_name AS description,
  sp.amount,
  'labor'::expense_category,
  sp.payment_date,
  s.company_name,
  'approved'::expense_status,
  sc.created_by,
  now(),
  false,
  sp.id,
  s.id
FROM public.subcontractor_payments sp
JOIN public.subcontractor_contracts sc ON sc.id = sp.contract_id
JOIN public.subcontractors s ON s.id = sc.subcontractor_id
WHERE sp.id = '131559a8-fa1a-4a6a-be52-7254746a3067'
  AND NOT EXISTS (
    SELECT 1 FROM public.expenses e WHERE e.subcontractor_payment_id = sp.id
  );
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected output: migration applied successfully, no errors.

- [ ] **Step 3: Verify columns exist**

```bash
npx supabase db inspect --schema public | grep -A5 "expenses"
```

Confirm `subcontractor_payment_id` and `subcontractor_id` appear on the `expenses` table.

- [ ] **Step 4: Regenerate TypeScript types**

```bash
npm run db:gen-types
```

Expected: `types/db/` files updated. The `ExpensesRow` type should now include `subcontractor_payment_id: string | null` and `subcontractor_id: string | null`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260413100001_add_subcontractor_expense_link.sql types/db/
git commit -m "feat: add subcontractor_payment_id and subcontractor_id FKs to expenses"
```

---

## Task 2: Flow A — Payment Auto-Creates Expense

**Files:**
- Modify: `app/actions/subcontractor-payments.ts`

- [ ] **Step 1: Update `createPaymentSchema` and `createPayment()` signature**

Add `skipExpenseSync` as an optional boolean to the input. Because this is an internal flag (never sent from a form), add it directly to the function parameter type without adding it to the Zod schema:

In `app/actions/subcontractor-payments.ts`, update the `createPayment` function signature from:
```typescript
export async function createPayment(
  input: z.infer<typeof createPaymentSchema>,
)
```
to:
```typescript
export async function createPayment(
  input: z.infer<typeof createPaymentSchema> & { skipExpenseSync?: boolean },
)
```

- [ ] **Step 2: Add the auto-expense-creation block after the payment insert**

After the existing `revalidatePath(...)` call in `createPayment()`, add this block. The full updated function body from the payment insert to the end of the try block should look like:

```typescript
    // Insert payment regardless of overpayment (caller warned via return flag)
    const { data: payment, error } = await userContext.supabase
      .from("subcontractor_payments" as any)
      .insert({
        company_id: userContext.companyId,
        contract_id: validated.contractId,
        amount: validated.amount,
        payment_date: validated.paymentDate,
        payment_method: validated.paymentMethod,
        notes: validated.notes ?? null,
        created_by: userContext.userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createPayment] Insert error:", error);
      return { success: false, error: "Failed to record payment" };
    }

    revalidatePath(`/app/projects/${(contract as any).project_id}`);

    // Flow A: auto-create a linked expense unless caller opted out
    if (!input.skipExpenseSync) {
      // Fetch the subcontractor name via the contract
      const { data: contractDetail } = await userContext.supabase
        .from("subcontractor_contracts" as any)
        .select("subcontractor_id, subcontractors!inner(company_name)")
        .eq("id", validated.contractId)
        .single();

      if (contractDetail) {
        const sub = (contractDetail as any).subcontractors as {
          company_name: string;
        };
        const description = validated.notes
          ? `Payment to ${sub.company_name} - ${validated.notes}`
          : `Payment to ${sub.company_name}`;

        const { error: expenseError } = await userContext.supabase
          .from("expenses")
          .insert({
            company_id: userContext.companyId,
            project_id: (contract as any).project_id,
            description,
            amount: validated.amount,
            category: "labor" as const,
            expense_date: validated.paymentDate,
            vendor_name: sub.company_name,
            subcontractor_id: (contractDetail as any).subcontractor_id,
            status: "approved" as const,
            submitted_by: userContext.userId,
            submitted_at: new Date().toISOString(),
            ocr_processed: false,
            subcontractor_payment_id: (payment as any).id,
          });

        if (expenseError) {
          console.error("[createPayment] Failed to auto-create expense:", expenseError);
          // Best-effort: payment already inserted, return success with warning
        }
      }
    }

    return { success: true, data: { id: (payment as any).id, isOverpayment } };
```

- [ ] **Step 3: TypeScript check**

```bash
npm run lint:ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/actions/subcontractor-payments.ts
git commit -m "feat: auto-create expense when subcontractor payment recorded (Flow A)"
```

---

## Task 3: Flow B — Expense Auto-Creates Contract + Payment

**Files:**
- Modify: `app/actions/expenses.ts`

- [ ] **Step 1: Add `subcontractor_id` to `createExpenseSchema`**

Find `createExpenseSchema` in `app/actions/expenses.ts` and add the field:

```typescript
const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .number()
    .refine((n) => n !== 0, { message: "Amount cannot be zero" }),
  category: z.enum([
    "materials",
    "labor",
    "equipment",
    "permits",
    "transportation",
    "meals",
    "lodging",
    "other",
  ]),
  expense_date: z.string(),
  project_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  vendor_address: z.string().optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  store_account: z.string().optional().nullable(),
  subcontractor_id: z.string().uuid().optional().nullable(),  // NEW
});
```

- [ ] **Step 2: Pass `subcontractor_id` through to the expense insert**

In `createExpense()`, the insert block spreads `validated`. Since `subcontractor_id` is now part of `validated`, it will be included automatically when present. No change needed to the insert call itself — the spread `...validated` already handles it.

Verify the insert call looks like this (no changes needed, just confirm):
```typescript
    const { data: expense, error } = await userContext.supabase
      .from("expenses")
      .insert({
        ...validated,
        company_id: userContext.companyId,
        submitted_by: userContext.userId,
        status: "approved",
      })
      .select()
      .single();
```

- [ ] **Step 3: Add Flow B sync block after the expense insert**

Add the following block after the `if (error) { ... return ... }` check and before the notification block in `createExpense()`:

```typescript
    // Flow B: if subcontractor_id provided, find/create contract and add payment
    if (validated.subcontractor_id && validated.project_id) {
      try {
        // Look up existing active contract for this subcontractor + project
        const { data: existingContract } = await userContext.supabase
          .from("subcontractor_contracts" as any)
          .select("id")
          .eq("subcontractor_id", validated.subcontractor_id)
          .eq("project_id", validated.project_id)
          .eq("company_id", userContext.companyId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let contractId: string;

        if (existingContract) {
          contractId = (existingContract as any).id;
        } else {
          // Create a new contract with contract_amount = expense amount
          const { data: newContract, error: contractError } =
            await userContext.supabase
              .from("subcontractor_contracts" as any)
              .insert({
                company_id: userContext.companyId,
                project_id: validated.project_id,
                subcontractor_id: validated.subcontractor_id,
                contract_amount: Math.abs(validated.amount),
                status: "active",
                phase: null,
                notes: null,
                created_by: userContext.userId,
              })
              .select("id")
              .single();

          if (contractError || !newContract) {
            console.error("[createExpense] Failed to create contract for Flow B:", contractError);
            // Best-effort — expense already saved
            return { success: true, data: expense };
          }

          contractId = (newContract as any).id;
        }

        // Insert payment with skipExpenseSync: true to prevent loop
        const { createPayment } = await import(
          "@/app/actions/subcontractor-payments"
        );
        const paymentResult = await createPayment({
          contractId,
          amount: Math.abs(validated.amount),
          paymentDate: validated.expense_date,
          paymentMethod: "expense",
          notes: validated.description,
          skipExpenseSync: true,
        });

        if (paymentResult.success && paymentResult.data) {
          // Link the expense back to the payment we just created
          await userContext.supabase
            .from("expenses")
            .update({ subcontractor_payment_id: paymentResult.data.id })
            .eq("id", expense.id);
        } else {
          console.error("[createExpense] Failed to create payment for Flow B:", paymentResult.error);
          // Best-effort — expense already saved
        }
      } catch (syncError) {
        console.error("[createExpense] Flow B sync error:", syncError);
        // Best-effort — expense already saved
      }
    }
```

- [ ] **Step 4: TypeScript check**

```bash
npm run lint:ts
```

Expected: no errors. If you get a type error on `subcontractor_id` in the insert (the DB type may not yet know about the new column), cast the insert object: `...(validated.subcontractor_id ? { subcontractor_id: validated.subcontractor_id } : {})`.

- [ ] **Step 5: Commit**

```bash
git add app/actions/expenses.ts
git commit -m "feat: auto-create subcontractor contract and payment when expense created (Flow B)"
```

---

## Task 4: Fix Financial Summary

**Files:**
- Modify: `app/actions/project-financials.ts`

- [ ] **Step 1: Remove the subcontractor_payments query from `getProjectFinancialSummary`**

Replace the entire function body with the simplified version:

```typescript
export async function getProjectFinancialSummary(
  projectId: string,
): Promise<{ success: boolean; data?: FinancialSummary; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const [budgetResult, expensesResult] = await Promise.all([
      // Most recent budget for the project
      userContext.supabase
        .from("budgets" as any)
        .select("total_amount")
        .eq("project_id", projectId)
        .eq("company_id", userContext.companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Approved/paid expenses for the project (includes auto-created payment expenses)
      userContext.supabase
        .from("expenses")
        .select("amount")
        .eq("project_id", projectId)
        .eq("company_id", userContext.companyId)
        .in("status", ["approved", "paid"]),
    ]);

    const totalBudget = (budgetResult.data as any)?.total_amount ?? 0;
    const hasBudget = !!budgetResult.data;

    const totalSpent = (expensesResult.data || []).reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );

    const totalUsed = totalSpent;
    const netRemaining = totalBudget - totalUsed;
    const percentUsed = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

    return {
      success: true,
      data: {
        totalBudget,
        totalSpent,
        subPayments: 0,  // Kept for interface compatibility; always 0 now
        netRemaining,
        hasBudget,
        percentUsed,
      },
    };
  } catch (error) {
    console.error("[getProjectFinancialSummary] Unexpected error:", error);
    return { success: false, error: "Failed to fetch financial summary" };
  }
}
```

Also update the comment on the function:

```typescript
/**
 * Aggregate financial summary for a project
 * Expenses are the single source of truth — subcontractor payments
 * are auto-created as expenses and counted here.
 */
```

- [ ] **Step 2: TypeScript check**

```bash
npm run lint:ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/actions/project-financials.ts
git commit -m "fix: remove double-count by removing subcontractor_payments from financial summary"
```

---

## Task 5: Subcontractor Picker UI in CreateExpenseModal

**Files:**
- Modify: `components/expenses/CreateExpenseModal.tsx`

- [ ] **Step 1: Add subcontractor state and import**

At the top of `CreateExpenseModal`, add the import for the server action and the state:

```typescript
import { getSubcontractorsByCompany } from "@/app/actions/subcontractors";
import { Building2 } from "lucide-react";
```

Add state variables after the existing state declarations:

```typescript
  const [subcontractors, setSubcontractors] = useState<
    Array<{ id: string; company_name: string; contact_name: string }>
  >([]);
  const [subcontractorLoading, setSubcontractorLoading] = useState(false);
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<
    string | null
  >(null);
```

- [ ] **Step 2: Load subcontractors when a project is selected**

After the existing `useEffect` that loads vendor options (look for `getVendorOptions`), add:

```typescript
  // Load subcontractors when project is selected
  useEffect(() => {
    if (!selectedProject) {
      setSubcontractors([]);
      return;
    }
    setSubcontractorLoading(true);
    getSubcontractorsByCompany()
      .then((result) => {
        if (result.success && result.data) {
          setSubcontractors(result.data);
        }
      })
      .finally(() => setSubcontractorLoading(false));
  }, [selectedProject]);
```

- [ ] **Step 3: Add `subcontractor_id` to form default values and the submit handler**

In the `useValidatedForm` `defaultValues`, add:
```typescript
      subcontractor_id: null as string | null,
```

In the `onSubmit` handler, find the `createExpense(...)` call and add `subcontractor_id`:

```typescript
      const result = await createExpense({
        description: data.description,
        amount: data.amount,
        category: data.category,
        expense_date: data.expense_date,
        project_id: data.project_id || undefined,
        task_id: data.task_id || undefined,
        vendor_name: data.vendor_name || undefined,
        payment_method: paymentMethod || undefined,
        store_account: storeAccount || undefined,
        subcontractor_id: selectedSubcontractorId || undefined,
      });
```

- [ ] **Step 4: Add the subcontractor picker field to the form JSX**

Find the vendor section in the JSX (the `<VendorCombobox>` block). Add the subcontractor picker immediately **above** the vendor name field, rendered only when a project is selected:

```tsx
                {/* Subcontractor Picker — only when project is selected */}
                {selectedProject && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="subcontractor_id"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Subcontractor
                    </Label>
                    <div className="relative">
                      <select
                        id="subcontractor_id"
                        className="w-full min-h-[44px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001B51] disabled:opacity-50"
                        value={selectedSubcontractorId ?? ""}
                        disabled={subcontractorLoading}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          setSelectedSubcontractorId(val);
                          if (val) {
                            const sub = subcontractors.find(
                              (s) => s.id === val,
                            );
                            if (sub) {
                              setValue("vendor_name", sub.company_name);
                            }
                          }
                        }}
                      >
                        <option value="">
                          {subcontractorLoading
                            ? "Loading..."
                            : "None (optional)"}
                        </option>
                        {subcontractors.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedSubcontractorId && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        A payment will be auto-added to this subcontractor&apos;s
                        contract.
                      </p>
                    )}
                  </div>
                )}
```

- [ ] **Step 5: Reset subcontractor selection on modal close**

In the modal's close/reset handler (where other state is reset), add:
```typescript
    setSelectedSubcontractorId(null);
```

- [ ] **Step 6: TypeScript check**

```bash
npm run lint:ts
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/expenses/CreateExpenseModal.tsx
git commit -m "feat: add subcontractor picker to CreateExpenseModal for auto-contract sync"
```

---

## Task 6: Verify Build Passes

- [ ] **Step 1: Run TypeScript check**

```bash
npm run lint:ts
```

Expected: no errors.

- [ ] **Step 2: Run ESLint**

```bash
npm run lint
```

Expected: no errors or only pre-existing warnings.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build completes successfully. No type errors, no missing imports.

- [ ] **Step 4: Manual verification checklist**

1. Apply migration → confirm `expenses.subcontractor_payment_id` and `expenses.subcontractor_id` columns exist
2. Confirm the existing $200 payment (id: `131559a8-fa1a-4a6a-be52-7254746a3067`) has a matching expense in the `expenses` table
3. **Flow A:** In the Subcontractor Contracts UI, record a new payment → navigate to project Expenses tab → verify an expense appeared with `vendor_name = subcontractor company name` and `status = approved`
4. **Flow B:** In the Expenses tab, create a new expense and select a subcontractor → navigate to Subcontractor Contracts → verify a payment was added to that subcontractor's contract (new contract created if none existed)
5. **No loop:** Confirm only one expense per payment and one payment per expense — no duplicate rows
6. **Financial summary:** Open a project → confirm total spend equals expenses-only (no double-count from sub payments)
7. Delete a payment → confirm the linked expense's `subcontractor_payment_id` becomes NULL (expense not deleted)
