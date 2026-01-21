"use client";

import { m as motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { EntityType } from "@/types/db/chat";
import { ProjectPreview } from "./previews/ProjectPreview";
import { TaskPreview } from "./previews/TaskPreview";
import { MaterialPreview } from "./previews/MaterialPreview";
import { ExpensePreview } from "./previews/ExpensePreview";
import { UserPreview } from "./previews/UserPreview";

interface EntityPreviewProps {
  type: EntityType;
  id: string;
}

// Debug: Main entity preview component - routes to type-specific preview
export function EntityPreview({ type, id }: EntityPreviewProps) {
  console.log("[EntityPreview] Rendering preview for:", { type, id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3"
    >
      {type === "project" && <ProjectPreview id={id} />}
      {type === "task" && <TaskPreview id={id} />}
      {type === "material" && <MaterialPreview id={id} />}
      {type === "expense" && <ExpensePreview id={id} />}
      {type === "user" && <UserPreview id={id} />}
    </motion.div>
  );
}

// Debug: Loading skeleton for entity previews
export function EntityPreviewSkeleton() {
  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

// Debug: Error state for failed entity fetches
export function EntityPreviewError({ error }: { error: string }) {
  return (
    <div className="w-full max-w-md bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
      <p className="text-sm font-mono text-red-700 dark:text-red-400">Failed to load preview</p>
      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
    </div>
  );
}
