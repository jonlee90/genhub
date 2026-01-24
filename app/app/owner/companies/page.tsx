import { getAllCompanies, getOwnerDashboardStats } from '@/app/actions/owner';
import { Building2, Users, FolderKanban, Mail } from 'lucide-react';
import { OwnerPageHeader } from '@/components/owner/OwnerPageHeader';
import { OwnerStatsGrid } from '@/components/owner/OwnerStatsGrid';
import { OwnerDataTable } from '@/components/owner/OwnerDataTable';
import { CompanyCard } from '@/components/owner/CompanyCard';

/**
 * Owner Companies Page
 *
 * Server Component - Displays all companies on the platform.
 * Accessible only by platform owners.
 */
export default async function OwnerCompaniesPage() {
  console.log('[OwnerCompaniesPage] Fetching companies');

  const [companiesResult, statsResult] = await Promise.all([
    getAllCompanies(),
    getOwnerDashboardStats(),
  ]);

  if (companiesResult.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Companies</h1>
          <p className="text-gray-600 dark:text-gray-400">{companiesResult.error}</p>
        </div>
      </div>
    );
  }

  const companies = companiesResult.data || [];
  const stats = statsResult.data;

  // Prepare stats for grid
  const statsData = stats
    ? [
        {
          title: 'Companies',
          value: stats.totalCompanies,
          icon: Building2,
          variant: 'default' as const,
        },
        {
          title: 'Users',
          value: stats.totalUsers,
          icon: Users,
          variant: 'success' as const,
        },
        {
          title: 'Projects',
          value: stats.totalProjects,
          icon: FolderKanban,
          variant: 'default' as const,
        },
        {
          title: 'Pending Invites',
          value: stats.pendingInvitations,
          icon: Mail,
          variant: 'warning' as const,
        },
      ]
    : [];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      {/* Page Header */}
      <OwnerPageHeader
        title="COMPANIES"
        subtitle="All registered companies on GenHub"
        icon={Building2}
      />

      {/* Stats Grid */}
      {stats && <OwnerStatsGrid stats={statsData} columns={4} />}

      {/* Companies Data Table */}
      <OwnerDataTable
        data={companies}
        columns={[
          { key: 'name', header: 'Company Name' },
          { key: 'email', header: 'Email', hiddenOnMobile: true },
          { key: 'user_count', header: 'Users' },
          { key: 'project_count', header: 'Projects' },
        ]}
        keyField="id"
        searchable
        searchKeys={['name', 'email', 'address']}
        emptyState={{
          icon: Building2,
          title: 'No Companies Yet',
          description: 'Companies will appear here once admins accept their invitations.',
        }}
        renderCard={(company) => <CompanyCard key={company.id} company={company} />}
      />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    </div>
  );
}
