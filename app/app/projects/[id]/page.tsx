import { notFound } from "next/navigation";
import ChevronLeft from "lucide-react/icons/chevron-left";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectDetailContent } from "@/components/projects/ProjectDetailContent";
import { getProjectDetailData } from "@/lib/projects";

const BLUEPRINT_BACKGROUND_STYLE = {
  backgroundImage: `
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
  color: "var(--construction-blue)",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // React.cache() deduplication: getProjectDetailData is wrapped with React.cache()
  // so multiple calls within the same request are deduplicated
  const data = await getProjectDetailData(id);

  if (!data?.project) {
    return { title: "Project Not Found | GenHub" };
  }

  return {
    title: `${data.project.name} | GenHub`,
    description: `Project details for ${data.project.name}`,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProjectDetailData(id);

  if (!data?.project) {
    notFound();
  }

  const {
    project,
    phaseTaskStats,
    taskDependencies,
    expenseStats,
    taskStats,
    projectFiles,
    projectPhotos,
    teamCostSummaries,
    taskTypes,
  } = data;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
        <div className="absolute inset-0" style={BLUEPRINT_BACKGROUND_STYLE} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 space-y-4 p-4 pt-4 md:space-y-6 md:p-8 md:pt-6">
        {/* Industrial Header */}
        <div className="relative">
          {/* Construction border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 pt-3 mb-4 md:gap-3 md:pt-4 md:mb-6">
            <Link href="/app/projects">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-construction-blue hover:bg-construction-blue/10 dark:hover:bg-construction-blue/20 font-semibold group"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                All Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Project Detail Content */}
        <ProjectDetailContent
          project={project}
          phaseTaskStats={phaseTaskStats || []}
          taskDependencies={taskDependencies || []}
          expenseStats={expenseStats}
          taskStats={taskStats}
          projectFiles={projectFiles || []}
          projectPhotos={projectPhotos || []}
          teamCostSummaries={teamCostSummaries || []}
          taskTypes={taskTypes || []}
        />
      </div>
    </div>
  );
}
