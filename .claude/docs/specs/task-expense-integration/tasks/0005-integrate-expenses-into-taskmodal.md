# Task 5: Integrate TaskExpensesSection into TaskModal

## Status
✅ Completed

## Dependencies
- Task 1: Field Visibility Configuration (✅ Completed)
- Task 3: TaskExpensesSection Component (✅ Completed)
- Task 4: Server Action for Task Expenses (✅ Completed)

## Overview
Integrate the TaskExpensesSection component into TaskModal, enabling users to view and add expenses directly from task edit mode.

## Subtasks

### 5.1 Add Conditional Rendering for Expenses Section ✅
**File:** `/components/tasks/TaskModal.tsx`

- ✅ Import TaskExpensesSection component
- ✅ Wrap with visibility check: `isFieldVisible(taskType, 'expensesSection', mode)`
- ✅ Only show in edit mode for Work and Purchase tasks
- ✅ Position section logically in modal layout (after materials, before attachments)

**Reference:** Req 5.5-5.6, Req 10.1

---

### 5.2 Fetch Task Expenses on Modal Open ✅
- ✅ Add state for expenses: `const [expenses, setExpenses] = useState<TaskExpense[]>([])`
- ✅ Add loading state: `const [expensesLoading, setExpensesLoading] = useState(false)`
- ✅ Call `getTaskExpenses` server action with `task.id` when modal opens in edit mode
- ✅ Only fetch if task exists and mode is edit
- ✅ Handle loading and error states

**Example:**
```tsx
useEffect(() => {
  if (task?.id && mode === 'edit') {
    fetchExpenses();
  }
}, [task?.id, mode]);

const fetchExpenses = async () => {
  setExpensesLoading(true);
  const result = await getTaskExpenses(task.id);
  if (result.success) {
    setExpenses(result.data || []);
  }
  setExpensesLoading(false);
};
```

**Reference:** Req 6.1

---

### 5.3 Pass Required Props to TaskExpensesSection ✅
- ✅ Pass `taskId={task.id}`
- ✅ Pass `taskTitle={task.title}`
- ✅ Pass `projectId={task.project_id}`
- ✅ Pass `projectName` from projects prop (find by project_id)
- ✅ Pass `expenses={expenses}`
- ✅ Pass `projects` and `tasks` arrays for CreateExpenseModal dropdown
- ✅ Pass `onExpenseAdded={handleExpenseAdded}` callback

**Reference:** Req 5.4

---

### 5.4 Implement Expense Refresh Callback ✅
- ✅ Create `handleExpenseAdded` callback function
- ✅ Re-fetch expenses after successful expense creation
- ✅ Optionally refresh entire task data to update actual_cost
- ✅ Show success toast notification (via onSuccess callback)

**Example:**
```tsx
const handleExpenseAdded = async () => {
  await fetchExpenses();
  // Optionally: refetch entire task to update costs
  toast.success('Expense added successfully');
};
```

**Reference:** Req 5.4

---

## Testing Checklist
- [ ] Work task (edit mode): Expenses section visible
- [ ] Purchase task (edit mode): Expenses section visible
- [ ] Approval/Admin task (edit mode): Expenses section hidden
- [ ] Any task (create mode): Expenses section hidden
- [ ] Expenses load correctly when modal opens
- [ ] Add expense button opens CreateExpenseModal with correct context
- [ ] Expense list refreshes after adding new expense
- [ ] Loading states display correctly

## Files Modified
- `/components/tasks/TaskModal.tsx`

## Estimated Complexity
🟡 Medium - Component integration with state management
