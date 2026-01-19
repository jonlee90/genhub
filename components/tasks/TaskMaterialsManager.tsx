"use client";

/**
 * TaskMaterialsManager Component
 *
 * Main wrapper component for managing materials within a task modal.
 * Provides tabbed interface for searching Home Depot products and viewing/editing assigned materials.
 *
 * Construction-themed design with #001B51 primary color
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import { Search } from "lucide-react";
import { Loader2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskMaterialSearch } from ".//TaskMaterialSearch";
import { TaskMaterialsList } from ".//TaskMaterialsList";
import { getTaskMaterials } from "@/app/actions/materials";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

// Interface definitions
interface TaskMaterialsManagerProps {
  taskId?: string;          // For edit mode (existing task)
  projectId: string;        // Required for material assignment
  onMaterialsChange?: () => void; // Callback when materials are added/removed
  mode: "create" | "edit";  // Determines UI behavior
  // Create mode: store materials temporarily
  tempMaterials?: TempMaterial[];
  onTempMaterialsChange?: (materials: TempMaterial[]) => void;
}

interface MaterialAssignment {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  procurement_status: "needed" | "ordered" | "delivered" | "installed";
  purchaser_type: "gc" | "pm" | "subcontractor";
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

// Temporary material for create mode (before task exists)
export interface TempMaterial {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  unit_of_measure: string;
  image_url: string | null;
  stock_status: string;
}

// Tab type for interface
type TabType = "search" | "assigned";

export function TaskMaterialsManager({
  taskId,
  projectId,
  onMaterialsChange,
  mode,
  tempMaterials = [],
  onTempMaterialsChange,
}: TaskMaterialsManagerProps) {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>(mode === "edit" ? "assigned" : "search");
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { error, setError, clearError } = useActionWithError();

  // Load materials when in edit mode
  const loadMaterials = useCallback(async () => {
    if (!taskId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getTaskMaterials(taskId);

    if (result.success && result.data) {
      setMaterials(result.data as MaterialAssignment[]);
    } else {
      setError(result.error || "Failed to load materials");
    }

    setIsLoading(false);
  }, [taskId]);

  // Initial load
  useEffect(() => {
    if (mode === "edit" && taskId) {
      loadMaterials();
    }
  }, [mode, taskId, loadMaterials]);

  // Handle material added callback
  const handleMaterialAdded = useCallback(() => {
    loadMaterials();
    onMaterialsChange?.();
    // Switch to assigned tab to show the newly added material
    setActiveTab("assigned");
  }, [loadMaterials, onMaterialsChange]);

  // Handle material removed callback
  const handleMaterialRemoved = useCallback(() => {
    loadMaterials();
    onMaterialsChange?.();
  }, [loadMaterials, onMaterialsChange]);

  // Handle material quantity updated callback
  const handleQuantityUpdated = useCallback(() => {
    loadMaterials();
    onMaterialsChange?.();
  }, [loadMaterials, onMaterialsChange]);

  // Calculate total cost (edit mode uses materials, create mode uses tempMaterials)
  const totalCost = mode === "edit"
    ? materials.reduce((sum, m) => sum + (m.total_cost || 0), 0)
    : tempMaterials.reduce((sum, m) => sum + (m.price * m.quantity), 0);

  // Get material count for badge
  const materialCount = mode === "edit" ? materials.length : tempMaterials.length;
  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
        {/* Search Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all",
            activeTab === "search"
              ? "bg-white text-construction-blue shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          )}
        >
          <Search className="h-4 w-4" />
          Search Products
        </button>

        {/* Assigned Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("assigned")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all",
            activeTab === "assigned"
              ? "bg-white text-construction-blue shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          )}
        >
          <Package className="h-4 w-4" />
          {mode === "create" ? "Selected" : "Assigned"}
          {materialCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 text-xs h-5 min-w-5 flex items-center justify-center",
                activeTab === "assigned"
                  ? "bg-construction-blue text-white"
                  : "bg-gray-200 text-gray-700"
              )}
            >
              {materialCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && <ErrorBanner error={error} onDismiss={clearError} />}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          {activeTab === "search" && (
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
                mode={mode}
                tempMaterials={tempMaterials}
                onTempMaterialAdd={(material) => {
                  onTempMaterialsChange?.([...tempMaterials, material]);
                  setActiveTab("assigned");
                }}
              />
            </motion.div>
          )}

          {activeTab === "assigned" && (
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
                taskId={taskId || ""}
                projectId={projectId}
                onRemove={handleMaterialRemoved}
                onQuantityUpdate={handleQuantityUpdated}
                onStatusUpdate={handleQuantityUpdated}
                mode={mode}
                tempMaterials={tempMaterials}
                onTempMaterialRemove={(productId) => {
                  onTempMaterialsChange?.(
                    tempMaterials.filter(m => m.product_id !== productId)
                  );
                }}
                onTempMaterialQuantityChange={(productId, quantity) => {
                  onTempMaterialsChange?.(
                    tempMaterials.map(m =>
                      m.product_id === productId ? { ...m, quantity } : m
                    )
                  );
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
