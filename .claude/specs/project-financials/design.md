# Project Financials - Technical Design

## Overview
Enhance three existing modules (Expenses, Subcontractors, Budgets) and add a new Financials tab to the project detail page. The approach is additive -- new columns on expenses, two new tables for sub contracts/payments, new Server Actions for manual budgets, and a new tab with pill sub-navigation housing Budget, Expenses, and Subcontractors views.

## Requirements Reference
See: `.claude/specs/project-financials/requirements.md`

---

## Architecture Overview

### Component Hierarchy
```
ProjectDetailContent (existing, add 7th "Financials" tab)
├── ProjectOverview (existing, add BudgetSummaryCard)
│   └── BudgetSummaryCard (NEW)
└── FinancialsTabClient (NEW - client wrapper, follows EstimatesTabClient pattern)
    ├── FinancialSummaryBar (NEW - top-level totals)
    ├── Pill Sub-Navigation: [Budget] [Expenses] [Subcontractors]
    ├── BudgetOverview (NEW)
    │   ├── BudgetCategoryTable (NEW)
    │   ├── CreateBudgetModal (NEW)
    │   └── EditCategoryInline (NEW)
    ├── ProjectExpenses (NEW - wrapper around existing components)
    │   ├── ExpenseFilters (vendor + payment method + category)
    │   ├── ExpensesList (EXISTING, enhanced)
    │   └── ExpenseCard (EXISTING, enhanced to show payment_method)
    └── SubContractsList (NEW)
        ├── SubContractCard (NEW)
        │   ├── ComplianceIcons (NEW)
        │   └── PaymentHistoryList (NEW)
        ├── AddContractModal (NEW)
        └── AddPaymentModal (NEW)
```

### Data Flow
```
Server (page.tsx)
  → getProjectFinancialSummary(projectId)  → FinancialSummaryBar
  → getBudgetByProject(projectId)          → BudgetOverview

Client (FinancialsTabClient)
  → useEffect + Server Actions for sub-tab data
  → getExpensesByProject(projectId, filters) → ProjectExpenses
  → getContractsByProject(projectId)         → SubContractsList
  → Mutations via Server Actions → revalidatePath
```

---

## Data Model

### ALTER TABLE: expenses (add columns)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| payment_method | TEXT | NULL | Free text: "VISA 4516", "ZELLE", "CASH", "CHK 2843" |
| store_account | TEXT | NULL | Optional store card: "HD 2819", "HD 9127" |

**Migration:** `20260322000001_add_payment_method_to_expenses.sql`

No enum for payment_method -- GCs use inconsistent labels and this must match their real-world naming. Autocomplete from previous entries handles consistency without forcing it.

---

### NEW TABLE: subcontractor_contracts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| company_id | uuid | FK -> companies, NOT NULL | Company isolation |
| project_id | uuid | FK -> projects, NOT NULL | Project scope |
| subcontractor_id | uuid | FK -> subcontractors, NOT NULL | Which sub |
| contract_amount | numeric(12,2) | NOT NULL | Total contract value |
| phase | text | NULL | Trade/phase label: "ELECTRICAL", "FRAMING" |
| status | text | NOT NULL, default 'active' | active, completed, cancelled |
| insurance_received | boolean | NOT NULL, default false | Compliance checkbox |
| contract_executed | boolean | NOT NULL, default false | Compliance checkbox |
| ntp_issued | boolean | NOT NULL, default false | Compliance checkbox |
| schedule_received | boolean | NOT NULL, default false | Compliance checkbox |
| punchlist_complete | boolean | NOT NULL, default false | Compliance checkbox |
| notes | text | NULL | Free-form notes |
| created_by | uuid | FK -> next_auth.users | Who created |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update |

**Migration:** `20260322000002_create_subcontractor_contracts.sql`

### RLS Policies (subcontractor_contracts)
- **SELECT**: `company_id = public.get_user_company_id(next_auth.uid())`

### Indexes
- `idx_sub_contracts_company` on (company_id)
- `idx_sub_contracts_project` on (project_id)
- `idx_sub_contracts_sub` on (subcontractor_id)
- `idx_sub_contracts_project_sub` on (project_id, subcontractor_id)

---

