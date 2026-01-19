'use client';

/**
 * ProjectsPageClient - Optimized Projects List Page
 *
 * Performance optimizations:
 * - Single responsive ProjectCard component (no MobileProjectCard)
 * - CSS-based stagger animations instead of per-item framer-motion
 * - Memoized filter/sort/stats calculations
 * - Extracted reusable components (EmptyState, NoResultsState, ResultsCount)
 * - Reduced framer-motion usage to essential animations only
 */

import { useState, useCallback, useMemo, useEffect, useRef, memo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PullToRefresh, type PullToRefreshHandle } from '@/components/mobile/PullToRefresh';
import { BlueprintBackground, PortfolioSummary, type PortfolioSummaryStats } from '@/components/shared';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useBottomNav } from '@/lib/contexts/BottomNavContext';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectCard } from './ProjectCard';
import { ProjectFilters } from './ProjectFilters';
import { Button } from '@/components/ui/button';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Building2 from 'lucide-react/icons/building-2';
import FolderKanban from 'lucide-react/icons/folder-kanban';
import Plus from 'lucide-react/icons/plus';
import X from 'lucide-react/icons/x';
import ShieldAlert from 'lucide-react/icons/shield-alert';
import ChevronLeft from 'lucide-react/icons/chevron-left';
import ChevronRight from 'lucide-react/icons/chevron-right';
import type { ProjectWithStats } from '@/app/actions/projects';
import { getProjectsWithStats } from '@/app/actions/projects';

// ============================================
// Extracted Components for Better Performance
// ============================================

/**
 * Results count indicator - memoized
 */
const ResultsCount = memo(function ResultsCount({
  filtered,
  total,
}: {
  filtered: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="w-2 h-2 bg-construction-blue rounded-full animate-pulse" />
        <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-construction-blue">
          Status
        </span>
      </div>
      <div className="h-4 w-px bg-construction-blue/30" />
      <span className="text-xs md:text-sm font-bold text-gray-700">
        {filtered} of {total} projects
      </span>
    </div>
  );
});

/**
 * Empty state when no projects exist - memoized
 */
