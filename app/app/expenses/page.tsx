import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { ExpensesList } from '@/components/expenses/ExpensesList';
import { ExpensesListSkeleton } from '@/components/expenses/ExpensesListSkeleton';
import { ExpensesPageHeader } from '@/components/expenses/ExpensesPageHeader';
import { ExpenseSummary } from '@/components/expenses/ExpenseSummary';
import { getExpenseAnalytics } from '@/app/actions/expenses';

// Debug: Server-side data fetching for expenses page
async function getExpensesData() {
  console.log('[ExpensesPage] Fetching expenses data...');

  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  // In development without database, return empty data
  if (process.env.NODE_ENV === 'development') {
    try {
      const supabase = await createClient();

      // Get user's company
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id, role')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!companyUser) {
        return { expenses: [], projects: [], tasks: [], role: null, companyId: undefined };
      }

      // Get all projects for this company
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, end_date')
        .eq('company_id', companyUser.company_id)
        .eq('status', 'active')
        .order('name');

      // Get all tasks for this company's projects
      // Debug: Filter by project IDs instead of trying to join through company
      const projectIds = projects?.map(p => p.id) || [];

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, project_id, task_type')
        .in('project_id', projectIds)
        .order('created_at');

      console.log('[ExpensesPage] Project IDs:', projectIds);
      console.log('[ExpensesPage] Tasks query error:', tasksError);
      console.log('[ExpensesPage] Fetched tasks:', tasks);

      // Get all expenses for this company
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects!expenses_project_id_fkey (
            id,
            name
          ),
          task:tasks!expenses_task_id_fkey (
            id,
            title
          )
        `)
        .eq('company_id', companyUser.company_id)
        .order('created_at', { ascending: false });

      console.log('[ExpensesPage] Expenses query error:', expensesError);
      console.log(`[ExpensesPage] Successfully fetched ${expenses?.length || 0} expenses`);

      return {
        expenses: expenses || [],
        projects: (projects || []) as any[],
        tasks: tasks || [],
        role: companyUser.role,
        companyId: companyUser.company_id,
      };
    } catch (error) {
      console.error('[ExpensesPage] Database error:', error);
      return { expenses: [], projects: [], tasks: [], role: null, companyId: undefined };
    }
  }

  const supabase = await createClient();

  // Get user's company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    redirect('/app/onboarding');
  }

  // Get all projects for this company
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, end_date')
    .eq('company_id', companyUser.company_id)
    .eq('status', 'active')
    .order('name');

  // Get all tasks for this company's projects
  const projectIds = projects?.map(p => p.id) || [];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, project_id, task_type')
    .in('project_id', projectIds)
    .order('created_at');

  // Get all expenses for this company
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      *,
      project:projects!expenses_project_id_fkey (
        id,
        name
      ),
      task:tasks!expenses_task_id_fkey (
        id,
        title
      )
    `)
    .eq('company_id', companyUser.company_id)
    .order('created_at', { ascending: false });

  console.log(`[ExpensesPage] Successfully fetched ${expenses?.length || 0} expenses`);

  return {
    expenses: expenses || [],
    projects: projects || [],
    tasks: tasks || [],
    role: companyUser.role,
    companyId: companyUser.company_id,
  };
}

export const metadata = {
  title: 'Expenses | GenHub',
  description: 'Manage construction project expenses',
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [expensesData, analyticsResult] = await Promise.all([
    getExpensesData(),
    getExpenseAnalytics(),
  ]);
  const { expenses, projects, tasks, role, companyId } = expensesData;
  const analytics = analyticsResult.data || null;

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          color: '#001B51'
        }} />
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
          <ExpensesPageHeader projects={projects} tasks={tasks} companyId={companyId} />
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
