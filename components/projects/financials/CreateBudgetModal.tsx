"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createBudget } from "@/app/actions/budgets";
import { cn } from "@/lib/utils";
import DollarSign from "lucide-react/icons/dollar-sign";
import Plus from "lucide-react/icons/plus";
import X from "lucide-react/icons/x";

interface CategoryRow {
  id: string;
  name: string;
  allocatedAmount: string;
}

const DEFAULT_CATEGORIES = [
  "Materials",
  "Labor / Payroll",
  "Subcontractors",
  "Permits",
  "Equipment",
  "Other",
];

function generateId() {
  return Math.random().toString(36).slice(2);
}

interface CreateBudgetModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBudgetModal({
  projectId,
  isOpen,
  onClose,
  onCreated,
}: CreateBudgetModalProps) {
  const [budgetName, setBudgetName] = useState("Project Budget");
  const [totalAmount, setTotalAmount] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>(() =>
    DEFAULT_CATEGORIES.map((name) => ({
      id: generateId(),
      name,
      allocatedAmount: "",
    })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      { id: generateId(), name: "", allocatedAmount: "" },
    ]);
  };

  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCategory = (
    id: string,
    field: "name" | "allocatedAmount",
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleSubmit = async () => {
    if (!budgetName.trim()) {
      toast.error("Budget name is required");
      return;
    }
    const total = parseFloat(totalAmount);
    if (!total || total <= 0) {
      toast.error("Enter a valid total budget amount");
      return;
    }

    const validCategories = categories.filter(
      (c) => c.name.trim() && parseFloat(c.allocatedAmount) >= 0,
    );
    if (validCategories.length === 0) {
      toast.error("Add at least one category");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBudget({
        projectId,
        name: budgetName.trim(),
        totalAmount: total,
        categories: validCategories.map((c) => ({
          name: c.name.trim(),
          allocatedAmount: parseFloat(c.allocatedAmount) || 0,
        })),
      });

      if (result.success) {
        toast.success("Budget created successfully");
        onCreated();
        onClose();
      } else {
        toast.error(result.error || "Failed to create budget");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={DollarSign}
      title="Create Budget"
      theme="default"
      maxWidth="2xl"
      showNavigation={true}
      onBack={onClose}
      backLabel="Cancel"
      onContinue={handleSubmit}
      continueLabel={isSubmitting ? "Creating..." : "Create Budget"}
      continueDisabled={isSubmitting}
    >
      <div className="space-y-5">
        {/* Budget Name */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Budget Name *
          </Label>
          <Input
            value={budgetName}
            onChange={(e) => setBudgetName(e.target.value)}
            placeholder="e.g., Project Budget"
            className="border-2"
          />
        </div>

        {/* Total Amount */}
        <CurrencyInput
          label="Total Budget Amount *"
          placeholder="0.00"
          value={totalAmount}
          onValueChange={(val) => setTotalAmount(val || "")}
        />

        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Budget Categories
            </Label>
            <button
              type="button"
              onClick={addCategory}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                "bg-construction-blue/10 text-construction-blue dark:bg-blue-900/30 dark:text-blue-300",
                "hover:bg-construction-blue/20 active:scale-[0.97] transition-all",
                "min-h-[44px] min-w-[44px]",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </button>
          </div>

          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <Input
                  value={cat.name}
                  onChange={(e) =>
                    updateCategory(cat.id, "name", e.target.value)
                  }
                  placeholder="Category name"
                  className="border-2 flex-1"
                />
                <div className="w-32 shrink-0">
                  <CurrencyInput
                    placeholder="0.00"
                    value={cat.allocatedAmount}
                    onValueChange={(val) =>
                      updateCategory(cat.id, "allocatedAmount", val || "")
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  aria-label="Remove category"
                  className={cn(
                    "p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
                    "active:scale-[0.97] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center",
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
