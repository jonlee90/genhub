# Task 1.11: Generate TypeScript types

## Objective
Update TypeScript types for all new database tables.

## References
- All database tables created in Phase 1

## Implementation Details

### MCP Supabase Command
Run: `mcp__supabase__generate_typescript_types`

### Files to Modify
- `types/database.types.ts` (auto-generated)

### Expected Types

The following interfaces should be present in `Database['public']['Tables']`:

- `project_type_configs`
- `task_type_configs`
- `phase_templates`
- `task_templates`

Each should have:
- `Row` - Full row type
- `Insert` - Insert type (optional fields marked as such)
- `Update` - Update type (all fields optional)

## Acceptance Criteria
- ✅ Types generated successfully
- ✅ `types/database.types.ts` updated
- ✅ All 4 new tables have type definitions
- ✅ Types match database schema exactly
- ✅ No TypeScript compilation errors

## Verification

After generation, verify types exist:

```typescript
import { Database } from '@/types/database.types';

type ProjectTypeConfig = Database['public']['Tables']['project_type_configs']['Row'];
type TaskTypeConfig = Database['public']['Tables']['task_type_configs']['Row'];
type PhaseTemplate = Database['public']['Tables']['phase_templates']['Row'];
type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];
```
