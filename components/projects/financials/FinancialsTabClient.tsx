"use client";

import { useState, useEffect, useCallback } from "react";
import { getProjectFinancialSummary } from "@/app/actions/project-financials";
import { getBudgetByProject } from "@/app/actions/budgets";
import { getContractsByProject } from "@/app/actions/subcontractor-contracts";
import { getExpensesByProject } from "@/app/actions/expenses";
import { getSubcontractorsByCompany } from "@/app/actions/subcontractors";
import { FinancialSummaryBar } from "./FinancialSummaryBar";
import { BudgetOverview } from "./BudgetOverview";
import { ProjectExpenses } from "./ProjectExpenses";
import { SubContractsList } from "./SubContractsList";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import type { FinancialSummary } from "@/app/actions/project-financials";
import type { ContractWithPayments } from "@/app/actions/subcontractor-contracts";

// Dynamic import — only loaded when user opens modal (bundle-dynamic-imports)
const CreateExpenseModal = dynamic(
  () =>
    import("@/components/expenses/CreateExpenseModal").then((mod) => ({
      default: mod.CreateExpenseModal,
    })),
  { ssr: false },
);

type SubView = "budget" | "expenses" | "subs";

interface FinancialsTabClientProps {
  projectId: string;
  userRole: string | null;
}

// Loading skeleton
function FinancialsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary bar skeleton */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl"
          />
        ))}
      </div>
      {/* Sub-nav skeleton */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 bg-gray-100 dark:bg-gray-800 rounded-xl"
          />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
  );
}

export function FinancialsTabClient({
  projectId,
  userRole,
}: FinancialsTabClientProps) {
  const [activeSubView, setActiveSubView] = useState<SubView>("budget");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [budget, setBudget] = useState<any>(null);
  const [contracts, setContracts] = useState<ContractWithPayments[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<
    Array<{ id: string; company_name: string; contact_name: string | null }>
  >([]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Parallel fetch of all financial data (async-parallel skill)
      const [
        summaryResult,
        budgetResult,
        contractsResult,
        expensesResult,
        subsResult,
      ] = await Promise.all([
        getProjectFinancialSummary(projectId),
        getBudgetByProject(projectId),
        getContractsByProject(projectId),
        getExpensesByProject(projectId),
        getSubcontractorsByCompany(),
      ]);

      if (!summaryResult.success) {
        setError(summaryResult.error || "Failed to load financial data");
        return;
      }

      setSummary(summaryResult.data ?? null);
      setBudget(budgetResult.data ?? null);
      setContracts(contractsResult.data ?? []);
      setExpenses(expensesResult.data ?? []);
      setSubcontractors(subsResult.data ?? []);
    } catch (err) {
      console.error("[FinancialsTabClient] Error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <FinancialsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  const defaultSummary: FinancialSummary = {
    totalBudget: 0,
    totalSpent: 0,
    subPayments: 0,
    netRemaining: 0,
    hasBudget: false,
    percentUsed: 0,
  };

  const SUB_VIEWS: { id: SubView; label: string }[] = [
    { id: "budget", label: "Budget" },
    { id: "expenses", label: "Expenses" },
    { id: "subs", label: "Subs" },
  ];

  return (
    <div className="space-y-4" data-testid="financials-tab">
      {/* Financial Summary Bar — always visible */}
      <FinancialSummaryBar summary={summary ?? defaultSummary} />

      {/* Pill sub-navigation */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {SUB_VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveSubView(view.id)}
            className={cn(
              "flex items-center px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap snap-start",
              "min-h-[44px] min-w-[44px] flex-shrink-0",
              "transition-all duration-200 active:scale-[0.97]",
              activeSubView === view.id
                ? "bg-construction-blue text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
            )}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Sub-view content */}
      <div>
        {activeSubView === "budget" ? (
          <BudgetOverview
            projectId={projectId}
            budget={budget}
            onRefresh={fetchData}
            userRole={userRole}
          />
        ) : null}

        {activeSubView === "expenses" ? (
          <ProjectExpenses
            projectId={projectId}
            expenses={expenses}
            onAddExpense={() => setShowExpenseModal(true)}
            onRefresh={fetchData}
          />
        ) : null}

        {activeSubView === "subs" ? (
          <SubContractsList
            projectId={projectId}
            contracts={contracts}
            subcontractors={subcontractors}
            onRefresh={fetchData}
            userRole={userRole}
          />
        ) : null}
      </div>

      {showExpenseModal ? (
        <CreateExpenseModal
          projects={[{ id: projectId, name: "Project" }]}
          tasks={[]}
          companyId=""
          onClose={() => {
            setShowExpenseModal(false);
            fetchData();
          }}
        />
      ) : null}
    </div>
  );
}
