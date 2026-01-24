# Form Validation & Input Masking - Technical Design

## Overview
Implement a unified validation and masking system using Zod schemas, React Hook Form, and custom input mask components. This design leverages existing dependencies (Zod already installed) and extends the current MobileInput pattern for consistency.

## Requirements Reference
See: `.claude/specs/form-validation-masking/requirements.md`

---

## Architecture Overview

### Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     Form Components                          │
│  (CreateProjectForm, TaskModal, CreateExpenseModal, etc.)   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               useValidatedForm Hook                          │
│  - React Hook Form integration                               │
│  - Zod schema validation                                     │
│  - Error state management                                    │
│  - Submit button state                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ Validation       │    │ Input Components     │
│ Schemas          │    │ - CurrencyInput      │
│ (Zod)            │    │ - PhoneInput         │
│                  │    │ - MobileInput+       │
└──────────────────┘    └──────────────────────┘
```

### Data Flow
```
User Input → Input Mask → Validation Schema → Error State → Submit Button
     ↓                                              ↓
  Display                                      Disable/Enable
```

---

## Technology Stack

### Libraries
| Library | Purpose | Already Installed? |
|---------|---------|-------------------|
| `zod` (v4.1.13) | Validation schemas | ✅ Yes |
| `react-hook-form` | Form state management | ❌ No - Add |
| `react-currency-input-field` | Currency masking | ❌ No - Add |

**Decision:** Use React Hook Form for superior performance and bundle size vs Formik.
**Rationale:**
- React Hook Form: 24kb min+gzip, uncontrolled components (better performance)
- Built-in Zod integration via `@hookform/resolvers/zod`
- GenHub already uses Zod for Server Action validation

---

## Validation Architecture

### Validation Schemas (Zod)

Create reusable validation schemas in `lib/validation/schemas.ts`:

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

// Field-level schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const phoneSchema = z
  .string()
  .regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be (XXX) XXX-XXXX')
  .or(z.string().length(0)); // Allow empty for optional fields

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code')
  .or(z.string().length(0));

export const currencySchema = z
  .number()
  .nonnegative('Amount must be positive')
  .or(z.string().transform((val) => {
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  }));

export const requiredStringSchema = z
  .string()
  .min(1, 'This field is required')
  .max(200, 'Must be less than 200 characters');

export const dateSchema = z.string().min(1, 'Date is required');

// Form-level schemas
export const createProjectSchema = z.object({
  project_type: z.string().min(1),
  name: requiredStringSchema,
  description: z.string().optional(),
  client_name: requiredStringSchema,
  client_email: emailSchema.optional(),
  client_phone: phoneSchema.optional(),
  address: requiredStringSchema,
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: zipCodeSchema.optional(),
  start_date: dateSchema,
  end_date: dateSchema.optional(),
  budget: currencySchema.optional(),
}).refine(
  (data) => {
    if (data.end_date && data.start_date) {
      return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

export const createTaskSchema = z.object({
  title: requiredStringSchema,
  description: z.string().optional(),
  project_id: z.string().uuid('Please select a project'),
  phase_id: z.string().uuid('Please select a phase'),
  assignee_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  start_date: dateSchema,
  due_date: dateSchema.optional(),
  planned_cost: currencySchema.optional(),
  actual_cost: currencySchema.optional(),
});

export const createExpenseSchema = z.object({
  project_id: z.string().uuid('Please select a project'),
  task_id: z.string().uuid().optional(),
  description: requiredStringSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.enum(['materials', 'labor', 'equipment', 'permits', 'transportation', 'meals', 'lodging', 'other']),
  expense_date: dateSchema,
  vendor_name: z.string().optional(),
});

export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  name: requiredStringSchema,
  role: z.enum(['admin', 'project_manager', 'foreman', 'field_worker', 'subcontractor', 'client']),
});

export const addSubcontractorSchema = z.object({
  company_name: requiredStringSchema,
  contact_name: requiredStringSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  trade_type: z.enum(['general', 'electrical', 'plumbing', 'hvac', 'carpentry', 'masonry', 'roofing', 'flooring', 'painting', 'drywall', 'concrete', 'landscaping', 'demolition', 'steel_work', 'glass_glazing', 'fire_protection', 'insulation', 'other']),
  address: z.string().optional(),
  license_number: z.string().optional(),
  insurance_provider: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
});
```

