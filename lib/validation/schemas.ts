/**
 * Validation Schemas
 *
 * Comprehensive Zod schemas for form validation across GenHub.
 * These schemas provide client-side validation with detailed error messages.
 *
 * Note: Server Actions should have their own validation schemas.
 * These client schemas are for UX only, not security.
 */

import { z } from 'zod';

// ============================================================================
// FIELD-LEVEL SCHEMAS
// ============================================================================

/**
 * Email validation schema
 * Validates RFC 5322 compliant email addresses
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

/**
 * Optional email validation schema
 * Allows empty string or valid email
 */
export const optionalEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .or(z.string().length(0));

/**
 * Phone number validation schema
 * Expects formatted phone: (XXX) XXX-XXXX
 */
export const phoneSchema = z
  .string()
  .regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be (XXX) XXX-XXXX format')
  .or(z.string().length(0));

/**
 * ZIP code validation schema
 * Accepts 5-digit or 9-digit (XXXXX-XXXX) format
 */
export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code')
  .or(z.string().length(0));

/**
 * Currency validation schema
 * Accepts positive numbers or formatted currency strings
 */
export const currencySchema = z
  .number()
  .nonnegative('Amount must be positive')
  .or(
    z.string().transform((val) => {
      // Remove currency formatting and parse
      const cleaned = val.replace(/[^0-9.-]+/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    })
  );

/**
 * Optional currency validation schema
 * Allows undefined for optional budget/cost fields
 */
export const optionalCurrencySchema = z
  .number()
  .nonnegative('Amount must be positive')
  .optional()
  .or(z.string().transform((val) => {
    if (!val) return undefined;
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }));

/**
 * Required string validation schema
 * Used for text inputs that must not be empty
 */
export const requiredStringSchema = z
  .string()
  .min(1, 'This field is required')
  .max(200, 'Must be less than 200 characters')
  .transform((val) => val.trim());

/**
 * Optional string validation schema
 * Allows empty strings for optional text fields
 */
export const optionalStringSchema = z
  .string()
  .max(200, 'Must be less than 200 characters')
  .optional()
  .or(z.string().length(0).transform(() => undefined));

/**
 * Long text validation schema
 * For description fields with higher character limits
 */
export const longTextSchema = z
  .string()
  .max(2000, 'Must be less than 2000 characters')
  .optional()
  .or(z.string().length(0).transform(() => undefined));

/**
 * Date validation schema
 * Ensures date is provided and in valid format
 */
export const dateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format');

/**
 * Optional date validation schema
 */
export const optionalDateSchema = z
  .string()
  .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date format')
  .optional()
  .or(z.string().length(0).transform(() => undefined));

/**
 * UUID validation schema
 * For validating entity IDs
 */
export const uuidSchema = z
  .string()
  .uuid('Please select a valid option');

/**
 * Optional UUID validation schema
 */
export const optionalUuidSchema = z
  .string()
  .uuid('Please select a valid option')
  .optional()
  .or(z.string().length(0).transform(() => undefined));

// ============================================================================
// FORM-LEVEL SCHEMAS
// ============================================================================

/**
 * Create Project validation schema
 * Validates all steps of the project creation form
 */
export const createProjectSchema = z
  .object({
    // Step 1: Project Type
    project_type: requiredStringSchema,

    // Step 2: Basic Info
    name: requiredStringSchema,
    description: longTextSchema,

    // Step 3: Client Info
    client_name: requiredStringSchema,
    client_email: optionalEmailSchema,
    client_phone: phoneSchema,

    // Step 4: Location
    address: requiredStringSchema,
    city: optionalStringSchema,
    state: optionalStringSchema,
    zip_code: zipCodeSchema,

    // Step 5: Timeline & Budget
    start_date: dateSchema,
    end_date: optionalDateSchema,
    budget: optionalCurrencySchema,
  })
  .refine(
    (data) => {
      // Cross-field validation: end_date must be after start_date
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

/**
 * Create Task validation schema
 */
export const createTaskSchema = z
  .object({
    title: requiredStringSchema,
    description: longTextSchema,
    project_id: uuidSchema,
    phase_id: uuidSchema,
    assignee_id: optionalUuidSchema,
    priority: z.enum(['low', 'medium', 'high']),
    start_date: dateSchema,
    due_date: optionalDateSchema,
    planned_cost: optionalCurrencySchema,
    actual_cost: optionalCurrencySchema,
  })
  .refine(
    (data) => {
      // Cross-field validation: due_date must be after start_date
      if (data.due_date && data.start_date) {
        return new Date(data.due_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'Due date must be on or after start date',
      path: ['due_date'],
    }
  );

/**
 * Create Expense validation schema
 */
export const createExpenseSchema = z.object({
  project_id: uuidSchema,
  task_id: optionalUuidSchema,
  description: requiredStringSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.enum([
    'materials',
    'labor',
    'equipment',
    'permits',
    'transportation',
    'meals',
    'lodging',
    'other',
  ]),
  expense_date: dateSchema,
  vendor_name: optionalStringSchema,
});

/**
 * Invite Team Member validation schema
 */
export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  name: requiredStringSchema,
  role: z.enum([
    'admin',
    'project_manager',
    'foreman',
    'field_worker',
    'subcontractor',
    'client',
  ]),
});

/**
 * Add Subcontractor validation schema
 */
export const addSubcontractorSchema = z.object({
  company_name: requiredStringSchema,
  contact_name: requiredStringSchema,
  email: optionalEmailSchema,
  phone: phoneSchema,
  trade_type: z.enum([
    'general',
    'electrical',
    'plumbing',
    'hvac',
    'carpentry',
    'masonry',
    'roofing',
    'flooring',
    'painting',
    'drywall',
    'concrete',
    'landscaping',
    'demolition',
    'steel_work',
    'glass_glazing',
    'fire_protection',
    'insulation',
    'other',
  ]),
  address: optionalStringSchema,
  license_number: optionalStringSchema,
  insurance_provider: optionalStringSchema,
  rating: z
    .number()
    .min(0, 'Rating must be between 0 and 5')
    .max(5, 'Rating must be between 0 and 5')
    .optional(),
  notes: longTextSchema,
});

/**
 * Assign Material validation schema
 */
export const assignMaterialSchema = z.object({
  project_id: uuidSchema,
  phase_id: optionalUuidSchema,
  task_id: optionalUuidSchema,
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .int('Quantity must be a whole number'),
});

/**
 * Email Sign In validation schema
 */
export const emailSignInSchema = z.object({
  email: emailSchema,
});

/**
 * Phase Template validation schema
 */
export const phaseTemplateSchema = z.object({
  name: requiredStringSchema,
  description: optionalStringSchema,
});

/**
 * Project Type validation schema
 */
export const projectTypeSchema = z.object({
  name: requiredStringSchema,
  description: optionalStringSchema,
});

/**
 * Task Type validation schema
 */
export const taskTypeSchema = z.object({
  name: requiredStringSchema,
  description: optionalStringSchema,
});

/**
 * Task Template validation schema
 */
export const taskTemplateSchema = z.object({
  title: requiredStringSchema,
  description: longTextSchema,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 * Use these types for form state and component props
 */
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
export type InviteTeamMemberFormData = z.infer<typeof inviteTeamMemberSchema>;
export type AddSubcontractorFormData = z.infer<typeof addSubcontractorSchema>;
export type AssignMaterialFormData = z.infer<typeof assignMaterialSchema>;
export type EmailSignInFormData = z.infer<typeof emailSignInSchema>;
export type PhaseTemplateFormData = z.infer<typeof phaseTemplateSchema>;
export type ProjectTypeFormData = z.infer<typeof projectTypeSchema>;
export type TaskTypeFormData = z.infer<typeof taskTypeSchema>;
export type TaskTemplateFormData = z.infer<typeof taskTemplateSchema>;
