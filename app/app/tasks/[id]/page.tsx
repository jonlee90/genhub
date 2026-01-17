import { notFound } from "next/navigation";
import Link from "next/link";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FolderOpen } from "lucide-react";
import { getTaskDetailData } from "@/lib/tasks";

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

const BLUEPRINT_BACKGROUND_STYLE = {
  backgroundImage: `
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
  color: "#001B51",
} as const;

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const data = await getTaskDetailData(id);

  if (!data) {
    notFound();
  }

  const {
    task,
    activity,
    dependencies,
    dependents,
    phases,
    teamMembers,
    userRole,
  } = data;
  const project = task.project as { id: string; name: string };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0" style={BLUEPRINT_BACKGROUND_STYLE} />
      </div>

      {/* Industrial Header */}
      <div className="relative z-10">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 pt-4 mb-6">
          <Link href="/app/tasks">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-construction-blue hover:bg-construction-blue/10 font-semibold group"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              All Tasks
            </Button>
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/app/projects/${task.project_id}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-construction-blue transition-colors font-medium group"
          >
            <FolderOpen className="h-4 w-4 group-hover:scale-110 transition-transform" />
            {project.name}
          </Link>
        </div>
      </div>

      {/* Task Detail Component */}
      <div className="relative z-10">
        <TaskDetail
          task={task}
          activity={activity}
          dependencies={dependencies}
          dependents={dependents}
          phases={phases}
          teamMembers={teamMembers}
          userRole={userRole}
        />
      </div>
    </div>
  );
}
