"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteContract } from "@/app/actions/subcontractor-contracts";
import { deletePayment } from "@/app/actions/subcontractor-payments";
import { AddPaymentModal } from "./AddPaymentModal";
import type { ContractWithPayments } from "@/app/actions/subcontractor-contracts";
import Plus from "lucide-react/icons/plus";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronUp from "lucide-react/icons/chevron-up";
import MoreHorizontal from "lucide-react/icons/more-horizontal";
import Trash2 from "lucide-react/icons/trash-2";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const fmt = (v: number) => currencyFormatter.format(v);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface SubContractCardProps {
  contract: ContractWithPayments;
  onRefresh: () => void;
}

export function SubContractCard({ contract, onRefresh }: SubContractCardProps) {
  const [showPayments, setShowPayments] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const pct =
    contract.contractAmount > 0
      ? (contract.paidToDate / contract.contractAmount) * 100
      : 0;

  const getProgressColor = (p: number) => {
    if (p >= 100) return "bg-green-500";
    if (p >= 75) return "bg-yellow-500";
    return "bg-construction-blue";
  };

  const handleDelete = async () => {
    if (contract.payments.length > 0) {
      toast.error(
        "Cannot delete contract with existing payments. Delete payments first.",
      );
      return;
    }
    if (
      !confirm(`Delete contract with ${contract.subcontractor.company_name}?`)
    )
      return;

    const result = await deleteContract(contract.id);
    if (result.success) {
      toast.success("Contract deleted");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete contract");
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Delete this payment?")) return;
    const result = await deletePayment(paymentId);
    if (result.success) {
      toast.success("Payment deleted");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete payment");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">
              {contract.subcontractor.company_name}
            </div>
            {contract.subcontractor.contact_name ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {contract.subcontractor.contact_name}
              </div>
            ) : null}
            {contract.phase ? (
              <span className="inline-block mt-1 px-2 py-0.5 bg-construction-blue/10 dark:bg-blue-950/30 text-construction-blue dark:text-blue-300 rounded-md text-xs font-bold uppercase tracking-wide">
                {contract.phase}
              </span>
            ) : null}
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              aria-label="More options"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.97] transition-all"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {showMenu ? (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden min-w-[150px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 min-h-[44px] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Contract
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Contract
            </div>
            <div className="font-bold text-gray-800 dark:text-gray-200">
              {fmt(contract.contractAmount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Paid
            </div>
            <div className="font-bold text-green-600 dark:text-green-400">
              {fmt(contract.paidToDate)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Balance
            </div>
            <div className="font-bold text-gray-800 dark:text-gray-200">
              {fmt(contract.unpaidBalance)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                getProgressColor(pct),
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {Math.round(pct)}% paid
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setShowPaymentModal(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs",
              "bg-construction-blue text-white shadow-sm",
              "hover:bg-construction-blue/90 active:scale-[0.97] transition-all",
              "min-h-[44px]",
            )}
          >
            <Plus className="h-4 w-4" />
            Add Payment
          </button>

          {contract.payments.length > 0 ? (
            <button
              onClick={() => setShowPayments((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs",
                "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
                "hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.97] transition-all",
                "min-h-[44px]",
              )}
            >
              {showPayments ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {contract.payments.length} Payment
              {contract.payments.length !== 1 ? "s" : ""}
            </button>
          ) : null}
        </div>
      </div>

      {/* Payment history */}
      {showPayments && contract.payments.length > 0 ? (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Payment History
          </div>
          {contract.payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between gap-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {fmt(payment.amount)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span>
                    {dateFormatter.format(new Date(payment.payment_date))}
                  </span>
                  <span>·</span>
                  <span className="font-medium">{payment.payment_method}</span>
                </div>
                {payment.notes ? (
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {payment.notes}
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => handleDeletePayment(payment.id)}
                aria-label="Delete payment"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.97] transition-all shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {showPaymentModal ? (
        <AddPaymentModal
          contractId={contract.id}
          contractAmount={contract.contractAmount}
          paidToDate={contract.paidToDate}
          subName={contract.subcontractor.company_name}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onCreated={onRefresh}
        />
      ) : null}
    </div>
  );
}
