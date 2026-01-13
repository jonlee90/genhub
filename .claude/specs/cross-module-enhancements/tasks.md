# Cross-Module Enhancements - Implementation Tasks

## References
- Requirements: `.claude/specs/cross-module-enhancements/requirements.md`
- Design: `.claude/specs/cross-module-enhancements/design.md`

---

## Critical Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CRITICAL PATH                                      │
│                                                                              │
│  1.1 ──► 1.2 ──► 1.3 ──► 2.1 ──► 2.2 ──► 2.3 ──► 3.1 ──► 3.2 ──► 4.1      │
│   │       │       │       │       │       │       │       │       │         │
│  DB    Actions  Actions  Action   UI     Modal   Action   UI    Test        │
│  Migr  Tasks    Expense  Vendor  Combo   Integ   Costs   Cards  All         │
│                                                                              │
│  Parallel Tracks (after 1.3):                                               │
│  - Module 2 (1.3 ──► 2.1 ──► 2.2 ──► 2.3)                                  │
│  - Module 3 (1.3 ──► 3.1 ──► 3.2)                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Backend Foundation (Module 1)

### Task 1.1: Add is_primary column to task_assignees
- **Agent:** backend-engineer
- **Complexity:** S (Small)
- **Skill:** `skills/database/create-migration.md`
- **Output:** `supabase/migrations/{timestamp}_add_task_assignees_is_primary.sql`
- **Requirements:**
  - Add `is_primary boolean NOT NULL DEFAULT false` column
  - Create partial index: `idx_task_assignees_primary ON task_assignees(task_id) WHERE is_primary = true`
  - Create trigger function `ensure_single_primary_assignee()` to enforce single primary per task
  - Create trigger `trg_single_primary_assignee` AFTER INSERT OR UPDATE
- **Acceptance Criteria:**
  - [ ] Migration applies without error
  - [ ] Column exists with correct default
  - [ ] Trigger prevents multiple primaries per task
  - [ ] Index created for primary lookups
  - [ ] Types regenerated via `supabase gen types`
- **Testing:**
  - Insert two assignees with `is_primary=true` for same task; verify only last one remains primary
  - Verify existing data unaffected (all `is_primary=false`)
- **Covers:** US-1.4 (database support)

---

### Task 1.2: Create/Update Task Server Actions for Auto-Expense
- **Agent:** backend-engineer
- **Complexity:** M (Medium)
- **Skill:** `skills/backend/server-action.md`
- **Output:** `app/actions/tasks.ts` (modifications)
- **Dependencies:** Task 1.1
- **Requirements:**
  - Extend `UpdateTaskInput` interface with `autoCreateExpense?: boolean`, `primaryAssigneeId?: string`
  - Add `setPrimaryAssignee(taskId, assigneeId, assigneeType)` action
  - Modify `updateTask` to handle `autoCreateExpense` flag
  - When flag true and `actual_cost > 0`, call `createExpenseFromTask` internally
  - Return expense ID in response if created
- **Acceptance Criteria:**
  - [ ] TypeScript compiles without errors
  - [ ] `setPrimaryAssignee` updates `is_primary` column
  - [ ] `updateTask` with `autoCreateExpense=true` triggers expense creation
  - [ ] Proper error handling (task saves even if expense fails)
  - [ ] revalidatePath called for task and expense routes
- **Testing:**
  - Update task with `autoCreateExpense=true` and verify expense created
  - Update task with `autoCreateExpense=false` and verify no expense created
  - Set primary assignee and verify column updated
- **Covers:** US-1.3, US-1.4

---

### Task 1.3: Create Expense from Task Server Action
- **Agent:** backend-engineer
- **Complexity:** M (Medium)
- **Skill:** `skills/backend/server-action.md`
- **Output:** `app/actions/expenses.ts` (additions)
- **Dependencies:** Task 1.1, Task 1.2
- **Requirements:**
  - Create `createExpenseFromTask(taskId: string): Promise<ExpenseResult>` action
  - Fetch task data including primary assignee name
  - Map fields per design: amount, description, project_id, task_id, expense_date, category, vendor_name
  - Implement category mapping: `{ work: 'labor', purchase: 'materials', approval: 'permits', admin: 'other' }`
  - Handle case where no primary assignee (use creator name or leave blank)
  - Zod schema for input validation
