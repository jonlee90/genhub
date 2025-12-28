'use client';

import { useState } from 'react';
import { UserPlus, X, Users, Mail, Phone, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { removeProjectTeamMember } from '@/app/actions/projects';

interface TeamMember {
  id: string;
  user_id: string | null;
  subcontractor_id: string | null;
  role: string;
  assigned_at: string;
  user_profiles?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  subcontractors?: {
    id: string;
    company_name: string;
    contact_name: string;
    trade_specialization: string;
  } | null;
}

interface ProjectTeamProps {
  projectId: string;
  team: TeamMember[];
}

const ROLE_CONFIG = {
  gc_admin: { label: 'GC Admin', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: HardHat },
  project_manager: { label: 'Project Manager', color: 'bg-construction-blue/10 text-construction-blue border-construction-blue/30', icon: HardHat },
  foreman: { label: 'Foreman', color: 'bg-construction-green/10 text-construction-green border-construction-green/30', icon: HardHat },
  field_worker: { label: 'Field Worker', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: HardHat },
  subcontractor: { label: 'Subcontractor', color: 'bg-construction-accent/10 text-construction-accent border-construction-accent/30', icon: HardHat },
  client: { label: 'Client', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: Users },
};

export function ProjectTeam({ projectId, team }: ProjectTeamProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (memberId: string, userId: string) => {
    setRemovingId(memberId);
    try {
      await removeProjectTeamMember(projectId, userId);
    } catch (error) {
      console.error('Failed to remove team member:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Group team members by role
  const teamByRole = team.reduce((acc, member) => {
    const role = member.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-construction">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-construction-blue" />
            <span className="text-xs font-mono uppercase text-gray-500">Total</span>
          </div>
          <div className="text-3xl font-black text-construction-blue">{team.length}</div>
          <div className="text-xs font-bold text-gray-600">Team Members</div>
        </div>

        {Object.entries(teamByRole).slice(0, 3).map(([role, members]) => {
          const roleConfig = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || {
            label: role,
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: Users,
          };

          return (
            <div key={role} className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-construction">
              <div className="flex items-center justify-between mb-2">
                <roleConfig.icon className="h-5 w-5 text-construction-blue" />
                <span className="text-xs font-mono uppercase text-gray-500">{roleConfig.label}</span>
              </div>
              <div className="text-3xl font-black text-construction-blue">{members.length}</div>
              <div className="text-xs font-bold text-gray-600 truncate">{roleConfig.label}</div>
            </div>
          );
        })}
      </div>

      {/* Team Members List */}
      <Card className="border-2 border-gray-200 shadow-construction">
        <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-black text-construction-blue">
                <Users className="h-5 w-5" />
                Project Team
              </CardTitle>
              <CardDescription className="font-medium">
                {team.length} team member{team.length !== 1 ? 's' : ''} assigned to this project
              </CardDescription>
            </div>
            <Button className="gap-2 bg-construction-blue hover:bg-construction-blue/90 text-white font-bold">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {team.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">No team members yet</h3>
              <p className="text-gray-500 mb-4">
                Add team members to collaborate on this project
              </p>
              <Button className="gap-2 bg-construction-blue hover:bg-construction-blue/90 text-white font-bold">
                <UserPlus className="h-4 w-4" />
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {team.map((member, index) => {
                const isUser = !!member.user_profiles;
                const name = isUser
                  ? member.user_profiles?.name
                  : member.subcontractors?.company_name;
                const subtitle = isUser
                  ? member.user_profiles?.email
                  : `${member.subcontractors?.contact_name} - ${member.subcontractors?.trade_specialization}`;
                const avatar = isUser ? member.user_profiles?.avatar_url : null;

                const roleConfig = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] || {
                  label: member.role,
                  color: 'bg-gray-100 text-gray-800 border-gray-200',
                  icon: Users,
                };

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-construction-blue hover:shadow-construction transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 border-2 border-construction-blue/20">
                          <AvatarImage src={avatar || undefined} />
                          <AvatarFallback className="bg-construction-blue text-white font-bold">
                            {name ? getInitials(name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 group-hover:text-construction-blue transition-colors truncate">
                            {name}
                          </p>
                          <p className="text-sm text-gray-600 truncate flex items-center gap-1.5">
                            {isUser ? (
                              <>
                                <Mail className="h-3 w-3" />
                                {subtitle}
                              </>
                            ) : (
                              subtitle
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={`px-3 py-1.5 text-xs font-bold border-2 ${roleConfig.color}`}>
                          {roleConfig.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => member.user_id && handleRemove(member.id, member.user_id)}
                          disabled={removingId === member.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
