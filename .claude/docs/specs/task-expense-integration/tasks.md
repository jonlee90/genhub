# Implementation Tasks: Task-Expense Integration

## Document Information

| Field | Value |
|-------|-------|
| Feature | Task-Expense Integration |
| Version | 1.0 |
| Created | 2025-12-29 |
| Design Doc | [design.md](./design.md) |
| Requirements Doc | [requirements.md](./requirements.md) |

---

## Task Summary

This implementation plan breaks down the Task-Expense Integration feature into incremental, testable coding tasks. Each task builds on previous work and maintains a test-driven approach where appropriate.

---

## 1. Field Visibility Configuration

- [ ] 1.1 Create task type field visibility configuration file
  - Create `/lib/config/task-type-fields.ts`
  - Define `FieldVisibility` interface with all task form fields
  - Define `FieldConfig` interface with visibility, labels, defaults, and styling
  - Implement `TASK_TYPE_CONFIG` record mapping each task type (work, purchase, approval, admin) to its configuration
  - Reference: Req 1.1-1.6, Req 2.1-2.7, Req 3.1-3.7, Req 4.1-4.4, Req 10

- [ ] 1.2 Implement helper functions for field visibility
  - Add `getTaskTypeConfig(type: TaskType | null): FieldConfig` function
  - Add `isFieldVisible(type: TaskType | null, field: keyof FieldVisibility, mode: 'create' | 'edit'): boolean` function
  - Ensure edit-only fields (actualCost, expensesSection, addExpenseButton) return false in create mode
  - Reference: Req 10.1

- [ ] 1.3 Write unit tests for field visibility configuration
  - Create `/lib/config/__tests__/task-type-fields.test.ts`
  - Test `getTaskTypeConfig` returns correct config for each task type
  - Test `isFieldVisible` correctly handles create vs edit mode
  - Test work type: materialsSection=false, expensesSection=true, label="Labor Cost"
  - Test purchase type: materialsSection=true, styling.materialsEmphasized=true, label="Budget"
  - Test approval type: plannedCost=false, approvalWorkflow=true
  - Test admin type: phase=false, startDate=false, defaults.priority="low"
  - Reference: Req 10.1-10.5

---

## 2. TaskModal Field Visibility Integration

- [ ] 2.1 Refactor TaskModal to import and use field visibility config
  - Modify `/components/tasks/TaskModal.tsx`
  - Import `getTaskTypeConfig`, `isFieldVisible` from task-type-fields config
  - Get current task type from form state or existing task data
  - Determine mode ('create' or 'edit') based on whether task prop exists
  - Reference: Req 10.1

- [ ] 2.2 Implement conditional rendering for Phase field
  - Wrap Phase select field with visibility check: `isFieldVisible(taskType, 'phase', mode)`
  - Admin tasks should not show Phase field
  - Reference: Req 4.2, Req 10.1 (Phase row)

- [ ] 2.3 Implement conditional rendering for Start Date field
  - Wrap Start Date field with visibility check: `isFieldVisible(taskType, 'startDate', mode)`
  - Admin tasks should not show Start Date field
  - When visible and creating, default to today's date
  - Reference: Req 1.6, Req 2.7, Req 3.7, Req 4.2, Req 10.1 (Start Date row)

- [ ] 2.4 Implement conditional rendering for cost fields
  - Wrap Planned Cost field with visibility check: `isFieldVisible(taskType, 'plannedCost', mode)`
  - Wrap Actual Cost field with visibility check: `isFieldVisible(taskType, 'actualCost', mode)`
  - Approval and Admin tasks should not show cost fields
  - Reference: Req 3.2, Req 4.2, Req 10.1 (Planned Cost row)

- [ ] 2.5 Implement dynamic labels for cost field
  - Get `config.labels.plannedCost` from task type config
  - Display "Labor Cost" for work tasks
  - Display "Budget" for purchase tasks
  - Reference: Req 1.5, Req 2.4, Req 10.2-10.3

- [ ] 2.6 Implement default values based on task type
  - When task type is 'admin', default priority to 'low'
  - When creating work/purchase/approval tasks, default startDate to today
  - Apply defaults via form state management
  - Reference: Req 4.3, Req 10.5

