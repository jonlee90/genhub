import { getAllCompanies, getOwnerDashboardStats } from '@/app/actions/owner';
import { Building2, Users, FolderKanban, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Companies</h1>
          <p className="text-gray-600">{companiesResult.error}</p>
        </div>
      </div>
    );
  }

  const companies = companiesResult.data || [];
  const stats = statsResult.data;

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

      {/* Industrial Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-2 md:pt-4">
          <div className="space-y-1 md:space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-construction-blue/60 uppercase tracking-wider">
                Platform Admin
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              COMPANIES
            </h1>
            <p className="text-sm md:text-base text-gray-500">
              All registered companies on GenHub
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <Building2 className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                  Total
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">
                  {stats.totalCompanies}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Companies</div>
              </div>
            </div>
          </div>

          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-construction-green" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-green/60">
                  Total
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-green leading-none mb-1">
                  {stats.totalUsers}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Users</div>
              </div>
            </div>
          </div>

          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                  <FolderKanban className="h-4 w-4 md:h-5 md:w-5 text-construction-accent" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-accent/60">
                  Total
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-accent leading-none mb-1">
                  {stats.totalProjects}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Projects</div>
              </div>
            </div>
          </div>

          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-yellow-500/10 rounded-lg border-2 border-yellow-500/20">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-yellow-600/60">
                  Pending
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-yellow-600 leading-none mb-1">
                  {stats.pendingInvitations}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Invitations</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Grid */}
      <div className="relative z-10">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Companies Yet</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              Companies will appear here once admins accept their invitations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white border-2 border-gray-200 rounded-lg shadow-construction hover:shadow-construction-lg hover:border-construction-blue/30 transition-all p-5"
              >
                {/* Company Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                    <Building2 className="w-5 h-5 text-construction-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{company.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Joined {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {company.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="line-clamp-2">{company.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-construction-blue" />
                    <span className="text-sm font-bold text-gray-900">{company.user_count}</span>
                    <span className="text-xs text-gray-500">users</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-construction-accent" />
                    <span className="text-sm font-bold text-gray-900">{company.project_count}</span>
                    <span className="text-xs text-gray-500">projects</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
