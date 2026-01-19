# GenHub Enums Index

> Auto-generated from database.types.ts. Do not edit manually.

Last updated: 2026-01-19

---

## Database Enums

### User

```sql
user_role: admin | project_manager | foreman | field_worker | subcontractor | client
member_status: active | invited | inactive
```

### Project

```sql
project_status: active | on_hold | completed | archived | planning | in_progress
phase_status: not_started | in_progress | completed | on_hold
```

### Task

```sql
task_status: todo | in_progress | review | blocked | completed
task_priority: low | medium | high | critical
task_type: work | purchase | approval | admin
approval_status: pending | approved | rejected | revision_requested
activity_action: created | updated | deleted | status_changed | assigned | commented | attachment_added | attachment_removed
```

### Material

```sql
material_category: lumber | concrete | electrical | plumbing | hvac | roofing | flooring | paint | hardware | tools | fixtures | insulation | drywall | doors_windows | landscaping | other
procurement_status: needed | ordered | delivered | installed
purchaser_type: gc | pm | subcontractor
```

### Expense

```sql
expense_category: materials | labor | equipment | permits | transportation | meals | lodging | other
expense_status: submitted | under_review | approved | rejected | paid
```

### File

```sql
document_category: contracts | permits | drawings | reports | financial | safety | meeting_notes | specifications | general
photo_category: site_progress | safety_documentation | permits_approvals | inspection_reports | material_receipts | change_orders | defects_issues | before_after | task_receipts | expense_receipts | general
```

### Spatial

```sql
spatial_marker_type: issue | note | photo | inspection | rfi | safety | material | progress
spatial_marker_status: open | in_progress | resolved | closed
```

---

## Summary

| Category | Enum Count |
|----------|------------|
| User | 2 |
| Project | 2 |
| Task | 5 |
| Material | 3 |
| Expense | 2 |
| File | 2 |
| Spatial | 2 |
| **Total** | 25 |