- [ ] 2.7 Implement conditional rendering for Materials section
  - Wrap TaskMaterialsManager with visibility check: `isFieldVisible(taskType, 'materialsSection', mode)`
  - Only Purchase tasks should show Materials section
  - Reference: Req 1.2, Req 2.1, Req 3.3, Req 10.1 (Materials Section row)

- [ ] 2.8 Add emphasized styling for Materials section in Purchase tasks
  - Get `config.styling.materialsEmphasized` from task type config
  - When true, apply emerald/green border highlight (e.g., `border-emerald-200`)
  - Add "Required for Purchase Tasks" indicator text
  - Reference: Req 2.2-2.3

- [ ] 2.9 Implement conditional rendering for Approval Workflow section
  - Wrap approval workflow components with visibility check: `isFieldVisible(taskType, 'approvalWorkflow', mode)`
  - Only Approval tasks should show workflow section
  - Display Approve/Reject/Request Revision buttons in edit mode
  - Reference: Req 3.1, Req 3.5-3.6, Req 10.1 (Approval Workflow row)

- [ ] 2.10 Add approval status badge to header for Approval tasks
  - Check `config.styling.headerBadge === 'approval_status'`
  - Display badge with current approval_status value in task header
  - Reference: Req 10.4

---

## 3. TaskExpensesSection Component

- [ ] 3.1 Create TaskExpensesSection component structure
  - Create `/components/tasks/TaskExpensesSection.tsx`
  - Add 'use client' directive
  - Define `TaskExpensesSectionProps` interface with taskId, taskTitle, projectId, projectName, expenses, onExpenseAdded, projects, tasks
  - Define `TaskExpense` interface with id, description, amount, status, expense_date, vendor_name, category
  - Reference: Req 6.1-6.2

- [ ] 3.2 Implement expense list display
  - Map over expenses array to render compact expense cards
  - Display description, amount (formatted as currency), vendor_name, expense_date
  - Show status icon using STATUS_CONFIG mapping (Clock for pending, CheckCircle2 for approved, XCircle for rejected)
  - Apply construction theme colors
  - Reference: Req 6.2

- [ ] 3.3 Implement expense totals summary
  - Calculate total amount from all expenses
  - Calculate approved amount from expenses with status 'approved' or 'paid'
  - Display totals in header area: "Total: $X" and "Approved: $Y"
  - Reference: Req 6.3

- [ ] 3.4 Implement empty state for no expenses
  - Show Receipt icon, "No expenses yet" message, and helper text
  - Style with dashed border and gray background
  - Reference: Req 6.4

- [ ] 3.5 Implement Add Expense button
  - Add Button with Plus icon and "Add Expense" text
  - Style with construction-blue background
  - Toggle showCreateModal state on click
  - Reference: Req 5.1

- [ ] 3.6 Integrate CreateExpenseModal with taskContext
  - Pass `taskContext` prop to CreateExpenseModal: { taskId, taskTitle, projectId, projectName }
  - Handle modal close/success via onClose callback
  - Call onExpenseAdded callback on successful expense creation
  - Reference: Req 5.2

- [ ] 3.7 Add expense count badge to section header
  - Display Badge component with `expenses.length` next to "Expenses" title
  - Only show badge when expenses.length > 0
  - Reference: Req 6.6

---

## 4. Server Action for Task Expenses

- [ ] 4.1 Create getTaskExpenses server action
  - Modify `/app/actions/expenses.ts`
  - Add `getTaskExpenses(taskId: string)` async function
  - Query expenses table filtering by task_id
  - Select: id, description, amount, status, expense_date, vendor_name, category
  - Order by expense_date descending
  - Return typed array of TaskExpense
  - Reference: Req 6.1

- [ ] 4.2 Add error handling to getTaskExpenses
  - Validate taskId is provided
  - Check user authentication via session
  - Handle Supabase query errors
  - Return { success: boolean, data?: TaskExpense[], error?: string }
  - Reference: Req 6.5

---

## 5. Integrate TaskExpensesSection into TaskModal

- [ ] 5.1 Add expenses section conditional rendering to TaskModal
  - Wrap TaskExpensesSection with visibility check: `isFieldVisible(taskType, 'expensesSection', mode)`
  - Only show in edit mode for Work and Purchase tasks
  - Reference: Req 5.5-5.6, Req 10.1 (Expenses Section row)

- [ ] 5.2 Fetch task expenses when TaskModal opens in edit mode
  - Call getTaskExpenses server action with task.id
  - Store expenses in component state
  - Handle loading and error states
  - Reference: Req 6.1

