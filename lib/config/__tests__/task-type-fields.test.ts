import { describe, it, expect } from '@jest/globals';
import {
  getTaskTypeConfig,
  isFieldVisible,
  TASK_TYPE_CONFIG,
  type FieldConfig,
} from '../task-type-fields';

/**
 * Debug: Unit tests for task type field visibility configuration
 */
describe('Task Type Field Configuration', () => {
  describe('getTaskTypeConfig', () => {
    // Debug: Test work type configuration
    it('returns correct config for work type', () => {
      const config = getTaskTypeConfig('work');

      expect(config.visibility.materialsSection).toBe(false);
      expect(config.visibility.expensesSection).toBe(true);
      expect(config.labels.plannedCost).toBe('Labor Cost');
      expect(config.defaults.startDate).toBe('today');
    });

    // Debug: Test purchase type configuration
    it('returns correct config for purchase type', () => {
      const config = getTaskTypeConfig('purchase');

      expect(config.visibility.materialsSection).toBe(true);
      expect(config.labels.plannedCost).toBe('Budget');
      expect(config.defaults.startDate).toBe('today');
    });

    // Debug: Test approval type configuration
    it('returns correct config for approval type', () => {
      const config = getTaskTypeConfig('approval');

      expect(config.visibility.plannedCost).toBe(false);
      expect(config.visibility.actualCost).toBe(false);
      expect(config.visibility.approvalWorkflow).toBe(true);
      expect(config.styling.headerBadge).toBe('approval_status');
      expect(config.defaults.startDate).toBe('today');
    });

    // Debug: Test admin type configuration
    it('returns correct config for admin type', () => {
      const config = getTaskTypeConfig('admin');

      expect(config.visibility.phase).toBe(false);
      expect(config.visibility.startDate).toBe(false);
      expect(config.visibility.plannedCost).toBe(false);
      expect(config.defaults.priority).toBe('low');
    });

    // Debug: Test null type defaults to work
    it('defaults to work config when type is null', () => {
      const config = getTaskTypeConfig(null);
      const workConfig = getTaskTypeConfig('work');

      expect(config).toEqual(workConfig);
    });
  });

  describe('isFieldVisible', () => {
    // Debug: Test edit-only fields in create mode
    it('hides edit-only fields in create mode', () => {
      expect(isFieldVisible('work', 'actualCost', 'create')).toBe(false);
      expect(isFieldVisible('work', 'expensesSection', 'create')).toBe(false);
      expect(isFieldVisible('work', 'addExpenseButton', 'create')).toBe(false);

      expect(isFieldVisible('purchase', 'actualCost', 'create')).toBe(false);
      expect(isFieldVisible('purchase', 'expensesSection', 'create')).toBe(false);
    });

    // Debug: Test edit-only fields in edit mode
    it('shows edit-only fields in edit mode for work type', () => {
      expect(isFieldVisible('work', 'actualCost', 'edit')).toBe(true);
      expect(isFieldVisible('work', 'expensesSection', 'edit')).toBe(true);
      expect(isFieldVisible('work', 'addExpenseButton', 'edit')).toBe(true);
    });

    // Debug: Test edit-only fields in edit mode for purchase type
    it('shows edit-only fields in edit mode for purchase type', () => {
      expect(isFieldVisible('purchase', 'actualCost', 'edit')).toBe(true);
      expect(isFieldVisible('purchase', 'expensesSection', 'edit')).toBe(true);
      expect(isFieldVisible('purchase', 'addExpenseButton', 'edit')).toBe(true);
    });

    // Debug: Test materials section visibility
    it('shows materials section only for purchase tasks', () => {
      expect(isFieldVisible('work', 'materialsSection', 'create')).toBe(false);
      expect(isFieldVisible('purchase', 'materialsSection', 'create')).toBe(true);
      expect(isFieldVisible('approval', 'materialsSection', 'create')).toBe(false);
      expect(isFieldVisible('admin', 'materialsSection', 'create')).toBe(false);
    });

    // Debug: Test approval workflow visibility
    it('shows approval workflow only for approval tasks', () => {
      expect(isFieldVisible('work', 'approvalWorkflow', 'create')).toBe(false);
      expect(isFieldVisible('purchase', 'approvalWorkflow', 'create')).toBe(false);
      expect(isFieldVisible('approval', 'approvalWorkflow', 'create')).toBe(true);
      expect(isFieldVisible('admin', 'approvalWorkflow', 'create')).toBe(false);
    });

    // Debug: Test phase field visibility
    it('hides phase field for admin tasks', () => {
      expect(isFieldVisible('work', 'phase', 'create')).toBe(true);
      expect(isFieldVisible('purchase', 'phase', 'create')).toBe(true);
      expect(isFieldVisible('approval', 'phase', 'create')).toBe(true);
      expect(isFieldVisible('admin', 'phase', 'create')).toBe(false);
    });

    // Debug: Test start date field visibility
    it('hides start date field for admin tasks', () => {
      expect(isFieldVisible('work', 'startDate', 'create')).toBe(true);
      expect(isFieldVisible('purchase', 'startDate', 'create')).toBe(true);
      expect(isFieldVisible('approval', 'startDate', 'create')).toBe(true);
      expect(isFieldVisible('admin', 'startDate', 'create')).toBe(false);
    });

    // Debug: Test cost fields for approval and admin
    it('hides cost fields for approval and admin tasks', () => {
      expect(isFieldVisible('approval', 'plannedCost', 'create')).toBe(false);
      expect(isFieldVisible('admin', 'plannedCost', 'create')).toBe(false);

      expect(isFieldVisible('work', 'plannedCost', 'create')).toBe(true);
      expect(isFieldVisible('purchase', 'plannedCost', 'create')).toBe(true);
    });

    // Debug: Test always-visible fields
    it('always shows required fields for all task types', () => {
      const taskTypes: Array<'work' | 'purchase' | 'approval' | 'admin'> = ['work', 'purchase', 'approval', 'admin'];
      const alwaysVisibleFields: Array<keyof import('../task-type-fields').FieldVisibility> = [
        'title',
        'description',
        'project',
        'assignee',
        'priority',
        'dueDate',
      ];

      taskTypes.forEach(taskType => {
        alwaysVisibleFields.forEach(field => {
          expect(isFieldVisible(taskType, field, 'create')).toBe(true);
        });
      });
    });
  });

  describe('TASK_TYPE_CONFIG', () => {
    // Debug: Test all task types are defined
    it('defines configuration for all task types', () => {
      expect(TASK_TYPE_CONFIG.work).toBeDefined();
      expect(TASK_TYPE_CONFIG.purchase).toBeDefined();
      expect(TASK_TYPE_CONFIG.approval).toBeDefined();
      expect(TASK_TYPE_CONFIG.admin).toBeDefined();
    });

    // Debug: Test each config has required properties
    it('each config has all required properties', () => {
      const taskTypes: Array<'work' | 'purchase' | 'approval' | 'admin'> = ['work', 'purchase', 'approval', 'admin'];

      taskTypes.forEach(taskType => {
        const config = TASK_TYPE_CONFIG[taskType];

        expect(config).toHaveProperty('visibility');
        expect(config).toHaveProperty('labels');
        expect(config).toHaveProperty('defaults');
        expect(config).toHaveProperty('styling');

        expect(config.labels).toHaveProperty('plannedCost');
      });
    });
  });
});