---

## Custom Hook: useValidatedForm

Create a wrapper hook around React Hook Form in `hooks/useValidatedForm.ts`:

```typescript
// hooks/useValidatedForm.ts
import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface UseValidatedFormOptions<TFieldValues extends FieldValues>
  extends Omit<UseFormProps<TFieldValues>, 'resolver'> {
  schema: z.ZodSchema<TFieldValues>;
}

export function useValidatedForm<TFieldValues extends FieldValues = FieldValues>({
  schema,
  ...options
}: UseValidatedFormOptions<TFieldValues>) {
  const form = useForm<TFieldValues>({
    ...options,
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur, not onChange for better UX
  });

  // Computed properties
  const isValid = form.formState.isValid;
  const isSubmitting = form.formState.isSubmitting;
  const canSubmit = isValid && !isSubmitting;

  return {
    ...form,
    isValid,
    isSubmitting,
    canSubmit, // Use this for submit button disabled state
  };
}
```

---

## Input Masking Components

### CurrencyInput Component

```typescript
// components/ui/CurrencyInput.tsx
'use client';

import { forwardRef, useId } from 'react';
import CurrencyInputField, { CurrencyInputProps as BaseCurrencyInputProps } from 'react-currency-input-field';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<BaseCurrencyInputProps, 'id'> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      hint,
      className,
      containerClassName,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium',
              hasError ? 'text-[#DC2626]' : 'text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        <CurrencyInputField
          ref={ref}
          id={inputId}
          disabled={disabled}
          prefix="$"
          decimalsLimit={2}
          decimalScale={2}
          allowNegativeValue={false}
          className={cn(
            // Base styles
            'block h-14 px-4 w-full',
            'text-base', // 16px - prevents iOS zoom
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',

            // Border
            'border rounded-xl',
            hasError
              ? 'border-[#DC2626] border-2'
              : 'border-gray-200 dark:border-gray-700',

            // Focus
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            hasError
              ? 'focus:ring-[#DC2626]/30 focus:border-[#DC2626]'
              : 'focus:ring-[var(--construction-blue)]/20 focus:border-construction-blue',

            // Disabled
            'disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed',

            // Touch optimization
            'touch-manipulation',

            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : hint ? hintId : undefined
          }
          {...props}
        />

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-[#DC2626] font-medium"
          >
            {error}
          </p>
        )}

        {hint && !hasError && (
          <p
            id={hintId}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
```

### PhoneInput Component

```typescript
// components/ui/PhoneInput.tsx
'use client';

import { forwardRef } from 'react';
import { MobileInput } from '@/components/mobile/MobileInput';
import { formatPhoneNumber } from '@/lib/hooks/usePhoneMask';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      const event = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      };
      onChange?.(event);
    };

    return (
      <MobileInput
        ref={ref}
        type="tel"
        inputMode="tel"
        enterKeyHint="next"
        value={value}
        onChange={handleChange}
        placeholder="(555) 123-4567"
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
```

---

## Form Integration Patterns

### Pattern 1: Simple Form (Single Step)

