import { TeamPageClient } from "@/components/team/TeamPageClient";
import {
  Users,
  UserCog,
  HardHat,
  Hammer,
  UserPlus,
  Shield,
} from "lucide-react";
import { getTeamPageData } from "@/lib/team";

const BLUEPRINT_BACKGROUND_STYLE = {
  backgroundImage: `
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
  color: "#001B51",
} as const;

export default async function TeamPage() {
  const data = await getTeamPageData();

  if (data.status !== "ok") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {data.status === "no_company"
              ? "No Company Found"
              : "Error Loading Team"}
          </h1>
          <p className="text-gray-600">
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
          {/* Total Members */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                  Total
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">
                  {stats.total}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  Team Members
                </div>
              </div>
            </div>
          </div>

          {/* Active Members */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                  <UserCog className="h-4 w-4 md:h-5 md:w-5 text-construction-green" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-green/60">
                  Active
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-green leading-none mb-1">
                  {stats.active}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  On Duty
                </div>
              </div>
            </div>
          </div>

          {/* Invited Members */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                  <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-construction-accent" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-accent/60">
                  Pending
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-accent leading-none mb-1">
                  {stats.invited}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  Invited
                </div>
              </div>
            </div>
          </div>

          {/* GC Admins */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                  Admins
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">
                  {stats.admins}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  GC Admins
                </div>
              </div>
            </div>
          </div>

          {/* Project Managers */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                  <HardHat className="h-4 w-4 md:h-5 md:w-5 text-construction-accent" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-accent/60">
                  Managers
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-accent leading-none mb-1">
                  {stats.projectManagers}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  Project Mgrs
                </div>
              </div>
            </div>
          </div>

          {/* Field Workers */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                  <Hammer className="h-4 w-4 md:h-5 md:w-5 text-construction-green" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-green/60">
                  Crew
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-green leading-none mb-1">
                  {stats.fieldWorkers}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  Field Crew
                </div>
              </div>
            </div>
          </div>
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
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
