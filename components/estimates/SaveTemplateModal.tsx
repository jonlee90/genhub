"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Save from "lucide-react/icons/save";
import { createTemplate } from "@/app/actions/templates";
import type { CostLineItem } from "@/components/estimates/CostEditor";

const CATEGORIES = [
  { value: "residential", label: "Residential" },
  { value: "commercial_ti", label: "Commercial TI" },
  { value: "warehouse", label: "Warehouse" },
  { value: "retail", label: "Retail" },
  { value: "office", label: "Office" },
] as const;

type SaveTemplateModalProps = {
  projectId: string;
  costLineItems: CostLineItem[];
  onClose: () => void;
  onSave: () => void;
};

export function SaveTemplateModal({
  projectId,
  costLineItems,
  onClose,
  onSave,
}: SaveTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "residential" as
      | "residential"
      | "commercial_ti"
      | "warehouse"
      | "retail"
      | "office",
    isCompanyTemplate: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    try {
      // Transform cost line items to template format
      const lineItems = costLineItems.map((item) => ({
        trade: "Other",
        description: item.description,
        unit: item.unit,
        unitCost: item.materialCost + item.laborCost + item.equipmentCost,
      }));

      const result = await createTemplate({
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        isCompanyTemplate: formData.isCompanyTemplate,
        lineItems,
      });

      if (result.success) {
        toast.success("Template saved successfully");
        onSave();
      } else {
        toast.error(result.error || "Failed to save template");
      }
    } catch (error) {
      console.error("[SaveTemplateModal] Save error:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const totalCost = costLineItems.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Save Pricing Template"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Save the current cost breakdown as a reusable template for future
          estimates.
        </p>

        {/* Template summary */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Items to save
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {costLineItems.length} items
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total cost
            </p>
            <p className="text-lg font-bold text-construction-blue dark:text-construction-blue">
              ${totalCost.toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="templateName">Template Name*</Label>
          <Input
            id="templateName"
            type="text"
            placeholder="e.g., Residential Foundation"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="min-h-[44px]"
          />
          {errors.name ? (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="templateDescription">Description (optional)</Label>
          <Input
            id="templateDescription"
            type="text"
            placeholder="Brief description of this template"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label htmlFor="templateCategory">Category*</Label>
          <select
            id="templateCategory"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value as typeof formData.category,
              }))
            }
            className="w-full min-h-[44px] px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isCompanyTemplate"
            checked={formData.isCompanyTemplate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isCompanyTemplate: e.target.checked,
              }))
            }
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
            aria-label="Share template with company"
          />
          <Label htmlFor="isCompanyTemplate" className="cursor-pointer">
            Share with company (otherwise personal template)
          </Label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
