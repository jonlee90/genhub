'use client';

/**
 * SubcontractorsPageClient - Optimized Subcontractors List Page
 *
 * Performance optimizations:
 * - Single responsive SubcontractorCard component
 * - CSS-based stagger animations instead of per-item framer-motion
 * - Memoized filter/sort/stats calculations
 * - Extracted reusable components (NoResultsState, SubcontractorGrid, Pagination)
 * - Reduced framer-motion usage to essential animations only
 * - B-002: Dynamic import for SubcontractorModal (-30KB from initial bundle)
 */

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PullToRefresh, type PullToRefreshHandle } from '@/components/mobile/PullToRefresh';
import { BlueprintBackground } from '@/components/shared/BlueprintBackground';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { SubcontractorCard } from './SubcontractorCard';
import { SubcontractorFilters } from './SubcontractorFilters';
import { SubcontractorPortfolio } from './SubcontractorPortfolio';
import { Button } from '@/components/ui/button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Users from 'lucide-react/icons/users';
import Plus from 'lucide-react/icons/plus';
import Search from 'lucide-react/icons/search';
import ChevronLeft from 'lucide-react/icons/chevron-left';
import ChevronRight from 'lucide-react/icons/chevron-right';
import type { SubcontractorsRow } from '@/types/db/tables/companies';
import type { UserRole } from '@/types/db/enums';

// B-002: Dynamic import for heavy SubcontractorModal component (-30KB from initial bundle)
const SubcontractorModal = dynamic(
  () => import('./SubcontractorModal').then((mod) => ({ default: mod.SubcontractorModal })),
  {
    ssr: false,
    loading: () => null,
  }
);

// ============================================
// Extracted Components for Better Performance
// ============================================

/**
 * No results state when filters return empty - memoized
 */
const NoResultsState = memo(function NoResultsState({
  searchQuery,
  onClearFilters,
}: {
  searchQuery: string;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
        No subcontractors found
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        No subcontractors match your current filters{searchQuery ? `: "${searchQuery}"` : ''}
      </p>
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="h-11 md:h-12 min-w-[44px] font-bold"
      >
        Clear all filters
      </Button>
    </div>
  );
});

/**
 * Subcontractor grid with CSS stagger animation
 */
