/**
 * Error Messages Constants
 *
 * Centralized error messages for form validation.
 * Provides consistent, user-friendly error messages across GenHub.
 *
 * Messages follow GenHub tone:
 * - Clear and concise
 * - Actionable (tell user what to do)
 * - Professional but friendly
 * - No technical jargon
 */

// ============================================================================
// STANDARD ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Required fields
  required: 'This field is required',

  // Email validation
  email: 'Please enter a valid email address',
  emailRequired: 'Email is required',
  emailInvalid: 'Please enter a valid email address',

  // Phone validation
  phone: 'Phone must be (XXX) XXX-XXXX format',
  phoneRequired: 'Phone number is required',
  phoneInvalid: 'Please enter a valid 10-digit phone number',
  phoneIncomplete: 'Phone number must be 10 digits',

  // ZIP code validation
  zipCode: 'Please enter a valid ZIP code',
  zipCodeInvalid: 'ZIP code must be 5 digits or XXXXX-XXXX format',

  // Currency/number validation
  positiveNumber: 'Value must be positive',
  positiveAmount: 'Amount must be greater than 0',
  nonNegative: 'Amount must be 0 or greater',
  invalidNumber: 'Please enter a valid number',
  wholeNumber: 'Value must be a whole number',

  // Date validation
  dateRequired: 'Date is required',
  dateInvalid: 'Invalid date format',
  dateRange: 'End date must be after start date',
  dateFuture: 'Date must be in the future',
  datePast: 'Date must be in the past',
  dueDate: 'Due date must be on or after start date',

  // Selection validation
  selectRequired: 'Please select an option',
  selectProject: 'Please select a project',
  selectPhase: 'Please select a phase',
  selectTask: 'Please select a task',
  selectCategory: 'Please select a category',

  // Text length validation
  tooLong: 'Text is too long',
  tooShort: 'Text is too short',

  // UUID validation
  invalidId: 'Please select a valid option',
  invalidSelection: 'Invalid selection',

  // Rating validation
  ratingRange: 'Rating must be between 0 and 5',

  // Generic
  invalid: 'Invalid value',
  serverError: 'Something went wrong. Please try again.',
  networkError: 'Network error. Please check your connection.',
} as const;

// ============================================================================
// DYNAMIC ERROR MESSAGE FUNCTIONS
// ============================================================================

/**
 * Generate error message for maximum length validation
 */
export function maxLengthMessage(max: number): string {
  return `Must be less than ${max} characters`;
}

/**
 * Generate error message for minimum length validation
 */
export function minLengthMessage(min: number): string {
  return `Must be at least ${min} characters`;
}

/**
 * Generate error message for exact length validation
 */
export function exactLengthMessage(length: number): string {
  return `Must be exactly ${length} characters`;
}

/**
 * Generate error message for range validation
 */
export function rangeMessage(min: number, max: number): string {
  return `Must be between ${min} and ${max}`;
}

/**
 * Generate error message for minimum value validation
 */
export function minValueMessage(min: number): string {
  return `Must be at least ${min}`;
}

/**
 * Generate error message for maximum value validation
 */
export function maxValueMessage(max: number): string {
  return `Must be no more than ${max}`;
}

/**
 * Generate error message for required field with field name
 */
export function requiredFieldMessage(fieldName: string): string {
  return `${fieldName} is required`;
}

/**
 * Generate error message for invalid field with field name
 */
export function invalidFieldMessage(fieldName: string): string {
  return `${fieldName} is invalid`;
}

// ============================================================================
// TYPE-SAFE ERROR MESSAGE HELPERS
// ============================================================================

/**
 * Type for error message keys
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Get error message by key
 */
export function getErrorMessage(key: ErrorMessageKey): string {
  return ERROR_MESSAGES[key];
}

/**
 * Check if error message exists
 */
export function hasErrorMessage(key: string): key is ErrorMessageKey {
  return key in ERROR_MESSAGES;
}

// ============================================================================
// FIELD-SPECIFIC ERROR MESSAGES
// ============================================================================

/**
 * Error messages for project forms
 */
export const PROJECT_ERROR_MESSAGES = {
  name: 'Project name is required',
  type: 'Please select a project type',
  clientName: 'Client name is required',
  address: 'Project address is required',
  startDate: 'Start date is required',
  endDate: 'End date must be after start date',
  budget: 'Budget must be a positive amount',
} as const;

/**
 * Error messages for task forms
 */
export const TASK_ERROR_MESSAGES = {
  title: 'Task title is required',
  project: 'Please select a project',
  phase: 'Please select a phase',
  priority: 'Please select a priority',
  startDate: 'Start date is required',
  dueDate: 'Due date must be on or after start date',
  cost: 'Cost must be a positive amount',
} as const;

/**
 * Error messages for expense forms
 */
export const EXPENSE_ERROR_MESSAGES = {
  project: 'Please select a project',
  description: 'Description is required',
  amount: 'Amount must be greater than 0',
  category: 'Please select a category',
  date: 'Expense date is required',
} as const;

/**
 * Error messages for team forms
 */
export const TEAM_ERROR_MESSAGES = {
  email: 'Please enter a valid email address',
  name: 'Name is required',
  role: 'Please select a role',
  companyName: 'Company name is required',
  contactName: 'Contact name is required',
  tradeType: 'Please select a trade type',
} as const;

/**
 * Error messages for material forms
 */
export const MATERIAL_ERROR_MESSAGES = {
  project: 'Please select a project',
  quantity: 'Quantity must be greater than 0',
  quantityWhole: 'Quantity must be a whole number',
} as const;
