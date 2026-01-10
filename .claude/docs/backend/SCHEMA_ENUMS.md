# Database Enums Reference

> All PostgreSQL enum types used in GenHub

Last updated: 2026-01-09

---

## Project Enums

### project_status
```sql
CREATE TYPE public.project_status AS ENUM (
  'active',
  'on_hold',
  'completed',
  'archived'
);
```
**Used in:** projects.status

### project_phase
```sql
CREATE TYPE public.project_phase AS ENUM (
  'initiation',
  'planning',
  'execution',
  'monitoring',
  'closing'
);
```
**Used in:** projects.current_phase, phases.phase_type

---

## Task Enums

### task_status
```sql
CREATE TYPE public.task_status AS ENUM (
  'todo',
  'in_progress',
  'blocked',
  'done'
);
```
**Used in:** tasks.status

### task_priority
```sql
CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);
```
**Used in:** tasks.priority

---

## Material Enums

### material_status
```sql
CREATE TYPE public.material_status AS ENUM (
  'needed',
  'ordered',
  'delivered',
  'installed'
);
```
**Used in:** materials.status

---

## Expense Enums

### expense_status
```sql
CREATE TYPE public.expense_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'paid'
);
```
**Used in:** expenses.status

### expense_category
```sql
CREATE TYPE public.expense_category AS ENUM (
  'materials',
  'labor',
  'equipment',
  'permits',
  'transportation',
  'other'
);
```
**Used in:** expenses.category

---

## Spatial Enums

### marker_type
```sql
CREATE TYPE public.marker_type AS ENUM (
  'issue',
  'note',
  'measurement',
  'photo',
  'task'
);
```
**Used in:** spatial_markers.marker_type

### marker_status
```sql
CREATE TYPE public.marker_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);
```
**Used in:** spatial_markers.status

### marker_priority
```sql
CREATE TYPE public.marker_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);
```
**Used in:** spatial_markers.priority

### model_status
```sql
CREATE TYPE public.model_status AS ENUM (
  'uploading',
  'processing',
  'ready',
  'error'
);
```
**Used in:** ifc_models.status

---

## User/Team Enums

### user_role
```sql
CREATE TYPE public.user_role AS ENUM (
  'owner',
  'admin',
  'manager',
  'member',
  'viewer'
);
```
**Used in:** company_users.role

### invite_status
```sql
CREATE TYPE public.invite_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'revoked'
);
```
**Used in:** company_invites.status

---

## Bid Enums

### bid_status
```sql
CREATE TYPE public.bid_status AS ENUM (
  'draft',
  'published',
  'closed',
  'awarded'
);
```
**Used in:** bid_packages.status

### bid_response_status
```sql
CREATE TYPE public.bid_response_status AS ENUM (
  'pending',
  'submitted',
  'awarded',
  'rejected'
);
```
**Used in:** bid_responses.status

---

## Adding New Enums

### Migration Pattern
```sql
-- Create enum
CREATE TYPE public.new_enum AS ENUM ('value1', 'value2', 'value3');

-- Use in table
ALTER TABLE public.table_name
ADD COLUMN column_name new_enum DEFAULT 'value1';
```

### Adding Values to Existing Enum
```sql
ALTER TYPE public.task_status ADD VALUE 'cancelled';
```

### TypeScript Usage
After creating enum, regenerate types:
```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

Access in code:
```typescript
import { Database } from '@/types/database.types'

type TaskStatus = Database['public']['Enums']['task_status']
// 'todo' | 'in_progress' | 'blocked' | 'done'
```

---

## See Also

- `docs/indexes/enums.md` - Quick enum lookup
- `skills/database/enums.md` - Enum management skill
- `docs/backend/SCHEMA_CORE.md` - Core table schemas
