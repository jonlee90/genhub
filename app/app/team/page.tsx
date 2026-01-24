import { TeamPageClient } from "@/components/team/TeamPageClient";
import { StatCard } from "@/components/team/StatCard";
import { getTeamPageData } from "@/lib/team";

const BLUEPRINT_BACKGROUND_STYLE = {
  backgroundImage: `
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
  color: "var(--construction-blue)",
} as const;

export default async function TeamPage() {
  const data = await getTeamPageData();

  if (data.status !== "ok") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {data.status === "no_company"
              ? "No Company Found"
              : "Error Loading Team"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {data.status === "no_company"
              ? "You are not associated with any active company."
              : "Failed to load team members. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const { members, stats, role, companyId } = data;

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={BLUEPRINT_BACKGROUND_STYLE} />
      </div>

      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-2 md:pt-4">
          <div className="space-y-1 md:space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              TEAM
            </h1>
          </div>
        </div>
      </div>

      {/* Industrial Stats Dashboard - Crew Roster */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <StatCard
            icon="users"
            label="Total"
            sublabel="Team Members"
            value={stats.total}
            colorClass="blue"
          />
          <StatCard
            icon="user-cog"
            label="Active"
            sublabel="On Duty"
            value={stats.active}
            colorClass="green"
          />
          <StatCard
            icon="user-plus"
            label="Pending"
            sublabel="Invited"
            value={stats.invited}
            colorClass="accent"
          />
          <StatCard
            icon="shield"
            label="Admins"
            sublabel="GC Admins"
            value={stats.admins}
            colorClass="blue"
          />
          <StatCard
            icon="hard-hat"
            label="Managers"
            sublabel="Project Mgrs"
            value={stats.projectManagers}
            colorClass="accent"
          />
          <StatCard
            icon="hammer"
            label="Crew"
            sublabel="Field Crew"
            value={stats.fieldWorkers}
            colorClass="green"
          />
        </div>
      )}

      {/* Team Member List/Table - responsive client component */}
      <div className="relative">
        <TeamPageClient
          members={members}
          currentUserRole={role}
          companyId={companyId}
          stats={stats}
        />
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    </div>
  );
}
