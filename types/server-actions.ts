/**
 * Standardized Server Action Result Types
 *
 * Use these discriminated unions for type-safe error handling in Server Actions.
 * The success field acts as a discriminator for TypeScript type narrowing.
 *
 * @example
 * ```typescript
 * export async function getItems(): Promise<ActionResult<Item[]>> {
 *   try {
 *     const items = await fetchItems();
 *     return { success: true, data: items };
 *   } catch (error) {
 *     return { success: false, error: "Failed to fetch items" };
 *   }
 * }
 *
 * // Usage in component:
 * const result = await getItems();
 * if (result.success) {
 *   console.log(result.data); // TypeScript knows data exists
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 * ```
 */

// ============================================
// Base Action Results
// ============================================

/**
 * Standard action result with data on success, error message on failure
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Action result for mutations that don't return data
 * Used for delete, update operations where only success/failure matters
 */
export type MutationResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Action result with optional field-level validation errors
 * Used for form submissions where individual fields may have errors
 */
export type FormActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ============================================
// Migration Helper Types (Optional Fields)
// ============================================
// Use these during migration from old pattern to new pattern
// Remove these after full migration is complete

/**
 * @deprecated Use ActionResult<T> instead
 * Legacy pattern with optional fields - harder to type narrow
 */
export type LegacyActionResult<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

/**
 * @deprecated Use FormActionResult<T> instead
 * Legacy pattern for form actions with optional fields
 */
export type LegacyFormActionResult<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};
