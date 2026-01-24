"use client";

/**
 * TaskMaterialsList Component
 *
 * Displays assigned materials for a task with editable quantity and remove functionality.
 * Shows total cost summary at the bottom.
 *
 * Construction-themed with var(--construction-blue) primary, editable quantities
 */

import { useState, useTransition, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Trash2,
  Loader2,
  DollarSign,
  Minus,
  Plus,
  AlertCircle,
  Receipt,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  removeMaterialFromTask,
  updateMaterialQuantity,
  updateMaterialAssignment,
} from "@/app/actions/materials";
import { getMaterialExpenseLink } from "@/app/actions/expenses";
import { toast } from "sonner";
import { MaterialDeliveryPrompt } from ".//MaterialDeliveryPrompt";
import type { TempMaterial } from ".//TaskMaterialsManager";

// Interface definitions
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
  procurement_status: "needed" | "ordered" | "delivered" | "installed";
  purchaser_type: "gc" | "pm" | "subcontractor";
  notes: string | null;
  created_at: string;
  material: Material;
}

interface TaskMaterialsListProps {
  materials: MaterialAssignment[];
  totalCost: number;
  taskId: string; // Added for MaterialDeliveryPrompt
  projectId: string; // Added for MaterialDeliveryPrompt
  onRemove: () => void;
  onQuantityUpdate: () => void;
  onStatusUpdate?: () => void; // Added for status change refresh
  // Create mode props
  mode?: "create" | "edit";
  tempMaterials?: TempMaterial[];
  onTempMaterialRemove?: (productId: string) => void;
  onTempMaterialQuantityChange?: (productId: string, quantity: number) => void;
}

// Procurement status configuration
const PROCUREMENT_STATUS_CONFIG = {
  needed: {
    label: "Need to Order",
    color:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
    dotColor: "bg-gray-400",
  },
  ordered: {
    label: "Ordered",
    color:
      "bg-construction-blue/10 text-construction-blue border-construction-blue/30 dark:bg-construction-blue/15 dark:text-blue-300 dark:border-construction-blue/40",
    dotColor: "bg-construction-blue",
  },
  delivered: {
    label: "Delivered",
    color:
      "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40",
    dotColor: "bg-amber-500",
  },
  installed: {
    label: "Installed",
    color:
      "bg-construction-green/10 text-construction-green border-construction-green/30 dark:bg-construction-green/15 dark:text-green-300 dark:border-construction-green/40",
    dotColor: "bg-construction-green",
  },
};

