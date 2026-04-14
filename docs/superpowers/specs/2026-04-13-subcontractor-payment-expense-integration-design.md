# Subcontractor Payment ↔ Expense Integration

**Date:** 2026-04-13  
**Status:** Approved

## Problem

Subcontractor payments and expenses are tracked as two completely separate systems. This causes two related problems:

1. **Payment → no expense:** When a contractor records a payment against a subcontractor contract, it never appears in the Expenses tab — users must manually duplicate it.
2. **Expense → no contract:** When a contractor creates an expense for a subcontractor, nothing is recorded in the Subcontractor Contracts module — the payment history is fragmented.

The goal: expenses become the single source of truth for all project spend, and the two modules stay in sync bidirectionally.

---

## Two Flows

### Flow A — Payment → Expense (auto-create expense when payment recorded)

When `createPayment()` in `app/actions/subcontractor-payments.ts` succeeds, a linked expense is auto-created.

### Flow B — Expense → Contract + Payment (auto-create contract/payment when expense created)

When `createExpense()` in `app/actions/expenses.ts` is called with a `subcontractor_id`, a subcontractor contract is found (or created) and a payment is auto-added.

Both flows use the same `subcontractor_payment_id` FK on `expenses` as the bidirectional link. A `skipExpenseSync` flag on `createPayment()` prevents loops.

---

## Data Model

### New columns on `expenses`

```sql
-- Links expense back to the payment that created it (Flow A)
-- Also used by Flow B to link the auto-created payment to this expense
ALTER TABLE public.expenses
  ADD COLUMN subcontractor_payment_id UUID
  REFERENCES public.subcontractor_payments(id) ON DELETE SET NULL;

-- Links expense to a specific subcontractor (Flow B trigger)
ALTER TABLE public.expenses
  ADD COLUMN subcontractor_id UUID
  REFERENCES public.subcontractors(id) ON DELETE SET NULL;
```

