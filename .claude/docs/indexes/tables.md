# GenHub Tables Index

> Auto-generated. Do not edit manually.

Last updated: 2026-01-12

---

## Quick Lookup by Domain

### Core
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| companies | 9 | ✓ | Companies |
| user_profiles | 7 | ✓ | User Profiles |
| company_users | 11 | ✓ | Company Users |
| owners | 7 | ✓ | Owners |
| admin_invitations | 10 | ✓ | Admin Invitations |

### Projects
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| projects | 26 | ✓ | Projects |
| project_team | 7 | ✓ | Project Team |
| project_phases | 11 | ✓ | Project Phases |
| project_type_configs | 11 | ✓ | Project Type Configs |
| project_files | 18 | ✓ | Project Files |
| project_photos | 14 | ✓ | Project Photos |

### Tasks
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| tasks | 24 | ✓ | Tasks |
| task_assignees | 8 | ✓ | Task Assignees |
| task_dependencies | 4 | ✓ | Task Dependencies |
| task_activity | 7 | ✓ | Task Activity |
| task_type_configs | 10 | ✓ | Task Type Configs |
| task_templates | 12 | ✓ | Task Templates |

### Materials
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| materials | 19 | ✓ | Materials |
| material_assignments | 20 | ✓ | Material Assignments |
| tracked_materials | 7 | ✓ | Tracked Materials |
| material_price_history | 7 | ✓ | Material Price History |

### Expenses
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| expenses | 22 | ✓ | Expenses |
| expense_line_items | 14 | ✓ | Expense Line Items |

### Spatial
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| spatial_markers | 30 | ✓ | Spatial Markers |
| marker_content | 19 | ✓ | Marker Content |
| projects_3d_models | 21 | ✓ | Projects 3D Models |
| model_elements | 13 | ✓ | Model Elements |
| default_3d_models | 17 | ✓ | Default 3D Models |
| company_default_models | 7 | ✓ | Company Default Models |
| default_marker_configs | 19 | ✓ | Default Marker Configs |

### Team
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| team_invitations | 11 | ✓ | Team Invitations |
| subcontractors | 17 | ✓ | Subcontractors |

### Chat
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| chat_rooms | 8 | ✓ | Chat Rooms |
| chat_participants | 9 | ✓ | Chat Participants |
| messages | 10 | ✓ | Messages |
| message_reactions | 5 | ✓ | Message Reactions |
| message_attachments | 9 | ✓ | Message Attachments |

### Templates
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| phase_templates | 9 | ✓ | Phase Templates |

### Integrations
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| kakao_connections | 11 | ✓ | Kakao Connections |
| stripe_customers | 8 | ✓ | Stripe Customers |
| push_subscriptions | 10 | ✓ | Push Subscriptions |

### System
| Table | Columns | RLS | Description |
|-------|---------|-----|-------------|
| attachments | 8 | ✓ | Attachments |
| notifications | 8 | ✓ | Notifications |
| file_audit_log | 9 | ✓ | File Audit Log |

---

## All Tables (Alphabetical)

| Table | Schema | Columns | RLS | Rows |
|-------|--------|---------|-----|------|
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
| task_assignees | public | 8 | ✓ | 8 |
| task_dependencies | public | 4 | ✓ | 0 |
| task_templates | public | 12 | ✓ | 218 |
| task_type_configs | public | 10 | ✓ | 8 |
| tasks | public | 24 | ✓ | 187 |
| team_invitations | public | 11 | ✓ | 0 |
| tracked_materials | public | 7 | ✓ | 2 |
| user_profiles | public | 7 | ✓ | 2 |

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tables | 44 |
| RLS Enabled | 44 |
| Total Columns | 543 |
