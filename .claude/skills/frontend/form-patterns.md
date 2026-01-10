# Skill: Form Patterns

> Create forms in GenHub with validation, error handling, and proper UX.

## When to Use

- Creating or editing entities
- User says: "add form", "create modal", "edit form"
- Design doc specifies user input

## Prerequisites

- Server Action exists for form submission
- Understanding of required/optional fields
- Validation rules defined

---

## Quick Reference

### Standard Form Component

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createEntity } from '@/app/actions/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EntityFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EntityForm({ onSuccess, onCancel }: EntityFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
    };

    const result = await createEntity(data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Enter name"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Enter description (optional)"
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="bg-construction-blue">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}
```

### Form in Modal

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { EntityForm } from './EntityForm';

export function CreateEntityButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="bg-construction-blue">
        <Plus className="h-4 w-4 mr-2" />
        Add Entity
      </Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Entity"
        icon={<Plus className="h-5 w-5" />}
      >
        <EntityForm
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </BaseModal>
    </>
  );
}
```

---

## Step-by-Step

### 1. Define Form State

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 2. Create Submit Handler

```tsx
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  // Extract form data
  const formData = new FormData(e.currentTarget);

  // Call Server Action
  const result = await serverAction(data);

  // Handle result
  if (result.error) {
    setError(result.error);
    setIsSubmitting(false);
    return;
  }

  // Success
  setIsSubmitting(false);
  onSuccess?.();
  router.refresh();
}
```

### 3. Build Form UI

Use standard components:
- `Input` - Text, email, number inputs
- `Textarea` - Multi-line text
- `Select` - Dropdowns
- `Checkbox` - Boolean toggles
- `Label` - Field labels

### 4. Add Validation Feedback

```tsx
{/* Field-level error */}
<div className="space-y-2">
  <Label htmlFor="email">Email *</Label>
  <Input
    id="email"
    name="email"
    type="email"
    required
    className={fieldErrors.email ? 'border-red-500' : ''}
  />
  {fieldErrors.email && (
    <p className="text-red-500 text-sm">{fieldErrors.email}</p>
  )}
</div>
```

### 5. Handle Loading State

```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</Button>
```

---

## Examples

### Example 1: Edit Form with Default Values

```tsx
interface EditEntityFormProps {
  entity: Entity;
  onSuccess?: () => void;
}

export function EditEntityForm({ entity, onSuccess }: EditEntityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateEntity(entity.id, {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
    });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={entity.name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={entity.description ?? ''}
        />
      </div>

      {/* Submit button */}
    </form>
  );
}
```

### Example 2: Form with Select and Date

```tsx
export function TaskForm({ projectId, phases }: TaskFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input id="title" name="title" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phase_id">Phase</Label>
        <select
          id="phase_id"
          name="phase_id"
          className="w-full h-10 rounded-md border border-input bg-background px-3"
        >
          <option value="">No phase</option>
          {phases.map(phase => (
            <option key={phase.id} value={phase.id}>
              {phase.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input id="start_date" name="start_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input id="due_date" name="due_date" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select id="priority" name="priority" className="...">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Submit */}
    </form>
  );
}
```

### Example 3: Mobile-Optimized Form

```tsx
export function MobileForm() {
  return (
    <form className="space-y-4">
      {/* Full-width inputs on mobile */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          className="h-12 text-base" // Larger touch target
        />
      </div>

      {/* Stack on mobile, row on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" className="h-12" />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" className="h-12" />
        </div>
      </div>

      {/* Full-width buttons on mobile */}
      <div className="flex flex-col md:flex-row gap-3 pt-4">
        <Button variant="outline" className="w-full md:w-auto h-12">
          Cancel
        </Button>
        <Button className="w-full md:w-auto h-12 bg-construction-blue">
          Save
        </Button>
      </div>
    </form>
  );
}
```

---

## Anti-Patterns

- **Never** use `Dialog` - always use `BaseModal`
- **Never** import Supabase in form components - use Server Actions
- **Never** skip loading state - always show spinner
- **Never** forget `disabled` on inputs during submission
- **Never** use alert() for errors - show inline messages
- **Never** forget `router.refresh()` after mutations

---

## Affected Documentation

| Document | Update Action |
|----------|---------------|
| `docs/indexes/components.md` | Add form component entry |

---

## Checklist

- [ ] Form has `'use client'` directive
- [ ] Uses Server Action for submission
- [ ] Has loading state with spinner
- [ ] Has error state with inline message
- [ ] Required fields marked with `*`
- [ ] Submit button disabled during submission
- [ ] Uses `BaseModal` (not Dialog) if in modal
- [ ] Mobile responsive (44px min touch targets)
- [ ] Calls `router.refresh()` on success
