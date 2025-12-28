import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HardHat, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectListSkeleton } from '@/components/projects/ProjectListSkeleton';
import { auth } from '@/lib/auth';

export const metadata = {
  title: 'Projects | GenHub',
  description: 'Manage your construction projects',
};

async function getProjects() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get user's company using NextAuth user ID
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    // User doesn't have an active company - return empty state
    return { projects: [], role: null };
  }

  // Fetch projects with phases for completion calculation
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      *,
      project_phases(id, status, completion_percentage),
      project_team(
        user_id,
        subcontractor_id,
        role
      )
    `)
    .eq('company_id', companyUser.company_id)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return { projects: [], role: companyUser.role };
  }

  return { projects: projects || [], role: companyUser.role };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { projects, role } = await getProjects();

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const atRiskProjects = projects.filter(p => (p.health_score || 100) < 70).length;

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
              PROJECTS
            </h1>
        
          </div>

          {/* Action Button with Construction Theme */}
          {(role === 'gc_admin' || role === 'project_manager') && (
            <Link href="/app/projects/new">
              <Button size="lg" className="relative h-14 px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white">
                <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-10 transition-opacity" />
                <HardHat className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                <span className="font-black text-base">NEW PROJECT</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Industrial Stats Dashboard - Foreman's Clipboard */}
      {totalProjects > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Projects */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <HardHat className="h-5 w-5 text-construction-blue" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">Total</div>
              </div>
              <div className="text-4xl font-black text-construction-blue leading-none mb-1">{totalProjects}</div>
              <div className="text-sm font-bold text-gray-600">Active Sites</div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                  <TrendingUp className="h-5 w-5 text-construction-green" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-green/60">In Progress</div>
              </div>
              <div className="text-4xl font-black text-construction-green leading-none mb-1">{activeProjects}</div>
              <div className="text-sm font-bold text-gray-600">Under Construction</div>
            </div>
          </div>

          {/* Completed Projects */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                  <Clock className="h-5 w-5 text-construction-accent" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-accent/60">Delivered</div>
              </div>
              <div className="text-4xl font-black text-construction-accent leading-none mb-1">{completedProjects}</div>
              <div className="text-sm font-bold text-gray-600">Projects Complete</div>
            </div>
          </div>

          {/* At Risk Projects */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-red/5 to-construction-red/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-red/10 rounded-lg border-2 border-construction-red/20">
                  <AlertTriangle className="h-5 w-5 text-construction-red" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-red/60">Alert</div>
              </div>
              <div className="text-4xl font-black text-construction-red leading-none mb-1">{atRiskProjects}</div>
              <div className="text-sm font-bold text-gray-600">Needs Attention</div>
            </div>
          </div>
        </div>
      )}

      {/* Project List with Filters */}
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList initialProjects={projects} searchParams={searchParams} />
      </Suspense>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
