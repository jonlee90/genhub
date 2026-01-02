'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhaseStation } from './PhaseStation';
import { PhaseDetailPanel } from './PhaseDetailPanel';
import { ManagePhasesModal } from './ManagePhasesModal';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Phase = Database['public']['Tables']['project_phases']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

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
}

export function MetroJourney({ phases, tasks, phaseStats, projectId, projects, teamMembers }: MetroJourneyProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debug: Manage phases modal state (Task 0041)
  const [showManagePhasesModal, setShowManagePhasesModal] = useState(false);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);
  const selectedPhaseTasks = tasks.filter((t) => t.phase_id === selectedPhaseId);
  const selectedPhaseStats = phaseStats.find((s) => s.phaseId === selectedPhaseId);

  // Find current phase (first non-completed phase)
  const currentPhaseIndex = phases.findIndex((p) => p.status !== 'completed');
  const currentPhaseId = currentPhaseIndex >= 0 ? phases[currentPhaseIndex].id : null;

  // Debug: Handle scroll to update fade indicators
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftFade(scrollLeft > 10);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Debug: Auto-scroll to current phase on mobile
  useEffect(() => {
    if (currentPhaseId && scrollContainerRef.current) {
      const currentElement = document.getElementById(`phase-${currentPhaseId}`);
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentPhaseId]);

  return (
    <Card className="overflow-hidden border-2 border-gray-200 shadow-construction">
      <CardContent className="pt-8 pb-6">
        {/* Enhanced Title Section with Construction Theme */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* Construction-themed accent bar */}
              <div className="relative h-8 w-1.5 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-construction-blue " />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-transparent"
                  animate={{
                    y: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-foreground">
                  Project Journey
                </h3>
              </div>
            </div>

            {/* Debug: Manage Phases Button (Task 0041) - Only for GC Admin/PM */}
            <Button
              onClick={() => setShowManagePhasesModal(true)}
              variant="outline"
              size="sm"
              className="border-construction-blue/30 text-construction-blue hover:bg-construction-blue/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Phases
            </Button>
          </div>
          <p className="text-sm text-muted-foreground ml-5 font-medium">
            Track progress through each phase
          </p>
        </div>

        {/* Debug: Mobile-responsive Metro Line - Horizontal scroll on mobile, regular on desktop */}
        <div className="relative">
          {/* Debug: Left fade indicator for mobile horizontal scroll */}
          {showLeftFade && (
            <div className="md:hidden absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
          )}

          {/* Debug: Right fade indicator for mobile horizontal scroll */}
          {showRightFade && (
            <div className="md:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
          )}

          {/* Debug: Desktop view - regular ScrollArea */}
          <div className="hidden md:block">
            <ScrollArea className="w-full">
              <div className="relative min-w-max pb-6 px-4">
                {/* Enhanced Track Line with animated gradients */}
                <div className="absolute top-10 left-0 right-0 h-2.5 flex px-4">
                  {phases.map((phase, index) => {
                    const isCompleted = phase.status === 'completed';
                    const isInProgress = phase.status === 'in_progress';
                    const isLast = index === phases.length - 1;

                    return (
                      <div
                        key={`line-${phase.id}`}
                        className="flex-1 flex items-center"
                        style={{ minWidth: '180px' }}
                      >
                        {/* Line segment with Aceternity-style animations */}
                        {!isLast && (
                          <div className="relative flex-1 h-2.5">
                            {/* Background track */}
                            <div className="absolute inset-0 bg-gray-200 rounded-full" />

                            {/* Animated gradient for completed segments */}
                            {isCompleted && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-construction-blue via-construction-green to-construction-blue rounded-full shadow-construction"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                  delay: index * 0.1,
                                  duration: 0.6,
                                  ease: 'easeOut',
                                }}
                                style={{ transformOrigin: 'left' }}
                              />
                            )}

                            {/* Active segment with shimmer effect */}
                            {isInProgress && (
                              <>
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue rounded-full shadow-construction-lg"
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 0.5 }}
                                  transition={{
                                    delay: index * 0.1,
                                    duration: 0.6,
                                    ease: 'easeOut',
                                  }}
                                  style={{ transformOrigin: 'left' }}
                                />
                                {/* Shimmer animation */}
                                <motion.div
                                  className="absolute inset-0 rounded-full"
                                  style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
                                    backgroundSize: '200% 100%',
                                  }}
                                  animate={{
                                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'linear',
                                  }}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Phase Stations with staggered animations */}
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
                        style={{ minWidth: '180px' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.5,
                          ease: 'easeOut',
                        }}
                      >
                        <PhaseStation
                          phase={phase}
                          stats={stats}
                          isCurrent={isCurrent}
                          isSelected={isSelected}
                          onClick={() =>
                            setSelectedPhaseId(isSelected ? null : phase.id)
                          }
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>
          </div>

          {/* Debug: Mobile view - Horizontal scroll with snap, larger touch targets */}
          <div className="md:hidden">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="relative overflow-x-auto pb-6 px-4 snap-x snap-mandatory scrollbar-hide"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Debug: Horizontal track for mobile */}
              <div className="relative min-w-max">
                {/* Enhanced Track Line - horizontal on mobile */}
                <div className="absolute top-[28px] left-0 right-0 h-3 flex">
                  {phases.map((phase, index) => {
                    const isCompleted = phase.status === 'completed';
                    const isInProgress = phase.status === 'in_progress';
                    const isLast = index === phases.length - 1;

                    return (
                      <div
                        key={`line-mobile-${phase.id}`}
                        className="flex items-center"
                        style={{ width: '120px' }}
                      >
                        {/* Line segment */}
                        {!isLast && (
                          <div className="relative w-full h-3">
                            {/* Background track */}
                            <div className="absolute inset-0 bg-gray-200 rounded-full" />

                            {/* Completed segment */}
                            {isCompleted && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-construction-blue to-construction-green rounded-full shadow-construction"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.6 }}
                                style={{ transformOrigin: 'left' }}
                              />
                            )}

                            {/* In-progress segment */}
                            {isInProgress && (
                              <motion.div
                                className="absolute inset-0 bg-construction-blue rounded-full shadow-construction-lg"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 0.5 }}
                                transition={{ delay: index * 0.1, duration: 0.6 }}
                                style={{ transformOrigin: 'left' }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Debug: Phase Stations - larger touch targets for mobile (56x56px minimum) */}
                <div className="relative flex gap-6 pt-2">
                  {phases.map((phase, index) => {
                    const stats = phaseStats.find((s) => s.phaseId === phase.id);
                    const isCurrent = phase.id === currentPhaseId;
                    const isSelected = phase.id === selectedPhaseId;

                    return (
                      <motion.div
                        key={phase.id}
                        id={`phase-mobile-${phase.id}`}
                        className="snap-center flex-shrink-0"
                        style={{ width: '120px' }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.5,
                          ease: 'easeOut',
                        }}
                      >
                        <PhaseStation
                          phase={phase}
                          stats={stats}
                          isCurrent={isCurrent}
                          isSelected={isSelected}
                          onClick={() =>
                            setSelectedPhaseId(isSelected ? null : phase.id)
                          }
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Detail Panel with AnimatePresence */}
        <AnimatePresence mode="wait">
          {selectedPhase && selectedPhaseStats && (
            <motion.div
              key={selectedPhase.id}
              className="mt-8 pt-6 border-t-2 border-dashed border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PhaseDetailPanel
                phase={selectedPhase}
                tasks={selectedPhaseTasks}
                stats={selectedPhaseStats}
                projectId={projectId}
                onClose={() => setSelectedPhaseId(null)}
                projects={projects}
                teamMembers={teamMembers}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Debug: Manage Phases Modal (Task 0041) */}
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
