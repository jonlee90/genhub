# GenHub - Core Database Schema

> Detailed schema for main tables. For quick lookup, see `indexes/tables.md`.

---

## Core Tables

### companies
```sql
id uuid PK
name text NOT NULL
address, phone, email, logo_url
client_can_view_budget boolean DEFAULT false  -- Client Portal setting
created_at, updated_at
```
**RLS**: Members view, GC Admin update

### user_profiles
```sql
id uuid PK → next_auth.users
name text, email text, avatar_url, phone
created_at, updated_at
```
**RLS**: Users view company profiles

### company_users
```sql
id uuid PK
company_id uuid FK → companies
user_id uuid FK → next_auth.users
role user_role  -- gc_admin, project_manager, foreman, field_worker, subcontractor, client
status member_status  -- active, invited, inactive
invited_by uuid FK, invited_at, joined_at
created_at, updated_at
UNIQUE(company_id, user_id)
```
**RLS**: GC Admin manage, members view

---

## Project Tables

### projects
```sql
id uuid PK
company_id uuid FK → companies
name text NOT NULL
client_name, client_email, client_phone
address, city, state, zip_code
project_type, status project_status
description text
start_date date, end_date date
budget decimal(12,2), actual_cost decimal(12,2)
health_score int (0-100)
completion_percentage int (0-100)
created_by uuid FK
created_at, updated_at
```
**Triggers**: Creates 5 default phases on insert
**RLS**: Members view, GC/PM create/update

### project_phases
```sql
id uuid PK
project_id uuid FK → projects
name text NOT NULL
order_index int
status phase_status  -- not_started, in_progress, completed
completion_percentage int (0-100)
start_date date, end_date date
description text
created_at, updated_at
UNIQUE(project_id, name), UNIQUE(project_id, order_index)
```
**Default phases**: Initiation(0), Pre-Construction(1), Procurement(2), Construction(3), Post-Construction(4)
**Triggers**: Updates project.completion_percentage

### project_team
```sql
id uuid PK
project_id uuid FK → projects
user_id uuid FK (optional)
subcontractor_id uuid FK (optional)
role user_role
assigned_at, assigned_by uuid FK
CHECK: Either user_id OR subcontractor_id must be set
```
**Triggers**: Auto-adds to chat_participants

---

## Task Tables

### tasks
```sql
id uuid PK
project_id uuid FK → projects
phase_id uuid FK → project_phases (optional)
title text NOT NULL
description text
status task_status  -- todo, in_progress, review, blocked, completed
priority task_priority  -- low, medium, high, critical
task_type task_type  -- work, purchase, approval, admin
assignee_id uuid FK (optional)
subcontractor_id uuid FK (optional)
start_date date, due_date date
planned_cost decimal(10,2)
actual_cost decimal(10,2)  -- AUTO-CALCULATED from materials + expenses
blocked_reason text
order_index int
approval_status approval_status (optional)
created_by uuid FK
completed_at timestamptz
created_at, updated_at
```
**Triggers**:
- Updates actual_cost from materials + expenses
- Sets completed_at on status change
- Updates phase completion

### task_assignees
```sql
id uuid PK
task_id uuid FK → tasks ON DELETE CASCADE
user_id uuid FK → user_profiles (nullable)
subcontractor_id uuid FK → subcontractors (nullable)
assigned_at timestamptz
assigned_by uuid FK → user_profiles
created_at, updated_at
CHECK(user_id IS NOT NULL XOR subcontractor_id IS NOT NULL)
UNIQUE(task_id, user_id)
UNIQUE(task_id, subcontractor_id)
```
**Purpose**: Junction table for multi-assignee support. Each task can have multiple users and/or subcontractors assigned.

### task_dependencies
```sql
id uuid PK
task_id uuid FK → tasks
depends_on_task_id uuid FK → tasks
created_at
UNIQUE(task_id, depends_on_task_id)
```

### task_activity
```sql
id uuid PK
task_id uuid FK → tasks
user_id uuid FK
action activity_action
old_value text, new_value text
comment text
created_at
```

---

## Material Tables

### materials
```sql
id uuid PK
company_id uuid FK → companies
product_name text NOT NULL
product_description, sku
category material_category
manufacturer
unit_price numeric, unit_of_measure
home_depot_product_id, home_depot_url
product_image_url, stock_status
lead_time_days int
specifications jsonb
is_active bool DEFAULT true
created_by uuid FK
created_at, updated_at
```

### material_assignments
```sql
id uuid PK
material_id uuid FK → materials
task_id uuid FK → tasks
project_id uuid FK → projects
quantity numeric
unit_cost numeric
total_cost numeric GENERATED (quantity * unit_cost) STORED
procurement_status  -- needed, ordered, delivered, installed
purchaser_type, purchaser_id uuid FK
subcontractor_id uuid FK (optional)
ordered_date, estimated_delivery_date
delivered_date, installed_date
notes text
assigned_by uuid FK
created_at, updated_at
```
**Triggers**: Updates task.actual_cost

---

## Expense Tables

### expenses
```sql
id uuid PK
company_id uuid FK → companies
project_id uuid FK → projects
task_id uuid FK → tasks (optional)
description text
amount numeric
category expense_category
expense_date date
vendor_name, vendor_address
receipt_url text
receipt_ocr_data jsonb
ocr_confidence_score numeric, ocr_processed bool
status expense_status  -- submitted, under_review, approved, rejected, paid
submitted_by uuid FK, submitted_at
reviewed_by uuid FK, reviewed_at
approval_notes text
created_at, updated_at
```
**Triggers**: Updates task.actual_cost when approved

### expense_line_items
```sql
id uuid PK
expense_id uuid FK → expenses
material_id uuid FK → materials (optional)
material_assignment_id uuid FK (optional)
description text
quantity numeric, unit_price numeric
line_total numeric GENERATED (quantity * unit_price) STORED
matched_by_ai bool, match_confidence_score numeric
manually_matched bool
ocr_extracted_data jsonb
created_at, updated_at
```

---

## Key Relationships

```
companies (root)
├── company_users → user_profiles
├── projects
│   ├── project_phases
│   ├── project_team → users, subcontractors
│   ├── tasks
│   │   ├── task_assignees → users, subcontractors
│   │   ├── task_dependencies
│   │   ├── task_activity
│   │   └── material_assignments → materials
│   ├── expenses → expense_line_items
│   ├── chat_rooms → messages
│   ├── project_files
│   └── project_photos
├── materials
└── subcontractors
```

---

## See Also

- Quick lookup: `indexes/tables.md`
- Enums: `indexes/enums.md`
- RLS patterns: `backend/SCHEMA_RLS.md`
- Full schema: `docs/law/DB_SCHEMA.md`
