'use server';

import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

// ============================================
// Validation Schemas
// ============================================

const validateTokenSchema = z.object({
  token: z.string().uuid('Invalid invitation token format'),
});

const acceptInviteSchema = z.object({
  token: z.string().uuid('Invalid invitation token format'),
});

// ============================================
// Types
// ============================================

export type InvitationData = {
  email: string;
  name: string;
  role: string;
  companyName: string;
  companyId: string;
  invitationId: string;
  expiresAt: string;
  usedAt: string | null;
};

export type ValidateTokenResult =
  | { success: true; invitation: InvitationData }
  | { success: false; error: string };

export type AcceptInviteResult =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ============================================
// Server Actions
// ============================================

/**
 * Validate an invitation token and return invitation details
 * This runs on the server to check if the token is valid
 *
 * SECURITY FIXES APPLIED:
 * - Checks token expiration (7 days)
 * - Checks if token already used
 * - Uses admin client (no user session yet)
 *
 * @param token - UUID invitation token
 * @returns Invitation data or error
 */
export async function validateInvitationToken(token: string): Promise<ValidateTokenResult> {
  try {
    // Validate token format
    const validation = validateTokenSchema.safeParse({ token });
    if (!validation.success) {
      return { success: false, error: 'Invalid invitation token format' };
    }

    // Use admin client to bypass RLS (invitation not yet associated with authenticated user)
    const supabase = createAdminClient();

    // Find team_invitations entry with this token
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        company_id,
        email,
        name,
        role,
        invitation_token,
        expires_at,
        used_at
      `)
      .eq('invitation_token', token)
      .maybeSingle();

    if (invitationError || !invitation) {
      console.error('Error fetching invitation:', invitationError);
      return { success: false, error: 'Invalid invitation token' };
    }

    // Check if token has expired
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return {
        success: false,
        error: 'This invitation has expired. Please request a new invitation from your administrator.'
      };
    }

    // Check if token has already been used
    if (invitation.used_at !== null) {
      return {
        success: false,
        error: 'This invitation has already been used. If you need access, please contact your administrator.'
      };
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', invitation.company_id)
      .single();

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return { success: false, error: 'Company not found' };
    }

    // Return invitation data
    const invitationData: InvitationData = {
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      companyName: company.name,
      companyId: company.id,
      invitationId: invitation.id,
      expiresAt: invitation.expires_at,
      usedAt: invitation.used_at,
    };

    return { success: true, invitation: invitationData };

  } catch (error) {
    console.error('Unexpected error validating invitation token:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Accept a team invitation by creating company_users entry with REAL user ID
 * This should be called AFTER the user has authenticated via NextAuth
 *
 * SECURITY FIXES APPLIED:
 * - Verifies authenticated user email matches invitation email
 * - Atomic single-use token check with UPDATE ... WHERE used_at IS NULL
 * - Links REAL user ID (from next-auth) to company, not placeholder
 * - Checks token expiration
 *
 * @param token - Invitation token UUID
 * @returns Success or error message
 */
export async function acceptInvitation(token: string): Promise<AcceptInviteResult> {
  try {
    // Validate token format
    const validation = acceptInviteSchema.safeParse({ token });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: errors
      };
    }

    // Get authenticated user session
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return {
        success: false,
        error: 'You must be signed in to accept an invitation. Please sign in and try again.'
      };
    }

    const authenticatedUserId = session.user.id;
    const authenticatedEmail = session.user.email.toLowerCase();

    // Validate the invitation token
    const tokenValidation = await validateInvitationToken(token);
    if (!tokenValidation.success) {
      return { success: false, error: tokenValidation.error };
    }

    const invitation = tokenValidation.invitation;

    // CRITICAL: Verify that authenticated user's email matches invitation email
    if (invitation.email.toLowerCase() !== authenticatedEmail) {
      return {
        success: false,
        error: 'This invitation is for a different email address. Please sign out and sign in with the invited email address.'
      };
    }

    // Use admin client for atomic operations
    const supabase = createAdminClient();

    // ATOMIC OPERATION: Mark invitation as used AND check it wasn't already used
    // This prevents replay attacks
    const { data: markedInvitation, error: markError } = await supabase
      .from('team_invitations')
      .update({
        used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.invitationId)
      .eq('invitation_token', token)
      .is('used_at', null) // CRITICAL: Only update if not already used
      .gt('expires_at', new Date().toISOString()) // CRITICAL: Only if not expired
      .select()
      .maybeSingle();

    if (markError || !markedInvitation) {
      console.error('Error marking invitation as used:', markError);
      return {
        success: false,
        error: 'This invitation has already been used or has expired. Please contact your administrator.'
      };
    }

    // Check if user is already a member of this company
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('company_users')
      .select('id, status, role')
      .eq('company_id', invitation.companyId)
      .eq('user_id', authenticatedUserId)
      .maybeSingle();

    if (memberCheckError) {
      console.error('Error checking existing membership:', memberCheckError);
      return { success: false, error: 'Failed to verify membership. Please try again.' };
    }

    if (existingMember) {
      if (existingMember.status === 'active') {
        return { success: false, error: 'You are already an active member of this company.' };
      }

      // User exists but is inactive - reactivate them
      const { error: reactivateError } = await supabase
        .from('company_users')
        .update({
          status: 'active',
          role: invitation.role as UserRole,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMember.id);

      if (reactivateError) {
        console.error('Error reactivating member:', reactivateError);
        return { success: false, error: 'Failed to activate account. Please try again.' };
      }
    } else {
      // Create new company_users entry with REAL user ID from next-auth
      const { error: createError } = await supabase
        .from('company_users')
        .insert({
          company_id: invitation.companyId,
          user_id: authenticatedUserId, // REAL user ID from next-auth session
          role: invitation.role as UserRole,
          status: 'active',
          activated_at: new Date().toISOString(),
          invited_by: null, // Could fetch from team_invitations if needed
          invited_at: null,
        });

      if (createError) {
        console.error('Error creating company user:', createError);

        // Rollback: Mark invitation as unused if company_users creation fails
        await supabase
          .from('team_invitations')
          .update({ used_at: null })
          .eq('id', invitation.invitationId);

        return { success: false, error: 'Failed to activate account. Please try again.' };
      }
    }

    // Create welcome notification
    await supabase.from('notifications').insert({
      user_id: authenticatedUserId,
      type: 'team_invited',
      title: 'Welcome to GenHub!',
      message: `You've successfully joined ${invitation.companyName}`,
      link: '/app',
    });

    return {
      success: true,
      message: 'Invitation accepted successfully! Redirecting to dashboard...',
    };

  } catch (error) {
    console.error('Unexpected error accepting invitation:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