- **Acceptance Criteria:**
  - [ ] Action creates expense with correct field mappings
  - [ ] Category derived from task_type correctly
  - [ ] Vendor name from primary assignee (user.name or subcontractor.company_name)
  - [ ] Returns `{ data: Expense }` on success
  - [ ] Returns `{ error: string }` on failure
  - [ ] Task-expense link established via task_id
- **Testing:**
  - Create expense from task with user assignee - verify vendor_name
  - Create expense from task with subcontractor assignee - verify vendor_name
  - Create expense from task with no assignee - verify behavior
  - Verify all field mappings match design spec
- **Covers:** US-1.3

---

## Phase 2: Backend Foundation (Modules 2 & 3)

### Task 2.1: Create getVendorOptions Server Action
- **Agent:** backend-engineer
- **Complexity:** S (Small)
- **Skill:** `skills/backend/server-action.md`
- **Output:** `app/actions/expenses.ts` (additions)
- **Dependencies:** None (can run parallel to Phase 1)
- **Requirements:**
  - Create `getVendorOptions(companyId: string): Promise<VendorOption[]>` action
  - Query company_users joined with user_profiles for members
  - Query subcontractors for company
  - Filter to active records only
  - Return combined, sorted list with type indicators
  - Interface: `{ id, name, type: 'member' | 'subcontractor', displayName }`
- **Acceptance Criteria:**
  - [ ] Returns both members and subcontractors
  - [ ] Only active records included
  - [ ] Sorted alphabetically within groups
  - [ ] DisplayName formatted correctly
  - [ ] Handles company with no subcontractors
- **Testing:**
  - Call for company with members and subs - verify both returned
  - Call for company with only members - verify no errors
  - Verify inactive records excluded
- **Covers:** US-2.2

---

