'use client';

import { useState, useEffect, useCallback } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Search from 'lucide-react/icons/search';
import UserPlus from 'lucide-react/icons/user-plus';
import Loader2 from 'lucide-react/icons/loader-2';
import AlertCircle from 'lucide-react/icons/alert-circle';
import Mail from 'lucide-react/icons/mail';
import { motion, AnimatePresence } from 'framer-motion';
import { addProjectTeamMember } from '@/app/actions/projects';

// Debug: User profile interface for team member selection
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

// Debug: Available roles for project team members
const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'field_worker', label: 'Field Worker' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'client', label: 'Client' },
];

interface AddMemberModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingMemberIds: string[]; // Filter out already assigned members
  companyId: string;
}

export function AddMemberModal({
  projectId,
  open,
  onOpenChange,
  existingMemberIds,
  companyId,
}: AddMemberModalProps) {
  // Debug: State management for modal
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('field_worker');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Performance optimization: Memoize async functions to prevent recreation on every render
  // NOTE: Must declare useCallback functions BEFORE useEffect hooks that use them
  const fetchCompanyUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[AddMemberModal] Fetching company users from API...');
      const response = await fetch(`/api/companies/${companyId}/users`);

      if (!response.ok) {
        throw new Error('Failed to fetch company users');
      }

      const data = await response.json();
      console.log('[AddMemberModal] Fetched users:', data.users?.length || 0);

      // Debug: Filter out users already on the project
      const availableUsers = (data.users || []).filter(
        (user: UserProfile) => !existingMemberIds.includes(user.id)
      );

      console.log('[AddMemberModal] Available users after filtering:', availableUsers.length);
      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (err) {
      console.error('[AddMemberModal] Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [companyId, existingMemberIds]);

  const resetState = useCallback(() => {
    console.log('[AddMemberModal] Resetting modal state');
    setSearchQuery('');
    setSelectedUserId(null);
    setSelectedRole('field_worker');
    setUsers([]);
    setFilteredUsers([]);
    setError(null);
    setSuccess(false);
  }, []);

  // Debug: Fetch company users when modal opens
  useEffect(() => {
    console.log('[AddMemberModal] Modal opened, fetching company users');
    console.log('[AddMemberModal] Company ID:', companyId);
    console.log('[AddMemberModal] Existing member IDs:', existingMemberIds);

    if (open) {
      fetchCompanyUsers();
    } else {
      // Debug: Reset state when modal closes
      resetState();
    }
  }, [open, companyId, fetchCompanyUsers, resetState, existingMemberIds]);

  // Debug: Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      console.log('[AddMemberModal] No search query, showing all users');
      setFilteredUsers(users);
    } else {
      console.log('[AddMemberModal] Filtering users by query:', searchQuery);
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('[AddMemberModal] Filtered results:', filtered.length);
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleSubmit = useCallback(async () => {
    // Debug: Validate selection
    if (!selectedUserId) {
      console.log('[AddMemberModal] No user selected');
      setError('Please select a user');
      return;
    }

    if (!selectedRole) {
      console.log('[AddMemberModal] No role selected');
      setError('Please select a role');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('[AddMemberModal] Adding team member:', {
        projectId,
        userId: selectedUserId,
        role: selectedRole,
      });

      // Debug: Call server action to add member
      const result = await addProjectTeamMember(projectId, selectedUserId, selectedRole);

      if (result.error) {
        console.error('[AddMemberModal] Server action error:', result.error);
        setError(result.error);
        return;
      }

      console.log('[AddMemberModal] Team member added successfully');
      setSuccess(true);

      // Debug: Close modal after short delay to show success
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      console.error('[AddMemberModal] Error adding team member:', err);
      setError('Failed to add team member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedUserId, selectedRole, projectId, onOpenChange]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedUser = filteredUsers.find((u) => u.id === selectedUserId);

  return (
    <BaseModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      icon={UserPlus}
      title="Add Team Member"
      subtitle="Select a user from your company and assign them a role on this project."
      maxWidth="lg"
      leftActions={
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
          className="font-bold"
        >
          Cancel
        </Button>
      }
      rightActions={
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedUserId || loading || success}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Add Member
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-4">
          {/* Debug: Search input */}
          <div className="space-y-2">
            <Label htmlFor="search" className="font-bold text-gray-700">
              Search Users
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-construction-blue"
                disabled={loading}
              />
            </div>
          </div>

          {/* Debug: User list */}
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Select User</Label>
            <div className="border-2 border-gray-200 rounded-lg max-h-64 overflow-y-auto bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
                  <span className="ml-2 text-sm text-gray-600">Loading users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {searchQuery ? 'No users match your search' : 'No available users'}
                  </p>
                </div>
              ) : (
                <div className="divide-y-2 divide-gray-200">
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.button
                        key={user.id}
                        type="button"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          console.log('[AddMemberModal] User selected:', user.name);
                          setSelectedUserId(user.id);
                          setError(null);
                        }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-white transition-colors ${
                          selectedUserId === user.id
                            ? 'bg-construction-blue/10 border-l-4 border-l-construction-blue'
                            : 'bg-gray-50'
                        }`}
                      >
                        <Avatar className="h-10 w-10 border-2 border-construction-blue/20">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-construction-blue text-white font-bold text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                        {selectedUserId === user.id && (
                          <Badge className="bg-construction-blue text-white font-bold text-xs">
                            Selected
                          </Badge>
                        )}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Debug: Role selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="font-bold text-gray-700">
              Assign Role
            </Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger
                id="role"
                className="border-2 border-gray-200 focus:border-construction-blue"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Debug: Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2"
            >
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </motion.div>
          )}

          {/* Debug: Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-center gap-2"
            >
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <p className="text-sm text-green-800 font-medium">Team member added successfully!</p>
            </motion.div>
          )}
        </div>
    </BaseModal>
  );
}
