import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createUserClient } from "@/utils/supabase/server";
import type { MemberStatus, UserRole } from "@/types/db/enums";
import type { SubcontractorsRow } from "@/types/db/tables/companies";

interface TeamMemberWithProfile {
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

interface TeamStats {
  total: number;
  active: number;
  invited: number;
  admins: number;
  projectManagers: number;
  fieldWorkers: number;
}

interface TeamPageOk {
  status: "ok";
  companyId: string;
  role: UserRole;
  members: TeamMemberWithProfile[];
  stats: TeamStats;
}

interface TeamPageError {
  status: "no_company" | "error";
}

export async function getTeamPageData(): Promise<TeamPageOk | TeamPageError> {
  const [supabase, session] = await Promise.all([createUserClient(), auth()]);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { data: companyUser, error: companyError } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (companyError || !companyUser) {
    return { status: "no_company" };
  }

  const [teamMembersResult, projectCountsResult] = await Promise.all([
    supabase
      .from("company_users")
      .select(
        `
        id,
        user_id,
        role,
        status,
        activated_at,
        invited_at,
        user_profiles (
          id,
          email,
          name,
          avatar_url
        )
      `,
      )
      .eq("company_id", companyUser.company_id)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_team_member_project_counts", {
      p_company_id: companyUser.company_id,
    }),
  ]);

  if (teamMembersResult.error) {
    return { status: "error" };
  }

  const countsMap = new Map<string, number>(
    (projectCountsResult.data || []).map((projectCount) => [
      projectCount.user_id,
      Number(projectCount.project_count),
    ]),
  );

  const members = (teamMembersResult.data || []).map((member) => ({
    ...member,
    user_profiles:
      member.user_profiles as TeamMemberWithProfile["user_profiles"],
    project_count: countsMap.get(member.user_id) || 0,
  })) as TeamMemberWithProfile[];

  const stats = members.reduce(
    (acc, member) => {
      acc.total += 1;
      if (member.status === "active") acc.active += 1;
      if (member.status === "invited") acc.invited += 1;
      if (member.role === "admin") acc.admins += 1;
      if (member.role === "project_manager") acc.projectManagers += 1;
      if (member.role === "field_worker" || member.role === "foreman") {
        acc.fieldWorkers += 1;
      }
      return acc;
    },
    {
      total: 0,
      active: 0,
      invited: 0,
      admins: 0,
      projectManagers: 0,
      fieldWorkers: 0,
    },
  );

  return {
    status: "ok",
    companyId: companyUser.company_id,
    role: companyUser.role,
    members,
    stats,
  };
}

interface SubcontractorsOk {
  status: "ok";
  companyId: string;
  role: UserRole;
  subcontractors: SubcontractorsRow[];
  stats: {
    total: number;
    active: number;
    expiringLicenses: number;
    expiringInsurance: number;
  };
}

interface SubcontractorsError {
  status: "no_company" | "unauthorized" | "error";
}

export async function getSubcontractorsPageData(): Promise<
  SubcontractorsOk | SubcontractorsError
> {
  const [supabase, session] = await Promise.all([createUserClient(), auth()]);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { data: companyUser, error: companyError } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (companyError || !companyUser) {
    return { status: "no_company" };
  }

  if (companyUser.role !== "admin" && companyUser.role !== "project_manager") {
    return { status: "unauthorized" };
  }

  const { data: subcontractors, error: subcontractorsError } = await supabase
    .from("subcontractors")
    .select("*")
    .eq("company_id", companyUser.company_id)
    .order("created_at", { ascending: false });

  if (subcontractorsError) {
    return { status: "error" };
  }

  const allSubcontractors = subcontractors || [];

  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const stats = allSubcontractors.reduce(
    (acc, sub) => {
      acc.total += 1;
      if (sub.is_active) {
        acc.active += 1;
        if (isExpiringSoon(sub.license_expiry)) acc.expiringLicenses += 1;
        if (isExpiringSoon(sub.insurance_expiry)) acc.expiringInsurance += 1;
      }
      return acc;
    },
    {
      total: 0,
      active: 0,
      expiringLicenses: 0,
      expiringInsurance: 0,
    },
  );

  return {
    status: "ok",
    companyId: companyUser.company_id,
    role: companyUser.role,
    subcontractors: allSubcontractors,
    stats,
  };
}
