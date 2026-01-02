# Task 2.5: Update phases.ts for project-level phase CRUD

## Objective
Extend existing phase actions to support project-level phase management for GC/PM users.

## References
- Requirements §5 (Phase CRUD within Projects)

## Implementation Details

### Files to Modify
- `app/actions/phases.ts`

### New Server Actions to Add

**1. createPhase(projectId: string, formData: FormData)**
- Zod schema: name, description
- Enforces gc_admin OR project_manager role
- Creates phase within specified project
- Auto-assigns `order_index`
- Returns created phase or error

**2. updatePhase(phaseId: string, formData: FormData)**
- Zod schema: name, description, order_index
- Enforces gc_admin OR project_manager role
- Returns updated phase or error

**3. deletePhase(phaseId: string, taskHandling: 'move' | 'delete', targetPhaseId?: string)**
- Deletes phase from project
- **taskHandling options:**
  - `'delete'`: Delete all tasks in this phase
  - `'move'`: Move tasks to targetPhaseId (must be provided)
- Enforces gc_admin OR project_manager role
- Returns success or error

### Authorization
- Check user role: must be `gc_admin` OR `project_manager`
- For project_manager, verify they have access to the project

## Acceptance Criteria
- ✅ createPhase() works for GC/PM users
- ✅ updatePhase() works for GC/PM users
- ✅ deletePhase() with task handling options works
- ✅ Metro Journey updates reflect phase changes
- ✅ Non-authorized users cannot manage phases
- ✅ Path revalidation works

## Code Template

```typescript
// Add to existing app/actions/phases.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createPhaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function createPhase(projectId: string, formData: FormData) {
  // Enforce gc_admin OR project_manager
  // Create phase in project
}

export async function updatePhase(phaseId: string, formData: FormData) {
  // Enforce gc_admin OR project_manager
  // Update phase
}

export async function deletePhase(
  phaseId: string,
  taskHandling: 'move' | 'delete',
  targetPhaseId?: string
) {
  // Enforce gc_admin OR project_manager
  // Handle tasks based on taskHandling option
  // Delete phase
}
```
