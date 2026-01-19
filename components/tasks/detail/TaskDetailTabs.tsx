import Activity from "lucide-react/icons/activity";
import FileText from "lucide-react/icons/file-text";
import Package from "lucide-react/icons/package";
import { cn } from "@/lib/utils";

interface TaskDetailTabsProps {
  activeTab: "overview" | "materials" | "activity" | "dependencies";
  activityCount: number;
  onOverview: () => void;
  onMaterials: () => void;
  onActivity: () => void;
  onDependencies: () => void;
}

export function TaskDetailTabs({
  activeTab,
  activityCount,
  onOverview,
  onMaterials,
  onActivity,
  onDependencies,
}: TaskDetailTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b-2 border-gray-200">
      <button
        onClick={onOverview}
        className={cn(
          "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
          activeTab === "overview"
            ? "text-construction-blue border-construction-blue"
            : "text-gray-500 border-transparent hover:text-gray-700",
        )}
      >
        <FileText className="h-4 w-4" />
        Overview
      </button>
      <button
        onClick={onMaterials}
        className={cn(
          "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
          activeTab === "materials"
            ? "text-construction-blue border-construction-blue"
            : "text-gray-500 border-transparent hover:text-gray-700",
        )}
      >
        <Package className="h-4 w-4" />
        Materials
      </button>
      <button
        onClick={onActivity}
        className={cn(
          "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
          activeTab === "activity"
            ? "text-construction-blue border-construction-blue"
            : "text-gray-500 border-transparent hover:text-gray-700",
        )}
      >
        <Activity className="h-4 w-4" />
        Activity
        {activityCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-construction-blue text-white rounded-full text-xs font-bold">
            {activityCount}
          </span>
        )}
      </button>
      <button
        onClick={onDependencies}
        className={cn(
          "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
          activeTab === "dependencies"
            ? "text-construction-blue border-construction-blue"
            : "text-gray-500 border-transparent hover:text-gray-700",
        )}
      >
        Dependencies
      </button>
    </div>
  );
}
