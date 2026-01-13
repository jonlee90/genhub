# Cross-Module Enhancements - Requirements

## Overview
A comprehensive feature set that enhances interconnection between Tasks, Expenses, and Projects modules. This includes auto-expense creation from tasks, improved vendor name selection via combobox, and team cost summary views for better financial visibility per team member.

## Personas
- **Primary**: GC (General Contractor) - needs cost visibility per team member for project financials
- **Secondary**: PM (Project Manager) - creates/edits tasks, tracks expenses, monitors team costs
- **Tertiary**: Worker/Foreman - assigned to tasks, may trigger auto-expense creation when completing work

---

## Module 1: Task Auto-Expense Creation

### US-1.1: Auto-Expense Control Visibility
**As a** PM,
**I want** to see an auto-expense creation option only when actual cost is entered,
**So that** I'm not presented with irrelevant options when there's no cost to track.

**Acceptance Criteria (EARS):**
- WHEN actual_cost field is empty or zero THE SYSTEM SHALL NOT display the auto-expense creation control
- WHEN actual_cost field has a value greater than zero THE SYSTEM SHALL display the auto-expense creation control in the modal footer
- WHEN actual_cost value changes from non-zero to zero THE SYSTEM SHALL hide the auto-expense control within 100ms
- IF user clears the actual_cost field THEN THE SYSTEM SHALL reset auto-expense toggle to disabled state

**Priority:** High

---

### US-1.2: Auto-Expense Toggle Interaction
**As a** PM,
**I want** an intuitive toggle control (not checkbox) for enabling auto-expense creation,
**So that** I can clearly see and control whether an expense will be created.

**Acceptance Criteria (EARS):**
- WHEN control is displayed THE SYSTEM SHALL render as a toggle switch with clear on/off states
- WHEN toggle is off (default) THE SYSTEM SHALL display "Create expense from cost" label in muted state
- WHEN toggle is on THE SYSTEM SHALL display enhanced visual feedback (highlighted label, success color)
- WHEN toggle is on THE SYSTEM SHALL display a preview summary of the expense to be created
- WHILE toggle is on THE SYSTEM SHALL maintain state through form field changes (except actual_cost going to zero)

**Priority:** High

---

### US-1.3: Auto-Expense Creation on Task Save
**As a** PM,
**I want** expenses to be automatically created when I save a task with the toggle enabled,
**So that** I don't have to manually duplicate cost data in the expense system.

**Acceptance Criteria (EARS):**
- WHEN user saves task AND auto-expense toggle is enabled AND actual_cost > 0 THE SYSTEM SHALL create an expense record
- WHEN expense is created THE SYSTEM SHALL set amount to task.actual_cost value
- WHEN expense is created THE SYSTEM SHALL set description to task.title
- WHEN expense is created THE SYSTEM SHALL link expense to task via task_id field
- WHEN expense is created THE SYSTEM SHALL set project_id from task.project_id
- WHEN expense is created THE SYSTEM SHALL set expense_date to current date (or task.completed_at if available)
- WHEN expense is created THE SYSTEM SHALL derive category from task_type (work->labor, purchase->materials, default->labor)
- WHEN expense is created AND task has primary assignee THE SYSTEM SHALL set vendor_name to primary assignee's name
- WHEN expense creation succeeds THE SYSTEM SHALL display success toast with link to view expense
- IF expense creation fails THEN THE SYSTEM SHALL display error toast but still complete task save

**Priority:** Critical

---

### US-1.4: Primary Assignee Designation
**As a** PM,
**I want** to designate one assignee as "primary" when a task has multiple assignees,
**So that** the expense vendor attribution is clear and accurate.

**Acceptance Criteria (EARS):**
- WHEN task has exactly one assignee THE SYSTEM SHALL automatically designate that assignee as primary (no UI needed)
- WHEN task has two or more assignees THE SYSTEM SHALL display primary designation UI
- WHEN primary designation UI is visible THE SYSTEM SHALL show radio/star selector next to each assignee
- WHEN user selects a new primary assignee THE SYSTEM SHALL update designation immediately
- WHEN no primary is explicitly selected AND task has multiple assignees THE SYSTEM SHALL use first assignee as default
- WHEN task has no assignees THE SYSTEM SHALL use task creator's name as vendor OR leave vendor blank
- WHEN primary assignee is a subcontractor THE SYSTEM SHALL use subcontractor.company_name as vendor_name

