/**
 * useTaskFormState - Centralized form state management for TaskModal
 * Extracted from TaskModal.tsx to reduce complexity and improve testability
 *
 * Manages:
 * - Form field states (title, description, dates, costs, etc.)
 * - Task type configuration
 * - Multi-assignee selection
 * - Temporary materials
 * - Receipt photo handling
 * - Auto-expense settings
 */
'use client';

import { useState, useMemo } from 'react';
import { getTaskTypeConfig } from '@/lib/config/task-type-fields';
import type { TaskType, TaskStatus, TaskPriority } from '@/types/db/task';
import type { TaskAssignee } from '@/app/actions/tasks';
import type { TempMaterial } from '@/components/tasks/TaskMaterialsManager';
import type { TasksRow } from '@/types/db/tables/tasks';

interface Task extends TasksRow {
  assignees?: Array<{
    id: string;
    user_id: string | null;
    subcontractor_id: string | null;
    user?: { id: string; name: string; avatar_url: string | null } | null;
    subcontractor?: { id: string; contact_name: string; company_name: string } | null;
  }>;
}

interface UseTaskFormStateProps {
  mode: 'create' | 'edit';
  task?: Task | null;
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
}

export function useTaskFormState({
  mode,
  task,
  preselectedProjectId,
  preselectedPhaseId,
}: UseTaskFormStateProps) {
  // Step state for create mode (Step 1: Select Type, Step 2: Fill Form)
  const [currentStep, setCurrentStep] = useState<1 | 2>(mode === 'edit' ? 2 : 1);

  // Task type state
  const [taskType, setTaskType] = useState<TaskType | null>(() => {
    if (mode === 'edit' && task) return task.task_type;
    return null;
  });

  // Get field config (simplified - no visibility control)
  const config = useMemo(() => {
    return getTaskTypeConfig();
  }, []);

  // Basic form fields
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    if (mode === 'edit' && task) return task.project_id;
    return preselectedProjectId || '';
  });

  const [title, setTitle] = useState(() => {
    if (mode === 'edit' && task) return task.title;
    return '';
  });

  const [description, setDescription] = useState(() => {
    if (mode === 'edit' && task) return task.description || '';
    return '';
  });

  const [assigneeId, setAssigneeId] = useState(() => {
    if (mode === 'edit' && task) return task.assignee_id || 'none';
    return 'none';
  });

  const [priority, setPriority] = useState<string>(() => {
    if (mode === 'edit' && task) return task.priority;
    return 'medium';
  });

  const [phaseId, setPhaseId] = useState(() => {
    if (mode === 'edit' && task) return task.phase_id || 'none';
    return preselectedPhaseId || 'none';
  });

  const [startDate, setStartDate] = useState(() => {
    if (mode === 'edit' && task && task.start_date) {
      return task.start_date.split('T')[0];
    }
    return '';
  });

  const [dueDate, setDueDate] = useState(() => {
    if (mode === 'edit' && task && task.due_date) {
      return task.due_date.split('T')[0];
    }
    return '';
  });

  const [plannedCost, setPlannedCost] = useState(() => {
    if (mode === 'edit' && task) return task.planned_cost?.toString() || '';
    return '';
  });

  const [actualCost, setActualCost] = useState(() => {
    if (mode === 'edit' && task) return task.actual_cost?.toString() || '';
    return '';
  });

  const [status, setStatus] = useState<string>(() => {
    if (mode === 'edit' && task) return task.status;
    return 'todo';
  });

  // Multi-assignee state
  const [selectedAssignees, setSelectedAssignees] = useState<TaskAssignee[]>(() => {
    if (mode === 'edit' && task?.assignees) {
      return task.assignees
        .map((a) => ({
          id: a.user_id || a.subcontractor_id || '',
          type: (a.user_id ? 'user' : 'subcontractor') as 'user' | 'subcontractor',
        }))
        .filter((a): a is TaskAssignee => !!a.id);
    }
    return [];
  });

  // Materials and expenses
  const [tempMaterials, setTempMaterials] = useState<TempMaterial[]>([]);

  // Receipt photo
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(() => {
    if (mode === 'edit' && task?.receipt_photo_url) return task.receipt_photo_url;
    return null;
  });

  // Auto-expense settings
  const [autoExpenseEnabled, setAutoExpenseEnabled] = useState(true);
  const [primaryAssigneeId, setPrimaryAssigneeId] = useState<string | null>(null);

  // Approval workflow
  const [approvalNotes, setApprovalNotes] = useState('');

  // Build FormData for submission
  const buildFormData = () => {
    const formData = new FormData();

    // Basic fields
    if (mode === 'edit' && task) {
      formData.append('id', task.id);
    }
    formData.append('title', title);
    formData.append('description', description);
    formData.append('project_id', selectedProjectId);
    formData.append('priority', priority);
    formData.append('status', status);

    // Optional fields
    if (taskType) formData.append('task_type', taskType);
    if (assigneeId !== 'none') formData.append('assignee_id', assigneeId);
    if (phaseId !== 'none') formData.append('phase_id', phaseId);
    if (startDate) formData.append('start_date', startDate);
    if (dueDate) formData.append('due_date', dueDate);
    if (plannedCost) formData.append('planned_cost', plannedCost);
    if (actualCost) formData.append('actual_cost', actualCost);

    // Multi-assignees
    if (selectedAssignees.length > 0) {
      formData.append('assignees', JSON.stringify(selectedAssignees));
    }

    // Receipt photo
    if (receiptFile) {
      formData.append('receipt_photo', receiptFile);
    }

    return formData;
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedProjectId(preselectedProjectId || '');
    setAssigneeId('none');
    setPriority('medium');
    setPhaseId(preselectedPhaseId || 'none');
    setStartDate('');
    setDueDate('');
    setPlannedCost('');
    setActualCost('');
    setStatus('todo');
    setSelectedAssignees([]);
    setTempMaterials([]);
    setReceiptFile(null);
    setReceiptPreview(null);
    setTaskType(null);
    setCurrentStep(1);
  };

  return {
    // Step navigation
    currentStep,
    setCurrentStep,

    // Task type
    taskType,
    setTaskType,
    config,

    // Form fields
    selectedProjectId,
    setSelectedProjectId,
    title,
    setTitle,
    description,
    setDescription,
    assigneeId,
    setAssigneeId,
    priority,
    setPriority,
    phaseId,
    setPhaseId,
    startDate,
    setStartDate,
    dueDate,
    setDueDate,
    plannedCost,
    setPlannedCost,
    actualCost,
    setActualCost,
    status,
    setStatus,

    // Multi-assignees
    selectedAssignees,
    setSelectedAssignees,

    // Materials
    tempMaterials,
    setTempMaterials,

    // Receipt
    receiptFile,
    setReceiptFile,
    receiptPreview,
    setReceiptPreview,

    // Auto-expense
    autoExpenseEnabled,
    setAutoExpenseEnabled,
    primaryAssigneeId,
    setPrimaryAssigneeId,

    // Approval
    approvalNotes,
    setApprovalNotes,

    // Utilities
    buildFormData,
    resetForm,
  };
}
