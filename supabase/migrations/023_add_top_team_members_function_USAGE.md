# get_top_team_members_by_completed_tasks Function

## Purpose
Returns the top team members who have completed the most tasks for a given company. Used in the Tasks Dashboard Stats feature.

## Function Signature
```sql
get_top_team_members_by_completed_tasks(
  p_company_id uuid,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  completed_tasks bigint
)
```

## Parameters
- `p_company_id` (uuid, required) - The company ID to filter team members
- `limit_count` (integer, optional, default: 5) - Maximum number of team members to return

## Return Columns
- `id` - User profile ID
- `name` - Team member name
- `avatar_url` - Team member avatar URL (can be null)
- `completed_tasks` - Count of completed tasks

## Security
- Function has `SECURITY DEFINER` with `SET search_path = public`
- Granted to `authenticated` role only
- Ensures only active company members are included
- Results are ordered by completed tasks count (descending)

## Usage Examples

### Server Action (TypeScript)
```typescript
import { createClient } from '@/utils/supabase/server'

export async function getTopTeamMembers(companyId: string, limit = 5) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_top_team_members_by_completed_tasks',
    {
      p_company_id: companyId,
      limit_count: limit
    }
  )

  if (error) {
    console.error('[getTopTeamMembers] Error:', error)
    return { error: error.message }
  }

  return { data }
}
```

### Direct SQL Query
```sql
-- Get top 5 team members (default)
SELECT * FROM get_top_team_members_by_completed_tasks(
  '123e4567-e89b-12d3-a456-426614174000'::uuid
);

-- Get top 10 team members
SELECT * FROM get_top_team_members_by_completed_tasks(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  10
);
```

### Example Response
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "John Doe",
    "avatar_url": "https://example.com/avatars/john.jpg",
    "completed_tasks": 42
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "Jane Smith",
    "avatar_url": null,
    "completed_tasks": 38
  }
]
```

## Performance Notes
- Uses INNER JOINs to ensure only valid, active team members are included
- Indexed on foreign keys: `user_profiles.id`, `company_users.user_id`, `tasks.assignee_id`, `projects.id`
- Function is marked as `STABLE` (can be cached within a query)
- Efficient for companies with < 10,000 team members and < 100,000 completed tasks

## Related Tables
- `user_profiles` - User profile data
- `company_users` - Company membership and status
- `tasks` - Task records
- `projects` - Project association

## Migration
Applied in: `023_add_top_team_members_function.sql`
Created: 2025-12-28