**Priority:** High

---

### US-1.5: Expense Preview Before Save
**As a** PM,
**I want** to see a preview of the expense that will be created,
**So that** I can verify the details before committing.

**Acceptance Criteria (EARS):**
- WHEN auto-expense toggle is enabled THE SYSTEM SHALL display expense preview section
- WHEN preview is displayed THE SYSTEM SHALL show: amount, description, category, vendor name, date
- WHEN any source field changes THE SYSTEM SHALL update preview in real-time
- WHEN vendor_name would be empty THE SYSTEM SHALL show "(No vendor)" in preview
- WHILE preview is visible THE SYSTEM SHALL apply visual distinction (card/border styling)

**Priority:** Medium

---

## Module 2: Hybrid Vendor Name Field

### US-2.1: Combobox Vendor Selection
**As a** PM or Worker,
**I want** to select a vendor from a dropdown of known people/companies OR type a custom name,
**So that** I can quickly select existing contacts while still having flexibility.

**Acceptance Criteria (EARS):**
- WHEN vendor field is focused THE SYSTEM SHALL display dropdown with available options
- WHEN dropdown is displayed THE SYSTEM SHALL show company members grouped together
- WHEN dropdown is displayed THE SYSTEM SHALL show subcontractors grouped separately
- WHEN displaying company member THE SYSTEM SHALL show format: "Name (Member)"
- WHEN displaying subcontractor THE SYSTEM SHALL show format: "Company Name (Subcontractor)"
- WHEN user types in field THE SYSTEM SHALL filter options matching input (case-insensitive)
- WHEN user selects option THE SYSTEM SHALL populate field with selected name
- WHEN user types custom text not matching any option THE SYSTEM SHALL allow free-form entry
- WHEN option is selected THE SYSTEM SHALL display clear button to reset to free-form

**Priority:** High

---

### US-2.2: Vendor Combobox Data Sources
**As a** system,
**I want** the vendor combobox to pull from company users and subcontractors,
**So that** the dropdown reflects all possible vendors for the company.

**Acceptance Criteria (EARS):**
- WHEN loading vendor options THE SYSTEM SHALL fetch company_users joined with user_profiles for company members
- WHEN loading vendor options THE SYSTEM SHALL fetch subcontractors for company subcontractors
- WHEN loading vendor options THE SYSTEM SHALL only include active records
- WHEN displaying options THE SYSTEM SHALL sort alphabetically within each group
- WHEN company has no subcontractors THE SYSTEM SHALL still display members group
- IF data loading fails THEN THE SYSTEM SHALL allow manual text entry without dropdown

**Priority:** High

---

### US-2.3: Mobile-Friendly Vendor Selection
**As a** Worker,
**I want** the vendor combobox to work well on my phone,
**So that** I can submit expenses easily in the field.

**Acceptance Criteria (EARS):**
- WHEN on mobile device THE SYSTEM SHALL render dropdown as bottom sheet or full-screen selector
- WHEN on mobile THE SYSTEM SHALL ensure touch targets are minimum 44px height
- WHEN on mobile THE SYSTEM SHALL display search input at top of dropdown
- WHEN keyboard appears THE SYSTEM SHALL adjust dropdown position to remain visible
- WHILE typing on mobile THE SYSTEM SHALL debounce filter by 150ms to prevent lag

**Priority:** Medium

---

## Module 3: Project Team Cost Summary

### US-3.1: Team Cost Summary Section on Overview
**As a** GC,
**I want** to see a summary of costs attributed to each team member on the project overview,
**So that** I can understand labor/expense distribution across the team.

