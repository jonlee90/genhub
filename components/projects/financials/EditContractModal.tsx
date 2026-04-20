"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { toast } from "sonner";
import {
  updateContract,
  type ContractWithPayments,
} from "@/app/actions/subcontractor-contracts";
import { cn } from "@/lib/utils";
import FileText from "lucide-react/icons/file-text";

interface EditContractModalProps {
  contract: ContractWithPayments;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
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

type ContractStatus = "active" | "completed" | "cancelled";

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function EditContractModal({
  contract,
  isOpen,
  onClose,
  onUpdated,
}: EditContractModalProps) {
  const [contractAmount, setContractAmount] = useState(
    String(contract.contractAmount),
  );
  const [phase, setPhase] = useState(contract.phase ?? "");
  const [status, setStatus] = useState<ContractStatus>(
    contract.status as ContractStatus,
  );
  const [notes, setNotes] = useState(contract.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amount = parseFloat(contractAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid contract amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateContract({
        contractId: contract.id,
        contractAmount: amount,
        phase: phase.trim() ? phase.trim() : null,
        status,
        notes: notes.trim() ? notes.trim() : null,
      });

      if (result.success) {
        toast.success("Contract updated");
        onUpdated();
        onClose();
      } else {
        toast.error(result.error || "Failed to update contract");
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
      title="Edit Contract"
      theme="default"
      maxWidth="lg"
      showNavigation={true}
      onBack={onClose}
      backLabel="Cancel"
      onContinue={handleSubmit}
      continueLabel={isSubmitting ? "Saving..." : "Save Changes"}
      continueDisabled={isSubmitting}
    >
      <div className="space-y-4">
        {/* Subcontractor (read-only) */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Subcontractor
          </Label>
          <div
            className={cn(
              "w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm",
              "bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300",
              "min-h-[44px] flex flex-col justify-center",
            )}
          >
            <div className="font-semibold">
              {contract.subcontractor.company_name}
            </div>
            {contract.subcontractor.contact_name ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {contract.subcontractor.contact_name}
              </div>
            ) : null}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Subcontractor cannot be changed. Delete and recreate the contract to
            reassign.
          </p>
        </div>

        {/* Contract Amount */}
        <CurrencyInput
          label="Contract Amount *"
          placeholder="0.00"
          value={contractAmount}
          onValueChange={(val) => setContractAmount(val || "")}
        />

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Status
          </Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContractStatus)}
            className={cn(
              "w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "focus:border-construction-blue focus:outline-none min-h-[44px]",
            )}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Phase */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Phase / Trade (Optional)
          </Label>
          <input
            list="edit-phase-suggestions"
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            placeholder='e.g., "ELECTRICAL", "FRAMING"'
            className={cn(
              "w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "focus:border-construction-blue focus:outline-none min-h-[44px]",
            )}
          />
          <datalist id="edit-phase-suggestions">
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
