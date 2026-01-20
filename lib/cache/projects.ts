"use cache";

import { cacheTag, cacheLife } from "next/cache";
import type { ProjectWithStats } from "@/app/actions/projects";
import type { ProjectTypeWithCount } from "@/app/actions/project-types";

/**
 * Cached projects list data
 * Cache key includes companyId for tenant isolation
 */
export async function getCachedProjectsData(companyId: string) {
  "use cache";
  cacheLife("medium"); // 5 min revalidate, 15 min expire
  cacheTag("projects", `projects-${companyId}`);

  // Dynamic imports to avoid circular dependencies
  const { getProjectsWithStats } = await import("@/app/actions/projects");
  const { getProjectTypes } = await import("@/app/actions/project-types");

  const [projectsResult, projectTypesResult] = await Promise.all([
    getProjectsWithStats(companyId),
    getProjectTypes(),
  ]);

  return {
    projects: (projectsResult.projects || []) as ProjectWithStats[],
    totalCount: projectsResult.totalCount || 0,
    projectTypes: (projectTypesResult.success ? projectTypesResult.projectTypes || [] : []) as ProjectTypeWithCount[],
  };
}

/**
 * Cached single project detail data
 */
export async function getCachedProjectDetail(projectId: string, companyId: string) {
  "use cache";
  cacheLife("short"); // 1 min revalidate, 5 min expire
  cacheTag("projects", `project-${projectId}`, `projects-${companyId}`);

  // Import dynamically to avoid circular dependencies
  const { getProjectDetailData } = await import("@/lib/projects");
  return getProjectDetailData(projectId);
}
