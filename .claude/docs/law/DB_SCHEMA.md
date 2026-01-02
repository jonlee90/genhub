# GenHub PWA - Database Schema

> **SINGLE SOURCE OF TRUTH** for all database operations. All agents MUST reference this document when working with the database.

## Table of Contents

1. [Overview](#overview)
2. [Schema Organization](#schema-organization)
3. [Enums](#enums)
4. [Tables](#tables)
5. [Relationships](#relationships)
6. [Row Level Security](#row-level-security)
7. [Helper Functions](#helper-functions)
8. [Database Triggers](#database-triggers)
9. [Common Queries](#common-queries)
10. [Migration History](#migration-history)

---

## Overview

GenHub uses **Supabase** (PostgreSQL) with two schemas:
- `next_auth` - Authentication tables (managed by NextAuth adapter)
- `public` - Application data (managed by us)

### Key Principles
- All tables have RLS enabled
- Use `next_auth.uid()` to get current user's UUID
- Company-scoped data access through `company_users` table
- Timestamps use `timestamp with time zone`
- UUIDs for all primary keys (generated with `gen_random_uuid()`)

---

## Schema Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                         next_auth schema                         │
│  (Managed by @auth/supabase-adapter - DO NOT MODIFY DIRECTLY)   │
├─────────────────────────────────────────────────────────────────┤
│  users          - User accounts                                  │
│  accounts       - OAuth account connections                      │
│  sessions       - Active sessions                                │
│  verification_tokens - Email verification tokens                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         public schema                            │
│                    (Application data)                            │
├─────────────────────────────────────────────────────────────────┤
│  CORE:                                                           │
│    companies         - Construction companies                    │
│    user_profiles     - Extended user data                        │
│    company_users     - Company membership & roles                │
│                                                                  │
│  PROJECTS:                                                       │
│    projects          - Construction projects                     │
│    project_phases    - Project phases (Metro Journey)            │
│    project_team      - Project team assignments                  │
│                                                                  │
│  TASKS:                                                          │
│    tasks             - Work items                                │
│    task_dependencies - Task dependency relationships             │
│    task_activity     - Activity log (comments, changes)          │
│                                                                  │
│  MATERIALS & EXPENSES:                                           │
│    materials         - Product catalog                           │
│    material_assignments - Materials linked to tasks              │
│    expenses          - Expense records                           │
│    expense_line_items - Individual expense items                 │
│                                                                  │
│  TEAM:                                                           │
│    subcontractors    - Subcontractor profiles                    │
│    team_invitations  - Pending invitations                       │
│                                                                  │
│  SYSTEM:                                                         │
│    notifications     - In-app notifications                      │
│    attachments       - File attachments                          │
│    push_subscriptions - Push notification tokens (FCM)           │
│                                                                  │
│  CHAT:                                                           │
│    chat_rooms        - Project/DM chat rooms                     │
│    chat_participants - Room membership & read tracking           │
│    messages          - Chat messages with threads                │
│    message_reactions - Emoji reactions on messages               │
│    message_attachments - File attachments for messages           │
│                                                                  │
│  INTEGRATIONS:                                                   │
│    kakao_connections - KakaoTalk/Sendbird integration            │
│                                                                  │
│  BILLING:                                                        │
│    stripe_customers  - Stripe subscription management            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Enums

### User & Team
```sql
-- User roles in company
CREATE TYPE user_role AS ENUM (
  'gc_admin',        -- General Contractor Admin (full access)
  'project_manager', -- Project Manager
  'foreman',         -- Site Foreman
  'field_worker',    -- Field Worker
  'subcontractor',   -- Subcontractor
  'client'           -- Client (read-only)
);

-- Member status
CREATE TYPE member_status AS ENUM (
  'active',
  'invited',
  'inactive'
);
```

### Projects
```sql
-- Project types
CREATE TYPE project_type AS ENUM (
  'residential',
  'restaurant',
  'cafe',
  'commercial_office',
  'industrial'
);

-- Project status
CREATE TYPE project_status AS ENUM (
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- Phase status
CREATE TYPE phase_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'on_hold'
);
```

### Tasks
```sql
-- Task status (Kanban columns)
CREATE TYPE task_status AS ENUM (
  'todo',
  'in_progress',
  'review',
  'blocked',
  'completed'
);

-- Task priority
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high'
);

-- Task type (defines form fields and workflow)
CREATE TYPE task_type AS ENUM (
  'work',      -- Standard labor/work tasks
  'purchase',  -- Buying materials/supplies (shows Materials step)
  'approval',  -- Permits, sign-offs, inspections (has approval workflow)
  'admin'      -- Administrative/overhead tasks
);

-- Approval status (for approval-type tasks)
CREATE TYPE approval_status AS ENUM (
  'pending',             -- Awaiting review
  'approved',            -- Approved by reviewer
  'rejected',            -- Rejected by reviewer
  'revision_requested'   -- Sent back for changes
);

-- Activity actions
CREATE TYPE activity_action AS ENUM (
  'created',
  'updated',
  'deleted',
  'status_changed',
  'assigned',
  'commented',
  'attachment_added',
  'attachment_removed'
);
```

### Materials & Expenses
```sql
-- Material categories
CREATE TYPE material_category AS ENUM (
  'lumber', 'concrete', 'electrical', 'plumbing', 'hvac',
  'roofing', 'flooring', 'paint', 'hardware', 'tools',
  'fixtures', 'insulation', 'drywall', 'doors_windows',
  'landscaping', 'other'
);

-- Procurement status
CREATE TYPE procurement_status AS ENUM (
  'needed',
  'ordered',
  'delivered',
  'installed'
);

-- Purchaser type
CREATE TYPE purchaser_type AS ENUM (
  'gc',
  'pm',
  'subcontractor'
);

-- Expense categories
CREATE TYPE expense_category AS ENUM (
  'materials', 'labor', 'equipment', 'permits',
  'transportation', 'meals', 'lodging', 'other'
);

-- Expense status
CREATE TYPE expense_status AS ENUM (
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'paid'
);
```

### Subcontractors
```sql
-- Trade specializations
CREATE TYPE trade_type AS ENUM (
  'general', 'electrical', 'plumbing', 'hvac', 'carpentry',
  'masonry', 'roofing', 'flooring', 'painting', 'drywall',
  'concrete', 'landscaping', 'demolition', 'steel_work',
  'glass_glazing', 'fire_protection', 'insulation', 'other'
);
```

### System
```sql
-- Attachment entity types
CREATE TYPE attachment_entity_type AS ENUM (
  'task', 'project', 'phase', 'profile',
  'subcontractor', 'material', 'expense'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'task_assigned', 'task_completed', 'task_overdue', 'task_blocked',
  'project_update', 'team_invited', 'mention', 'system',
  'material_assigned', 'material_delivered', 'material_ordered',
  'expense_submitted', 'expense_approved', 'expense_rejected',
  'budget_overrun'
);
```

---

## Tables

### companies
```sql
CREATE TABLE public.companies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  address      text,
  phone        text,
  email        text,
  logo_url     text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
-- RLS: Members can view their company, GC Admin can update
```

### user_profiles
```sql
CREATE TABLE public.user_profiles (
  id           uuid PRIMARY KEY,  -- References next_auth.users.id
  name         text NOT NULL,
  email        text NOT NULL,
  avatar_url   text,
  phone        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),

  CONSTRAINT user_profiles_id_fkey
    FOREIGN KEY (id) REFERENCES next_auth.users(id)
);
-- RLS: Users can view profiles in their company
```

### company_users
```sql
CREATE TABLE public.company_users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id),
  user_id          uuid NOT NULL REFERENCES next_auth.users(id),
  role             user_role DEFAULT 'field_worker',
  status           member_status DEFAULT 'invited',
  invited_by       uuid REFERENCES next_auth.users(id),
  invited_at       timestamptz DEFAULT now(),
  activated_at     timestamptz,
  invitation_token uuid UNIQUE,  -- For invitation links
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
-- RLS: GC Admin can manage, members can view
```

### projects
```sql
CREATE TABLE public.projects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES companies(id),
  name                  text NOT NULL,
  client_name           text NOT NULL,
  client_email          text,
  client_phone          text,
  address               text,
  city                  text,
  state                 text,
  zip_code              text,
  project_type          project_type DEFAULT 'residential',
  status                project_status DEFAULT 'active',
  description           text,
  start_date            date,
  end_date              date,
  budget                numeric,
  health_score          integer DEFAULT 100,      -- 0-100
  completion_percentage integer DEFAULT 0,        -- 0-100
  image_url             text,                     -- Project site image URL
  latitude              numeric,                  -- Geocoded latitude
  longitude             numeric,                  -- Geocoded longitude
  created_by            uuid REFERENCES next_auth.users(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
-- RLS: Company members can view, GC/PM can create/update
-- TRIGGER: create_default_project_phases creates 5 phases on insert
```

### project_phases
```sql
CREATE TABLE public.project_phases (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL REFERENCES projects(id),
  name                  text NOT NULL,
  order_index           integer DEFAULT 0,
  status                phase_status DEFAULT 'not_started',
  completion_percentage integer DEFAULT 0,
  started_at            timestamptz,
  completed_at          timestamptz,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
-- Default phases: Initiation(0), Pre-Construction(1), Procurement(2),
--                 Construction(3), Post-Construction(4)
-- TRIGGER: update_project_completion updates project.completion_percentage
```

### project_team
```sql
CREATE TABLE public.project_team (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES projects(id),
  user_id          uuid REFERENCES next_auth.users(id),
  subcontractor_id uuid REFERENCES subcontractors(id),
  role             user_role NOT NULL,
  assigned_at      timestamptz DEFAULT now(),
  assigned_by      uuid REFERENCES next_auth.users(id)
);
-- RLS: Company members can view, GC/PM can manage
```

### tasks
```sql
CREATE TABLE public.tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES projects(id),
  phase_id         uuid REFERENCES project_phases(id),
  title            text NOT NULL,
  description      text,
  status           task_status DEFAULT 'todo',
  priority         task_priority DEFAULT 'medium',
  task_type        task_type NOT NULL DEFAULT 'work',      -- Type of task (work/purchase/approval/admin)
  assignee_id      uuid REFERENCES next_auth.users(id),
  start_date       date,
  due_date         date,
  planned_cost     numeric,
  actual_cost      numeric,                                -- AUTO-CALCULATED by trigger
  blocked_reason   text,                                   -- Required when status = 'blocked'
  -- Approval workflow fields (only for task_type = 'approval')
  approval_status  approval_status,                        -- Status of approval (pending/approved/rejected/revision_requested)
  approval_notes   text,                                   -- Notes from approver (especially for rejection/revision)
  approved_by      uuid REFERENCES next_auth.users(id),    -- Who approved/rejected
  approved_at      timestamptz,                            -- When approval action was taken
  -- Receipt documentation
  receipt_photo_url text,                                  -- Receipt photo for task documentation (especially for purchase tasks)
  completed_at     timestamptz,
  created_by       uuid REFERENCES next_auth.users(id),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
-- CONSTRAINT: approval_status IS NOT NULL when task_type = 'approval'
-- TRIGGER: set_task_completed_at sets/clears completed_at on status change
-- TRIGGER: update_phase_completion updates phase.completion_percentage
-- TRIGGER: update_task_costs updates actual_cost from materials + approved expenses
-- NOTE: actual_cost is read-only (auto-calculated), do not update manually
```

### task_dependencies
```sql
CREATE TABLE public.task_dependencies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES tasks(id),
  depends_on_task_id  uuid NOT NULL REFERENCES tasks(id),
  created_at          timestamptz DEFAULT now(),

  UNIQUE(task_id, depends_on_task_id)
);
-- RLS: Company members can manage dependencies for their tasks
```

### task_activity
```sql
CREATE TABLE public.task_activity (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES tasks(id),
  user_id    uuid REFERENCES next_auth.users(id),
  action     activity_action NOT NULL,
  old_value  text,
  new_value  text,
  comment    text,           -- For 'commented' action
  created_at timestamptz DEFAULT now()
);
-- RLS: Company members can view, authenticated can create
```

### subcontractors
```sql
CREATE TABLE public.subcontractors (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies(id),
  company_name         text NOT NULL,
  trade_specialization trade_type DEFAULT 'general',
  contact_name         text NOT NULL,
  email                text,
  phone                text,
  address              text,
  license_number       text,
  license_expiry       date,
  insurance_provider   text,
  insurance_expiry     date,
  performance_rating   numeric DEFAULT 0,  -- 0-5
  notes                text,
  is_active            boolean DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
-- RLS: Company members can view, GC/PM can manage
```

### team_invitations
```sql
CREATE TABLE public.team_invitations (
  id               uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id       uuid NOT NULL REFERENCES companies(id),
  email            text NOT NULL,
  name             text NOT NULL,
  role             user_role NOT NULL,
  invitation_token uuid UNIQUE DEFAULT extensions.uuid_generate_v4(),
  invited_by       uuid NOT NULL REFERENCES user_profiles(id),
  invited_at       timestamptz DEFAULT now(),
  expires_at       timestamptz DEFAULT (now() + interval '7 days'),
  used_at          timestamptz,  -- NULL = not used yet
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
-- COMMENT: Pending invitations before user authentication
-- RLS: GC Admin can manage invitations for their company
```

### materials
```sql
CREATE TABLE public.materials (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies(id),
  product_name         text NOT NULL,
  product_description  text,
  sku                  text,
  category             material_category DEFAULT 'other',
  manufacturer         text,
  unit_price           numeric NOT NULL,
  unit_of_measure      text DEFAULT 'each',
  home_depot_product_id text,
  home_depot_url       text,
  product_image_url    text,
  stock_status         text,
  lead_time_days       integer DEFAULT 0,
  specifications       jsonb DEFAULT '{}',
  is_active            boolean DEFAULT true,
  created_by           uuid REFERENCES next_auth.users(id),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
-- COMMENT: Materials from Home Depot or manual entry
-- RLS: Company members can view, GC/PM can manage
```

### material_assignments
```sql
CREATE TABLE public.material_assignments (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id            uuid NOT NULL REFERENCES materials(id),
  task_id                uuid NOT NULL REFERENCES tasks(id),
  project_id             uuid NOT NULL REFERENCES projects(id),
  quantity               numeric NOT NULL,
  unit_cost              numeric NOT NULL,
  total_cost             numeric GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  procurement_status     procurement_status DEFAULT 'needed',
  purchaser_type         purchaser_type DEFAULT 'gc',
  purchaser_id           uuid REFERENCES next_auth.users(id),
  subcontractor_id       uuid REFERENCES subcontractors(id),
  ordered_date           timestamptz,
  estimated_delivery_date timestamptz,
  delivered_date         timestamptz,
  installed_date         timestamptz,
  notes                  text,
  assigned_by            uuid REFERENCES next_auth.users(id),
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);
-- COMMENT: Links materials to tasks with procurement tracking
-- TRIGGER: update_task_costs updates task.actual_cost
```

### expenses
```sql
CREATE TABLE public.expenses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id),
  project_id          uuid REFERENCES projects(id),
  task_id             uuid REFERENCES tasks(id),
  description         text NOT NULL,
  amount              numeric NOT NULL,
  category            expense_category DEFAULT 'other',
  expense_date        date NOT NULL,
  vendor_name         text,
  vendor_address      text,
  receipt_url         text,
  receipt_ocr_data    jsonb DEFAULT '{}',
  ocr_confidence_score numeric,
  ocr_processed       boolean DEFAULT false,
  status              expense_status DEFAULT 'submitted',
  submitted_by        uuid NOT NULL REFERENCES next_auth.users(id),
  submitted_at        timestamptz DEFAULT now(),
  reviewed_by         uuid REFERENCES next_auth.users(id),
  reviewed_at         timestamptz,
  approval_notes      text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
-- COMMENT: Expense tracking with AI OCR receipt processing
-- TRIGGER: update_task_costs updates task.actual_cost when approved
```

### expense_line_items
```sql
CREATE TABLE public.expense_line_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id             uuid NOT NULL REFERENCES expenses(id),
  material_id            uuid REFERENCES materials(id),
  material_assignment_id uuid REFERENCES material_assignments(id),
  description            text NOT NULL,
  quantity               numeric DEFAULT 1,
  unit_price             numeric NOT NULL,
  line_total             numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  matched_by_ai          boolean DEFAULT false,
  match_confidence_score numeric,
  manually_matched       boolean DEFAULT false,
  ocr_extracted_data     jsonb DEFAULT '{}',
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);
-- COMMENT: Individual line items with AI-powered material matching
```

### notifications
```sql
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES next_auth.users(id),
  type       notification_type NOT NULL,
  title      text NOT NULL,
  message    text NOT NULL,
  link       text,
  read       boolean DEFAULT false,
  read_at    timestamptz,
  created_at timestamptz DEFAULT now()
);
-- RLS: Users can only view/update their own notifications
```

### attachments
```sql
CREATE TABLE public.attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type attachment_entity_type NOT NULL,
  entity_id   uuid NOT NULL,
  file_name   text NOT NULL,
  file_url    text NOT NULL,
  file_type   text,
  file_size   integer,
  uploaded_by uuid REFERENCES next_auth.users(id),
  created_at  timestamptz DEFAULT now()
);
-- RLS: Anyone can view, users can manage their own uploads
```

### stripe_customers
```sql
CREATE TABLE public.stripe_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL DEFAULT next_auth.uid() REFERENCES next_auth.users(id),
  stripe_customer_id  text NOT NULL UNIQUE,
  plan_active         boolean DEFAULT false,
  plan_expires        bigint,
  subscription_id     text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
-- COMMENT: Stores Stripe customer information for subscription management
-- RLS: Users can only view their own data
```

---

## Relationships

```
companies
  │
  ├──< company_users >── next_auth.users
  │         │
  │         └──> user_profiles
  │
  ├──< projects
  │       │
  │       ├──< project_phases
  │       │
  │       ├──< project_team >── subcontractors
  │       │
  │       ├──< tasks
  │       │       │
  │       │       ├──< task_dependencies
  │       │       │
  │       │       ├──< task_activity
  │       │       │
  │       │       └──< material_assignments
  │       │
  │       └──< expenses
  │               │
  │               └──< expense_line_items
  │
  ├──< subcontractors
  │
  ├──< materials
  │
  └──< team_invitations
```

---

## Row Level Security

### Core RLS Patterns

#### 1. Company-Scoped Access
```sql
-- Users can only access data from their company
CREATE POLICY "Users can view company data" ON table_name
FOR SELECT USING (
  company_id = get_user_company_id(next_auth.uid())
);
```

#### 2. Role-Based Access
```sql
-- Only GC Admin/PM can modify
CREATE POLICY "GC/PM can update" ON table_name
FOR UPDATE USING (
  is_user_gc_admin(next_auth.uid()) AND
  company_id = get_user_company_id(next_auth.uid())
);
```

#### 3. Owner-Based Access
```sql
-- Users can modify their own records
CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE USING (id = next_auth.uid());
```

### Key RLS Policies by Table

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| companies | Members | Authenticated | GC Admin | - |
| company_users | Members | GC Admin | GC Admin | GC Admin |
| projects | Members | GC/PM | GC/PM | GC Admin |
| tasks | Members | Members | Members | GC/PM |
| materials | Members | GC/PM | GC/PM | GC Admin |
| expenses | Members | Members | Submitter/GC/PM | Submitter/GC Admin |
| notifications | Owner | System | Owner | - |

---

## Helper Functions

### next_auth.uid()
```sql
-- Returns current user's UUID from JWT
CREATE FUNCTION next_auth.uid() RETURNS uuid
  LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
```

### get_user_company_id()
```sql
-- Returns the company_id for a user
CREATE FUNCTION get_user_company_id(p_user_id uuid) RETURNS uuid AS $$
  SELECT company_id
  FROM public.company_users
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE;
```

### is_user_gc_admin()
```sql
-- Checks if user is a GC Admin
CREATE FUNCTION is_user_gc_admin(p_user_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = p_user_id
      AND role = 'gc_admin'
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE;
```

### get_project_material_summary()
```sql
-- Returns material and expense summary for a project
CREATE FUNCTION get_project_material_summary(project_uuid uuid)
RETURNS TABLE (
  total_materials_cost numeric,
  materials_needed_count bigint,
  materials_ordered_count bigint,
  materials_delivered_count bigint,
  materials_installed_count bigint,
  total_expense_amount numeric,
  approved_expense_amount numeric
);
```

### get_team_member_project_counts()
```sql
-- Returns project counts for team members
CREATE FUNCTION get_team_member_project_counts(p_company_id uuid)
RETURNS TABLE (
  user_id uuid,
  project_count bigint
);
```

### get_top_team_members_by_completed_tasks()
```sql
-- Returns top team members by completed task count (for dashboard stats)
CREATE FUNCTION get_top_team_members_by_completed_tasks(
  p_company_id uuid,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  completed_tasks bigint
);
-- Usage: SELECT * FROM get_top_team_members_by_completed_tasks('company-uuid', 5);
```

### get_unread_count()
```sql
-- Returns count of unread messages in a chat room for a user
CREATE FUNCTION get_unread_count(
  p_chat_room_id uuid,
  p_user_id uuid
)
RETURNS bigint;
-- Usage: SELECT get_unread_count('room-uuid', 'user-uuid');
-- Counts messages created after user's last_read_at
-- Excludes soft-deleted messages (deleted_at IS NULL)
```

---

## Database Triggers

### update_updated_at_column
Automatically updates `updated_at` timestamp on row update.
```sql
-- Applied to: All tables with updated_at column
```

### create_default_project_phases
Creates 5 default phases when a project is created.
```sql
-- Phases: Initiation(0), Pre-Construction(1), Procurement(2),
--         Construction(3), Post-Construction(4)
```

### set_task_completed_at
Sets/clears `completed_at` when task status changes to/from 'completed'.

### update_phase_completion
Updates `project_phases.completion_percentage` when task status changes.

### update_project_completion
Updates `projects.completion_percentage` when phase completion changes.

### update_task_costs
Updates `tasks.actual_cost` when material_assignments or expenses change.

### create_project_chat_room
Auto-creates a chat room when a project is created.
```sql
-- Trigger: on_project_created_create_chat_room (AFTER INSERT on projects)
-- Creates chat_room with type='project', name=project.name
```

### add_chat_participant_on_team_join
Auto-adds user to project chat room when added to project_team.
```sql
-- Trigger: on_project_team_member_added (AFTER INSERT on project_team)
-- Maps role: 'gc_admin'/'project_manager' → 'admin', others → 'member'
-- Uses ON CONFLICT DO NOTHING for idempotency
```

### remove_chat_participant_on_team_leave
Auto-removes user from project chat room when removed from project_team.
```sql
-- Trigger: on_project_team_member_removed (AFTER DELETE on project_team)
-- Deletes from chat_participants where chat_room.project_id matches
```

### update_chat_updated_at
Updates `updated_at` for chat_rooms and chat_participants.
```sql
-- Applied to: chat_rooms, chat_participants
```

---

## Common Queries

### Get User's Projects with Stats
```sql
SELECT
  p.*,
  (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
  (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
FROM projects p
WHERE p.company_id = get_user_company_id(next_auth.uid())
ORDER BY p.created_at DESC;
```

### Get Task with Related Data
```sql
SELECT
  t.*,
  up.name as assignee_name,
  up.avatar_url as assignee_avatar,
  pp.name as phase_name,
  p.name as project_name
FROM tasks t
LEFT JOIN user_profiles up ON t.assignee_id = up.id
LEFT JOIN project_phases pp ON t.phase_id = pp.id
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.id = $1;
```

### Get Team Members with Roles
```sql
SELECT
  cu.*,
  up.name,
  up.email,
  up.avatar_url,
  (SELECT COUNT(*) FROM project_team pt WHERE pt.user_id = cu.user_id) as project_count
FROM company_users cu
LEFT JOIN user_profiles up ON cu.user_id = up.id
WHERE cu.company_id = $1 AND cu.status = 'active'
ORDER BY cu.role, up.name;
```

### Get Project Budget Summary
```sql
SELECT
  p.budget,
  COALESCE(SUM(ma.total_cost), 0) as materials_cost,
  COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) as expenses_cost
FROM projects p
LEFT JOIN material_assignments ma ON ma.project_id = p.id
LEFT JOIN expenses e ON e.project_id = p.id
WHERE p.id = $1
GROUP BY p.id, p.budget;
```

### chat_rooms
```sql
CREATE TABLE public.chat_rooms (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES companies(id),
  project_id         uuid REFERENCES projects(id),
  type               text NOT NULL CHECK (type IN ('project', 'dm')),
  name               text,
  description        text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
-- COMMENT: Chat rooms for project communication and direct messages
-- RLS: Users can view rooms they participate in, create DM rooms
-- TRIGGER: Auto-created when project is created
```

### chat_participants
```sql
CREATE TABLE public.chat_participants (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id       uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES next_auth.users(id),
  role               text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  last_read_at       timestamptz DEFAULT now(),
  muted_until        timestamptz,
  joined_at          timestamptz DEFAULT now(),
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),

  UNIQUE(chat_room_id, user_id)
);
-- COMMENT: Participants in chat rooms with read tracking and mute settings
-- TRIGGER: Auto-managed when project team members are added/removed
```

### messages
```sql
CREATE TABLE public.messages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id       uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id          uuid NOT NULL REFERENCES next_auth.users(id),
  content            text NOT NULL,
  reply_to_id        uuid REFERENCES messages(id),
  entity_references  jsonb DEFAULT '[]',
  edited_at          timestamptz,
  deleted_at         timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
-- COMMENT: Chat messages with support for threads, mentions, and soft delete
-- REALTIME: Enabled via supabase_realtime publication
-- INDEX: (chat_room_id, created_at DESC), (sender_id), (reply_to_id)
```

### message_reactions
```sql
CREATE TABLE public.message_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  emoji       text NOT NULL CHECK (char_length(emoji) > 0 AND char_length(emoji) <= 10),
  created_at  timestamptz DEFAULT now(),

  CONSTRAINT message_reactions_unique UNIQUE (message_id, user_id, emoji)
);
-- COMMENT: Emoji reactions to messages. One reaction type per user per message.
--          No notifications generated (silent acknowledgment per requirements).
-- RLS: Users can view reactions in their accessible rooms, manage their own reactions
-- INDEX: (message_id), (user_id), (message_id, user_id, emoji)
-- TRIGGER: Updates message.updated_at on reaction insert/delete
```

### message_attachments
```sql
CREATE TABLE public.message_attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name     text NOT NULL,
  file_url      text NOT NULL,
  file_type     text NOT NULL,
  file_size     integer NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  thumbnail_url text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
-- COMMENT: File and photo attachments for chat messages.
--          Max file size: 10MB (10485760 bytes)
--          Supported types: images (jpg, png, gif, webp), documents (pdf, doc, docx, xls, xlsx), archives (zip)
-- RLS: Users can view attachments in their accessible rooms
```

### push_subscriptions
```sql
CREATE TABLE public.push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES next_auth.users(id),
  endpoint     text NOT NULL,
  platform     text NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  p256dh_key   text NOT NULL,
  auth_key     text NOT NULL,
  user_agent   text,
  last_used_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
-- COMMENT: Stores push notification subscriptions (FCM tokens) for each user device/platform
-- RLS: Users can only manage their own subscriptions
```

### kakao_connections
```sql
CREATE TABLE public.kakao_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES next_auth.users(id),
  kakao_user_id   text NOT NULL,
  sendbird_user_id text NOT NULL,
  two_way_sync    boolean DEFAULT false,
  connected_at    timestamptz DEFAULT now(),
  disconnected_at timestamptz,
  access_token    text NOT NULL,
  refresh_token   text NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
-- COMMENT: Stores KakaoTalk account connections via Sendbird integration
--          with encrypted access tokens for two-way messaging sync.
--          two_way_sync enables GenHub ↔ KakaoTalk message synchronization.
-- RLS: Users can only view/manage their own connection
```

---

## Migration History

| Version | Name | Description |
|---------|------|-------------|
| 20251207043316 | remove_critical_priority | Removed 'critical' from task_priority enum |
| 20251207083008 | create_team_member_project_counts_function_v2 | Helper function for team stats |
| 20251209020102 | materials_and_expenses | Created materials, material_assignments, expenses, expense_line_items |
| 20251209020136 | materials_expenses_rls | RLS policies for materials and expenses |
| 20251209034717 | fix_company_users_rls_recursion | Fixed recursive RLS policy issue |
| 20251209034916 | fix_company_users_rls_complete | Complete RLS fix with helper functions |
| 20251209035356 | fix_all_rls_policies_using_helper_functions | Refactored all RLS to use helper functions |
| 20251209074250 | add_start_date_to_tasks | Added start_date column to tasks |
| 20251228092306 | add_top_team_members_function | Function for top team members by completed tasks |
| 20251229015123 | add_subcontractor_to_tasks | Added subcontractor reference to tasks |
| 20251230034957 | add_task_type_and_approval_status | Added task_type enum, approval_status enum, and approval workflow columns to tasks |
| 20251230043428 | add_stripe_customers_table | Added stripe_customers table for subscription management |
| 20251230103624 | add_project_image_columns | Added image_url, latitude, longitude columns to projects |
| 20251230122249 | create_chat_tables | Created chat_rooms, chat_participants, messages tables |
| 20251230122306 | chat_rls_policies | Added RLS policies for chat system |
| 20251230122328 | chat_triggers_and_functions | Created chat triggers and helper functions |
| 20251230224246 | 032_find_dm_room_function | Function to find existing DM rooms between users |
| 20251230224346 | 033_dm_room_constraints | Constraints for DM room uniqueness |
| 20251230225030 | 032_find_dm_room_function_search_path | Fixed search path for DM room function |
| 20251230225049 | 033_dm_room_constraints_search_path | Fixed search path for DM constraints |
| 20251230225339 | 034_messages_fts_index | Full-text search index for messages |
| 20260101XXXXXX | add_receipt_photo_to_tasks | Added receipt_photo_url column to tasks table |

---

## MCP Supabase Commands Reference

```bash
# List all tables
mcp__supabase__list_tables

# Execute SELECT/INSERT/UPDATE/DELETE
mcp__supabase__execute_sql query:"SELECT * FROM projects LIMIT 10"

# Apply DDL migrations
mcp__supabase__apply_migration name:"add_new_column" query:"ALTER TABLE ..."

# Check security advisors
mcp__supabase__get_advisors type:"security"

# Check performance advisors
mcp__supabase__get_advisors type:"performance"

# View logs
mcp__supabase__get_logs service:"postgres"

# Regenerate TypeScript types
mcp__supabase__generate_typescript_types
```

**IMPORTANT**: After any schema change, always run `mcp__supabase__generate_typescript_types` to update `types/database.types.ts`.
