"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SubContractCard } from "./SubContractCard";
import { AddContractModal } from "./AddContractModal";
import type { ContractWithPayments } from "@/app/actions/subcontractor-contracts";
import Users from "lucide-react/icons/users";
import Plus from "lucide-react/icons/plus";

interface Subcontractor {
  id: string;
  company_name: string;
  contact_name?: string | null;
}

interface SubContractsListProps {
  projectId: string;
  contracts: ContractWithPayments[];
  subcontractors: Subcontractor[];
  onRefresh: () => void;
  userRole: string | null;
}

export function SubContractsList({
  projectId,
  contracts,
  subcontractors,
  onRefresh,
  userRole,
}: SubContractsListProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const canManage = userRole === "admin" || userRole === "pm";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            Subcontractor Contracts
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {canManage ? (
          <button
            onClick={() => setShowAddModal(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs",
              "bg-construction-blue text-white shadow-md",
              "hover:bg-construction-blue/90 active:scale-[0.97] transition-all",
              "min-h-[44px] min-w-[44px]",
            )}
          >
            <Plus className="h-4 w-4" />
            Add Contract
          </button>
        ) : null}
      </div>

      {/* Empty state */}
      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="p-4 bg-construction-blue/10 dark:bg-blue-900/30 rounded-full">
            <Users className="h-8 w-8 text-construction-blue dark:text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
              No contracts yet
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Track subcontractor contracts, payments, and compliance
            </p>
          </div>
          {canManage ? (
            <button
              onClick={() => setShowAddModal(true)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm",
                "bg-construction-blue text-white shadow-lg",
                "hover:bg-construction-blue/90 active:scale-[0.97] transition-all",
                "min-h-[44px]",
              )}
            >
              <Plus className="h-4 w-4" />
              Add Contract
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {contracts.map((contract) => (
            <SubContractCard
              key={contract.id}
              contract={contract}
              onRefresh={onRefresh}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {showAddModal ? (
        <AddContractModal
          projectId={projectId}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={onRefresh}
          subcontractors={subcontractors}
        />
      ) : null}
    </div>
  );
}
