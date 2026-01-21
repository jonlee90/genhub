"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Search from "lucide-react/icons/search";
import HardHat from "lucide-react/icons/hard-hat";
import Loader2 from "lucide-react/icons/loader-2";
import AlertCircle from "lucide-react/icons/alert-circle";
import Building2 from "lucide-react/icons/building-2";
import Phone from "lucide-react/icons/phone";
import Star from "lucide-react/icons/star";
import Check from "lucide-react/icons/check";
import { m as motion, AnimatePresence } from "framer-motion";
import { addSubcontractorToProject } from "@/app/actions/projects";
import { cn, getInitials } from "@/lib/utils";

interface Subcontractor {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  trade_specialization: string;
  performance_rating: number | null;
}

// Trade specialization display config
const TRADE_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-gray-100 text-gray-700" },
  electrical: { label: "Electrical", color: "bg-yellow-100 text-yellow-800" },
  plumbing: { label: "Plumbing", color: "bg-blue-100 text-blue-800" },
  hvac: { label: "HVAC", color: "bg-cyan-100 text-cyan-800" },
  carpentry: { label: "Carpentry", color: "bg-amber-100 text-amber-800" },
  masonry: { label: "Masonry", color: "bg-stone-100 text-stone-800" },
  roofing: { label: "Roofing", color: "bg-red-100 text-red-800" },
  flooring: { label: "Flooring", color: "bg-orange-100 text-orange-800" },
  painting: { label: "Painting", color: "bg-purple-100 text-purple-800" },
  drywall: { label: "Drywall", color: "bg-slate-100 text-slate-800" },
  concrete: { label: "Concrete", color: "bg-zinc-100 text-zinc-800" },
  landscaping: { label: "Landscaping", color: "bg-green-100 text-green-800" },
  demolition: { label: "Demolition", color: "bg-rose-100 text-rose-800" },
  steel_work: { label: "Steel Work", color: "bg-indigo-100 text-indigo-800" },
  glass_glazing: { label: "Glass/Glazing", color: "bg-sky-100 text-sky-800" },
  fire_protection: {
    label: "Fire Protection",
    color: "bg-red-100 text-red-800",
  },
  insulation: { label: "Insulation", color: "bg-teal-100 text-teal-800" },
  other: { label: "Other", color: "bg-gray-100 text-gray-700" },
};

interface AddSubcontractorModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSubcontractorIds: string[];
  companyId: string;
}

