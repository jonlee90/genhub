# Task 2.4: Create task-templates.ts server actions

## Objective
Implement CRUD server actions for task template management with reordering support.

## References
- Requirements §4 (Task Template Management)
- Design API section

## Implementation Details

### Files to Create
- `app/actions/task-templates.ts`

### Server Actions

**1. getTaskTemplates(phaseTemplateId?: string)**
- If phaseTemplateId provided, filter by that phase
- Otherwise, return all for user's company
- Order by `order_index`

**2. createTaskTemplate(formData: FormData)**
- Zod schema: phase_template_id, title, description, default_task_type, default_priority
- Auto-assign `order_index` (max + 1)
- Enforces gc_admin role
- Returns created task or error

**3. updateTaskTemplate(id: string, formData: FormData)**
- Zod schema: title, description, default_task_type, default_priority
- Enforces gc_admin role
- Returns updated task or error

**4. deleteTaskTemplate(id: string)**
- Deletes task template
- Enforces gc_admin role
- Returns success or error

**5. reorderTaskTemplates(phaseTemplateId: string, orderedIds: string[])**
- Updates `order_index` for each task based on array position
- Enforces gc_admin role
- Returns success or error

## Acceptance Criteria
- ✅ All CRUD + reordering operations implemented
- ✅ Reordering persists to database
- ✅ gc_admin role enforced
- ✅ Path revalidation works

## Code Template

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const taskTemplateSchema = z.object({
  phase_template_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  default_task_type: z.string().optional(),
  default_priority: z.enum(['low', 'medium', 'high']).optional(),
});

export async function getTaskTemplates(phaseTemplateId?: string) {
  // Implementation
}

export async function createTaskTemplate(formData: FormData) {
  // Auto-assign order_index
}

export async function updateTaskTemplate(id: string, formData: FormData) {
  // Implementation
}

export async function deleteTaskTemplate(id: string) {
  // Implementation
}

export async function reorderTaskTemplates(
  phaseTemplateId: string,
  orderedIds: string[]
) {
  // Update order_index
}
```
