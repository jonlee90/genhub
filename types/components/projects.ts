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
import type { UserRole } from '@/types/db/enums';

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
  taskTypes?: any[]; // TaskTypeConfigsRow[]
  userRole?: UserRole;
}

export interface ProjectOverviewProps {
  project: ProjectOverviewData;
  projects?: ProjectSimple[];
  teamMembers?: TeamMember[];
  phaseTaskStats?: PhaseStats[];
  expenseStats?: ExpenseStats;
  taskStats?: TaskStats;
  teamCostSummaries?: TeamCostSummary[];
  taskTypes?: any[]; // TaskTypeConfigsRow[]
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

