# Form Validation Guide

> Comprehensive guide for implementing client-side form validation in GenHub using React Hook Form + Zod

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Simple Form Pattern](#simple-form-pattern)
3. [Multi-Step Form Pattern](#multi-step-form-pattern)
4. [Validation Schemas Reference](#validation-schemas-reference)
5. [Custom Components with Controller](#custom-components-with-controller)
6. [Migration Checklist](#migration-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Basic Usage

```tsx
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { inviteTeamMemberSchema } from '@/lib/validation/schemas';

const { register, handleSubmit, canSubmit, formState: { errors } } = useValidatedForm({
  schema: inviteTeamMemberSchema,
});
```

### Key Features

- **Automatic Zod validation**: No manual validation logic needed
- **Type safety**: Full TypeScript support with type inference
- **Smart submit button**: Use `canSubmit` to disable submit when invalid
- **Validation mode**: Defaults to `onBlur` for better UX
- **Computed properties**: `isValid`, `isSubmitting`, `canSubmit`

---

## Simple Form Pattern

Use this pattern for single-step forms with standard inputs.

### Example: Invite Team Member Modal

```tsx
'use client';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { inviteTeamMemberSchema } from '@/lib/validation/schemas';
import type { InviteTeamMemberFormData } from '@/lib/validation/schemas';
import { MobileInput } from '@/components/mobile/MobileInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function InviteTeamMemberModal({ isOpen, onClose }) {
  const [serverError, setServerError] = useState<string | null>(null);

  // Initialize form with validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    canSubmit,
    reset,
  } = useValidatedForm({
    schema: inviteTeamMemberSchema,
    defaultValues: {
      email: '',
      name: '',
      role: 'field_worker',
    },
  });

  // Submit handler (server action)
  const onSubmit = async (data: InviteTeamMemberFormData) => {
    setServerError(null);

    const result = await inviteTeamMember(data);

    if (result.success) {
      reset();
      onClose();
    } else {
      setServerError(result.error || 'Failed to invite team member');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Standard Input with register() */}
      <MobileInput
        label="Email"
        type="email"
        placeholder="member@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Standard Input with register() */}
      <MobileInput
        label="Name"
        placeholder="John Doe"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Custom Component with Controller */}
      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="role" className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="foreman">Foreman</SelectItem>
                <SelectItem value="field_worker">Field Worker</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && (
          <p className="text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Server Error Display */}
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button - disabled when form invalid or submitting */}
      <Button type="submit" disabled={!canSubmit}>
        Invite Member
      </Button>
    </form>
  );
}
```

### Key Points

1. **Standard inputs**: Use `{...register('fieldName')}` spread syntax
2. **Custom components**: Use `<Controller>` for Select, CurrencyInput, etc.
3. **Error display**: Show `errors.fieldName?.message` below each input
4. **Submit button**: Disable with `!canSubmit` (combines validation + submission state)
5. **Reset form**: Call `reset()` after successful submission

---

## Multi-Step Form Pattern

Use this pattern for forms with multiple steps requiring step-by-step validation.

### Example: Create Project Form

```tsx
'use client';

import { useState } from 'react';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { createProjectSchema } from '@/lib/validation/schemas';
import type { CreateProjectFormData } from '@/lib/validation/schemas';
import { MobileInput } from '@/components/mobile/MobileInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/button';

const STEPS = ['Type', 'Details', 'Location', 'Timeline'];

export function CreateProjectForm() {
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize form with validation
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    canSubmit,
  } = useValidatedForm({
    schema: createProjectSchema,
    defaultValues: {
      project_type: 'residential',
      name: '',
      description: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      start_date: '',
      end_date: '',
      budget: undefined,
    },
  });

  // Validate current step fields before proceeding
  const handleNext = async () => {
    let fieldsToValidate: string[] = [];

    switch (currentStep) {
      case 0: // Type step
        fieldsToValidate = ['project_type'];
        break;
      case 1: // Details step
        fieldsToValidate = ['name', 'description'];
        break;
      case 2: // Location step
        fieldsToValidate = ['address', 'city', 'state', 'zip_code'];
        break;
      case 3: // Client & Timeline step
        fieldsToValidate = ['client_name', 'client_email', 'client_phone', 'start_date', 'end_date'];
        break;
    }

    // Trigger validation for current step fields only
    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreateProjectFormData) => {
    const result = await createProject(data);

    if (result.success) {
      // Handle success
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Step 0: Project Type */}
      {currentStep === 0 && (
        <div>
          <MobileInput
            label="Project Type"
            placeholder="Residential, Commercial, etc."
            error={errors.project_type?.message}
            {...register('project_type')}
          />
        </div>
      )}

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <MobileInput
            label="Project Name"
            placeholder="Enter project name"
            error={errors.name?.message}
            {...register('name')}
          />
          <MobileInput
            label="Description"
            placeholder="Enter description (optional)"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>
      )}

      {/* Step 2: Location */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <MobileInput
            label="Address"
            placeholder="123 Main St"
            error={errors.address?.message}
            {...register('address')}
          />
          <MobileInput
            label="City"
            placeholder="City"
            error={errors.city?.message}
            {...register('city')}
          />
          <MobileInput
            label="State"
            placeholder="State"
            error={errors.state?.message}
            {...register('state')}
          />
          <MobileInput
            label="ZIP Code"
            placeholder="12345"
            error={errors.zip_code?.message}
            {...register('zip_code')}
          />
        </div>
      )}

      {/* Step 3: Client & Timeline */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <MobileInput
            label="Client Name"
            placeholder="John Doe"
            error={errors.client_name?.message}
            {...register('client_name')}
          />
          <MobileInput
            label="Client Email"
            type="email"
            placeholder="client@example.com"
            error={errors.client_email?.message}
            {...register('client_email')}
          />
          <PhoneInput
            label="Client Phone"
            placeholder="(555) 555-5555"
            error={errors.client_phone?.message}
            {...register('client_phone')}
          />
          <MobileInput
            label="Start Date"
            type="date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />
          <MobileInput
            label="End Date"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
          <CurrencyInput
            label="Budget (optional)"
            placeholder="$0.00"
            error={errors.budget?.message}
            {...register('budget')}
          />
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {currentStep > 0 && (
          <Button type="button" variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}

        {currentStep < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={!canSubmit}>
            Create Project
          </Button>
        )}
      </div>
    </form>
  );
}
```

### Key Points for Multi-Step Forms

1. **Step validation**: Use `trigger(['field1', 'field2'])` to validate specific fields
2. **Async validation**: `trigger()` returns a Promise, use `await`
3. **Continue button**: Validate before moving to next step
4. **Final submit**: Only enabled on last step with `canSubmit`
5. **Cross-field validation**: Zod schema handles date range validation automatically

---

## Validation Schemas Reference

All schemas are located in `lib/validation/schemas.ts`.

### Field-Level Schemas

```typescript
import {
  emailSchema,              // Required email
  optionalEmailSchema,      // Optional email (empty string allowed)
  phoneSchema,              // Phone: (XXX) XXX-XXXX format
  zipCodeSchema,            // ZIP: 12345 or 12345-6789
  currencySchema,           // Positive currency value
  optionalCurrencySchema,   // Optional currency
  requiredStringSchema,     // Required text (1-200 chars, trimmed)
  optionalStringSchema,     // Optional text (0-200 chars)
  longTextSchema,           // Optional long text (0-2000 chars)
  dateSchema,               // Required date
  optionalDateSchema,       // Optional date
  uuidSchema,               // Required UUID (for selects)
  optionalUuidSchema,       // Optional UUID
} from '@/lib/validation/schemas';
```

### Form-Level Schemas

```typescript
import {
  createProjectSchema,      // Project creation form
  createTaskSchema,         // Task creation form
  createExpenseSchema,      // Expense creation form
  inviteTeamMemberSchema,   // Team member invitation
  addSubcontractorSchema,   // Subcontractor addition
  assignMaterialSchema,     // Material assignment
  emailSignInSchema,        // Email sign-in
  phaseTemplateSchema,      // Phase template management
  projectTypeSchema,        // Project type management
  taskTypeSchema,           // Task type management
  taskTemplateSchema,       // Task template management
} from '@/lib/validation/schemas';
```

### Type Exports

```typescript
import type {
  CreateProjectFormData,
  CreateTaskFormData,
  CreateExpenseFormData,
  InviteTeamMemberFormData,
  AddSubcontractorFormData,
  AssignMaterialFormData,
  EmailSignInFormData,
  PhaseTemplateFormData,
  ProjectTypeFormData,
  TaskTypeFormData,
  TaskTemplateFormData,
} from '@/lib/validation/schemas';
```

### Cross-Field Validations

Schemas automatically validate relationships between fields:

```typescript
// createProjectSchema validates:
// - end_date must be after start_date

// createTaskSchema validates:
// - due_date must be on or after start_date

// createExpenseSchema validates:
// - amount must be positive (> 0)

// assignMaterialSchema validates:
// - quantity must be positive whole number
```

---

## Custom Components with Controller

Use React Hook Form's `Controller` component for custom inputs that don't work with `register()`.

### CurrencyInput Example

```tsx
import { Controller } from 'react-hook-form';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

<Controller
  name="budget"
  control={control}
  render={({ field }) => (
    <CurrencyInput
      label="Budget"
      placeholder="$0.00"
      value={field.value}
      onValueChange={(value) => field.onChange(value)}
      onBlur={field.onBlur}
      error={errors.budget?.message}
    />
  )}
/>
```

### Select Example

```tsx
import { Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Controller
  name="category"
  control={control}
  render={({ field }) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="materials">Materials</SelectItem>
        <SelectItem value="labor">Labor</SelectItem>
        <SelectItem value="equipment">Equipment</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
{errors.category && (
  <p className="text-sm text-red-600">{errors.category.message}</p>
)}
```

### PhoneInput Example

```tsx
import { PhoneInput } from '@/components/ui/PhoneInput';

<PhoneInput
  label="Phone Number"
  placeholder="(555) 555-5555"
  error={errors.client_phone?.message}
  {...register('client_phone')}
/>
```

**Note**: `PhoneInput` works with `register()` because it uses `forwardRef` and is compatible with React Hook Form.

---

## Migration Checklist

Use this checklist when converting existing forms to use `useValidatedForm`.

### Before Migration

- [ ] Identify all form inputs and their validation requirements
- [ ] Check if a validation schema already exists in `lib/validation/schemas.ts`
- [ ] If not, create a new schema following the patterns above
- [ ] Identify custom components that need `Controller` (Select, CurrencyInput, etc.)

### During Migration

- [ ] Replace `useState` for form values with `useValidatedForm`
- [ ] Replace custom validation logic with Zod schema
- [ ] Update standard inputs to use `{...register('fieldName')}`
- [ ] Update custom components to use `<Controller>`
- [ ] Add error display below each input: `errors.fieldName?.message`
- [ ] Update submit button to use `disabled={!canSubmit}`
- [ ] For multi-step forms, add `trigger()` validation to step navigation
- [ ] Remove old validation state and error handling code
- [ ] Test all validation scenarios (required fields, formats, cross-field validation)

### After Migration

- [ ] Test form validation on blur
- [ ] Test submit button disabled states
- [ ] Test error message display
- [ ] Test multi-step navigation (if applicable)
- [ ] Test form reset after submission
- [ ] Verify no console errors
- [ ] Verify TypeScript types are correct
- [ ] Test on mobile (proper keyboards, no zoom, touch targets)

### Code to Remove

```tsx
// OLD: Custom validation state
const [errors, setErrors] = useState({});
const [formData, setFormData] = useState({});

// OLD: Custom validation functions
const validateEmail = (email) => { /* ... */ };
const validateRequired = (value) => { /* ... */ };

// OLD: Manual onChange handlers
const handleEmailChange = (e) => {
  setFormData({ ...formData, email: e.target.value });
  if (errors.email) {
    setErrors({ ...errors, email: undefined });
  }
};

// OLD: Manual validation on submit
const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = {};
  if (!formData.email) newErrors.email = 'Email is required';
  if (!formData.name) newErrors.name = 'Name is required';
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  // Submit logic...
};
```

### Code to Add

```tsx
// NEW: useValidatedForm hook
const {
  register,
  handleSubmit,
  control, // Only if using Controller
  formState: { errors },
  canSubmit,
  trigger, // Only for multi-step forms
  reset,
} = useValidatedForm({
  schema: yourFormSchema,
  defaultValues: { /* ... */ },
});

// NEW: Submit handler
const onSubmit = async (data: YourFormData) => {
  const result = await yourServerAction(data);
  if (result.success) {
    reset();
  }
};
```

---

## Troubleshooting

### Issue: Submit button never enables

**Cause**: Form is invalid but errors aren't visible.

**Solution**:
1. Check default values match schema requirements
2. Use `mode: 'onChange'` temporarily to see validation in real-time
3. Log `formState.errors` to see what's invalid

```tsx
const { formState } = useValidatedForm({ schema, mode: 'onChange' });
console.log('Errors:', formState.errors);
```

### Issue: Validation doesn't trigger on blur

**Cause**: Missing `onBlur` handler or wrong validation mode.

**Solution**: Ensure you're using `{...register('fieldName')}` spread syntax, which includes `onBlur`.

```tsx
// CORRECT
<MobileInput {...register('email')} />

// WRONG - missing onBlur
<MobileInput onChange={register('email').onChange} />
```

### Issue: Controller field not validating

**Cause**: Missing `onBlur` in Controller render function.

**Solution**: Add `onBlur={field.onBlur}` to custom component.

```tsx
<Controller
  name="category"
  control={control}
  render={({ field }) => (
    <Select
      onValueChange={field.onChange}
      onBlur={field.onBlur} // Add this
      value={field.value}
    >
      {/* ... */}
    </Select>
  )}
/>
```

### Issue: CurrencyInput shows validation errors immediately

**Cause**: CurrencyInput triggers onChange on every keystroke.

**Solution**: Use `mode: 'onBlur'` (default) or `mode: 'onTouched'`.

```tsx
const form = useValidatedForm({
  schema: createExpenseSchema,
  mode: 'onBlur', // Wait for blur to validate
});
```

### Issue: Multi-step form shows errors for hidden steps

**Cause**: All fields are validated at once.

**Solution**: Use `trigger()` to validate only current step fields.

```tsx
const handleNext = async () => {
  const fieldsToValidate = ['field1', 'field2']; // Current step only
  const isValid = await trigger(fieldsToValidate as any);
  if (isValid) setStep(step + 1);
};
```

### Issue: Type errors with Zod schema

**Cause**: TypeScript can't infer types from schema.

**Solution**: Use explicit type from schema exports.

```tsx
import type { CreateProjectFormData } from '@/lib/validation/schemas';

const onSubmit = async (data: CreateProjectFormData) => {
  // data is fully typed
};
```

### Issue: Phone/ZIP validation fails with valid input

**Cause**: Schema expects specific format.

**Solution**: Check schema regex requirements.

```typescript
// phoneSchema expects: (XXX) XXX-XXXX
// Use PhoneInput component for automatic formatting

// zipCodeSchema expects: 12345 or 12345-6789
// Raw input validation
```

### Issue: Form reset doesn't clear errors

**Cause**: React Hook Form caches validation state.

**Solution**: Call `reset()` with empty values.

```tsx
reset({
  email: '',
  name: '',
  role: 'field_worker',
});
```

### Issue: Cross-field validation not working

**Cause**: Zod refinement is missing or incorrect.

**Solution**: Check schema has `.refine()` with correct path.

```typescript
export const schema = z.object({
  start_date: dateSchema,
  end_date: dateSchema,
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: 'End date must be after start date',
    path: ['end_date'], // Error shows on end_date field
  }
);
```

---

## Best Practices

1. **Always use `canSubmit`** for submit button disabled state (never just `isValid`)
2. **Use `onBlur` mode** for better UX (default)
3. **Use `trigger()` for multi-step** forms to validate only current step
4. **Reset form after success** with `reset()` to clear state
5. **Show errors below inputs** with `errors.fieldName?.message`
6. **Use Controller for custom components** (Select, CurrencyInput, etc.)
7. **Import type exports** from schemas for type safety
8. **Don't validate in Server Actions** - client validation is UX only, always validate server-side

---

## Additional Resources

- **Schemas**: `lib/validation/schemas.ts`
- **Hook**: `hooks/useValidatedForm.ts`
- **Error Messages**: `lib/validation/error-messages.ts`
- **Examples**:
  - Simple form: `components/team/InviteTeamMemberModal.tsx`
  - Multi-step form: `components/projects/CreateProjectForm.tsx`
  - Expense form: `components/expenses/CreateExpenseModal.tsx`

---

**Questions?** Check existing implementations in migrated forms or consult the React Hook Form and Zod documentation.
