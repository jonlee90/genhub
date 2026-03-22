"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateBudgetCategory,
  addBudgetCategory,
  deleteBudgetCategory,
} from "@/app/actions/budgets";
import { CreateBudgetModal } from "./CreateBudgetModal";
import DollarSign from "lucide-react/icons/dollar-sign";
import Plus from "lucide-react/icons/plus";
import Pencil from "lucide-react/icons/pencil";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import Trash2 from "lucide-react/icons/trash-2";

interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
}

interface Budget {
  id: string;
  name: string;
  total_amount: number;
  budget_categories: BudgetCategory[];
}

interface BudgetOverviewProps {
  projectId: string;
  budget: Budget | null;
  onRefresh: () => void;
  userRole: string | null;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const fmt = (v: number) => currencyFormatter.format(v);

function getProgressColor(pct: number) {
  if (pct > 100) return "bg-red-500";
  if (pct >= 75) return "bg-yellow-500";
  return "bg-green-500";
}

function getTextColor(pct: number) {
  if (pct > 100) return "text-red-600 dark:text-red-400";
  if (pct >= 75) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

interface CategoryCardProps {
  category: BudgetCategory;
  onRefresh: () => void;
}

function CategoryCard({ category, onRefresh }: CategoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editAmount, setEditAmount] = useState(
    String(category.allocated_amount),
  );
  const [isSaving, setIsSaving] = useState(false);

  const spent = category.spent_amount ?? 0;
  const allocated = category.allocated_amount ?? 0;
  const remaining = allocated - spent;
  const pct = allocated > 0 ? (spent / allocated) * 100 : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateBudgetCategory({
        categoryId: category.id,
        name: editName.trim() || category.name,
        allocatedAmount: parseFloat(editAmount) || allocated,
      });
      if (result.success) {
        toast.success("Category updated");
        setIsEditing(false);
        onRefresh();
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    const result = await deleteBudgetCategory(category.id);
    if (result.success) {
      toast.success("Category deleted");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete category");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-sm font-bold border-2 border-construction-blue rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
          ) : (
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {category.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Save"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 active:scale-[0.97] transition-all"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                aria-label="Cancel"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.97] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                aria-label="Edit category"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-construction-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.97] transition-all"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                aria-label="Delete category"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.97] transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500 dark:text-gray-400 font-medium">
            Allocated
          </div>
          {isEditing ? (
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full text-sm font-bold border-2 border-construction-blue rounded-lg px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          ) : (
            <div className="font-bold text-gray-800 dark:text-gray-200">
              {fmt(allocated)}
            </div>
          )}
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400 font-medium">
            Spent
          </div>
          <div className="font-bold text-gray-800 dark:text-gray-200">
            {fmt(spent)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400 font-medium">
            Remaining
          </div>
          <div className={cn("font-bold", getTextColor(pct))}>
            {fmt(remaining)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            getProgressColor(pct),
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
        {Math.round(pct)}% spent
      </div>
    </div>
  );
}

export function BudgetOverview({
  projectId,
  budget,
  onRefresh,
  userRole,
}: BudgetOverviewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);

  const canManage = userRole === "admin" || userRole === "pm";

  const handleAddCategory = useCallback(async () => {
    if (!budget) return;
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    setIsAddingCat(true);
    try {
      const result = await addBudgetCategory({
        budgetId: budget.id,
        name: newCatName.trim(),
        allocatedAmount: parseFloat(newCatAmount) || 0,
      });
      if (result.success) {
        toast.success("Category added");
        setNewCatName("");
        setNewCatAmount("");
        setShowAddCategory(false);
        onRefresh();
      } else {
        toast.error(result.error || "Failed to add category");
      }
    } finally {
      setIsAddingCat(false);
    }
  }, [budget, newCatName, newCatAmount, onRefresh]);

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="p-4 bg-construction-blue/10 dark:bg-blue-900/30 rounded-full">
          <DollarSign className="h-8 w-8 text-construction-blue dark:text-blue-400" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
            No budget yet
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Set up a budget to track spending by category
          </p>
        </div>
        {canManage ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm",
              "bg-construction-blue text-white shadow-lg",
              "hover:bg-construction-blue/90 active:scale-[0.97] transition-all",
              "min-h-[44px]",
            )}
          >
            <Plus className="h-4 w-4" />
            Create Budget
          </button>
        ) : null}

        {showCreateModal ? (
          <CreateBudgetModal
            projectId={projectId}
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={onRefresh}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Budget header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {budget.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: {fmt(budget.total_amount)}
          </p>
        </div>
        {canManage ? (
          <button
            onClick={() => setShowAddCategory(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs",
              "bg-construction-blue/10 text-construction-blue dark:bg-blue-900/30 dark:text-blue-300",
              "hover:bg-construction-blue/20 active:scale-[0.97] transition-all",
              "min-h-[44px] min-w-[44px]",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </button>
        ) : null}
      </div>

      {/* Add category inline form */}
      {showAddCategory ? (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-construction-blue/20">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category name"
            className="flex-1 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            autoFocus
          />
          <input
            type="number"
            value={newCatAmount}
            onChange={(e) => setNewCatAmount(e.target.value)}
            placeholder="Amount"
            className="w-28 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleAddCategory}
            disabled={isAddingCat}
            aria-label="Save category"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 active:scale-[0.97] transition-all"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowAddCategory(false)}
            aria-label="Cancel"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.97] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Category cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {budget.budget_categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}
