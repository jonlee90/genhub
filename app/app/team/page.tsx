import { TeamPageClient } from "@/components/team/TeamPageClient";
import { getTeamPageData } from "@/lib/team";

export const metadata = {
  title: "Team | GenHub",
  description: "Manage your team members",
};

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
    <TeamPageClient
      members={members}
      currentUserRole={role}
      companyId={companyId}
      stats={stats}
    />
  );
}
