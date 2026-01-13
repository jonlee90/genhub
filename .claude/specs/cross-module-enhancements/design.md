# Cross-Module Enhancements - Technical Design

## Overview
This design document specifies the technical implementation for three interconnected features:
1. **Module 1**: Task Auto-Expense Creation - Automatically create expenses from task costs
2. **Module 2**: Hybrid Vendor Name Field - Combobox for vendor selection with free-form entry
3. **Module 3**: Project Team Cost Summary - Display cost attribution per team member

## Requirements Reference
See: `.claude/specs/cross-module-enhancements/requirements.md`

---

## Architecture Overview

### Component Relationships
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CROSS-MODULE DATA FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────────┐      │
│  │    TASKS     │─────▶│   EXPENSES   │◀─────│  TEAM MEMBERS    │      │
│  │              │      │              │      │                  │      │
│  │ actual_cost  │      │ vendor_name  │      │ user_profiles    │      │
│  │ assignees[]  │      │ task_id (FK) │      │ subcontractors   │      │
│  │ is_primary   │      │ amount       │      │                  │      │
│  └──────────────┘      └──────────────┘      └──────────────────┘      │
│         │                     │                      │                  │
│         │                     ▼                      │                  │
│         │           ┌──────────────────┐             │                  │
│         └──────────▶│  COST SUMMARY    │◀────────────┘                  │
│                     │  (Aggregation)   │                                │
│                     └──────────────────┘                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Flow: Auto-Expense Creation
```
User Action                    Server Action                   Database
───────────                    ─────────────                   ────────
Toggle "Create Expense" ON
        │
        ▼
Click "Save Task"
        │
        ├──────────────────▶ updateTask()
        │                         │
        │                         ├────────────────▶ UPDATE tasks
        │                         │                      │
        │                         │◀───────────────────────┘
        │                         │
        │                    [if autoExpense]
        │                         │
        │                         ├────────────────▶ INSERT expenses
        │                         │                 (linked via task_id)
        │                         │                      │
        │                         │◀───────────────────────┘
        │                         │
        │◀─────────────────── { task, expense? }
        │
        ▼
Show success toast with expense link
```

---

## Module 1: Task Auto-Expense Creation

### Data Model Changes

#### Table: `task_assignees` (ALTER)
Add `is_primary` column to designate primary assignee for expense attribution.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| is_primary | boolean | NOT NULL DEFAULT false | Primary assignee flag |

**Migration SQL:**
```sql
-- Add is_primary column to task_assignees
ALTER TABLE task_assignees
ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

-- Create index for primary assignee lookups
CREATE INDEX idx_task_assignees_primary ON task_assignees(task_id) WHERE is_primary = true;

-- Trigger: Ensure only one primary per task
CREATE OR REPLACE FUNCTION ensure_single_primary_assignee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE task_assignees
    SET is_primary = false
    WHERE task_id = NEW.task_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_primary_assignee
AFTER INSERT OR UPDATE OF is_primary ON task_assignees
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION ensure_single_primary_assignee();
```

### Server Actions

#### `updateTask` Enhancement
**File:** `app/actions/tasks.ts`

**New Parameters:**
```typescript
interface UpdateTaskInput {
  // ... existing fields
  autoCreateExpense?: boolean;
  primaryAssigneeId?: string; // user_id or subcontractor_id
}
```

**Logic:**
1. Update task record as normal
2. If `autoCreateExpense === true` AND `actual_cost > 0`:
   - Derive expense category from task_type
   - Get primary assignee name for vendor_name
   - Call `createExpenseFromTask()` internally
3. Return combined result with expense ID if created

#### `createExpenseFromTask(taskId: string): Promise<ExpenseResult>`
**File:** `app/actions/expenses.ts`

**Purpose:** Create expense record linked to task
**Input:** Task ID
**Output:** `{ data?: Expense, error?: string }`

**Field Mapping:**
| Expense Field | Source |
|---------------|--------|
| amount | task.actual_cost |
| description | task.title |
| project_id | task.project_id |
| task_id | task.id |
| expense_date | task.completed_at OR now() |
| category | Derived from task_type |
| vendor_name | Primary assignee name |
| submitted_by | Current user |

