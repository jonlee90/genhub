import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NewTaskPageProps {
  searchParams: Promise<{ project?: string; phase?: string }>;
}

export default function NewTaskPage({ searchParams }: NewTaskPageProps) {
  return (
    <Suspense fallback={<NewTaskPageLoading />}>
      <NewTaskPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function getData() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const supabase = createAdminClient();

  // Get user's company using NextAuth user ID
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    redirect("/app/onboarding");
  }

  const [projectsResult, teamMembersResult] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `
        id,
        name,
        project_phases (
          id,
          name,
          order_index
        )
      `,
      )
      .eq("company_id", companyUser.company_id)
      .eq("status", "active")
      .order("name"),
    supabase
      .from("company_users")
      .select(
        `
        user_id,
        user_profiles!inner (
          id,
          name,
          email,
          avatar_url
        )
      `,
      )
      .eq("company_id", companyUser.company_id)
      .eq("status", "active"),
  ]);

  const { data: projects } = projectsResult;
  const { data: teamMembers } = teamMembersResult;

  return {
    projects: projects || [],
    teamMembers: teamMembers?.map((tm: any) => tm.user_profiles) || [],
  };
}

async function NewTaskPageContent({ searchParams }: NewTaskPageProps) {
  const [params, { projects, teamMembers }] = await Promise.all([
    searchParams,
    getData(),
  ]);

  // Pre-select project/phase from URL params
  const preselectedProjectId = params.project;
  const preselectedPhaseId = params.phase;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Navigation */}
      <Link href="/app/tasks">
        <Button variant="ghost" size="sm" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create Task</h1>
        <p className="text-muted-foreground dark:text-gray-400">
          Add a new task to track work on your projects
        </p>
      </div>

      {/* Form */}
      <CreateTaskForm
        projects={projects}
        teamMembers={teamMembers}
        preselectedProjectId={preselectedProjectId}
        preselectedPhaseId={preselectedPhaseId}
      />
    </div>
  );
}

function NewTaskPageLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Navigation */}
      <Skeleton className="h-9 w-32" />

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Form Skeleton */}
      <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
