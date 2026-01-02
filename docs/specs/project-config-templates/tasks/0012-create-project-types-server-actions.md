# Task 2.1: Create project-types.ts server actions

## Objective
Implement CRUD server actions for project type management with proper validation and authorization.

## References
- Requirements §1 (Project Type Management)
- Design API section

## Implementation Details

### Files to Create
- `app/actions/project-types.ts`

### Server Actions

**1. getProjectTypes()**
- Returns all project types for user's company
- Include count of projects using each type
- Order by `order_index`

**2. createProjectType(formData: FormData)**
- Zod schema: name (required), description, icon_name, color
- Assigns next `order_index` automatically
- Enforces gc_admin role
- Validates company_id from user context
- Returns created project type or error

**3. updateProjectType(id: string, formData: FormData)**
- Zod schema: same as create
- Enforces gc_admin role and company ownership
- Returns updated project type or error

**4. deleteProjectType(id: string)**
- Checks if project type is in use (count projects)
- If in use, return error: "Cannot delete: X projects use this type"
- Enforces gc_admin role
- Deletes project type (cascades to phases and tasks)
- Returns success or error

### Helper Functions
- `getUserContext()` - Gets user, company_id, role from session

### Common Patterns
- All actions use `'use server'` directive
- All actions call `revalidatePath('/app/settings')`
- All actions use Zod for validation
- All actions return `{ success: boolean, data?: any, error?: string }`

## Acceptance Criteria
- ✅ All 4 CRUD operations implemented
- ✅ Zod validation enforced
- ✅ gc_admin role check enforced
- ✅ Non-admins get permission denied error
- ✅ Delete checks for usage before allowing
- ✅ Path revalidation works
- ✅ TypeScript types are correct

## Code Template

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createProjectTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon_name: z.string().optional(),
  color: z.string().optional(),
});

export async function getProjectTypes() {
  // Implementation
}

export async function createProjectType(formData: FormData) {
  // Implementation
}

export async function updateProjectType(id: string, formData: FormData) {
  // Implementation
}

export async function deleteProjectType(id: string) {
  // Implementation
}
```