**Category Mapping:**
```typescript
const TASK_TYPE_TO_EXPENSE_CATEGORY = {
  work: 'labor',
  purchase: 'materials',
  approval: 'permits',
  admin: 'other',
} as const;
```

#### `setPrimaryAssignee(taskId: string, assigneeId: string, assigneeType: 'user' | 'subcontractor')`
**File:** `app/actions/tasks.ts`

**Purpose:** Set primary assignee for a task
**Revalidates:** Task detail pages

### UI Specification

#### AutoExpenseToggle Component
**File:** `components/tasks/forms/AutoExpenseToggle.tsx`

**Props:**
```typescript
interface AutoExpenseToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  actualCost: number;
  taskTitle: string;
  vendorName: string | null;
  category: string;
  disabled?: boolean;
}
```

**Mobile PWA Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Auto-Expense Toggle Section (appears when actual_cost > 0) │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Toggle Switch]  Create expense from cost          │   │  44px height
│  │                   ────────────────────               │   │
│  │                   Muted when OFF                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  EXPENSE PREVIEW (when toggle ON)                   │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Amount:    $1,250.00                               │   │
│  │  Desc:      Framing work - Phase 1                  │   │
│  │  Category:  Labor                                   │   │
│  │  Vendor:    John Smith                              │   │
│  │  Date:      Jan 12, 2026                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Toggle: Uses `Switch` component from `@/components/ui/switch`
- Preview card: `bg-green-50 border border-green-200 rounded-xl p-4`
- Success accent: `border-l-4 border-l-construction-green`
- Touch target: Entire toggle row is 44px minimum height

#### PrimaryAssigneeSelector Component
**File:** `components/tasks/forms/PrimaryAssigneeSelector.tsx`

**Props:**
```typescript
interface PrimaryAssigneeSelectorProps {
  assignees: Array<{
    id: string;
    type: 'user' | 'subcontractor';
    name: string;
    avatarUrl?: string | null;
    companyName?: string; // For subcontractors
  }>;
  primaryId: string | null;
  onPrimaryChange: (id: string) => void;
  disabled?: boolean;
}
```

**Mobile PWA Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Primary Assignee (only shown when assignees.length > 1)    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [★] [Avatar] John Smith                        [✓]  │   │  48px row
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [☆] [Avatar] ABC Electric (Subcontractor)      [ ]  │   │  48px row
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Hint: Primary assignee used for expense vendor name       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Star icon: `Star` from lucide-react (filled when primary)
- Selected row: `bg-construction-blue/5 border-construction-blue`
- Touch targets: 48px minimum row height
- Radio-style selection (only one can be primary)

#### TaskModal Integration
**File:** `components/tasks/modals/TaskModal.tsx`

**Changes:**
1. Add state: `autoExpenseEnabled`, `primaryAssigneeId`
2. Conditionally render `AutoExpenseToggle` when `actualCost > 0`
3. Conditionally render `PrimaryAssigneeSelector` when `assignees.length > 1`
4. Pass `autoCreateExpense` flag to `updateTask` action
5. Show success toast with link to created expense

**Position in Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Header: Edit Task]                                        │
├─────────────────────────────────────────────────────────────┤
│  Title: _________________________                           │
│  Description: ___________________                           │
│  Status / Phase                                             │
│  Assignees / Priority                                       │
│  Start Date / Due Date                                      │
│  Planned Cost / Actual Cost                                 │
│  ─────────────────────────────────────────────────────────  │
│  [PrimaryAssigneeSelector] (if multiple assignees)         │
│  ─────────────────────────────────────────────────────────  │
│  [AutoExpenseToggle] (if actual_cost > 0)                  │
│  ─────────────────────────────────────────────────────────  │
│  Receipt Photo Upload                                       │
│  Materials Section                                          │
│  Expenses Section                                           │
├─────────────────────────────────────────────────────────────┤
│  [Footer: Back | Save Changes]                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Module 2: Hybrid Vendor Name Field

### Data Sources

