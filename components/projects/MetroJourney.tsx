"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { m as motion, AnimatePresence } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Settings from "lucide-react/icons/settings";
import Map from "lucide-react/icons/map";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PhaseStation } from "./PhaseStation";
import { PhaseDetailPanel } from "./PhaseDetailPanel";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ProjectPhasesRow } from "@/types/db/tables/projects";
import type { TasksRow } from "@/types/db/tables/tasks";

// B-003: Dynamic import for heavy ManagePhasesModal component (-20KB from initial bundle)
const ManagePhasesModal = dynamic(
  () =>
    import("./ManagePhasesModal").then((mod) => mod.ManagePhasesModal),
  {
    ssr: false,
    loading: () => null,
  },
);

type Phase = ProjectPhasesRow;
type Task = TasksRow;

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

interface MetroJourneyProps {
  phases: Phase[];
  tasks: Task[];
  phaseStats: PhaseStats[];
  projectId: string;
  projects: Array<{
    id: string;
    name: string;
    project_phases?: Array<{
      id: string;
      name: string;
      order_index: number;
    }>;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  taskTypes?: any[]; // TaskTypeConfigsRow[]
  onModalOpen?: () => void;
}

// Helper function to determine track gradient based on overall progress
function getTrackGradient(progressPercent: number): string {
  if (progressPercent <= 25) {
    return "from-[#DC2626] to-[#F59E0B]"; // red to amber
  }
  if (progressPercent <= 75) {
    return "from-[#F59E0B] to-[var(--construction-blue)]"; // amber to blue
  }
  return "from-[var(--construction-blue)] to-[#059669]"; // blue to green
}

export function MetroJourney({
  phases,
  tasks,
  phaseStats,
  projectId,
  projects = [],
  teamMembers = [],
  taskTypes = [],
  onModalOpen,
}: MetroJourneyProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showManagePhasesModal, setShowManagePhasesModal] = useState(false);

  // Performance optimization: Memoize computed values to prevent recalculation on every render
  const selectedPhase = useMemo(
    () => phases.find((p) => p.id === selectedPhaseId),
    [phases, selectedPhaseId],
  );
  const selectedPhaseTasks = useMemo(
    () => tasks.filter((t) => t.phase_id === selectedPhaseId),
    [tasks, selectedPhaseId],
  );
  const selectedPhaseStats = useMemo(
    () => phaseStats.find((s) => s.phaseId === selectedPhaseId),
    [phaseStats, selectedPhaseId],
  );

  // Find current phase (first non-completed phase)
  const currentPhaseIndex = useMemo(
    () => phases.findIndex((p) => p.status !== "completed"),
    [phases],
  );
  const currentPhaseId = useMemo(
    () => (currentPhaseIndex >= 0 ? phases[currentPhaseIndex].id : null),
    [currentPhaseIndex, phases],
  );

  // Compute completed phases count
  const completedPhasesCount = useMemo(
    () => phases.filter((p) => p.status === "completed").length,
    [phases],
  );

  // Get current phase name
  const currentPhaseName = useMemo(() => {
    if (currentPhaseId) {
      const phase = phases.find((p) => p.id === currentPhaseId);
      return phase ? phase.name : null;
    }
    return null;
  }, [currentPhaseId, phases]);

  // Calculate overall progress percentage
  const overallProgressPercent = useMemo(() => {
    const total = phases.length;
    return total > 0 ? (completedPhasesCount / total) * 100 : 0;
  }, [completedPhasesCount, phases.length]);

  // Get gradient class for track fill
  const trackGradientClass = useMemo(
    () => getTrackGradient(overallProgressPercent),
    [overallProgressPercent],
  );

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftFade(scrollLeft > 10);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Keyboard navigation handler for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const currentIndex = phases.findIndex((p) => p.id === selectedPhaseId);
        let newIndex = currentIndex;

        if (e.key === "ArrowLeft" && currentIndex > 0) {
          newIndex = currentIndex - 1;
        } else if (e.key === "ArrowRight" && currentIndex < phases.length - 1) {
          newIndex = currentIndex + 1;
        } else if (currentIndex === -1 && phases.length > 0) {
          // No phase selected, select first
          newIndex = 0;
        }

