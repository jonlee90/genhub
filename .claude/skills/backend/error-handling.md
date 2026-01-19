# Skill: Error Handling

> Consistent error handling patterns for GenHub

## When to Use

- Server Actions (all of them)
- API routes
- Database operations
- External API calls

## Prerequisites

- Understand Server Action return types
- Know common Supabase error codes

---

## Quick Reference

### Server Action Pattern
```typescript
'use server'

import { createClient } from '@/utils/supabase/server'

type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string }

export async function createTask(input: CreateTaskInput): Promise<ActionResult<Task>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tasks')
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error('[createTask] DB error:', error)
      return { error: mapSupabaseError(error) }
    }

    return { data }
  } catch (err) {
    console.error('[createTask] Unexpected error:', err)
    return { error: 'An unexpected error occurred' }
  }
}
```

### Standard Result Type
```typescript
// lib/types/action-result.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// Usage
export async function updateTask(input: UpdateTaskInput): Promise<ActionResult<Task>> {
  // Validation
  const result = UpdateTaskSchema.safeParse(input)
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }

  // Operation
  const { data, error } = await supabase...

  if (error) {
    return { success: false, error: mapSupabaseError(error) }
  }

  return { success: true, data }
}
```

---

## Error Mapping

### Supabase Error Mapper
```typescript
// lib/utils/error-mapper.ts
import { PostgrestError } from '@supabase/supabase-js'

export function mapSupabaseError(error: PostgrestError): string {
  // Unique constraint violations
  if (error.code === '23505') {
    if (error.message.includes('email')) return 'Email already exists'
    if (error.message.includes('name')) return 'Name already exists'
    return 'A record with this value already exists'
  }

  // Foreign key violations
  if (error.code === '23503') {
    return 'Referenced record does not exist'
  }

  // Not null violations
  if (error.code === '23502') {
    const match = error.message.match(/column "(\w+)"/)
    return match ? `${match[1]} is required` : 'Required field is missing'
  }

  // Check constraint violations
  if (error.code === '23514') {
    return 'Invalid value provided'
  }

  // RLS policy violations
  if (error.code === '42501' || error.message.includes('row-level security')) {
    return 'You do not have permission to perform this action'
  }

  // Not found
  if (error.code === 'PGRST116') {
    return 'Record not found'
  }

  // Default
  console.error('[Supabase Error]', error)
  return 'An error occurred while processing your request'
}
```

### HTTP Status Mapper
```typescript
export function getHttpStatus(error: PostgrestError): number {
  switch (error.code) {
    case 'PGRST116': return 404  // Not found
    case '42501': return 403     // Permission denied
    case '23505': return 409     // Conflict (duplicate)
    case '23503': return 400     // Bad request (FK violation)
    default: return 500
  }
}
```

---

## Error Patterns by Context

### CRUD Operations
```typescript
// Create
export async function createProject(input: CreateProjectInput) {
  const { data, error } = await supabase
    .from('projects')
    .insert(input)
    .select()
    .single()

  if (error) return { error: mapSupabaseError(error) }
  return { data }
}

// Read (single)
export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { error: 'Project not found' }
    return { error: mapSupabaseError(error) }
  }
  return { data }
}

// Update
export async function updateProject(id: string, input: UpdateProjectInput) {
  const { data, error } = await supabase
    .from('projects')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: mapSupabaseError(error) }
  if (!data) return { error: 'Project not found or no permission' }
  return { data }
}

// Delete
export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return { error: mapSupabaseError(error) }
  return { success: true }
}
```

### Batch Operations
```typescript
export async function createTasks(tasks: CreateTaskInput[]) {
  const results: { success: Task[]; failed: { input: CreateTaskInput; error: string }[] } = {
    success: [],
    failed: [],
  }

  for (const task of tasks) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) {
      results.failed.push({ input: task, error: mapSupabaseError(error) })
    } else {
      results.success.push(data)
    }
  }

  return results
}
```

### Transaction-like Operations
```typescript
export async function createProjectWithPhases(input: {
  project: CreateProjectInput
  phases: CreatePhaseInput[]
}) {
  // Create project first
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert(input.project)
    .select()
    .single()

  if (projectError) {
    return { error: mapSupabaseError(projectError) }
  }

  // Create phases
  const phasesWithProject = input.phases.map(p => ({
    ...p,
    project_id: project.id,
  }))

  const { data: phases, error: phasesError } = await supabase
    .from('phases')
    .insert(phasesWithProject)
    .select()

  if (phasesError) {
    // Rollback: delete the project
    await supabase.from('projects').delete().eq('id', project.id)
    return { error: 'Failed to create phases' }
  }

  return { data: { ...project, phases } }
}
```

