import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { MaterialsSearch } from '@/components/materials/MaterialsSearch';
import { MaterialSummary } from '@/components/materials/MaterialSummary';
import { TrackedMaterialsCarousel } from '@/components/materials/TrackedMaterialsCarousel';
import { MaterialsList } from '@/components/materials/MaterialsList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  getTaskLinkedMaterials,
  getTrackedMaterials,
  getMaterialSummaryStats,
} from '@/app/actions/materials';
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

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  console.log('[MaterialsPage] Rendering with searchParams:', params);

  const page = parseInt(params.page || '1');
  const { projects, totalMaterials, totalCost, pendingOrders } = await getMaterialsData();

  // Parallel data fetching for new components
  const [materialsResult, trackedResult, statsResult] = await Promise.all([
    getTaskLinkedMaterials(page, 12),
    getTrackedMaterials(),
    getMaterialSummaryStats(),
  ]);

  // Handle errors from server actions
  if (materialsResult.error) {
    console.error('[MaterialsPage] Error fetching materials:', materialsResult.error);
  }
  if (trackedResult.error) {
    console.error('[MaterialsPage] Error fetching tracked materials:', trackedResult.error);
  }
  if (statsResult.error) {
    console.error('[MaterialsPage] Error fetching summary stats:', statsResult.error);
  }

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
              MATERIALS
            </h1>
            <p className="text-sm md:text-lg font-semibold text-gray-600">
              Home Depot Product Search & Procurement Management
            </p>
          </div>
        </div>
      </div>

         {/* New Materials Enhancement Section */}
      <div className="space-y-4 md:space-y-6">
        {/* MaterialSummary - 5-card grid with stats */}
        <ErrorBoundary>
          {statsResult.data ? (
            <MaterialSummary
              stats={statsResult.data}
              trackedCount={trackedResult.data?.length || 0}
            />
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              Unable to load summary stats
            </div>
          )}
        </ErrorBoundary>


      {/* Materials Search Interface */}
      <MaterialsSearch projects={projects} />

        {/* TrackedMaterialsCarousel - horizontal scroll */}
        <ErrorBoundary>
          <TrackedMaterialsCarousel
            materials={trackedResult.data || []}
          />
        </ErrorBoundary>

        {/* MaterialsList - paginated grid */}
        <ErrorBoundary>
          <MaterialsList
            initialMaterials={materialsResult.data?.materials || []}
            initialPage={page}
            initialTotalPages={materialsResult.data?.totalPages || 1}
          />
        </ErrorBoundary>
      </div>




      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
