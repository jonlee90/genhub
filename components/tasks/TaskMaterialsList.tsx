'use client';

/**
 * TaskMaterialsList Component
 *
 * Displays assigned materials for a task with editable quantity and remove functionality.
 * Shows total cost summary at the bottom.
 *
 * Debug: Construction-themed with #001B51 primary, editable quantities
 */

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Trash2,
  Loader2,
  DollarSign,
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { removeMaterialFromTask, updateMaterialQuantity } from '@/app/actions/materials';
import { useToast } from '@/hooks/use-toast';

// Debug: Interface definitions
interface Material {
  id: string;
  product_name: string;
  sku: string;
  category: string;
  unit_of_measure: string;
  product_image_url: string | null;
  stock_status: string | null;
  home_depot_product_id: string | null;
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
  material: Material;
}

interface TaskMaterialsListProps {
  materials: MaterialAssignment[];
  totalCost: number;
  onRemove: () => void;
  onQuantityUpdate: () => void;
}

// Debug: Procurement status configuration
const PROCUREMENT_STATUS_CONFIG = {
  needed: {
    label: 'Need to Order',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-400',
  },
  ordered: {
    label: 'Ordered',
    color: 'bg-construction-blue/10 text-construction-blue border-construction-blue/30',
    dotColor: 'bg-construction-blue',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-amber-50 text-amber-700 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  installed: {
    label: 'Installed',
    color: 'bg-construction-green/10 text-construction-green border-construction-green/30',
    dotColor: 'bg-construction-green',
  },
};

export function TaskMaterialsList({
  materials,
  totalCost,
  onRemove,
  onQuantityUpdate,
}: TaskMaterialsListProps) {
  console.log('[TaskMaterialsList] Rendering with', materials.length, 'materials, totalCost:', totalCost);

  // Debug: State management
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Debug: Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Debug: Handle remove material
  const handleRemove = async (assignmentId: string, materialName: string) => {
    console.log('[TaskMaterialsList] Removing assignment:', assignmentId);
    setRemovingId(assignmentId);

    startTransition(async () => {
      const result = await removeMaterialFromTask(assignmentId);

      if (result.success) {
        console.log('[TaskMaterialsList] Material removed successfully');
        toast({
          title: 'Material Removed',
          description: `Removed ${materialName} from task`,
        });
        onRemove();
      } else {
        console.error('[TaskMaterialsList] Failed to remove material:', result.error);
        toast({
          title: 'Failed to Remove',
          description: result.error || 'An error occurred',
          variant: 'destructive',
        });
      }

      setRemovingId(null);
    });
  };

  // Debug: Handle quantity update
  const handleQuantityUpdate = async (assignmentId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    console.log('[TaskMaterialsList] Updating quantity for', assignmentId, 'to', newQuantity);
    setUpdatingId(assignmentId);

    startTransition(async () => {
      const result = await updateMaterialQuantity(assignmentId, newQuantity);

      if (result.success) {
        console.log('[TaskMaterialsList] Quantity updated successfully');
        onQuantityUpdate();
      } else {
        console.error('[TaskMaterialsList] Failed to update quantity:', result.error);
        toast({
          title: 'Failed to Update',
          description: result.error || 'An error occurred',
          variant: 'destructive',
        });
      }

      setUpdatingId(null);
    });
  };

  // Debug: Empty state
  if (materials.length === 0) {
    return (
      <div className="py-8 text-center">
        <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-900">No Materials Assigned</p>
        <p className="text-xs text-gray-500 mt-1">
          Search and add materials from the "Search Products" tab
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Materials List */}
      <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {materials.map((assignment, index) => {
            const statusConfig = PROCUREMENT_STATUS_CONFIG[assignment.procurement_status];
            const isRemoving = removingId === assignment.id;
            const isUpdating = updatingId === assignment.id;

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'flex items-start gap-3 p-3 bg-white border-2 rounded-lg transition-all',
                  isRemoving ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-construction-blue/30'
                )}
              >
                {/* Material Image */}
                <div className="shrink-0 w-12 h-12 rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                  {assignment.material.product_image_url ? (
                    <img
                      src={assignment.material.product_image_url}
                      alt={assignment.material.product_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Material Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h4 className="text-sm font-bold text-construction-blue line-clamp-1">
                    {assignment.material.product_name}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-gray-600">
                      {formatCurrency(assignment.unit_cost)} / {assignment.material.unit_of_measure}
                    </span>
                    <span className="text-gray-300">|</span>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 border', statusConfig.color)}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full mr-1', statusConfig.dotColor)} />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Quantity Controls & Total */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    {/* Quantity Control */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Qty:</span>
                      <div className="flex items-center border-2 border-gray-200 rounded-md">
                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(assignment.id, assignment.quantity - 1)}
                          disabled={isUpdating || isRemoving || assignment.quantity <= 1}
                          className="p-0.5 hover:bg-gray-100 disabled:opacity-50 rounded-l"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={assignment.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value > 0) {
                              handleQuantityUpdate(assignment.id, value);
                            }
                          }}
                          disabled={isUpdating || isRemoving}
                          className="w-10 h-5 text-center text-xs font-bold border-x-2 border-gray-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityUpdate(assignment.id, assignment.quantity + 1)}
                          disabled={isUpdating || isRemoving}
                          className="p-0.5 hover:bg-gray-100 disabled:opacity-50 rounded-r"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {isUpdating && (
                        <Loader2 className="h-3 w-3 animate-spin text-construction-blue" />
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-construction-blue" />
                      <span className="text-sm font-black text-construction-blue">
                        {formatCurrency(assignment.total_cost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isRemoving || isUpdating}
                      className="shrink-0 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Material</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove "{assignment.material.product_name}" from this task?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemove(assignment.id, assignment.material.product_name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Total Cost Summary */}
      <div className="flex items-center justify-between p-3 bg-construction-blue/5 border-2 border-construction-blue/20 rounded-lg">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-construction-blue" />
          <span className="text-sm font-bold text-gray-900">Total Material Cost</span>
        </div>
        <span className="text-xl font-black text-construction-blue">
          {formatCurrency(totalCost)}
        </span>
      </div>
    </div>
  );
}
