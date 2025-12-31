# Chat Search Server Actions

## Overview

This module provides server-side search functionality for entity autocomplete in the GenHub chat system. It enables users to search and reference projects, tasks, materials, expenses, and other users via @mentions.

## Features

- **Entity Search**: Search across multiple entity types (projects, tasks, materials, expenses, users)
- **Company-Scoped**: All searches are automatically scoped to the user's company
- **Access Control**: Users can only search entities they have access to (via RLS)
- **Performance**: Results limited to 10 items, case-insensitive search
- **Type-Safe**: Full TypeScript support with Zod validation

## Server Actions

### searchProjects(query: string)

Search projects user has access to.

**Parameters:**
- `query` (string): Search query (1-100 characters, case-insensitive)

**Returns:**
```typescript
{
  success: true,
  results: ProjectSearchResult[] // Max 10 results
}
```

**Result Format:**
```typescript
{
  id: string;
  name: string;
  status: string;
  health_score: number;
}
```

**Example:**
```typescript
const result = await searchProjects('office renovation');
if (result.success) {
  result.results.forEach(project => {
    console.log(project.name, project.status);
  });
}
```

---

### searchTasks(query: string, projectId?: string | null)

Search tasks (optionally filtered by project).

**Parameters:**
- `query` (string): Search query (1-100 characters, case-insensitive)
- `projectId` (string, optional): Filter by project UUID

**Returns:**
```typescript
{
  success: true,
  results: TaskSearchResult[] // Max 10 results
}
```

**Result Format:**
```typescript
{
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  assignee_id: string | null;
  project_id: string;
}
```

**Examples:**
```typescript
// Search all tasks
const result = await searchTasks('install electrical');

// Search tasks in specific project
const result = await searchTasks('install', 'project-uuid-here');
```

---

### searchMaterials(query: string)

Search materials from company catalog.

**Parameters:**
- `query` (string): Search query (1-100 characters, case-insensitive)

**Returns:**
```typescript
{
  success: true,
  results: MaterialSearchResult[] // Max 10 results
}
```

**Result Format:**
```typescript
{
  id: string;
  product_name: string;
  unit_price: number;
  stock_status: string | null;
  product_image_url: string | null;
}
```

**Example:**
```typescript
const result = await searchMaterials('2x4 lumber');
if (result.success) {
  result.results.forEach(material => {
    console.log(material.product_name, `$${material.unit_price}`);
  });
}
```

---

### searchExpenses(query: string)

Search expenses (by description or vendor name).

**Parameters:**
- `query` (string): Search query (1-100 characters, case-insensitive)

**Returns:**
```typescript
{
  success: true,
  results: ExpenseSearchResult[] // Max 10 results
}
```

**Result Format:**
```typescript
{
  id: string;
  description: string;
  amount: number;
  status: string;
  vendor_name: string | null;
}
```

**Example:**
```typescript
const result = await searchExpenses('Home Depot');
if (result.success) {
  result.results.forEach(expense => {
    console.log(expense.description, `$${expense.amount}`);
  });
}
```

---

### searchUsers(query: string, roomId: string)

Search users in current chat room (by name or email).

**Parameters:**
- `query` (string): Search query (1-100 characters, case-insensitive)
- `roomId` (string): Chat room UUID

**Returns:**
```typescript
{
  success: true,
  results: UserSearchResult[] // Max 10 results
}
```

**Result Format:**
```typescript
{
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string; // 'admin' or 'member'
}
```

**Example:**
```typescript
const result = await searchUsers('john', 'chat-room-uuid');
if (result.success) {
  result.results.forEach(user => {
    console.log(user.name, user.email, user.role);
  });
}
```

---

## Entity Reference Parsing

The `sendMessage` action in `app/actions/chat.ts` has been enhanced to parse entity references from message content.

### Token Format

Entity references use the format: `@[type:id:displayName]`

**Examples:**
- Task: `@[task:uuid-here:Fix electrical issue]`
- Project: `@[project:uuid-here:Office Renovation]`
- Material: `@[material:uuid-here:2x4 Lumber]`
- Expense: `@[expense:uuid-here:Home Depot Receipt]`
- User: `@[user:uuid-here:John Doe]`

### Storage

Entity references are stored in the `messages.entity_references` JSONB column:

```json
[
  { "type": "task", "id": "uuid-here" },
  { "type": "user", "id": "uuid-here" }
]
```

