"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import ChevronLeft from "lucide-react/icons/chevron-left";
import ChevronRight from "lucide-react/icons/chevron-right";
import Loader2 from "lucide-react/icons/loader-2";
import { EstimatesErrorBoundary } from "@/components/estimates/EstimatesErrorBoundary";
import { EstimateWizardStepper } from "@/components/estimates/EstimateWizardStepper";
import { PlanUploadPanel } from "@/components/estimates/PlanUploadPanel";
import { TakeoffReviewScreenContent } from "@/components/estimates/TakeoffReviewScreenContent";
import { CostEditor } from "@/components/estimates/CostEditor";
import { EstimateSummary } from "@/components/estimates/EstimateSummary";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import {
  getTakeoffItems,
  getPlanPages,
  getEstimate,
  createEstimate,
  saveEstimateLineItems,
} from "@/app/actions/estimates";
import type { CostLineItem } from "@/components/estimates/CostEditor";
import type {
  PlanUpload,
  Estimate,
  TakeoffItem,
  EstimateLineItem,
} from "@/types/db/tables/estimates";
import type { UserRole } from "@/types/db/enums";

type SubView = "upload" | "parse" | "review" | "costing" | "summary";

type EstimatesTabContentProps = {
  planUploads: PlanUpload[];
  estimates: Estimate[];
  projectId: string;
  userRole: UserRole | null;
  onOpenChat?: (estimateId: string) => void;
};

