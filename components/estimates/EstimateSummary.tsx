"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EstimateHistoryList } from "@/components/estimates/EstimateHistoryList";
import { TradeDonutChart } from "@/components/estimates/TradeDonutChart";
import FileDown from "lucide-react/icons/file-down";
import ArrowRight from "lucide-react/icons/arrow-right";
import FileText from "lucide-react/icons/file-text";
import Settings from "lucide-react/icons/settings";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { convertToBudget } from "@/app/actions/budget-conversion";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import type {
  Estimate,
  EstimateLineItem,
  TakeoffItem,
} from "@/types/db/tables/estimates";

type EstimateSummaryProps = {
  estimate: Estimate;
  projectId: string;
  lineItems?: EstimateLineItem[];
  takeoffItems?: TakeoffItem[];
};

type ExportOptions = {
  includeTrades: string[];
  detailLevel: "summary" | "detailed";
  includePlans: boolean;
};

export function EstimateSummary({
  estimate,
  projectId,
  lineItems = [],
  takeoffItems = [],
}: EstimateSummaryProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTrades: [],
    detailLevel: "detailed",
    includePlans: false,
  });

  // Get unique trades from line items
  const uniqueTrades = useMemo(() => {
    const trades = new Set(lineItems.map((item) => item.trade));
    return Array.from(trades);
  }, [lineItems]);

  const handleExportPdf = async (customOptions?: ExportOptions) => {
    try {
      setIsExporting(true);
      toast.info("Generating PDF...");

      const options = customOptions || exportOptions;
      const params = new URLSearchParams({
        estimateId: estimate.id,
        options: JSON.stringify(options),
      });

      const response = await fetch(`/api/estimates/export-pdf?${params}`);

      if (!response.ok) throw new Error("Failed to export PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estimate-${estimate.name.replace(/[^a-z0-9]/gi, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully");
      setShowExportOptions(false);
    } catch (error) {
      console.error("[EstimateSummary] Export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = () => {
    handleExportPdf({
      includeTrades: [],
      detailLevel: "detailed",
      includePlans: false,
    });
  };

  const handleConvertToBudget = async () => {
    if (estimate.status !== "approved") {
      toast.error("Only approved estimates can be converted to budgets");
      return;
    }

    try {
      setIsConverting(true);

      const result = await convertToBudget(estimate.id);

      if (result.success && result.data) {
        toast.success("Budget created successfully");
        // Navigate to budget page
        window.location.href = `/budgets/${result.data.budgetId}`;
      } else {
        toast.error(result.error || "Failed to convert to budget");
      }
    } catch (error) {
      console.error("[EstimateSummary] Convert error:", error);
      toast.error("Failed to convert to budget");
    } finally {
      setIsConverting(false);
    }
  };

  // Calculate cost breakdown from line items
  const costBreakdown = useMemo(() => {
    const material = lineItems.reduce(
      (sum, item) => sum + (item.material_cost || 0),
      0,
    );
    const labor = lineItems.reduce(
      (sum, item) => sum + (item.labor_cost || 0),
      0,
    );
    const equipment = lineItems.reduce(
      (sum, item) => sum + (item.equipment_cost || 0),
      0,
    );
    const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      material,
      labor,
      equipment,
      total,
    };
  }, [lineItems]);

  const toggleTrade = (trade: string) => {
    setExportOptions((prev) => ({
      ...prev,
      includeTrades: prev.includeTrades.includes(trade)
        ? prev.includeTrades.filter((t) => t !== trade)
        : [...prev.includeTrades, trade],
    }));
  };

  return (
    <div className="space-y-6 pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-construction-blue dark:text-construction-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Estimate Summary
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Created {formatDate(estimate.created_at, { includeYear: true })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleQuickExport}
            disabled={isExporting}
            variant="outline"
            className="min-h-[44px] active:scale-95"
            aria-label="Export estimate as PDF"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Button
            onClick={() => setShowExportOptions(true)}
            disabled={isExporting}
            variant="outline"
            className="min-h-[44px] min-w-[44px] active:scale-95"
            aria-label="PDF export options"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {estimate.status === "approved" ? (
            <Button
              onClick={handleConvertToBudget}
              disabled={isConverting}
              className="min-h-[44px] active:scale-95"
              aria-label="Convert estimate to budget"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {isConverting ? "Converting..." : "Convert to Budget"}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Cost summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Material Costs
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${costBreakdown.material.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {costBreakdown.total > 0
              ? ((costBreakdown.material / costBreakdown.total) * 100).toFixed(
                  1,
                )
              : "0.0"}
            % of total
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Labor Costs
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${costBreakdown.labor.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {costBreakdown.total > 0
              ? ((costBreakdown.labor / costBreakdown.total) * 100).toFixed(1)
              : "0.0"}
            % of total
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Equipment Costs
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${costBreakdown.equipment.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {costBreakdown.total > 0
              ? ((costBreakdown.equipment / costBreakdown.total) * 100).toFixed(
                  1,
                )
              : "0.0"}
            % of total
          </p>
        </div>

        <div className="p-4 bg-construction-blue/10 dark:bg-construction-blue/20 border border-construction-blue/30 dark:border-construction-blue/40 rounded-lg">
          <p className="text-sm text-construction-blue dark:text-construction-blue mb-2 font-medium">
            Total Estimate
          </p>
          <p className="text-3xl font-bold text-construction-blue dark:text-construction-blue">
            ${costBreakdown.total.toLocaleString()}
          </p>
          <Badge
            variant="outline"
            className="mt-2 text-xs border-construction-blue/50 text-construction-blue dark:text-construction-blue"
          >
            {estimate.status}
          </Badge>
        </div>
      </div>

      {/* Notes section */}
      {estimate.description ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            Notes
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {estimate.description}
          </p>
        </div>
      ) : null}

      {/* Trade Donut Chart */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Cost Breakdown by Trade
        </h3>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <TradeDonutChart
            costLineItems={lineItems.map((item) => ({
              id: item.id,
              takeoffItemId: item.takeoff_item_id || "",
              description: item.description || item.sub_type,
              quantity: item.quantity,
              unit: item.unit,
              materialCost: item.material_cost,
              laborCost: item.labor_cost,
              equipmentCost: item.equipment_cost,
              subtotal: item.subtotal,
            }))}
            takeoffItems={takeoffItems}
          />
        </div>
      </div>

      {/* Estimate history */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Version History
        </h3>
        <EstimateHistoryList estimateId={estimate.id} />
      </div>

      {/* Export Options Modal */}
      <ResponsiveModal
        isOpen={showExportOptions}
        onClose={() => setShowExportOptions(false)}
        title="PDF Export Options"
      >
        <div className="space-y-6">
          {/* Detail Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Detail Level
            </label>
            <div className="flex gap-2">
              <Button
                variant={
                  exportOptions.detailLevel === "summary"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setExportOptions((prev) => ({
                    ...prev,
                    detailLevel: "summary",
                  }))
                }
                className="min-h-[44px] flex-1 active:scale-95"
              >
                Summary Only
              </Button>
              <Button
                variant={
                  exportOptions.detailLevel === "detailed"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setExportOptions((prev) => ({
                    ...prev,
                    detailLevel: "detailed",
                  }))
                }
                className="min-h-[44px] flex-1 active:scale-95"
              >
                Detailed
              </Button>
            </div>
          </div>

          {/* Trade Selection */}
          {uniqueTrades.length > 0 ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Select Trades (leave empty for all)
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueTrades.map((trade) => (
                  <Button
                    key={trade}
                    variant={
                      exportOptions.includeTrades.includes(trade)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleTrade(trade)}
                    className="min-h-[44px] active:scale-95"
                  >
                    {trade}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Include Plans */}
          {estimate.plan_upload_id ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Include Plan Thumbnails
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Add up to 3 plan page thumbnails
                </p>
              </div>
              <button
                onClick={() =>
                  setExportOptions((prev) => ({
                    ...prev,
                    includePlans: !prev.includePlans,
                  }))
                }
                className={`min-h-[44px] min-w-[44px] rounded-lg border-2 transition-colors ${
                  exportOptions.includePlans
                    ? "bg-construction-blue border-construction-blue"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                }`}
                aria-label="Toggle plan thumbnails"
              >
                {exportOptions.includePlans ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded" />
                  </div>
                ) : null}
              </button>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowExportOptions(false)}
              className="min-h-[44px] flex-1 active:scale-95"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleExportPdf()}
              disabled={isExporting}
              className="min-h-[44px] flex-1 active:scale-95"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
