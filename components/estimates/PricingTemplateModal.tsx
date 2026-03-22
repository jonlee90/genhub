"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FolderOpen from "lucide-react/icons/folder-open";
import Check from "lucide-react/icons/check";
import Loader2 from "lucide-react/icons/loader-2";
import { getTemplates } from "@/app/actions/templates";

type CostLineItem = {
  takeoffItemId: string;
  description: string;
  quantity: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
};

type DbTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template_data: {
    lineItems: Array<{
      trade: string;
      description: string;
      unit: string;
      unitCost: number;
    }>;
  };
};

type PricingTemplateModalProps = {
  projectId: string;
  onClose: () => void;
  onSelect: (items: CostLineItem[]) => void;
};

export function PricingTemplateModal({
  projectId: _projectId,
  onClose,
  onSelect,
}: PricingTemplateModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [templates, setTemplates] = useState<DbTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTemplates({})
      .then((result) => {
        if (result.success && result.data) {
          setTemplates(result.data as unknown as DbTemplate[]);
        } else {
          setError(result.error ?? "Failed to load templates");
        }
      })
      .catch(() => setError("Failed to load templates"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLoad = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    const lineItems = template.template_data?.lineItems ?? [];
    const costItems: CostLineItem[] = lineItems.map((item) => ({
      takeoffItemId: "",
      description: item.trade
        ? `[${item.trade}] ${item.description}`
        : item.description,
      quantity: 1,
      unit: item.unit,
      materialCost: item.unitCost,
      laborCost: 0,
      equipmentCost: 0,
    }));

    onSelect(costItems);
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Load Pricing Template"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a saved pricing template to load into this estimate.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-construction-blue" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              Loading templates...
            </span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : templates.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {templates.map((template) => {
              const itemCount = template.template_data?.lineItems?.length ?? 0;
              const totalCost = (
                template.template_data?.lineItems ?? []
              ).reduce((sum, item) => sum + item.unitCost, 0);

              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md active:scale-[0.99] ${
                    selectedTemplateId === template.id
                      ? "border-construction-blue bg-construction-blue/5 dark:bg-construction-blue/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {template.name}
                      </h4>
                      {template.description ? (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {template.description}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs dark:border-gray-600 dark:text-gray-300"
                        >
                          {itemCount} items
                        </Badge>
                        {template.category ? (
                          <Badge
                            variant="outline"
                            className="text-xs capitalize dark:border-gray-600 dark:text-gray-300"
                          >
                            {template.category.replace("_", " ")}
                          </Badge>
                        ) : null}
                        {totalCost > 0 ? (
                          <span className="text-xs font-medium text-construction-blue dark:text-construction-blue">
                            ${totalCost.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {selectedTemplateId === template.id ? (
                      <div className="w-6 h-6 rounded-full bg-construction-blue flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              No saved templates yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Save a template from the cost editor to reuse pricing across
              projects.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLoad}
            disabled={!selectedTemplateId || isLoading}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Load Template
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
