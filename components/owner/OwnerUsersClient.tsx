"use client";

/**
 * OwnerUsersClient Component
 *
 * Client wrapper for users display with search functionality.
 */

import { useState, useMemo } from "react";
import { Users } from "lucide-react";
import { SearchInput } from "@/components/mobile/SearchInput";
import { UserRow } from "@/components/owner/UserRow";
import { UserCard } from "@/components/owner/UserCard";

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  role?: string;
  status?: string;
  company_name?: string;
  created_at: string;
}

interface OwnerUsersClientProps {
  users: User[];
}

export function OwnerUsersClient({ users }: OwnerUsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.company_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Type-cast users for components
  const typedUsers = filteredUsers.map((user) => ({
    ...user,
    role: user.role || "-",
    status: (user.status || "inactive") as "active" | "invited" | "inactive",
    company_name: user.company_name || null,
  }));

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search users by name, email, or company..."
        debounce={300}
      />

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-construction overflow-hidden">
        {typedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {searchQuery ? "No Results Found" : "No Users Yet"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {searchQuery
                ? "Try adjusting your search query."
                : "Users will appear here once they join the platform."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Company
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {typedUsers.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {typedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {searchQuery ? "No Results Found" : "No Users Yet"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {searchQuery
                ? "Try adjusting your search query."
                : "Users will appear here once they join the platform."}
            </p>
          </div>
        ) : (
          typedUsers.map((user) => <UserCard key={user.id} user={user} />)
        )}
      </div>
    </div>
  );
}
