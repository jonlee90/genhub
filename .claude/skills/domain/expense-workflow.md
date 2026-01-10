# Skill: Expense Workflow

> Expense management and approval patterns for GenHub

## When to Use

- Creating expense submissions
- Expense approval workflows
- Receipt upload and OCR
- Budget tracking and reports

## Prerequisites

- Check `docs/indexes/tables.md` for expenses schema
- Expenses link to tasks for project association

---

## Quick Reference

### Database Schema
```sql
expenses (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES tasks(id),
  company_id uuid NOT NULL,
  submitted_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  amount numeric(10,2) NOT NULL,
  category expense_category NOT NULL,
  description text,
  receipt_url text,
  status expense_status DEFAULT 'draft',
  expense_date date DEFAULT CURRENT_DATE,
  notes text,
  rejection_reason text,
  created_at timestamptz,
  updated_at timestamptz
)
```

### Status Flow
```typescript
type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'

const STATUS_FLOW = {
  draft: ['submitted'],
  submitted: ['approved', 'rejected'],
  approved: ['paid', 'rejected'],
  rejected: ['draft'],  // Can resubmit
  paid: [],  // Terminal
}

type ExpenseCategory = 'materials' | 'labor' | 'equipment' | 'permits' | 'travel' | 'other'
```

---

## Server Actions

### Create Expense
```typescript
export async function createExpense(input: {
  taskId?: string
  amount: number
  category: ExpenseCategory
  description?: string
  expenseDate?: string
  receiptUrl?: string
}) {
  const supabase = await createClient()
  const session = await auth()

  // Get company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', session.user.id)
    .single()

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      task_id: input.taskId,
      company_id: companyUser.company_id,
      submitted_by: session.user.id,
      amount: input.amount,
      category: input.category,
      description: input.description,
      expense_date: input.expenseDate || new Date().toISOString().split('T')[0],
      receipt_url: input.receiptUrl,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/expenses')
  return { data }
}
```

### Submit Expense
```typescript
export async function submitExpense(expenseId: string) {
  const supabase = await createClient()
  const session = await auth()

  // Verify ownership and status
  const { data: expense } = await supabase
    .from('expenses')
    .select('status, submitted_by')
    .eq('id', expenseId)
    .single()

  if (!expense) return { error: 'Expense not found' }
  if (expense.submitted_by !== session.user.id) {
    return { error: 'Can only submit your own expenses' }
  }
  if (expense.status !== 'draft' && expense.status !== 'rejected') {
    return { error: 'Can only submit draft or rejected expenses' }
  }

  const { error } = await supabase
    .from('expenses')
    .update({
      status: 'submitted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId)

  if (error) return { error: error.message }

  revalidatePath('/app/expenses')
  return { success: true }
}
```

### Approve/Reject Expense
```typescript
export async function reviewExpense(
  expenseId: string,
  action: 'approve' | 'reject',
  reason?: string
) {
  const supabase = await createClient()
  const session = await auth()

  // Check reviewer is admin/PM
  const { data: reviewer } = await supabase
    .from('company_users')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  if (!['gc_admin', 'project_manager'].includes(reviewer?.role)) {
    return { error: 'Only admins and PMs can review expenses' }
  }

  // Verify expense is submitted
  const { data: expense } = await supabase
    .from('expenses')
    .select('status')
    .eq('id', expenseId)
    .single()

  if (expense?.status !== 'submitted') {
    return { error: 'Can only review submitted expenses' }
  }

  const updates = {
    status: action === 'approve' ? 'approved' : 'rejected',
    approved_by: action === 'approve' ? session.user.id : null,
    rejection_reason: action === 'reject' ? reason : null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)

  if (error) return { error: error.message }

  revalidatePath('/app/expenses')
  return { success: true }
}
```

### Mark as Paid
```typescript
export async function markExpensePaid(expenseId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expenses')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId)
    .eq('status', 'approved')  // Must be approved first

  if (error) return { error: error.message }

  revalidatePath('/app/expenses')
  return { success: true }
}
```

---

## Expense Queries

### Get My Expenses
```typescript
export async function getMyExpenses(filters?: {
  status?: ExpenseStatus
  category?: ExpenseCategory
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  const session = await auth()

  let query = supabase
    .from('expenses')
    .select(`
      *,
      task:tasks(id, title, project:projects(id, name))
    `)
    .eq('submitted_by', session.user.id)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.startDate) query = query.gte('expense_date', filters.startDate)
  if (filters?.endDate) query = query.lte('expense_date', filters.endDate)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}
```

