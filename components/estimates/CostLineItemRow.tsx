"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Trash2 from "lucide-react/icons/trash-2";
import Pencil from "lucide-react/icons/pencil";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import { cn } from "@/lib/utils";

type CostLineItem = {
  id: string;
  takeoffItemId: string;
  description: string;
  quantity: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subtotal: number;
};

type CostLineItemRowProps = {
  item: CostLineItem;
  onUpdate: (updates: Partial<CostLineItem>) => void;
  onDelete: () => void;
};

export function CostLineItemRow({
  item,
  onUpdate,
  onDelete,
}: CostLineItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    quantity: item.quantity,
    materialCost: item.materialCost,
    laborCost: item.laborCost,
    equipmentCost: item.equipmentCost,
  });

  const handleSave = () => {
    onUpdate(editValues);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      quantity: item.quantity,
      materialCost: item.materialCost,
      laborCost: item.laborCost,
      equipmentCost: item.equipmentCost,
    });
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md active:shadow-sm transition-shadow">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {item.description}
            </h4>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                className="min-h-[36px] min-w-[36px] text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/30 dark:active:bg-green-950/50"
                aria-label="Save changes"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="min-h-[36px] min-w-[36px] text-gray-600 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Quantity
              </label>
              <Input
                type="number"
                value={editValues.quantity}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    quantity: parseFloat(e.target.value) || 0,
                  }))
                }
                className="min-h-[40px]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Material ($/{item.unit})
              </label>
              <Input
                type="number"
                value={editValues.materialCost}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    materialCost: parseFloat(e.target.value) || 0,
                  }))
                }
                className="min-h-[40px]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Labor ($/{item.unit})
              </label>
              <Input
                type="number"
                value={editValues.laborCost}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    laborCost: parseFloat(e.target.value) || 0,
                  }))
                }
                className="min-h-[40px]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Equipment ($/{item.unit})
              </label>
              <Input
                type="number"
                value={editValues.equipmentCost}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    equipmentCost: parseFloat(e.target.value) || 0,
                  }))
                }
                className="min-h-[40px]"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              {item.description}
            </h4>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Quantity
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {item.quantity} {item.unit}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Material
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  ${item.materialCost.toLocaleString()}/{item.unit}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Labor</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  ${item.laborCost.toLocaleString()}/{item.unit}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Equipment
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  ${item.equipmentCost.toLocaleString()}/{item.unit}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Subtotal
                </p>
                <p className="font-bold text-construction-blue dark:text-construction-blue">
                  ${item.subtotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="min-h-[36px] min-w-[36px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:active:bg-blue-950/50"
              aria-label="Edit line item"
            >
              <Pencil className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="min-h-[36px] min-w-[36px] text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/30 dark:active:bg-red-950/50"
              aria-label="Delete line item"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
