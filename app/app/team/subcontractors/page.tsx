import { getSubcontractorsPageData } from "@/lib/team";
import { SubcontractorsPageClient } from "@/components/team/SubcontractorsPageClient";

export const metadata = {
  title: "Subcontractors | GenHub",
  description: "Manage your construction subcontractors",
};

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  const { subcontractors, stats, role, companyId, financialTotals } = data;

  return (
    <SubcontractorsPageClient
      initialSubcontractors={subcontractors}
      stats={stats}
      role={role}
      companyId={companyId}
      financialTotals={financialTotals}
    />
  );
}
