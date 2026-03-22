# Project Financials - Requirements

## Overview
Replace a GC's 6-tab Excel spreadsheet (Budget Report, Expense-Main, Expense-HD, Expense-Lowes, Subcontractor Tracker, Payment Tracker) with integrated financial tracking inside each project. Enhances existing Expenses, Subcontractors, and Budgets modules rather than creating a standalone financials module.

## Personas
- **Primary**: GC (General Contractor / Owner) - Track all project costs, manage sub payments, monitor budget health at a glance
- **Secondary**: PM (Project Manager) - Enter expenses on-site, record payments, check budget status
- **Tertiary**: Foreman - Log expenses from the field with payment method details

---

## User Stories

### US-1: Payment Method Tracking on Expenses
**As a** GC,
**I want** to record the payment method (VISA 4516, ZELLE, CASH, CHK 2843) and optionally a store account number (HD 2819, HD 9127) on every expense,
**So that** I can reconcile expenses against bank/card statements without a separate spreadsheet.

**Acceptance Criteria (EARS):**
- WHEN user creates an expense THE SYSTEM SHALL display a payment method field with free-text input and common suggestions (VISA, AMEX, ZELLE, CASH, CHECK, DEBIT)
- WHEN user types in the payment method field THE SYSTEM SHALL show autocomplete suggestions from previously used payment methods for this company
- IF vendor_name contains "home depot" or "lowes" (case-insensitive) THEN THE SYSTEM SHALL show an optional "Store Account #" field
- WHEN viewing an expense card THE SYSTEM SHALL display the payment method prominently below the amount
- WHEN filtering expenses THE SYSTEM SHALL allow filtering by payment method in addition to existing vendor/category filters

**Priority:** Critical

---

### US-2: Vendor-Based Expense Filtering (Replace Separate Tabs)
**As a** GC,
**I want** to filter my project expenses by vendor name,
**So that** I can see all Home Depot purchases or all Lowe's purchases in one view (replacing the separate Excel tabs per vendor).

**Acceptance Criteria (EARS):**
- WHEN user navigates to project Financials > Expenses THE SYSTEM SHALL display a vendor filter dropdown populated from distinct vendor names on that project's expenses
- WHEN user selects a vendor filter THE SYSTEM SHALL show only expenses matching that vendor
- WHEN user clears the vendor filter THE SYSTEM SHALL show all project expenses
- WHILE vendor filter is active THE SYSTEM SHALL display a summary row showing total spend for that vendor on this project

**Priority:** High

---

### US-3: Subcontractor Contracts per Project
**As a** GC,
**I want** to create a contract record for each subcontractor assigned to a project with their contract amount and trade/phase,
**So that** I can track how much each sub is owed and how much has been paid.

**Acceptance Criteria (EARS):**
- WHEN user adds a contract THE SYSTEM SHALL require selecting an existing subcontractor, entering a contract amount, and optionally a phase/trade label
- WHEN viewing the subcontractors list THE SYSTEM SHALL display each contract as a card showing: sub name, trade, contract amount, paid-to-date, unpaid balance
- IF a subcontractor has multiple contracts on the same project THEN THE SYSTEM SHALL display each as a separate card
- WHEN contract amount or payments change THE SYSTEM SHALL recalculate the unpaid balance automatically

**Priority:** Critical

---

### US-4: Subcontractor Compliance Checkboxes
**As a** GC,
**I want** simple toggle checkboxes for each sub contract (Insurance Received, Contract Executed, NTP Issued, Schedule Received, Punchlist Complete),
**So that** I can quickly see which subs are compliant at a glance without managing full documents.

**Acceptance Criteria (EARS):**
- WHEN viewing a sub contract card THE SYSTEM SHALL display 5 compliance icons in a row: Shield (insurance), FileText (contract), Flag (NTP), Calendar (schedule), CheckCircle (punchlist)
- WHEN user taps a compliance icon THE SYSTEM SHALL toggle its boolean state and persist immediately (optimistic update)
- WHILE any compliance checkbox is unchecked THE SYSTEM SHALL display the icon in gray/muted color
- WHILE all compliance checkboxes are checked THE SYSTEM SHALL display a "Fully Compliant" badge on the contract card

**Priority:** High

---

### US-5: Subcontractor Payment Recording
**As a** GC,
**I want** to record individual payments against a sub contract with amount, date, and payment method,
**So that** I can track paid-to-date and unpaid balance per sub (replacing my Payment Tracker Excel tab).

**Acceptance Criteria (EARS):**
- WHEN user taps "Add Payment" on a contract card THE SYSTEM SHALL open a modal with fields: amount, payment date, payment method (free text with suggestions), and optional notes
- WHEN a payment is recorded THE SYSTEM SHALL update the contract's paid-to-date total and recalculate unpaid balance
- WHEN viewing a contract THE SYSTEM SHALL show a payment history list with date, amount, method, and notes
- IF a payment would cause paid-to-date to exceed contract amount THEN THE SYSTEM SHALL display a warning but still allow the payment (overpayments happen via change orders)
- WHEN user deletes a payment THE SYSTEM SHALL recalculate the contract's paid-to-date

