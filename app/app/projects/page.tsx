import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";
import { getProjectsPageData } from "@/lib/projects";

export const metadata = {
  title: "Projects | GenHub",
  description: "Manage your construction projects",
};

export default async function ProjectsPage() {
  const { projects, totalCount, role, companyId, projectTypes } = await getProjectsPageData();

  return (
    <ProjectsPageClient
      projects={projects}
      totalCount={totalCount}
      role={role}
      companyId={companyId}
      projectTypes={projectTypes}
    />
  );
}