export function EstimatesTabContent({
  planUploads,
  estimates,
  projectId,
  userRole,
  onOpenChat,
}: EstimatesTabContentProps) {
  const [subView, setSubView] = useState<SubView>("upload");
  const [currentStep, setCurrentStep] = useState(1); // 1=Upload, 2=Parse, 3=Review, 4=Cost, 5=Summary
  const [selectedPlan, setSelectedPlan] = useState<PlanUpload | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null,
  );
  const [selectedPlanForReview, setSelectedPlanForReview] = useState<
    string | null
  >(null);
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([]);
  const [planImageUrl, setPlanImageUrl] = useState<string | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [activeEstimateId, setActiveEstimateId] = useState<string | null>(null);
  const [estimateForSummary, setEstimateForSummary] = useState<
    (Estimate & { lineItems: EstimateLineItem[] }) | null
  >(null);
  const [isLoadingCostStep, setIsLoadingCostStep] = useState(false);
  const [costStepError, setCostStepError] = useState<string | null>(null);
  const [currentCostItems, setCurrentCostItems] = useState<CostLineItem[]>([]);
  // Ref to always read latest currentCostItems in handleStepClick without stale closure
  const currentCostItemsRef = useRef<CostLineItem[]>([]);
  useEffect(() => {
    currentCostItemsRef.current = currentCostItems;
  }, [currentCostItems]);

  // Fetch takeoff items and plan image when navigating to review
  useEffect(() => {
    if (!selectedPlanForReview) return;

    setIsLoadingReview(true);
    setReviewError(null);

    Promise.all([
      getTakeoffItems(selectedPlanForReview),
      getPlanPages(selectedPlanForReview),
    ])
      .then(([itemsResult, pagesResult]) => {
        if (itemsResult.success) {
          setTakeoffItems(itemsResult.data || []);
        } else {
          setReviewError(itemsResult.error || "Failed to load takeoff items");
        }

        if (
          pagesResult.success &&
          pagesResult.data &&
          pagesResult.data.length > 0
        ) {
          setPlanImageUrl(pagesResult.data[0].signedUrl || null);
        }
      })
      .catch((err) => {
        setReviewError(
          err instanceof Error ? err.message : "Failed to load takeoff items",
        );
      })
      .finally(() => {
        setIsLoadingReview(false);
      });
  }, [selectedPlanForReview]);

  const handleBackToUploads = useCallback(() => {
    setSelectedPlanForReview(null);
    setTakeoffItems([]);
    setPlanImageUrl(null);
    setReviewError(null);
    setCurrentStep(1);
    setSubView("upload");
    setActiveEstimateId(null);
    setEstimateForSummary(null);
    setCostStepError(null);
    setIsLoadingCostStep(false);
    setCurrentCostItems([]);
  }, []);

  const handleStepClick = useCallback(
    async (step: number) => {
      const stepToView: Record<number, SubView> = {
        1: "upload",
        2: "parse",
        3: "review",
        4: "costing",
        5: "summary",
      };

      if (step === 4) {
        setIsLoadingCostStep(true);
        setCostStepError(null);
        try {
          let estimateId =
            estimates.find((e) => e.plan_upload_id === selectedPlanForReview)
              ?.id ?? null;

          if (!estimateId) {
            const result = await createEstimate({
              projectId,
              planUploadId: selectedPlanForReview!,
              name: "Draft Estimate",
              overheadPct: 10,
              markupPct: 15,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lineItems: [] as any,
            });
            if (!result.success || !result.data) {
              throw new Error(result.error ?? "Failed to create estimate");
            }
            estimateId = result.data.id;
          }

          // Re-fetch fresh takeoff items so CostEditor sees the latest review_status
          // (TakeoffReviewScreenContent persists acceptance to DB but doesn't update parent state)
          const freshItemsResult = await getTakeoffItems(
            selectedPlanForReview!,
          );
          if (freshItemsResult.success && freshItemsResult.data) {
            setTakeoffItems(freshItemsResult.data);
          }

          setActiveEstimateId(estimateId);
          setCurrentStep(4);
          setSubView("costing");
        } catch (err) {
          setCostStepError(
            err instanceof Error ? err.message : "Failed to load cost editor",
          );
        } finally {
          setIsLoadingCostStep(false);
        }
        return;
      }

      if (step === 5) {
        if (!activeEstimateId) return;
        setIsLoadingCostStep(true);
        setCostStepError(null);
        try {
          // Persist current cost items to DB before fetching the summary.
          // Read from ref (not state) to avoid stale closure — handleStepClick's
          // useCallback deps don't include currentCostItems.
          const itemsToSave = currentCostItemsRef.current;
          if (itemsToSave.length > 0) {
            const saveResult = await saveEstimateLineItems(
              activeEstimateId,
              itemsToSave.map((item) => ({
                takeoffItemId: item.takeoffItemId,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                materialCost: item.materialCost,
                laborCost: item.laborCost,
                equipmentCost: item.equipmentCost,
                subtotal: item.subtotal,
              })),
            );
            if (!saveResult.success) {
              throw new Error(saveResult.error ?? "Failed to save line items");
            }
          }

          const result = await getEstimate(activeEstimateId);
          if (!result.success || !result.data) {
            throw new Error(result.error ?? "Failed to load estimate");
          }
          setEstimateForSummary(
            result.data as Estimate & { lineItems: EstimateLineItem[] },
          );
          setCurrentStep(5);
          setSubView("summary");
        } catch (err) {
          setCostStepError(
            err instanceof Error ? err.message : "Failed to load summary",
          );
        } finally {
          setIsLoadingCostStep(false);
        }
        return;
      }

      setCurrentStep(step);
      setSubView(stepToView[step] ?? "upload");
    },
    [estimates, selectedPlanForReview, projectId, activeEstimateId],
  );

  // Update step when navigating to review
  useEffect(() => {
    if (selectedPlanForReview && currentStep < 3) {
      setCurrentStep(3);
      setSubView("review");
    }
  }, [selectedPlanForReview, currentStep]);

  return (
    <EstimatesErrorBoundary>
      <div
        className="space-y-4 pb-[env(safe-area-inset-bottom)]"
        data-testid="estimates-list"
      >
        {/* Wizard Stepper - Show at top when in wizard flow */}
        {selectedPlanForReview ? (
          <EstimateWizardStepper
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        ) : null}

        {/* Upload Panel - Show when no plan selected for review */}
        {subView === "upload" && !selectedPlanForReview ? (
          <PlanUploadPanel
            projectId={projectId}
            planUploads={planUploads}
            userRole={userRole}
            onNavigateToReview={setSelectedPlanForReview}
          />
        ) : null}

        {/* Wizard sub-views - Show when plan selected */}
        {selectedPlanForReview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleBackToUploads}
                className="min-h-[44px] active:scale-95 gap-2"
                aria-label="Back to uploads"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Uploads
              </Button>

              {subView === "review" ? (
                <Button
                  onClick={() => handleStepClick(4)}
                  className="min-h-[44px] active:scale-95 gap-2 bg-[#001B51] hover:bg-[#001B51]/90 text-white dark:bg-[#001B51] dark:hover:bg-[#001B51]/90"
                  aria-label="Proceed to cost editor"
                >
                  Proceed to Cost
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : subView === "costing" && activeEstimateId ? (
                <Button
                  onClick={() => handleStepClick(5)}
                  disabled={isLoadingCostStep}
                  className="min-h-[44px] active:scale-95 gap-2 bg-[#001B51] hover:bg-[#001B51]/90 text-white dark:bg-[#001B51] dark:hover:bg-[#001B51]/90"
                  aria-label="Proceed to summary"
                >
                  View Summary
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : null}
            </div>

            {/* Review (Step 3) */}
            {subView === "review" ? (
              isLoadingReview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-construction-blue" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Loading takeoff items...
                  </span>
                </div>
              ) : reviewError ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {reviewError}
                  </p>
                </div>
              ) : (
                <TakeoffReviewScreenContent
                  takeoffItems={takeoffItems}
                  planUploadId={selectedPlanForReview}
                  projectId={projectId}
                  planImageUrl={planImageUrl}
                  onOpenChat={onOpenChat}
                  estimates={estimates}
                />
              )
            ) : null}

            {/* Cost Editor (Step 4) */}
            {subView === "costing" ? (
              isLoadingCostStep ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-construction-blue" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Loading cost editor...
                  </span>
                </div>
              ) : costStepError ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {costStepError}
                  </p>
                </div>
              ) : activeEstimateId ? (
                <SessionProviderWrapper>
                  <CostEditor
                    estimateId={activeEstimateId}
                    takeoffItems={takeoffItems}
                    projectId={projectId}
                    onItemsChange={setCurrentCostItems}
                  />
                </SessionProviderWrapper>
              ) : null
            ) : null}

            {/* Summary (Step 5) */}
            {subView === "summary" && estimateForSummary ? (
              isLoadingCostStep ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-construction-blue" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Loading summary...
                  </span>
                </div>
              ) : costStepError ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {costStepError}
                  </p>
                </div>
              ) : (
                <EstimateSummary
                  estimate={estimateForSummary}
                  projectId={projectId}
                  lineItems={estimateForSummary.lineItems}
                  takeoffItems={takeoffItems}
                />
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </EstimatesErrorBoundary>
  );
}
