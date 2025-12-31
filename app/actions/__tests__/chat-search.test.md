# Chat Search Functions - Manual Test Guide

## Overview
This document provides manual testing steps for the chat search server actions.

## Prerequisites
- Authenticated user with active company membership
- Test data in database:
  - At least 1 project
  - At least 1 task
  - At least 1 material
  - At least 1 expense
  - At least 1 chat room with participants

## Test Functions

### 1. searchProjects(query: string)

**Test Case 1: Valid search**
```typescript
const result = await searchProjects('office');
// Expected: Success with array of projects matching 'office'
// Result format: { success: true, results: ProjectSearchResult[] }
```

**Test Case 2: No matches**
```typescript
const result = await searchProjects('xyz123nonexistent');
// Expected: Success with empty array
// Result format: { success: true, results: [] }
```

**Test Case 3: Case-insensitive**
```typescript
const result = await searchProjects('OFFICE');
// Expected: Same results as 'office'
```

**Test Case 4: Empty query (validation error)**
```typescript
const result = await searchProjects('');
// Expected: { error: 'Invalid search query', fieldErrors: {...} }
```

**Test Case 5: Result limit (max 10)**
```typescript
const result = await searchProjects('project');
// Expected: Max 10 results even if more exist
```

---

### 2. searchTasks(query: string, projectId?: string | null)

**Test Case 1: Search all tasks**
```typescript
const result = await searchTasks('install');
// Expected: Success with tasks from any project
```

**Test Case 2: Filter by project**
```typescript
const result = await searchTasks('install', 'valid-project-uuid');
// Expected: Success with tasks only from specified project
```

**Test Case 3: Invalid project ID**
```typescript
const result = await searchTasks('install', 'invalid-uuid');
// Expected: { error: 'Invalid search parameters', fieldErrors: {...} }
```

**Test Case 4: Case-insensitive**
```typescript
const result = await searchTasks('INSTALL');
// Expected: Same results as 'install'
```

---

### 3. searchMaterials(query: string)

**Test Case 1: Valid search**
```typescript
const result = await searchMaterials('lumber');
// Expected: Success with materials matching 'lumber'
```

**Test Case 2: Only active materials**
```typescript
// Assumption: Some materials have is_active = false
const result = await searchMaterials('all');
// Expected: Only materials where is_active = true
```

**Test Case 3: Result includes price and image**
```typescript
const result = await searchMaterials('wood');
// Expected: Results include unit_price, stock_status, product_image_url
```

---

### 4. searchExpenses(query: string)

**Test Case 1: Search by description**
```typescript
const result = await searchExpenses('tools');
// Expected: Expenses with 'tools' in description
```

**Test Case 2: Search by vendor**
```typescript
const result = await searchExpenses('Home Depot');
// Expected: Expenses with 'Home Depot' in vendor_name
```

**Test Case 3: Search matches both fields**
```typescript
const result = await searchExpenses('lumber');
// Expected: Expenses with 'lumber' in description OR vendor_name
```

---

### 5. searchUsers(query: string, roomId: string)

**Test Case 1: Search by name**
```typescript
const result = await searchUsers('john', 'valid-room-uuid');
// Expected: Users in room with 'john' in name
```

**Test Case 2: Search by email**
```typescript
const result = await searchUsers('example.com', 'valid-room-uuid');
// Expected: Users in room with 'example.com' in email
```

**Test Case 3: User not in room (access denied)**
```typescript
// Authenticate as User A, search in room where User A is not a participant
const result = await searchUsers('john', 'room-without-current-user');
// Expected: { error: 'You do not have access to this chat room' }
```

**Test Case 4: Invalid room ID**
```typescript
const result = await searchUsers('john', 'invalid-uuid');
// Expected: { error: 'Invalid search parameters', fieldErrors: {...} }
```

---

## Security Tests

### RLS Verification

**Test 1: Company isolation**
```typescript
// User in Company A searches for projects
const result = await searchProjects('project');
// Expected: Only projects from Company A
// Verify: Results should NOT include projects from Company B
```

**Test 2: Chat room access control**
```typescript
// User tries to search users in a room they don't have access to
const result = await searchUsers('test', 'room-user-not-in');
// Expected: { error: 'You do not have access to this chat room' }
```

**Test 3: Authentication required**
```typescript
// Unauthenticated request (no session)
const result = await searchProjects('test');
// Expected: { error: 'Not authenticated' }
```

---

## Performance Tests

**Test 1: Response time**
```typescript
const start = Date.now();
const result = await searchProjects('office');
const duration = Date.now() - start;
// Expected: < 500ms for most queries
console.log('Search took:', duration, 'ms');
```

**Test 2: Large result set (should limit to 10)**
```typescript
const result = await searchTasks('task'); // Assumes many tasks match
// Expected: Exactly 10 results (or fewer if < 10 exist)
console.log('Result count:', result.results?.length);
```

---

## Integration Test: Entity Reference Parsing

**Test sendMessage with entity references**
```typescript
const formData = new FormData();
formData.append('chatRoomId', 'valid-room-uuid');
formData.append('content', 'Check out @[task:123:Fix bug] and @[user:456:John]');
formData.append('entityReferences', JSON.stringify([
  { type: 'task', id: '123' },
  { type: 'user', id: '456' }
]));

const result = await sendMessage(formData);
// Expected: Success
// Expected: Notification created for user 456 (if not current user)
// Expected: message.entity_references = [{type: 'task', id: '123'}, {type: 'user', id: '456'}]
```

---

## Error Handling Tests

**Test 1: Malformed query**
```typescript
const result = await searchProjects('a'.repeat(200)); // Query too long
// Expected: { error: 'Invalid search query', fieldErrors: {...} }
```

**Test 2: Database connection error**
```typescript
// Simulate database down (if possible)
const result = await searchProjects('test');
// Expected: { error: 'Failed to search projects' }
```

---

## Expected Result Formats

### ProjectSearchResult
```typescript
{
  id: string;
  name: string;
  status: string;
  health_score: number;
}
```

### TaskSearchResult
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

### MaterialSearchResult
```typescript
{
  id: string;
  product_name: string;
  unit_price: number;
  stock_status: string | null;
  product_image_url: string | null;
}
```

### ExpenseSearchResult
```typescript
{
  id: string;
  description: string;
  amount: number;
  status: string;
  vendor_name: string | null;
}
```

### UserSearchResult
```typescript
{
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}
```

---

## Success Criteria

✅ All search functions return results in < 500ms
✅ Results are limited to 10 items
✅ Case-insensitive search works correctly
✅ RLS policies prevent cross-company data access
✅ Input validation catches invalid queries
✅ Entity references are parsed and stored correctly
✅ Mention notifications are created for @user references
✅ Empty queries return validation errors
✅ Non-existent entities return empty arrays (not errors)

---

## Notes

- All search functions use `ilike` for case-insensitive matching
- Results are ordered by relevance (name/title alphabetically)
- RLS policies are enforced via Supabase server client
- Zod validation ensures type safety on inputs
- Debug console.log statements help trace execution
