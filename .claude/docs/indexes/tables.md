# GenHub Tables Index

> Auto-generated. Do not edit manually.

Last updated: 2026-01-16 (sync: admin_invitations, owners)

---

## Quick Lookup by Domain

### Core
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| companies | 9 | ✓ | Company records |
| user_profiles | 7 | ✓ | Extended user profile data |
| company_users | 11 | ✓ | User-company associations with roles |
| owners | 7 | ✓ | Platform owners (super admin) |
| admin_invitations | 10 | ✓ | Pending admin invitations |

### Projects
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| projects | 26 | ✓ | Main projects table |
| project_team | 7 | ✓ | Project team member assignments |
| project_phases | 11 | ✓ | Project phases |
| project_type_configs | 11 | ✓ | Custom project type configurations |
| project_files | 18 | ✓ | Project file uploads |
| project_photos | 14 | ✓ | Project photo uploads |

### Tasks
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| tasks | 24 | ✓ | Main tasks table |
| task_assignees | 9 | ✓ | Task assignee relationships (many-to-many) |
| task_dependencies | 4 | ✓ | Task dependency relationships |
| task_activity | 7 | ✓ | Task activity log |
| task_type_configs | 10 | ✓ | Custom task type configurations |
| task_templates | 12 | ✓ | Task templates for phases |

### Materials
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| materials | 19 | ✓ | Company materials catalog |
| material_assignments | 20 | ✓ | Material-to-task assignments |
| tracked_materials | 7 | ✓ | Materials being tracked for price changes |
| material_price_history | 7 | ✓ | Historical price data for materials |

### Expenses
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| expenses | 22 | ✓ | Expense records |
| expense_line_items | 14 | ✓ | Line items for expenses |

### Spatial
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| spatial_markers | 30 | ✓ | 3D spatial markers on models |
| marker_content | 19 | ✓ | Content attached to markers (notes, photos) |
| projects_3d_models | 21 | ✓ | IFC/3D models for projects |
| model_elements | 13 | ✓ | Individual elements within 3D models |
| default_3d_models | 17 | ✓ | System default 3D models |
| company_default_models | 7 | ✓ | Company-specific default models |
| default_marker_configs | 19 | ✓ | Default marker configurations for models |

### Team
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| team_invitations | 11 | ✓ | Pending team invitations |
| subcontractors | 17 | ✓ | Subcontractor records |

### Chat
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| chat_rooms | 8 | ✓ | Chat room definitions |
| chat_participants | 9 | ✓ | Chat room participants |
| messages | 10 | ✓ | Chat messages |
| message_reactions | 5 | ✓ | Message reactions (emoji) |
| message_attachments | 9 | ✓ | File attachments to messages |

### Templates
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| phase_templates | 9 | ✓ | Phase templates for project types |

### Integrations
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| kakao_connections | 11 | ✓ | KakaoTalk integration settings |
| stripe_customers | 8 | ✓ | Stripe customer records |
| push_subscriptions | 10 | ✓ | Web push notification subscriptions |

### System
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| attachments | 8 | ✓ | Generic file attachments |
| notifications | 8 | ✓ | In-app notifications |
| file_audit_log | 9 | ✓ | File operation audit trail |

---

## All Tables (Alphabetical)

| Table | Schema | Columns | RLS | Rows (approx) |
|-------|--------|---------|-----|---------------|
| admin_invitations | public | 10 | ✓ | 1 |
| attachments | public | 8 | ✓ | 0 |
| chat_participants | public | 9 | ✓ | 3 |
| chat_rooms | public | 8 | ✓ | 21 |
| companies | public | 9 | ✓ | 1 |
| company_default_models | public | 7 | ✓ | 0 |
| company_users | public | 11 | ✓ | 2 |
| default_3d_models | public | 17 | ✓ | 5 |
| default_marker_configs | public | 19 | ✓ | 47 |
| expense_line_items | public | 14 | ✓ | 0 |
| expenses | public | 22 | ✓ | 1 |
| file_audit_log | public | 9 | ✓ | 2 |
| kakao_connections | public | 11 | ✓ | 0 |
| marker_content | public | 19 | ✓ | 0 |
| material_assignments | public | 20 | ✓ | 4 |
| material_price_history | public | 7 | ✓ | 0 |
| materials | public | 19 | ✓ | 7 |
| message_attachments | public | 9 | ✓ | 0 |
| message_reactions | public | 5 | ✓ | 0 |
| messages | public | 10 | ✓ | 10 |
| model_elements | public | 13 | ✓ | 0 |
| notifications | public | 8 | ✓ | 5 |
| owners | public | 7 | ✓ | 1 |
| phase_templates | public | 9 | ✓ | 50 |
| project_files | public | 18 | ✓ | 0 |
| project_phases | public | 11 | ✓ | 101 |
| project_photos | public | 14 | ✓ | 2 |
| project_team | public | 7 | ✓ | 2 |
| project_type_configs | public | 11 | ✓ | 10 |
| projects | public | 26 | ✓ | 20 |
| projects_3d_models | public | 21 | ✓ | 21 |
| push_subscriptions | public | 10 | ✓ | 0 |
| spatial_markers | public | 30 | ✓ | 88 |
| stripe_customers | public | 8 | ✓ | 0 |
| subcontractors | public | 17 | ✓ | 3 |
| task_activity | public | 7 | ✓ | 0 |
| task_assignees | public | 9 | ✓ | 8 |
| task_dependencies | public | 4 | ✓ | 0 |
| task_templates | public | 12 | ✓ | 218 |
| task_type_configs | public | 10 | ✓ | 8 |
| tasks | public | 24 | ✓ | 187 |
| team_invitations | public | 11 | ✓ | 0 |
| tracked_materials | public | 7 | ✓ | 2 |
| user_profiles | public | 7 | ✓ | 2 |

