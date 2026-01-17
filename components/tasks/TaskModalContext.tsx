'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TaskWithRelations } from '@/types/db/task';

interface TaskModalContextType {
  isOpen: boolean;
  mode: 'create' | 'edit';
  selectedTask: TaskWithRelations | null;
  openCreate: () => void;
  openEdit: (task: TaskWithRelations) => void;
  close: () => void;
}

const TaskModalContext = createContext<TaskModalContextType | null>(null);

export function TaskModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const openCreate = useCallback(() => {
    setMode('create');
    setSelectedTask(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((task: TaskWithRelations) => {
    setMode('edit');
    setSelectedTask(task);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedTask(null);
  }, []);

  return (
    <TaskModalContext.Provider value={{ isOpen, mode, selectedTask, openCreate, openEdit, close }}>
      {children}
    </TaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error('useTaskModal must be used within TaskModalProvider');
  }
  return context;
}
