'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PullToRefresh, type PullToRefreshHandle } from '@/components/mobile/PullToRefresh';
import { SearchInput } from '@/components/mobile/SearchInput';
import { MobileStatusTabs } from '@/components/mobile/MobileStatusTabs';
import { FilterButton } from '@/components/mobile/FilterButton';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useBottomNav } from '@/lib/contexts/BottomNavContext';
import { CreateProjectModal } from './CreateProjectModal';
import { MobileProjectCard } from './MobileProjectCard';
import { ProjectCard } from './ProjectCard';
import { ProjectFilters } from './ProjectFilters';
import { Button } from '@/components/ui/button';
import {
  Building2,
  HardHat,
  Home,
  UtensilsCrossed,
  Coffee,
  Factory,
  X,
  Wrench,
  Hammer,
  ShieldAlert,
} from 'lucide-react';
import type { Database } from '@/types/database.types';

type Project = Database['public']['Tables']['projects']['Row'] & {
  project_phases?: Array<{
    id: string;
    status: string;
    completion_percentage: number | null;
  }>;
};

interface ProjectsPageClientProps {
  projects: Project[];
  role: string | null;
}

// Status filter tabs for mobile
const PROJECT_STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

// Project type options for filter
const PROJECT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types', icon: null },
  { value: 'residential', label: 'Residential', icon: Home },
  { value: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'cafe', label: 'Cafe', icon: Coffee },
  { value: 'commercial_office', label: 'Commercial Office', icon: Building2 },
  { value: 'industrial', label: 'Industrial', icon: Factory },
];

// Sort options for filter
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'client', label: 'Client (A-Z)' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'health_score', label: 'Health Score' },
  { value: 'completion', label: 'Completion %' },
];

