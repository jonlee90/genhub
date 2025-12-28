'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Building2, MapPin, FileText, DollarSign, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetroJourney } from './MetroJourney';

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

interface ProjectOverviewProps {
  project: any;
  projects?: Array<{
    id: string;
    name: string;
    project_phases?: Array<{
      id: string;
      name: string;
      order_index: number;
    }>;
  }>;
  teamMembers?: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  phaseTaskStats?: PhaseStats[];
}

export function ProjectOverview({ project, projects = [], teamMembers = [], phaseTaskStats = [] }: ProjectOverviewProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            phases={project.project_phases || []}
            tasks={project.tasks || []}
            phaseStats={phaseTaskStats}
            projectId={project.id}
            projects={projects}
            teamMembers={teamMembers}
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
          {/* Project Description */}
          <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
            {/* Subtle animated gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/[0.02] via-transparent to-construction-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
              <CardTitle className="text-lg font-black text-construction-blue flex items-center gap-2">
                <div className="p-1.5 bg-construction-blue/10 rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
                Project Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative">
              {project.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided for this project.</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline & Budget - Side by Side Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Project Timeline */}
            {(project.start_date || project.end_date) && (
              <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
                  <CardTitle className="text-base font-black text-construction-blue flex items-center gap-2">
                    <div className="p-1.5 bg-construction-blue/10 rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </div>
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5 relative">
                  {project.start_date && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</div>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                          <Calendar className="h-5 w-5 text-construction-blue" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-construction-blue">
                            {new Date(project.start_date).getDate()}
                          </div>
                          <div className="text-sm font-bold text-gray-600">
                            {new Date(project.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target End</div>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                          <Calendar className="h-5 w-5 text-construction-accent" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-construction-accent">
                            {new Date(project.end_date).getDate()}
                          </div>
                          <div className="text-sm font-bold text-gray-600">
                            {new Date(project.end_date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Budget Information */}
            {project.budget && (
              <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
                  <CardTitle className="text-base font-black text-construction-blue flex items-center gap-2">
                    <div className="p-1.5 bg-construction-accent/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-construction-accent" />
                    </div>
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 relative">
                  <div className="bg-construction-accent/5 border-2 border-construction-accent/20 rounded-lg p-5">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Budget</div>
                    <div className="text-4xl font-black text-construction-accent">{formatCurrency(project.budget)}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Sidebar Column - 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.35 : 0.15 }}
          className="space-y-6"
        >
          {/* Project Details Card */}
          <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
              <CardTitle className="text-sm font-black text-gray-700 uppercase tracking-wider">
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 relative">
              {/* Project ID */}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Project ID</div>
                <div className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {project.id.substring(0, 8)}...
                </div>
              </div>

              {/* Created Date */}
              {project.created_at && (
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Created</div>
                  <div className="text-sm font-bold text-gray-900">{formatDate(project.created_at)}</div>
                </div>
              )}

              {/* Last Updated */}
              {project.updated_at && (
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Updated</div>
                  <div className="text-sm font-bold text-gray-900">{formatDate(project.updated_at)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          {project.client_name && (
            <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-construction-blue/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
                <CardTitle className="text-sm font-black text-gray-700 uppercase tracking-wider">
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-construction-blue/10 rounded-lg border border-construction-blue/20">
                    <Building2 className="h-5 w-5 text-construction-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</div>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{project.client_name}</div>
                  </div>
                </div>

                {project.client_email && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</div>
                    <a
                      href={`mailto:${project.client_email}`}
                      className="text-sm text-construction-blue hover:underline font-medium"
                    >
                      {project.client_email}
                    </a>
                  </div>
                )}

                {project.client_phone && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</div>
                    <a
                      href={`tel:${project.client_phone}`}
                      className="text-sm text-construction-blue hover:underline font-medium"
                    >
                      {project.client_phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          {project.address && (
            <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-construction-accent/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
                <CardTitle className="text-sm font-black text-gray-700 uppercase tracking-wider">Location</CardTitle>
              </CardHeader>
              <CardContent className="p-4 relative">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-construction-accent/10 rounded-lg mt-0.5 border border-construction-accent/20">
                    <MapPin className="h-5 w-5 text-construction-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 leading-relaxed">
                      {project.address}
                      {project.city && (
                        <>
                          <br />
                          {project.city}
                          {project.state && `, ${project.state}`} {project.zip_code}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
