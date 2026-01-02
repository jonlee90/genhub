# Task 2.3: Create phase-templates.ts server actions

## Objective
Implement CRUD server actions for phase template management with reordering support.

## References
- Requirements §3 (Phase Template Management)
- Design API section

## Implementation Details

### Files to Create
- `app/actions/phase-templates.ts`

### Server Actions

**1. getPhaseTemplates(projectTypeConfigId?: string)**
- If projectTypeConfigId provided, filter by that type
- Otherwise, return all for user's company
- Include nested task_templates for each phase
- Order by `order_index`

**2. createPhaseTemplate(formData: FormData)**
- Zod schema: project_type_config_id (required), name, description
- Auto-assign `order_index` (max + 1)
- Enforces gc_admin role
- Returns created phase or error

**3. updatePhaseTemplate(id: string, formData: FormData)**
- Zod schema: name, description
- Enforces gc_admin role
- Returns updated phase or error

**4. deletePhaseTemplate(id: string)**
- Deletes phase template
- Cascades to task templates (ON DELETE CASCADE)
- Enforces gc_admin role
- Returns success or error

**5. reorderPhaseTemplates(projectTypeConfigId: string, orderedIds: string[])**
- Updates `order_index` for each phase based on array position
- Enforces gc_admin role
- Returns success or error

## Acceptance Criteria
- ✅ All CRUD + reordering operations implemented
- ✅ Nested task templates loaded with getPhaseTemplates()
- ✅ Reordering persists to database
- ✅ Cascading delete works (deletes task templates)
- ✅ gc_admin role enforced
- ✅ Path revalidation works

## Code Template

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const phaseTemplateSchema = z.object({
  project_type_config_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function getPhaseTemplates(projectTypeConfigId?: string) {
  // Load phases with nested task_templates
}

export async function createPhaseTemplate(formData: FormData) {
  // Auto-assign order_index
}

export async function updatePhaseTemplate(id: string, formData: FormData) {
  // Implementation
}

export async function deletePhaseTemplate(id: string) {
  // Cascading delete
}

export async function reorderPhaseTemplates(
  projectTypeConfigId: string,
  orderedIds: string[]
) {
  // Update order_index for each phase
}
```
