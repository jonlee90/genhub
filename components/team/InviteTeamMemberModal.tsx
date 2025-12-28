'use client';

import { useState, useActionState, useEffect, useCallback } from 'react';
import { inviteTeamMember } from '@/app/actions/team';
import { Database } from '@/types/database.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, User, Shield, CheckCircle2, XCircle } from 'lucide-react';

type UserRole = Database['public']['Enums']['user_role'];

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

const ROLE_OPTIONS = [
  {
    value: 'gc_admin',
    label: 'GC Admin',
    description: 'Full access to all features and settings',
  },
  {
    value: 'project_manager',
    label: 'Project Manager',
    description: 'Manage projects, tasks, and team assignments',
  },
  {
    value: 'foreman',
    label: 'Foreman',
    description: 'Field supervision and task oversight',
  },
  {
    value: 'field_worker',
    label: 'Field Worker',
    description: 'Basic task access and updates',
  },
  {
    value: 'subcontractor',
    label: 'Subcontractor',
    description: 'Limited to assigned work scope',
  },
  {
    value: 'client',
    label: 'Client',
    description: 'Client portal access only',
  },
] as const;

export function InviteTeamMemberModal({ isOpen, onClose, companyId }: InviteTeamMemberModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('field_worker');

  // Use useActionState hook for form submission
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await inviteTeamMember(formData);
      return result;
    },
    null
  );

  // Reset form and close modal on success
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  const handleClose = useCallback(() => {
    setSelectedRole('field_worker');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white border-2 border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#001B51] flex items-center gap-2">
            <div className="h-8 w-1 bg-[#001B51] rounded-full" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Send an invitation to a new team member. They will receive an email with instructions to join your company.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-6 mt-4">
          {/* Success Message */}
          {state?.success && (
            <Alert className="bg-green-50 border-2 border-green-300 text-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="ml-2 font-semibold">
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {state?.error && !state?.fieldErrors && (
            <Alert className="bg-red-50 border-2 border-red-300 text-red-900">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="ml-2 font-semibold">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#001B51]" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              required
              disabled={isPending || state?.success}
              className="border-2 border-gray-300 focus:border-[#001B51] focus:ring-[#001B51] transition-colors"
            />
            {state?.fieldErrors?.email && (
              <p className="text-sm text-red-600 font-medium">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-[#001B51]" />
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              disabled={isPending || state?.success}
              className="border-2 border-gray-300 focus:border-[#001B51] focus:ring-[#001B51] transition-colors"
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600 font-medium">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-900 font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#001B51]" />
              Role
            </Label>
            <Select
              name="role"
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              disabled={isPending || state?.success}
            >
              <SelectTrigger className="border-2 border-gray-300 focus:border-[#001B51] focus:ring-[#001B51]">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.role && (
              <p className="text-sm text-red-600 font-medium">{state.fieldErrors.role[0]}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-[#001B51] p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-[#001B51]" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-gray-900">Role Permissions</h3>
                <div className="mt-2 text-sm text-gray-700">
                  <p className="mb-1">
                    <strong>GC Admin:</strong> Full system access
                  </p>
                  <p className="mb-1">
                    <strong>Project Manager:</strong> Manage projects and teams
                  </p>
                  <p className="mb-1">
                    <strong>Foreman:</strong> Field supervision
                  </p>
                  <p className="mb-1">
                    <strong>Field Worker:</strong> Task execution
                  </p>
                  <p className="mb-1">
                    <strong>Subcontractor:</strong> Limited scope access
                  </p>
                  <p>
                    <strong>Client:</strong> View-only access
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || state?.success}
              className="bg-[#001B51] hover:bg-[#001B51]/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : state?.success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Invitation Sent!
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
