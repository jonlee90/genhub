"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TakeoffItem } from "@/types/db/tables/estimates";

type TakeoffItemEditModalProps = {
  item: TakeoffItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<TakeoffItem>) => void;
};

export function TakeoffItemEditModal({
  item,
  isOpen,
  onClose,
  onSave,
}: TakeoffItemEditModalProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);

  const handleSave = () => {
    onSave({ quantity, unit });
    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Takeoff Item"
    >
      <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label>Unit</Label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 min-h-[44px]">
            Save
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
