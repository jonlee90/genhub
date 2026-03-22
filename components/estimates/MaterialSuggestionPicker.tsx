"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { suggestMaterialsForLineItem } from "@/app/actions/material-suggestions";
import Link2 from "lucide-react/icons/link-2";
import Package from "lucide-react/icons/package";
import Check from "lucide-react/icons/check";
import Search from "lucide-react/icons/search";
import Loader2 from "lucide-react/icons/loader-2";
import type { MaterialsRow } from "@/types/db/tables/materials";

type ScoredMaterial = MaterialsRow & { relevanceScore: number };

type MaterialSuggestionPickerProps = {
  lineItemId: string;
  onSelectMaterial: (materialId: string, unitPrice: number) => void;
  onManualSearch: () => void;
};

export function MaterialSuggestionPicker({
  lineItemId,
  onSelectMaterial,
  onManualSearch,
}: MaterialSuggestionPickerProps) {
  const [suggestions, setSuggestions] = useState<ScoredMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuggestions() {
      setLoading(true);
      const result = await suggestMaterialsForLineItem({ lineItemId });

      if (result.success && result.data) {
        setSuggestions(result.data as ScoredMaterial[]);
      }

      setLoading(false);
    }

    loadSuggestions();
  }, [lineItemId]);

  const handleSelect = (material: ScoredMaterial) => {
    setSelectedId(material.id);
    onSelectMaterial(material.id, material.unit_price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding materials...
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          No matching materials found in catalog
        </div>
        <Button
          onClick={onManualSearch}
          variant="outline"
          size="sm"
          className="min-h-[44px] min-w-[44px] gap-2"
        >
          <Search className="h-4 w-4" />
          Search catalog manually
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">
        Suggested materials ({suggestions.length})
      </div>

      <div className="space-y-2">
        {suggestions.map((material) => {
          const isSelected = selectedId === material.id;
          const confidenceColor =
            material.relevanceScore >= 80
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : material.relevanceScore >= 60
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

          return (
            <button
              key={material.id}
              onClick={() => handleSelect(material)}
              className={`w-full min-h-[44px] rounded-lg border p-3 text-left transition-colors active:scale-95 ${
                isSelected
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-border bg-card hover:bg-accent dark:hover:bg-accent/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {material.product_name}
                    </span>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
                  </div>

                  {material.product_description ? (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {material.product_description}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 text-xs">
                    {material.sku ? (
                      <span className="text-muted-foreground">
                        SKU: {material.sku}
                      </span>
                    ) : null}
                    {material.manufacturer ? (
                      <span className="text-muted-foreground">
                        {material.manufacturer}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="font-semibold text-foreground">
                    ${material.unit_price.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{material.unit_of_measure}
                    </span>
                  </div>
                  <Badge variant="secondary" className={confidenceColor}>
                    {material.relevanceScore}% match
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={onManualSearch}
        variant="ghost"
        size="sm"
        className="min-h-[44px] w-full gap-2"
      >
        <Search className="h-4 w-4" />
        Search full catalog
      </Button>
    </div>
  );
}
