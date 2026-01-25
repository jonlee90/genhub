"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { m as motion, AnimatePresence } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Settings from "lucide-react/icons/settings";
import Map from "lucide-react/icons/map";
import { Button } from "@/components/ui/button";
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
  console.log("[MetroJourney] Rendering with phases:", phases.length);

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

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftFade(scrollLeft > 10);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

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
    <Card className="overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-construction">
      <CardContent className="pt-6 pb-6">
        {/* Clean header section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-construction-blue rounded-lg shadow-lg shadow-[var(--construction-blue)]/20">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-construction-blue">
                  Project Journey
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Track progress through each phase
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowManagePhasesModal(true)}
              variant="outline"
              size="sm"
              className="border-2 border-construction-blue/20 text-construction-blue hover:bg-construction-blue/5 font-semibold"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop view - clean horizontal timeline */}
        <div className="relative hidden md:block">
          <ScrollArea className="w-full">
            <div className="relative min-w-max pb-6 px-4">
              {/* Clean track line */}
              <div className="absolute top-8 left-0 right-0 h-1 flex px-4">
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
                          {/* Background track */}
                          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />

                          {/* Progress fill */}
                          {isCompleted && (
                            <motion.div
                              className="absolute inset-0 bg-construction-blue rounded-full"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{
                                delay: index * 0.1,
                                duration: 0.5,
                                ease: "easeOut",
                              }}
                              style={{ transformOrigin: "left" }}
                            />
                          )}

                          {isInProgress && (
                            <motion.div
                              className="absolute inset-0 bg-construction-blue rounded-full"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 0.5 }}
                              transition={{
                                delay: index * 0.1,
                                duration: 0.5,
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
              <div className="relative flex pt-2">
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
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                    >
                      <PhaseStation
                        phase={phase}
                        stats={stats}
                        isCurrent={isCurrent}
                        isSelected={isSelected}
                        onClick={() => {
                          console.log(
                            "[PhaseStation] Clicked:",
                            phase.name,
                            "isSelected:",
                            isSelected,
                          );
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
          {/* Fade indicators */}
          {showLeftFade && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
          )}
          {showRightFade && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative overflow-x-auto pb-6 px-2 snap-x snap-mandatory scrollbar-hide"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="relative min-w-max">
              {/* Horizontal track for mobile */}
              <div className="absolute top-7 left-0 right-0 h-1 flex">
                {phases.map((phase, index) => {
                  const isCompleted = phase.status === "completed";
                  const isInProgress = phase.status === "in_progress";
                  const isLast = index === phases.length - 1;

                  return (
                    <div
                      key={`line-mobile-${phase.id}`}
                      className="flex items-center"
                      style={{ width: "110px" }}
                    >
                      {!isLast && (
                        <div className="relative w-full h-1">
                          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />

                          {isCompleted && (
                            <motion.div
                              className="absolute inset-0 bg-construction-blue rounded-full"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
                              style={{ transformOrigin: "left" }}
                            />
                          )}

                          {isInProgress && (
                            <motion.div
                              className="absolute inset-0 bg-construction-blue rounded-full"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 0.5 }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
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
              <div className="relative flex gap-4 pt-2">
                {phases.map((phase, index) => {
                  const stats = phaseStats.find((s) => s.phaseId === phase.id);
                  const isCurrent = phase.id === currentPhaseId;
                  const isSelected = phase.id === selectedPhaseId;

                  return (
                    <motion.div
                      key={phase.id}
                      id={`phase-mobile-${phase.id}`}
                      className="snap-center flex-shrink-0"
                      style={{ width: "110px" }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                    >
                      <PhaseStation
                        phase={phase}
                        stats={stats}
                        isCurrent={isCurrent}
                        isSelected={isSelected}
                        onClick={() => {
                          console.log(
                            "[PhaseStation] Clicked:",
                            phase.name,
                            "isSelected:",
                            isSelected,
                          );
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
              transition={{ duration: 0.2 }}
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