export function AddSubcontractorModal({
  projectId,
  open,
  onOpenChange,
  existingSubcontractorIds,
  companyId,
}: AddSubcontractorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [filteredSubcontractors, setFilteredSubcontractors] = useState<
    Subcontractor[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Performance optimization: Memoize async functions to prevent recreation on every render
  // NOTE: Must declare useCallback functions BEFORE useEffect hooks that use them
  const fetchSubcontractors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/companies/${companyId}/subcontractors`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch subcontractors");
      }

      const data = await response.json();

      // Filter out subcontractors already on the project
      const available = (data.subcontractors || []).filter(
        (sub: Subcontractor) => !existingSubcontractorIds.includes(sub.id),
      );

      setSubcontractors(available);
      setFilteredSubcontractors(available);
    } catch (err) {
      console.error("Error fetching subcontractors:", err);
      setError("Failed to load subcontractors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [companyId, existingSubcontractorIds]);

  const resetState = useCallback(() => {
    setSearchQuery("");
    setSelectedId(null);
    setSubcontractors([]);
    setFilteredSubcontractors([]);
    setError(null);
    setSuccess(false);
  }, []);

  // Fetch subcontractors when modal opens
  useEffect(() => {
    if (open) {
      fetchSubcontractors();
    } else {
      resetState();
    }
  }, [open, companyId, fetchSubcontractors, resetState]);

  // Filter subcontractors based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSubcontractors(subcontractors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = subcontractors.filter(
        (sub) =>
          sub.company_name.toLowerCase().includes(query) ||
          sub.contact_name.toLowerCase().includes(query) ||
          sub.trade_specialization.toLowerCase().includes(query),
      );
      setFilteredSubcontractors(filtered);
    }
  }, [searchQuery, subcontractors]);

  const handleSubmit = useCallback(async () => {
    if (!selectedId) {
      setError("Please select a subcontractor");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await addSubcontractorToProject(projectId, selectedId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);

      // Close modal after short delay to show success
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      console.error("Error adding subcontractor:", err);
      setError("Failed to add subcontractor. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [selectedId, projectId, onOpenChange]);

  const renderRating = (rating: number | null) => {
    if (rating === null) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
        <span className="text-xs font-semibold text-gray-600">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <ResponsiveModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      icon={HardHat}
      title="Add Subcontractor"
      subtitle="Select a subcontractor from your company to add to this project."
      maxWidth="lg"
      leftActions={
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
          className="font-bold h-12 px-6 text-base active:scale-[0.98] transition-transform"
        >
          Cancel
        </Button>
      }
      rightActions={
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedId || loading || success}
          className={cn(
            "bg-construction-blue hover:bg-construction-blue/90 text-white font-bold gap-2",
            "h-12 px-6 text-base",
            "active:scale-[0.98] active:bg-construction-blue/80",
            "transition-all duration-150",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Adding...
            </>
          ) : success ? (
            <>
              <Check className="h-5 w-5" />
              Added!
            </>
          ) : (
            <>
              <HardHat className="h-5 w-5" />
              Add to Project
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="space-y-2">
          <Label
            htmlFor="search-sub"
            className="font-bold text-gray-700 text-base"
          >
            Search Subcontractors
          </Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="search-sub"
              placeholder="Search by company, contact, or trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-12 h-14 text-base",
                "border-2 border-gray-200",
                "focus:border-construction-blue focus:ring-1 focus:ring-[var(--construction-blue)]",
                "rounded-xl",
              )}
              disabled={loading}
            />
          </div>
        </div>

        {/* Subcontractor list */}
        <div className="space-y-2">
          <Label className="font-bold text-gray-700 text-base">
            Select Subcontractor
          </Label>
          <div className="border-2 border-gray-200 rounded-xl max-h-[320px] overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-construction-blue" />
                <span className="mt-3 text-base text-gray-600">
                  Loading subcontractors...
                </span>
              </div>
            ) : filteredSubcontractors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-600">
                  {searchQuery
                    ? "No subcontractors match your search"
                    : "No available subcontractors"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery
                    ? "Try a different search term"
                    : "All subcontractors are already assigned to this project"}
                </p>
              </div>
            ) : (
              <div className="divide-y-2 divide-gray-200">
                <AnimatePresence>
                  {filteredSubcontractors.map((sub, index) => {
                    const tradeConfig =
                      TRADE_LABELS[sub.trade_specialization] ||
                      TRADE_LABELS.other;

                    return (
                      <motion.button
                        key={sub.id}
                        type="button"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          setSelectedId(sub.id);
                          setError(null);
                        }}
                        className={cn(
                          "w-full flex items-start gap-4 p-4",
                          "transition-all duration-150",
                          "active:scale-[0.99]",
                          "min-h-[72px]",
                          selectedId === sub.id
                            ? "bg-construction-blue/10 border-l-4 border-l-[var(--construction-blue)]"
                            : "bg-gray-50 hover:bg-white active:bg-gray-100",
                        )}
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            "font-bold text-sm",
                            selectedId === sub.id
                              ? "bg-construction-blue text-white"
                              : "bg-construction-blue/10 text-construction-blue",
                          )}
                        >
                          {getInitials(sub.company_name)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-gray-900 text-base truncate">
                              {sub.company_name}
                            </p>
                            {selectedId === sub.id && (
                              <Badge className="bg-construction-blue text-white font-bold text-xs flex-shrink-0">
                                Selected
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 truncate flex items-center gap-1.5 mt-0.5">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            {sub.contact_name}
                          </p>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              className={cn(
                                "text-xs font-semibold border-0",
                                tradeConfig.color,
                              )}
                            >
                              {tradeConfig.label}
                            </Badge>
                            {sub.phone && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {sub.phone}
                              </span>
                            )}
                            {renderRating(sub.performance_rating)}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Success message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="h-6 w-6 rounded-full bg-[#059669] flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-green-800 font-medium">
              Subcontractor added to project!
            </p>
          </motion.div>
        )}
      </div>
    </ResponsiveModal>
  );
}
