"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck } from "lucide-react";
import { DollarSign } from "lucide-react";
import { createExpenseFromMaterial } from "@/app/actions/expenses";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner, SuccessBanner } from "@/components/shared/ErrorBanner";

// Material assignment interface matching TaskMaterialsList structure
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

interface MaterialDeliveryPromptProps {
  isOpen: boolean;
  onClose: () => void;
  materialAssignment: MaterialAssignment | null;
  taskId: string;
  projectId: string;
  onExpenseCreated?: () => void;
}

/**
 * MaterialDeliveryPrompt Component
 *
 * Prompts user to create an expense when material status changes to "delivered".
 * Auto-fills expense data from material assignment.
 *
 * Features:
 * - Confirmation dialog with material details
 * - Auto-creates expense with material data
 * - Shows loading state during creation
 * - Error handling with retry
 * - Construction-themed design (var(--construction-blue))
 *
 * Integrated with TaskMaterialsList for auto-prompt on delivery
 *
 * @component
 */
export function MaterialDeliveryPrompt({
  isOpen,
  onClose,
  materialAssignment,
  taskId,
  projectId,
  onExpenseCreated,
}: MaterialDeliveryPromptProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { error, setError, clearError, successMessage, showSuccess } = useActionWithError();

  // Early return if no material assignment
  if (!materialAssignment) {
    return null;
  }

  /**
   * Handle expense creation from material
   * Uses createExpenseFromMaterial action with correct signature
   */
  const handleCreateExpense = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await createExpenseFromMaterial({
        material_assignment_id: materialAssignment.id,
        task_id: taskId,
        project_id: projectId,
        amount: materialAssignment.total_cost,
        description: `Material: ${materialAssignment.material.product_name}`,
        category: "materials",
      });

      // Check success flag for consistency with server action pattern
      if (!result.success || result.error) {
        setError(result.error || "Failed to create expense");
        setIsCreating(false);
        return;
      }

      // Success - show success message and close dialog
      showSuccess("Expense created successfully");
      setTimeout(() => {
        onClose();
        onExpenseCreated?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
      setIsCreating(false);
    }
  };

  /**
   * Handle dismissing the prompt
   */
  const handleDismiss = () => {
    onClose();
  };

  // Calculate total cost from material assignment
  const totalCost = materialAssignment.total_cost || 0;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleDismiss}
      icon={Truck}
      title="Material Delivered"
      maxWidth="md"
      showNavigation={true}
      onBack={handleDismiss}
      backLabel="Skip for Now"
      onContinue={handleCreateExpense}
      continueLabel={isCreating ? "Creating Expense..." : "Create Expense"}
      continueDisabled={isCreating}
    >
      {/* Material Details */}
      <div className="space-y-4">
        {/* Material Info */}
        <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4 space-y-2">
          <div className="font-bold text-construction-blue">
            {materialAssignment.material.product_name}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Quantity:</div>
            <div className="font-medium text-gray-900">
              {materialAssignment.quantity}{" "}
              {materialAssignment.material.unit_of_measure}
            </div>

            <div className="text-gray-600">Price/Unit:</div>
            <div className="font-medium text-gray-900">
              ${(materialAssignment.unit_cost || 0).toFixed(2)}
            </div>

            <div className="text-gray-600">Total Cost:</div>
            <div className="font-black text-construction-blue">
              ${totalCost.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="border-construction-blue/20 bg-construction-blue/5">
          <DollarSign className="h-4 w-4 text-construction-blue" />
          <AlertDescription className="text-sm text-gray-600">
            An expense will be created for this material delivery. It will be
            linked to this task and require approval.
          </AlertDescription>
        </Alert>

        {/* Error & Success Messages */}
        {error && <ErrorBanner error={error} onDismiss={clearError} />}
        {successMessage && <SuccessBanner message={successMessage} />}
      </div>
    </ResponsiveModal>
  );
}
