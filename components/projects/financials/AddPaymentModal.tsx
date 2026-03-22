"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { toast } from "sonner";
import { createPayment } from "@/app/actions/subcontractor-payments";
import { getPaymentMethodSuggestions } from "@/app/actions/expenses";
import { cn } from "@/lib/utils";
import CreditCard from "lucide-react/icons/credit-card";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import ChevronDown from "lucide-react/icons/chevron-down";

const DEFAULT_METHODS = ["VISA", "AMEX", "ZELLE", "CASH", "CHECK", "DEBIT"];

interface AddPaymentModalProps {
  contractId: string;
  contractAmount: number;
  paidToDate: number;
  subName: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddPaymentModal({
  contractId,
  contractAmount,
  paidToDate,
  subName,
  isOpen,
  onClose,
  onCreated,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_METHODS);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    getPaymentMethodSuggestions().then((result) => {
      if (result.data && result.data.length > 0) {
        const merged = Array.from(
          new Set([...result.data, ...DEFAULT_METHODS]),
        );
        setSuggestions(merged);
      }
    });
  }, []);

  const parsedAmount = parseFloat(amount) || 0;
  const remaining = contractAmount - paidToDate;
  const wouldExceed = parsedAmount > remaining && remaining > 0;

  const handleSubmit = async () => {
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    const method = paymentMethod || paymentMethodInput;
    if (!method.trim()) {
      toast.error("Payment method is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPayment({
        contractId,
        amount: parsedAmount,
        paymentDate,
        paymentMethod: method.trim(),
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        toast.success("Payment recorded");
        onCreated();
        onClose();
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(paymentMethodInput.toLowerCase()),
  );

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={CreditCard}
      title={`Add Payment — ${subName}`}
      theme="default"
      maxWidth="lg"
      showNavigation={true}
      onBack={onClose}
      backLabel="Cancel"
      onContinue={handleSubmit}
      continueLabel={isSubmitting ? "Recording..." : "Record Payment"}
      continueDisabled={isSubmitting}
    >
      <div className="space-y-4">
        {/* Overpayment warning */}
        {wouldExceed ? (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This payment exceeds the contract balance of{" "}
              <strong>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(remaining)}
              </strong>
              . You can still proceed.
            </p>
          </div>
        ) : null}

        {/* Amount */}
        <CurrencyInput
          label="Amount *"
          placeholder="0.00"
          value={amount}
          onValueChange={(val) => setAmount(val || "")}
          error={
            parsedAmount > 0 && wouldExceed
              ? `Exceeds remaining balance of $${remaining.toFixed(2)}`
              : undefined
          }
        />

        {/* Payment Date */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Payment Date *
          </Label>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="border-2"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2 relative">
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Payment Method *
          </Label>
          <div className="relative">
            <input
              type="text"
              value={paymentMethodInput || paymentMethod}
              onChange={(e) => {
                setPaymentMethodInput(e.target.value);
                setPaymentMethod("");
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder='e.g., "ZELLE", "CHK 2843", "VISA 4516"'
              className={cn(
                "w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                "focus:border-construction-blue focus:outline-none min-h-[44px]",
              )}
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {showSuggestions && filteredSuggestions.length > 0 ? (
            <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {filteredSuggestions.map((method) => (
                <button
                  key={method}
                  type="button"
                  onMouseDown={() => {
                    setPaymentMethod(method);
                    setPaymentMethodInput(method);
                    setShowSuggestions(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm font-medium",
                    "hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600",
                    "min-h-[44px] transition-colors",
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          ) : null}
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
            placeholder="Any notes about this payment..."
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
