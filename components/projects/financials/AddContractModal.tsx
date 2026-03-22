"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { toast } from "sonner";
import { createContract } from "@/app/actions/subcontractor-contracts";
import { cn } from "@/lib/utils";
import FileText from "lucide-react/icons/file-text";

interface Subcontractor {
  id: string;
  company_name: string;
  contact_name?: string | null;
}

interface AddContractModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  subcontractors: Subcontractor[];
}

const PHASE_SUGGESTIONS = [
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "FRAMING",
  "ROOFING",
  "DRYWALL",
  "FLOORING",
  "PAINTING",
  "MASONRY",
  "LANDSCAPING",
  "CONCRETE",
  "GENERAL",
];

export function AddContractModal({
  projectId,
  isOpen,
  onClose,
  onCreated,
  subcontractors,
}: AddContractModalProps) {
  const [subcontractorId, setSubcontractorId] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [phase, setPhase] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subcontractorId) {
      toast.error("Select a subcontractor");
      return;
    }
    const amount = parseFloat(contractAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid contract amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createContract({
        projectId,
        subcontractorId,
        contractAmount: amount,
        phase: phase.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        toast.success("Contract created");
        onCreated();
        onClose();
      } else {
        toast.error(result.error || "Failed to create contract");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={FileText}
      title="Add Contract"
      theme="default"
      maxWidth="lg"
      showNavigation={true}
      onBack={onClose}
      backLabel="Cancel"
      onContinue={handleSubmit}
      continueLabel={isSubmitting ? "Creating..." : "Add Contract"}
      continueDisabled={isSubmitting}
    >
      <div className="space-y-4">
        {/* Subcontractor */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Subcontractor *
          </Label>
          <select
            value={subcontractorId}
            onChange={(e) => setSubcontractorId(e.target.value)}
            className={cn(
              "w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "focus:border-construction-blue focus:outline-none min-h-[44px]",
              !subcontractorId ? "text-gray-400" : "",
            )}
          >
            <option value="">Select subcontractor...</option>
            {subcontractors.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.company_name}
                {sub.contact_name ? ` — ${sub.contact_name}` : ""}
              </option>
            ))}
          </select>
          {subcontractors.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No subcontractors found. Add subcontractors in the Team section
              first.
            </p>
          ) : null}
        </div>

        {/* Contract Amount */}
        <CurrencyInput
          label="Contract Amount *"
          placeholder="0.00"
          value={contractAmount}
          onValueChange={(val) => setContractAmount(val || "")}
        />

        {/* Phase */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Phase / Trade (Optional)
          </Label>
          <input
            list="phase-suggestions"
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            placeholder='e.g., "ELECTRICAL", "FRAMING"'
            className={cn(
              "w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "focus:border-construction-blue focus:outline-none min-h-[44px]",
            )}
          />
          <datalist id="phase-suggestions">
            {PHASE_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Notes (Optional)
          </Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Scope of work, terms, etc."
            className={cn(
              "w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "focus:border-construction-blue focus:outline-none resize-none",
            )}
          />
        </div>
      </div>
    </ResponsiveModal>
  );
}
