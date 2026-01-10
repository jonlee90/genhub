import { createUserClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubcontractorList } from '@/components/team/SubcontractorList';
import { Database } from '@/types/database.types';
import { HardHat, Briefcase, AlertTriangle, Shield } from 'lucide-react';

type Subcontractor = Database['public']['Tables']['subcontractors']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export const metadata = {
  title: 'Subcontractors | GenHub',
  description: 'Manage your subcontractor directory',
};

export default async function SubcontractorsPage() {
  // Get authenticated user session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Create user-scoped Supabase client
  const supabase = await createUserClient();

  // Get user's company and role
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Company Found</h1>
          <p className="text-gray-600">You are not associated with any active company.</p>
        </div>
      </div>
    );
  }

  // Authorization check - only Admin and Project Manager
  if (companyUser.role !== 'admin' && companyUser.role !== 'project_manager') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            Only Admins and Project Managers can access the subcontractor directory.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all subcontractors for the company
  const { data: subcontractors, error: subcontractorsError } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('company_id', companyUser.company_id)
    .order('created_at', { ascending: false });

  if (subcontractorsError) {
    console.error('Error fetching subcontractors:', subcontractorsError);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Subcontractors</h1>
          <p className="text-gray-600">Failed to load subcontractors. Please try again.</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const allSubcontractors = subcontractors || [];
  const totalSubcontractors = allSubcontractors.length;
  const activeSubcontractors = allSubcontractors.filter((s) => s.is_active).length;

  // Helper to check if a date is expiring (within 30 days)
  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const expiringLicenses = allSubcontractors.filter((s) =>
    s.is_active && isExpiringSoon(s.license_expiry)
  ).length;

  const expiringInsurance = allSubcontractors.filter((s) =>
    s.is_active && isExpiringSoon(s.insurance_expiry)
  ).length;

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            color: '#001B51',
          }}
        />
      </div>

      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-2 md:pt-4">
          <div className="space-y-1 md:space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              SUBCONTRACTORS
            </h1>
          </div>
        </div>
      </div>

      {/* Industrial Stats Dashboard */}
      {totalSubcontractors > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Total Subcontractors */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <HardHat className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                  Total
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">
                  {totalSubcontractors}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Subcontractors</div>
              </div>
            </div>
          </div>

          {/* Active Subcontractors */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                  <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-construction-green" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-green/60">
                  Active
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-green leading-none mb-1">
                  {activeSubcontractors}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Active Status</div>
              </div>
            </div>
          </div>

          {/* Expiring Licenses */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-yellow/5 to-construction-yellow/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-yellow/10 rounded-lg border-2 border-construction-yellow/20">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-construction-yellow" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-yellow/60">
                  Warning
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-yellow leading-none mb-1">
                  {expiringLicenses}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Expiring Licenses</div>
              </div>
            </div>
          </div>

          {/* Expiring Insurance */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-red/5 to-construction-red/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-red/10 rounded-lg border-2 border-construction-red/20">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-construction-red" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-red/60">
                  Alert
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-red leading-none mb-1">
                  {expiringInsurance}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Expiring Insurance</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subcontractor List */}
      <div className="relative">
        <SubcontractorList
          subcontractors={allSubcontractors}
          currentUserRole={companyUser.role}
          companyId={companyUser.company_id}
        />
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
