import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { ExpensesList } from '@/components/expenses/ExpensesList';
import { Receipt, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

async function getExpensesData() {
  // In development without database, return empty data
  if (process.env.NODE_ENV === 'development') {
    try {
      const supabase = await createClient();
      const session = await auth();

      if (!session?.user?.id) {
        return { expenses: [], projects: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 } };
      }

      // Get user's company
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!companyUser) {
        return { expenses: [], projects: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 } };
      }

      // Get all projects for this company
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', companyUser.company_id)
        .eq('status', 'active')
        .order('name');

      // Get all expenses for this company
      const { data: expenses } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects!expenses_project_id_fkey (
            id,
            name,
            company_id
          ),
          task:tasks!expenses_task_id_fkey (
            id,
            title
          )
        `)
        .eq('project.company_id', companyUser.company_id)
        .order('created_at', { ascending: false });

      // Calculate stats
      const stats = {
        total: expenses?.length || 0,
        pending: expenses?.filter(e => e.status === 'submitted' || e.status === 'under_review').length || 0,
        approved: expenses?.filter(e => e.status === 'approved').length || 0,
        rejected: expenses?.filter(e => e.status === 'rejected').length || 0,
        totalAmount: expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
      };

      return {
        expenses: expenses || [],
        projects: projects || [],
        stats,
      };
    } catch (error) {
      console.error('Database not available:', error);
      return { expenses: [], projects: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 } };
    }
  }

  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Get user's company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    redirect('/app/onboarding');
  }

  // Get all projects for this company
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('company_id', companyUser.company_id)
    .eq('status', 'active')
    .order('name');

  // Get all expenses for this company
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      *,
      project:projects!expenses_project_id_fkey (
        id,
        name,
        company_id
      ),
      task:tasks!expenses_task_id_fkey (
        id,
        title
      )
    `)
    .eq('project.company_id', companyUser.company_id)
    .order('created_at', { ascending: false });

  // Calculate stats
  const stats = {
    total: expenses?.length || 0,
    pending: expenses?.filter(e => e.status === 'submitted' || e.status === 'under_review').length || 0,
    approved: expenses?.filter(e => e.status === 'approved').length || 0,
    rejected: expenses?.filter(e => e.status === 'rejected').length || 0,
    totalAmount: expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
  };

  return {
    expenses: expenses || [],
    projects: projects || [],
    stats,
  };
}

export default async function ExpensesPage() {
  const { expenses, projects, stats } = await getExpensesData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

        <div className="flex items-start justify-between pt-2 md:pt-4">
          <div className="space-y-1 md:space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              EXPENSES
            </h1>
            <p className="text-sm md:text-lg font-semibold text-gray-600">
              Receipt Upload, AI OCR, and Expense Management
            </p>
          </div>
        </div>
      </div>

      {/* Industrial Stats Dashboard - 2x2 on mobile, 5 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {/* Total Expenses */}
        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                <Receipt className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">Total</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">{stats.total}</div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Expenses</div>
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-construction-accent" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-accent/60">Pending</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-construction-accent leading-none mb-1">{stats.pending}</div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Need Review</div>
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-construction-green" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-green/60">Approved</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-construction-green leading-none mb-1">{stats.approved}</div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Confirmed</div>
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-red/5 to-construction-red/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-red/10 rounded-lg border-2 border-construction-red/20">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-construction-red" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-red/60">Rejected</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-construction-red leading-none mb-1">{stats.rejected}</div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Declined</div>
            </div>
          </div>
        </div>

        {/* Total Amount - Spans full width on mobile */}
        <div className="relative group col-span-2 md:col-span-1 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">Value</div>
            </div>
            <div>
              <div className="text-xl md:text-4xl font-black text-construction-blue leading-none mb-1">{formatCurrency(stats.totalAmount)}</div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Total Cost</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <ExpensesList expenses={expenses} projects={projects} />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
