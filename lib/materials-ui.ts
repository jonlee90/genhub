import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export const STOCK_STATUS_CONFIG = {
  in_stock: {
    label: "In Stock",
    icon: CheckCircle2,
    color:
      "bg-construction-green/10 text-construction-green border-construction-green",
  },
  low_stock: {
    label: "Low Stock",
    icon: AlertCircle,
    color:
      "bg-construction-accent/10 text-construction-accent border-construction-accent",
  },
  out_of_stock: {
    label: "Out of Stock",
    icon: XCircle,
    color:
      "bg-construction-red/10 text-construction-red border-construction-red",
  },
  special_order: {
    label: "Special Order",
    icon: AlertCircle,
    color:
      "bg-construction-accent/10 text-construction-accent border-construction-accent",
  },
} as const;

export function getMaterialStockStatusStyle(status: string | null | undefined) {
  const normalized = status?.toLowerCase() || "";
  if (normalized.includes("in stock") || normalized === "available") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (normalized.includes("low") || normalized.includes("limited")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (normalized.includes("out") || normalized === "unavailable") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  return "bg-gray-100 text-gray-600 border-gray-200";
}
