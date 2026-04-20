"use client";

import { useState, useEffect, useCallback } from "react";
import { getProjectFinancialSummary } from "@/app/actions/project-financials";
import { getBudgetByProject } from "@/app/actions/budgets";
import { getContractsByProject } from "@/app/actions/subcontractor-contracts";
import { getExpensesByProject } from "@/app/actions/expenses";
import { getSubcontractorsByCompany } from "@/app/actions/subcontractors";
import { getProjectTasksForExpenseModal } from "@/app/actions/tasks";
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

type ExpenseModalTask = {
  id: string;
  title: string;
  project_id: string;
  task_type: string | null;
};

// Module-level cache — survives tab switches (component unmount/remount)
interface FinancialsCacheEntry {
  summary: FinancialSummary | null;
  budget: any;
  contracts: ContractWithPayments[];
  expenses: any[];
  subcontractors: Array<{
    id: string;
    company_name: string;
    contact_name: string | null;
  }>;
  tasks: ExpenseModalTask[];
  timestamp: number;
}
const FINANCIALS_CACHE_TTL = 5 * 60 * 1000;
const financialsCache = new Map<string, FinancialsCacheEntry>();

interface FinancialsTabClientProps {
  projectId: string;
  projectName: string;
  userRole: string | null;
  companyId: string;
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
  projectName,
  userRole,
  companyId,
}: FinancialsTabClientProps) {
  const [activeSubView, setActiveSubView] = useState<SubView>("expenses");
  const [isLoading, setIsLoading] = useState(
    () => !financialsCache.has(projectId),
  );
  const [error, setError] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [budget, setBudget] = useState<any>(null);
  const [contracts, setContracts] = useState<ContractWithPayments[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<
    Array<{ id: string; company_name: string; contact_name: string | null }>
  >([]);
  const [tasks, setTasks] = useState<ExpenseModalTask[]>([]);

  const fetchData = useCallback(
    async (invalidateCache = false) => {
      if (invalidateCache) {
        financialsCache.delete(projectId);
      }

      // Serve from cache if still fresh (avoids refetch on tab switch remount)
      const cached = financialsCache.get(projectId);
      if (cached && Date.now() - cached.timestamp < FINANCIALS_CACHE_TTL) {
        setSummary(cached.summary);
        setBudget(cached.budget);
        setContracts(cached.contracts);
        setExpenses(cached.expenses);
        setSubcontractors(cached.subcontractors);
        setTasks(cached.tasks);
        setIsLoading(false);
        return;
      }

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
          tasksResult,
        ] = await Promise.all([
          getProjectFinancialSummary(projectId),
          getBudgetByProject(projectId),
          getContractsByProject(projectId),
          getExpensesByProject(projectId),
          getSubcontractorsByCompany(),
          getProjectTasksForExpenseModal(projectId),
        ]);

        if (!summaryResult.success) {
          setError(summaryResult.error || "Failed to load financial data");
          return;
        }

        const mappedTasks: ExpenseModalTask[] = (
          tasksResult.success ? (tasksResult.data ?? []) : []
        ).map((t: any) => ({
          id: t.id,
          title: t.title,
          project_id: t.project_id,
          task_type: t.task_type ?? null,
        }));

        const entry: FinancialsCacheEntry = {
          summary: summaryResult.data ?? null,
          budget: budgetResult.data ?? null,
          contracts: contractsResult.data ?? [],
          expenses: expensesResult.data ?? [],
          subcontractors: subsResult.data ?? [],
          tasks: mappedTasks,
          timestamp: Date.now(),
        };
        // Evict oldest entry when cache exceeds 20 projects
        if (financialsCache.size >= 20) {
          financialsCache.delete(financialsCache.keys().next().value!);
        }
        financialsCache.set(projectId, entry);

        setSummary(entry.summary);
        setBudget(entry.budget);
        setContracts(entry.contracts);
        setExpenses(entry.expenses);
        setSubcontractors(entry.subcontractors);
        setTasks(entry.tasks);
      } catch (err) {
        console.error("[FinancialsTabClient] Error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [projectId],
  );

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
    { id: "subs", label: "Subs" },
    { id: "expenses", label: "Expenses" },
    { id: "budget", label: "Budget" },
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
            onRefresh={() => fetchData(true)}
            userRole={userRole}
          />
        ) : null}

        {activeSubView === "expenses" ? (
          <ProjectExpenses
            projectId={projectId}
            projectName={projectName}
            expenses={expenses}
            tasks={tasks}
            onAddExpense={() => setShowExpenseModal(true)}
            onRefresh={() => fetchData(true)}
            userRole={userRole}
            companyId={companyId}
          />
        ) : null}

        {activeSubView === "subs" ? (
          <SubContractsList
            projectId={projectId}
            contracts={contracts}
            subcontractors={subcontractors}
            onRefresh={() => fetchData(true)}
            userRole={userRole}
          />
        ) : null}
      </div>

      {showExpenseModal ? (
        <CreateExpenseModal
          projects={[{ id: projectId, name: projectName }]}
          tasks={tasks}
          companyId={companyId}
          defaultProjectId={projectId}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => fetchData(true)}
        />
      ) : null}
    </div>
  );
}
