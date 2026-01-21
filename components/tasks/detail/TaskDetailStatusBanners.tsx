import { AnimatePresence, m as motion } from "framer-motion";
import { ErrorBanner, SuccessBanner } from "@/components/shared/ErrorBanner";

interface TaskDetailStatusBannersProps {
  error: string | null;
  successMessage: string | null;
  onDismiss: () => void;
}

export function TaskDetailStatusBanners({
  error,
  successMessage,
  onDismiss,
}: TaskDetailStatusBannersProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <ErrorBanner error={error} onDismiss={onDismiss} />
        </motion.div>
      )}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <SuccessBanner message={successMessage} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
