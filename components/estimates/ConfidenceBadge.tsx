import { Badge } from "@/components/ui/badge";
import ShieldCheck from "lucide-react/icons/shield-check";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import ShieldAlert from "lucide-react/icons/shield-alert";
import { cn } from "@/lib/utils";

type ConfidenceBadgeProps = {
  confidence: number;
  threshold?: number; // Default 85%
};

export function ConfidenceBadge({
  confidence,
  threshold = 85,
}: ConfidenceBadgeProps) {
  const getConfig = () => {
    const thresholdDecimal = threshold / 100;

    if (confidence >= thresholdDecimal) {
      return {
        label: "High",
        icon: ShieldCheck,
        className:
          "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/40",
      };
    }
    if (confidence >= 0.6) {
      return {
        label: "Medium",
        icon: AlertTriangle,
        className:
          "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900/40",
      };
    }
    return {
      label: "Low",
      icon: ShieldAlert,
      className:
        "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40",
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        "px-2 py-1 text-xs font-bold border inline-flex items-center gap-1",
        config.className,
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