**Company Users Query:**
```sql
SELECT
  up.id,
  up.name,
  'member' as type
FROM company_users cu
JOIN user_profiles up ON cu.user_id = up.id
WHERE cu.company_id = $1 AND cu.status = 'active'
ORDER BY up.name ASC;
```

**Subcontractors Query:**
```sql
SELECT
  id,
  company_name as name,
  'subcontractor' as type
FROM subcontractors
WHERE company_id = $1 AND status = 'active'
ORDER BY company_name ASC;
```

### Server Actions

#### `getVendorOptions(companyId: string): Promise<VendorOption[]>`
**File:** `app/actions/expenses.ts`

**Output:**
```typescript
interface VendorOption {
  id: string;
  name: string;
  type: 'member' | 'subcontractor';
  displayName: string; // "Name (Member)" or "Company (Subcontractor)"
}
```

### UI Specification

#### VendorCombobox Component
**File:** `components/expenses/VendorCombobox.tsx`

**Props:**
```typescript
interface VendorComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: VendorOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}
```

**Desktop Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Vendor Name                                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ John Smith                                    [×]    │   │  Input with clear
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ─── Team Members ───────────────────────────────────│   │  Group header
│  │ John Smith (Member)                                 │   │
│  │ Jane Doe (Member)                                   │   │
│  │ ─── Subcontractors ─────────────────────────────────│   │  Group header
│  │ ABC Electric (Subcontractor)                        │   │
│  │ XYZ Plumbing (Subcontractor)                        │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ + Use "Home Depot" as custom vendor                 │   │  Free-form option
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Mobile PWA Design (Bottom Sheet):**
```
┌─────────────────────────────────────────────────────────────┐
│  ══════════════ (drag handle)                               │
├─────────────────────────────────────────────────────────────┤
│  Select Vendor                                    [×]       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search or enter vendor name...                   │   │  Search input
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TEAM MEMBERS                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Avatar] John Smith                            [✓]  │   │  48px row
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Avatar] Jane Doe                              [ ]  │   │  48px row
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SUBCONTRACTORS                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [🏢] ABC Electric                              [ ]  │   │  48px row
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [+] Use "Home Depot" as custom vendor               │   │  Custom entry
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Use `BottomSheetModal` on mobile (< 768px)
- Use `Popover` with `Command` (cmdk) on desktop
- Debounce search input by 150ms
- Show custom entry option when typed text doesn't match options
- Clear button resets to empty string (free-form mode)

**Styling:**
- Group headers: `text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2`
- Option rows: 48px height, `hover:bg-gray-100 active:bg-gray-200`
- Selected: `bg-construction-blue/10 text-construction-blue`
- Touch targets: All interactive elements minimum 44px

#### Integration Points

**CreateExpenseModal:**
- Replace `Input` for vendor_name with `VendorCombobox`
- Fetch options via `getVendorOptions` on mount
- Pass selected value as string to `createExpense`

**ExpenseDetailModal:**
- Replace `Input` for vendor_name with `VendorCombobox`
- Allow editing vendor via combobox

---

## Module 3: Project Team Cost Summary

### Data Aggregation

#### `getProjectTeamCostSummary(projectId: string): Promise<TeamCostSummary[]>`
**File:** `app/actions/projects.ts`

**Output:**
```typescript
interface TeamCostSummary {
  id: string;
  name: string;
  type: 'member' | 'subcontractor';
  avatarUrl: string | null;
  role?: string;
  taskCosts: number;      // Sum of actual_cost where user is primary assignee
  expenseCosts: number;   // Sum of expense amounts where vendor_name matches
  totalCosts: number;     // taskCosts + expenseCosts
  taskCount: number;      // Number of tasks assigned
  expenseCount: number;   // Number of expenses attributed
}
```

**SQL Query (optimized):**
```sql
WITH member_task_costs AS (
  SELECT
    ta.user_id,
    NULL as subcontractor_id,
    COALESCE(SUM(t.actual_cost), 0) as task_costs,
    COUNT(t.id) as task_count
  FROM task_assignees ta
  JOIN tasks t ON ta.task_id = t.id
  WHERE t.project_id = $1
    AND ta.is_primary = true
    AND ta.user_id IS NOT NULL
  GROUP BY ta.user_id
),
sub_task_costs AS (
  SELECT
    NULL as user_id,
    ta.subcontractor_id,
    COALESCE(SUM(t.actual_cost), 0) as task_costs,
    COUNT(t.id) as task_count
  FROM task_assignees ta
  JOIN tasks t ON ta.task_id = t.id
  WHERE t.project_id = $1
    AND ta.is_primary = true
    AND ta.subcontractor_id IS NOT NULL
  GROUP BY ta.subcontractor_id
),
member_expenses AS (
  SELECT
    up.id as user_id,
    COALESCE(SUM(e.amount), 0) as expense_costs,
    COUNT(e.id) as expense_count
  FROM user_profiles up
  JOIN company_users cu ON cu.user_id = up.id
  JOIN expenses e ON e.vendor_name = up.name AND e.project_id = $1
  WHERE cu.company_id = $2
  GROUP BY up.id
),
sub_expenses AS (
  SELECT
    s.id as subcontractor_id,
    COALESCE(SUM(e.amount), 0) as expense_costs,
    COUNT(e.id) as expense_count
  FROM subcontractors s
  JOIN expenses e ON e.vendor_name = s.company_name AND e.project_id = $1
  WHERE s.company_id = $2
  GROUP BY s.id
)
SELECT
  up.id,
  up.name,
  'member' as type,
  up.avatar_url,
  cu.role,
  COALESCE(mtc.task_costs, 0) as task_costs,
  COALESCE(me.expense_costs, 0) as expense_costs,
  COALESCE(mtc.task_costs, 0) + COALESCE(me.expense_costs, 0) as total_costs,
  COALESCE(mtc.task_count, 0) as task_count,
  COALESCE(me.expense_count, 0) as expense_count
