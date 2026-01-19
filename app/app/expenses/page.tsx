import { Suspense } from "react";
import { ExpensesList } from "@/components/expenses/ExpensesList";
import { ExpensesListSkeleton } from "@/components/expenses/ExpensesListSkeleton";
import { ExpensesPageHeader } from "@/components/expenses/ExpensesPageHeader";
import { ExpenseSummary } from "@/components/expenses/ExpenseSummary";
import { getExpenseAnalytics } from "@/app/actions/expenses";
import { getExpensesData } from "@/lib/expenses";

export const dynamic = "force-dynamic";

const BLUEPRINT_BACKGROUND_STYLE = {
  backgroundImage: `
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
  color: "#001B51",
} as const;

export const metadata = {
  title: "Expenses | GenHub",
  description: "Manage construction project expenses",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, expensesData, analyticsResult] = await Promise.all([
    searchParams,
    getExpensesData(),
    getExpenseAnalytics(),
  ]);
  const { expenses, projects, tasks, companyId } = expensesData;

  // Handle analytics error - fallback to null if error occurs
  const analytics = analyticsResult.error ? null : (analyticsResult.data || null);

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={BLUEPRINT_BACKGROUND_STYLE} />
      </div>

      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-2 md:pt-4 gap-3">
          <div className="space-y-1 md:space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              EXPENSES
            </h1>
          </div>

          {/* Action Button with Construction Theme */}
          <ExpensesPageHeader
            projects={projects}
            tasks={tasks}
            companyId={companyId}
          />
        </div>
      </div>

      {/* Expense Summary Cards */}
      <ExpenseSummary analytics={analytics} />

      {/* Expenses List with Filters */}
      <Suspense fallback={<ExpensesListSkeleton />}>
        <ExpensesList
          initialExpenses={expenses}
          projects={projects}
          tasks={tasks}
          searchParams={params}
          companyId={companyId}
        />
      </Suspense>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
