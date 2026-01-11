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

export default async function ProjectsPage() {
  const { projects, role } = await getProjects();

  return (
    <ProjectsPageClient
      projects={projects}
      role={role}
    />
  );
}