### NEW TABLE: subcontractor_payments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| company_id | uuid | FK -> companies, NOT NULL | Company isolation |
| contract_id | uuid | FK -> subcontractor_contracts, NOT NULL, ON DELETE CASCADE | Parent contract |
| amount | numeric(12,2) | NOT NULL | Payment amount |
| payment_date | date | NOT NULL | When paid |
| payment_method | text | NOT NULL | "ZELLE", "CHK 2838", "CC - AMEX 2008" |
| notes | text | NULL | Optional notes |
| created_by | uuid | FK -> next_auth.users | Who recorded |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |

**Migration:** `20260322000003_create_subcontractor_payments.sql`

### RLS Policies (subcontractor_payments)
- **SELECT**: `company_id = public.get_user_company_id(next_auth.uid())`

### Indexes
- `idx_sub_payments_company` on (company_id)
- `idx_sub_payments_contract` on (contract_id)
- `idx_sub_payments_date` on (payment_date DESC)

---

## Server Actions

### Enhanced: `app/actions/expenses.ts`

**Changes to `createExpenseSchema`:**
Add `payment_method: z.string().optional().nullable()` and `store_account: z.string().optional().nullable()`

**Changes to `createExpense()`:**
Include payment_method and store_account in insert.

**Changes to `updateExpenseSchema`:**
Add same two optional fields.

**New: `getPaymentMethodSuggestions(companyId): Promise<string[]>`**
- SELECT DISTINCT payment_method FROM expenses WHERE company_id = ? AND payment_method IS NOT NULL ORDER BY payment_method
- Used for autocomplete in the payment method input

**Changes to ExpenseWithRelations type:**
Add `payment_method: string | null` and `store_account: string | null`

---

### New: `app/actions/budgets.ts`

**`createBudget(input: CreateBudgetInput): Promise<BudgetResult>`**
```typescript
interface CreateBudgetInput {
  projectId: string
  name: string
  totalAmount: number
  categories: Array<{ name: string; allocatedAmount: number }>
}
```
- Validates total > 0, at least 1 category
- Inserts budget with status 'draft' + categories
- Revalidates `/app/projects/[projectId]`

**`getBudgetByProject(projectId: string): Promise<BudgetWithCategories | null>`**
- Returns budget + categories with spent_amount aggregated from expenses (by category name match)
- Returns null if no budget exists

**`getBudgetSummary(projectId: string): Promise<BudgetSummary>`**
```typescript
interface BudgetSummary {
  totalBudget: number
  totalSpent: number    // sum of approved expenses for project
  subPayments: number   // sum of sub payments for project
  remaining: number     // totalBudget - totalSpent - subPayments
  percentUsed: number
  hasBudget: boolean
}
```
- Lightweight query for summary card and financial summary bar

**`updateBudgetCategory(categoryId: string, input: { name?: string; allocatedAmount?: number })`**

**`addBudgetCategory(budgetId: string, name: string, allocatedAmount: number)`**

**`deleteBudgetCategory(categoryId: string)`**

---

### New: `app/actions/subcontractor-contracts.ts`

**`createContract(input: CreateContractInput): Promise<ContractResult>`**
```typescript
interface CreateContractInput {
  projectId: string
  subcontractorId: string
  contractAmount: number
  phase?: string
  notes?: string
}
```

**`getContractsByProject(projectId: string): Promise<ContractWithPayments[]>`**
```typescript
interface ContractWithPayments {
  id: string
  subcontractor: { id: string; company_name: string; contact_name: string }
  contractAmount: number
  phase: string | null
  status: string
  insurance_received: boolean
  contract_executed: boolean
  ntp_issued: boolean
  schedule_received: boolean
  punchlist_complete: boolean
  paidToDate: number       // SUM of payments
  unpaidBalance: number    // contractAmount - paidToDate
  payments: SubPayment[]
  notes: string | null
}
```
- Joins subcontractor name, aggregates payment totals

**`updateContract(contractId: string, updates: Partial<ContractInput>): Promise<ContractResult>`**

**`updateCompliance(contractId: string, field: ComplianceField, value: boolean): Promise<void>`**
- Toggles a single compliance boolean
- Optimistic update pattern on client

**`deleteContract(contractId: string): Promise<DeleteResult>`**
- Only if no payments exist (or soft-delete to cancelled)

---

### New: `app/actions/subcontractor-payments.ts`

