/**
 * TaskTypeSelectionStep - Step 1 in create task flow
 *
 * Displays task type selector and handles type selection.
 * Only shown in create mode.
 */
'use client';

import React, { memo } from 'react';
import { m as motion } from 'framer-motion';
import { TaskTypeSelector } from '../TaskTypeSelector';
import type { TaskType } from '@/types/db/task';
import type { TaskTypeConfigsRow } from '@/types/db/tables/tasks';

interface TaskTypeSelectionStepProps {
  selectedType: TaskType | null;
  onTypeSelect: (type: TaskType) => void;
  onPriorityChange?: (priority: string) => void;
  onStartDateChange?: (date: string) => void;
  disabled?: boolean;
  /** Task types from database - required, no fallback */
  prefetchedTaskTypes: TaskTypeConfigsRow[];
}

/**
 * Task type selection step for create mode
 */
function TaskTypeSelectionStepInner({
  selectedType,
  onTypeSelect,
  disabled,
  prefetchedTaskTypes,
}: TaskTypeSelectionStepProps) {

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <TaskTypeSelector
        selectedType={selectedType}
        onSelect={onTypeSelect}
        disabled={disabled}
        prefetchedTaskTypes={prefetchedTaskTypes}
      />
    </motion.div>
  );
}

// Memoized component to prevent unnecessary re-renders
export const TaskTypeSelectionStep = memo(TaskTypeSelectionStepInner);