---

## Key Relationships

### Company Isolation
All `public` schema tables have `company_id` for multi-tenant isolation via RLS.

### Common Foreign Keys
- `company_id` → `companies(id)` - Multi-tenant isolation
- `project_id` → `projects(id)` - Project association
- `task_id` → `tasks(id)` - Task association
- `user_id` / `created_by` → `next_auth.users(id)` - User references

### Cross-Schema Limitations
**IMPORTANT**: PostgREST cannot join across schemas (`public` ↔ `next_auth`).
Affected tables:
- `project_files.uploaded_by` → `next_auth.users`
- `project_photos.uploaded_by` → `next_auth.users`
- `spatial_markers.created_by` → `next_auth.users`
- `marker_content.created_by` → `next_auth.users`

**Workaround**: Fetch user details separately or use `user_profiles` (public schema).

---

## Key Columns by Table

### companies
- `id` (uuid, pk)
- `name` (text)
- `subscription_status` (text)
- `subscription_tier` (text)

### projects
- `id` (uuid, pk)
- `company_id` (uuid, fk)
- `name` (text)
- `project_type` (text)
- `status` (project_status enum)
- `budget` (numeric)
- `start_date` (date)
- `end_date` (date)
- `address_*` (address fields)

### tasks
- `id` (uuid, pk)
- `company_id` (uuid, fk)
- `project_id` (uuid, fk)
- `phase_id` (uuid, fk)
- `title` (text)
- `status` (task_status enum)
- `priority` (task_priority enum)
- `task_type` (task_type enum)
- `start_date` (timestamptz)
- `due_date` (timestamptz)
- `estimated_hours` (numeric)

### task_assignees
- `task_id` (uuid, fk → tasks)
- `user_id` (uuid, fk → user_profiles, nullable)
- `subcontractor_id` (uuid, fk → subcontractors, nullable)
- `is_primary` (boolean) - Primary assignee flag
- CHECK: Either user_id OR subcontractor_id must be set (XOR)

### materials
- `id` (uuid, pk)
- `company_id` (uuid, fk)
- `name` (text)
- `sku` (text)
- `unit_price` (numeric)
- `category` (text)
- `home_depot_product_id` (text, nullable)

### material_assignments
- `id` (uuid, pk)
- `company_id` (uuid, fk)
- `material_id` (uuid, fk)
- `task_id` (uuid, fk)
- `project_id` (uuid, fk)
- `quantity_needed` (numeric)
- `quantity_ordered` (numeric)
- `quantity_delivered` (numeric)
- `status` (text)

### expenses
- `id` (uuid, pk)
- `company_id` (uuid, fk)
- `project_id` (uuid, fk)
- `task_id` (uuid, fk, nullable)
- `category` (expense_category enum)
- `status` (expense_status enum)
- `amount` (numeric)
- `vendor` (text)

### spatial_markers
- `id` (uuid, pk)
- `company_id` (uuid, fk)
- `project_id` (uuid, fk)
- `model_id` (uuid, fk)
- `marker_type` (text)
- `x, y, z` (numeric) - 3D coordinates
- `title` (text)
- `description` (text)
- `phase_id` (uuid, fk, nullable)

### chat_rooms
- `id` (uuid, pk)
- `company_id` (uuid, fk)
- `name` (text)
- `room_type` (text) - 'project', 'dm', 'group'
- `project_id` (uuid, fk, nullable)

### messages
- `id` (uuid, pk)
- `room_id` (uuid, fk)
- `sender_id` (uuid, fk → next_auth.users)
- `content` (text)
- `parent_message_id` (uuid, fk, nullable) - For threads

---

## Auth Schema (next_auth)

These tables are managed by NextAuth and should NOT be modified directly:

| Table | Purpose |
|-------|---------|
| users | User authentication records |
| accounts | OAuth provider accounts |
| sessions | Active user sessions |
| verification_tokens | Email verification tokens |

**Note**: RLS is NOT enabled on `next_auth` schema tables (auth managed by NextAuth).

---

## Enums Reference

See `.claude/docs/indexes/enums.md` for complete enum definitions.

Key enums:
- `task_status`: todo | in_progress | review | blocked | completed
- `task_priority`: low | medium | high | critical
- `task_type`: work | purchase | approval | admin
- `project_status`: active | on_hold | completed | archived
- `expense_status`: submitted | under_review | approved | rejected | paid
- `user_role`: admin | project_manager | foreman | field_worker | subcontractor | client

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tables (public) | 44 |
| Total Tables (next_auth) | 4 |
| RLS Enabled (public) | 44/44 (100%) |
| Total Columns | ~550 |

---

## See Also

- `.claude/docs/backend/SCHEMA_*.md` - Detailed schema documentation by domain
- `.claude/docs/indexes/enums.md` - Enum type definitions
- `.claude/docs/indexes/actions.md` - Server Actions reference
