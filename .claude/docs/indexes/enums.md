# GenHub Enums Index

> Quick lookup for database and TypeScript enums.

Last updated: 2026-01-10

---

## Database Enums (PostgreSQL)

### User & Team

```sql
-- User roles in company
user_role: admin | project_manager | foreman | field_worker | subcontractor | client

-- Team member status
member_status: active | invited | inactive
```

### Projects

```sql
-- Project status
project_status: active | on_hold | completed | archived

-- Phase status
phase_status: not_started | in_progress | completed

-- Legacy project types (deprecated, use text field)
project_type_old: residential | restaurant_cafe | commercial_office | industrial | restaurant | cafe
```

### Tasks

```sql
-- Task workflow status
task_status: todo | in_progress | review | blocked | completed

-- Task priority
task_priority: low | medium | high | critical

-- Task type/category
task_type: work | purchase | approval | admin

-- Approval workflow
approval_status: pending | approved | rejected | revision_requested

-- Activity log actions
activity_action: created | updated | deleted | status_changed | assigned | commented | attachment_added | attachment_removed
```

### Materials & Expenses

```sql
-- Material category
material_category: lumber | concrete | electrical | plumbing | hvac | roofing | flooring | paint | hardware | tools | fixtures | insulation | drywall | doors_windows | landscaping | other

-- Material procurement status
procurement_status: needed | ordered | delivered | installed

-- Who purchased material
purchaser_type: gc | pm | subcontractor

-- Expense category
expense_category: materials | labor | equipment | permits | transportation | meals | lodging | other

-- Expense approval status
expense_status: submitted | under_review | approved | rejected | paid
```

### Files & Photos

```sql
-- Document category
document_category: contracts | permits | drawings | reports | financial | safety | meeting_notes | specifications | general

-- Photo category
photo_category: site_progress | safety_documentation | permits_approvals | inspection_reports | material_receipts | change_orders | defects_issues | before_after | task_receipts | expense_receipts | general
```

### 3D Spatial

```sql
-- Spatial marker type
spatial_marker_type: issue | note | photo | inspection | rfi | safety | material | progress

-- Marker status
spatial_marker_status: open | in_progress | resolved | closed
```

### System

```sql
-- Trade specializations
trade_type: general | electrical | plumbing | hvac | carpentry | masonry | roofing | flooring | painting | drywall | concrete | landscaping | demolition | steel_work | glass_glazing | fire_protection | insulation | other

-- Attachment parent type
attachment_entity_type: task | project | phase | profile | subcontractor | material | expense

-- Notification types
notification_type: task_assigned | task_completed | task_overdue | task_blocked | project_update | team_invited | mention | system | material_assigned | material_delivered | material_ordered | expense_submitted | expense_approved | expense_rejected | budget_overrun
```

---

## TypeScript Types

All enums are exported from `types/database.types.ts`:

```typescript
import type { Database } from '@/types/database.types';

// Access enum types
type TaskStatus = Database['public']['Enums']['task_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type UserRole = Database['public']['Enums']['user_role'];
type ExpenseStatus = Database['public']['Enums']['expense_status'];
// etc.
```

---

## UI Constants

For UI display, define constants with labels/colors:

```typescript
// Example: Task status config
const TASK_STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

// Example: Priority config
const TASK_PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-500', icon: 'ChevronDown' },
  medium: { label: 'Medium', color: 'text-blue-500', icon: 'Minus' },
  high: { label: 'High', color: 'text-orange-500', icon: 'ChevronUp' },
  critical: { label: 'Critical', color: 'text-red-500', icon: 'AlertTriangle' },
};
```

---

## Validation (Zod)

Use Zod for input validation:

```typescript
import { z } from 'zod';

const taskStatusSchema = z.enum(['todo', 'in_progress', 'review', 'blocked', 'completed']);
const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
const userRoleSchema = z.enum(['admin', 'project_manager', 'foreman', 'field_worker', 'subcontractor', 'client']);
```

---

## Adding New Enums

1. Create migration with enum type:
```sql
CREATE TYPE public.new_enum AS ENUM ('value1', 'value2', 'value3');
```

2. Use in table:
```sql
ALTER TABLE public.table_name ADD COLUMN status public.new_enum DEFAULT 'value1';
```

3. Regenerate types:
```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

4. Update this index

See: `.claude/skills/database/enums.md` for full patterns.

---

## Enum Stats

| Category | Enum Count |
|----------|------------|
| User/Team | 2 |
| Projects | 3 |
| Tasks | 5 |
| Materials/Expenses | 5 |
| Files | 2 |
| Spatial | 2 |
| System | 3 |
| **Total** | 22 |