        if (newIndex !== currentIndex && newIndex >= 0) {
          setSelectedPhaseId(phases[newIndex].id);
        }
      }
    },
    [phases, selectedPhaseId],
  );

  // Auto-scroll to current phase on mobile
  useEffect(() => {
    if (currentPhaseId && scrollContainerRef.current) {
      const currentElement = document.getElementById(`phase-${currentPhaseId}`);
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentPhaseId]);

  return (
    <Card
      className="overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-construction"
      role="navigation"
      aria-label="Project phase tracker"
    >
      <CardContent className="pt-6 pb-6">
        {/* Header section - single responsive layout */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-construction-blue rounded-lg shadow-lg shadow-[var(--construction-blue)]/20">
                <Map className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                  <h3 className="text-base md:text-xl font-bold text-construction-blue whitespace-nowrap">
                    Project Journey
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-construction-blue/10 text-construction-blue border border-construction-blue/20 font-semibold text-xs"
                  >
                    {completedPhasesCount}/{phases.length} Phases
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                  {currentPhaseName ? (
                    <>Currently in: {currentPhaseName}</>
                  ) : (
                    <>Track progress through each phase</>
                  )}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowManagePhasesModal(true)}
              variant="outline"
              size="sm"
              className="flex-shrink-0 min-h-[44px] min-w-[44px] border-2 border-construction-blue/20 text-construction-blue hover:bg-construction-blue/5 active:bg-construction-blue/10 font-semibold"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop view - clean horizontal timeline */}
        <div className="relative hidden md:block">
          <ScrollArea className="w-full">
            <div className="relative min-w-max pb-6 px-4">
              {/* Track line - themed blue tint for visibility */}
              <div className="absolute top-[38px] left-0 right-0 h-1 flex px-4">
                {phases.map((phase, index) => {
                  const isCompleted = phase.status === "completed";
                  const isInProgress = phase.status === "in_progress";
                  const isLast = index === phases.length - 1;

                  return (
                    <div
                      key={`line-${phase.id}`}
                      className="flex-1 flex items-center"
                      style={{ minWidth: "180px" }}
                    >
                      {!isLast && (
                        <div className="relative flex-1 h-1">
                          {/* Background track (first segment hides left 25%) */}
                          <div className={cn("absolute inset-0 bg-construction-blue/25 dark:bg-construction-blue/35 rounded-full", index === 0 && "left-[25%]")} />

                          {/* Progress fill with color-mapped gradient */}
                          {isCompleted && (
                            <motion.div
                              className={cn(`absolute inset-0 bg-gradient-to-r ${trackGradientClass} rounded-full shadow-[0_0_8px_rgba(0,27,81,0.3)]`, index === 0 && "left-[25%]")}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{
                                delay: index * 0.1,
                                duration: 0.2,
                                ease: "easeOut",
                              }}
                              style={{ transformOrigin: "left" }}
                            />
                          )}

                          {isInProgress && (
                            <motion.div
                              className={cn(`absolute inset-0 bg-gradient-to-r ${trackGradientClass} rounded-full shadow-[0_0_8px_rgba(0,27,81,0.3)]`, index === 0 && "left-[25%]")}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 0.5 }}
                              transition={{
                                delay: index * 0.1,
                                duration: 0.2,
                                ease: "easeOut",
                              }}
                              style={{ transformOrigin: "left" }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Phase stations */}
              <div
                className="relative flex pt-2"
                role="tablist"
                onKeyDown={handleKeyDown}
                tabIndex={0}
              >
                {phases.map((phase, index) => {
                  const stats = phaseStats.find((s) => s.phaseId === phase.id);
                  const isCurrent = phase.id === currentPhaseId;
                  const isSelected = phase.id === selectedPhaseId;

                  return (
                    <motion.div
                      key={phase.id}
                      id={`phase-${phase.id}`}
                      className="flex-1"
                      style={{ minWidth: "180px" }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.2,
                        ease: "easeOut",
                      }}
                      role="tab"
                      aria-selected={isSelected}
                    >
                      <PhaseStation
                        phase={phase}
                        stats={stats}
                        isCurrent={isCurrent}
                        isSelected={isSelected}
                        onClick={() => {
                          setSelectedPhaseId(isSelected ? null : phase.id);
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
        </div>

        {/* Mobile view - horizontal scroll with snap */}
        <div className="md:hidden">
          {/* Stronger fade indicators */}
          {showLeftFade && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-gray-900 via-white/80 dark:via-gray-900/80 to-transparent z-10 pointer-events-none" />
          )}
          {showRightFade && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-gray-900 via-white/80 dark:via-gray-900/80 to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative overflow-x-auto pb-6 px-2 snap-x snap-mandatory scrollbar-hide"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="relative min-w-max">
              {/* Horizontal track for mobile */}
              <div className="absolute top-[34px] left-0 right-0 h-1 flex">
                {phases.map((phase, index) => {
                  const isCompleted = phase.status === "completed";
                  const isInProgress = phase.status === "in_progress";
                  const isLast = index === phases.length - 1;

                  return (
                    <div
                      key={`line-mobile-${phase.id}`}
                      className="flex items-center"
                      style={{ width: "130px" }}
                    >
                      {!isLast && (
                        <div className="relative w-full h-1">
                          <div className={cn("absolute inset-0 bg-construction-blue/25 dark:bg-construction-blue/35 rounded-full", index === 0 && "left-[25%]")} />

                          {isCompleted && (
                            <motion.div
                              className={cn(`absolute inset-0 bg-gradient-to-r ${trackGradientClass} rounded-full shadow-[0_0_8px_rgba(0,27,81,0.3)]`, index === 0 && "left-[25%]")}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: index * 0.1, duration: 0.2 }}
                              style={{ transformOrigin: "left" }}
                            />
                          )}

                          {isInProgress && (
                            <motion.div
                              className={cn(`absolute inset-0 bg-gradient-to-r ${trackGradientClass} rounded-full shadow-[0_0_8px_rgba(0,27,81,0.3)]`, index === 0 && "left-[25%]")}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 0.5 }}
                              transition={{ delay: index * 0.1, duration: 0.2 }}
                              style={{ transformOrigin: "left" }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Phase stations - mobile */}
              <div
                className="relative flex gap-4 pt-2"
                role="tablist"
                onKeyDown={handleKeyDown}
                tabIndex={0}
              >
                {phases.map((phase, index) => {
                  const stats = phaseStats.find((s) => s.phaseId === phase.id);
                  const isCurrent = phase.id === currentPhaseId;
                  const isSelected = phase.id === selectedPhaseId;

                  return (
                    <motion.div
                      key={phase.id}
                      id={`phase-mobile-${phase.id}`}
                      className="snap-center flex-shrink-0"
                      style={{ width: "130px" }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.2,
                        ease: "easeOut",
                      }}
                      role="tab"
                      aria-selected={isSelected}
                    >
                      <PhaseStation
                        phase={phase}
                        stats={stats}
                        isCurrent={isCurrent}
                        isSelected={isSelected}
                        onClick={() => {
                          setSelectedPhaseId(isSelected ? null : phase.id);
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Phase detail panel */}
        <AnimatePresence mode="popLayout">
          {selectedPhase && selectedPhaseStats && (
            <motion.div
              key={selectedPhase.id}
              className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <PhaseDetailPanel
                phase={selectedPhase}
                tasks={selectedPhaseTasks}
                stats={selectedPhaseStats}
                projectId={projectId}
                onClose={() => setSelectedPhaseId(null)}
                projects={projects}
                teamMembers={teamMembers}
                taskTypes={taskTypes}
                onModalOpen={onModalOpen}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manage phases modal */}
        <ManagePhasesModal
          isOpen={showManagePhasesModal}
          onClose={() => setShowManagePhasesModal(false)}
          projectId={projectId}
          phases={phases}
        />
      </CardContent>
    </Card>
  );
}

// Loading skeleton component
export function MetroJourneySkeleton() {
  return (
    <Card className="overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-construction">
      <CardContent className="pt-6 pb-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="min-h-[44px] min-w-[44px] rounded-md" />
          </div>
        </div>

        {/* Track and stations skeleton */}
        <div className="relative px-4 pb-6">
          {/* Track line skeleton */}
          <div className="absolute top-8 left-4 right-4 h-1.5">
            <Skeleton className="w-full h-full rounded-full" />
          </div>

          {/* Station circles skeleton */}
          <div className="relative flex justify-between pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
