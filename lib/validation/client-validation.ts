/**
 * Client-Side Validation Rules
 *
 * Native React Hook Form validation rules for client-side forms.
 * These provide immediate UX feedback before server validation.
 *
 * Note: Server Actions should still use Zod for server-side validation.
 * These client rules are for UX only, not security.
 */

"use client";

import { RegisterOptions } from "react-hook-form";

// ============================================================================
// FIELD-LEVEL VALIDATION RULES
// ============================================================================

/**
 * Email validation rules
 */
export const emailValidation = {
  required: "Email is required",
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: "Please enter a valid email address",
  },
};

/**
 * Optional email validation rules
 */
export const optionalEmailValidation = {
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: "Please enter a valid email address",
  },
};

/**
 * Phone number validation rules
 * Expects formatted phone: (XXX) XXX-XXXX
 */
export const phoneValidation = {
  pattern: {
    value: /^\(\d{3}\) \d{3}-\d{4}$/,
    message: "Phone must be (XXX) XXX-XXXX format",
  },
};

/**
 * ZIP code validation rules
 */
export const zipCodeValidation = {
  pattern: {
    value: /^\d{5}(-\d{4})?$/,
    message: "Please enter a valid ZIP code",
  },
};

/**
 * Required string validation rules
 */
export const requiredStringValidation = {
  required: "This field is required",
  maxLength: {
    value: 200,
    message: "Must be less than 200 characters",
  },
};

/**
 * Optional string validation rules
 */
export const optionalStringValidation = {
  maxLength: {
    value: 200,
    message: "Must be less than 200 characters",
  },
};

/**
 * Long text validation rules (for descriptions)
 */
export const longTextValidation = {
  maxLength: {
    value: 2000,
    message: "Must be less than 2000 characters",
  },
};

/**
 * Date validation rules
 */
export const dateValidation = {
  required: "Date is required",
};

/**
 * Optional date validation rules
 */
export const optionalDateValidation = {
  required: false,
};

/**
 * Currency validation rules
 */
export const currencyValidation = {
  required: false,
  min: {
    value: 0,
    message: "Amount must be positive",
  },
};

/**
 * Positive number validation rules
 */
export const positiveNumberValidation = {
  required: "This field is required",
  min: {
    value: 0.01,
    message: "Must be greater than 0",
  },
};

// ============================================================================
// FORM-SPECIFIC VALIDATION RULES
// ============================================================================

/**
 * Invite Team Member validation rules
 */
export const inviteTeamMemberValidation = {
  email: emailValidation,
  name: requiredStringValidation,
  role: {
    required: "Please select a role",
  },
};

/**
 * Manual Team Member addition validation rules
 */
export const manualTeamMemberValidation = {
  first_name: {
    required: "First name is required",
    maxLength: {
      value: 100,
      message: "First name must be less than 100 characters",
    },
  },
  last_name: {
    required: "Last name is required",
    maxLength: {
      value: 100,
      message: "Last name must be less than 100 characters",
    },
  },
  email: optionalEmailValidation,
  role: {
    required: "Please select a role",
  },
};

/**
 * Create Project validation rules
 */
export const createProjectValidation = {
  project_type: requiredStringValidation,
  name: requiredStringValidation,
  description: longTextValidation,
  client_name: requiredStringValidation,
  client_email: optionalEmailValidation,
  client_phone: phoneValidation,
  address: requiredStringValidation,
  city: optionalStringValidation,
  state: optionalStringValidation,
  zip_code: zipCodeValidation,
  start_date: dateValidation,
  end_date: optionalDateValidation,
  budget: currencyValidation,
};

/**
 * Create Expense validation rules
 */
export const createExpenseValidation = {
  project_id: { required: "Please select a project" },
  task_id: { required: false },
  description: requiredStringValidation,
  amount: {
    required: "Amount is required",
    validate: (v: string | number) => {
      const n = typeof v === "number" ? v : parseFloat(v);
      if (!Number.isFinite(n)) return "Amount is required";
      return n !== 0 || "Amount cannot be zero";
    },
  },
  category: { required: "Please select a category" },
  expense_date: dateValidation,
  vendor_name: optionalStringValidation,
};

/**
 * Add Subcontractor validation rules
 */
export const addSubcontractorValidation = {
  company_name: requiredStringValidation,
  contact_name: requiredStringValidation,
  email: optionalEmailValidation,
  phone: phoneValidation,
  trade_specialization: { required: "Please select a trade type" },
  address: optionalStringValidation,
  license_number: optionalStringValidation,
  insurance_provider: optionalStringValidation,
  rating: {
    min: { value: 0, message: "Rating must be between 0 and 5" },
    max: { value: 5, message: "Rating must be between 0 and 5" },
  },
  notes: longTextValidation,
};

/**
 * Assign Material validation rules
 */
export const assignMaterialValidation = {
  project_id: { required: "Please select a project" },
  phase_id: { required: "Please select a phase" },
  task_id: { required: "Please select a task" },
  quantity: {
    required: "Quantity is required",
    min: { value: 1, message: "Quantity must be at least 1" },
  },
};

/**
 * Email Sign In validation rules
 */
export const emailSignInValidation = {
  email: emailValidation,
};

// ============================================================================
// PASSWORD VALIDATION RULES
// ============================================================================

/**
 * Password validation rules for signup forms
 * Requirements: 8+ chars, uppercase, lowercase, number
 */
export const passwordValidation = {
  required: "Password is required",
  minLength: {
    value: 8,
    message: "Password must be at least 8 characters",
  },
  validate: {
    hasUppercase: (v: string) =>
      /[A-Z]/.test(v) || "Must contain an uppercase letter",
    hasLowercase: (v: string) =>
      /[a-z]/.test(v) || "Must contain a lowercase letter",
    hasNumber: (v: string) => /[0-9]/.test(v) || "Must contain a number",
  },
};

/**
 * Confirm password validation rules (factory function)
 * @param getPassword - Function that returns the password value to compare against
 */
export const confirmPasswordValidation = (getPassword: () => string) => ({
  required: "Please confirm your password",
  validate: (v: string) => v === getPassword() || "Passwords do not match",
});

/**
 * Invite signup form validation rules
 */
export const inviteSignupValidation = {
  name: requiredStringValidation,
  password: passwordValidation,
};
