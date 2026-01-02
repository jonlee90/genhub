# Task 2.2: Create task-types.ts server actions

## Objective
Implement CRUD server actions for task type management with soft delete support.

## References
- Requirements §2 (Task Type Management)
- Design API section

## Implementation Details

### Files to Create
- `app/actions/task-types.ts`

### Server Actions

**1. getTaskTypes()**
- Returns all active task types for user's company
- Filter: `is_active = true`
- Order by `name`

**2. createTaskType(formData: FormData)**
- Zod schema: name (required), description, color, icon_name
- Enforces gc_admin role
- Returns created task type or error

**3. updateTaskType(id: string, formData: FormData)**
- Zod schema: same as create
- Cannot edit if `is_default = true`
- Enforces gc_admin role
- Returns updated task type or error

**4. deleteTaskType(id: string)**
- **Soft delete**: Sets `is_active = false` instead of deleting
- Preserves historical data (existing tasks keep their type)
- Enforces gc_admin role
- Returns success or error

## Acceptance Criteria
- ✅ All CRUD operations implemented
- ✅ Soft delete preserves historical data
- ✅ Default types cannot be edited
- ✅ Only active types returned in getTaskTypes()
- ✅ gc_admin role enforced
- ✅ Path revalidation works

## Code Template

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const taskTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  icon_name: z.string().optional(),
});

export async function getTaskTypes() {
  // Returns active task types only
}

export async function createTaskType(formData: FormData) {
  // Implementation
}

export async function updateTaskType(id: string, formData: FormData) {
  // Check is_default, reject if true
}

export async function deleteTaskType(id: string) {
  // Soft delete: UPDATE SET is_active = false
}
```
