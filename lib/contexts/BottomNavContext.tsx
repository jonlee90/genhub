'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { TaskProject, TeamMember } from '@/types/db/task';

// Types for modal data that pages can register
interface CreateModalData {
  projects?: TaskProject[];
  tasks?: Array<{
    id: string;
    title: string;
    project_id: string;
  }>;
  teamMembers?: TeamMember[];
  role?: string | null;
}

// Map of route patterns to their modal types
type CreateModalType = 'project' | 'task' | 'expense' | 'material';

interface BottomNavContextType {
  // Register data for a specific route's create modal
  registerCreateModal: (route: string, data: CreateModalData) => void;
  // Unregister when page unmounts
  unregisterCreateModal: (route: string) => void;
  // Get data for a specific route
  getCreateModalData: (route: string) => CreateModalData | null;
  // Check if a route has create modal data registered
  hasCreateModal: (route: string) => boolean;
  // Currently open modal (if any)
  openModal: CreateModalType | null;
  // Open a specific create modal
  openCreateModal: (type: CreateModalType) => void;
  // Close the current modal
  closeCreateModal: () => void;
  // Trigger success callback (refresh data)
  onCreateSuccess: () => void;
  // Register success callback
  registerOnSuccess: (callback: () => void) => void;
}

const BottomNavContext = createContext<BottomNavContextType | null>(null);

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [modalDataMap, setModalDataMap] = useState<Map<string, CreateModalData>>(new Map());
  const [openModal, setOpenModal] = useState<CreateModalType | null>(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  const registerCreateModal = useCallback((route: string, data: CreateModalData) => {
    setModalDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(route, data);
      return newMap;
    });
  }, []);

  const unregisterCreateModal = useCallback((route: string) => {
    setModalDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(route);
      return newMap;
    });
  }, []);

  const getCreateModalData = useCallback(
    (route: string): CreateModalData | null => {
      return modalDataMap.get(route) || null;
    },
    [modalDataMap]
  );

  const hasCreateModal = useCallback(
    (route: string): boolean => {
      return modalDataMap.has(route);
    },
    [modalDataMap]
  );

  const openCreateModal = useCallback((type: CreateModalType) => {
    setOpenModal(type);
  }, []);

  const closeCreateModal = useCallback(() => {
    setOpenModal(null);
  }, []);

  const onCreateSuccess = useCallback(() => {
    setOpenModal(null);
    onSuccessCallback?.();
  }, [onSuccessCallback]);

  const registerOnSuccess = useCallback((callback: () => void) => {
    setOnSuccessCallback(() => callback);
  }, []);

  return (
    <BottomNavContext.Provider
      value={{
        registerCreateModal,
        unregisterCreateModal,
        getCreateModalData,
        hasCreateModal,
        openModal,
        openCreateModal,
        closeCreateModal,
        onCreateSuccess,
        registerOnSuccess,
      }}
    >
      {children}
    </BottomNavContext.Provider>
  );
}

export function useBottomNav() {
  const context = useContext(BottomNavContext);
  if (!context) {
    throw new Error('useBottomNav must be used within a BottomNavProvider');
  }
  return context;
}

// Hook for pages to register their create modal data
export function useRegisterCreateModal(route: string, data: CreateModalData, onSuccess?: () => void) {
  const { registerCreateModal, unregisterCreateModal, registerOnSuccess } = useBottomNav();

  // Note: This should be called in a useEffect in the consuming component
  return {
    register: () => {
      registerCreateModal(route, data);
      if (onSuccess) {
        registerOnSuccess(onSuccess);
      }
    },
    unregister: () => unregisterCreateModal(route),
  };
}