```typescript
// Example: InviteTeamMemberModal.tsx
'use client';

import { useValidatedForm } from '@/hooks/useValidatedForm';
import { inviteTeamMemberSchema } from '@/lib/validation/schemas';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { MobileInput } from '@/components/mobile/MobileInput';

export function InviteTeamMemberModal({ isOpen, onClose }: Props) {
  const { register, handleSubmit, formState: { errors }, canSubmit } = useValidatedForm({
    schema: inviteTeamMemberSchema,
  });

  const onSubmit = async (data: z.infer<typeof inviteTeamMemberSchema>) => {
    const result = await inviteTeamMember(data);
    if (result.success) onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      rightActions={
        <Button
          type="submit"
          form="invite-form"
          disabled={!canSubmit}
        >
          Send Invitation
        </Button>
      }
    >
      <form id="invite-form" onSubmit={handleSubmit(onSubmit)}>
        <MobileInput
          {...register('email')}
          label="Email"
          type="email"
          error={errors.email?.message}
        />

        <MobileInput
          {...register('name')}
          label="Name"
          error={errors.name?.message}
        />

        {/* Select for role - use Controller for complex components */}
      </form>
    </ResponsiveModal>
  );
}
```

### Pattern 2: Multi-Step Form (with Step Validation)

```typescript
// Example: CreateProjectForm.tsx
'use client';

import { useValidatedForm } from '@/hooks/useValidatedForm';
import { createProjectSchema } from '@/lib/validation/schemas';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { PhoneInput } from '@/components/ui/PhoneInput';

export function CreateProjectForm({ isOpen, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger, // For step validation
    canSubmit,
    watch,
  } = useValidatedForm({
    schema: createProjectSchema,
    mode: 'onBlur',
  });

  // Validate current step before proceeding
  const handleNext = async () => {
    let fieldsToValidate: string[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['name', 'client_name', 'client_email', 'client_phone'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['address', 'zip_code'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['start_date', 'end_date', 'budget'];
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmit = async (data: z.infer<typeof createProjectSchema>) => {
    const result = await createProject(data);
    if (result.success) onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      currentStep={currentStep + 1}
      totalSteps={4}
      onContinue={currentStep === 3 ? undefined : handleNext}
      continueDisabled={currentStep === 3 ? !canSubmit : false}
    >
      <form id="project-form" onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 1 && (
          <>
            <MobileInput
              {...register('name')}
              label="Project Name"
              error={errors.name?.message}
            />

            <MobileInput
              {...register('client_name')}
              label="Client Name"
              error={errors.client_name?.message}
            />

            <MobileInput
              {...register('client_email')}
              label="Email"
              type="email"
              error={errors.client_email?.message}
            />

            <PhoneInput
              {...register('client_phone')}
              label="Phone"
              error={errors.client_phone?.message}
            />
          </>
        )}

        {currentStep === 3 && (
          <>
            <MobileInput
              {...register('start_date')}
              label="Start Date"
              type="date"
              error={errors.start_date?.message}
            />

            <MobileInput
              {...register('end_date')}
              label="End Date"
              type="date"
              error={errors.end_date?.message}
            />

            <CurrencyInput
              {...register('budget')}
              label="Budget"
              error={errors.budget?.message}
            />
          </>
        )}
      </form>
    </ResponsiveModal>
  );
}
```

### Pattern 3: Form with Server Action

```typescript
// Example: CreateExpenseModal.tsx
'use client';

import { useValidatedForm } from '@/hooks/useValidatedForm';
import { createExpenseSchema } from '@/lib/validation/schemas';
import { Controller } from 'react-hook-form';

export function CreateExpenseModal({ onClose }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    canSubmit
  } = useValidatedForm({
    schema: createExpenseSchema,
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
      category: 'materials',
    },
  });

  const onSubmit = async (data: z.infer<typeof createExpenseSchema>) => {
    const result = await createExpense(data);
    if (result.success) {
      toast.success('Expense created');
      onClose();
    }
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      rightActions={
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={!canSubmit}
        >
          Submit Expense
        </Button>
      }
    >
      <form>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              {...field}
              label="Amount"
              error={errors.amount?.message}
            />
          )}
        />

        {/* Other fields... */}
      </form>
    </ResponsiveModal>
  );
}
```

