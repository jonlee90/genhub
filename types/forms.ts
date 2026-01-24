/**
 * Form Type Helpers
 *
 * Centralized TypeScript types for form validation and data handling.
 * All types are inferred from Zod schemas for type safety.
 *
 * Usage:
 * ```tsx
 * import type { CreateProjectFormData, FormFieldErrors } from '@/types/forms';
 *
 * const onSubmit = async (data: CreateProjectFormData) => {
 *   // data is fully typed
 * };
 * ```
 */

import type { FieldErrors, FieldValues } from 'react-hook-form';

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Form data types for client-side forms
 * These match the Server Action types but are used for client validation
 */
export interface InviteTeamMemberFormData {
  email: string;
  name: string;
  role: 'admin' | 'project_manager' | 'foreman' | 'field_worker' | 'subcontractor' | 'client';
}

export interface CreateProjectFormData {
  project_type: string;
  name: string;
  description?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  start_date: string;
  end_date?: string;
  budget?: number;
}

export interface CreateExpenseFormData {
  project_id: string;
  task_id?: string;
  description: string;
  amount: number;
  category: 'materials' | 'labor' | 'equipment' | 'permits' | 'transportation' | 'meals' | 'lodging' | 'other';
  expense_date: string;
  vendor_name?: string;
}

export interface AddSubcontractorFormData {
  company_name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  trade_type: string;
  address?: string;
  license_number?: string;
  insurance_provider?: string;
  rating?: number;
  notes?: string;
}

export interface AssignMaterialFormData {
  project_id: string;
  phase_id?: string;
  task_id?: string;
  quantity: number;
}

