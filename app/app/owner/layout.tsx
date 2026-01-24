import { redirect } from 'next/navigation';
import { isOwner, getOwnerDashboardStats } from '@/app/actions/owner';
import { OwnerTabs } from '@/components/owner/OwnerTabs';

/**
 * Owner Layout
 *
 * Protects all /app/owner/* routes.
 * Only platform owners can access these pages.
 *
 * Features:
 * - Blueprint grid background (shared across all pages)
 * - Platform Admin branding section
 * - Tabbed navigation (Companies, Users, Invites)
 * - Stats-driven badge counts on tabs
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[OwnerLayout] Checking owner status');

  const ownerStatus = await isOwner();

  if (!ownerStatus) {
    console.log('[OwnerLayout] User is not an owner, redirecting to /app');
    redirect('/app');
  }

  console.log('[OwnerLayout] User is owner, rendering children');

  // Fetch stats for tab badges (non-blocking)
  const statsResult = await getOwnerDashboardStats();
  const stats = statsResult.data;

  return (
    <div className="relative min-h-screen">
      {/* Blueprint Grid Background - Shared across all owner pages */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            color: 'var(--construction-blue)',
          }}
        />
      </div>

      {/* Platform Admin Section */}
      <div className="relative z-10 border-b-4 border-construction-orange bg-white dark:bg-gray-900">
        <div className="p-4 md:p-8 pb-4 md:pb-6">
          {/* Platform Admin Label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-12 bg-construction-orange rounded-full" />
            <span className="text-xs font-mono text-construction-blue/60 uppercase tracking-wider">
              Platform Admin
            </span>
          </div>

          {/* Tabs Navigation */}
          <OwnerTabs stats={stats} />
        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