---

## Client-Side Error Handling

### In Components
```typescript
'use client'

import { createTask } from '@/app/actions/tasks'
import { toast } from 'sonner'

export function TaskForm() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: FormData) => {
    setError(null)
    const result = await createTask({
      title: data.get('title') as string,
      projectId: params.projectId,
    })

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      return
    }

    toast.success('Task created')
    router.refresh()
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}
      {/* ... */}
    </form>
  )
}
```

### With Field Errors
```typescript
const result = await createTask(input)

if ('fieldErrors' in result) {
  // Show per-field errors
  Object.entries(result.fieldErrors).forEach(([field, errors]) => {
    setFieldError(field, errors[0])
  })
  return
}

if (result.error) {
  // Show general error
  toast.error(result.error)
}
```

---

## Logging

### Environment-Aware Logging

Use conditional logging for development debugging without cluttering production logs:

```typescript
export async function deleteTask(id: string) {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  if (process.env.NODE_ENV === 'development') {
    console.log('[deleteTask] Starting:', { id, userId: ctx.userId })
  }

  const { error } = await ctx.supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    // Always log errors (production + development)
    console.error('[deleteTask] Failed:', { id, error })

    // Development: Log full error details
    if (process.env.NODE_ENV === 'development') {
      console.error('[deleteTask] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    }

    return { error: mapSupabaseError(error) }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[deleteTask] Success:', { id })
  }

  revalidatePath('/app/tasks')
  return { success: true }
}
```

### Structured Error Logging

Log errors with consistent format for easier debugging:

```typescript
function logError(action: string, context: Record<string, any>, error: any) {
  console.error(`[${action}] Error occurred`, {
    timestamp: new Date().toISOString(),
    context,
    error: {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    }
  })
}

// Usage
export async function updateProject(id: string, input: UpdateInput) {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  const { data, error } = await ctx.supabase
    .from('projects')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logError('updateProject', { projectId: id, userId: ctx.userId }, error)
    return { error: 'Failed to update project' }
  }

  return { data }
}
```

---

---

## Return Type Patterns

### Pattern 1: { data?, error? } - Most Common

Use for queries and simple mutations:

```typescript
export async function getProject(id: string): Promise<{
  data?: Project
  error?: string
}> {
  const ctx = await getUserContext()
  if ('error' in ctx) return ctx

  const { data, error } = await ctx.supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { error: 'Project not found' }
  return { data }
}
```

### Pattern 2: { success: boolean, error? } - Deletions

Use for operations that don't return data:

```typescript
export async function deleteProject(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const ctx = await getUserContext()
  if ('error' in ctx) return { success: false, error: ctx.error }

  const { error } = await ctx.supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: 'Failed to delete project' }
  return { success: true }
}
```

### Pattern 3: { success: boolean, data?, error? } - Complex Mutations

Use when you need to return success status AND data:

```typescript
export async function createProject(input: CreateInput): Promise<{
  success: boolean
  data?: Project
  error?: string
}> {
  const ctx = await getUserContext()
  if ('error' in ctx) return { success: false, error: ctx.error }

  const { data, error } = await ctx.supabase
    .from('projects')
    .insert(input)
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to create project' }
  return { success: true, data }
}
```

---

## Anti-Patterns

```typescript
// WRONG: Throwing errors from Server Actions
export async function createTask(input) {
  const { error } = await supabase...
  if (error) throw new Error(error.message)  // Client can't catch this properly!
}

// WRONG: Exposing internal error details
return { error: error.message }  // May leak sensitive info (table names, schema)

// CORRECT: Map to user-friendly message
console.error('[createTask] Error:', error)
return { error: 'Failed to create task' }

// WRONG: Silent failures
const { data } = await supabase...  // Error ignored!
return { data }

// CORRECT: Always check for errors
const { data, error } = await supabase...
if (error) return { error: 'Operation failed' }
return { data }

// WRONG: Inconsistent return types
if (error) return null          // null
return data                     // Project
// Caller has to handle both null and Project

// CORRECT: Consistent return type
if (error) return { error: mapSupabaseError(error) }
return { data }
// Caller always receives { data?, error? }
```

---

## Affected Documentation

Error handling patterns should be:
- Consistent across all Server Actions
- Documented in Server Action comments

---

## Checklist

- [ ] Using safeParse for validation (not parse)
- [ ] Supabase errors mapped to user-friendly messages
- [ ] Sensitive details not exposed to client
- [ ] Consistent return type (data | error)
- [ ] Errors logged server-side
- [ ] Client handles both success and error cases
- [ ] Field errors returned when applicable