**`createPayment(input: CreatePaymentInput): Promise<PaymentResult>`**
```typescript
interface CreatePaymentInput {
  contractId: string
  amount: number
  paymentDate: string   // ISO date
  paymentMethod: string
  notes?: string
}
```
- Warns but allows overpayment (amount + existing > contract)

**`getPaymentsByContract(contractId: string): Promise<SubPayment[]>`**

**`deletePayment(paymentId: string): Promise<DeleteResult>`**

---

### New: `app/actions/project-financials.ts`

**`getProjectFinancialSummary(projectId: string): Promise<FinancialSummary>`**
- Aggregates: budget total, approved expense total, sub payment total, net remaining
- Single query or parallel queries for efficiency

---

## UI Specification

### 1. Enhanced CreateExpenseModal

**Changes to existing `components/expenses/CreateExpenseModal.tsx`:**

Add after the `vendor_name` field:
- **Payment Method** field: Combobox (free-text + suggestions)
  - Suggestions loaded via `getPaymentMethodSuggestions()` on mount
  - Default suggestions if empty: VISA, AMEX, ZELLE, CASH, CHECK, DEBIT
  - User can type anything: "VISA 4516", "CHK 2843"
  - 44px touch target, full-width on mobile
- **Store Account** field: Text input, shown only when vendor_name matches /home depot|lowes|lowe's/i
  - Placeholder: "e.g., HD 2819"

### 2. Enhanced ExpenseCard

**Changes to existing `components/expenses/ExpenseCard.tsx`:**
- Display `payment_method` in a small badge/chip below the amount (e.g., gray badge with "VISA 4516")
- Display `store_account` next to vendor name if present

### 3. BudgetSummaryCard (NEW)

**File:** `components/projects/BudgetSummaryCard.tsx`
**Location:** ProjectOverview tab, above or beside the existing ExpenseSummary card
**Props:**
```typescript
interface BudgetSummaryCardProps {
  summary: BudgetSummary
  projectId: string
}
```
**Layout:**
- Compact card matching existing ProjectExpenseSummary style
- Shows: Total Budget | Spent | Remaining | Progress bar
- Color: green (<75%), yellow (75-100%), red (>100%)
- If no budget: single-line "Set Up Budget" link to Financials tab
- Tapping card navigates to Financials > Budget

### 4. FinancialsTabClient (NEW)

**File:** `components/projects/financials/FinancialsTabClient.tsx`
**Pattern:** Follows `EstimatesTabClient.tsx` -- client wrapper with useEffect + Server Actions
**Props:**
```typescript
interface FinancialsTabClientProps {
  projectId: string
  userRole: string | null
}
```
**Behavior:**
- Fetches data via Server Actions on mount (parallel: budget, contracts, expense summary)
- Horizontal pill sub-nav: **Budget** | **Expenses** | **Subs**
- Financial summary bar at top (always visible)
- Each sub-section lazy-rendered on tab switch

### 5. FinancialSummaryBar (NEW)

**File:** `components/projects/financials/FinancialSummaryBar.tsx`
**Layout:** Horizontal bar with 4 metrics, similar to project header stats grid
```
[ Total Budget: $150k ] [ Expenses: $45k ] [ Sub Payments: $62k ] [ Remaining: $43k ]
```
- Mobile: 2x2 grid
- Desktop: 4-column row
- Color-coded remaining (green/yellow/red)

### 6. BudgetOverview (NEW)

**File:** `components/projects/financials/BudgetOverview.tsx`
**Layout:**
- If no budget: Empty state with "Create Budget" button
- If budget exists: Category table
  - Each row: Category name | Allocated | Spent | Remaining | Progress bar
  - Row colors: green/yellow/red based on % spent
  - Inline edit: tap allocated amount to edit
  - "Add Category" button at bottom
  - Mobile: stacked card layout (not table)

**CreateBudgetModal:**
- ResponsiveModal
- Fields: Budget name, Total amount
- Dynamic category list: name + allocated amount per row, "Add Category" button
- Default categories suggested: Materials, Labor/Payroll, Subcontractors, Permits, Equipment, Other
- User can rename/remove/add

### 7. SubContractsList (NEW)

**File:** `components/projects/financials/SubContractsList.tsx`
**Layout:** Card list (not table -- better for mobile)

