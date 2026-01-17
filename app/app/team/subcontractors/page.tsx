import { SubcontractorList } from "@/components/team/SubcontractorList";
import { HardHat, Briefcase, AlertTriangle, Shield } from "lucide-react";
import { getSubcontractorsPageData } from "@/lib/team";

export const metadata = {
  title: "Subcontractors | GenHub",
  description: "Manage your subcontractor directory",
};

const BLUEPRINT_BACKGROUND_STYLE = {
  backgroundImage: `
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
  color: "#001B51",
} as const;

export default async function SubcontractorsPage() {
  const data = await getSubcontractorsPageData();

  if (data.status !== "ok") {
    const title =
      data.status === "unauthorized"
        ? "Access Denied"
        : data.status === "no_company"
          ? "No Company Found"
          : "Error Loading Subcontractors";
    const message =
      data.status === "unauthorized"
        ? "Only Admins and Project Managers can access the subcontractor directory."
        : data.status === "no_company"
          ? "You are not associated with any active company."
          : "Failed to load subcontractors. Please try again.";

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  const { subcontractors, stats, role, companyId } = data;

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
            <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              SUBCONTRACTORS
            </h1>
          </div>
        </div>
      </div>

      {/* Industrial Stats Dashboard */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Total Subcontractors */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <HardHat className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
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
                  Subcontractors
                </div>
              </div>
            </div>
          </div>

          {/* Active Subcontractors */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                  <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-construction-green" />
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
                  Active Status
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Licenses */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-yellow/5 to-construction-yellow/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-yellow/10 rounded-lg border-2 border-construction-yellow/20">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-construction-yellow" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-yellow/60">
                  Warning
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-yellow leading-none mb-1">
                  {stats.expiringLicenses}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  Expiring Licenses
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Insurance */}
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-red/5 to-construction-red/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-red/10 rounded-lg border-2 border-construction-red/20">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-construction-red" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-red/60">
                  Alert
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-red leading-none mb-1">
                  {stats.expiringInsurance}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">
                  Expiring Insurance
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subcontractor List */}
      <div className="relative">
        <SubcontractorList
          subcontractors={subcontractors}
          currentUserRole={role}
          companyId={companyId}
        />
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
