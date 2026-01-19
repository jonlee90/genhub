# Skill: Validation Patterns

> Zod validation for GenHub Server Actions and API routes

## When to Use

- Validating Server Action inputs
- API route request bodies
- Form data validation
- Type-safe parsing

## Prerequisites

- Zod is installed (`npm install zod`)
- Understand TypeScript types

---

## Quick Reference

### Basic Schema
```typescript
import { z } from 'zod'

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().datetime().optional(),
})

type CreateTaskInput = z.infer<typeof CreateTaskSchema>
```

### In Server Action
```typescript
'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().uuid(),
})

export async function createTask(input: unknown) {
  // Validate
  const result = CreateTaskSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors }
  }

  const { title, projectId } = result.data

  // Proceed with validated data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, project_id: projectId })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}
```

---

## Common Schemas

### String Validations
```typescript
z.string()                           // Any string
z.string().min(1)                    // Required (non-empty)
z.string().max(200)                  // Max length
z.string().email()                   // Email format
z.string().url()                     // URL format
z.string().uuid()                    // UUID format
z.string().regex(/^[A-Z]{2}\d{4}$/)  // Custom pattern
z.string().trim()                    // Trim whitespace
z.string().toLowerCase()             // Transform to lowercase
```

### Number Validations
```typescript
z.number()                           // Any number
z.number().int()                     // Integer only
z.number().positive()                // > 0
z.number().nonnegative()             // >= 0
z.number().min(0).max(100)           // Range
z.coerce.number()                    // Coerce string to number (e.g., "42" -> 42)
```

### FormData Coercion

Use `z.coerce` for parsing FormData values (always strings):

```typescript
// FormData values are always strings, need coercion
const formDataSchema = z.object({
  name: z.string().min(1),
  budget: z.coerce.number().positive(),        // "1000" -> 1000
  quantity: z.coerce.number().int().min(1),    // "5" -> 5
  is_active: z.coerce.boolean(),               // "true" -> true
  priority: z.enum(['low', 'medium', 'high']), // Already string, no coercion
})

// Usage with FormData
export async function handleForm(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    budget: formData.get('budget'),
    quantity: formData.get('quantity'),
    is_active: formData.get('is_active'),
    priority: formData.get('priority'),
  }

  const validation = formDataSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors }
  }

  // validation.data now has correctly typed values
}
```

### Date Validations
```typescript
z.date()                             // Date object
z.string().datetime()                // ISO datetime string
z.coerce.date()                      // Coerce to Date
z.string().date()                    // YYYY-MM-DD format
```

### Enum Validations
```typescript
z.enum(['low', 'medium', 'high'])    // Literal union
z.nativeEnum(TaskPriority)           // TypeScript enum
```

### Optional & Nullable
```typescript
z.string().optional()                // string | undefined
z.string().nullable()                // string | null
z.string().nullish()                 // string | null | undefined
z.string().default('default')        // Default value
```

---

## GenHub Common Schemas

### Task Input
```typescript
const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid('Invalid project ID'),
  phaseId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'blocked', 'review', 'completed']).default('todo'),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
})
```

### Project Input
```typescript
const ProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  clientName: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  budget: z.number().nonnegative().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed']).default('planning'),
})
```

### Expense Input
```typescript
const ExpenseSchema = z.object({
  taskId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(['materials', 'labor', 'equipment', 'permits', 'other']),
  description: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional(),
  date: z.string().date().default(() => new Date().toISOString().split('T')[0]),
})
```

### Search/Filter Params
```typescript
const ListParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'due_date']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
})
```

---

## Advanced Patterns

### Conditional Fields
```typescript
const Schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('material'),
    materialId: z.string().uuid(),
    quantity: z.number().positive(),
  }),
  z.object({
    type: z.literal('labor'),
    hours: z.number().positive(),
    rate: z.number().positive(),
  }),
])
```

### Refinements
```typescript
const DateRangeSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
)
```

### Transform
```typescript
const PhoneSchema = z.string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => val.length === 10 || val.length === 11, 'Invalid phone number')
```

### Nested Objects
```typescript
const ProjectWithPhasesSchema = z.object({
  name: z.string(),
  phases: z.array(z.object({
    name: z.string(),
    order: z.number().int().nonnegative(),
  })).min(1, 'At least one phase required'),
})
```

---

## Error Handling

### safeParse (Recommended)
```typescript
const result = Schema.safeParse(input)
if (!result.success) {
  // result.error is ZodError
  const fieldErrors = result.error.flatten().fieldErrors
  return { error: 'Validation failed', fieldErrors }
}
// result.data is typed correctly
const validated = result.data
```

### parse (Throws)
```typescript
try {
  const validated = Schema.parse(input)
} catch (error) {
  if (error instanceof z.ZodError) {
    return { error: error.flatten().fieldErrors }
  }
  throw error
}
```

### Custom Error Messages
```typescript
const Schema = z.object({
  email: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  }).email('Please enter a valid email'),
})
```

---

## Anti-Patterns

```typescript
// WRONG: Not validating
export async function createTask(input: CreateTaskInput) {
  // Trusting input blindly!
}

// WRONG: Returning raw Zod error
if (!result.success) {
  return { error: result.error }  // Too verbose for client
}

// WRONG: Using parse in Server Actions (throws)
const data = Schema.parse(input)  // Unhandled exception!

// CORRECT: Use safeParse
const result = Schema.safeParse(input)
if (!result.success) {
  return { error: result.error.flatten().fieldErrors }
}

// WRONG: Over-validating (too strict)
z.string().min(10).max(10).regex(/exact/)  // Hard to use

// WRONG: Under-validating (too loose)
z.any()  // No type safety
```

---

## Affected Documentation

After creating validation schemas:
- Export from central location if reused
- Document in Server Action comments

---

## Checklist

- [ ] Schema defined with appropriate constraints
- [ ] Required fields marked correctly
- [ ] Default values for optional fields
- [ ] Custom error messages for user-facing errors
- [ ] Using safeParse (not parse)
- [ ] Flattened errors returned to client
- [ ] TypeScript type inferred with z.infer
