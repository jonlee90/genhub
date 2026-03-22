"use client";

import { useState, useEffect, memo } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Search from "lucide-react/icons/search";
import Building from "lucide-react/icons/building";
import User from "lucide-react/icons/user";
import FileText from "lucide-react/icons/file-text";
import History from "lucide-react/icons/history";
import Copy from "lucide-react/icons/copy";
import Trash2 from "lucide-react/icons/trash-2";
import {
  getTemplates,
  applyTemplate,
  duplicateTemplate,
  deleteTemplate,
} from "@/app/actions/templates";

type Template = {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_company_template: boolean;
  version: number;
  last_used_at?: string;
};

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "residential", label: "Residential" },
  { value: "commercial_ti", label: "Commercial TI" },
  { value: "warehouse", label: "Warehouse" },
  { value: "retail", label: "Retail" },
  { value: "office", label: "Office" },
];

const TemplateCard = memo(function TemplateCard({
  template,
  onApply,
  onDuplicate,
  onDelete,
  onViewHistory,
  isApplying,
  isDuplicating,
  isDeleting,
}: {
  template: Template;
  onApply: (id: string) => void;
  onDuplicate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string, name: string) => void;
  isApplying: boolean;
  isDuplicating: boolean;
  isDeleting: boolean;
}) {
  return (
    <div
      className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
      style={{ contentVisibility: "auto" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {template.name}
          </h4>
          {template.description ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {template.description}
            </p>
          ) : null}
        </div>
        {template.is_company_template ? (
          <Building
            className="w-4 h-4 text-construction-blue flex-shrink-0"
            aria-label="Company template"
          />
        ) : (
          <User
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            aria-label="Personal template"
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        {template.category ? (
          <Badge variant="outline" className="capitalize">
            {template.category.replace("_", " ")}
          </Badge>
        ) : null}
        <span>v{template.version}</span>
        {template.last_used_at ? (
          <>
            <span>•</span>
            <span>
              Last used: {new Date(template.last_used_at).toLocaleDateString()}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onApply(template.id)}
          disabled={isApplying || isDuplicating || isDeleting}
          className="flex-1 min-h-[44px] active:scale-95"
        >
          {isApplying ? "Applying..." : "Apply"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewHistory(template.id, template.name)}
          disabled={isApplying || isDuplicating || isDeleting}
          className="min-h-[44px] min-w-[44px] active:scale-95"
          aria-label="View version history"
        >
          <History className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDuplicate(template.id, template.name)}
          disabled={isApplying || isDuplicating || isDeleting}
          className="min-h-[44px] min-w-[44px] active:scale-95"
          aria-label="Duplicate template"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(template.id)}
          disabled={isApplying || isDuplicating || isDeleting}
          className="min-h-[44px] min-w-[44px] active:scale-95 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900"
          aria-label="Delete template"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </Button>
      </div>
    </div>
  );
});

export function TemplateLibrary({
  isOpen,
  onClose,
  estimateId,
  onSuccess,
  onViewHistory,
}: {
  isOpen: boolean;
  onClose: () => void;
  estimateId: string;
  onSuccess?: () => void;
  onViewHistory?: (templateId: string, templateName: string) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadTemplates() {
      try {
        setIsLoading(true);
        const result = await getTemplates({
          search: searchQuery || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        });

        if (!isMounted) return;

        if (result.success && result.data) {
          setTemplates(result.data as unknown as Template[]);
        } else {
          toast.error(result.error || "Failed to load templates");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("[TemplateLibrary] Load error:", err);
        toast.error("Failed to load templates");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(loadTemplates, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isOpen, searchQuery, categoryFilter]);

  const handleApply = async (templateId: string) => {
    try {
      setApplyingId(templateId);

      const result = await applyTemplate({ estimateId, templateId });

      if (result.success) {
        const itemsUpdated = (result.data as { itemsUpdated?: number })
          ?.itemsUpdated;
        toast.success(
          itemsUpdated
            ? `Template applied: ${itemsUpdated} items updated`
            : "Template applied successfully",
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to apply template");
      }
    } catch (err) {
      console.error("[TemplateLibrary] Apply error:", err);
      toast.error("Failed to apply template");
    } finally {
      setApplyingId(null);
    }
  };

  const handleDuplicate = async (templateId: string, templateName: string) => {
    try {
      setDuplicatingId(templateId);

      const newName = `${templateName} (Copy)`;
      const result = await duplicateTemplate(templateId, newName);

      if (result.success) {
        toast.success("Template duplicated successfully");
        // Reload templates
        const reloadResult = await getTemplates({
          search: searchQuery || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        });
        if (reloadResult.success && reloadResult.data) {
          setTemplates(reloadResult.data as unknown as Template[]);
        }
      } else {
        toast.error(result.error || "Failed to duplicate template");
      }
    } catch (err) {
      console.error("[TemplateLibrary] Duplicate error:", err);
      toast.error("Failed to duplicate template");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      setDeletingId(templateId);

      const result = await deleteTemplate(templateId);

      if (result.success) {
        toast.success("Template deleted successfully");
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch (err) {
      console.error("[TemplateLibrary] Delete error:", err);
      toast.error("Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={FileText}
      title="Template Library"
      maxWidth="2xl"
      snapPoints={["half", "full"]}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10 min-h-[44px]"
            aria-label="Search templates"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              size="sm"
              variant={categoryFilter === cat.value ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat.value)}
              className="min-h-[44px] whitespace-nowrap active:scale-95"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-construction-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery || categoryFilter !== "all"
              ? "No templates found matching your criteria"
              : "No templates found"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60dvh] overflow-y-auto">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={handleApply}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onViewHistory={
                  onViewHistory
                    ? onViewHistory
                    : () => {
                        /* no-op */
                      }
                }
                isApplying={applyingId === template.id}
                isDuplicating={duplicatingId === template.id}
                isDeleting={deletingId === template.id}
              />
            ))}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
