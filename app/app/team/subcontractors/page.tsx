import { SubcontractorList } from "@/components/team/SubcontractorList";
import { StatCard } from "@/components/team/StatCard";
import HardHat from "lucide-react/icons/hard-hat";
import Briefcase from "lucide-react/icons/briefcase";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import Shield from "lucide-react/icons/shield";
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
  color: "var(--construction-blue)",
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
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
          <StatCard
            icon={HardHat}
            label="Total"
            sublabel="Subcontractors"
            value={stats.total}
            colorClass="blue"
          />
          <StatCard
            icon={Briefcase}
            label="Active"
            sublabel="Active Status"
            value={stats.active}
            colorClass="green"
          />
          <StatCard
            icon={AlertTriangle}
            label="Warning"
            sublabel="Expiring Licenses"
            value={stats.expiringLicenses}
            colorClass="yellow"
          />
          <StatCard
            icon={Shield}
            label="Alert"
            sublabel="Expiring Insurance"
            value={stats.expiringInsurance}
            colorClass="red"
          />
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
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    </div>
  );
}
