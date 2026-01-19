"use client";

// Phase 4 - Material Tab (display materials linked to task)
// Fetches and displays material assignments with status badges and cost totals

import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTaskMaterials } from "@/app/actions/materials";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

// Material assignment type (from server action)
type MaterialAssignment = {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number | null;
  procurement_status: "needed" | "ordered" | "delivered" | "installed";
  purchaser_type: "subcontractor" | "gc" | "pm";
  notes: string | null;
  created_at: string;
  material: {
    id: string;
    product_name: string;
    sku: string | null;
    category: string | null;
    unit_of_measure: string | null;
    product_image_url: string | null;
    stock_status: string | null;
    home_depot_product_id: string | null;
  };
};

// Component props
export interface MaterialTabProps {
  taskId: string;
  hasBudgetVisibility?: boolean; // NEW: Controls cost visibility (default: true)
}

/**
 * MaterialTab - Display materials linked to task
 * Shows table with product name, SKU, quantity, status badge, and cost
 * Calculates total cost summary
 */
export function MaterialTab({ taskId, hasBudgetVisibility = true }: MaterialTabProps) {
  // State
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, clearError } = useActionWithError();

  // Fetch materials on mount
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError(null);

      const result = await getTaskMaterials(taskId);

      if (result.error) {
        setError(result.error);
        setMaterials([]);
      } else if (result.data) {
        setMaterials(result.data as MaterialAssignment[]);
      }

      setLoading(false);
    };

    fetchMaterials();
  }, [taskId]);

  // Material status color helper
  const getMaterialStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      needed: "bg-gray-400",
      ordered: "bg-blue-500",
      delivered: "bg-green-500",
      installed: "bg-gray-500",
    };
    return colors[status] || "bg-gray-400";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#001B51]" />
        <p className="text-sm text-gray-500">Loading materials...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorBanner error={error} onDismiss={clearError} />;
  }

  // Empty state
  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-semibold">No materials linked to this task</p>
        <p className="text-sm text-gray-400 mt-1">Materials will appear here when assigned</p>
      </div>
    );
  }

  // Calculate total cost
  const totalCost = materials.reduce((sum, m) => sum + (m.unit_cost * m.quantity), 0);

  return (
    <div className="space-y-4">
      {/* Materials Table */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr className="text-left text-xs uppercase font-bold text-gray-600">
              <th className="p-3">Material</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, index) => (
              <tr
                key={material.id}
                className={cn(
                  "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                )}
              >
                {/* Material name and SKU */}
                <td className="p-3">
                  <div className="font-semibold text-sm">{material.material.product_name}</div>
                  {material.material.sku && (
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      SKU: {material.material.sku}
                    </div>
                  )}
                </td>

                {/* Quantity */}
                <td className="p-3 text-center">
                  <span className="font-bold text-sm">{material.quantity}</span>
                </td>

                {/* Status badge */}
                <td className="p-3 text-center">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold uppercase text-white inline-block",
                    getMaterialStatusColor(material.procurement_status)
                  )}>
                    {material.procurement_status}
                  </span>
                </td>

                {/* Cost (conditionally hidden based on budget visibility) */}
                <td className="p-3 text-right">
                  {hasBudgetVisibility ? (
                    <>
                      <span className="font-bold text-sm">
                        ${(material.unit_cost * material.quantity).toFixed(2)}
                      </span>
                      <div className="text-xs text-gray-500">
                        ${material.unit_cost.toFixed(2)} × {material.quantity}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Hidden</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Cost Summary (conditionally hidden) */}
      {hasBudgetVisibility && (
        <div className="border-2 border-[#001B51] rounded-lg p-4 bg-[#001B51]/5">
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase text-sm text-[#001B51]">Total Material Cost:</span>
            <span className="text-2xl font-black text-[#001B51]">
              ${totalCost.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Based on {materials.length} material assignment{materials.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
