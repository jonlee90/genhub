'use client';

import { useState } from 'react';
import { Calendar, Building2, MapPin, DollarSign, User, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetroJourney } from './MetroJourney';
import { ProjectExpenseSummary } from './ProjectExpenseSummary';
import { ProjectTaskSummary } from './ProjectTaskSummary';
import { InfoCard } from './InfoCard';
import { formatDate } from '@/lib/utils';

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

// Fix C2: Import ExpenseStats instead of duplicating
import type { ExpenseStats, TaskStats, TeamCostSummary } from '@/app/actions/projects';
import type { ProjectOverviewProps } from '@/types/components/projects';
import { TeamCostSummaryCard } from './TeamCostSummaryCard';

export function ProjectOverview({ project, projects = [], teamMembers = [], phaseTaskStats = [], expenseStats, taskStats, teamCostSummaries = [] }: ProjectOverviewProps) {
  console.log('[ProjectOverview] Rendering with expense stats:', expenseStats, 'task stats:', taskStats, 'teamCostSummaries:', teamCostSummaries?.length);

  const hasPhases = project.project_phases && project.project_phases.length > 0;

  return (
    <div className="space-y-6">
      {/* Project Journey - Full Width Hero Section */}
      {hasPhases && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >

          <MetroJourney
            phases={(project.project_phases || []) as any}
            tasks={(project.tasks || []) as any}
            phaseStats={phaseTaskStats}
            projectId={project.id}
            projects={projects}
            teamMembers={teamMembers as any}
          />
        </motion.div>
      )}

      {/* Two-Column Layout: Main Content + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Column - 2/3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.3 : 0 }}
          className="lg:col-span-2 space-y-6"
        >
  {/* Task Summary Widget */}
  {taskStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <ProjectTaskSummary
                taskStats={taskStats}
                projectBudget={project.budget ?? undefined}
              />
            </motion.div>
          )}

          {/* Expense Summary Widget */}
          {expenseStats && project.budget && project.budget > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <ProjectExpenseSummary
                expenseStats={expenseStats}
                budget={project.budget}
              />
            </motion.div>
          )}

         

        </motion.div>

        {/* Sidebar Column - 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.35 : 0.15 }}
          className="space-y-6"
        >
          {/* Client Information */}
          {(project.client_name || project.client_email || project.client_phone) && (
            <InfoCard
              headerIcon={User}
              headerTitle="Client Information"
              headerDescription="Primary contact"
              columns={1}
              fields={[
                {
                  label: 'Name',
                  value: project.client_name,
                  show: !!project.client_name,
                },
                {
                  label: 'Email',
                  value: project.client_email,
                  icon: Mail,
                  href: project.client_email ?? undefined,
                  hrefType: 'email',
                  show: !!project.client_email,
                },
                {
                  label: 'Phone',
                  value: project.client_phone,
                  icon: Phone,
                  href: project.client_phone ?? undefined,
                  hrefType: 'tel',
                  show: !!project.client_phone,
                },
              ]}
              footerContent={
                (project.created_at || project.updated_at) && (
                  <div className="border-t-2 border-gray-100 pt-4 mt-4 space-y-3 col-span-full">
                    {project.created_at && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Created
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {formatDate(project.created_at, { includeYear: true })}
                        </div>
                      </div>
                    )}
                    {project.updated_at && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {formatDate(project.updated_at, { includeYear: true })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            />
          )}

          {/* Team Cost Summary Card - Below Client Information */}
          {teamCostSummaries && (
            <TeamCostSummaryCard
              summaries={teamCostSummaries}
            />
          )}

        </motion.div>
      </div>
    </div>
  );
}