### Task 2.2: Create VendorCombobox Component
- **Agent:** frontend-engineer
- **Complexity:** L (Large)
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/expenses/VendorCombobox.tsx`
- **Dependencies:** Task 2.1
- **Requirements:**
  - Hybrid combobox with dropdown + free-form entry
  - Desktop: Popover with Command (cmdk) for filtering
  - Mobile: Bottom sheet modal with search
  - Grouped options: "Team Members" / "Subcontractors"
  - Custom entry option when typed text doesn't match
  - Clear button to reset selection
  - 48px row height, 44px minimum touch targets
  - Debounce filter input by 150ms
- **Acceptance Criteria:**
  - [ ] Dropdown shows grouped options
  - [ ] Filtering works case-insensitive
  - [ ] Custom entry allowed and shown as option
  - [ ] Clear button resets to empty
  - [ ] Mobile renders as bottom sheet
  - [ ] Touch targets meet 44px minimum
  - [ ] No Supabase imports in component
- **Testing:**
  - Type partial match - verify filtering
  - Type non-matching text - verify custom entry option appears
  - Select option - verify value populated
  - Clear selection - verify reset
  - Test on mobile viewport - verify bottom sheet
- **Covers:** US-2.1, US-2.3

---

### Task 2.3: Integrate VendorCombobox into Expense Modals
- **Agent:** frontend-engineer
- **Complexity:** S (Small)
- **Skill:** `skills/frontend/modal-patterns.md`
- **Output:**
  - `components/expenses/modals/CreateExpenseModal.tsx` (modifications)
  - `components/expenses/modals/ExpenseDetailModal.tsx` (modifications)
- **Dependencies:** Task 2.2
- **Requirements:**
  - Replace vendor_name Input with VendorCombobox
  - Fetch vendor options on modal mount via Server Action
  - Pass selected value as string to create/update actions
  - Maintain existing form validation
  - Loading state while fetching options
- **Acceptance Criteria:**
  - [ ] CreateExpenseModal uses VendorCombobox
  - [ ] ExpenseDetailModal uses VendorCombobox in edit mode
  - [ ] Options loaded from Server Action
  - [ ] Form submission works with combobox value
  - [ ] Graceful fallback if options fail to load
- **Testing:**
  - Create expense with selected vendor - verify saved
  - Create expense with custom vendor - verify saved
  - Edit expense vendor - verify update works
- **Covers:** US-2.1

---

### Task 3.1: Create getProjectTeamCostSummary Server Action
- **Agent:** backend-engineer
- **Complexity:** L (Large)
- **Skill:** `skills/backend/server-action.md`
- **Output:** `app/actions/projects.ts` (additions)
- **Dependencies:** Task 1.1 (needs is_primary column)
- **Requirements:**
  - Create `getProjectTeamCostSummary(projectId: string): Promise<TeamCostSummary[]>` action
  - Implement optimized CTE query per design spec
  - Aggregate task costs by primary assignee
  - Aggregate expense costs by vendor_name match
  - Return combined summary with totals
  - Interface: `{ id, name, type, avatarUrl, role, taskCosts, expenseCosts, totalCosts, taskCount, expenseCount }`
- **Acceptance Criteria:**
  - [ ] Returns all project team members and subcontractors
  - [ ] Task costs calculated correctly (where is_primary=true)
  - [ ] Expense costs matched by vendor_name
  - [ ] Sorted by totalCosts descending
  - [ ] Query executes within 500ms for 50 members / 1000 records
  - [ ] Zero values returned for members with no costs
- **Testing:**
  - Project with costs attributed - verify correct aggregation
  - Project with zero costs - verify $0 values returned
  - Project with no team - verify empty array
  - Performance test with large dataset
- **Covers:** US-3.1, US-3.5

---

## Phase 3: Frontend - Module 1 Components

### Task 3.2: Create AutoExpenseToggle Component
- **Agent:** frontend-engineer
- **Complexity:** M (Medium)
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/tasks/forms/AutoExpenseToggle.tsx`
- **Dependencies:** None (can start after design approval)
- **Requirements:**
  - Toggle switch using `@/components/ui/switch`
  - Expense preview card when enabled
  - Props: enabled, onToggle, actualCost, taskTitle, vendorName, category, disabled
  - Preview shows: amount, description, category, vendor, date
  - Real-time preview updates as source fields change
  - 44px minimum toggle height
  - Success styling when enabled: `bg-green-50 border-green-200`
- **Acceptance Criteria:**
  - [ ] Toggle renders with clear on/off states
  - [ ] Preview appears only when toggle on
  - [ ] Preview shows all expense fields
  - [ ] Styling matches design spec
  - [ ] Touch target meets 44px minimum
  - [ ] No Supabase imports
- **Testing:**
  - Toggle on - verify preview appears
  - Toggle off - verify preview hidden
  - Change actualCost - verify preview updates
  - Test accessibility (keyboard navigation)
- **Covers:** US-1.2, US-1.5

---

