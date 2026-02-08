import type { LucideIcon } from "lucide-react";
import Rocket from "lucide-react/icons/rocket";
import FileText from "lucide-react/icons/file-text";
import ShoppingCart from "lucide-react/icons/shopping-cart";
import FolderKanban from "lucide-react/icons/folder-kanban";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import Layers from "lucide-react/icons/layers";
import Sparkles from "lucide-react/icons/sparkles";
import Calendar from "lucide-react/icons/calendar";
import HardHat from "lucide-react/icons/hard-hat";
import Hammer from "lucide-react/icons/hammer";
import Wrench from "lucide-react/icons/wrench";
import ClipboardCheck from "lucide-react/icons/clipboard-check";
import Package from "lucide-react/icons/package";
import Truck from "lucide-react/icons/truck";
import Flag from "lucide-react/icons/flag";

// Icon map for phase templates (bundle-barrel-imports)
export const PHASE_ICONS: Record<string, LucideIcon> = {
  Rocket,
  FileText,
  ShoppingCart,
  FolderKanban,
  CheckCircle2,
  Layers,
  Sparkles,
  Calendar,
  HardHat,
  Hammer,
  Wrench,
  ClipboardCheck,
  Package,
  Truck,
  Flag,
};

// Get phase icon based on icon_name or phase name (rerender-memo optimization)
export const getPhaseIcon = (
  phaseName: string,
  iconName?: string | null,
): LucideIcon => {
  // Priority 1: Use stored icon_name if valid
  if (iconName && iconName in PHASE_ICONS) {
    return PHASE_ICONS[iconName];
  }

  // Priority 2: Fallback to keyword-based matching
  const name = phaseName.toLowerCase();
  if (name.includes("site") && name.includes("set")) return ClipboardCheck;
  if (name.includes("framing")) return Layers;
  if (name.includes("mep") || name.includes("rough")) return Wrench;
  if (name.includes("fire") || name.includes("safety")) return HardHat;
  if (name.includes("finishes") || name.includes("finish")) return Rocket;
  if (name.includes("initiation") || name.includes("planning")) return Rocket;
  if (name.includes("pre-construction") || name.includes("design"))
    return FileText;
  if (name.includes("procurement")) return ShoppingCart;
  if (
    name.includes("post") ||
    name.includes("closeout") ||
    name.includes("completion")
  )
    return CheckCircle2;
  if (name.includes("construction") || name.includes("execution"))
    return FolderKanban;

  return Layers; // Default fallback
};