const SubcontractorGrid = memo(function SubcontractorGrid({
  subcontractors,
  isMobile,
  canManage,
  isGCAdmin,
  onEdit,
}: {
  subcontractors: SubcontractorsRow[];
  isMobile: boolean;
  canManage: boolean;
  isGCAdmin: boolean;
  onEdit: (sub: SubcontractorsRow) => void;
}) {
  return (
    <div
      className={
        isMobile
          ? 'space-y-3'
          : 'grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }
    >
      {subcontractors.map((sub, index) => (
        <div
          key={sub.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: `${Math.min(index * 50, 300)}ms`,
            animationDuration: '400ms',
            animationFillMode: 'both',
          }}
        >
          <SubcontractorCard
            subcontractor={sub}
            canManage={canManage}
            isGCAdmin={isGCAdmin}
            onEdit={onEdit}
          />
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
  isMobile,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isMobile: boolean;
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers with smart ellipsis
  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, 5, 'ellipsis', total];
    }

    if (current >= total - 2) {
      return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-6">
      {/* Previous button */}
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          h-11 md:h-12 px-3 md:px-4
          bg-white dark:bg-gray-900 border-2 border-construction-blue dark:border-construction-blue
          text-construction-blue dark:text-construction-blue font-bold
          hover:bg-construction-blue hover:text-white dark:hover:bg-construction-blue dark:hover:text-white
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
                className="px-2 text-gray-400 dark:text-gray-600 text-sm md:text-base font-bold"
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
              className={`
                h-11 md:h-12 min-w-[44px] md:min-w-[48px] px-2 md:px-3
                border-2 font-black text-sm md:text-base
                transition-all duration-150
                active:scale-[0.98]
                ${
                  isActive
                    ? 'bg-construction-blue dark:bg-construction-blue border-construction-blue dark:border-construction-blue text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-construction-blue dark:hover:border-construction-blue hover:text-construction-blue dark:hover:text-construction-blue'
                }
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
        disabled={currentPage === totalPages}
        className={`
          h-11 md:h-12 px-3 md:px-4
          bg-white dark:bg-gray-900 border-2 border-construction-blue dark:border-construction-blue
          text-construction-blue dark:text-construction-blue font-bold
          hover:bg-construction-blue hover:text-white dark:hover:bg-construction-blue dark:hover:text-white
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

interface SubcontractorsPageClientProps {
  initialSubcontractors: SubcontractorsRow[];
  stats: {
    total: number;
    active: number;
    expiringLicenses: number;
    expiringInsurance: number;
  };
  role: UserRole;
  companyId: string;
}

export function SubcontractorsPageClient({
  initialSubcontractors,
  stats,
  role,
  companyId,
}: SubcontractorsPageClientProps) {
  // Data states
  const [subcontractors, setSubcontractors] = useState(initialSubcontractors);

  // Sync subcontractors state when initialSubcontractors prop changes (after router.refresh())
  useEffect(() => {
    setSubcontractors(initialSubcontractors);
  }, [initialSubcontractors]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<SubcontractorsRow | null>(
    null
  );

  const router = useRouter();
  const isMobile = useIsMobile();

  // Refs
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

  // Check permissions
  const canCreate = role === 'admin' || role === 'project_manager';
  const isGCAdmin = role === 'admin';

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  // Helper function to get status
  const getStatus = useCallback((sub: SubcontractorsRow): string => {
    if (!sub.is_active) return 'inactive';

    const isExpiringSoon = (expiryDate: string | null): boolean => {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    };

    const isExpired = (expiryDate: string | null): boolean => {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      const now = new Date();
      return expiry < now;
    };

    const licenseExpiring = isExpiringSoon(sub.license_expiry);
    const insuranceExpiring = isExpiringSoon(sub.insurance_expiry);
    const licenseExpired = isExpired(sub.license_expiry);
    const insuranceExpired = isExpired(sub.insurance_expiry);

    if (licenseExpired || insuranceExpired) return 'expired';
    if (licenseExpiring || insuranceExpiring) return 'expiring';
    return 'active';
  }, []);

  // Filter and sort subcontractors - memoized
  const filteredSubcontractors = useMemo(() => {
    let filtered = [...subcontractors];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.company_name.toLowerCase().includes(query) ||
          sub.contact_name.toLowerCase().includes(query) ||
          sub.email?.toLowerCase().includes(query) ||
          sub.phone?.toLowerCase().includes(query)
      );
    }

    // Trade filter
    if (tradeFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.trade_specialization === tradeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => getStatus(sub) === statusFilter);
    }

    // Performance filter
    if (performanceFilter !== 'all') {
      if (performanceFilter === 'unrated') {
        filtered = filtered.filter((sub) => !sub.performance_rating);
      } else {
        const targetRating = parseInt(performanceFilter);
        filtered = filtered.filter(
          (sub) => sub.performance_rating && Math.floor(sub.performance_rating) === targetRating
        );
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.company_name.localeCompare(b.company_name);
        case 'rating':
          return (b.performance_rating || 0) - (a.performance_rating || 0);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'trade':
          return (a.trade_specialization || 'zzz').localeCompare(b.trade_specialization || 'zzz');
        default:
          return a.company_name.localeCompare(b.company_name);
      }
    });

    return filtered;
  }, [subcontractors, searchQuery, tradeFilter, statusFilter, performanceFilter, sortBy, getStatus]);

  // Paginated results - memoized
  const paginatedSubcontractors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubcontractors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubcontractors, currentPage, ITEMS_PER_PAGE]);

  // Total pages
  const totalPages = Math.ceil(filteredSubcontractors.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tradeFilter, statusFilter, performanceFilter, sortBy]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setTradeFilter('all');
    setStatusFilter('all');
    setPerformanceFilter('all');
    setSortBy('name');
  }, []);

  // Handle edit
  const handleEdit = useCallback((sub: SubcontractorsRow) => {
    setSelectedSubcontractor(sub);
    setShowCreateModal(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setSelectedSubcontractor(null);
    router.refresh();
  }, [router]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Empty State - No Subcontractors Created Yet
  if (subcontractors.length === 0) {
    return (
      <>
        <EmptyStateCard
          icon={Users}
          title="BUILD YOUR SUBCONTRACTOR NETWORK"
          description="Start adding trusted subcontractors to streamline your project staffing"
          buttonText="ADD FIRST SUBCONTRACTOR"
          onButtonClick={() => setShowCreateModal(true)}
          showButton={canCreate}
        />
        {showCreateModal && (
          <SubcontractorModal
            isOpen={showCreateModal}
            onClose={handleModalClose}
            companyId={companyId}
            subcontractor={null}
          />
        )}
      </>
    );
  }

  // Render layout based on device type
  return (
    <>
      {isMobile ? (
        <div className="flex flex-col h-full">
          <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} className="flex-1">
            <div className="p-4 pb-[env(safe-area-inset-bottom)]">
              <BlueprintBackground />

              <div className="relative mb-4">
                <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
                <div className="flex items-start pt-2 justify-between gap-3">
                  <h1 className="text-3xl font-black tracking-tighter text-construction-blue dark:text-construction-blue leading-none">
                    SUBCONTRACTORS
                  </h1>
                  {canCreate && (
                    <Button
                      size="lg"
                      onClick={() => {
                        setSelectedSubcontractor(null);
                        setShowCreateModal(true);
                      }}
                      className="relative h-11 px-4 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg transition-all group overflow-hidden text-white min-w-[44px]"
                    >
                      <Plus className="mr-1.5 h-4 w-4 group-hover:rotate-90 transition-transform" />
                      <span className="font-black text-sm">NEW</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Portfolio Summary */}
              <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <SubcontractorPortfolio subcontractors={subcontractors} stats={stats} compact />
              </div>

              {/* Filters */}
              <SubcontractorFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                tradeFilter={tradeFilter}
                onTradeChange={setTradeFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                performanceFilter={performanceFilter}
                onPerformanceChange={setPerformanceFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                subcontractors={subcontractors}
                mobile
              />

              {/* Subcontractor cards */}
              {filteredSubcontractors.length === 0 ? (
                <NoResultsState searchQuery={searchQuery} onClearFilters={clearFilters} />
              ) : (
                <>
                  <SubcontractorGrid
                    subcontractors={paginatedSubcontractors}
                    isMobile={true}
                    canManage={canCreate}
                    isGCAdmin={isGCAdmin}
                    onEdit={handleEdit}
                  />

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    isMobile={true}
                  />
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
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue dark:text-construction-blue leading-none">
                  SUBCONTRACTORS
                </h1>
                {canCreate && (
                  <Button
                    size="lg"
                    onClick={() => {
                      setSelectedSubcontractor(null);
                      setShowCreateModal(true);
                    }}
                    className="relative w-full md:w-auto h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white min-w-[44px]"
                  >
                    <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-black text-sm md:text-base">NEW SUBCONTRACTOR</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SubcontractorPortfolio subcontractors={subcontractors} stats={stats} />
          </div>

          {/* Filters */}
          <SubcontractorFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            tradeFilter={tradeFilter}
            onTradeChange={setTradeFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            performanceFilter={performanceFilter}
            onPerformanceChange={setPerformanceFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            subcontractors={subcontractors}
          />

          {/* Subcontractor grid or empty state */}
          {filteredSubcontractors.length === 0 ? (
            <NoResultsState searchQuery={searchQuery} onClearFilters={clearFilters} />
          ) : (
            <>
              <SubcontractorGrid
                subcontractors={paginatedSubcontractors}
                isMobile={false}
                canManage={canCreate}
                isGCAdmin={isGCAdmin}
                onEdit={handleEdit}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isMobile={false}
              />
            </>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
        </div>
      )}

      {/* Single modal instance for both mobile and desktop */}
      {showCreateModal && (
        <SubcontractorModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          companyId={companyId}
          subcontractor={selectedSubcontractor}
        />
      )}
    </>
  );
}
