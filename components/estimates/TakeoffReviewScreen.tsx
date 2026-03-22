import { getTakeoffItems, getPlanPages } from "@/app/actions/estimates";
import { TakeoffReviewScreenContent } from "@/components/estimates/TakeoffReviewScreenContent";

type TakeoffReviewScreenProps = {
  planUploadId: string;
  projectId: string;
};

export async function TakeoffReviewScreen({
  planUploadId,
  projectId,
}: TakeoffReviewScreenProps) {
  let takeoffItemsResult = null;
  let planImageUrl: string | null = null;
  let unexpectedError: string | null = null;

  try {
    const [itemsResult, pagesResult] = await Promise.all([
      getTakeoffItems(planUploadId),
      getPlanPages(planUploadId),
    ]);

    takeoffItemsResult = itemsResult;

    if (
      pagesResult.success &&
      pagesResult.data &&
      pagesResult.data.length > 0
    ) {
      planImageUrl = pagesResult.data[0].signedUrl || null;
    }
  } catch (error) {
    console.error("[TakeoffReviewScreen] Unexpected error:", error);
    unexpectedError = error instanceof Error ? error.message : "Unknown error";
  }

  // Handle unexpected errors
  if (unexpectedError || !takeoffItemsResult) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">
          An unexpected error occurred loading takeoff items. Please try again.
        </p>
      </div>
    );
  }

  // Error handling for takeoff items
  if (!takeoffItemsResult.success) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">
          Failed to load takeoff items: {takeoffItemsResult.error}
        </p>
      </div>
    );
  }

  const takeoffItems = takeoffItemsResult.data || [];

  return (
    <TakeoffReviewScreenContent
      takeoffItems={takeoffItems}
      planUploadId={planUploadId}
      projectId={projectId}
      planImageUrl={planImageUrl}
    />
  );
}
