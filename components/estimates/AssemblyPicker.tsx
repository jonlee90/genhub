"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Search from "lucide-react/icons/search";
import Package from "lucide-react/icons/package";
import ChevronRight from "lucide-react/icons/chevron-right";
import type {
  EstimateAssemblyWithItems,
  AssemblyCategory,
} from "@/types/db/tables/estimates";
import { getAssemblies } from "@/app/actions/assemblies";

type AssemblyPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assembly: EstimateAssemblyWithItems) => void;
};

const CATEGORIES: { value: AssemblyCategory; label: string }[] = [
  { value: "walls", label: "Walls" },
  { value: "flooring", label: "Flooring" },
  { value: "ceilings", label: "Ceilings" },
  { value: "roofing", label: "Roofing" },
  { value: "sitework", label: "Sitework" },
  { value: "misc", label: "Misc" },
];

export function AssemblyPicker({
  isOpen,
  onClose,
  onSelect,
}: AssemblyPickerProps) {
  const [assemblies, setAssemblies] = useState<EstimateAssemblyWithItems[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<AssemblyCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAssemblies();
    }
  }, [isOpen, search, selectedCategory]);

  const loadAssemblies = async () => {
    setLoading(true);
    const result = await getAssemblies({
      search: search || undefined,
      category: selectedCategory || undefined,
    });

    if (result.success && result.data) {
      setAssemblies(result.data as unknown as EstimateAssemblyWithItems[]);
    }
    setLoading(false);
  };

  const handleSelect = (assembly: EstimateAssemblyWithItems) => {
    onSelect(assembly);
    onClose();
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Select Assembly">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder="Search assemblies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 min-h-[44px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="min-h-[44px] min-w-[44px] active:scale-95"
          >
            All
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              size="sm"
              variant={selectedCategory === cat.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.value)}
              className="min-h-[44px] min-w-[44px] active:scale-95"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Assembly List */}
        <div className="flex flex-col gap-2 max-h-[60dvh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-construction-blue border-t-transparent rounded-full" />
            </div>
          ) : assemblies.length > 0 ? (
            assemblies.map((assembly) => (
              <button
                key={assembly.id}
                onClick={() => handleSelect(assembly)}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-98 transition-all min-h-[44px] text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-construction-blue dark:text-construction-blue" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {assembly.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs flex-shrink-0 dark:border-gray-600 dark:text-gray-300"
                    >
                      {assembly.category}
                    </Badge>
                  </div>
                  {assembly.description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {assembly.description}
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {assembly.assembly_items?.length || 0} items
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {search || selectedCategory
                  ? "No assemblies found"
                  : "No assemblies created yet"}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px] active:scale-95"
          >
            Cancel
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
