# GenHub - Core Database Schema

> Detailed schema for main tables. For quick lookup, see `indexes/tables.md`.
>
> Last updated: 2026-01-16 (sync: owners, admin_invitations)

---

## Core Tables

### companies
```sql
id uuid PK DEFAULT gen_random_uuid()
name text NOT NULL
address text (nullable)
phone text (nullable)
email text (nullable)
logo_url text (nullable)
client_can_view_budget boolean NOT NULL DEFAULT false  -- Client Portal setting
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```
**RLS**: Members view, GC Admin update
**Trigger**: Auto-updates updated_at timestamp

### user_profiles
```sql
id uuid PK (references next_auth.users, no DEFAULT - set explicitly)
name text NOT NULL
email text NOT NULL
avatar_url text (nullable)
phone text (nullable)
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```
**RLS**: Users view company profiles
**Trigger**: Auto-updates updated_at timestamp

### company_users
```sql
id uuid PK DEFAULT gen_random_uuid()
company_id uuid FK → companies
user_id uuid FK → next_auth.users
role user_role NOT NULL DEFAULT 'field_worker'  -- admin, project_manager, foreman, field_worker, subcontractor, client
status member_status NOT NULL DEFAULT 'active'  -- active, invited, inactive
invited_by uuid FK (nullable)
invited_at timestamptz (nullable) DEFAULT now()
activated_at timestamptz (nullable)  -- When user joined (was: joined_at)
invitation_token uuid (nullable)
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
UNIQUE(company_id, user_id)
```
**RLS**: GC Admin manage, members view
**Trigger**: Auto-updates updated_at timestamp

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
id uuid PK DEFAULT gen_random_uuid()
project_id uuid FK → projects NOT NULL
phase_id uuid FK → project_phases (nullable)
title text NOT NULL
description text (nullable)
status task_status NOT NULL DEFAULT 'todo'  -- todo, in_progress, review, blocked, completed
priority task_priority NOT NULL DEFAULT 'medium'  -- low, medium, high, critical
task_type task_type NOT NULL DEFAULT 'work'  -- work, purchase, approval, admin
assignee_id uuid FK (nullable)  -- Legacy single assignee (deprecated, use task_assignees)
start_date date (nullable)
due_date date (nullable)
planned_cost numeric (nullable)
actual_cost numeric (nullable)  -- AUTO-CALCULATED from materials + expenses
blocked_reason text (nullable)
approval_status approval_status (nullable)
approval_notes text (nullable)
approved_by uuid FK (nullable)
approved_at timestamptz (nullable)
receipt_photo_url text (nullable)
spatial_marker_id uuid FK → spatial_markers (nullable)
created_by uuid FK (nullable)
completed_at timestamptz (nullable)
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```
**Note**: Column count is 24 (not 19 as some docs might indicate)
**Triggers**:
- Updates actual_cost from materials + expenses
- Sets completed_at on status change
- Updates phase completion
- Auto-updates updated_at timestamp

### task_assignees
```sql
id uuid PK DEFAULT gen_random_uuid()
task_id uuid FK → tasks ON DELETE CASCADE NOT NULL
user_id uuid FK → user_profiles (nullable)
subcontractor_id uuid FK → subcontractors (nullable)
assigned_at timestamptz NOT NULL DEFAULT now()
assigned_by uuid FK → user_profiles (nullable)
is_primary boolean NOT NULL DEFAULT false  -- Indicates primary assignee
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
CHECK(user_id IS NOT NULL XOR subcontractor_id IS NOT NULL)
UNIQUE(task_id, user_id)
UNIQUE(task_id, subcontractor_id)
```
**Note**: Column count is 9 (added is_primary flag)
**Purpose**: Junction table for multi-assignee support. Each task can have multiple users and/or subcontractors assigned.
**Trigger**: Auto-updates updated_at timestamp

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

## Owner/Admin Tables

### owners
```sql
id uuid PK DEFAULT gen_random_uuid()
user_id uuid FK → next_auth.users ON DELETE CASCADE (UNIQUE)
email text NOT NULL (UNIQUE)
name text NOT NULL
is_active boolean NOT NULL DEFAULT true
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```
**Comment**: Platform owners (super users) with access to all companies
**Purpose**: Platform super users with access to ALL companies
**RLS**: `owners_select_self` - Users can only SELECT their own owner record
**Helpers**: `is_user_owner(user_id)` - check if user is active owner
**Trigger**: `update_owners_updated_at` - Auto-updates updated_at timestamp

### admin_invitations
```sql
id uuid PK DEFAULT gen_random_uuid()
email text NOT NULL
name text (nullable)
invitation_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid()
invited_by uuid FK → owners ON DELETE CASCADE
invited_at timestamptz NOT NULL DEFAULT now()
expires_at timestamptz NOT NULL DEFAULT (now() + '7 days'::interval)
used_at timestamptz (nullable - null until accepted)
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```
**Comment**: Invitations from owners to create new company admins
**Purpose**: Owners invite new company admins who create their own companies
**RLS**: `user_access` - Accessible by inviting owner or active admins
**Trigger**: `update_admin_invitations_updated_at` - Auto-updates updated_at timestamp

---

## See Also

- Quick lookup: `indexes/tables.md`
- Enums: `indexes/enums.md`
- RLS patterns: `backend/SCHEMA_RLS.md`
- Full schema: `docs/law/DB_SCHEMA.md`
