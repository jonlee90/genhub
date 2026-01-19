/**
 * Shared Team Module Types
 *
 * Centralized type definitions for team members and statistics.
 * Used across team pages, components, and utilities.
 */

import type { UserRole, MemberStatus } from "./db/enums";

export interface TeamMember {
  id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  activated_at: string | null;
  invited_at: string | null;
  user_profiles: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
  } | null;
  project_count: number;
}

export interface TeamStats {
  total: number;
  active: number;
  invited: number;
  admins: number;
  projectManagers: number;
  fieldWorkers: number;
}