export function ProjectsPageClient({ projects, role }: ProjectsPageClientProps) {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI states
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHeader, setShowHeader] = useState(false);

  const router = useRouter();
  const isMobile = useIsMobile();
  const { registerCreateModal, unregisterCreateModal } = useBottomNav();

  // Refs for scroll-based header visibility
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);
  const resultsCountRef = useRef<HTMLDivElement>(null);

  // Track results count element position to show/hide header
  useEffect(() => {
    if (!isMobile) return;

    const setupListener = () => {
      const scrollContainer = pullToRefreshRef.current?.getScrollContainer();
      if (!scrollContainer) return;

      const checkResultsPosition = () => {
        if (!resultsCountRef.current) return;
        const rect = resultsCountRef.current.getBoundingClientRect();
        setShowHeader(rect.top <= 133);
      };

      checkResultsPosition();
      scrollContainer.addEventListener('scroll', checkResultsPosition, { passive: true });

      return () => {
        scrollContainer.removeEventListener('scroll', checkResultsPosition);
      };
    };

    const timeoutId = setTimeout(setupListener, 50);
    return () => clearTimeout(timeoutId);
  }, [isMobile]);

  // Register create modal data for bottom nav
  useEffect(() => {
    if (role === 'admin' || role === 'project_manager' || role === 'owner') {
      registerCreateModal('/app/projects', { role });
      return () => unregisterCreateModal('/app/projects');
    }
  }, [role, registerCreateModal, unregisterCreateModal]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  // Calculate active filter count (excluding status - shown in tabs)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (sortBy !== 'created_at') count++;
    return count;
  }, [typeFilter, sortBy]);

  // Filter and sort projects
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

  // Calculate status counts (filtered by search and type, NOT by status)
  const statusCounts = useMemo(() => {
    const projectsForCounting = projects.filter((project) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          project.name.toLowerCase().includes(query) ||
          project.client_name.toLowerCase().includes(query) ||
          project.address?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (typeFilter !== 'all' && project.project_type !== typeFilter) {
        return false;
      }
      return true;
    });

    const counts: Record<string, number> = {
      all: projectsForCounting.length,
      active: 0,
      on_hold: 0,
      completed: 0,
    };

    projectsForCounting.forEach((project) => {
      if (project.status in counts) {
        counts[project.status]++;
      }
    });

    return counts;
  }, [projects, searchQuery, typeFilter]);

  // Add counts to status tabs
  const tabsWithCounts = PROJECT_STATUS_TABS.map((tab) => ({
    ...tab,
    count: statusCounts[tab.value] || 0,
  }));

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

  // Check if user can create projects
  const canCreate = role === 'admin' || role === 'project_manager' || role === 'owner';

  // Empty State - No Projects Created Yet
  if (projects.length === 0) {
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
                <HardHat className="h-12 w-12 md:h-20 md:w-20 text-white" />
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
                  onClick={() => setShowCreateModal(true)}
                  className="relative h-12 md:h-16 px-6 md:px-10 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-xl hover:shadow-2xl transition-all group overflow-hidden text-sm md:text-lg font-black text-white"
                >
                  <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-20 transition-opacity" />
                  <HardHat className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform" />
                  START PROJECT
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Fixed header - shows when scrolled past results count */}
        <header
          className={`
            fixed top-0 left-0 right-0 z-30
            bg-white/95 backdrop-blur-sm border-b border-gray-200
            px-4 py-3 space-y-3
            transition-all duration-200 ease-out
            will-change-transform
            ${
              showHeader
                ? 'translate-y-0 opacity-100 pointer-events-auto'
                : '-translate-y-full opacity-0 pointer-events-none'
            }
          `}
        >
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search projects..."
            debounce={300}
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <MobileStatusTabs
                tabs={tabsWithCounts}
                value={statusFilter}
                onChange={setStatusFilter}
                showCounts={true}
              />
            </div>
            <FilterButton
              onClick={() => setShowFilterSheet(true)}
              count={activeFilterCount}
              className="flex-shrink-0"
            />
          </div>
        </header>

        <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} className="flex-1">
          <div className="p-4 pb-32">
            {/* Blueprint Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, currentColor 1px, transparent 1px),
                    linear-gradient(to bottom, currentColor 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                  color: '#001B51',
                }}
              />
            </div>

            {/* Industrial Header */}
            <div className="relative mb-5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-3xl font-black tracking-tighter text-construction-blue leading-none">
                    PROJECTS
                  </h1>
                  {canCreate && (
                    <Button
                      size="lg"
                      onClick={() => setShowCreateModal(true)}
                      className="relative h-11 px-4 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg transition-all group overflow-hidden text-white"
                    >
                      <HardHat className="mr-1.5 h-4 w-4 group-hover:rotate-12 transition-transform" />
                      <span className="font-black text-sm">NEW</span>
                    </Button>
                  )}
                </div>

                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search projects..."
                  debounce={300}
                />

                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <MobileStatusTabs
                      tabs={tabsWithCounts}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      showCounts={true}
                    />
                  </div>
                  <FilterButton
                    onClick={() => setShowFilterSheet(true)}
                    count={activeFilterCount}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Results count */}
            <div
              ref={resultsCountRef}
              className="flex items-center gap-2 px-3 py-2 mb-4 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-construction-blue rounded-full animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-construction-blue">
                  Status
                </span>
              </div>
              <div className="h-4 w-px bg-construction-blue/30" />
              <span className="text-xs font-bold text-gray-700">
                {filteredProjects.length} of {projects.length} projects
              </span>
            </div>

            {/* Project cards */}
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects found</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-xs">Try adjusting your filters</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 px-6 rounded-xl font-semibold text-[#DC2626] bg-red-50 active:bg-red-100 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.03,
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                    }}
                  >
                    <MobileProjectCard project={project} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>

        {/* Filter bottom sheet */}
        <BottomSheet
          isOpen={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          title="Filters"
          description="Filter projects by type and sort order"
        >
          <div className="px-5 py-4 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Project Type</label>
              <div className="space-y-2">
                {PROJECT_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTypeFilter(option.value)}
                      className={`w-full h-12 px-4 rounded-xl text-left font-medium transition-colors flex items-center gap-3 ${
                        typeFilter === option.value
                          ? 'bg-[#001B51] text-white'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className={`w-5 h-5 ${typeFilter === option.value ? 'text-white' : 'text-gray-500'}`}
                        />
                      )}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Sort By</label>
              <div className="space-y-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortBy(option.value)}
                    className={`w-full h-12 px-4 rounded-xl text-left font-medium transition-colors ${
                      sortBy === option.value
                        ? 'bg-[#001B51] text-white'
                        : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('all');
                  setSortBy('created_at');
                  setShowFilterSheet(false);
                }}
                className="w-full h-12 px-4 rounded-xl text-center font-medium text-[#DC2626] bg-red-50 active:bg-red-100 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </BottomSheet>

        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            color: '#001B51',
          }}
        />
      </div>

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
                <HardHat className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
                <span className="font-black text-sm md:text-base">NEW</span>
                <span className="hidden sm:inline font-black text-sm md:text-base ml-1">PROJECT</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ProjectFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-2 h-2 bg-construction-blue rounded-full animate-pulse" />
          <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-construction-blue">
            Status
          </span>
        </div>
        <div className="h-4 w-px bg-construction-blue/30" />
        <span className="text-xs md:text-sm font-bold text-gray-700">
          {filteredProjects.length} of {projects.length} projects
        </span>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 border-2 border-dashed border-construction-red/20 rounded-xl transform rotate-1" />
          <div className="relative flex flex-col items-center justify-center py-20 px-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
            <motion.div
              className="mb-6 p-6 bg-gradient-to-br from-construction-red/10 to-construction-red/5 rounded-2xl border-2 border-construction-red/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <ShieldAlert className="h-16 w-16 text-construction-red" />
            </motion.div>
            <h3 className="text-3xl font-black text-construction-red mb-3">NO SITES FOUND</h3>
            <p className="text-gray-600 font-medium mb-8 max-w-md text-center text-lg">
              No projects match your current filters. Adjust search criteria or clear all filters.
            </p>
            <Button
              size="lg"
              onClick={clearFilters}
              className="h-12 px-8 bg-white border-2 border-construction-red hover:bg-construction-red hover:text-white transition-all shadow-construction font-black group"
            >
              <X className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
              CLEAR ALL FILTERS
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.5,
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
