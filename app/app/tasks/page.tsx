import { TasksPageClient } from "@/components/tasks/TasksPageClient";
import { getTasksPageData } from "@/lib/tasks";

interface TasksPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const [params, { tasks, projects, teamMembers, taskDependencies, taskTypes, userRole }] =
    await Promise.all([searchParams, getTasksPageData()]);

  // Get view mode from URL or default to kanban
  const viewMode = (params.view as string) || "kanban";

  return (
    <TasksPageClient
      tasks={tasks}
      projects={projects}
      teamMembers={teamMembers}
      taskDependencies={taskDependencies || []}
      taskTypes={taskTypes || []}
      initialView={viewMode as "kanban" | "list"}
      userRole={userRole}
    />
  );
}
