# Requirements Document

## Introduction

This specification defines the integration between Projects, Tasks, Materials, and Expenses modules in GenHub PWA. The goal is to create a cohesive workflow where:

1. Task creation is streamlined by showing only relevant fields based on task type
2. Expenses can be created and viewed directly from tasks
3. Materials and expenses work together (material purchases can auto-generate expenses)
4. Projects display expense summaries with budget comparison

The current implementation has task types (Work, Purchase, Approval, Admin) but shows all fields regardless of type. This spec defines type-specific field visibility and expense integration workflows.

---

## Requirements

### Requirement 1: Work Task Field Configuration

**User Story:** As a project manager, I want Work tasks to show only labor-relevant fields, so that my team can quickly create standard work tasks without confusion.

#### Acceptance Criteria

1. WHEN a user selects "Work" task type THEN the system SHALL display: Title, Description, Project, Phase, Assignee, Priority, Start Date, Due Date, Planned Cost, Actual Cost (edit mode only)
2. WHEN a user creates a Work task THEN the system SHALL NOT display the Materials section
3. WHEN a user creates a Work task THEN the system SHALL NOT display approval workflow fields
4. IF a Work task is being edited THEN the system SHALL allow adding expenses but NOT materials
5. WHEN displaying a Work task's costs THEN the label SHALL show "Labor Cost" instead of "Planned Cost"
6. WHEN creating a new Work task THEN the Start Date field SHALL be prefilled with today's date by default

---

### Requirement 2: Purchase Task Field Configuration

**User Story:** As a project manager, I want Purchase tasks to prominently feature materials management, so that procurement tasks are focused on selecting and tracking materials.

#### Acceptance Criteria

1. WHEN a user selects "Purchase" task type THEN the system SHALL display: Title, Description, Project, Phase, Assignee, Priority, Start Date, Due Date, Budget, Materials section (emphasized)
2. WHEN a Purchase task form is displayed THEN the Materials section SHALL be visually emphasized with a highlighted border and "Required for Purchase Tasks" indicator
3. WHEN a user creates a Purchase task THEN the system SHALL encourage adding materials with a prominent call-to-action
4. WHEN displaying a Purchase task's costs THEN the label SHALL show "Budget" instead of "Planned Cost"
5. WHEN a Purchase task is in edit mode THEN the system SHALL default to the "Search Products" tab in the materials section
6. IF materials are assigned to a Purchase task THEN the system SHALL calculate and display total materials cost automatically
7. WHEN creating a new Purchase task THEN the Start Date field SHALL be prefilled with today's date by default

---

### Requirement 3: Approval Task Field Configuration

**User Story:** As a project manager, I want Approval tasks to focus on the approval workflow, so that permits and inspections are processed efficiently.

#### Acceptance Criteria

1. WHEN a user selects "Approval" task type THEN the system SHALL display: Title, Description, Project, Phase, Assignee, Priority, Start Date, Due Date, Approval Workflow section
2. WHEN creating an Approval task THEN the system SHALL NOT display cost fields (Planned Cost, Actual Cost)
3. WHEN creating an Approval task THEN the system SHALL NOT display the Materials section
4. WHEN an Approval task is created THEN the system SHALL set approval_status to "pending" automatically
5. WHEN editing an Approval task THEN the system SHALL prominently display the Approval Workflow panel with Approve/Reject/Request Revision buttons
6. IF an Approval task has approval_status = 'approved' THEN the approval action buttons SHALL be disabled
7. WHEN creating a new Approval task THEN the Start Date field SHALL be prefilled with today's date by default

---

### Requirement 4: Admin Task Field Configuration

**User Story:** As a user, I want Admin tasks to have a minimal form, so that quick administrative items can be created with minimum friction.

#### Acceptance Criteria

1. WHEN a user selects "Admin" task type THEN the system SHALL display only: Title, Description, Project, Assignee, Priority, Due Date
2. WHEN creating an Admin task THEN the system SHALL NOT display: Phase, Start Date, Cost fields, Materials section
3. WHEN an Admin task is created THEN the system SHALL set priority to "low" by default
4. WHEN displaying Admin tasks in lists THEN the system SHALL use a distinct visual style (slate/gray colors)

---

### Requirement 5: Add Expense from Task

**User Story:** As a field worker, I want to add expenses directly from a task I'm working on, so that I can quickly log receipts without navigating away.

#### Acceptance Criteria

1. WHEN viewing a task in edit mode THEN the system SHALL display an "Add Expense" button in the task detail
2. IF the user clicks "Add Expense" from a task THEN the system SHALL open CreateExpenseModal with project_id and task_id pre-filled
3. WHEN CreateExpenseModal is opened from a task context THEN the project and task dropdowns SHALL be disabled (locked to the context)
4. WHEN an expense is successfully created from a task THEN the system SHALL refresh the task's expense list
5. IF the task type is "Work" or "Purchase" THEN the "Add Expense" button SHALL be visible
6. IF the task type is "Approval" or "Admin" THEN the "Add Expense" button SHALL NOT be visible

---

### Requirement 6: View Expenses in Task Detail

**User Story:** As a project manager, I want to see all expenses linked to a task, so that I can track actual costs against the budget.

#### Acceptance Criteria

1. WHEN viewing a task in edit mode THEN the system SHALL display an "Expenses" section showing linked expenses
2. WHEN displaying task expenses THEN the system SHALL show: description, amount, status, vendor name, expense date
3. WHEN task expenses are displayed THEN the system SHALL show total approved expenses amount
4. IF a task has no expenses THEN the system SHALL display an empty state with "No expenses yet" message
5. WHEN an expense is added or status changes THEN the task's actual_cost SHALL be automatically updated via database trigger
6. IF expenses exist for a task THEN the system SHALL display expense count badge on the Expenses tab

