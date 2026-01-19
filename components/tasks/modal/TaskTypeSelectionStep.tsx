/**
 * TaskTypeSelectionStep - Step 1 in create task flow
 *
 * Displays task type selector and handles type selection with default value application.
 * Only shown in create mode.
 */
'use client';

import React, { useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { TaskTypeSelector } from '../TaskTypeSelector';
import { getTaskTypeConfig } from '@/lib/config/task-type-fields';
import type { TaskType } from '@/types/db/enums';

interface TaskTypeSelectionStepProps {
  selectedType: TaskType | null;
  onTypeSelect: (type: TaskType) => void;
  onPriorityChange?: (priority: string) => void;
  onStartDateChange?: (date: string) => void;
  disabled?: boolean;
}

/**
 * Task type selection step for create mode
 * Applies task type defaults when a type is selected
 */
function TaskTypeSelectionStepInner({
  selectedType,
  onTypeSelect,
  onPriorityChange,
  onStartDateChange,
  disabled,
}: TaskTypeSelectionStepProps) {
  const handleTypeSelect = useCallback((type: TaskType) => {
    onTypeSelect(type);

    // Apply task type defaults
    const cfg = getTaskTypeConfig(type);

    // Apply default priority
    if (cfg.defaults.priority && onPriorityChange) {
      onPriorityChange(cfg.defaults.priority);
    }

    // Apply default start date
    if (cfg.defaults.startDate === 'today' && onStartDateChange) {
      onStartDateChange(new Date().toISOString().split('T')[0]);
    }
  }, [onTypeSelect, onPriorityChange, onStartDateChange]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <TaskTypeSelector
        selectedType={selectedType}
        onSelect={handleTypeSelect}
        disabled={disabled}
      />
    </motion.div>
  );
}

// Memoized component to prevent unnecessary re-renders
export const TaskTypeSelectionStep = memo(TaskTypeSelectionStepInner);