**Priority:** Critical

---

### US-6: Manual Budget Creation with Custom Categories
**As a** GC,
**I want** to create a project budget manually with custom cost categories (Materials, Payroll, Subcontractors, Permits, Other),
**So that** I can set up a budget even without an estimate, and track spending against each category.

**Acceptance Criteria (EARS):**
- WHEN user navigates to Financials > Budget and no budget exists THE SYSTEM SHALL display a "Set Up Budget" call-to-action
- WHEN user creates a budget THE SYSTEM SHALL allow entering a total amount and creating custom categories with allocated amounts
- IF sum of category allocations exceeds total budget THEN THE SYSTEM SHALL display a warning (but allow it -- some GCs over-allocate intentionally)
- WHEN viewing the budget THE SYSTEM SHALL display each category as a row: name, allocated, spent, remaining, and a color-coded progress bar
- WHILE a category is under 75% spent THE SYSTEM SHALL show green; 75-100% yellow; over 100% red

**Priority:** High

---

### US-7: Budget Summary Card on Project Overview
**As a** GC,
**I want** to see a quick budget health snapshot on the project overview tab,
**So that** I can assess financial status without navigating to the Financials tab.

**Acceptance Criteria (EARS):**
- WHEN a project has a budget THE SYSTEM SHALL display a Budget Summary card on the Overview tab showing: Total Budget, Total Spent, Remaining, and % used with a progress bar
- WHILE budget usage is under 75% THE SYSTEM SHALL show the progress bar in green
- WHILE budget usage is 75-100% THE SYSTEM SHALL show yellow
- WHILE budget usage exceeds 100% THE SYSTEM SHALL show red
- IF no budget exists THE SYSTEM SHALL display a compact "Set Up Budget" link (not a large empty state)

**Priority:** Medium

---

### US-8: Financials Tab with Sub-Navigation
**As a** GC,
**I want** a dedicated "Financials" tab on the project detail page with sub-sections for Budget, Expenses, and Subcontractors,
**So that** all financial data for a project is accessible from one place.

**Acceptance Criteria (EARS):**
- WHEN user taps the Financials tab THE SYSTEM SHALL display horizontal pill sub-navigation with three sections: Budget, Expenses, Subcontractors
- WHEN user switches between sub-sections THE SYSTEM SHALL preserve scroll position of the parent tab
- WHILE on the Financials tab THE SYSTEM SHALL display a financial summary bar at the top showing: Total Budget | Total Expenses | Sub Payments | Net Remaining
- WHEN user first enters Financials tab THE SYSTEM SHALL default to the Budget sub-section

**Priority:** Critical

---

### US-9: Weekly Payroll Totals
**As a** GC,
**I want** to enter weekly payroll totals as a budget line item or expense category,
**So that** I can track labor costs against my budget without entering individual paychecks.

**Acceptance Criteria (EARS):**
- WHEN user creates an expense with category "labor" THE SYSTEM SHALL allow entering a "pay period" date range (week start - week end)
- WHEN viewing budget categories THE SYSTEM SHALL aggregate labor expenses into the Payroll/Labor category's spent amount
- WHILE viewing expenses filtered by "labor" category THE SYSTEM SHALL display entries grouped by pay period

**Priority:** Medium (Phase 2 candidate -- can use existing expense category "labor" for v1)

---

## Out of Scope
- Receipt scanning / OCR (v1 is manual entry only)
- Invoice generation or approval workflows
- Integration with QuickBooks / accounting software
- PDF export of budget reports (v2)
- Change order tracking (separate feature)
- Automated budget-to-expense linking triggers (v2)
- Budget variance alerts/notifications (v2)
- Multi-currency support
- Payroll integration (weekly totals entered as expenses for v1)

## Dependencies
- Existing `expenses` table and CRUD actions
- Existing `subcontractors` table and CRUD actions
- Existing `budgets` and `budget_categories` tables (from estimate conversion)
- Existing `ExpenseCard`, `ExpensesList`, `VendorCombobox` components
- Existing `ProjectDetailContent.tsx` tab system
- Existing `EstimatesTabClient` pattern for client wrapper

## Non-Functional Requirements
- **Performance**: Financials tab must load within 1s on 4G connection; budget summary card must not add >200ms to overview tab load
- **Security**: All financial data scoped by company_id via RLS; only admin/PM can create budgets and contracts; any authenticated user can create expenses (existing pattern)
- **Mobile**: All inputs must have 44px touch targets; payment method field must be easy to use with one thumb; financial tables must be horizontally scrollable on mobile
- **Offline**: Not required for v1 (financial data is too sensitive for optimistic offline writes)

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to design)
