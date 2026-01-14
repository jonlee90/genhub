import { redirect } from 'next/navigation';
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
    return { projects: [], totalCount: 0, role: null, companyId: '' };
  }

  // Fetch projects with enhanced stats (defaults: limit=20, offset=0)
  const { projects, totalCount, error } = await getProjectsWithStats(companyUser.company_id);

  if (error) {
    console.error('[ProjectsPage] Error fetching projects:', error);
    return { projects: [], totalCount: 0, role: companyUser.role, companyId: companyUser.company_id };
  }

  console.log(`[ProjectsPage] Successfully fetched ${projects?.length || 0} projects with stats (total: ${totalCount || 0})`);
  return { projects: projects || [], totalCount: totalCount || 0, role: companyUser.role, companyId: companyUser.company_id };
}

export default async function ProjectsPage() {
  const { projects, totalCount, role, companyId } = await getProjects();

  return (
    <ProjectsPageClient
      projects={projects}
      totalCount={totalCount}
      role={role}
      companyId={companyId}
    />
  );
}
