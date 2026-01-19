/**
 * Component-level types for Projects module
 * Extends database types with relation data for UI consumption
 */

import type {
  ProjectsRow,
  TasksRow,
  ProjectPhasesRow,
  ProjectFilesRow,
  TaskDependenciesRow,
} from '@/types/db/tables';
import type {
  ExpenseStats,
  TaskStats,
  TeamCostSummary,
} from '@/app/actions/projects';
import type { UnifiedPhoto } from '@/app/actions/project-photos';

// ============================================
// Project with Relations
// ============================================

export interface ProjectTeamMember {
  id: string;
  user_id?: string | null;
  subcontractor_id?: string | null;
  role: string;
  assigned_at: string;
  user_profiles?: {
    id: string;
    name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  subcontractors?: {
    id: string;
    company_name: string;
    contact_name?: string | null;
    trade_specialization?: string | null;
  } | null;
}

// ProjectWithRelations allows partial ProjectsRow fields + relations
// Useful when queries select only specific project columns
// Uses Partial for nested arrays since queries may select only certain fields
export interface ProjectWithRelations extends Partial<ProjectsRow> {
  id: string; // id is always required
  name: string; // name is always required
  tasks?: Partial<TasksRow>[];
  project_phases?: Partial<ProjectPhasesRow>[];
  project_team?: ProjectTeamMember[];
}

// ProjectOverviewData is an alias for ProjectWithRelations
// Expected to include: client_name, client_email, client_phone, budget, created_at, updated_at
// These fields are already available through Partial<ProjectsRow>
export type ProjectOverviewData = ProjectWithRelations;

// ============================================
// Task with Relations
// ============================================

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id?: string | null;
  subcontractor_id?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  subcontractor?: {
    id: string;
    company_name: string;
    contact_name?: string | null;
    email?: string | null;
  } | null;
}

export interface TaskWithRelations extends TasksRow {
  phase?: ProjectPhasesRow | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  assignees?: TaskAssignee[];
  materialStats?: {
    count: number;
    totalCost: number;
  };
  expenseStats?: {
    count: number;
    totalAmount: number;
  };
}

// ============================================
// Component Props Types
// ============================================

export interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ProjectSimple {
  id: string;
  name: string;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index: number;
  }>;
}

export interface ProjectDetailProps {
  project: ProjectWithRelations;
  projects?: ProjectSimple[];
  teamMembers?: TeamMember[];
  phaseTaskStats: PhaseStats[];
  taskDependencies?: TaskDependenciesRow[];
  expenseStats?: ExpenseStats;
  taskStats?: TaskStats;
  projectFiles?: ProjectFilesRow[];
  projectPhotos?: UnifiedPhoto[];
  teamCostSummaries?: TeamCostSummary[];
}

export interface ProjectOverviewProps {
  project: ProjectOverviewData;
  projects?: ProjectSimple[];
  teamMembers?: TeamMember[];
  phaseTaskStats?: PhaseStats[];
  expenseStats?: ExpenseStats;
  taskStats?: TaskStats;
  teamCostSummaries?: TeamCostSummary[];
  onModalOpen?: () => void;
}

// ============================================
// Form Types
// ============================================

export interface CreateProjectFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  project?: ProjectsRow;
}

// ============================================
// Optimized Types for Data Serialization
// ============================================

/**
 * ProjectCardData - Minimal data type for ProjectCard component
 *
 * Only includes fields actually used by ProjectCard to reduce serialization overhead.
 * This type should be used when passing project data to ProjectCard from server components.
 *
 * Serialization savings: ~60-80% reduction in data sent to client
 * - Removes unused nested arrays (topAssignees, project_phases, project_team)
 * - Removes unused stats fields (taskCounts, materials, expenses, budget calculations)
 * - Only includes essential display fields
 *
 * Usage:
 * ```typescript
 * import { transformToProjectCardData } from '@/types/components/projects';
 * const minimalProject = transformToProjectCardData(projectWithStats);
 * <ProjectCard project={minimalProject} />
 * ```
 */
export type ProjectCardData = Pick<
  ProjectsRow,
  | 'id'
  | 'name'
  | 'status'
  | 'project_type'
  | 'address'
  | 'city'
  | 'completion_percentage'
  | 'budget'
  | 'image_url'
  | 'end_date'
  | 'start_date'
  | 'client_name'
> & {
  stats: {
    schedule: {
      daysRemaining: number | null;
    };
    teamSize: number;
  };
};

/**
 * Transform ProjectWithStats to minimal ProjectCardData
 *
 * Removes ~60-80% of unnecessary data before serializing to client.
 * Use this in server components before passing data to ProjectCard.
 *
 * @param project - Full ProjectWithStats object from server action
 * @returns Minimal ProjectCardData with only fields used by ProjectCard
 *
 * @example
 * ```typescript
 * // In server component (page.tsx)
 * const { projects } = await getProjectsWithStats(companyId);
 * const minimalProjects = projects.map(transformToProjectCardData);
 * return <ProjectsPageClient projects={minimalProjects} />;
 * ```
 */
export function transformToProjectCardData(project: any): ProjectCardData {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    project_type: project.project_type,
    address: project.address,
    city: project.city,
    completion_percentage: project.completion_percentage,
    budget: project.budget,
    image_url: project.image_url,
    end_date: project.end_date,
    start_date: project.start_date,
    client_name: project.client_name,
    stats: {
      schedule: {
        daysRemaining: project.stats?.schedule?.daysRemaining ?? null,
      },
      teamSize: project.stats?.teamSize ?? 0,
    },
  };
}