- [ ] 5.3 Pass required props to TaskExpensesSection
  - Pass task.id as taskId
  - Pass task.title as taskTitle
  - Pass task.project_id as projectId
  - Pass project name from projects prop
  - Pass fetched expenses array
  - Pass projects and tasks arrays for CreateExpenseModal
  - Pass refresh callback as onExpenseAdded
  - Reference: Req 5.4

- [ ] 5.4 Implement expense list refresh after adding expense
  - Create callback function that re-fetches task expenses
  - Pass callback as onExpenseAdded prop
  - Reference: Req 5.4

---

## 6. CreateExpenseModal Context Handling

- [ ] 6.1 Add taskContext prop to CreateExpenseModal
  - Modify `/components/expenses/CreateExpenseModal.tsx`
  - Add optional `taskContext` prop: { taskId: string, taskTitle: string, projectId: string, projectName: string }
  - Reference: Req 5.2

- [ ] 6.2 Implement pre-filled values from taskContext
  - If taskContext provided, set initial project_id and task_id form values
  - Pre-select the project and task in form state
  - Reference: Req 5.2

- [ ] 6.3 Disable project and task dropdowns when context provided
  - If taskContext provided, set project Select to disabled
  - If taskContext provided, set task Select to disabled
  - Reference: Req 5.3

- [ ] 6.4 Display context info banner when context provided
  - Show informational banner at top of form: "Adding expense for task: {taskTitle}"
  - Display project name in banner
  - Style with construction-blue background/border
  - Reference: Req 5.3

---

## 7. Material-Expense Integration: Server Action

- [ ] 7.1 Create createExpenseFromMaterial server action
  - Add to `/app/actions/expenses.ts`
  - Accept parameters: material_assignment_id, task_id, project_id, amount, description, category
  - Validate user authentication
  - Insert expense record with status='submitted'
  - Insert expense_line_item record linking to material_assignment_id
  - Reference: Req 7.2-7.3

- [ ] 7.2 Add idempotency check for material expense
  - Query expense_line_items to check if material_assignment_id already has linked expense
  - If exists, return { success: true, alreadyLinked: true }
  - Prevent duplicate expense creation
  - Reference: Req 7.4

- [ ] 7.3 Implement getMaterialExpenseLink helper
  - Add `getMaterialExpenseLink(materialAssignmentId: string)` function
  - Query expense_line_items by material_assignment_id
  - Return expense_id if exists, null otherwise
  - Reference: Req 7.4, Req 11.2

---

## 8. MaterialDeliveryPrompt Component

- [ ] 8.1 Create MaterialDeliveryPrompt component structure
  - Create `/components/tasks/MaterialDeliveryPrompt.tsx`
  - Add 'use client' directive
  - Define props interface: isOpen, onClose, materialAssignment, onExpenseCreated
  - Import Dialog components from ui/dialog
  - Reference: Req 7.1

- [ ] 8.2 Implement dialog content with material details
  - Display material product_name and SKU
  - Display total_cost formatted as currency
  - Use Package and DollarSign icons
  - Apply construction theme styling
  - Reference: Req 7.1

- [ ] 8.3 Implement Create Expense button with server action
  - Add Button that calls createExpenseFromMaterial
  - Show loading state with Loader2 spinner during creation
  - Handle success: show toast, call onExpenseCreated, close dialog
  - Handle error: show error toast
  - Reference: Req 7.2

- [ ] 8.4 Implement Skip button
  - Add variant="outline" Button for skipping expense creation
  - Disable during loading state
  - Close dialog on click
  - Reference: Req 7.1

---

## 9. Integrate MaterialDeliveryPrompt into TaskMaterialsList

- [ ] 9.1 Add state for delivery prompt trigger
  - Modify `/components/tasks/TaskMaterialsList.tsx` or relevant materials component
  - Add state: deliveredMaterial, showDeliveryPrompt
  - Reference: Req 7.1

- [ ] 9.2 Detect procurement_status change to "delivered"
  - Watch for status update to "delivered" (via props change or after status update action)
  - Check if material assignment already has linked expense using getMaterialExpenseLink
  - If no linked expense, set showDeliveryPrompt=true and deliveredMaterial to the assignment
  - Reference: Req 7.1, Req 7.4

