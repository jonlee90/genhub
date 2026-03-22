import FileText from "lucide-react/icons/file-text";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/db/enums";

type EmptyEstimatesStateProps = {
  userRole: UserRole | null;
};

export function EmptyEstimatesState({ userRole }: EmptyEstimatesStateProps) {
  const canUpload = userRole === "admin" || userRole === "project_manager";

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center">
        <FileText className="w-12 h-12 text-construction-blue dark:text-construction-blue" />
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
        No estimates yet
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        Upload a construction plan to get started with AI-assisted takeoff and
        cost estimation.
      </p>

      {canUpload && (
        <Button
          className="min-h-[44px] min-w-[44px] px-6 active:scale-95"
          disabled
        >
          Upload Plan
        </Button>
      )}
    </div>
  );
}
