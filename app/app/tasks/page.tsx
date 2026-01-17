import { TasksPageClient } from "@/components/tasks/TasksPageClient";
import { getTasksPageData } from "@/lib/tasks";

interface TasksPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const { tasks, projects, teamMembers, taskDependencies, userRole } =
    await getTasksPageData();

  // Get view mode from URL or default to kanban
  const viewMode = (params.view as string) || "kanban";

  return (
    <TasksPageClient
      tasks={tasks}
      projects={projects}
      teamMembers={teamMembers}
      taskDependencies={taskDependencies || []}
      initialView={viewMode as "kanban" | "list"}
      userRole={userRole}
    />
  );
}
