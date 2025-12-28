# GenHub PWA - Database Schema

**Last Updated**: 2025-12-06
**Database**: PostgreSQL (Supabase)
**Total Tables**: 13 (4 NextAuth + 9 Application)
**Total Enums**: 11
**Total RLS Policies**: 48
**Total Triggers**: 13

## Schema Overview

GenHub uses PostgreSQL with Row-Level Security (RLS) for multi-tenant data isolation. All data is scoped by `company_id` to ensure complete tenant separation.

## Enumerations (11)

### user_role
User roles within a company:
- `gc_admin` - General Contractor Admin (full access)
- `project_manager` - Project Manager (can manage assigned projects)
- `foreman` - Field Supervisor (limited project access)
- `field_worker` - Construction Worker (view only, task updates)
- `subcontractor` - External Contractor (scoped to assigned tasks)
- `client` - Project Owner (view-only access to curated data)

### member_status
Company member status:
- `active` - Currently active member
- `pending` - Invitation sent, not accepted
- `suspended` - Temporarily disabled

### trade_type
Subcontractor trade classifications:
- `general` - General Contractor
- `electrical` - Electrician
- `plumbing` - Plumber
- `hvac` - HVAC Specialist
- `carpentry` - Carpenter
- `masonry` - Mason
- `painting` - Painter
- `roofing` - Roofer
- `landscaping` - Landscaper
- `other` - Other trades

### project_type
Project classification templates:
- `residential` - Single/multi-family homes
- `restaurant_cafe` - Food service establishments
- `commercial_office` - Office buildings
- `industrial` - Warehouses, factories

### project_status
Project lifecycle:
- `active` - Currently in progress
- `on_hold` - Temporarily paused
- `completed` - Finished successfully
- `cancelled` - Abandoned

### phase_status
Phase progress:
- `pending` - Not started
- `in_progress` - Currently active
- `completed` - Finished

### task_status
Task workflow:
- `todo` - Not started
- `in_progress` - Being worked on
- `review` - Ready for review
- `blocked` - Cannot proceed
- `completed` - Finished

### task_priority
Task urgency levels:
- `low` - Can wait
- `medium` - Standard priority
- `high` - Urgent

### activity_action
Task activity types:
- `created` - Task created
- `updated` - Task modified
- `status_changed` - Status transition
- `commented` - Comment added
- `assigned` - Assignee changed
- `due_date_changed` - Due date updated

### notification_type
Notification channels:
- `in_app` - In-app notification
- `email` - Email notification
- `push` - Push notification
- `kakaotalk` - KakaoTalk integration (future)

### attachment_entity_type
Attachment association:
- `task` - Attached to task
- `project` - Attached to project
- `project_phase` - Attached to phase
- `user_profile` - User avatar/docs

---

## Core Tables

### companies
Multi-tenant company profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Company ID |
| name | text | NOT NULL | Company name |
| email | text | | Company email |
| phone | text | | Company phone |
| address | text | | Company address |
| logo_url | text | | Logo file URL |
| created_at | timestamptz | default now() | Created timestamp |
| updated_at | timestamptz | default now() | Updated timestamp |

**Indexes**:
- Primary key on `id`

**RLS Policies**:
- `company_read`: Users can read their own company
- `company_create`: gc_admin can create companies
- `company_update`: gc_admin can update their company

---

### user_profiles
Extended user data beyond NextAuth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK → next_auth.users | User ID |
| name | text | NOT NULL | Full name |
| email | text | NOT NULL | Email address |
| avatar_url | text | | Avatar image URL |
| phone | text | | Phone number |
| created_at | timestamptz | default now() | Created timestamp |
| updated_at | timestamptz | default now() | Updated timestamp |

**Indexes**:
- Primary key on `id`
- Index on `email`

**RLS Policies**:
- `profile_read`: Users can read profiles in their company
- `profile_update`: Users can update their own profile

---

