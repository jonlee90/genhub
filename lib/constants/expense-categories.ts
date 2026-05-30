import type { LucideIcon } from "lucide-react";
import Package from "lucide-react/icons/package";
import HardHat from "lucide-react/icons/hard-hat";
import Wrench from "lucide-react/icons/wrench";
import FileText from "lucide-react/icons/file-text";
import Truck from "lucide-react/icons/truck";
import Utensils from "lucide-react/icons/utensils";
import BedDouble from "lucide-react/icons/bed-double";
import Receipt from "lucide-react/icons/receipt";
import type { ExpenseCategory } from "@/types/db/expense";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
}

export const CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
  materials: {
    label: "Materials",
    icon: Package,
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  labor: {
    label: "Labor",
    icon: HardHat,
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  subcontractor: {
    label: "Subcontractor",
    icon: HardHat,
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    iconClass: "text-indigo-600 dark:text-indigo-400",
  },
  equipment: {
    label: "Equipment",
    icon: Wrench,
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    iconClass: "text-orange-600 dark:text-orange-400",
  },
  permits: {
    label: "Permits",
    icon: FileText,
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    iconClass: "text-purple-600 dark:text-purple-400",
  },
  transportation: {
    label: "Transportation",
    icon: Truck,
    badgeClass:
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    iconClass: "text-cyan-600 dark:text-cyan-400",
  },
  meals: {
    label: "Meals",
    icon: Utensils,
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  lodging: {
    label: "Lodging",
    icon: BedDouble,
    badgeClass:
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
    iconClass: "text-pink-600 dark:text-pink-400",
  },
  other: {
    label: "Other",
    icon: Receipt,
    badgeClass:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800",
    iconClass: "text-slate-600 dark:text-slate-400",
  },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category as ExpenseCategory] ?? CATEGORY_META.other;
}

export const CATEGORY_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All Categories", value: "all" },
  ...Object.entries(CATEGORY_META).map(([key, meta]) => ({
    label: meta.label,
    value: key,
  })),
];
