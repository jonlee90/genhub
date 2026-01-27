/**
 * Simplified task type field configuration
 * Now that users can create custom task types, all fields are visible by default
 * This file only maintains label customization and default values
 */

/**
 * Field configuration interface
 * Simplified to only include labels and defaults (no visibility control)
 */
export interface FieldConfig {
  labels: {
    plannedCost: string; // "Planned Cost" for all types
  };
}

/**
 * Default field configuration
 * All fields are now visible for all task types
 */
const DEFAULT_CONFIG: FieldConfig = {
  labels: {
    plannedCost: 'Planned Cost',
  },
};

/**
 * Get config for a task type
 * Returns the default configuration (all fields visible)
 */
export function getTaskTypeConfig(): FieldConfig {
  return DEFAULT_CONFIG;
}
