"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Plus from "lucide-react/icons/plus";

type AddManualItemModalProps = {
  onClose: () => void;
  onSave: (item: {
    takeoffItemId: string;
    description: string;
    quantity: number;
    unit: string;
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
  }) => void;
};

export function AddManualItemModal({
  onClose,
  onSave,
}: AddManualItemModalProps) {
  const [formData, setFormData] = useState({
    description: "",
    quantity: 1,
    unit: "",
    materialCost: 0,
    laborCost: 0,
    equipmentCost: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.unit.trim()) {
      newErrors.unit = "Unit is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      takeoffItemId: "", // Manual items don't have takeoff item ID
      description: formData.description.trim(),
      quantity: formData.quantity,
      unit: formData.unit.trim(),
      materialCost: formData.materialCost,
      laborCost: formData.laborCost,
      equipmentCost: formData.equipmentCost,
    });
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Add Manual Cost Item"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="description">Description*</Label>
          <Input
            id="description"
            type="text"
            placeholder="e.g., Concrete foundation"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="min-h-[44px]"
          />
          {errors.description ? (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity*</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantity: parseFloat(e.target.value) || 0,
                }))
              }
              className="min-h-[44px]"
            />
            {errors.quantity ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.quantity}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="unit">Unit*</Label>
            <Input
              id="unit"
              type="text"
              placeholder="e.g., SF, LF, CY"
              value={formData.unit}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, unit: e.target.value }))
              }
              className="min-h-[44px]"
            />
            {errors.unit ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.unit}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="materialCost">Material Cost (per unit)</Label>
          <Input
            id="materialCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="$0.00"
            value={formData.materialCost}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                materialCost: parseFloat(e.target.value) || 0,
              }))
            }
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label htmlFor="laborCost">Labor Cost (per unit)</Label>
          <Input
            id="laborCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="$0.00"
            value={formData.laborCost}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                laborCost: parseFloat(e.target.value) || 0,
              }))
            }
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label htmlFor="equipmentCost">Equipment Cost (per unit)</Label>
          <Input
            id="equipmentCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="$0.00"
            value={formData.equipmentCost}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                equipmentCost: parseFloat(e.target.value) || 0,
              }))
            }
            className="min-h-[44px]"
          />
        </div>

        {/* Calculated subtotal */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Estimated Subtotal
          </p>
          <p className="text-xl font-bold text-construction-blue dark:text-construction-blue">
            $
            {(
              (formData.materialCost +
                formData.laborCost +
                formData.equipmentCost) *
              formData.quantity
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