- [ ] 9.3 Render MaterialDeliveryPrompt conditionally
  - Render MaterialDeliveryPrompt when showDeliveryPrompt is true
  - Pass deliveredMaterial data
  - Handle onClose to reset state
  - Handle onExpenseCreated to refresh data and close prompt
  - Reference: Req 7.1

- [ ] 9.4 Add "Expense Linked" indicator to material assignments
  - For each material assignment, check if it has linked expense
  - Display linked indicator icon (Receipt with checkmark) if expense exists
  - Reference: Req 7.5, Req 11.2

---

## 10. Enhance getProjectsWithStats for Expense Data

- [ ] 10.1 Add expense query to getProjectsWithStats
  - Modify `/app/actions/projects.ts`
  - After fetching projects, query expenses table for all project_ids
  - Select: id, project_id, amount, status, category
  - Reference: Req 8.1, Req 9.2

- [ ] 10.2 Calculate expense statistics per project
  - Group expenses by project_id
  - Calculate totalExpenses: sum of all amounts
  - Calculate approvedExpenses: sum where status='approved' OR 'paid'
  - Calculate pendingExpenses: sum where status='submitted' OR 'under_review'
  - Calculate byCategory: aggregate amounts by category
  - Reference: Req 9.2, Req 9.5

- [ ] 10.3 Add expense stats to ProjectWithStats return type
  - Extend interface with expenseStats: { totalExpenses, approvedExpenses, pendingExpenses, rejectedExpenses, byCategory }
  - Include in returned project data
  - Reference: Req 8.1, Req 9.2

---

## 11. ProjectCard Expense Indicator

- [ ] 11.1 Create ExpenseBudgetIndicator sub-component
  - Add to `/components/projects/ProjectCard.tsx` or create separate file
  - Accept props: approvedExpenses, totalBudget
  - Display Receipt icon with "Expenses:" label
  - Format amounts with formatBudget utility
  - Reference: Req 8.1-8.2

- [ ] 11.2 Implement budget comparison display
  - Show "Expenses: $X / $Y" format when budget exists
  - Show "Expenses: $X" when no budget
  - Reference: Req 8.2, Req 8.5

- [ ] 11.3 Implement warning/alert indicators
  - Calculate percentage: (approvedExpenses / totalBudget) * 100
  - If >= 80% and < 100%, show amber AlertTriangle icon
  - If >= 100%, show red AlertTriangle icon
  - Apply corresponding text colors
  - Reference: Req 8.3-8.4

- [ ] 11.4 Integrate ExpenseBudgetIndicator into ProjectCard
  - Modify `/components/projects/ProjectCard.tsx`
  - Add indicator below existing budget/schedule row
  - Pass expenseStats from project data
  - Reference: Req 8.1

---

## 12. ProjectExpenseSummary Widget

- [ ] 12.1 Create ProjectExpenseSummary component structure
  - Create `/components/projects/ProjectExpenseSummary.tsx`
  - Add 'use client' directive
  - Define ExpenseStats interface: totalBudget, totalExpenses, approvedExpenses, pendingExpenses, rejectedExpenses, byCategory
  - Define props: projectId, stats, variant ('card' | 'widget')
  - Reference: Req 9.1

- [ ] 12.2 Implement widget variant header
  - Display DollarSign icon in construction-blue circle
  - Display "Expense Summary" title
  - Add "View All" link to `/app/expenses?project=${projectId}`
  - Reference: Req 9.4

- [ ] 12.3 Implement budget utilization progress bar
  - Calculate utilization: (approvedExpenses / totalBudget) * 100
  - Display Progress component with percentage label
  - Apply color based on utilization: blue (<80%), yellow (80-99%), red (>=100%)
  - Reference: Req 9.3

- [ ] 12.4 Implement stats grid display
  - Create 2x2 grid with: Total Budget, Total Expenses, Approved, Pending
  - Format amounts with formatCurrency utility
  - Apply semantic colors: green for Approved, yellow for Pending
  - Reference: Req 9.2

- [ ] 12.5 Implement category breakdown section
  - Display "By Category" header
  - Map over byCategory array showing category name and amount
  - Limit to top 4 categories
  - Reference: Req 9.5

- [ ] 12.6 Implement card variant (compact) for ProjectCard use
  - When variant='card', render single-line compact view
  - Show icon, "Expenses:", amount, and optional budget comparison
  - Reference: Req 8.1

