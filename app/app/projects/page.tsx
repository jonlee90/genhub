import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectListSkeleton } from '@/components/projects/ProjectListSkeleton';
import { ProjectsPageClient } from '@/components/projects/ProjectsPageClient';
import { auth } from '@/lib/auth';
import { getProjectsWithStats } from '@/app/actions/projects';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Projects | GenHub',
  description: 'Manage your construction projects',
};

async function getProjects() {
  console.log('[ProjectsPage] Fetching projects with stats...');

  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Get user's role for permissions
  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    return { projects: [], role: null };
  }

  // Fetch projects with enhanced stats
  const { projects, error } = await getProjectsWithStats();

  if (error) {
    console.error('[ProjectsPage] Error fetching projects:', error);
    return { projects: [], role: companyUser.role };
  }

  console.log(`[ProjectsPage] Successfully fetched ${projects?.length || 0} projects with stats`);
  return { projects: projects || [], role: companyUser.role };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const { projects, role } = await getProjects();

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const atRiskProjects = projects.filter(p => (p.health_score || 100) < 70).length;

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
              PROJECTS
            </h1>
          </div>

          {/* Action Button with Construction Theme */}
          <ProjectsPageClient role={role} />
        </div>
      </div>

 

      {/* Project List with Filters */}
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList initialProjects={projects} searchParams={params} />
      </Suspense>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