const EmptyState = memo(function EmptyState({
  canCreate,
  onCreateClick,
}: {
  canCreate: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="relative">
        <div className="hidden md:block absolute inset-0 border-4 border-construction-blue/10 rounded-2xl transform rotate-1" />
        <div className="hidden md:block absolute inset-0 border-4 border-construction-accent/10 rounded-2xl transform -rotate-1" />

        <div className="relative flex flex-col items-center justify-center py-12 md:py-24 px-4 md:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl md:rounded-2xl border-2 border-gray-200 shadow-construction-lg">
          <motion.div
            className="relative z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
          >
            <div className="relative p-5 md:p-8 bg-gradient-to-br from-construction-blue to-blue-700 rounded-2xl md:rounded-3xl shadow-construction-xl">
              <FolderKanban className="h-12 w-12 md:h-20 md:w-20 text-white" />
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-construction-accent rounded-full animate-pulse" />
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl sm:text-3xl md:text-5xl font-black text-center mb-3 md:mb-4 mt-6 bg-gradient-to-r from-construction-blue via-construction-blue to-blue-700 bg-clip-text text-transparent leading-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            BUILD YOUR
            <br />
            FIRST PROJECT
          </motion.h2>

          <motion.p
            className="text-sm md:text-lg text-gray-600 font-medium mb-6 md:mb-10 max-w-xl text-center leading-relaxed px-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Launch your construction command center. Track progress, manage teams, and deliver
            projects.
          </motion.p>

          {canCreate && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                size="lg"
                onClick={onCreateClick}
                className="relative h-12 md:h-16 px-6 md:px-10 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-xl hover:shadow-2xl transition-all group overflow-hidden text-sm md:text-lg font-black text-white"
              >
                <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-20 transition-opacity" />
                <FolderKanban className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform" />
                START PROJECT
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * No results state when filters return empty - memoized
 */
const NoResultsState = memo(function NoResultsState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 border-2 border-dashed border-construction-red/20 rounded-xl transform rotate-1" />
      <div className="relative flex flex-col items-center justify-center py-16 md:py-20 px-4 md:px-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
        <motion.div
          className="mb-4 md:mb-6 p-4 md:p-6 bg-gradient-to-br from-construction-red/10 to-construction-red/5 rounded-2xl border-2 border-construction-red/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <ShieldAlert className="h-12 w-12 md:h-16 md:w-16 text-construction-red" />
        </motion.div>
        <h3 className="text-xl md:text-3xl font-black text-construction-red mb-2 md:mb-3">
          NO SITES FOUND
        </h3>
        <p className="text-gray-600 font-medium mb-4 md:mb-8 max-w-md text-center text-sm md:text-lg">
          No projects match your current filters. Adjust search criteria or clear all filters.
        </p>
        <Button
          size="lg"
          onClick={onClearFilters}
          className="h-11 md:h-12 px-6 md:px-8 bg-white border-2 border-construction-red hover:bg-construction-red hover:text-white transition-all shadow-construction font-black group"
        >
          <X className="mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform" />
          CLEAR ALL FILTERS
        </Button>
      </div>
    </div>
  );
});

/**
 * Mobile empty filter state - simpler version
 */
const MobileNoResultsState = memo(function MobileNoResultsState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Building2 className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects found</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">Try adjusting your filters</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="h-11 px-6 rounded-xl font-semibold text-[#DC2626] bg-red-50 active:bg-red-100 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
});

/**
 * Project grid with CSS stagger animation
 */
const ProjectGrid = memo(function ProjectGrid({
  projects,
  isMobile,
}: {
  projects: ProjectWithStats[];
  isMobile: boolean;
}) {
  return (
    <div
      className={
        isMobile
          ? 'space-y-3'
          : 'grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }
    >
      {projects.map((project, index) => (
        <div
          key={project.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: `${Math.min(index * 50, 300)}ms`,
            animationDuration: '400ms',
            animationFillMode: 'both',
          }}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
});

/**
 * Pagination component - construction blue theme
 */
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isPending,
  isMobile,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPending: boolean;
  isMobile: boolean;
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers with smart ellipsis
  const pageNumbers: (number | 'ellipsis')[] = [];

  for (let i = 1; i <= totalPages; i++) {
    // Always show first, last, current, and neighbors
    if (
      i === 1 ||
      i === totalPages ||
      Math.abs(i - currentPage) <= 1
    ) {
      pageNumbers.push(i);
    } else if (
      // Add ellipsis markers
      (i === 2 && currentPage > 3) ||
      (i === totalPages - 1 && currentPage < totalPages - 2)
    ) {
      if (pageNumbers[pageNumbers.length - 1] !== 'ellipsis') {
        pageNumbers.push('ellipsis');
      }
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-6">
      {/* Previous button */}
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isPending}
        className={`
          h-11 md:h-12 px-3 md:px-4
          bg-white border-2 border-[#001B51]
          text-[#001B51] font-bold
          hover:bg-[#001B51] hover:text-white
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-150
          active:scale-[0.98]
          ${isMobile ? 'min-w-[44px]' : ''}
        `}
      >
        <ChevronLeft className="w-5 h-5" />
        {!isMobile && <span className="ml-1">Prev</span>}
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, idx) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-gray-400 text-sm md:text-base font-bold"
              >
                ...
              </span>
            );
          }

          const isActive = currentPage === page;

          return (
            <Button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={isPending}
              className={`
                h-11 md:h-12 min-w-[44px] md:min-w-[48px] px-2 md:px-3
                border-2 font-black text-sm md:text-base
                transition-all duration-150
                active:scale-[0.98]
                ${
                  isActive
                    ? 'bg-[#001B51] border-[#001B51] text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-[#001B51] hover:text-[#001B51]'
                }
                disabled:opacity-30 disabled:cursor-not-allowed
              `}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next button */}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isPending}
        className={`
          h-11 md:h-12 px-3 md:px-4
          bg-white border-2 border-[#001B51]
          text-[#001B51] font-bold
          hover:bg-[#001B51] hover:text-white
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-150
          active:scale-[0.98]
          ${isMobile ? 'min-w-[44px]' : ''}
        `}
      >
        {!isMobile && <span className="mr-1">Next</span>}
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

interface ProjectsPageClientProps {
  projects: ProjectWithStats[];
  totalCount: number;
  role: string | null;
  companyId: string;
}

export function ProjectsPageClient({ projects: initialProjects, totalCount, role, companyId }: ProjectsPageClientProps) {
  // Data states
  const [projects, setProjects] = useState(initialProjects);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI states
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Constants
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const router = useRouter();
  const isMobile = useIsMobile();
  const { registerCreateModal, unregisterCreateModal } = useBottomNav();

  // Refs
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

  // Check if user can create projects
  const canCreate = role === 'admin' || role === 'project_manager' || role === 'owner';

  // Register create modal data for bottom nav
  useEffect(() => {
    if (canCreate) {
      registerCreateModal('/app/projects', { role });
      return () => unregisterCreateModal('/app/projects');
    }
  }, [canCreate, role, registerCreateModal, unregisterCreateModal]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  // Pagination handler
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isPending) return;

    startTransition(async () => {
      const offset = (newPage - 1) * PAGE_SIZE;
      const { projects: newProjects, error } = await getProjectsWithStats(companyId, {
        limit: PAGE_SIZE,
        offset,
      });

      if (newProjects && !error) {
        setProjects(newProjects);
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error('[ProjectsPageClient] Error fetching page:', error);
      }
    });
  }, [totalPages, isPending, companyId]);

  // Filter and sort projects - memoized
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.client_name.toLowerCase().includes(query) ||
          project.address?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((project) => project.project_type === typeFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'client':
          return a.client_name.localeCompare(b.client_name);
        case 'start_date':
          return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
        case 'health_score':
          return (b.health_score || 0) - (a.health_score || 0);
        case 'completion':
          return (b.completion_percentage || 0) - (a.completion_percentage || 0);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [projects, searchQuery, statusFilter, typeFilter, sortBy]);

  // Calculate portfolio-level stats - memoized
  const portfolioStats = useMemo((): PortfolioSummaryStats | null => {
    if (filteredProjects.length === 0) return null;

    // Count by status
    const activeProjects = filteredProjects.filter((p) => p.status === 'active').length;
    const completedProjects = filteredProjects.filter((p) => p.status === 'completed').length;

    // Budget aggregation
    const totalBudget = filteredProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalActualSpent = filteredProjects.reduce(
      (sum, p) => sum + (p.stats?.actualSpent || 0),
      0
    );
    const budgetVariance = totalBudget - totalActualSpent;
    const budgetUtilization = totalBudget > 0 ? (totalActualSpent / totalBudget) * 100 : 0;

    // Task rollup
    const totalTasks = filteredProjects.reduce(
      (sum, p) => sum + (p.stats?.taskCounts?.total || 0),
      0
    );
    const completedTasks = filteredProjects.reduce(
      (sum, p) => sum + (p.stats?.taskCounts?.completed || 0),
      0
    );
    const overdueTasks = filteredProjects.reduce(
      (sum, p) => sum + (p.stats?.taskCounts?.overdue || 0),
      0
    );

    // Schedule health
    const onTimeProjects = filteredProjects.filter(
      (p) => p.stats?.schedule?.status === 'on-time'
    ).length;
    const atRiskProjects = filteredProjects.filter(
      (p) => p.stats?.schedule?.status === 'at-risk'
    ).length;
    const delayedProjects = filteredProjects.filter(
      (p) => p.stats?.schedule?.status === 'delayed'
    ).length;

    // Top projects by completion (active only)
    const topProjects = [...filteredProjects]
      .filter((p) => p.status === 'active')
      .sort((a, b) => (b.completion_percentage || 0) - (a.completion_percentage || 0))
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        completionPercentage: p.completion_percentage || 0,
      }));

    return {
      totalProjects: filteredProjects.length,
      activeProjects,
      completedProjects,
      totalBudget,
      totalActualSpent,
      budgetVariance,
      budgetUtilization,
      totalTasks,
      completedTasks,
      overdueTasks,
      onTimeProjects,
      atRiskProjects,
      delayedProjects,
      topProjects,
    };
  }, [filteredProjects]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy('created_at');
  }, []);

  // Handle create project success
  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    router.refresh();
  }, [router]);

  // Empty State - No Projects Created Yet
  if (projects.length === 0) {
    return (
      <>
        <EmptyState canCreate={canCreate} onCreateClick={() => setShowCreateModal(true)} />
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </>
    );
  }

  // Render layout based on device type
  return (
    <>
      {isMobile ? (
        <div className="flex flex-col h-full">
          <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} className="flex-1">
            <div className="p-4 pb-32">
              <BlueprintBackground />

              <div className="relative mb-4">
                <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
                  <div className="flex items-start pt-2 justify-between gap-3">
                    <h1 className="text-3xl font-black tracking-tighter text-construction-blue leading-none">
                      PROJECTS
                    </h1>
                    {canCreate && (
                      <Button
                        size="lg"
                        onClick={() => setShowCreateModal(true)}
                        className="relative h-11 px-4 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg transition-all group overflow-hidden text-white"
                      >
                        <Plus className="mr-1.5 h-4 w-4 group-hover:rotate-90 transition-transform" />
                        <span className="font-black text-sm">NEW PROJECT</span>
                      </Button>
                    )}
                  </div>
              </div>

              {/* Portfolio Summary */}
              {portfolioStats && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <PortfolioSummary stats={portfolioStats} />
                </div>
              )}

              {/* Filters */}
              <ProjectFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                projects={projects}
              />

              {/* Results count */}
              <div className="my-4">
                <ResultsCount filtered={filteredProjects.length} total={projects.length} />
              </div>

              {/* Project cards */}
              {filteredProjects.length === 0 ? (
                <MobileNoResultsState onClearFilters={clearFilters} />
              ) : (
                <>
                  <ProjectGrid projects={filteredProjects} isMobile={true} />

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    isPending={isPending}
                    isMobile={true}
                  />

                  {/* Loading indicator */}
                  {isPending && (
                    <div className="text-center text-sm text-gray-500 mt-4 font-medium">
                      Loading projects...
                    </div>
                  )}
                </>
              )}
            </div>
          </PullToRefresh>
        </div>
      ) : (
        <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
          <BlueprintBackground />

          {/* Header */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
            <div className="flex flex-col gap-4 pt-2 md:pt-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
                  PROJECTS
                </h1>
                {canCreate && (
                  <Button
                    size="lg"
                    onClick={() => setShowCreateModal(true)}
                    className="relative w-full md:w-auto h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white"
                  >
                    <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-black text-sm md:text-base">NEW</span>
                    <span className="hidden sm:inline font-black text-sm md:text-base ml-1">
                      PROJECT
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Summary */}
          {portfolioStats && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <PortfolioSummary stats={portfolioStats} />
            </div>
          )}

          {/* Filters */}
          <ProjectFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            projects={projects}
          />

          {/* Results count */}
          <ResultsCount filtered={filteredProjects.length} total={projects.length} />

          {/* Project grid or empty state */}
          {filteredProjects.length === 0 ? (
            <NoResultsState onClearFilters={clearFilters} />
          ) : (
            <>
              <ProjectGrid projects={filteredProjects} isMobile={false} />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isPending={isPending}
                isMobile={false}
              />

              {/* Loading indicator */}
              {isPending && (
                <div className="text-center text-sm text-gray-500 mt-4 font-medium">
                  Loading projects...
                </div>
              )}
            </>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>
      )}

      {/* Single modal instance for both mobile and desktop */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
