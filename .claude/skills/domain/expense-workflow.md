# Skill: Expense Workflow

> Expense management and approval patterns for GenHub

## When to Use

- Creating expense submissions
- Expense approval workflows
- Receipt upload and OCR
- Budget tracking and reports
- Material-linked expenses
- Line item management

## Prerequisites

- Check `.claude/docs/indexes/tables.md` for expenses schema
- Check `.claude/docs/indexes/actions.md` for expense actions

---

## Quick Reference

### Database Tables

| Table | Purpose |
|-------|---------|
| `expenses` | Main expense records (22 cols) |
| `expense_line_items` | Line items for expenses (14 cols) |

### Key Fields
- Expenses can link to `project_id` AND/OR `task_id`
- `expense_line_items` can link to `material_assignment_id` for tracking

### Status Flow
```typescript
type ExpenseStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid'
type ExpenseCategory = 'materials' | 'labor' | 'equipment' | 'permits' | 'travel' | 'subcontractor' | 'other'

const STATUS_FLOW = {
  submitted: ['under_review', 'approved', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['paid', 'rejected'],
  rejected: ['submitted'],  // Can resubmit
  paid: [],  // Terminal
}
```

---

## Server Actions

### Key Actions (expenses.ts)

| Action | Purpose |
|--------|---------|
| `createExpense` | Create new expense |
| `updateExpense` | Update expense fields |
| `reviewExpense` | Approve/reject expense |
| `deleteExpense` | Delete expense |
| `getExpensesByProject` | Expenses for project |
| `getExpensesByCompany` | All company expenses |
| `getExpenseById` | Single expense details |
| `addExpenseLineItem` | Add line item |
| `deleteExpenseLineItem` | Remove line item |
| `processReceiptOCR` | OCR receipt processing |
| `matchLineItemToMaterial` | Link to material assignment |
| `getTaskExpenses` | Expenses for task |
| `getBatchTaskExpenses` | Expenses for multiple tasks |
| `createExpenseFromMaterial` | Create from material assignment |
| `getMaterialExpenseLink` | Get linked material |
| `getExpenseAnalytics` | Analytics/reports |
| `getVendorOptions` | Vendor dropdown options |
| `createExpenseFromTask` | Create linked to task |

### Line Items Pattern
```typescript
// Expenses can have multiple line items
const { data: expense } = await supabase
  .from('expenses')
  .select(`
    *,
    line_items:expense_line_items (
      id,
      description,
      quantity,
      unit_price,
      total,
      material_assignment:material_assignments (
        id,
        material:materials (name, sku)
      )
    )
  `)
  .eq('id', expenseId)
  .single();

// Add line item
await addExpenseLineItem({
  expenseId,
  description: 'Drywall sheets',
  quantity: 50,
  unitPrice: 15.99,
  materialAssignmentId: assignmentId,  // optional link
});
```

### Receipt OCR Pattern
```typescript
// Process uploaded receipt
const ocrResult = await processReceiptOCR({
  expenseId,
  receiptUrl,
});
// Returns: suggested vendor, date, line items from OCR

// Match line item to existing material
await matchLineItemToMaterial({
  lineItemId,
  materialAssignmentId,
});
```

### Create from Material Pattern
```typescript
// Expense auto-created from material purchase
await createExpenseFromMaterial({
  materialAssignmentId,
  projectId,
  receiptUrl,
});
// Links expense to the material assignment
```

---

## Status Config
```typescript
const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  paid: { label: 'Paid', color: 'bg-purple-100 text-purple-800' },
}

const CATEGORIES = [
  'materials', 'labor', 'equipment', 'permits',
  'travel', 'subcontractor', 'other'
]
```

---

## Anti-Patterns

```typescript
// WRONG: Not using line items
await createExpense({
  amount: totalAmount,  // Single amount
  description: 'Various materials',
});

// CORRECT: Use line items for detail
const expense = await createExpense({ projectId, category: 'materials' });
await addExpenseLineItem({ expenseId: expense.id, description: 'Lumber', quantity: 10, unitPrice: 25 });
await addExpenseLineItem({ expenseId: expense.id, description: 'Nails', quantity: 2, unitPrice: 15 });

// WRONG: Not linking to materials
await addExpenseLineItem({ expenseId, description: 'Drywall' });
// Miss tracking opportunity

// CORRECT: Link to material assignment
await addExpenseLineItem({
  expenseId,
  description: 'Drywall',
  materialAssignmentId: assignment.id,  // Links for tracking
});

// WRONG: Approving without role check
await reviewExpense(expenseId, 'approve');
// Action should check user role internally
```

---

## Checklist

- [ ] Use `expense_line_items` for itemized expenses
- [ ] Link line items to `material_assignments` when applicable
- [ ] Status transitions validated via `STATUS_FLOW`
- [ ] Role check (admin/PM) for approvals
- [ ] Rejection requires reason
- [ ] Company isolation via `getUserContext()`
- [ ] Receipt URL stored and linked
- [ ] OCR results create suggested line items
- [ ] `revalidatePath` called after mutations