### Get Pending Approvals (For Admins)
```typescript
export async function getPendingExpenses() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      submitter:users!submitted_by(id, name, email),
      task:tasks(id, title, project:projects(id, name))
    `)
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}
```

### Expense Summary
```typescript
export async function getExpenseSummary(projectId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('expenses')
    .select(`
      amount,
      category,
      status,
      task:tasks!inner(project_id)
    `)

  if (projectId) {
    query = query.eq('task.project_id', projectId)
  }

  const { data } = await query

  return {
    total: data?.reduce((sum, e) => sum + e.amount, 0) || 0,
    byCategory: data?.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>),
    byStatus: data?.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + e.amount
      return acc
    }, {} as Record<string, number>),
    pending: data?.filter(e => e.status === 'submitted')
      .reduce((sum, e) => sum + e.amount, 0) || 0,
  }
}
```

---

## UI Components

### Expense Form
```tsx
'use client'

import { useState } from 'react'
import { BaseModal } from '@/components/ui/BaseModal'
import { Receipt } from 'lucide-react'
import { createExpense, submitExpense } from '@/app/actions/expenses'

const CATEGORIES = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'permits', label: 'Permits' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

export function ExpenseForm({ taskId, onSuccess }: ExpenseFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [submitImmediately, setSubmitImmediately] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)

    // Create expense
    const result = await createExpense({
      taskId,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as ExpenseCategory,
      description: formData.get('description') as string,
      expenseDate: formData.get('expenseDate') as string,
    })

    if (result.error) {
      setIsPending(false)
      toast.error(result.error)
      return
    }

    // Submit immediately if checkbox checked
    if (submitImmediately && result.data) {
      await submitExpense(result.data.id)
    }

    setIsPending(false)
    toast.success(submitImmediately ? 'Expense submitted for approval' : 'Expense saved as draft')
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <Input
              name="amount"
              type="number"
              step="0.01"
              required
              className="pl-7 border-2"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select name="category" required>
            <SelectTrigger className="border-2">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea name="description" rows={2} className="border-2" />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          name="expenseDate"
          type="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          className="border-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="submitNow"
          checked={submitImmediately}
          onCheckedChange={(c) => setSubmitImmediately(!!c)}
        />
        <Label htmlFor="submitNow" className="text-sm">
          Submit for approval immediately
        </Label>
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-[#001B51]">
        {isPending ? 'Saving...' : submitImmediately ? 'Submit Expense' : 'Save Draft'}
      </Button>
    </form>
  )
}
```

### Expense Status Badge
```tsx
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800' },
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge className={config.color}>{config.label}</Badge>
}
```

### Approval Actions
```tsx
export function ExpenseApprovalActions({ expense, onReviewed }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    setIsPending(true)
    const result = await reviewExpense(expense.id, 'approve')
    setIsPending(false)
    if (result.success) {
      toast.success('Expense approved')
      onReviewed()
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setIsPending(true)
    const result = await reviewExpense(expense.id, 'reject', rejectionReason)
    setIsPending(false)
    if (result.success) {
      toast.success('Expense rejected')
      onReviewed()
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleApprove} disabled={isPending} className="bg-green-600">
        <Check className="w-4 h-4 mr-2" />
        Approve
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="destructive" disabled={isPending}>
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Textarea
            placeholder="Rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <Button onClick={handleReject} variant="destructive" className="mt-2 w-full">
            Confirm Rejection
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

---

## Anti-Patterns

```typescript
// WRONG: Anyone can approve
await reviewExpense(id, 'approve')
// Must check role

// WRONG: Skip validation
await supabase.from('expenses').update({ status: 'paid' })
// Must validate transition

// WRONG: Allow editing approved expense
await updateExpense(approvedExpenseId, { amount: 999 })
// Only draft expenses should be editable
```

---

## Checklist

- [ ] Amount validation (positive number)
- [ ] Category is valid enum
- [ ] Status transitions validated
- [ ] Role check for approvals
- [ ] Rejection requires reason
- [ ] Company isolation in queries
- [ ] Receipt URL handled (if uploaded)
- [ ] revalidatePath on all mutations
