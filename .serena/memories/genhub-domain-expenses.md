# GenHub Domain: Expenses

## Approval Workflow
```
submitted → under_review → approved | rejected → paid
```

## Enums
- **Category**: materials | labor | equipment | permits | transportation | meals | lodging | other
- **Status**: submitted | under_review | approved | rejected | paid

## Tables
- `expenses` - Expense records (→ projects, tasks optional)
- `expense_line_items` - Breakdowns (→ expenses, materials optional)

## Structure
```typescript
// Parent expense
expenses: {
  project_id, task_id?, // optional task link
  total_amount, category, status,
  submitted_by, approved_by?, receipt_url?
}

// Child line items
expense_line_items: {
  expense_id, description, amount,
  material_id? // optional link to material catalog
}
```

## Key Actions (app/actions/expenses.ts)
| Action | Purpose |
|--------|---------|
| createExpense | Submit expense |
| updateExpense | Update fields |
| updateExpenseStatus | Approve/reject/pay |
| getExpenses | List expenses |
| getExpenseById | Get with line items |
| getExpenseAnalytics | Summary stats |

## Budget Integration
- Expenses linked to projects
- Compare against project budget
- Trigger `budget_overrun` notification when exceeded

## Receipt Handling
- Upload via Vercel Blob
- Store URL in `receipt_url`
- Display in expense detail view

## Common Patterns
- Expenses can be linked to tasks (optional)
- Line items can be linked to materials (optional)
- Approval requires admin/pm role
- Revalidate `/app/expenses` after mutations

## Gotchas
- Total = sum of line items (computed)
- Status changes require permission check
- rejected expenses can be revised and resubmitted
- Use `expense_category` not `category` column