# Skill: Modal Patterns

> BaseModal usage and dialog patterns for GenHub

## When to Use

- Create/Edit forms
- Confirmation dialogs
- Detail views in overlay
- Any modal/dialog UI

## Prerequisites

- **ALWAYS use BaseModal, NEVER Dialog directly**
- Check existing modals for consistency

---

## Quick Reference

### Basic Modal
```tsx
'use client'

import { BaseModal } from '@/components/ui/BaseModal'
import { Plus } from 'lucide-react'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task"
      icon={<Plus className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Modal content */}
      </div>
    </BaseModal>
  )
}
```

### Modal with Form
```tsx
'use client'

import { useState } from 'react'
import { BaseModal } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTask } from '@/app/actions/tasks'
import { toast } from 'sonner'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export function CreateTaskModal({ isOpen, onClose, projectId }: CreateTaskModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const result = await createTask({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      projectId,
    })

    setIsPending(false)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      return
    }

    toast.success('Task created')
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Enter task title"
            className="border-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Enter description (optional)"
            rows={3}
            className="border-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="bg-[#001B51]">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </Button>
        </div>
      </form>
    </BaseModal>
  )
}
```

---

## Modal Types

### 1. Create Modal
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Create Project"
  icon={<Plus className="w-5 h-5" />}
>
  <CreateProjectForm onSuccess={onClose} />
</BaseModal>
```

### 2. Edit Modal
```tsx
interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task  // Existing data to edit
}

export function EditTaskModal({ isOpen, onClose, task }: EditTaskModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      icon={<Edit className="w-5 h-5" />}
    >
      <EditTaskForm task={task} onSuccess={onClose} />
    </BaseModal>
  )
}
```

### 3. Confirmation Modal
```tsx
interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  message: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: DeleteConfirmModalProps) {
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = async () => {
    setIsPending(true)
    await onConfirm()
    setIsPending(false)
    onClose()
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
```

### 4. Detail Modal
```tsx
export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      icon={<CheckSquare className="w-5 h-5" />}
    >
      <div className="space-y-6">
        {/* Status & Priority */}
        <div className="flex gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-gray-600">{task.description || 'No description'}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleEdit(task)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => handleDelete(task.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
```

---

## Modal State Management

### Simple State (Single Modal)
```tsx
export function ProjectPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsCreateOpen(true)}>
        Create Project
      </Button>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
```

### Multiple Modals
```tsx
type ModalType = 'create' | 'edit' | 'delete' | null

export function TasksPage() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const openEdit = (task: Task) => {
    setSelectedTask(task)
    setActiveModal('edit')
  }

  const openDelete = (task: Task) => {
    setSelectedTask(task)
    setActiveModal('delete')
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedTask(null)
  }

  return (
    <>
      <TaskList onEdit={openEdit} onDelete={openDelete} />

      <CreateTaskModal
        isOpen={activeModal === 'create'}
        onClose={closeModal}
      />

      {selectedTask && (
        <>
          <EditTaskModal
            isOpen={activeModal === 'edit'}
            onClose={closeModal}
            task={selectedTask}
          />
          <DeleteConfirmModal
            isOpen={activeModal === 'delete'}
            onClose={closeModal}
            onConfirm={() => handleDelete(selectedTask.id)}
          />
        </>
      )}
    </>
  )
}
```

---

## Form Patterns in Modals

### Reset Form on Close
```tsx
export function CreateModal({ isOpen, onClose }: Props) {
  const [title, setTitle] = useState('')

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('')
    }
  }, [isOpen])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
    </BaseModal>
  )
}
```

### Pre-populate Edit Form
```tsx
export function EditModal({ isOpen, onClose, task }: EditProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')

  // Update when task changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
  }, [task])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Task">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
    </BaseModal>
  )
}
```

---

## Styling Guidelines

### Modal Content Layout
```tsx
<BaseModal isOpen={isOpen} onClose={onClose} title="Title">
  <div className="space-y-4">
    {/* Error message */}
    {error && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
        {error}
      </div>
    )}

    {/* Form fields */}
    <div className="space-y-2">
      <Label>Field</Label>
      <Input className="border-2" />
    </div>

    {/* Two-column layout for dates */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Start Date</Label>
        <Input type="date" className="border-2" />
      </div>
      <div className="space-y-2">
        <Label>End Date</Label>
        <Input type="date" className="border-2" />
      </div>
    </div>

    {/* Actions - always at bottom */}
    <div className="flex justify-end gap-3 pt-4">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button className="bg-[#001B51]">Save</Button>
    </div>
  </div>
</BaseModal>
```

---

## Anti-Patterns

```tsx
// WRONG: Using Dialog directly
import { Dialog } from '@/components/ui/dialog'  // NEVER!

// CORRECT: Use BaseModal
import { BaseModal } from '@/components/ui/BaseModal'

// WRONG: Not handling loading state
const handleSubmit = async () => {
  await createTask(data)  // User can submit multiple times!
  onClose()
}

// CORRECT: Handle loading
const handleSubmit = async () => {
  setIsPending(true)
  await createTask(data)
  setIsPending(false)
  onClose()
}

// WRONG: Closing before action completes
const handleDelete = async () => {
  onClose()  // Closes immediately!
  await deleteTask(id)
}

// CORRECT: Close after action
const handleDelete = async () => {
  await deleteTask(id)
  onClose()
}

// WRONG: Not showing errors
const result = await createTask(data)
onClose()  // Error not shown to user!

// CORRECT: Show errors
if (result.error) {
  setError(result.error)
  toast.error(result.error)
  return
}
onClose()
```

---

## Affected Documentation

After creating modals:
- Add to `docs/indexes/components.md` under appropriate feature

---

## Checklist

- [ ] Using BaseModal (not Dialog)
- [ ] Loading state handled
- [ ] Error state displayed
- [ ] Form resets on close (if create modal)
- [ ] Form pre-populates (if edit modal)
- [ ] Cancel button included
- [ ] Submit button shows loading state
- [ ] Toast notification on success/error
- [ ] Close after successful action
