'use client';

import { useState, useActionState, useEffect, useCallback } from 'react';
import { inviteTeamMember } from '@/app/actions/team';
import { Database } from '@/types/database.types';
import { BaseModal } from '@/components/ui/BaseModal';
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
import { Loader2, Mail, User, Shield, CheckCircle2, XCircle, UserPlus, Copy, Check, Link2, Share2 } from 'lucide-react';

type UserRole = Database['public']['Enums']['user_role'];

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
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
  const [copied, setCopied] = useState(false);

  // Debug: Track modal state
  console.log('[InviteTeamMemberModal] Rendering modal');

  // Use useActionState hook for form submission
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      console.log('[InviteTeamMemberModal] Submitting invitation...');
      const result = await inviteTeamMember(formData);
      console.log('[InviteTeamMemberModal] Invitation result:', result);
      return result;
    },
    null
  );

  // Debug: Don't auto-close on success - let user copy link first
  // Removed auto-close timer to allow user to copy the invite link

  const handleClose = useCallback(() => {
    console.log('[InviteTeamMemberModal] Closing modal');
    setSelectedRole('field_worker');
    setCopied(false);
    onClose();
  }, [onClose]);

  // Debug: Copy invitation link to clipboard
  const handleCopyLink = useCallback(async () => {
    if (state?.invitationLink) {
      try {
        await navigator.clipboard.writeText(state.invitationLink);
        setCopied(true);
        console.log('[InviteTeamMemberModal] Link copied to clipboard');
        // Reset copied state after 3 seconds
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('[InviteTeamMemberModal] Failed to copy link:', err);
      }
    }
  }, [state?.invitationLink]);

  // Debug: Share link using Web Share API (if available)
  const handleShareLink = useCallback(async () => {
    if (state?.invitationLink && navigator.share) {
      try {
        await navigator.share({
          title: 'Team Invitation - GenHub',
          text: 'You have been invited to join our team on GenHub!',
          url: state.invitationLink,
        });
        console.log('[InviteTeamMemberModal] Link shared successfully');
      } catch (err) {
        // User cancelled or share failed
        console.log('[InviteTeamMemberModal] Share cancelled or failed:', err);
      }
    }
  }, [state?.invitationLink]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={UserPlus}
      title="Invite Team Member"
      subtitle="Send an invitation to a new team member. They will receive an email with instructions to join your company."
      maxWidth="2xl"
      showFooter={false}
    >
      <form action={formAction} className="space-y-6">
          {/* Success Message with Shareable Link */}
          {state?.success && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-2 border-green-300 text-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="ml-2 font-semibold">
                  {state.message}
                </AlertDescription>
              </Alert>

              {/* Invitation Link Box */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-construction-blue" />
                  <span className="font-semibold text-gray-900">Invitation Link</span>
                  {!state.emailSent && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      Email not sent - share manually
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600">
                  Share this link with your team member to complete their registration:
                </p>

                {/* Link Display and Copy */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border-2 border-gray-300 rounded-md px-3 py-2 text-sm font-mono text-gray-700 truncate">
                    {state.invitationLink}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className={`shrink-0 border-2 transition-all duration-200 ${
                      copied
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-construction-blue hover:bg-construction-blue/5'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  {/* Share button - only show if Web Share API is available */}
                  {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShareLink}
                      className="shrink-0 border-2 border-gray-300 hover:border-construction-blue hover:bg-construction-blue/5"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  This link expires in 7 days for security reasons.
                </p>
              </div>
            </div>
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
                    <strong>Admin:</strong> Full system access
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

          <div className="flex justify-end gap-3 pt-4">
            {state?.success ? (
              <>
                {/* After success: Show invite another and done buttons */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Reset state to invite another member
                    window.location.reload();
                  }}
                  className="border-2 border-gray-300 hover:bg-gray-50"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Another
                </Button>
                <Button
                  type="button"
                  onClick={handleClose}
                  className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </>
            ) : (
              <>
                {/* Before success: Show cancel and submit buttons */}
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
                  disabled={isPending}
                  className="bg-construction-blue hover:bg-construction-blue/90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
    </BaseModal>
  );
}