**SubContractCard:**
```
┌──────────────────────────────────────┐
│ [ElectricalIcon] ABC Electric        │
│ Phase: ELECTRICAL                    │
│                                      │
│ Contract: $45,000                    │
│ Paid:     $30,000    Balance: $15,000│
│ ┌──────────────────────────────────┐ │
│ │ ████████████████░░░░░░░ 67%     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Compliance:                          │
│ [Shield✓] [File✓] [Flag✓] [Cal○] [Check○] │
│                                      │
│ [+ Add Payment]            [⋯ More] │
└──────────────────────────────────────┘
```
- Compliance icons: tappable, 44px targets, toggle on tap
- "Add Payment" opens AddPaymentModal
- "More" menu: Edit contract, View payments, Delete

**AddContractModal:**
- ResponsiveModal
- Select subcontractor (from company's sub list)
- Contract amount (currency input)
- Phase/trade (text input with suggestions from existing phases)
- Notes (optional)

**AddPaymentModal:**
- ResponsiveModal
- Amount (currency input)
- Payment date (date picker, defaults to today)
- Payment method (combobox, same pattern as expense payment method)
- Notes (optional)
- If payment would exceed contract: yellow warning banner, still submittable

**PaymentHistoryList:**
- Expandable section within SubContractCard (tap "View Payments" or chevron)
- Each payment: date | amount | method | [delete]
- Sorted by date DESC

### 8. ProjectExpenses (financials sub-view) (NEW)

**File:** `components/projects/financials/ProjectExpenses.tsx`
**Layout:**
- Filter bar: Vendor dropdown + Payment Method dropdown + Category dropdown
- Reuses existing `ExpensesList` and `ExpenseCard` components
- Adds vendor summary when filtered: "Home Depot: 23 expenses, $12,450 total"
- "Add Expense" button opens existing CreateExpenseModal (pre-filled with project)

---

## Tab Integration

### ProjectDetailContent.tsx Changes
1. Add "financials" to the activeTab union type
2. Add Financials as the **2nd tab** (after Overview, before Team) with DollarSign icon
   - Tab order: Overview > **Financials** > Team > Tasks > Files > Estimates > Settings
3. Render `FinancialsTabClient` when active
4. Pass `projectId` and `userRole` props

### ProjectOverview.tsx Changes
1. Add `BudgetSummaryCard` component
2. Fetch budget summary via `getBudgetSummary()` (can use existing deferred stats pattern)
3. Position above or beside existing ExpenseSummary card

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| No budget exists | Show empty state | "Set up a budget to track spending" |
| Budget creation fails | Toast error | "Failed to create budget. Please try again." |
| Payment exceeds contract | Yellow warning | "This payment exceeds the contract amount. Proceed?" |
| Contract delete with payments | Block | "Cannot delete contract with existing payments. Delete payments first." |
| Compliance toggle fails | Revert optimistic | Toast: "Failed to update compliance status" |
| Expense filter returns empty | Empty state | "No expenses match your filters" |

---

## Security Considerations
- RLS enforces company isolation on all new tables
- Auth check in all Server Actions (getUserContext pattern)
- Only admin/PM can create budgets and contracts (role check)
- Any authenticated company member can create expenses (existing pattern)
- Payment method is free text -- no PCI concerns (last 4 digits of card, not full number)
- All inputs validated via Zod schemas
- No sensitive financial data in client state beyond what's displayed

---

## Mobile Design Considerations
- Financial summary bar: 2x2 grid on mobile, 4-col on desktop
- Budget category table: stacked cards on mobile, table on desktop
- Sub contract cards: full-width, vertically stacked
- Compliance icons: 44px tap targets with adequate spacing
- Payment method combobox: native feel, large touch targets
- Horizontal pill sub-nav: scrollable if needed, snap points
- All currency inputs: right-aligned, numeric keyboard on mobile

---

## Migration from Excel Workflow

| Excel Tab | GenHub Replacement |
|-----------|-------------------|
| BUDGET REPORT | Financials > Budget (category table with progress bars) |
| EXPENSE - MAIN | Financials > Expenses (all vendors, filter by vendor/payment method) |
| EXPENSE - HOME DEPOT | Financials > Expenses filtered by "Home Depot" vendor |
| EXPENSE - LOWES | Financials > Expenses filtered by "Lowe's" vendor |
| SUBCONTRACTOR TRACKER | Financials > Subcontractors (contract cards with compliance icons) |
| PAYMENT TRACKER | Financials > Subcontractors > Payment history per contract |

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to tasks)
