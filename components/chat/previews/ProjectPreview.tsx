"use client";

import { useState, useEffect } from "react";
import { m as motion } from "framer-motion";
import { cn, formatPercentWhole } from "@/lib/utils";
import { Building2, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EntityPreviewSkeleton, EntityPreviewError } from "../EntityPreview";
import { useRouter } from "next/navigation";

interface ProjectPreviewProps {
  id: string;
}

interface ProjectData {
  id: string;
  name: string;
  status: string;
  health_score: number;
  completion_percentage: number;
}

// Debug: Project preview card component
export function ProjectPreview({ id }: ProjectPreviewProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  console.log("[ProjectPreview] Rendering for project:", id);

  // Debug: Fetch project data
  useEffect(() => {
    async function fetchProject() {
      console.log("[ProjectPreview] Fetching project data:", id);

      try {
        const response = await fetch(
          `/api/chat/entity-preview?type=project&id=${id}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch project");
        }

        console.log("[ProjectPreview] Project data loaded:", data);
        setProject(data);
      } catch (err: any) {
        console.error("[ProjectPreview] Error fetching project:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  // Debug: Loading state
  if (isLoading) {
    return <EntityPreviewSkeleton />;
  }

  // Debug: Error state
  if (error || !project) {
    return <EntityPreviewError error={error || "Project not found"} />;
  }

  // Debug: Health score color
  const healthColor =
    project.health_score >= 75
      ? "text-construction-green"
      : project.health_score >= 50
        ? "text-construction-yellow"
        : "text-construction-red";

  const healthBgColor =
    project.health_score >= 75
      ? "bg-construction-green/10"
      : project.health_score >= 50
        ? "bg-construction-yellow/10"
        : "bg-construction-red/10";

  // Debug: Status badge variant
  const statusVariant = getStatusVariant(project.status);

  return (
    <motion.div
      onClick={() => router.push(`/app/projects/${id}`)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full max-w-md bg-white dark:bg-gray-800 border-2 border-construction-blue dark:border-construction-blue/60 rounded-xl p-4",
        "hover:shadow-construction-lg transition-all duration-200 cursor-pointer",
        "group",
      )}
    >
      {/* Debug: Header with icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-construction-blue/10 dark:bg-construction-blue/20 rounded-lg border-2 border-construction-blue/20 dark:border-construction-blue/40 shrink-0">
          <Building2 className="h-5 w-5 text-construction-blue" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-construction-blue truncate group-hover:text-blue-700 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              className={cn(
                "text-[10px] font-bold px-2 py-0.5",
                statusVariant.bg,
                statusVariant.text,
              )}
            >
              {project.status}
            </Badge>
          </div>
        </div>

        {/* Debug: Health score circle */}
        <div
          className={cn(
            "flex flex-col items-center p-2 rounded-lg border-2",
            healthBgColor,
          )}
        >
          <Activity className={cn("h-4 w-4 mb-1", healthColor)} />
          <span className={cn("text-xs font-black", healthColor)}>
            {project.health_score}%
          </span>
        </div>
      </div>

      {/* Debug: Completion progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400 uppercase">
            Progress
          </span>
          <span className="text-xs font-black text-construction-blue">
            {formatPercentWhole(project.completion_percentage)}
          </span>
        </div>
        <Progress value={project.completion_percentage} className="h-2" />
      </div>

      {/* Debug: Footer hint */}
      <div className="mt-3 pt-3 border-t-2 border-gray-100 dark:border-gray-700">
        <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
          Click to view project details
        </p>
      </div>
    </motion.div>
  );
}

// Debug: Helper function for status badge variants
function getStatusVariant(status: string): { bg: string; text: string } {
  const variants: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-construction-green/20", text: "text-construction-green" },
    on_hold: {
      bg: "bg-construction-yellow/20",
      text: "text-construction-yellow",
    },
    completed: {
      bg: "bg-construction-blue/20",
      text: "text-construction-blue",
    },
    archived: { bg: "bg-gray-200", text: "text-gray-700" },
  };

  return variants[status.toLowerCase()] || variants.active;
}