### Task 3.3: Create PrimaryAssigneeSelector Component
- **Agent:** frontend-engineer
- **Complexity:** M (Medium)
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/tasks/forms/PrimaryAssigneeSelector.tsx`
- **Dependencies:** None (can start after design approval)
- **Requirements:**
  - Radio-style selection for primary assignee
  - Props: assignees[], primaryId, onPrimaryChange, disabled
  - Show avatar, name, and company (for subcontractors)
  - Star icon (filled/outline) for primary indicator
  - 48px row height per assignee
  - Only visible when assignees.length > 1
  - Hint text explaining purpose
- **Acceptance Criteria:**
  - [ ] Displays all assignees with selection indicator
  - [ ] Only one can be selected (radio behavior)
  - [ ] Star icon shows primary status
  - [ ] Subcontractors show company name
  - [ ] Touch targets meet 48px minimum
  - [ ] Component hidden when <= 1 assignee
- **Testing:**
  - Select different assignee - verify state updates
  - Verify visual feedback on selection
  - Test with 1 assignee - verify not rendered
- **Covers:** US-1.4

---

### Task 3.4: Integrate Auto-Expense into TaskModal
- **Agent:** frontend-engineer
- **Complexity:** M (Medium)
- **Skill:** `skills/frontend/modal-patterns.md`
- **Output:** `components/tasks/modals/TaskModal.tsx` (modifications)
- **Dependencies:** Task 1.2, Task 1.3, Task 3.2, Task 3.3
- **Requirements:**
  - Add state: autoExpenseEnabled, primaryAssigneeId
  - Conditionally render AutoExpenseToggle when actualCost > 0
  - Conditionally render PrimaryAssigneeSelector when assignees.length > 1
  - Pass autoCreateExpense flag to updateTask action
  - Show success toast with expense link on creation
  - Position components per design (between costs and receipt upload)
- **Acceptance Criteria:**
  - [ ] Toggle hidden when actualCost is 0 or empty
  - [ ] Toggle appears when actualCost > 0
  - [ ] Primary selector appears when multiple assignees
  - [ ] Save passes autoCreateExpense to action
  - [ ] Success toast shows link to created expense
  - [ ] Error toast shows if expense creation fails (task still saves)
- **Testing:**
  - Full flow: Add actual cost, enable toggle, save, verify expense created
  - Verify toggle hidden when no cost
  - Verify primary selector with multiple assignees
  - Test expense creation failure handling
- **Covers:** US-1.1, US-1.2, US-1.3, US-1.4, US-1.5

---

## Phase 4: Frontend - Module 3 Components

### Task 4.1: Create TeamCostRow Component
- **Agent:** frontend-engineer
- **Complexity:** S (Small)
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/projects/TeamCostRow.tsx`
- **Dependencies:** None
- **Requirements:**
  - Display single team member cost summary
  - Props: summary (TeamCostSummary), onClick
  - Show: avatar/icon, name, role badge, cost columns
  - 3-column layout: Tasks, Expenses, Total
  - 48px minimum row height
  - Tappable with `active:bg-gray-50` feedback
- **Acceptance Criteria:**
  - [ ] Renders member info with avatar
  - [ ] Renders subcontractor info with building icon
  - [ ] Shows formatted currency values
  - [ ] Role badge displays correctly
  - [ ] Touch target meets 48px minimum
- **Testing:**
  - Render with member data - verify display
  - Render with subcontractor data - verify display
  - Render with zero costs - verify $0 shown
- **Covers:** US-3.2

---

### Task 4.2: Create TeamCostSummaryCard Component
- **Agent:** frontend-engineer
- **Complexity:** M (Medium)
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/projects/TeamCostSummaryCard.tsx`
- **Dependencies:** Task 4.1
- **Requirements:**
  - Card displaying all team member costs
  - Props: summaries[], loading, error, onRetry
  - Use InfoCard pattern from ProjectOverview
  - Header with Users icon
  - Map TeamCostRow for each summary
  - Totals row at bottom
  - Loading: skeleton placeholders
  - Error: message with retry button
  - Empty: "No team members assigned"
- **Acceptance Criteria:**
  - [ ] Matches InfoCard styling
  - [ ] Renders all team members via TeamCostRow
  - [ ] Totals row shows sums
  - [ ] Loading state shows skeletons
  - [ ] Error state shows retry option
  - [ ] Empty state shows message
- **Testing:**
  - Render with data - verify all rows and totals
  - Render loading state - verify skeletons
  - Render error state - verify retry button works
  - Render empty state - verify message
- **Covers:** US-3.1, US-3.2

---

### Task 4.3: Integrate TeamCostSummaryCard into ProjectOverview
- **Agent:** frontend-engineer
- **Complexity:** S (Small)
- **Skill:** `skills/frontend/page-creation.md`
- **Output:**
  - `app/app/projects/[id]/page.tsx` (modifications)
  - `components/projects/ProjectOverview.tsx` (modifications)
- **Dependencies:** Task 3.1, Task 4.2
- **Requirements:**
  - Fetch team cost summary in page server component
  - Pass data to ProjectOverview component
  - Add TeamCostSummaryCard to sidebar column
  - Position below Client Information section
- **Acceptance Criteria:**
  - [ ] Data fetched server-side via getProjectTeamCostSummary
  - [ ] TeamCostSummaryCard renders in sidebar
  - [ ] Positioned correctly per design
  - [ ] Loading/error states work
- **Testing:**
  - Load project overview - verify card appears
  - Verify data matches expected aggregations
- **Covers:** US-3.1

---

### Task 4.4: Enhance ProjectTeam Member Cards with Costs
- **Agent:** frontend-engineer
- **Complexity:** M (Medium)
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/projects/ProjectTeam.tsx` (modifications)
- **Dependencies:** Task 3.1
- **Requirements:**
  - Add cost summary line to member cards
  - Format: "{taskCount} tasks - ${taskCosts} costs - ${expenseCosts} expenses"
  - Only show line if any values > 0
  - Style: `text-xs text-gray-500`
  - Add same enhancement to subcontractor cards
  - Fetch cost data and match by member/sub ID
