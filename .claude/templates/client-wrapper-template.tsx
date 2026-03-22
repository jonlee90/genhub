/**
 * TEMPLATE: Client Wrapper for Server Component Data Fetching
 *
 * USE CASE: When you need to render server data in a Client Component
 *
 * WHEN TO USE:
 * - Client Component needs to conditionally render content with server data
 * - Tab/Modal/Drawer requires server-fetched data
 * - Cannot use Server Component composition pattern
 *
 * INSTRUCTIONS:
 * 1. Replace [COMPONENT_NAME] with your component name
 * 2. Replace [getServerData] with your Server Action(s)
 * 3. Update the Props type
 * 4. Update the data state type
 * 5. Add additional Server Actions to Promise.all() if needed
 * 6. Delete this comment block
 */

"use client";

import { useState, useEffect } from "react";
import { [getServerData] } from "@/app/actions/[module]";
import { [COMPONENT_NAME]Content } from "@/components/[module]/[COMPONENT_NAME]Content";
import { [COMPONENT_NAME]Skeleton } from "@/components/[module]/[COMPONENT_NAME]Skeleton";
import type { [DataType] } from "@/types/db/tables/[module]";

type [COMPONENT_NAME]ClientProps = {
  id: string;
  // Add other props here
};

export function [COMPONENT_NAME]Client({
  id,
  // destructure other props
}: [COMPONENT_NAME]ClientProps) {
  const [data, setData] = useState<[DataType][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Parallel fetch for independent data (vercel-react-best-practices: async-parallel)
        const [dataResult] = await Promise.all([
          [getServerData](id),
          // Add more Server Actions here if needed
        ]);

        if (!isMounted) return;

        // Error handling
        if (!dataResult.success) {
          setError(`Failed to load data: ${dataResult.error}`);
          return;
        }

        setData(dataResult.data || []);
      } catch (err) {
        if (!isMounted) return;
        console.error("[[COMPONENT_NAME]Client] Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]); // Add other dependencies here

  // Loading state
  if (isLoading) {
    return <[COMPONENT_NAME]Skeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  // Success state
  return (
    <[COMPONENT_NAME]Content
      data={data}
      // pass other props
    />
  );
}
