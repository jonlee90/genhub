# Skill: Project CRUD

> Project management patterns for GenHub

## When to Use

- Creating/editing/deleting projects
- Project list and detail views
- Project phases and milestones
- Project settings and configuration

## Prerequisites

- Check `docs/indexes/tables.md` for projects schema
- Check `docs/indexes/actions.md` for existing actions

---

## Quick Reference

### Database Schema
```sql
-- projects table
projects (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  name text NOT NULL,
  description text,
  client_name text,
  address text,
  start_date date,
  end_date date,
  budget numeric(12,2),
  status project_status DEFAULT 'planning',
  completion_percentage integer DEFAULT 0,
  created_at timestamptz,
  updated_at timestamptz
)

-- phases table (linked to project)
phases (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  name text NOT NULL,
  order_index integer DEFAULT 0,
  status phase_status DEFAULT 'pending',
  start_date date,
  end_date date,
  completion_percentage integer DEFAULT 0
)
```

### Status Values
```typescript
type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
type PhaseStatus = 'pending' | 'active' | 'completed' | 'skipped'
```

---

## Server Actions

### Get Projects
```typescript
// app/actions/projects.ts
'use server'

import { createClient } from '@/utils/supabase/server'

export async function getProjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      phases (id, name, status, order_index),
      tasks:tasks(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function getProject(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      phases (*),
      tasks (*)
    `)
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return { data }
}
```

### Create Project
```typescript
export async function createProject(input: {
  name: string
  description?: string
  clientName?: string
  address?: string
  startDate?: string
  endDate?: string
  budget?: number
}) {
  const supabase = await createClient()

  // Get user's company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .single()

  if (!companyUser) return { error: 'No company found' }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      company_id: companyUser.company_id,
      name: input.name,
      description: input.description,
      client_name: input.clientName,
      address: input.address,
      start_date: input.startDate,
      end_date: input.endDate,
      budget: input.budget,
      status: 'planning',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/projects')
  return { data }
}
```

### Update Project
```typescript
export async function updateProject(
  id: string,
  input: Partial<{
    name: string
    description: string
    clientName: string
    status: ProjectStatus
    startDate: string
    endDate: string
    budget: number
  }>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update({
      name: input.name,
      description: input.description,
      client_name: input.clientName,
      status: input.status,
      start_date: input.startDate,
      end_date: input.endDate,
      budget: input.budget,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/projects')
  revalidatePath(`/app/projects/${id}`)
  return { data }
}
```

### Delete Project
```typescript
export async function deleteProject(id: string) {
  const supabase = await createClient()

  // Check for active tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', id)
    .neq('status', 'completed')
    .limit(1)

  if (tasks?.length) {
    return { error: 'Cannot delete project with active tasks' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/app/projects')
  return { success: true }
}
```

---

## UI Components

### Project Card
```tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Building2, Calendar, MapPin } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      onClick={onClick}
      className="border-2 border-gray-200 hover:border-[#001B51]/30 cursor-pointer transition-colors"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{project.name}</h3>
            {project.client_name && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {project.client_name}
              </p>
            )}
          </div>
          <StatusBadge status={project.status} />
        </div>

        {project.address && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <MapPin className="w-4 h-4" />
            {project.address}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {project.end_date ? formatDate(project.end_date) : 'No deadline'}
          </div>
          <div className="text-sm font-medium">
            {project.completion_percentage}% complete
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#001B51] transition-all"
            style={{ width: `${project.completion_percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
```

### Project Form
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProject } from '@/app/actions/projects'
import { toast } from 'sonner'

interface ProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const result = await createProject({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      clientName: formData.get('clientName') as string,
      address: formData.get('address') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
    })

    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Project created')
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input id="name" name="name" required className="border-2" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} className="border-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input id="clientName" name="clientName" className="border-2" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget ($)</Label>
          <Input id="budget" name="budget" type="number" step="0.01" className="border-2" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" className="border-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" name="startDate" type="date" className="border-2" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" name="endDate" type="date" className="border-2" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="bg-[#001B51]">
          {isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}
```

---

## Phase Management

### Create Default Phases
```typescript
const DEFAULT_PHASES = [
  { name: 'Initiation', order_index: 0 },
  { name: 'Planning', order_index: 1 },
  { name: 'Design', order_index: 2 },
  { name: 'Permitting', order_index: 3 },
  { name: 'Construction', order_index: 4 },
  { name: 'Inspection', order_index: 5 },
  { name: 'Closeout', order_index: 6 },
]

export async function createProjectWithPhases(input: CreateProjectInput) {
  const supabase = await createClient()

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ ...input })
    .select()
    .single()

  if (projectError) return { error: projectError.message }

  // Create default phases
  const phases = DEFAULT_PHASES.map(phase => ({
    ...phase,
    project_id: project.id,
    status: 'pending',
  }))

  await supabase.from('phases').insert(phases)

  revalidatePath('/app/projects')
  return { data: project }
}
```

---

## Anti-Patterns

```typescript
// WRONG: Deleting project with tasks
await supabase.from('projects').delete().eq('id', id)
// Could orphan tasks or fail due to FK constraints

// CORRECT: Check for dependencies first
const { data: tasks } = await supabase
  .from('tasks')
  .select('id')
  .eq('project_id', id)
  .limit(1)

if (tasks?.length) {
  return { error: 'Cannot delete project with tasks' }
}

// WRONG: Not updating completion percentage
// Manually calculate or use trigger

// CORRECT: Trigger or recalculate on task changes
```

---

## Affected Documentation

After project changes:
- Update `docs/indexes/actions.md` if new actions
- Update `docs/indexes/components.md` if new UI

---

## Checklist

- [ ] Company isolation in all queries (RLS)
- [ ] Phases created with project (if applicable)
- [ ] Status transitions validated
- [ ] Budget formatted correctly
- [ ] Dates validated (end after start)
- [ ] Delete checks for dependencies
- [ ] revalidatePath called after mutations