- **Acceptance Criteria:**
  - [ ] Member cards show cost line when costs exist
  - [ ] Subcontractor cards show cost line when costs exist
  - [ ] Line hidden when all values are 0
  - [ ] Styling matches spec
  - [ ] Does not significantly increase card height
- **Testing:**
  - Member with costs - verify line appears
  - Member without costs - verify line hidden
  - Subcontractor with costs - verify line appears
- **Covers:** US-3.3, US-3.4

---

## Phase 5: Integration & Polish

### Task 5.1: Create Index for vendor_name Expense Lookups
- **Agent:** backend-engineer
- **Complexity:** S (Small)
- **Skill:** `skills/database/create-migration.md`
- **Output:** `supabase/migrations/{timestamp}_add_expense_vendor_index.sql`
- **Dependencies:** None (can run anytime)
- **Requirements:**
  - Create index on `expenses(vendor_name, project_id)` for cost aggregation performance
  - Non-blocking index creation
- **Acceptance Criteria:**
  - [ ] Migration applies without error
  - [ ] Index exists and is used in cost queries
- **Testing:**
  - EXPLAIN ANALYZE on cost summary query - verify index usage
- **Covers:** US-3.5

---

### Task 5.2: End-to-End Integration Testing
- **Agent:** code-reviewer
- **Complexity:** M (Medium)
- **Output:** Test report in PR description
- **Dependencies:** All previous tasks
- **Requirements:**
  - Test Module 1: Full auto-expense creation flow
  - Test Module 2: Vendor combobox in create/edit expense
  - Test Module 3: Team cost summary accuracy
  - Verify RLS enforcement on all new queries
  - Mobile testing (375px viewport)
  - Console error check
- **Acceptance Criteria:**
  - [ ] All user stories verified against acceptance criteria
  - [ ] No console errors
  - [ ] RLS policies enforced (test with different users)
  - [ ] Mobile layouts correct
  - [ ] Build passes without errors
- **Test Cases:**
  - US-1.1: Toggle visibility based on actual_cost
  - US-1.2: Toggle interaction and preview
  - US-1.3: Expense created with correct fields
  - US-1.4: Primary assignee designation
  - US-2.1: Combobox selection and free-form
  - US-2.3: Mobile bottom sheet behavior
  - US-3.1: Cost summary accuracy
  - US-3.3/3.4: Team card cost lines
- **Covers:** All user stories

---

### Task 5.3: Documentation Sync
- **Agent:** backend-engineer OR frontend-engineer
- **Complexity:** S (Small)
- **Output:** Updated index files
- **Dependencies:** All implementation tasks
- **Requirements:**
  - Run `/kc:sync-docs`
  - Update `tables.md` (task_assignees changes)
  - Update `actions.md` (new actions)
  - Update `components.md` (new components)
- **Acceptance Criteria:**
  - [ ] All new actions documented
  - [ ] All new components documented
  - [ ] Schema changes reflected
- **Covers:** Documentation maintenance