---

### Requirement 7: Auto-Create Expense from Material Purchase

**User Story:** As a project manager, I want material purchases to optionally create expenses automatically, so that procurement costs are tracked without duplicate data entry.

#### Acceptance Criteria

1. WHEN a material assignment's procurement_status changes to "delivered" THEN the system SHALL prompt user "Create expense from this purchase?"
2. IF user confirms expense creation THEN the system SHALL create an expense with: category="materials", amount=material total_cost, description="Material: {product_name}", task_id and project_id from assignment
3. WHEN auto-creating an expense from materials THEN the system SHALL link the expense_line_item to the material_assignment
4. IF a material assignment already has a linked expense THEN the system SHALL NOT prompt for expense creation
5. WHEN viewing material assignments THEN the system SHALL show whether an expense has been created (linked indicator)

---

### Requirement 8: Expense Summary on Project Cards

**User Story:** As a GC admin, I want to see expense totals on project cards, so that I can quickly identify budget concerns across all projects.

#### Acceptance Criteria

1. WHEN displaying a project card in the list view THEN the system SHALL show current total expenses amount
2. WHEN a project has a defined budget THEN the system SHALL show budget vs actual expenses comparison
3. IF total approved expenses exceed 80% of budget THEN the system SHALL display a warning indicator (amber)
4. IF total approved expenses exceed 100% of budget THEN the system SHALL display an alert indicator (red)
5. WHEN displaying expense info THEN the system SHALL format amounts as currency with appropriate abbreviations (e.g., $12.5K)

---

### Requirement 9: Expense Summary on Project Detail Page

**User Story:** As a project manager, I want to see detailed expense breakdown on the project detail page, so that I can analyze spending by category and status.

#### Acceptance Criteria

1. WHEN viewing project detail page THEN the system SHALL display an Expenses Summary widget
2. WHEN displaying expense summary THEN the system SHALL show: Total Budget, Total Expenses (submitted), Approved Expenses, Pending Expenses, Rejected Expenses
3. WHEN displaying expense summary THEN the system SHALL show a visual progress bar of budget utilization
4. IF clicking on expense summary widget THEN the system SHALL navigate to the project's expenses filter on /app/expenses page
5. WHEN displaying expense summary THEN the system SHALL show breakdown by category (materials, labor, equipment, etc.)

---

### Requirement 10: Task Type Field Visibility Matrix

**User Story:** As a developer, I need a clear field visibility matrix, so that the UI can consistently show/hide fields based on task type.

#### Acceptance Criteria

1. WHEN implementing task modal THEN the system SHALL follow this field visibility matrix:

| Field | Work | Purchase | Approval | Admin |
|-------|------|----------|----------|-------|
| Title | Yes | Yes | Yes | Yes |
| Description | Yes | Yes | Yes | Yes |
| Project | Yes | Yes | Yes | Yes |
| Phase | Yes | Yes | Yes | No |
| Assignee | Yes | Yes | Yes | Yes |
| Priority | Yes | Yes | Yes | Yes (default: low) |
| Start Date | Yes (default: today) | Yes (default: today) | Yes (default: today) | No |
| Due Date | Yes | Yes | Yes | Yes |
| Planned Cost/Budget | Yes (Labor Cost) | Yes (Budget) | No | No |
| Actual Cost | Yes (edit) | Yes (edit, auto-calc) | No | No |
| Materials Section | No | Yes | No | No |
| Approval Workflow | No | No | Yes | No |
| Add Expense Button | Yes (edit) | Yes (edit) | No | No |
| Expenses Section | Yes (edit) | Yes (edit) | No | No |

2. WHEN task type is "purchase" THEN cost label SHALL display "Budget"
3. WHEN task type is "work" THEN cost label SHALL display "Labor Cost"
4. WHEN task type is "approval" THEN the system SHALL display approval status badge in header
5. WHEN creating a new task (Work, Purchase, or Approval types) THEN the Start Date field SHALL be prefilled with today's date as the default value

---

### Requirement 11: Expense-Material Relationship Tracking

**User Story:** As a project manager, I want to see which expenses are linked to material purchases, so that I can verify procurement costs match actual spending.

#### Acceptance Criteria

1. WHEN displaying an expense that was created from a material purchase THEN the system SHALL show "From Material Purchase" indicator with material name
2. WHEN displaying a material assignment THEN the system SHALL show linked expense status if one exists
3. IF an expense has linked expense_line_items with material_assignment_id THEN the system SHALL display "Material-linked" badge
4. WHEN filtering expenses THEN the user SHALL be able to filter by "Material Purchases" category

---

### Requirement 12: Budget Tracking Integration

**User Story:** As a GC admin, I want project costs to be automatically tracked from tasks, materials, and expenses, so that I have accurate real-time budget visibility.

#### Acceptance Criteria

1. WHEN a task's actual_cost is updated (via trigger) THEN the project's financial summary SHALL reflect the change
2. WHEN displaying project budget THEN the system SHALL calculate: budget, total_planned (sum of task planned_cost), total_actual (sum of task actual_cost)
3. WHEN an expense is approved THEN the system SHALL update the linked task's actual_cost via existing trigger
4. IF total_actual exceeds budget THEN the system SHALL update project health_score with budget impact
5. WHEN viewing project dashboard THEN the system SHALL show: Budget Remaining = budget - total_actual
