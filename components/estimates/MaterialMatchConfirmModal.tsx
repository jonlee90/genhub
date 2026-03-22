"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal/index";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Check from "lucide-react/icons/check";

type MaterialMatchConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  lineItem: {
    trade: string;
    description: string;
    quantity: number;
    unitCost: number;
  };
  material: {
    name: string;
    description?: string;
    currentPrice: number;
    lastUpdated: string;
  };
  onConfirm: (autoLink: boolean) => void;
};

export function MaterialMatchConfirmModal({
  isOpen,
  onClose,
  lineItem,
  material,
  onConfirm,
}: MaterialMatchConfirmModalProps) {
  const [autoLink, setAutoLink] = useState(true);

  const costDelta = material.currentPrice - lineItem.unitCost;
  const totalCostDelta = costDelta * lineItem.quantity;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={Check}
      title="Confirm Material Link"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Current Line Item
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Trade:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {lineItem.trade}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Description:
                </span>
                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {lineItem.description}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Unit Cost:
                </span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  ${lineItem.unitCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-construction-blue/5 dark:bg-construction-blue/10 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Selected Material
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {material.name}
                </span>
              </div>
              {material.description ? (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Description:
                  </span>
                  <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                    {material.description}
                  </p>
                </div>
              ) : null}
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Current Price:
                </span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  ${material.currentPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Last Updated:
                </span>
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  {new Date(material.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost impact */}
        <div
          className={cn(
            "p-4 rounded-lg border-2",
            totalCostDelta >= 0
              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40"
              : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40",
          )}
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Cost Impact
          </p>
          <p
            className={cn(
              "text-2xl font-bold",
              totalCostDelta >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {totalCostDelta >= 0 ? "+" : ""}$
            {Math.abs(totalCostDelta).toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {costDelta >= 0 ? "+" : ""}${Math.abs(costDelta).toFixed(2)} per
            unit × {lineItem.quantity} units
          </p>
        </div>

        {/* Auto-link checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-link"
            checked={autoLink}
            onChange={(e) => setAutoLink(e.target.checked)}
            className="w-5 h-5"
            aria-label="Auto-link similar items in future"
          />
          <label
            htmlFor="auto-link"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            Auto-link similar items in future
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(autoLink)}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Confirm Link
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
