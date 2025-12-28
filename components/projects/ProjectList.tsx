'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { ProjectFilters } from './ProjectFilters';
import { Button } from '@/components/ui/button';
import { HardHat, X, Wrench, Hammer, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { Database } from '@/types/database.types';

type Project = Database['public']['Tables']['projects']['Row'] & {
  project_phases?: Array<{
    id: string;
    status: string;
    completion_percentage: number;
  }>;
};

interface ProjectListProps {
  initialProjects: Project[];
  searchParams: { [key: string]: string | string[] | undefined };
}

export function ProjectList({ initialProjects, searchParams }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');

  // Apply filters and sorting
  const filteredProjects = useMemo(() => {
    let filtered = [...initialProjects];

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
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    // Type filter
    if (typeFilter && typeFilter !== 'all') {
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
  }, [initialProjects, searchQuery, statusFilter, typeFilter, sortBy]);

  // Empty State - No Projects Created Yet
  if (initialProjects.length === 0) {
    return (
      <div className="relative">
        {/* Industrial Frame */}
        <div className="absolute inset-0 border-4 border-construction-blue/10 rounded-2xl transform rotate-1" />
        <div className="absolute inset-0 border-4 border-construction-accent/10 rounded-2xl transform -rotate-1" />

        <div className="relative flex flex-col items-center justify-center py-24 px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl border-2 border-gray-200 shadow-construction-lg">
          {/* Construction Site Illustration */}
          <div className="relative mb-8">
            {/* Hard Hat Icon - Central */}
            <motion.div
              className="relative z-10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            >
              <div className="relative p-8 bg-gradient-to-br from-construction-blue to-blue-700 rounded-3xl shadow-construction-xl">
                <HardHat className="h-20 w-20 text-white" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-construction-accent rounded-full animate-pulse" />
              </div>
            </motion.div>

            {/* Floating Tools */}
            <motion.div
              className="absolute -left-12 top-8 p-3 bg-white rounded-xl shadow-construction border-2 border-gray-200"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Wrench className="h-6 w-6 text-construction-accent" />
            </motion.div>

            <motion.div
              className="absolute -right-12 top-12 p-3 bg-white rounded-xl shadow-construction border-2 border-gray-200"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Hammer className="h-6 w-6 text-construction-blue" />
            </motion.div>

            {/* Blueprint Grid Background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                color: '#001B51'
              }} />
            </div>
          </div>

          {/* Heavy Industrial Typography */}
          <motion.h2
            className="text-5xl font-black text-center mb-4 bg-gradient-to-r from-construction-blue via-construction-blue to-blue-700 bg-clip-text text-transparent leading-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            BUILD YOUR<br />FIRST PROJECT
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 font-medium mb-10 max-w-xl text-center leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Launch your construction command center. Track progress, manage teams, monitor budgets, and deliver projects with industrial precision.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link href="/app/projects/new">
              <Button size="lg" className="relative h-16 px-10 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-xl hover:shadow-2xl transition-all group overflow-hidden text-lg font-black text-white">
                <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-20 transition-opacity" />
                <HardHat className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                START FIRST PROJECT
              </Button>
            </Link>
          </motion.div>

          {/* Industrial Process Steps */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl w-full">
            {[
              { num: '01', label: 'Create Project', icon: HardHat },
              { num: '02', label: 'Add Tasks', icon: Wrench },
              { num: '03', label: 'Track Progress', icon: Hammer }
            ].map((step, index) => (
              <motion.div
                key={step.num}
                className="relative group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
              >
                <div className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-construction-blue transition-all shadow-construction hover:shadow-construction-lg">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-construction-blue/10 border-2 border-construction-blue/20 mb-3 group-hover:scale-110 transition-transform">
                    <step.icon className="h-6 w-6 text-construction-blue" />
                  </div>
                  <div className="text-2xl font-black text-construction-blue mb-1">{step.num}</div>
                  <p className="text-sm font-bold text-gray-600 text-center">{step.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      />

      {/* Results count - Industrial Style */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-construction-blue rounded-full animate-pulse" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-construction-blue">
            Site Status
          </span>
        </div>
        <div className="h-4 w-px bg-construction-blue/30" />
        <span className="text-sm font-bold text-gray-700">
          {filteredProjects.length} of {initialProjects.length} projects active
        </span>
      </div>

      {/* No Results State */}
      {filteredProjects.length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 border-2 border-dashed border-construction-red/20 rounded-xl transform rotate-1" />

          <div className="relative flex flex-col items-center justify-center py-20 px-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
            {/* Warning Icon */}
            <motion.div
              className="mb-6 p-6 bg-gradient-to-br from-construction-red/10 to-construction-red/5 rounded-2xl border-2 border-construction-red/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <ShieldAlert className="h-16 w-16 text-construction-red" />
            </motion.div>

            <h3 className="text-3xl font-black text-construction-red mb-3">
              NO SITES FOUND
            </h3>

            <p className="text-gray-600 font-medium mb-8 max-w-md text-center text-lg">
              No projects match your current filters. Adjust search criteria or clear all filters.
            </p>

            <Button
              size="lg"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
                setSortBy('created_at');
              }}
              className="h-12 px-8 bg-white border-2 border-construction-red hover:bg-construction-red hover:text-white transition-all shadow-construction font-black group"
            >
              <X className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
              CLEAR ALL FILTERS
            </Button>
          </div>
        </div>
      ) : (
        /* Project Grid with Staggered Animation */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