### company_users
Company membership with role-based access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Membership ID |
| company_id | uuid | NOT NULL, FK → companies | Company reference |
| user_id | uuid | NOT NULL, FK → next_auth.users | User reference |
| role | user_role | NOT NULL, default 'field_worker' | User role |
| status | member_status | NOT NULL, default 'pending' | Membership status |
| invited_by | uuid | FK → next_auth.users | Inviter user ID |
| invited_at | timestamptz | | Invitation timestamp |
| activated_at | timestamptz | | Activation timestamp |
| created_at | timestamptz | default now() | Created timestamp |
| updated_at | timestamptz | default now() | Updated timestamp |

**Indexes**:
- Primary key on `id`
- Unique constraint on `(company_id, user_id)`
- Index on `company_id`
- Index on `user_id`

**RLS Policies**:
- `company_users_read`: Users can see members in their company
- `company_users_invite`: gc_admin/pm can invite members
- `company_users_update`: gc_admin can update memberships

---

### subcontractors
Subcontractor directory.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Subcontractor ID |
| company_id | uuid | NOT NULL, FK → companies | Company reference |
| name | text | NOT NULL | Subcontractor name |
| trade_type | trade_type | NOT NULL | Trade classification |
| email | text | | Contact email |
| phone | text | | Contact phone |
| address | text | | Business address |
| license_number | text | | License/certification |
| insurance_expiry | date | | Insurance expiration |
| notes | text | | Internal notes |
| created_at | timestamptz | default now() | Created timestamp |
| updated_at | timestamptz | default now() | Updated timestamp |

**Indexes**:
- Primary key on `id`
- Index on `(company_id, trade_type)`

**RLS Policies**:
- `subcontractors_read`: All company members can read
- `subcontractors_manage`: gc_admin/pm can manage

---

## Projects Tables

### projects
Project records with metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Project ID |
| company_id | uuid | NOT NULL, FK → companies | Company reference |
| name | text | NOT NULL | Project name |
| description | text | | Project description |
| project_type | project_type | NOT NULL | Project classification |
| status | project_status | NOT NULL, default 'active' | Project status |
| client_name | text | | Client/owner name |
| address | text | | Project site address |
| city | text | | City |
| state | text | | State |
| zip_code | text | | ZIP code |
| start_date | date | | Planned start date |
| end_date | date | | Planned end date |
| budget | numeric(12,2) | | Total budget |
| health_score | int | | Project health (0-100) |
| completion_percentage | int | default 0 | Overall completion |
| created_by | uuid | FK → next_auth.users | Creator user ID |
| created_at | timestamptz | default now() | Created timestamp |
| updated_at | timestamptz | default now() | Updated timestamp |

**Indexes**:
- Primary key on `id`
- Index on `(company_id, status)`
- Index on `(company_id, project_type)`

**RLS Policies**:
- `projects_read`: Company members can read projects
- `projects_create`: gc_admin/pm can create
- `projects_update`: gc_admin/pm can update
- `projects_delete`: gc_admin can delete

**Triggers**:
- `set_updated_at` - Auto-update timestamp
- `auto_create_project_phases` - Create 5 default phases on insert

---

### project_phases
Project phase tracking (5 universal phases per project).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Phase ID |
| project_id | uuid | NOT NULL, FK → projects ON DELETE CASCADE | Project reference |
| name | text | NOT NULL | Phase name |
| order_index | int | NOT NULL, default 0 | Display order |
| status | phase_status | NOT NULL, default 'pending' | Phase status |
| completion_percentage | int | default 0 | Phase completion |
| started_at | timestamptz | | Start timestamp |
| completed_at | timestamptz | | Completion timestamp |
| notes | text | | Phase notes |
| created_at | timestamptz | default now() | Created timestamp |
| updated_at | timestamptz | default now() | Updated timestamp |

**Default Phases** (auto-created):
1. Initiation
2. Pre-Construction
3. Procurement
4. Construction
5. Post-Construction

**Indexes**:
- Primary key on `id`
- Index on `(project_id, order_index)`

**RLS Policies**:
- `phases_read`: Company members can read
- `phases_update`: gc_admin/pm can update

