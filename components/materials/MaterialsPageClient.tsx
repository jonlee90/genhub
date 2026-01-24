"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { MaterialSummary } from "./MaterialSummary";
import { MaterialsSearch } from "./MaterialsSearch";
import { FilterBar } from "@/components/ui/FilterBar";
import { TrackedMaterialsCarousel } from "./TrackedMaterialsCarousel";
import { MaterialsList } from "./MaterialsList";
import {
  PullToRefresh,
  type PullToRefreshHandle,
} from "@/components/mobile/PullToRefresh";
import { SearchInput } from "@/components/mobile/SearchInput";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type {
  MaterialSummaryStats,
  MaterialWithStats,
  TrackedMaterial,
} from "@/app/actions/materials";

interface Project {
  id: string;
  name: string;
}

interface MaterialsPageClientProps {
  projects: Project[];
  stats: MaterialSummaryStats | null;
  trackedMaterials: TrackedMaterial[];
  initialMaterials: MaterialWithStats[];
  initialPage: number;
  initialTotalPages: number;
}

/**
 * MaterialsPageClient Component
 *
 * Mobile-first client component for the materials page.
 * Follows the TasksPageClient pattern with:
 * - Pull-to-refresh on mobile
 * - Fixed header that appears on scroll
 * - Mobile-optimized search and filters
 * - Touch-friendly interactions
 *
 * @component
 */
export function MaterialsPageClient({
  projects,
  stats,
  trackedMaterials,
  initialMaterials,
  initialPage,
  initialTotalPages,
}: MaterialsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const router = useRouter();
  const isMobile = useIsMobile();

  // Refs for scroll-based header visibility
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(false);

  const projectOptions = useMemo(
    () => [
      { label: "All Projects", value: "all" },
      ...projects.map((project) => ({
        label: project.name,
        value: project.id,
      })),
    ],
    [projects],
  );

  // Track search section position to show/hide header
  // Header shows when search section is 100px or less from viewport top
  useEffect(() => {
    if (!isMobile) return;

    let cleanup: (() => void) | undefined;
    const timeoutId = setTimeout(() => {
      const scrollContainer = pullToRefreshRef.current?.getScrollContainer();
      if (!scrollContainer) return;

      let rafId: number | null = null;
      const checkPosition = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (!searchSectionRef.current) return;
          const rect = searchSectionRef.current.getBoundingClientRect();
          setShowHeader(rect.top <= 100);
        });
      };

      checkPosition();
      scrollContainer.addEventListener("scroll", checkPosition, {
        passive: true,
      });

      cleanup = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        scrollContainer.removeEventListener("scroll", checkPosition);
      };
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      cleanup?.();
    };
  }, [isMobile]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Fixed header - initially hidden, shows when scrolled past search section */}
        <header
          className={`
            fixed top-0 left-0 right-0 z-30
            bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700
            px-4 py-3 space-y-3
            transition-all duration-200 ease-out
            will-change-transform
            ${
              showHeader
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "-translate-y-full opacity-0 pointer-events-none"
            }
          `}
        >
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search materials..."
            debounce={300}
            className="w-full"
          />
        </header>

        {/* Materials content with pull-to-refresh */}
        <PullToRefresh
          ref={pullToRefreshRef}
          onRefresh={handleRefresh}
          className="flex-1"
        >
          <div className="p-4">
            {/* Blueprint Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, currentColor 1px, transparent 1px),
                    linear-gradient(to bottom, currentColor 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                  color: "var(--construction-blue)",
                }}
              />
            </div>

            {/* Industrial Header with Blueprint Aesthetic */}
            <div className="relative mb-5">
              {/* Construction border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

              <div className="flex flex-col gap-3 pt-2">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-construction-blue leading-none">
                      MATERIALS
                    </h1>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Product Search & Tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Material Summary Stats */}
            <div className="mb-5">
              <ErrorBoundary>
                {stats ? (
                  <MaterialSummary
                    stats={stats}
                    trackedCount={trackedMaterials.length}
                  />
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Unable to load summary stats
                  </div>
                )}
              </ErrorBoundary>
            </div>


            {/* Search Section - ref for header visibility */}
            <div ref={searchSectionRef} className="mb-5">
              <MaterialsSearch projects={projects} />
            </div>

            {/* Tracked Materials Carousel */}
            <div className="mb-5">
              <ErrorBoundary>
                <TrackedMaterialsCarousel materials={trackedMaterials} />
              </ErrorBoundary>
            </div>


            {/* Project Filters - Sticky on Mobile */}
            <div className="mb-5">
              <FilterBar
                searchConfig={{
                  placeholder: "Search materials...",
                  value: searchQuery,
                  onChange: setSearchQuery,
                  colSpan: "half",
                }}
                filters={[
                  {
                    name: "project",
                    value: projectFilter,
                    onChange: setProjectFilter,
                    options: projectOptions,
                    placeholder: "All Projects",
                  },
                ]}
              />
            </div>

            {/* Materials List */}
            <ErrorBoundary>
              <MaterialsList
                initialMaterials={initialMaterials}
                initialPage={initialPage}
                initialTotalPages={initialTotalPages}
              />
            </ErrorBoundary>

            {/* Empty state */}
            {initialMaterials.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  No materials linked yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                  Search and link materials to your tasks to start tracking
                </p>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            color: "var(--construction-blue)",
          }}
        />
      </div>

      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-2 md:pt-4">
          <div className="space-y-1 md:space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              MATERIALS
            </h1>
            <p className="text-sm md:text-lg font-semibold text-gray-600 dark:text-gray-400">
              Home Depot Product Search & Procurement Management
            </p>
          </div>
        </div>
      </div>

      {/* New Materials Enhancement Section */}
      <div className="space-y-4 md:space-y-6">
        {/* MaterialSummary - 5-card grid with stats */}
        <ErrorBoundary>
          {stats ? (
            <MaterialSummary
              stats={stats}
              trackedCount={trackedMaterials.length}
            />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Unable to load summary stats
            </div>
          )}
        </ErrorBoundary>



        {/* Materials Search Interface */}
        <MaterialsSearch projects={projects} />

        {/* TrackedMaterialsCarousel - horizontal scroll */}
        <ErrorBoundary>
          <TrackedMaterialsCarousel materials={trackedMaterials} />
        </ErrorBoundary>

        {/* Project Filters */}
        <FilterBar
          searchConfig={{
            placeholder: "Search materials...",
            value: searchQuery,
            onChange: setSearchQuery,
            colSpan: "half",
          }}
          filters={[
            {
              name: "project",
              value: projectFilter,
              onChange: setProjectFilter,
              options: projectOptions,
              placeholder: "All Projects",
            },
          ]}
        />

        {/* MaterialsList - paginated grid */}
        <ErrorBoundary>
          <MaterialsList
            initialMaterials={initialMaterials}
            initialPage={initialPage}
            initialTotalPages={initialTotalPages}
          />
        </ErrorBoundary>
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    </div>
  );
}
