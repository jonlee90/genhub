'use client';

/**
 * TaskMaterialsManager Component
 *
 * Main wrapper component for managing materials within a task modal.
 * Provides tabbed interface for searching Home Depot products and viewing/editing assigned materials.
 *
 * Debug: Construction-themed design with #001B51 primary color
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TaskMaterialSearch } from './TaskMaterialSearch';
import { TaskMaterialsList } from './TaskMaterialsList';
import { getTaskMaterials } from '@/app/actions/materials';

// Debug: Interface definitions
interface TaskMaterialsManagerProps {
  taskId?: string;          // For edit mode (existing task)
  projectId: string;        // Required for material assignment
  onMaterialsChange?: () => void; // Callback when materials are added/removed
  mode: 'create' | 'edit';  // Determines UI behavior
}

interface MaterialAssignment {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  procurement_status: 'needed' | 'ordered' | 'delivered' | 'installed';
  purchaser_type: 'gc' | 'pm' | 'subcontractor';
  notes: string | null;
  created_at: string;
  material: {
    id: string;
    product_name: string;
    sku: string;
    category: string;
    unit_of_measure: string;
    product_image_url: string | null;
    stock_status: string | null;
    home_depot_product_id: string | null;
  };
}

// Debug: Tab type for interface
type TabType = 'search' | 'assigned';

export function TaskMaterialsManager({
  taskId,
  projectId,
  onMaterialsChange,
  mode,
}: TaskMaterialsManagerProps) {
  console.log('[TaskMaterialsManager] Rendering with props:', { taskId, projectId, mode });

  // Debug: State management
  const [activeTab, setActiveTab] = useState<TabType>(mode === 'edit' ? 'assigned' : 'search');
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Load materials when in edit mode
  const loadMaterials = useCallback(async () => {
    if (!taskId) {
      console.log('[TaskMaterialsManager] No taskId, skipping load');
      return;
    }

    console.log('[TaskMaterialsManager] Loading materials for task:', taskId);
    setIsLoading(true);
    setError(null);

    const result = await getTaskMaterials(taskId);

    if (result.success && result.data) {
      console.log('[TaskMaterialsManager] Loaded', result.data.length, 'materials');
      setMaterials(result.data as MaterialAssignment[]);
    } else {
      console.error('[TaskMaterialsManager] Error loading materials:', result.error);
      setError(result.error || 'Failed to load materials');
    }

    setIsLoading(false);
  }, [taskId]);

  // Debug: Initial load
  useEffect(() => {
    if (mode === 'edit' && taskId) {
      loadMaterials();
    }
  }, [mode, taskId, loadMaterials]);

  // Debug: Handle material added callback
  const handleMaterialAdded = useCallback(() => {
    console.log('[TaskMaterialsManager] Material added, refreshing list');
    loadMaterials();
    onMaterialsChange?.();
    // Switch to assigned tab to show the newly added material
    setActiveTab('assigned');
  }, [loadMaterials, onMaterialsChange]);

  // Debug: Handle material removed callback
  const handleMaterialRemoved = useCallback(() => {
    console.log('[TaskMaterialsManager] Material removed, refreshing list');
    loadMaterials();
    onMaterialsChange?.();
  }, [loadMaterials, onMaterialsChange]);

  // Debug: Handle material quantity updated callback
  const handleQuantityUpdated = useCallback(() => {
    console.log('[TaskMaterialsManager] Quantity updated, refreshing list');
    loadMaterials();
    onMaterialsChange?.();
  }, [loadMaterials, onMaterialsChange]);

  // Debug: Calculate total cost
  const totalCost = materials.reduce((sum, m) => sum + (m.total_cost || 0), 0);

  // Debug: Render create mode message
  if (mode === 'create') {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-gray-900 mb-1">Add Materials After Creating</h4>
        <p className="text-xs text-gray-500">
          Save the task first, then you can search and add materials from Home Depot.
        </p>
      </div>
    );
  }

  // Debug: Render main interface for edit mode
  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
        {/* Search Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all',
            activeTab === 'search'
              ? 'bg-white text-construction-blue shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          )}
        >
          <Search className="h-4 w-4" />
          Search Products
        </button>

        {/* Assigned Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all',
            activeTab === 'assigned'
              ? 'bg-white text-construction-blue shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          )}
        >
          <Package className="h-4 w-4" />
          Assigned
          {materials.length > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'ml-1 text-xs h-5 min-w-5 flex items-center justify-center',
                activeTab === 'assigned'
                  ? 'bg-construction-blue text-white'
                  : 'bg-gray-200 text-gray-700'
              )}
            >
              {materials.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Error State */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          {activeTab === 'search' && taskId && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <TaskMaterialSearch
                taskId={taskId}
                projectId={projectId}
                onMaterialAdded={handleMaterialAdded}
              />
            </motion.div>
          )}

          {activeTab === 'assigned' && (
            <motion.div
              key="assigned"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TaskMaterialsList
                materials={materials}
                totalCost={totalCost}
                onRemove={handleMaterialRemoved}
                onQuantityUpdate={handleQuantityUpdated}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