**Triggers**:
- `set_updated_at` - Auto-update timestamp
- `auto_calculate_phase_completion` - Calculate from tasks
- `auto_calculate_project_completion` - Update project completion

---

### project_team
Team assignments per project.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Assignment ID |
| project_id | uuid | NOT NULL, FK → projects ON DELETE CASCADE | Project reference |
| user_id | uuid | NOT NULL, FK → next_auth.users | User reference |
| responsibility | text | | Team member responsibility |
| assigned_at | timestamptz | default now() | Assignment timestamp |

**Indexes**:
- Primary key on `id`
- Unique constraint on `(project_id, user_id)`
- Index on `project_id`

**RLS Policies**:
- `team_read`: Company members can read
- `team_assign`: gc_admin/pm can assign

---

## Tasks Tables

### tasks
Task records with dependencies and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Task ID |
| project_id | uuid | NOT NULL, FK → projects ON DELETE CASCADE | Project reference |
| phase_id | uuid | FK → project_phases ON DELETE SET NULL | Phase reference |
| title | text | NOT NULL | Task title |
| description | text | | Task description |
| status | task_status | NOT NULL, default 'todo' | Task status |
| priority | task_priority | NOT NULL, default 'medium' | Task priority |
| assignee_id | uuid | FK → next_auth.users | Assignee user ID |
| created_by | uuid | FK → next_auth.users | Creator user ID |
| due_date | date | | Due date |
| planned_cost | numeric(10,2) | | Estimated cost |
| actual_cost | numeric(10,2) | | Actual cost |
| blocked_reason | text | | Reason if blocked |
| created_at | timestamptz | default now() | Created timestamp |
| updated_at | timestamptz | default now() | Updated timestamp |
| completed_at | timestamptz | | Completion timestamp |

**Indexes**:
- Primary key on `id`
- Index on `(project_id, status)`
- Index on `(project_id, assignee_id)`
- Index on `phase_id`

**RLS Policies**:
- `tasks_read`: Company members can read project tasks
- `tasks_create`: gc_admin/pm/foreman can create
- `tasks_update`: gc_admin/pm/foreman/assignee can update
- `tasks_delete`: gc_admin/pm can delete

**Triggers**:
- `set_updated_at` - Auto-update timestamp
- `set_completed_at` - Set timestamp when status=completed

---

### task_dependencies
Task prerequisite relationships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Dependency ID |
| task_id | uuid | NOT NULL, FK → tasks ON DELETE CASCADE | Dependent task |
| depends_on_task_id | uuid | NOT NULL, FK → tasks ON DELETE CASCADE | Prerequisite task |
| created_at | timestamptz | default now() | Created timestamp |

**Indexes**:
- Primary key on `id`
- Unique constraint on `(task_id, depends_on_task_id)`
- Index on `task_id`
- Index on `depends_on_task_id`

**RLS Policies**:
- `dependencies_read`: Company members can read
- `dependencies_manage`: gc_admin/pm/foreman can manage

---

### task_activity
Audit log for task changes and comments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Activity ID |
| task_id | uuid | NOT NULL, FK → tasks ON DELETE CASCADE | Task reference |
| user_id | uuid | NOT NULL, FK → next_auth.users | Actor user ID |
| action | activity_action | NOT NULL | Activity type |
| field_name | text | | Changed field name |
| old_value | text | | Previous value |
| new_value | text | | New value |
| comment | text | | User comment |
| created_at | timestamptz | default now() | Activity timestamp |

**Indexes**:
- Primary key on `id`
- Index on `(task_id, created_at DESC)`

**RLS Policies**:
- `activity_read`: Company members can read
- `activity_create`: Company members can create

---

## Support Tables

### notifications
Multi-channel notification system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Notification ID |
| user_id | uuid | NOT NULL, FK → next_auth.users | Recipient user ID |
| type | notification_type | NOT NULL | Notification channel |
| title | text | NOT NULL | Notification title |
| message | text | NOT NULL | Notification message |
| link | text | | Action link |
| read | boolean | default false | Read status |
| read_at | timestamptz | | Read timestamp |
| created_at | timestamptz | default now() | Created timestamp |