---

## Error Handling

### Error Display Patterns

| Error Type | Display Pattern |
|------------|----------------|
| Field validation error | Red border + error text below field |
| Cross-field validation (e.g., date range) | Error on dependent field |
| Form-level error | Alert banner at top of form |
| Server error | Alert banner + preserve form state |

### Error Message Standards

```typescript
// lib/validation/error-messages.ts
export const ERROR_MESSAGES = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  phone: 'Phone must be (XXX) XXX-XXXX format',
  zipCode: 'Please enter a valid ZIP code',
  positiveNumber: 'Value must be positive',
  dateRange: 'End date must be after start date',
  maxLength: (max: number) => `Must be less than ${max} characters`,
  minLength: (min: number) => `Must be at least ${min} characters`,
};
```

---

## Mobile Optimization

### Virtual Keyboard Types

| Field Type | inputMode | enterKeyHint |
|------------|-----------|--------------|
| Email | `email` | `next` |
| Phone | `tel` | `next` |
| Currency | `decimal` | `next` |
| Quantity | `numeric` | `next` |
| Search | `search` | `search` |
| Message | `text` | `send` |
| Last field | (any) | `done` |

### Touch Targets

- Input height: 56px (h-14) minimum
- Button height: 44px minimum
- Error text: Positioned below field, not overlapping
- Labels: Above fields, not inside (better for accessibility)

---

## Performance Considerations

### Bundle Size Strategy

```typescript
// Instead of importing entire react-hook-form:
import { useForm } from 'react-hook-form'; // ❌ 90kb

// Tree-shake properly:
import { useForm, Controller } from 'react-hook-form'; // ✅ 24kb
```

### Validation Timing

- **onBlur**: Validate after user leaves field (default)
- **onChange**: Only validate after first blur (don't annoy users)
- **onSubmit**: Always validate before submission

### Debouncing

For expensive validations (e.g., async uniqueness checks):
```typescript
const { register } = useValidatedForm({
  schema,
  mode: 'onBlur',
  reValidateMode: 'onChange',
  shouldUnregister: false,
});
```

---

## Accessibility

### ARIA Attributes

All input components must include:
- `aria-invalid={hasError}` - Indicates validation state
- `aria-describedby={errorId}` - Links to error message
- `aria-required={required}` - Indicates required fields
- Proper `<label>` elements with `htmlFor` attribute

### Screen Reader Support

- Error messages use `role="alert"` for immediate announcement
- Field errors announced on blur
- Submit button disabled state has `aria-label` explaining why

---

## Migration Strategy

### Phase 1: New Forms
Apply validation to new forms first:
- CreateExpenseModal
- InviteTeamMemberModal
- AddSubcontractorModal

### Phase 2: Critical Forms
Migrate high-traffic forms:
- CreateProjectForm (enhance existing validation)
- TaskModal (replace custom validation)

### Phase 3: Remaining Forms
- Material assignment
- Settings forms
- Profile forms

### Backward Compatibility

Existing forms continue to work during migration:
- Custom validation logic remains until replaced
- MobileInput component already supports error prop
- No breaking changes to existing APIs

---

## Security Considerations

- **Client validation is UX, not security**: Server Actions still validate
- **Never trust client data**: All Server Actions use Zod schemas
- **Sanitize inputs**: React automatically escapes, but be careful with URLs
- **Rate limiting**: Server Actions handle submission rate limiting

---

## Testing Strategy

### Unit Tests (Validation Schemas)
```typescript
// lib/validation/__tests__/schemas.test.ts
describe('emailSchema', () => {
  it('validates correct email', () => {
    expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => emailSchema.parse('invalid')).toThrow();
  });
});
```

### Integration Tests (Forms)
Use Playwright to test:
- Field validation on blur
- Submit button disabled state
- Error message display
- Successful submission

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to tasks)