export function TaskMaterialsList({
  materials,
  totalCost,
  taskId,
  projectId,
  onRemove,
  onQuantityUpdate,
  onStatusUpdate,
  mode = "edit",
  tempMaterials = [],
  onTempMaterialRemove,
  onTempMaterialQuantityChange,
}: TaskMaterialsListProps) {
  // State management
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // MaterialDeliveryPrompt state
  const [deliveredMaterial, setDeliveredMaterial] =
    useState<MaterialAssignment | null>(null);
  const [showDeliveryPrompt, setShowDeliveryPrompt] = useState(false);

  // Expense link tracking
  const [expenseLinks, setExpenseLinks] = useState<Record<string, boolean>>({});

  // Check expense links on mount and when materials change
  useEffect(() => {
    const checkExpenseLinks = async () => {
      if (materials.length === 0) return;

      // Check links in parallel for better performance
      const linkPromises = materials.map(async (material) => {
        const result = await getMaterialExpenseLink(material.id);
        if (result.success && result.expenseId) {
          return { id: material.id, hasLink: true };
        }
        return { id: material.id, hasLink: false };
      });

      const results = await Promise.all(linkPromises);
      const links: Record<string, boolean> = {};
      results.forEach(({ id, hasLink }) => {
        if (hasLink) links[id] = true;
      });

      setExpenseLinks(links);
    };

    checkExpenseLinks();
  }, [materials]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Handle remove material
  const handleRemove = async (assignmentId: string, materialName: string) => {
    setRemovingId(assignmentId);

    startTransition(async () => {
      const result = await removeMaterialFromTask(assignmentId);

      if (result.success) {
        toast.success(`Removed ${materialName} from task`);
        onRemove();
      } else {
        toast.error(result.error || "An error occurred");
      }

      setRemovingId(null);
    });
  };

  // Handle quantity update
  const handleQuantityUpdate = async (
    assignmentId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;

    setUpdatingId(assignmentId);

    startTransition(async () => {
      const result = await updateMaterialQuantity(assignmentId, newQuantity);

      if (result.success) {
        onQuantityUpdate();
      } else {
        toast.error(result.error || "An error occurred");
      }

      setUpdatingId(null);
    });
  };

  // Handle status update
  const handleStatusUpdate = async (
    assignment: MaterialAssignment,
    newStatus: "needed" | "ordered" | "delivered" | "installed",
  ) => {
    setUpdatingStatusId(assignment.id);

    startTransition(async () => {
      const result = await updateMaterialAssignment({
        id: assignment.id,
        procurement_status: newStatus,
      });

      if (result.success) {
        // Check expense link BEFORE showing success toast to prevent race conditions
        if (newStatus === "delivered") {
          const expenseLink = await getMaterialExpenseLink(assignment.id);

          if (expenseLink.success && !expenseLink.expenseId) {
            setDeliveredMaterial(assignment);
            setShowDeliveryPrompt(true);
          }
        }

        // Show toast after expense check completes
        toast.success(`Material marked as ${newStatus}`);

        // Refresh the list
        if (onStatusUpdate) {
          onStatusUpdate();
        } else {
          onQuantityUpdate(); // Fallback to existing refresh
        }
      } else {
        toast.error(result.error || "An error occurred");
      }

      setUpdatingStatusId(null);
    });
  };

  // Empty state (check both materials and tempMaterials)
  const isEmpty =
    mode === "edit" ? materials.length === 0 : tempMaterials.length === 0;

  if (isEmpty) {
    return (
      <div className="py-8 text-center">
        <Package className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {mode === "create"
            ? "No Materials Selected"
            : "No Materials Assigned"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Search and add materials from the "Search Products" tab
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Materials List - Edit Mode */}
      {mode === "edit" && (
        <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
          <AnimatePresence mode="popLayout">
            {materials.map((assignment, index) => {
              const statusConfig =
                PROCUREMENT_STATUS_CONFIG[assignment.procurement_status];
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
                    "flex items-start gap-3 p-3 bg-white dark:bg-gray-900 border-2 rounded-lg transition-all",
                    isRemoving
                      ? "border-red-300 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-construction-blue/30",
                  )}
                >
                  {/* Material Image */}
                  <div className="shrink-0 w-12 h-12 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center">
                    {assignment.material.product_image_url ? (
                      <img
                        src={assignment.material.product_image_url}
                        alt={assignment.material.product_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>

                  {/* Material Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="text-sm font-bold text-construction-blue line-clamp-1">
                      {assignment.material.product_name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(assignment.unit_cost)} /{" "}
                        {assignment.material.unit_of_measure}
                      </span>
                      <span className="text-gray-300 dark:text-gray-700">
                        |
                      </span>

                      {/* Status Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={
                              isUpdating ||
                              isRemoving ||
                              updatingStatusId === assignment.id
                            }
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] transition-colors",
                              statusConfig.color,
                              "hover:opacity-80 disabled:opacity-50",
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                statusConfig.dotColor,
                              )}
                            />
                            {statusConfig.label}
                            {updatingStatusId !== assignment.id && (
                              <ChevronDown className="h-3 w-3 ml-0.5" />
                            )}
                            {updatingStatusId === assignment.id && (
                              <Loader2 className="h-3 w-3 ml-0.5 animate-spin" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-[160px]"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(assignment, "needed")
                            }
                          >
                            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                            Need to Order
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(assignment, "ordered")
                            }
                          >
                            <span className="w-2 h-2 rounded-full bg-construction-blue mr-2" />
                            Ordered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(assignment, "delivered")
                            }
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(assignment, "installed")
                            }
                          >
                            <span className="w-2 h-2 rounded-full bg-construction-green mr-2" />
                            Installed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Expense Linked Indicator */}
                      {expenseLinks[assignment.id] && (
                        <div
                          className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/40"
                          title="Expense created for this material"
                        >
                          <Receipt className="w-3 h-3" />
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls & Total */}
                    <div className="flex items-center justify-between gap-4 pt-1">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Qty:
                        </span>
                        <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-md">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityUpdate(
                                assignment.id,
                                assignment.quantity - 1,
                              )
                            }
                            disabled={
                              isUpdating ||
                              isRemoving ||
                              assignment.quantity <= 1
                            }
                            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 rounded-l"
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
                            className="w-10 h-5 text-center text-xs font-bold border-x-2 border-gray-200 dark:border-gray-700 focus:outline-none bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityUpdate(
                                assignment.id,
                                assignment.quantity + 1,
                              )
                            }
                            disabled={isUpdating || isRemoving}
                            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 rounded-r"
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
                        className="shrink-0 h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                          Are you sure you want to remove "
                          {assignment.material.product_name}" from this task?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleRemove(
                              assignment.id,
                              assignment.material.product_name,
                            )
                          }
                          className="bg-red-600 hover:bg-red-700 text-white"
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
      )}

      {/* Materials List - Create Mode (Temporary) */}
      {mode === "create" && (
        <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
          <AnimatePresence mode="popLayout">
            {tempMaterials.map((material, index) => {
              return (
                <motion.div
                  key={material.product_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900/40 rounded-lg hover:border-emerald-300 transition-all"
                >
                  {/* Material Image */}
                  <div className="shrink-0 w-12 h-12 rounded-md border border-emerald-200 dark:border-emerald-900/40 overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center">
                    {material.image_url ? (
                      <img
                        src={material.image_url}
                        alt={material.product_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>

                  {/* Material Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200 line-clamp-1">
                      {material.product_name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(material.price)} /{" "}
                        {material.unit_of_measure}
                      </span>
                      <span className="text-emerald-300 dark:text-emerald-700">
                        |
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border bg-white/50 dark:bg-gray-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900/40"
                      >
                        Will be added on save
                      </Badge>
                    </div>
                    {material.sku && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-300">
                        SKU: {material.sku}
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {/* Quantity Control */}
                    <div className="flex items-center gap-1 border-2 border-emerald-300 dark:border-emerald-900/40 rounded-md bg-white dark:bg-gray-900">
                      <button
                        type="button"
                        onClick={() =>
                          onTempMaterialQuantityChange?.(
                            material.product_id,
                            Math.max(1, material.quantity - 1),
                          )
                        }
                        disabled={material.quantity <= 1}
                        className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-50 rounded-l transition-colors"
                      >
                        <Minus className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={material.quantity}
                        onChange={(e) =>
                          onTempMaterialQuantityChange?.(
                            material.product_id,
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        className="w-10 h-6 text-center text-sm font-bold border-x-2 border-emerald-300 dark:border-emerald-900/40 focus:outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/30 bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onTempMaterialQuantityChange?.(
                            material.product_id,
                            material.quantity + 1,
                          )
                        }
                        className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-r transition-colors"
                      >
                        <Plus className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
                      </button>
                    </div>

                    {/* Total */}
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      {formatCurrency(material.price * material.quantity)}
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onTempMaterialRemove?.(material.product_id)
                      }
                      className="h-6 px-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Total Cost Summary */}
      <div className="flex items-center justify-between p-3 bg-construction-blue/5 dark:bg-construction-blue/10 border-2 border-construction-blue/20 dark:border-construction-blue/30 rounded-lg">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-construction-blue" />
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Total Material Cost
          </span>
        </div>
        <span className="text-xl font-black text-construction-blue">
          {formatCurrency(totalCost)}
        </span>
      </div>

      {/* Material Delivery Expense Prompt */}
      <MaterialDeliveryPrompt
        isOpen={showDeliveryPrompt}
        onClose={() => {
          setShowDeliveryPrompt(false);
          setDeliveredMaterial(null);
        }}
        materialAssignment={deliveredMaterial}
        taskId={taskId}
        projectId={projectId}
        onExpenseCreated={async () => {
          setShowDeliveryPrompt(false);
          setDeliveredMaterial(null);

          // Refresh expense links to show indicator
          if (deliveredMaterial) {
            setExpenseLinks((prev) => ({
              ...prev,
              [deliveredMaterial.id]: true,
            }));
          }

          // Refresh the materials list
          if (onStatusUpdate) {
            onStatusUpdate();
          } else {
            onQuantityUpdate();
          }
        }}
      />
    </div>
  );
}