**Indexes**:
- Primary key on `id`
- Index on `(user_id, read, created_at DESC)`

**RLS Policies**:
- `notifications_read`: Users can read own notifications
- `notifications_update`: Users can mark own as read

---

### attachments
Polymorphic file attachments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Attachment ID |
| entity_type | attachment_entity_type | NOT NULL | Parent entity type |
| entity_id | uuid | NOT NULL | Parent entity ID |
| file_name | text | NOT NULL | Original filename |
| file_url | text | NOT NULL | Storage URL |
| file_type | text | | MIME type |
| file_size | int | | Size in bytes |
| uploaded_by | uuid | FK → next_auth.users | Uploader user ID |
| created_at | timestamptz | default now() | Upload timestamp |

**Indexes**:
- Primary key on `id`
- Index on `(entity_type, entity_id)`

**RLS Policies**:
- `attachments_read`: Company members can read
- `attachments_create`: Company members can upload
- `attachments_delete`: gc_admin/pm/uploader can delete

---

## Database Triggers

### Timestamp Triggers
Applied to all tables with `updated_at` column:

```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Phase Auto-Creation
When a project is created, automatically create 5 default phases:

```sql
CREATE TRIGGER auto_create_project_phases
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_phases();
```

**Default Phases**:
1. Initiation (order_index: 0)
2. Pre-Construction (order_index: 1)
3. Procurement (order_index: 2)
4. Construction (order_index: 3)
5. Post-Construction (order_index: 4)

### Completion Calculation
Auto-calculate phase and project completion based on task progress:

```sql
CREATE TRIGGER auto_calculate_phase_completion
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_phase_completion();

CREATE TRIGGER auto_calculate_project_completion
  AFTER UPDATE ON project_phases
  FOR EACH ROW
  WHEN (OLD.completion_percentage IS DISTINCT FROM NEW.completion_percentage)
  EXECUTE FUNCTION calculate_project_completion();
```

### Task Completion Timestamp
Auto-set `completed_at` when task status changes to 'completed':

```sql
CREATE TRIGGER set_task_completed_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION set_completed_timestamp();
```

---

## Row-Level Security (RLS)

All tables have RLS enabled with company-based isolation:

### Multi-Tenant Isolation Pattern
```sql
-- Example: projects table
CREATE POLICY projects_read ON projects
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = (SELECT next_auth.uid())
      AND status = 'active'
    )
  );
```

### Role-Based Permissions
- **gc_admin**: Full CRUD access
- **project_manager**: Create and update assigned projects
- **foreman**: Update assigned project tasks
- **field_worker**: Update assigned tasks, view only
- **subcontractor**: Limited to assigned tasks
- **client**: Read-only access to curated data

---

## Migration Files

Database schema is split into 5 ordered migration files:

1. **01_setup_and_auth.sql** - Schemas, extensions, NextAuth tables
2. **02_enums.sql** - All 11 enumeration types
3. **03_tables.sql** - All 12 application tables (no RLS)
4. **04_rls_policies.sql** - Enable RLS + 48 policies
5. **05_triggers.sql** - All trigger functions and triggers

**Execution Order**: Must run in sequence (01 → 02 → 03 → 04 → 05)

Individual table migrations also available in `supabase/migrations/001_*.sql` through `013_*.sql` for reference.

---

## Type Generation

TypeScript types auto-generated via Supabase CLI:

```bash
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

**Generated Types**:
- `Database['public']['Tables']['{table}']['Row']` - Select result
- `Database['public']['Tables']['{table}']['Insert']` - Insert payload
- `Database['public']['Tables']['{table}']['Update']` - Update payload
- `Database['public']['Enums']['{enum}']` - Enum values

---

For implementation patterns, see:
- [Projects Module](modules/projects-module.md)
- [Tasks Module](modules/tasks-module.md)
- [Phase System](modules/phase-system.md)
