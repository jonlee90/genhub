import { TasksPageClient } from "@/components/tasks/TasksPageClient";
import { getTasksPageData } from "@/lib/tasks";
import type { TaskStatus } from "@/types/db/task";

interface TasksPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  // Extract searchParams FIRST to build filters
  const params = await searchParams;

  // Build filters object from URL params (exclude "all" values)
  const filters = {
    projectFilter: params.project && params.project !== "all" ? (params.project as string) : undefined,
    statusFilter: params.status && params.status !== "all" ? (params.status as TaskStatus) : undefined,
    searchQuery: params.search as string | undefined,
  };

  // Fetch data with server-side filters
  const { tasks, projects, teamMembers, taskDependencies, taskTypes, userRole } =
    await getTasksPageData(filters);

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
