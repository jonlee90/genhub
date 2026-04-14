import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createUserClient } from "@/utils/supabase/server";
import type { UserRole } from "@/types/db/enums";
import type { SubcontractorsRow } from "@/types/db/tables/companies";
import type { TeamMember, TeamStats } from "@/types/team";

// Re-export shared types for convenience
export type { TeamMember, TeamStats };

interface TeamPageOk {
  status: "ok";
  companyId: string;
  role: UserRole;
  members: TeamMember[];
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
    user_profiles: member.user_profiles as TeamMember["user_profiles"],
    project_count: countsMap.get(member.user_id) || 0,
  })) as TeamMember[];

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

export type SubcontractorFinancialTotals = Record<
  string,
  { totalContractAmount: number; totalPaid: number }
>;

interface SubcontractorsOk {
  status: "ok";
  companyId: string;
  role: UserRole;
  subcontractors: SubcontractorsRow[];
  financialTotals: SubcontractorFinancialTotals;
  stats: {
    total: number;
    active: number;
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

  const stats = allSubcontractors.reduce(
    (acc, sub) => {
      acc.total += 1;
      if (sub.is_active) acc.active += 1;
      return acc;
    },
    { total: 0, active: 0 },
  );

  type ContractRow = {
    subcontractor_id: string;
    contract_amount: number | null;
    subcontractor_payments: { amount: number }[] | null;
  };
  const { data: contractsData } = (await (
    supabase as unknown as ReturnType<
      typeof import("@supabase/supabase-js").createClient
    >
  )
    .from("subcontractor_contracts")
    .select("subcontractor_id, contract_amount, subcontractor_payments(amount)")
    .eq("company_id", companyUser.company_id)) as {
    data: ContractRow[] | null;
  };

  const financialTotals: SubcontractorFinancialTotals = {};
  for (const contract of contractsData || []) {
    const subId = contract.subcontractor_id;
    if (!financialTotals[subId]) {
      financialTotals[subId] = { totalContractAmount: 0, totalPaid: 0 };
    }
    financialTotals[subId].totalContractAmount += contract.contract_amount ?? 0;
    for (const p of contract.subcontractor_payments || []) {
      financialTotals[subId].totalPaid += p.amount ?? 0;
    }
  }

  return {
    status: "ok",
    companyId: companyUser.company_id,
    role: companyUser.role,
    subcontractors: allSubcontractors,
    financialTotals,
    stats,
  };
}
