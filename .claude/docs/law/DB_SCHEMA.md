# GenHub PWA - Database Schema

> **Quick Reference** for database operations. Read sections as needed.

## Core Principles

- **Auth**: Use `next_auth.uid()` for current user UUID
- **Scoping**: Company-scoped via `company_users` table
- **Security**: All tables have RLS enabled
- **Timestamps**: `timestamp with time zone` (timestamptz)
- **IDs**: UUIDs via `gen_random_uuid()`

---

## Quick Navigation

- [Enums](#enums) - All enum types
- [Tables](#tables) - Table definitions
- [RLS](#rls-patterns) - Security policies
- [Helpers](#helper-functions) - SQL functions
- [Queries](#common-queries) - Query patterns

---

## Quick Lookup by Task Type

| Working On | Read Sections | Related Tables |
|------------|---------------|----------------|
| **Tasks** | Task Tables, Project Tables | tasks → projects, project_phases, material_assignments, expenses |
| **Projects** | Project Tables, Core Tables | projects → company_users, project_phases, project_team, tasks |
| **Materials** | Material Tables, Task Tables | materials → material_assignments → tasks, expense_line_items |
| **Expenses** | Material Tables (Expenses) | expenses → projects, tasks, expense_line_items → materials |
| **Chat** | Chat Tables | chat_rooms → projects, chat_participants, messages |
| **Files & Photos** | File Management Tables | project_files, project_photos, file_audit_log → projects, company |
| **Team** | Team Tables, Core Tables | subcontractors, company_users, team_invitations, project_team |
| **3D Spatial** | 3D Spatial Tables (independent) | projects_3d_models, spatial_markers, marker_content, model_elements |
| **Notifications** | System Tables | notifications → users (independent) |

**Tip:** Check [Relationships](#relationships) diagram at bottom for full connection map.

---

## Schema Overview

**next_auth** (managed by @auth/supabase-adapter - DO NOT modify):
- `users`, `accounts`, `sessions`, `verification_tokens`

**public** (application data):

| Category | Tables |
|----------|--------|
| **Core** | companies, user_profiles, company_users |
| **Projects** | projects, project_phases, project_team |
| **Tasks** | tasks, task_dependencies, task_activity |
| **Materials** | materials, material_assignments, expenses, expense_line_items, tracked_materials, material_price_history |
| **Team** | subcontractors, team_invitations |
| **Chat** | chat_rooms, chat_participants, messages, message_reactions, message_attachments |
| **Files** | project_files, project_photos, file_audit_log |
| **System** | notifications, attachments, push_subscriptions |
| **Integrations** | kakao_connections |
| **Billing** | stripe_customers |
| **3D Spatial** | projects_3d_models, default_3d_models, spatial_markers, marker_content, model_elements |

---

## Enums

<details>
<summary><strong>User & Team Enums</strong></summary>

```sql
-- user_role: gc_admin, project_manager, foreman, field_worker, subcontractor, client
-- member_status: active, invited, inactive
```
</details>

<details>
<summary><strong>Project Enums</strong></summary>

```sql
-- project_type_old: residential, restaurant_cafe, commercial_office, industrial, restaurant, cafe
-- project_status: active, on_hold, completed, archived
-- phase_status: not_started, in_progress, completed
```
</details>

<details>
<summary><strong>Task Enums</strong></summary>

```sql
-- task_status: todo, in_progress, review, blocked, completed
-- task_priority: low, medium, high, critical
-- task_type: work, purchase, approval, admin
-- approval_status: pending, approved, rejected, revision_requested
-- activity_action: created, updated, deleted, status_changed, assigned, commented, attachment_added, attachment_removed
```
</details>

<details>
<summary><strong>Material & Expense Enums</strong></summary>

```sql
-- material_category: lumber, concrete, electrical, plumbing, hvac, roofing, flooring, paint, hardware, tools, fixtures, insulation, drywall, doors_windows, landscaping, other
-- procurement_status: needed, ordered, delivered, installed
-- purchaser_type: gc, pm, subcontractor
-- expense_category: materials, labor, equipment, permits, transportation, meals, lodging, other
-- expense_status: submitted, under_review, approved, rejected, paid
```
</details>

<details>
<summary><strong>File Management Enums</strong></summary>

```sql
-- document_category: contracts, permits, drawings, reports, financial, safety, meeting_notes, specifications, general
-- photo_category: site_progress, safety_documentation, permits_approvals, inspection_reports, material_receipts, change_orders, defects_issues, before_after, task_receipts, expense_receipts, general
```
</details>

<details>
<summary><strong>System Enums</strong></summary>

```sql
-- trade_type: general, electrical, plumbing, hvac, carpentry, masonry, roofing, flooring, painting, drywall, concrete, landscaping, demolition, steel_work, glass_glazing, fire_protection, insulation, other
-- attachment_entity_type: task, project, phase, profile, subcontractor, material, expense
-- notification_type: task_assigned, task_completed, task_overdue, task_blocked, project_update, team_invited, mention, system, material_assigned, material_delivered, material_ordered, expense_submitted, expense_approved, expense_rejected, budget_overrun
```
</details>

---

## Tables

### Core Tables

**companies**
```sql
id uuid PK, name text, address, phone, email, logo_url,
client_can_view_budget boolean DEFAULT false,
created_at, updated_at
-- RLS: Members view, GC Admin update
-- Client Portal: client_can_view_budget controls budget visibility in client portal
```

**user_profiles**
```sql
id uuid PK (→ next_auth.users), name text, email text, avatar_url, phone, created_at, updated_at
-- RLS: Users view company profiles
```

**company_users**
```sql
id uuid PK, company_id uuid FK, user_id uuid FK, role user_role, status member_status,
invited_by uuid FK, invited_at, joined_at, created_at, updated_at
-- UNIQUE(company_id, user_id)
-- RLS: GC Admin manage, members view
```

### Project Tables

**projects**
```sql
id uuid PK, company_id uuid FK, name text, client_name, client_email, client_phone,
address, city, state, zip_code, project_type, status project_status, description,
start_date date, end_date date, budget decimal(12,2), actual_cost decimal(12,2),
health_score int (0-100), completion_percentage int (0-100),
created_by uuid FK, created_at, updated_at
-- Trigger: Creates 5 default phases on insert
-- RLS: Members view, GC/PM create/update
```

**project_phases**
```sql
id uuid PK, project_id uuid FK, name text, display_order int, status phase_status,
completion_percentage int (0-100), start_date date, end_date date, description text,
created_at, updated_at
-- Default phases: Initiation(0), Pre-Construction(1), Procurement(2), Construction(3), Post-Construction(4)
-- Trigger: Updates project.completion_percentage
-- UNIQUE(project_id, name), UNIQUE(project_id, display_order)
```

**project_team**
```sql
id uuid PK, project_id uuid FK, user_id uuid FK, subcontractor_id uuid FK,
role user_role, assigned_at, assigned_by uuid FK
-- Trigger: Auto-adds to chat_participants (if chat system enabled)
-- RLS: Members view, GC/PM manage
-- CHECK: Either user_id OR subcontractor_id must be set
```

### Task Tables

**tasks**
```sql
id uuid PK, project_id uuid FK, phase_id uuid FK, title text, description,
status task_status, priority task_priority (low, medium, high),
assignee_id uuid FK, subcontractor_id uuid FK,
due_date date, planned_cost decimal(10,2), actual_cost decimal(10,2) (AUTO-CALC),
blocked_reason text, display_order int, created_by uuid FK,
completed_at timestamptz, created_at, updated_at
-- Trigger: Updates actual_cost from materials + expenses
-- Trigger: Sets completed_at on status change
-- Trigger: Updates phase completion
-- RLS: Members view/insert, GC/PM delete
```

**task_dependencies**
```sql
id uuid PK, task_id uuid FK, depends_on_task_id uuid FK, created_at
UNIQUE(task_id, depends_on_task_id)
```

**task_activity**
```sql
id uuid PK, task_id uuid FK, user_id uuid FK, action activity_action,
old_value text, new_value text, comment text, created_at
```

### Material Tables

**materials**
```sql
id uuid PK, company_id uuid FK, product_name text, product_description, sku,
category material_category, manufacturer, unit_price numeric, unit_of_measure,
home_depot_product_id, home_depot_url, product_image_url, stock_status,
lead_time_days int, specifications jsonb, is_active bool, created_by uuid FK,
created_at, updated_at
-- RLS: Members view, GC/PM manage
```

**material_assignments**
```sql
id uuid PK, material_id uuid FK, task_id uuid FK, project_id uuid FK,
quantity numeric, unit_cost numeric,
total_cost numeric GENERATED (quantity * unit_cost) STORED,
procurement_status, purchaser_type, purchaser_id uuid FK, subcontractor_id uuid FK,
ordered_date, estimated_delivery_date, delivered_date, installed_date,
notes, assigned_by uuid FK, created_at, updated_at
-- Trigger: Updates task.actual_cost
```

**expenses**
```sql
id uuid PK, company_id uuid FK, project_id uuid FK, task_id uuid FK,
description text, amount numeric, category expense_category, expense_date date,
vendor_name, vendor_address, receipt_url, receipt_ocr_data jsonb,
ocr_confidence_score numeric, ocr_processed bool, status expense_status,
submitted_by uuid FK, submitted_at, reviewed_by uuid FK, reviewed_at,
approval_notes, created_at, updated_at
-- Trigger: Updates task.actual_cost when approved
-- RLS: Members view/insert, submitter/GC/PM update
```

**expense_line_items**
```sql
id uuid PK, expense_id uuid FK, material_id uuid FK, material_assignment_id uuid FK,
description text, quantity numeric, unit_price numeric,
line_total numeric GENERATED (quantity * unit_price) STORED,
matched_by_ai bool, match_confidence_score numeric, manually_matched bool,
ocr_extracted_data jsonb, created_at, updated_at
```

**tracked_materials**
```sql
id uuid PK, company_id uuid FK, user_id uuid, material_id uuid FK,
tracked_at timestamptz, created_at, updated_at
-- Purpose: User watchlist for material price monitoring (max 10 per user)
-- Trigger: check_tracked_materials_limit() enforces 10 material limit per user
-- RLS: Users can view tracked materials in their company, insert/delete their own
-- Index: UNIQUE(user_id, material_id)
```

**material_price_history**
```sql
id uuid PK, company_id uuid FK, material_id uuid FK,
price numeric(10,2), recorded_at timestamptz, source text DEFAULT 'home_depot_api',
created_at
-- Purpose: Historical price snapshots for materials (90-day retention, append-only)
-- RLS: Company members can SELECT, only service_role can INSERT (scheduled jobs)
-- No UPDATE or DELETE policies (append-only table)
```

### Team Tables

**subcontractors**
```sql
id uuid PK, company_id uuid FK, company_name text, trade_specialization trade_type,
contact_name text, email, phone, address, license_number, license_expiry date,
insurance_provider, insurance_expiry date, performance_rating numeric (0-5),
notes, is_active bool, created_at, updated_at
-- RLS: Members view, GC/PM manage
```

**team_invitations**
```sql
id uuid PK, company_id uuid FK, email text, name text, role user_role,
invitation_token uuid UNIQUE, invited_by uuid FK, invited_at,
expires_at (default +7 days), used_at, created_at, updated_at
-- RLS: GC Admin manage
```

### Chat Tables

**chat_rooms**
```sql
id uuid PK, company_id uuid FK, project_id uuid FK,
type text ('project'|'dm'), name, description, created_at, updated_at
-- Trigger: Auto-created when project created
-- RLS: Users view rooms they participate in
```

**chat_participants**
```sql
id uuid PK, chat_room_id uuid FK (CASCADE), user_id uuid FK,
role text ('admin'|'member'), last_read_at, muted_until, joined_at,
created_at, updated_at
UNIQUE(chat_room_id, user_id)
-- Trigger: Auto-managed with project_team
```

**messages**
```sql
id uuid PK, chat_room_id uuid FK (CASCADE), sender_id uuid FK,
content text, reply_to_id uuid FK, entity_references jsonb,
edited_at, deleted_at (soft delete), created_at, updated_at
-- Realtime: Enabled via supabase_realtime publication
-- Indexes: (chat_room_id, created_at DESC), (sender_id), (reply_to_id)
```

**message_reactions**
```sql
id uuid PK, message_id uuid FK (CASCADE), user_id uuid FK (CASCADE),
emoji text (1-10 chars), created_at
UNIQUE(message_id, user_id, emoji)
```

**message_attachments**
```sql
id uuid PK, message_id uuid FK (CASCADE), file_name, file_url, file_type,
file_size int (max 10MB), thumbnail_url, created_at, updated_at
```

### File Management Tables

**project_files**
```sql
id uuid PK, company_id uuid FK, project_id uuid FK, uploaded_by uuid FK,
filename text, original_filename text, file_url text (Vercel Blob),
file_size bigint, file_type text (MIME type),
category document_category DEFAULT 'general', tags text[],
client_visible bool DEFAULT false,
version_number int DEFAULT 1, parent_file_id uuid FK (version chain),
metadata jsonb (SHA-256 hash, custom data),
deleted_at timestamptz (soft delete), created_at, updated_at
-- Trigger: Auto-update updated_at on changes
-- Indexes: (project_id), (project_id, category), (uploaded_by), (parent_file_id), (company_id)
-- RLS: Company members view/upload, own files editable/deletable, GC/PM can manage all
-- Versioning: parent_file_id links to previous version for history chain
-- ⚠️ CROSS-SCHEMA: uploaded_by → next_auth.users (can't auto-join via PostgREST)
```

**project_photos**
```sql
id uuid PK, company_id uuid FK, project_id uuid FK, uploaded_by uuid FK,
filename text, photo_url text (Vercel Blob), thumbnail_url text (300x300px),
file_size bigint,
category photo_category DEFAULT 'general', tags text[],
exif_data jsonb (timestamp, camera: {make, model}, gps: {latitude, longitude}, exposure: {focalLength, fNumber, iso}),
client_visible bool DEFAULT false,
deleted_at timestamptz (soft delete), created_at
-- Indexes: (project_id), (project_id, category), (uploaded_by), (company_id)
-- RLS: Company members view/upload, own photos editable/deletable, GC/PM can manage all
-- EXIF: Automatically extracted from JPEG/PNG metadata on upload
-- ⚠️ CROSS-SCHEMA: uploaded_by → next_auth.users (can't auto-join via PostgREST)
```

**file_audit_log**
```sql
id uuid PK, company_id uuid FK,
file_id uuid (references project_files OR project_photos),
file_type text ('document'|'photo'), action text ('upload'|'delete'|'version_update'|'category_change'),
performed_by uuid FK, previous_state jsonb (JSON snapshot before), new_state jsonb (JSON snapshot after),
created_at timestamptz
-- Immutable: No UPDATE/DELETE policies (append-only)
-- Indexes: (file_id, file_type), (created_at DESC), (company_id)
-- RLS: Company members view, system inserts (no direct INSERT by users)
-- Purpose: 7-year compliance audit trail for construction documentation
```

### System Tables

**notifications**
```sql
id uuid PK, user_id uuid FK, type notification_type, title, message,
link, read bool, read_at, created_at
-- RLS: Users view/update own only
```

**attachments**
```sql
id uuid PK, entity_type attachment_entity_type, entity_id uuid,
file_name, file_url, file_type, file_size int,
uploaded_by uuid FK, created_at
```

**push_subscriptions**
```sql
id uuid PK, user_id uuid FK, endpoint, platform ('web'|'ios'|'android'),
p256dh_key, auth_key, user_agent, last_used_at, created_at, updated_at
-- FCM tokens for push notifications
-- RLS: Users manage own only
```

**stripe_customers**
```sql
id uuid PK, user_id uuid FK, stripe_customer_id text UNIQUE,
plan_active bool, plan_expires bigint, subscription_id, created_at, updated_at
-- RLS: Users view own only
```

**kakao_connections**
```sql
id uuid PK, user_id uuid FK UNIQUE, kakao_user_id, sendbird_user_id,
two_way_sync bool, connected_at, disconnected_at,
access_token, refresh_token, created_at, updated_at
-- KakaoTalk/Sendbird integration
-- RLS: Users manage own only
```

### 3D Spatial Tables

**projects_3d_models**
```sql
id uuid PK, project_id uuid FK, version int, name, description,
model_type ('ifc'|'obj'|'gltf'), xkt_file_url text, glb_file_url text,
ifc_file_url text, file_size_bytes bigint,
lod_level ('lod100'|'lod200'|'lod300'|'lod400'|'lod500'),
is_active bool (only one per project), bounds jsonb, floors jsonb,
processing_status ('pending'|'processing'|'ready'|'failed'),
uploaded_by uuid FK, is_default bool, default_model_id uuid FK,
created_at, updated_at
-- UNIQUE(project_id, version)
-- is_default: true if created from default_3d_models template
```

**default_3d_models**
```sql
id uuid PK, project_type enum, name text, description,
model_id text (e.g., 'default-residential-layout'),
xkt_file_url text, thumbnail_url text, is_active bool,
metadata jsonb, created_at, updated_at
-- System-wide default models for each project type
-- UNIQUE(project_type) WHERE is_active = true
-- Used when user creates new project with no uploaded model
```

**spatial_markers**
```sql
id uuid PK, project_id uuid FK, model_id uuid FK, title, description,
type spatial_marker_type, -- 'issue'|'note'|'photo'|'inspection'|'rfi'|'safety'|'material'|'progress'
position_x numeric, position_y numeric, position_z numeric,
normal_x numeric, normal_y numeric, normal_z numeric,
element_id text, element_name text, phase_id uuid FK,
task_id uuid FK, status spatial_marker_status, -- 'open'|'in_progress'|'resolved'|'closed'
cluster_id uuid, content_count int, created_by uuid FK,
resolved_at, created_at, updated_at
-- NOTE: No assigned_to column - use linked task for assignment
```

**marker_content**
```sql
id uuid PK, marker_id uuid FK (CASCADE),
type text, -- 'photo'|'file'|'note'
file_url text, file_name text, file_size_bytes bigint, file_mime_type text,
photo_url text, photo_thumbnail_url text, photo_width int, photo_height int, photo_exif jsonb,
note_text text,
created_by uuid FK, created_at
-- NOTE: Use 'type' not 'content_type', use 'note_text' not 'text_content'
```

**model_elements**
```sql
id uuid PK, model_id uuid FK (CASCADE), ifc_guid, element_type, element_name,
level, category, properties jsonb, geometry_data jsonb,
bounding_box jsonb, created_at, updated_at
UNIQUE(model_id, ifc_guid)
```

---

## RLS Patterns

### Company-Scoped Access
```sql
-- Users can only access data from their company
CREATE POLICY "policy_name" ON table_name FOR SELECT
USING (company_id = get_user_company_id(next_auth.uid()));
```

### Role-Based Access
```sql
-- Only GC Admin/PM can modify
CREATE POLICY "policy_name" ON table_name FOR UPDATE
USING (is_user_gc_admin(next_auth.uid()) AND company_id = get_user_company_id(next_auth.uid()));
```

### Owner-Based Access
```sql
-- Users can modify their own records
CREATE POLICY "policy_name" ON user_profiles FOR UPDATE
USING (id = next_auth.uid());
```

### RLS Summary Table

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

```sql
-- Get current user UUID from JWT
next_auth.uid() RETURNS uuid

-- Get user's company_id
get_user_company_id(p_user_id uuid) RETURNS uuid

-- Check if user is GC Admin
is_user_gc_admin(p_user_id uuid) RETURNS boolean

-- Project material/expense summary
get_project_material_summary(project_uuid uuid)
RETURNS TABLE (total_materials_cost, materials_needed_count, ...)

-- Team member project counts
get_team_member_project_counts(p_company_id uuid)
RETURNS TABLE (user_id, project_count)

-- Top team members by completed tasks
get_top_team_members_by_completed_tasks(p_company_id uuid, limit_count int)
RETURNS TABLE (id, name, avatar_url, completed_tasks)

-- Unread message count
get_unread_count(p_chat_room_id uuid, p_user_id uuid) RETURNS bigint

-- Find existing DM room
find_dm_room(user_id_1 uuid, user_id_2 uuid) RETURNS uuid
```

---

## Database Triggers

| Trigger | Target | Effect |
|---------|--------|--------|
| `update_updated_at_column` | All tables | Auto-updates `updated_at` |
| `create_default_project_phases` | projects | Creates 5 default phases on insert |
| `set_task_completed_at` | tasks | Sets/clears `completed_at` on status change |
| `update_phase_completion` | tasks | Updates phase completion % |
| `update_project_completion` | project_phases | Updates project completion % |
| `update_task_costs` | material_assignments, expenses | Updates task.actual_cost (read-only) |
| `create_project_chat_room` | projects | Creates chat room on project insert |
| `add_chat_participant_on_team_join` | project_team | Adds user to chat on team join |
| `remove_chat_participant_on_team_leave` | project_team | Removes user from chat on team leave |

---

## Common Queries

### User's Projects with Stats
```sql
SELECT p.*,
  (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
  (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed
FROM projects p
WHERE company_id = get_user_company_id(next_auth.uid())
ORDER BY created_at DESC;
```

### Task with Related Data
```sql
SELECT t.*,
  up.name as assignee_name, up.avatar_url as assignee_avatar,
  pp.name as phase_name, p.name as project_name
FROM tasks t
LEFT JOIN user_profiles up ON t.assignee_id = up.id
LEFT JOIN project_phases pp ON t.phase_id = pp.id
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.id = $1;
```

### Team Members with Roles
```sql
SELECT cu.*, up.name, up.email, up.avatar_url,
  (SELECT COUNT(*) FROM project_team WHERE user_id = cu.user_id) as project_count
FROM company_users cu
LEFT JOIN user_profiles up ON cu.user_id = up.id
WHERE cu.company_id = $1 AND cu.status = 'active'
ORDER BY cu.role, up.name;
```

### Project Budget Summary
```sql
SELECT p.budget,
  COALESCE(SUM(ma.total_cost), 0) as materials_cost,
  COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) as expenses_cost
FROM projects p
LEFT JOIN material_assignments ma ON ma.project_id = p.id
LEFT JOIN expenses e ON e.project_id = p.id
WHERE p.id = $1
GROUP BY p.id, p.budget;
```

**CRITICAL**: Always run `generate_typescript_types` after schema changes.

---

## Relationships

```
companies
├─ company_users ─ next_auth.users ─ user_profiles
├─ projects
│  ├─ project_phases
│  ├─ project_team ─ subcontractors
│  ├─ tasks
│  │  ├─ task_dependencies
│  │  ├─ task_activity
│  │  └─ material_assignments ─ materials
│  ├─ expenses ─ expense_line_items
│  ├─ chat_rooms
│  │  ├─ chat_participants
│  │  └─ messages
│  │     ├─ message_reactions
│  │     └─ message_attachments
│  └─ projects_3d_models
│     ├─ spatial_markers ─ marker_content
│     └─ model_elements
├─ subcontractors
├─ materials
└─ team_invitations
```

---

## Common Gotchas

### Cross-Schema Joins (PostgREST Limitation)

Tables with `uploaded_by` or `created_by` referencing `next_auth.users` **cannot use auto-join syntax**:

```typescript
// ❌ WRONG - Will fail with "Could not find relationship" error
.from('project_files')
.select(`*, uploader:uploaded_by (id, name, avatar_url)`)

// ✅ CORRECT - Select raw data, fetch user details separately
.from('project_files')
.select('*')
```

**Affected tables:** `project_files`, `project_photos`, `spatial_markers`, `marker_content`

### Spatial Marker Field Names

```typescript
// ❌ WRONG (old names)
marker.marker_type    // Use: marker.type
marker.position.x     // Use: marker.position_x
marker.assigned_to    // REMOVED - use linked task

// ❌ WRONG (marker_content old names)
content.content_type  // Use: content.type
content.text_content  // Use: content.note_text
content.url           // Use: content.file_url or content.photo_url
content.uploaded_by   // Use: content.created_by

// ✅ CORRECT field names
marker.type           // spatial_marker_type enum
marker.status         // spatial_marker_status enum
marker.position_x, marker.position_y, marker.position_z
content.type, content.note_text, content.file_url, content.photo_url
```

### Task Priority Enum

```typescript
// ✅ All valid values (includes 'critical')
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
```

### Null vs Undefined

Database returns `null`, but TypeScript function params often expect `undefined`:

```typescript
// ❌ WRONG - Type error
createTask({ description: row.description }) // null not assignable to undefined

// ✅ CORRECT - Convert null to undefined
createTask({ description: row.description ?? undefined })
```