- Both columns nullable — existing expenses and non-subcontractor expenses leave them NULL
- `ON DELETE SET NULL` — deleting a payment or subcontractor orphans the expense (doesn't cascade-delete)
- `subcontractor_id` is the trigger for Flow B: if set on expense creation, sync fires
- `subcontractor_payment_id` is the bidirectional link between expense and payment

No changes to `subcontractor_payments` or `subcontractor_contracts` schema.

---

## Flow A — Auto-Create Expense on Payment

**File:** `app/actions/subcontractor-payments.ts`

When `createPayment()` succeeds **and** `skipExpenseSync` is NOT set:

1. Insert `subcontractor_payments` row (existing behavior)
2. Fetch the contract → subcontractor name (join already available)
3. Insert a linked expense:

| Field | Value |
|-------|-------|
| `description` | `"Payment to [company_name] - [notes]"` (falls back to `"Payment to [company_name]"` if notes blank) |
| `amount` | payment amount |
| `category` | `"labor"` |
| `expense_date` | payment date |
| `vendor_name` | subcontractor company_name |
| `subcontractor_id` | subcontractor id from the contract |
| `project_id` | contract's project_id |
| `status` | `"approved"` |
| `submitted_by` | current user ID |
| `subcontractor_payment_id` | new payment ID |
| `company_id` | current user's company_id |

If the expense insert fails, return an error (the payment was already inserted — acceptable; the expense can be re-created manually or via backfill).

### `skipExpenseSync` flag

`createPayment()` accepts an optional internal parameter:

```typescript
{ ..., skipExpenseSync?: boolean }
```

When `true`, the auto-create-expense logic is bypassed. Used by Flow B to prevent the loop: expense → payment → expense → ...

---

## Flow B — Auto-Create Contract + Payment on Expense

**File:** `app/actions/expenses.ts`

When `createExpense()` is called with both `subcontractor_id` and `project_id`, after the expense row is inserted:

1. **Look up existing contract** — query `subcontractor_contracts` WHERE `subcontractor_id = X AND project_id = Y AND company_id = Z AND status = 'active'` ORDER BY `created_at DESC` LIMIT 1
2. **If no contract found** — insert a new contract: `contract_amount = expense.amount`, `status = "active"`, `phase = null`
3. **Insert payment** — call `createPayment()` with `skipExpenseSync: true`:
   - `contractId` = found or created contract id
   - `amount` = expense amount
   - `paymentDate` = expense date
   - `paymentMethod` = `"expense"` (default; no payment method on expense form)
   - `notes` = expense description
4. **Update expense** — set `subcontractor_payment_id = newPayment.id` to establish the bidirectional link

Sync is best-effort: if contract creation or payment insert fails, log the error and return the expense as successful. The expense is never rolled back due to sync failure.

---

## Financial Summary Fix

**File:** `app/actions/project-financials.ts`

**Current logic:**
```
totalUsed = SUM(expenses WHERE approved/paid) + SUM(subcontractor_payments)
```

**New logic:**
```
totalUsed = SUM(expenses WHERE approved/paid)
```

Auto-created payment expenses (from both flows) have `status = "approved"` so they're already counted. Remove the `subcontractor_payments` query entirely from `getProjectFinancialSummary()`.

---

## UI Changes

**File:** `components/expenses/CreateExpenseModal.tsx`

Add a **Subcontractor** picker field:

- Renders when `project_id` is selected
- Loads company subcontractors via `getSubcontractors()` server action
- Searchable combobox (same pattern as `VendorCombobox`)
- Selecting a subcontractor auto-fills `vendor_name` with their `company_name` (user can override)
- Field is optional — leaving it blank means no contract/payment sync

**Schema addition in `createExpenseSchema`:**
```typescript
subcontractor_id: z.string().uuid().optional().nullable()
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Expense created without `subcontractor_id` | No sync — works exactly as today |
| Contract lookup fails | Log error, return expense success |
| New contract insert fails | Log error, return expense success |
| Payment insert fails | Log error, return expense success |
| Multiple active contracts for same subcontractor + project | Use first active contract (ORDER BY created_at DESC) |
| Expense amount is negative (credit) | Sync proceeds normally |

---

## Migration: Backfill Existing Payment

One migration file creates an expense for the existing $200 payment (id: `131559a8-fa1a-4a6a-be52-7254746a3067`):

```sql
-- Backfill expense for existing subcontractor payment
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

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/<timestamp>_add_subcontractor_expense_link.sql` | Add `subcontractor_payment_id` + `subcontractor_id` FK columns to expenses; backfill migration |
| `app/actions/subcontractor-payments.ts` | Add `skipExpenseSync` flag; auto-create expense after payment insert (Flow A) |
| `app/actions/expenses.ts` | Add `subcontractor_id` to schema; auto-create contract + payment after expense insert (Flow B) |
| `app/actions/project-financials.ts` | Remove `subcontractor_payments` query from total |
| `components/expenses/CreateExpenseModal.tsx` | Add subcontractor picker field |
| `types/db/` | Regenerate after migration (`npm run db:gen-types`) |

---

## Verification

1. `npm run lint:ts` passes
2. Apply migration; confirm `expenses.subcontractor_payment_id` and `expenses.subcontractor_id` columns exist
3. The existing $200 payment has a matching expense in the `expenses` table
4. **Flow A:** Record a new payment in the Subcontractor Contracts UI → verify an expense appears in the project Expenses tab
5. **Flow B:** Create a new expense with a subcontractor selected → verify a payment appears in that subcontractor's contract (new contract created if none existed)
6. **No loop:** Verify only one expense per payment and one payment per expense — no duplicates
7. Check project financial summary — total equals expenses-only (no double-count)
8. Delete a payment → expense `subcontractor_payment_id` becomes NULL (not deleted)
9. `npm run build` passes
