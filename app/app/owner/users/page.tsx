import { getAllUsers } from '@/app/actions/owner';
import { Users, Mail, Building2, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Role display mapping
const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-construction-blue text-white' },
  project_manager: { label: 'PM', color: 'bg-blue-600 text-white' },
  foreman: { label: 'Foreman', color: 'bg-construction-gray text-white' },
  field_worker: { label: 'Field', color: 'bg-gray-600 text-white' },
  subcontractor: { label: 'Sub', color: 'bg-construction-gray-light text-white' },
  client: { label: 'Client', color: 'bg-gray-500 text-white' },
};

// Status display mapping
const STATUS_DISPLAY: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  active: { label: 'Active', icon: CheckCircle, color: 'text-construction-green' },
  invited: { label: 'Invited', icon: Mail, color: 'text-yellow-600' },
  inactive: { label: 'Inactive', icon: AlertCircle, color: 'text-gray-400' },
};

/**
 * Owner Users Page
 *
 * Server Component - Displays all users across all companies.
 * Accessible only by platform owners.
 */
export default async function OwnerUsersPage() {
  console.log('[OwnerUsersPage] Fetching users');

  const result = await getAllUsers();

  if (result.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Users</h1>
          <p className="text-gray-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const users = result.data || [];
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const invitedUsers = users.filter((u) => u.status === 'invited').length;

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
              USERS
            </h1>
            <p className="text-sm md:text-base text-gray-500">
              All users across all companies
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                Total
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">
                {users.length}
              </div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Users</div>
            </div>
          </div>
        </div>

        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-construction-green" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-green/60">
                Active
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-construction-green leading-none mb-1">
                {activeUsers}
              </div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Active</div>
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
                {invitedUsers}
              </div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Invited</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="relative z-10">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Users Yet</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              Users will appear here once they join the platform.
            </p>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-lg shadow-construction overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const roleInfo = ROLE_DISPLAY[user.role || ''] || {
                      label: user.role || '-',
                      color: 'bg-gray-400 text-white',
                    };
                    const statusInfo = STATUS_DISPLAY[user.status || ''] || STATUS_DISPLAY.inactive;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name || 'User'}
                                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-construction-blue/10 flex items-center justify-center border-2 border-construction-blue/20">
                                <span className="text-sm font-bold text-construction-blue">
                                  {(user.name || user.email || '?')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{user.name || 'Unnamed'}</div>
                              <div className="text-xs text-gray-500 md:hidden">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          {user.company_name ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700 font-medium truncate max-w-[150px]">
                                {user.company_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn('font-bold text-xs', roleInfo.color)}>
                            {roleInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className={cn('flex items-center gap-1.5', statusInfo.color)}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{statusInfo.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