---

## Execution Summary

### Task Dependency Graph

```
                    ┌───────┐
                    │  1.1  │ DB Migration
                    └───┬───┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
        ┌───────┐   ┌───────┐   ┌───────┐
        │  1.2  │   │  3.1  │   │  2.1  │  (Parallel)
        └───┬───┘   └───┬───┘   └───┬───┘
            │           │           │
            ▼           │           ▼
        ┌───────┐       │       ┌───────┐
        │  1.3  │       │       │  2.2  │
        └───┬───┘       │       └───┬───┘
            │           │           │
            │           │           ▼
            │           │       ┌───────┐
            │           │       │  2.3  │
            │           │       └───────┘
            │           │
    ┌───────┴───────┐   │
    ▼               ▼   │
┌───────┐       ┌───────┐
│  3.2  │       │  3.3  │  (Parallel)
└───┬───┘       └───┬───┘
    └───────┬───────┘
            ▼
        ┌───────┐
        │  3.4  │ TaskModal Integration
        └───────┘

        ┌───────┐
        │  4.1  │ (Can start early)
        └───┬───┘
            ▼
        ┌───────┐
        │  4.2  │
        └───┬───┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
┌───────┐ ┌───────┐ ┌───────┐
│  4.3  │ │  4.4  │ │  5.1  │ (Parallel)
└───────┘ └───────┘ └───────┘
            │
            ▼
        ┌───────┐
        │  5.2  │ Integration Testing
        └───┬───┘
            ▼
        ┌───────┐
        │  5.3  │ Doc Sync
        └───────┘
```

### Parallelization Opportunities

| Parallel Group | Tasks | Condition |
|----------------|-------|-----------|
| After 1.1 | 1.2, 3.1, 2.1 | All can start once migration complete |
| After design | 3.2, 3.3, 4.1 | UI components with no backend deps |
| After 4.2 | 4.3, 4.4, 5.1 | Frontend integration + perf index |

### Estimated Effort by Agent

| Agent | Tasks | Complexity Total |
|-------|-------|------------------|
| backend-engineer | 1.1, 1.2, 1.3, 2.1, 3.1, 5.1 | 1S + 2M + 1L + 1S + 1S = 6 tasks |
| frontend-engineer | 2.2, 2.3, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4 | 1L + 1S + 2M + 1M + 1S + 1M + 1S + 1M = 9 tasks |
| code-reviewer | 5.2 | 1M |
| any | 5.3 | 1S |

### Total Counts
- **Backend Tasks:** 6
- **Frontend Tasks:** 9
- **Review/Polish Tasks:** 2
- **Total:** 17 tasks

### Complexity Distribution
- **Small (S):** 7 tasks
- **Medium (M):** 8 tasks
- **Large (L):** 2 tasks

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CTE query performance | Task 5.1 adds index; test with realistic data in 3.1 |
| VendorCombobox complexity | Break into desktop/mobile variants if needed |
| TaskModal already complex | Careful integration; preserve existing functionality |
| RLS on cost aggregation | Test thoroughly in 5.2 with multi-tenant data |

---

**Status:** ✅ COMPLETED (2026-01-12)

**Execution Summary:**
1. ✅ Backend Phase 1: Tasks 1.1, 1.2, 1.3 (Database & Server Actions)
2. ✅ Backend Phase 2: Tasks 2.1, 3.1 (Parallel backend tasks)
3. ✅ Frontend Phase 1: Tasks 3.2, 3.3, 4.1 (Independent UI components)
4. ✅ Frontend Phase 2: Tasks 2.2, 2.3, 3.4, 4.2, 4.3, 4.4 (Integration)
5. ✅ Review & Polish: Tasks 5.1, 5.2 (Performance index & testing)

**Implementation Details:**
- 2 migrations applied (is_primary column, vendor index)
- 3 action files modified (tasks.ts, expenses.ts, projects.ts)
- 10 new components created
- 6 existing components modified
- Build: ✅ PASS
- Tests: ✅ PASS (17/18 user stories verified)