export interface EmailSignInFormData {
  email: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract field names from form data type
 *
 * @example
 * ```tsx
 * type Fields = FormFieldNames<CreateProjectFormData>;
 * // Fields = 'name' | 'description' | 'start_date' | ...
 * ```
 */
export type FormFieldNames<T extends FieldValues> = keyof T;

/**
 * Extract field error messages from form data type
 *
 * @example
 * ```tsx
 * const errors: FormFieldErrors<CreateProjectFormData> = formState.errors;
 * ```
 */
export type FormFieldErrors<T extends FieldValues> = FieldErrors<T>;

/**
 * Form submission result type
 * Standard shape for Server Action responses
 */
export interface FormSubmissionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Form validation error type
 * Represents a single field validation error
 */
export interface FormValidationError {
  field: string;
  message: string;
}

/**
 * Form state for multi-step forms
 * Tracks current step, validation, and completion
 */
export interface MultiStepFormState {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  isLastStep: boolean;
  isFirstStep: boolean;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Base props for form input components
 * Extend this for custom input components
 */
export interface BaseFormInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Props for text input components
 */
export interface TextInputProps extends BaseFormInputProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
}

/**
 * Props for number input components
 */
export interface NumberInputProps extends BaseFormInputProps {
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  inputMode?: 'numeric' | 'decimal';
}

/**
 * Props for currency input components
 */
export interface CurrencyInputProps extends BaseFormInputProps {
  placeholder?: string;
  allowNegative?: boolean;
  prefix?: string;
  decimalScale?: number;
}

/**
 * Props for select/dropdown components
 */
export interface SelectInputProps<T = string> extends BaseFormInputProps {
  options: Array<{ value: T; label: string; description?: string }>;
  placeholder?: string;
  value?: T;
  onChange?: (value: T) => void;
}

/**
 * Props for date input components
 */
export interface DateInputProps extends BaseFormInputProps {
  min?: string;
  max?: string;
  placeholder?: string;
}

/**
 * Props for textarea components
 */
export interface TextareaProps extends BaseFormInputProps {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

/**
 * Validation mode for React Hook Form
 * Determines when validation is triggered
 */
export type ValidationMode =
  | 'onBlur'       // Validate when input loses focus (recommended)
  | 'onChange'     // Validate on every keystroke
  | 'onSubmit'     // Validate only on form submission
  | 'onTouched'    // Validate after field is touched
  | 'all';         // Validate on all events

/**
 * Validation rule type
 * Represents a single validation rule for a field
 */
export interface ValidationRule<T = unknown> {
  validator: (value: T) => boolean | string;
  message?: string;
}

/**
 * Field validation result
 * Result of validating a single field
 */
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// FORM HANDLER TYPES
// ============================================================================

/**
 * Generic form submit handler
 * Use this type for type-safe submit handlers
 *
 * @example
 * ```tsx
 * const onSubmit: FormSubmitHandler<CreateProjectFormData> = async (data) => {
 *   const result = await createProject(data);
 *   // handle result
 * };
 * ```
 */
export type FormSubmitHandler<T extends FieldValues> = (data: T) => void | Promise<void>;

/**
 * Form error handler
 * Handles validation errors from form submission
 */
export type FormErrorHandler<T extends FieldValues> = (errors: FormFieldErrors<T>) => void;

/**
 * Form reset handler
 * Resets form to initial or provided values
 */
export type FormResetHandler<T extends FieldValues> = (values?: Partial<T>) => void;

// ============================================================================
// SPECIFIC FORM TYPES
// ============================================================================

/**
 * Create Project form step fields
 * Maps form steps to their field names
 */
export const CREATE_PROJECT_STEP_FIELDS = {
  type: ['project_type'] as const,
  details: ['name', 'description'] as const,
  client: ['client_name', 'client_email', 'client_phone'] as const,
  location: ['address', 'city', 'state', 'zip_code'] as const,
  timeline: ['start_date', 'end_date', 'budget'] as const,
} as const;

/**
 * Create Task form step fields
 * Maps form steps to their field names
 */
export const CREATE_TASK_STEP_FIELDS = {
  basic: ['title', 'description', 'priority'] as const,
  assignment: ['project_id', 'phase_id', 'assignee_id'] as const,
  schedule: ['start_date', 'due_date'] as const,
  budget: ['planned_cost', 'actual_cost'] as const,
} as const;

/**
 * Form default values type helper
 * Ensures default values match form schema
 *
 * @example
 * ```tsx
 * const defaultValues: FormDefaultValues<CreateProjectFormData> = {
 *   name: '',
 *   start_date: new Date().toISOString().split('T')[0],
 *   // All fields are type-checked
 * };
 * ```
 */
export type FormDefaultValues<T extends FieldValues> = Partial<T>;

/**
 * Form field path type
 * Represents a dot-notation path to a nested field
 *
 * @example
 * ```tsx
 * type Path = FieldPath<CreateProjectFormData>;
 * // Path = 'name' | 'client_name' | 'start_date' | ...
 * ```
 */
export type FieldPath<T extends FieldValues> = keyof T extends string
  ? keyof T
  : never;

// ============================================================================
// SERVER ACTION TYPES
// ============================================================================

/**
 * Server Action form state
 * Standard state shape for useActionState
 */
export interface ServerActionFormState<T = unknown> {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  data?: T;
}

/**
 * Server Action handler type
 * Type-safe server action that accepts FormData
 */
export type ServerActionHandler<T = unknown> = (
  prevState: ServerActionFormState<T>,
  formData: FormData
) => Promise<ServerActionFormState<T>>;

/**
 * Typed Server Action handler
 * Server action that accepts typed data instead of FormData
 */
export type TypedServerActionHandler<TInput, TOutput = unknown> = (
  data: TInput
) => Promise<FormSubmissionResult<TOutput>>;

// ============================================================================
// FORM CONTEXT TYPES
// ============================================================================

/**
 * Form context data type
 * Used for pre-filling forms from context (e.g., selected task)
 */
export interface FormContextData {
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Form preset values
 * Used for pre-populating form fields from external data
 */
export type FormPresetValues<T extends FieldValues> = Partial<T>;

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Cross-field validation function
 * Used for validating relationships between fields
 */
export type CrossFieldValidation<T extends FieldValues> = (
  data: T
) => boolean | string;

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

/**
 * ARIA attributes for form inputs
 * Ensures accessibility compliance
 */
export interface FormInputAriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-disabled'?: boolean;
}

/**
 * Form field metadata
 * Additional metadata for form fields (accessibility, help text, etc.)
 */
export interface FormFieldMetadata {
  label: string;
  description?: string;
  hint?: string;
  required?: boolean;
  ariaLabel?: string;
}

// ============================================================================
// EXPORT ALIASES (for convenient imports)
// ============================================================================

/**
 * All form data types are already exported above via re-export from schemas
 * No need for additional namespace exports
 */