### Mention Notifications

When a message contains `@[user:...]` references:
1. Entity references are parsed and stored in the message
2. A notification is created for each mentioned user (excluding self-mentions)
3. Notification type: `mention`
4. Notification includes link to the chat room

**Example:**
```typescript
const formData = new FormData();
formData.append('chatRoomId', 'room-uuid');
formData.append('content', 'Hey @[user:123:John], check @[task:456:Install HVAC]');
formData.append('entityReferences', JSON.stringify([
  { type: 'user', id: '123' },
  { type: 'task', id: '456' }
]));

const result = await sendMessage(formData);
// Result: Message sent, notification created for user 123
```

---

## Security

### Authentication

All search functions require authentication:
- User must have active NextAuth session
- User must have active company membership

### Authorization (RLS)

Row Level Security policies enforce access control:

| Entity | Access Rule |
|--------|-------------|
| Projects | User's company only |
| Tasks | User's company only (via project) |
| Materials | User's company only |
| Expenses | User's company only |
| Users | Chat room participants only |

### Input Validation

All inputs validated with Zod:
- Query length: 1-100 characters
- UUIDs: Valid UUID format
- No SQL injection possible (parameterized queries)

---

## Performance

### Optimization

- **Result Limit**: Max 10 results per search
- **Indexes**: GIN index on `messages.entity_references` (migration 029)
- **Case-Insensitive**: Uses `ilike` for efficient searching
- **Company Scope**: Reduces search space significantly

### Expected Performance

| Function | Typical Response Time |
|----------|----------------------|
| searchProjects | < 200ms |
| searchTasks | < 300ms |
| searchMaterials | < 200ms |
| searchExpenses | < 250ms |
| searchUsers | < 150ms |

---

## Error Handling

### Error Response Format

```typescript
{
  error: string; // Error message
  fieldErrors?: Record<string, string[]>; // Zod validation errors
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Not authenticated` | No session | Ensure user is logged in |
| `No active company found for user` | User not in company | Add user to company |
| `Invalid search query` | Query too short/long | Check query length (1-100) |
| `You do not have access to this chat room` | User not participant | Add user to chat room |
| `Failed to search [entity]` | Database error | Check logs, retry |

---

## Database Schema

### messages.entity_references

**Column:** `entity_references` (JSONB, default `'[]'`)

**Index:** GIN index for efficient querying (migration 029)

**Format:**
```json
[
  {
    "type": "user" | "task" | "project" | "material" | "expense",
    "id": "uuid-string"
  }
]
```

---

## Testing

See `__tests__/chat-search.test.md` for comprehensive manual testing guide.

### Quick Test

```typescript
// Test in browser console or server component
import { searchProjects, searchTasks, searchUsers } from '@/app/actions/chat-search';

// Search projects
const projects = await searchProjects('office');
console.log(projects);

// Search tasks
const tasks = await searchTasks('install');
console.log(tasks);

// Search users in room
const users = await searchUsers('john', 'room-uuid-here');
console.log(users);
```

---

## Migrations

### 029_add_entity_references_index.sql

Adds GIN index on `messages.entity_references` for efficient querying.

**Location:** `/supabase/migrations/029_add_entity_references_index.sql`

**Apply:**
```sql
CREATE INDEX idx_messages_entity_references ON public.messages USING gin (entity_references);
```

---

## Future Enhancements

- [ ] Add fuzzy search (Levenshtein distance)
- [ ] Add search result ranking by relevance
- [ ] Cache frequent searches
- [ ] Add search history per user
- [ ] Add search analytics (track popular searches)
- [ ] Support multi-entity type search (search across all types at once)
- [ ] Add search filters (status, date range, etc.)

---

## Related Files

- **Server Actions:** `/app/actions/chat-search.ts`
- **Chat Actions:** `/app/actions/chat.ts` (sendMessage with entity parsing)
- **Types:** `/types/chat.types.ts` (EntityType, EntityReference, SearchResult)
- **Migration:** `/supabase/migrations/029_add_entity_references_index.sql`
- **Tests:** `/app/actions/__tests__/chat-search.test.md`

---

## Support

For questions or issues, check:
1. Console logs (all functions log execution steps)
2. Database logs via MCP: `mcp__supabase__get_logs service:"api"`
3. RLS policies via MCP: `mcp__supabase__get_advisors type:"security"`