---

## 13. Integrate ProjectExpenseSummary into Project Detail Page

- [ ] 13.1 Add ProjectExpenseSummary to project detail page
  - Modify `/app/app/projects/[id]/page.tsx` (create if not exists)
  - Fetch expense stats via getProjectsWithStats or new dedicated action
  - Render ProjectExpenseSummary with variant="widget"
  - Reference: Req 9.1

- [ ] 13.2 Position widget in project detail layout
  - Add to project overview/stats section
  - Ensure responsive layout on mobile
  - Reference: Req 9.1

---

## 14. Final Integration and Testing

- [ ] 14.1 Test work task field visibility flow
  - Create new Work task
  - Verify materials section hidden, expenses section hidden (create mode)
  - Open Work task in edit mode
  - Verify expenses section visible, add expense button visible
  - Verify cost label shows "Labor Cost"
  - Reference: Req 1, Req 10

- [ ] 14.2 Test purchase task field visibility flow
  - Create new Purchase task
  - Verify materials section visible with emphasized styling
  - Verify "Budget" label on cost field
  - Open Purchase task in edit mode
  - Verify expenses section visible
  - Reference: Req 2, Req 10

- [ ] 14.3 Test approval task field visibility flow
  - Create new Approval task
  - Verify cost fields hidden
  - Verify materials section hidden
  - Verify approval workflow section visible
  - Verify approval status badge in header
  - Reference: Req 3, Req 10

- [ ] 14.4 Test admin task field visibility flow
  - Create new Admin task
  - Verify minimal fields: only title, description, project, assignee, priority, due date
  - Verify priority defaults to "low"
  - Reference: Req 4, Req 10

- [ ] 14.5 Test add expense from task workflow
  - Open Work task in edit mode
  - Click Add Expense button
  - Verify CreateExpenseModal opens with project/task pre-filled and locked
  - Create expense
  - Verify expense appears in task's expense list
  - Reference: Req 5

- [ ] 14.6 Test material delivery expense creation
  - Change material assignment status to "delivered"
  - Verify MaterialDeliveryPrompt appears
  - Click Create Expense
  - Verify expense created with correct amount and material link
  - Verify prompt doesn't appear again for same material
  - Reference: Req 7

- [ ] 14.7 Test project expense indicators
  - View project list
  - Verify expense indicator shows on ProjectCard
  - Open project detail
  - Verify ProjectExpenseSummary widget displays
  - Reference: Req 8, Req 9

---

## Dependencies Diagram

```
1 (Field Config)
    |
    v
2 (TaskModal Updates)
    |
    +---> 3 (TaskExpensesSection) ---> 4 (Server Action) ---> 5 (Modal Integration)
    |                                                              |
    |                                                              v
    |                                                         6 (CreateExpenseModal)
    |
    +---> 7 (Material-Expense Server Action) ---> 8 (DeliveryPrompt) ---> 9 (Materials Integration)

10 (getProjectsWithStats) ---> 11 (ProjectCard Indicator)
                          |
                          +---> 12 (ProjectExpenseSummary) ---> 13 (Detail Page Integration)

14 (Final Testing) - depends on all above
```

---

## File Changes Summary

| File | Action | Task |
|------|--------|------|
| `/lib/config/task-type-fields.ts` | Create | 1.1, 1.2 |
| `/lib/config/__tests__/task-type-fields.test.ts` | Create | 1.3 |
| `/components/tasks/TaskModal.tsx` | Modify | 2.1-2.10 |
| `/components/tasks/TaskExpensesSection.tsx` | Create | 3.1-3.7 |
| `/app/actions/expenses.ts` | Modify | 4.1-4.2, 7.1-7.3 |
| `/components/expenses/CreateExpenseModal.tsx` | Modify | 6.1-6.4 |
| `/components/tasks/MaterialDeliveryPrompt.tsx` | Create | 8.1-8.4 |
| `/components/tasks/TaskMaterialsList.tsx` | Modify | 9.1-9.4 |
| `/app/actions/projects.ts` | Modify | 10.1-10.3 |
| `/components/projects/ProjectCard.tsx` | Modify | 11.1-11.4 |
| `/components/projects/ProjectExpenseSummary.tsx` | Create | 12.1-12.6 |
| `/app/app/projects/[id]/page.tsx` | Create/Modify | 13.1-13.2 |