FROM project_team pt
JOIN company_users cu ON pt.user_id = cu.user_id
JOIN user_profiles up ON cu.user_id = up.id
LEFT JOIN member_task_costs mtc ON mtc.user_id = up.id
LEFT JOIN member_expenses me ON me.user_id = up.id
WHERE pt.project_id = $1

UNION ALL

SELECT
  s.id,
  s.company_name as name,
  'subcontractor' as type,
  NULL as avatar_url,
  'subcontractor' as role,
  COALESCE(stc.task_costs, 0) as task_costs,
  COALESCE(se.expense_costs, 0) as expense_costs,
  COALESCE(stc.task_costs, 0) + COALESCE(se.expense_costs, 0) as total_costs,
  COALESCE(stc.task_count, 0) as task_count,
  COALESCE(se.expense_count, 0) as expense_count
FROM project_team pt
JOIN subcontractors s ON pt.subcontractor_id = s.id
LEFT JOIN sub_task_costs stc ON stc.subcontractor_id = s.id
LEFT JOIN sub_expenses se ON se.subcontractor_id = s.id
WHERE pt.project_id = $1

ORDER BY total_costs DESC;
```

### UI Specification

#### TeamCostSummaryCard Component
**File:** `components/projects/TeamCostSummaryCard.tsx`

**Props:**
```typescript
interface TeamCostSummaryCardProps {
  summaries: TeamCostSummary[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}
```

**Mobile PWA Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Users Icon] Team Cost Summary                             │
│  Cost attribution by team member                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Avatar] John Smith                    PM           │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ Tasks      Expenses      TOTAL                      │   │
│  │ $2,500     $1,200        $3,700                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [🏢] ABC Electric                      Sub          │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ Tasks      Expenses      TOTAL                      │   │
│  │ $5,000     $800          $5,800                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ TOTALS                                              │   │
│  │ Tasks: $7,500  Expenses: $2,000  TOTAL: $9,500     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Uses `InfoCard` component pattern from ProjectOverview
- Header icon: `Users` from lucide-react
- Member rows: Card-based layout with avatar, name, role badge
- Cost columns: 3-column grid on mobile, aligned right
- Total row: `bg-gray-50 border-t-2 border-gray-200 font-bold`
- Empty state: "No team members assigned" with icon
- Loading state: Skeleton placeholders for each row

#### TeamCostRow Component
**File:** `components/projects/TeamCostRow.tsx`

**Props:**
```typescript
interface TeamCostRowProps {
  summary: TeamCostSummary;
  onClick?: () => void;
}
```

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar/Icon]  Name                         [Role Badge]   │  48px
│  ─────────────────────────────────────────────────────────  │
│  Tasks: $X,XXX    Expenses: $X,XXX    Total: $X,XXX        │  Compact row
└─────────────────────────────────────────────────────────────┘
```

**Touch behavior:**
- Entire row is tappable (48px minimum height)
- Optional: Tap to expand for detailed breakdown
- `active:bg-gray-50` feedback

#### Integration: ProjectOverview
**File:** `components/projects/ProjectOverview.tsx`

**Changes:**
1. Add `teamCostSummary` prop
2. Add `TeamCostSummaryCard` in sidebar column, below Client Information
3. Fetch data via `getProjectTeamCostSummary` in page server component

**Position:**
```
Sidebar Column:
├── Client Information (InfoCard)
├── Team Cost Summary (NEW)
└── [existing content]
```

#### Integration: ProjectTeam Component Enhancement
**File:** `components/projects/ProjectTeam.tsx`

**Changes to Member Cards:**
Add cost summary below existing info in each member/subcontractor row.

**Enhanced Row Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar] John Smith                                   [×]  │
│  john@example.com                                          │
│  [PM Badge]                                                │
│  ─────────────────────────────────────────────────────────  │
│  3 tasks · $2,500 costs · $1,200 expenses                  │  NEW: Cost line
└─────────────────────────────────────────────────────────────┘
```

**Cost line styling:**
- `text-xs text-gray-500`
- Format: `{taskCount} tasks · ${taskCosts} costs · ${expenseCosts} expenses`
- Only show if any values > 0

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| Auto-expense creation fails | Task still saves, expense skipped | Toast: "Task saved. Expense creation failed - create manually." |
| Vendor options load fails | Fall back to free-form input | No message, graceful degradation |
| Cost summary aggregation fails | Show error state with retry | "Failed to load cost summary. Tap to retry." |
| Invalid primary assignee | Validation error | "Please select a valid assignee" |
| Missing actual_cost for expense | Toggle hidden | N/A (toggle not shown) |

---

## Security Considerations

1. **RLS Enforcement:**
   - All cost queries filtered by company_id
   - task_assignees respects task-level RLS
   - expenses respects company isolation

2. **Input Validation:**
   - Zod schemas for all new action inputs
   - Primary assignee must belong to task's assignees
   - Vendor name max 255 characters

3. **Authorization:**
   - Only task editor can enable auto-expense
   - Only PM/Admin can view team cost summary
   - Expense creation inherits user's expense permissions

---

## Performance Considerations

1. **Cost Aggregation:**
   - Single optimized query with CTEs (no N+1)
   - Index on `task_assignees(task_id, is_primary)`
   - Index on `expenses(vendor_name, project_id)`
   - Target: < 500ms for 50 team members, 1000 records

2. **Vendor Options:**
   - Cache options in component state
   - Refetch only on company change
   - Debounce filter input (150ms)

3. **UI Rendering:**
   - Skeleton loading states
   - Progressive disclosure (collapsed by default)
   - Virtual list for large team rosters (> 20 members)

---

## Mobile PWA Compliance Checklist

| Requirement | Implementation |
|-------------|----------------|
| 44px touch targets | All buttons, toggles, list rows |
| Bottom-aligned actions | Modal footers, FABs |
| Gesture support | Bottom sheet drag-to-dismiss |
| Safe area insets | `pb-[env(safe-area-inset-bottom)]` |
| Responsive spacing | `p-4 md:p-6` patterns |
| Loading states | Skeleton cards, spinners |
| Error states | Retry buttons, error messages |
| Progressive disclosure | Collapsible sections, expandable rows |

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to tasks)
