# GenHub Tables Index

> Quick lookup for database tables. For full schema details, see `docs/law/DB_SCHEMA.md`

Last updated: 2026-01-10

---

## Quick Lookup

| Table | Purpose | Key FKs | RLS |
|-------|---------|---------|-----|
| companies | Company accounts | - | Yes |
| user_profiles | User info | → next_auth.users | Yes |
| company_users | Team membership | → companies, users | Yes |
| projects | Project management | → companies | Yes |
| project_phases | Phase tracking | → projects | Yes |
| project_team | Team assignments | → projects, users | Yes |
| tasks | Task tracking | → projects, phases | Yes |
| task_assignees | Multi-assignee junction | → tasks, users, subcontractors | Yes |
| task_dependencies | Task blocking | → tasks | Yes |
| task_activity | Task audit log | → tasks | Yes |
| materials | Material catalog | → companies | Yes |
| material_assignments | Task materials | → tasks, materials | Yes |
| tracked_materials | Material tracking | → materials | Yes |
| material_price_history | Price history | → tracked_materials | Yes |
| expenses | Expense tracking | → projects, tasks | Yes |
| expense_line_items | Expense details | → expenses, materials | Yes |
| subcontractors | Sub profiles | → companies | Yes |
| team_invitations | Team invites | → companies | Yes |
| chat_rooms | Chat rooms | → projects, companies | Yes |
| chat_participants | Room members | → chat_rooms, users | Yes |
| messages | Chat messages | → chat_rooms, users | Yes |
| message_reactions | Message reactions | → messages | Yes |
| message_attachments | Message files | → messages | Yes |
| project_files | Project documents | → projects, companies | Yes |
| project_photos | Project photos | → projects, companies | Yes |
| file_audit_log | File audit | → project_files | Yes |
| notifications | User notifications | → users | Yes |
| attachments | Generic attachments | → entities | Yes |
| push_subscriptions | Push tokens | → users | Yes |
| kakao_connections | KakaoTalk links | → users | Yes |
| stripe_customers | Billing | → users | Yes |
| owners | Platform owners | → user_profiles | Yes |
| admin_invitations | Admin invites | → companies | Yes |
| projects_3d_models | Project models | → projects | Yes |
| default_3d_models | Default models | - | Yes |
| company_default_models | Company models | → default_3d_models | Yes |
| default_marker_configs | Marker defaults | → default_3d_models | Yes |
| spatial_markers | 3D markers | → projects_3d_models | Yes |
| marker_content | Marker details | → spatial_markers | Yes |
| model_elements | Model parts | → projects_3d_models | Yes |

---

## By Category

### Core
- `companies` - Company accounts
- `user_profiles` - User info (extends next_auth.users)
- `company_users` - Team membership, roles

### Projects
- `projects` - Project records
- `project_phases` - 5 default phases per project
- `project_team` - Project member assignments

### Tasks
- `tasks` - Task records with status/priority
- `task_assignees` - Multi-assignee junction (users + subcontractors)
- `task_dependencies` - Blocking relationships
- `task_activity` - Audit log

### Materials & Expenses
- `materials` - Material catalog
- `material_assignments` - Materials linked to tasks
- `tracked_materials` - Active material tracking
- `material_price_history` - Price tracking
- `expenses` - Expense records
- `expense_line_items` - Expense breakdowns

### Team
- `subcontractors` - Subcontractor profiles
- `team_invitations` - Pending invites

### Chat
- `chat_rooms` - Chat rooms (project/company/DM)
- `chat_participants` - Room membership
- `messages` - Chat messages
- `message_reactions` - Emoji reactions
- `message_attachments` - File attachments

### Files
- `project_files` - Documents with versioning
- `project_photos` - Photos with categories
- `file_audit_log` - File access audit

### 3D Spatial
- `projects_3d_models` - Project-specific 3D models
- `default_3d_models` - System-wide default models
- `company_default_models` - Company's default model picks
- `default_marker_configs` - Default marker configuration
- `spatial_markers` - 3D markers on models
- `marker_content` - Marker rich content
- `model_elements` - Named model parts

### System
- `notifications` - User notifications
- `attachments` - Generic file attachments
- `push_subscriptions` - FCM tokens
- `kakao_connections` - KakaoTalk integration
- `stripe_customers` - Stripe billing

### Owner/Admin
- `owners` - Platform owner accounts (super-admins)
- `admin_invitations` - Pending admin invitations to companies

---

## Stats

- **Total tables**: 44
- **Tables with RLS**: 44/44 (100%)
- **Tables with triggers**: 12+
- **Tables in Realtime**: 5+ (messages, notifications, etc.)

---

## Key Relationships

```
companies
├── company_users → user_profiles
├── projects
│   ├── project_phases
│   ├── project_team
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
├── subcontractors
└── projects_3d_models → spatial_markers
```

---

## Common Patterns

### Company Isolation
All data scoped by `company_id` via RLS:
```sql
company_id = public.get_user_company_id(next_auth.uid())
```

### Project Access
Project-scoped data checks `project_team` membership:
```sql
EXISTS (SELECT 1 FROM project_team WHERE project_id = ... AND user_id = next_auth.uid())
```

---

## Deep Dive

For full schema details: `.claude/docs/law/DB_SCHEMA.md`
For RLS patterns: `.claude/skills/database/rls-patterns.md`
For creating tables: `.claude/skills/database/create-migration.md`
