'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inviteAdmin, revokeAdminInvitation } from '@/app/actions/owner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserPlus,
  Mail,
  Clock,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  User,
} from 'lucide-react';
import { formatDistanceToNow, format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminInvitation {
  id: string;
  email: string;
  name: string | null;
  invitation_token: string;
  invited_at: string;
  expires_at: string;
  used_at: string | null;
  inviter_name?: string;
}

interface OwnerInvitesClientProps {
  invitations: AdminInvitation[];
}

export function OwnerInvitesClient({ invitations }: OwnerInvitesClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; link?: string } | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    console.log('[OwnerInvitesClient] Submitting invitation:', { email, name });

    const result = await inviteAdmin(email, name || undefined);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.success) {
      setSuccess({
        message: `Invitation sent to ${email}`,
        link: result.invitationLink,
      });
      setEmail('');
      setName('');
      router.refresh();
    }
  };

  const handleRevoke = async (invitationId: string, inviteEmail: string) => {
    setRevokingId(invitationId);
    setError(null);

    console.log('[OwnerInvitesClient] Revoking invitation:', invitationId);

    const result = await revokeAdminInvitation(invitationId);

    setRevokingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Invitation to ${inviteEmail} revoked`);
    router.refresh();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="relative z-10 space-y-6">
      {/* Invite Form Card */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-construction p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
            <UserPlus className="w-5 h-5 text-construction-blue" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Send New Invitation</h2>
            <p className="text-sm text-gray-500">
              Invite a company admin to join GenHub
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert with Link */}
          {success && (
            <Alert className="bg-construction-green/10 border-construction-green/20 text-construction-green">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{success.message}</p>
                  {success.link && (
                    <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
                      <input
                        type="text"
                        value={success.link}
                        readOnly
                        className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(success.link!)}
                        className="h-7 px-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(success.link, '_blank')}
                        className="h-7 px-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-gray-700">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-gray-700">
                Name (Optional)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="bg-construction-blue hover:bg-construction-blue/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Pending Invitations List */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-construction overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-gray-100">
          <h2 className="font-bold text-gray-900">Pending Invitations</h2>
          <p className="text-sm text-gray-500">
            {invitations.length === 0
              ? 'No pending invitations'
              : `${invitations.length} invitation${invitations.length === 1 ? '' : 's'} awaiting response`}
          </p>
        </div>

        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Pending Invitations</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Use the form above to invite new company admins.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invitations.map((invitation) => {
              const isExpired = !isAfter(new Date(invitation.expires_at), new Date());
              const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/admin-invite?token=${invitation.invitation_token}`;

              return (
                <div
                  key={invitation.id}
                  className={cn(
                    'px-5 py-4 hover:bg-gray-50/50 transition-colors',
                    isExpired && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{invitation.email}</span>
                        {isExpired && (
                          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                            EXPIRED
                          </span>
                        )}
                      </div>
                      {invitation.name && (
                        <p className="text-sm text-gray-600">{invitation.name}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sent {formatDistanceToNow(new Date(invitation.invited_at), { addSuffix: true })}
                        </span>
                        <span>
                          Expires {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(inviteLink)}
                        className="h-9 px-3"
                        title="Copy invitation link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(invitation.id, invitation.email)}
                        disabled={revokingId === invitation.id}
                        className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Revoke invitation"
                      >
                        {revokingId === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
