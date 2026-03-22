"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Plus from "lucide-react/icons/plus";
import Trash2 from "lucide-react/icons/trash-2";
import type { AssemblyCategory } from "@/types/db/tables/estimates";
import { createAssembly } from "@/app/actions/assemblies";

type AssemblyEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
};

type AssemblyItemInput = {
  trade: string;
  description: string;
  unit: string;
  quantityMultiplier: number;
};

const CATEGORIES: { value: AssemblyCategory; label: string }[] = [
  { value: "walls", label: "Walls" },
  { value: "flooring", label: "Flooring" },
  { value: "ceilings", label: "Ceilings" },
  { value: "roofing", label: "Roofing" },
  { value: "sitework", label: "Sitework" },
  { value: "misc", label: "Misc" },
];

export function AssemblyEditor({
  isOpen,
  onClose,
  onSave,
}: AssemblyEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AssemblyCategory>("walls");
  const [isCompanyTemplate, setIsCompanyTemplate] = useState(true);
  const [items, setItems] = useState<AssemblyItemInput[]>([
    { trade: "", description: "", unit: "LF", quantityMultiplier: 1 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([
      ...items,
      { trade: "", description: "", unit: "LF", quantityMultiplier: 1 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof AssemblyItemInput,
    value: string | number,
  ) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Assembly name is required");
      return;
    }

    const validItems = items.filter(
      (item) => item.trade && item.description && item.unit,
    );

    if (validItems.length === 0) {
      setError("At least one item is required");
      return;
    }

    setSaving(true);

    const result = await createAssembly({
      name: name.trim(),
      description: description.trim() || undefined,
      category: category as any,
      isCompanyTemplate,
      items: validItems,
    });

    setSaving(false);

    if (result.success) {
      onSave?.();
      onClose();
    } else {
      setError(result.error || "Failed to create assembly");
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Create Assembly">
      <div className="flex flex-col gap-4">
        {/* Error Message */}
        {error ? (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : null}

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="assembly-name" className="dark:text-gray-200">
              Assembly Name *
            </Label>
            <Input
              id="assembly-name"
              type="text"
              placeholder="e.g., Standard Wall Assembly"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <Label
              htmlFor="assembly-description"
              className="dark:text-gray-200"
            >
              Description
            </Label>
            <Textarea
              id="assembly-description"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="min-h-[44px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="assembly-category" className="dark:text-gray-200">
              Category *
            </Label>
            <select
              id="assembly-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as AssemblyCategory)}
              className="w-full min-h-[44px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="company-template"
              type="checkbox"
              checked={isCompanyTemplate}
              onChange={(e) => setIsCompanyTemplate(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-700"
              aria-label="Company-wide template"
            />
            <Label htmlFor="company-template" className="dark:text-gray-200">
              Company-wide template (visible to all users)
            </Label>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="dark:text-gray-200">Component Items *</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              className="min-h-[44px] min-w-[44px] active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3 max-h-[40dvh] overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Item {index + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="min-h-[44px] min-w-[44px] active:scale-95 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="Trade (e.g., Framing)"
                    value={item.trade}
                    onChange={(e) =>
                      handleUpdateItem(index, "trade", e.target.value)
                    }
                    className="min-h-[44px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                  <Input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateItem(index, "description", e.target.value)
                    }
                    className="min-h-[44px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="Unit (e.g., LF)"
                    value={item.unit}
                    onChange={(e) =>
                      handleUpdateItem(index, "unit", e.target.value)
                    }
                    className="min-h-[44px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                  <Input
                    type="number"
                    placeholder="Multiplier"
                    value={item.quantityMultiplier}
                    onChange={(e) =>
                      handleUpdateItem(
                        index,
                        "quantityMultiplier",
                        parseFloat(e.target.value) || 1,
                      )
                    }
                    step="0.1"
                    min="0"
                    className="min-h-[44px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            {saving ? "Creating..." : "Create Assembly"}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