**Acceptance Criteria (EARS):**
- WHEN project overview loads THE SYSTEM SHALL display Team Cost Summary section
- WHEN section is displayed THE SYSTEM SHALL position it below Client Information section
- WHEN section is displayed THE SYSTEM SHALL match existing InfoCard styling
- WHEN displaying team members THE SYSTEM SHALL include both company members and subcontractors
- WHEN displaying costs THE SYSTEM SHALL show task costs (sum of actual_cost where user is primary assignee)
- WHEN displaying costs THE SYSTEM SHALL show expense amounts (sum where user matches vendor_name)
- WHEN displaying costs THE SYSTEM SHALL show combined total per person
- WHEN section loads THE SYSTEM SHALL display totals row at bottom
- IF team member has no costs THE SYSTEM SHALL display $0.00 values
- IF project has no team members THE SYSTEM SHALL display "No team members assigned" empty state

**Priority:** Critical

---

### US-3.2: Individual Team Member Cost Row
**As a** GC,
**I want** to see detailed cost breakdown for each team member,
**So that** I can understand individual contribution to project costs.

**Acceptance Criteria (EARS):**
- WHEN displaying team member row THE SYSTEM SHALL show avatar/icon and name
- WHEN displaying team member row THE SYSTEM SHALL show role badge (Member/Subcontractor)
- WHEN displaying team member row THE SYSTEM SHALL show task costs column
- WHEN displaying team member row THE SYSTEM SHALL show expense costs column
- WHEN displaying team member row THE SYSTEM SHALL show combined total column
- WHEN user taps/clicks row THE SYSTEM SHALL expand to show breakdown details (optional enhancement)
- WHILE data is loading THE SYSTEM SHALL display skeleton placeholders

**Priority:** High

---

### US-3.3: Enhanced Team Tab Cards
**As a** GC,
**I want** to see cost information on team member cards in the Team tab,
**So that** I can see financial context alongside team member details.

**Acceptance Criteria (EARS):**
- WHEN displaying member card THE SYSTEM SHALL show cost summary below existing info
- WHEN displaying cost summary THE SYSTEM SHALL show: Tasks assigned count, Total task costs, Total expenses
- WHEN costs are zero THE SYSTEM SHALL display "$0" not hide the field
- WHEN card is rendered THE SYSTEM SHALL not significantly increase card height (compact design)
- WHILE costs are loading THE SYSTEM SHALL display loading indicator or skeleton

**Priority:** Medium

---

### US-3.4: Subcontractor Cards Cost Enhancement
**As a** GC,
**I want** to see cost information on subcontractor cards,
**So that** I can track subcontractor costs alongside member costs.

**Acceptance Criteria (EARS):**
- WHEN displaying subcontractor card THE SYSTEM SHALL show same cost fields as member cards
- WHEN calculating subcontractor task costs THE SYSTEM SHALL match by subcontractor_id in task_assignees
- WHEN calculating subcontractor expenses THE SYSTEM SHALL match by company_name in vendor_name
- WHEN subcontractor has no costs THE SYSTEM SHALL display "$0" values

**Priority:** Medium

---

### US-3.5: Cost Calculation Performance
**As a** system,
**I want** cost calculations to be performant,
**So that** project overview and team tab load quickly.

**Acceptance Criteria (EARS):**
- WHEN loading cost summary THE SYSTEM SHALL aggregate data server-side via Server Action
- WHEN aggregating costs THE SYSTEM SHALL use efficient SQL queries (not N+1)
- WHEN data is large THE SYSTEM SHALL complete aggregation within 2 seconds
- WHILE costs are loading THE SYSTEM SHALL display loading state in UI
- IF aggregation fails THEN THE SYSTEM SHALL display error state with retry option

**Priority:** High

---

## Out of Scope
- Editing expenses directly from team cost summary (link to expense only)
- Historical cost trend charts per team member
- Exporting team cost data to CSV/PDF
- Notification when team member exceeds cost threshold
- Budget allocation per team member
- Time tracking integration

## Dependencies
- Existing `task_assignees` junction table (needs `is_primary` column)
- Existing `expenses` table with `vendor_name` field
- Existing `project_team` table for team members
- Existing `subcontractors` table for subcontractor lookup
- Existing TaskModal component in edit mode

## Non-Functional Requirements
- **Performance**: Cost summary calculations must complete within 2 seconds for projects with up to 50 team members and 1000 tasks/expenses
- **Security**: All cost data respects company isolation via RLS policies
- **Mobile**: All new UI components must be responsive and work on 375px width screens
- **Accessibility**: Toggle controls must be keyboard accessible with proper ARIA labels

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to design)
