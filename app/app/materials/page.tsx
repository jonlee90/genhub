import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { MaterialsSearch } from '@/components/materials/MaterialsSearch';
import { Package, Boxes, DollarSign, TrendingUp } from 'lucide-react';

async function getMaterialsData() {
  // In development without database, return empty data
  if (process.env.NODE_ENV === 'development') {
    try {
      const supabase = await createClient();
      const session = await auth();

      if (!session?.user?.id) {
        return { projects: [], totalMaterials: 0, totalCost: 0, pendingOrders: 0 };
      }

      // Get user's company
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!companyUser) {
        return { projects: [], totalMaterials: 0, totalCost: 0, pendingOrders: 0 };
      }

      // Get all projects for this company
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', companyUser.company_id)
        .eq('status', 'active')
        .order('name');

      // Get material assignments count
      const { count: totalMaterials } = await supabase
        .from('material_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('project.company_id', companyUser.company_id);

      // Get pending orders count
      const { count: pendingOrders } = await supabase
        .from('material_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('project.company_id', companyUser.company_id)
        .eq('procurement_status', 'needed');

      // Get total cost
      const { data: costData } = await supabase
        .from('material_assignments')
        .select('total_cost')
        .eq('project.company_id', companyUser.company_id);

      const totalCost = costData?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;

      return {
        projects: projects || [],
        totalMaterials: totalMaterials || 0,
        totalCost,
        pendingOrders: pendingOrders || 0,
      };
    } catch (error) {
      console.error('Database not available:', error);
      return { projects: [], totalMaterials: 0, totalCost: 0, pendingOrders: 0 };
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

  // Get material assignments count
  const { count: totalMaterials } = await supabase
    .from('material_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('project.company_id', companyUser.company_id);

  // Get pending orders count
  const { count: pendingOrders } = await supabase
    .from('material_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('project.company_id', companyUser.company_id)
    .eq('procurement_status', 'needed');

  // Get total cost
  const { data: costData } = await supabase
    .from('material_assignments')
    .select('total_cost')
    .eq('project.company_id', companyUser.company_id);

  const totalCost = costData?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;

  return {
    projects: projects || [],
    totalMaterials: totalMaterials || 0,
    totalCost,
    pendingOrders: pendingOrders || 0,
  };
}

export default async function MaterialsPage() {
  const { projects, totalMaterials, totalCost, pendingOrders } = await getMaterialsData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 relative overflow-hidden">
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

        <div className="flex items-start justify-between pt-4">
          <div className="space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-5xl font-black tracking-tighter text-construction-blue leading-none">
              MATERIALS
            </h1>
            <p className="text-lg font-semibold text-gray-600">
              Home Depot Product Search & Procurement Management
            </p>
          </div>
        </div>
      </div>

      {/* Industrial Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Materials */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                <Boxes className="h-5 w-5 text-construction-blue" />
              </div>
              <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">Total</div>
            </div>
            <div className="text-4xl font-black text-construction-blue leading-none mb-1">{totalMaterials}</div>
            <div className="text-sm font-bold text-gray-600">Materials Assigned</div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                <Package className="h-5 w-5 text-construction-accent" />
              </div>
              <div className="text-xs font-mono uppercase tracking-wider text-construction-accent/60">Pending</div>
            </div>
            <div className="text-4xl font-black text-construction-accent leading-none mb-1">{pendingOrders}</div>
            <div className="text-sm font-bold text-gray-600">Need to Order</div>
          </div>
        </div>

        {/* Total Cost */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                <DollarSign className="h-5 w-5 text-construction-green" />
              </div>
              <div className="text-xs font-mono uppercase tracking-wider text-construction-green/60">Cost</div>
            </div>
            <div className="text-4xl font-black text-construction-green leading-none mb-1">{formatCurrency(totalCost)}</div>
            <div className="text-sm font-bold text-gray-600">Total Value</div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                <TrendingUp className="h-5 w-5 text-construction-blue" />
              </div>
              <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">Active</div>
            </div>
            <div className="text-4xl font-black text-construction-blue leading-none mb-1">{projects.length}</div>
            <div className="text-sm font-bold text-gray-600">Projects</div>
          </div>
        </div>
      </div>

      {/* Materials Search Interface */}
      <MaterialsSearch projects={projects} />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
