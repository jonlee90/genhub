import { getPlanUploads, getEstimates } from "@/app/actions/estimates";
import { EstimatesTabContent } from "@/components/estimates/EstimatesTabContent";
import type { UserRole } from "@/types/db/enums";

type EstimatesTabProps = {
  projectId: string;
  userRole: UserRole | null;
};

export async function EstimatesTab({ projectId, userRole }: EstimatesTabProps) {
  let planUploadsResult = null;
  let estimatesResult = null;
  let unexpectedError: string | null = null;

  try {
    // Parallel fetch for independent data
    const results = await Promise.all([
      getPlanUploads(projectId),
      getEstimates(projectId),
    ]);
    planUploadsResult = results[0];
    estimatesResult = results[1];
  } catch (error) {
    console.error("[EstimatesTab] Unexpected error:", error);
    unexpectedError = error instanceof Error ? error.message : "Unknown error";
  }

  // Handle unexpected errors
  if (unexpectedError || !planUploadsResult || !estimatesResult) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">
          An unexpected error occurred. Please try again.
        </p>
      </div>
    );
  }

  // Error handling for plan uploads
  if (!planUploadsResult.success) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">
          Failed to load plan uploads: {planUploadsResult.error}
        </p>
      </div>
    );
  }

  // Error handling for estimates
  if (!estimatesResult.success) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-3300">
          Failed to load estimates: {estimatesResult.error}
        </p>
      </div>
    );
  }

  const planUploads = planUploadsResult.data || [];
  const estimates = estimatesResult.data || [];

  return (
    <EstimatesTabContent
      planUploads={planUploads}
      estimates={estimates}
      projectId={projectId}
      userRole={userRole}
    />
  );
}
