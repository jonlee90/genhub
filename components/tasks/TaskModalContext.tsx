"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { TaskWithRelations } from "@/types/db/task";

interface TaskModalContextType {
  isOpen: boolean;
  mode: "create" | "edit";
  selectedTask: TaskWithRelations | null;
  openCreate: () => void;
  openEdit: (task: TaskWithRelations) => void;
  close: () => void;
}

const TaskModalContext = createContext<TaskModalContextType | null>(null);

interface TaskModalProviderProps {
  children: ReactNode;
  tasks?: TaskWithRelations[]; // Optional tasks array to sync selectedTask
}

export function TaskModalProvider({ children, tasks }: TaskModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const openCreate = useCallback(() => {
    setMode("create");
    setSelectedTask(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((task: TaskWithRelations) => {
    setMode("edit");
    setSelectedTask(task);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedTask(null);
  }, []);

  // Sync selectedTask with tasks array when tasks update (after router.refresh())
  // This ensures the modal always has the latest task data
  useEffect(() => {
    if (selectedTask && tasks) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask]);

  return (
    <TaskModalContext.Provider value={{ isOpen, mode, selectedTask, openCreate, openEdit, close }}>
      {children}
    </TaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error("useTaskModal must be used within TaskModalProvider");
  }
  return context;
}
