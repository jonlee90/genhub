import { AnimatePresence, motion } from "framer-motion";
import AlertCircle from "lucide-react/icons/alert-circle";
import CheckCircle2 from "lucide-react/icons/check-circle-2";

interface TaskModalStatusAlertsProps {
  error: string | null;
  success: boolean;
  mode: "create" | "edit";
}

export function TaskModalStatusAlerts({
  error,
  success,
  mode,
}: TaskModalStatusAlertsProps) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">
            Task {mode === "create" ? "created" : "updated"} successfully!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
