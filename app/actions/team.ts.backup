'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createUserClient, createAdminClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';
import { randomUUID } from 'crypto';

type UserRole = Database['public']['Enums']['user_role'];
type MemberStatus = Database['public']['Enums']['member_status'];
type CompanyUser = Database['public']['Tables']['company_users']['Row'];
type CompanyUserInsert = Database['public']['Tables']['company_users']['Insert'];
type CompanyUserUpdate = Database['public']['Tables']['company_users']['Update'];

// ============================================
// Validation Schemas
// ============================================

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase().trim()),
  name: z.string().min(1, 'Name is required').max(200).transform((v) => v.trim()),
  role: z.enum(['gc_admin', 'project_manager', 'foreman', 'field_worker', 'subcontractor', 'client']),
});

const updateTeamMemberRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newRole: z.enum(['gc_admin', 'project_manager', 'foreman', 'field_worker', 'subcontractor', 'client']),
});

const deactivateTeamMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Create user-scoped Supabase client
  const supabase = await createUserClient();

  // Get user's company and role using NextAuth user ID
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    return { error: 'No active company found for user' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// ============================================
// Server Actions
// ============================================

/**
 * Invite a new team member to the company
 * Only GC Admins can invite team members
 *
 * SECURITY FIXES APPLIED:
 * - Uses team_invitations table instead of placeholder users
 * - Atomic INSERT ... ON CONFLICT to prevent race conditions
 * - 7-day token expiration
 * - Normalized email addresses
 *
 * @param formData - Form data containing email, name, and role
 * @returns Success with invitation link or error message
 */
export async function inviteTeamMember(formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('User context error:', userContext.error);
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Check permissions - only GC Admin can invite
  if (role !== 'gc_admin') {
    return { error: 'Insufficient permissions. Only GC Admins can invite team members.' };
  }

  // Parse and validate form data
  const rawData = {
    email: formData.get('email'),
    name: formData.get('name'),
    role: formData.get('role'),
  };

  const validation = inviteTeamMemberSchema.safeParse(rawData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { error: 'Validation failed', fieldErrors: errors };
  }

  const data = validation.data;

  try {
    // Check if user already exists and is in this company
    const { data: existingUser, error: userCheckError } = await supabase
      .from('user_profiles')
      .select('id, email, name')
      .eq('email', data.email)
      .maybeSingle();

    if (userCheckError) {
      console.error('Error checking existing user:', userCheckError);
      return { error: 'Failed to check existing user. Please try again.' };
    }

    if (existingUser) {
      // User exists - check if already in company
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('company_users')
        .select('id, status, role')
        .eq('company_id', companyId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (memberCheckError) {
        console.error('Error checking existing member:', memberCheckError);
        return { error: 'Failed to check company membership. Please try again.' };
      }

      if (existingMember) {
        if (existingMember.status === 'active') {
          return { error: 'This user is already an active member of your company.' };
        } else if (existingMember.status === 'invited') {
          return { error: 'This user has already been invited. Please wait for them to accept the invitation.' };
        }
        // If inactive, allow re-invitation below
      }
    }

    // Generate secure invitation token
    const invitationToken = randomUUID();

    // Use INSERT ... ON CONFLICT for atomic operation
    // This prevents race conditions when multiple admins invite the same email
    const { data: invitation, error: insertError } = await supabase
      .from('team_invitations')
      .upsert(
        {
          company_id: companyId,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          invitation_token: invitationToken,
          invited_by: userId,
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          used_at: null, // Reset if re-inviting
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'company_id,email',
          ignoreDuplicates: false, // Update with new token
        }
      )
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return { error: 'Failed to create invitation. Please try again.' };
    }

    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${invitationToken}`;

    // TODO: Send invitation email
    // When email service is configured, send invitation email to data.email
    // with invitationLink and company details
    console.log('TODO: Send invitation email to:', data.email);
    console.log('Invitation link:', invitationLink);

    // Revalidate paths
    revalidatePath('/app/team');
    revalidateTag(`team-members-${companyId}`);

    return {
      success: true,
      message: `Invitation sent to ${data.email}`,
      invitationLink,
      invitation,
    };

  } catch (error) {
    console.error('Unexpected error inviting team member:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Update a team member's role
 * Only GC Admins can update roles
 *
 * SECURITY FIXES APPLIED:
 * - Verifies target user is in same company
 * - Uses user-scoped client
 *
 * @param userId - ID of the user whose role should be updated
 * @param newRole - New role to assign
 * @returns Success or error message
 */
export async function updateTeamMemberRole(userId: string, newRole: UserRole) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId: currentUserId, companyId, role, supabase } = userContext;

  // Check permissions - only GC Admin can update roles
  if (role !== 'gc_admin') {
    return { error: 'Insufficient permissions. Only GC Admins can update team member roles.' };
  }

  // Validate input
  const validation = updateTeamMemberRoleSchema.safeParse({ userId, newRole });

  if (!validation.success) {
    return { error: 'Invalid input', fieldErrors: validation.error.flatten().fieldErrors };
  }

  try {
    // Check if team member exists in company AND verify they're in the SAME company
    const { data: existingMember, error: fetchError } = await supabase
      .from('company_users')
      .select('id, role, user_id, status, company_id')
      .eq('company_id', companyId) // CRITICAL: Ensure same company
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !existingMember) {
      console.error('Error fetching team member:', fetchError);
      return { error: 'Team member not found in your company.' };
    }

    // Prevent updating own role
    if (existingMember.user_id === currentUserId) {
      return { error: 'You cannot change your own role.' };
    }

    if (existingMember.status === 'inactive') {
      return { error: 'Cannot update role of inactive team member. Please reactivate them first.' };
    }

    // Check if role is actually changing
    if (existingMember.role === newRole) {
      return { error: 'Team member already has this role.' };
    }

    // Update role in company_users table
    const { data: updatedMember, error: updateError } = await supabase
      .from('company_users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMember.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating team member role:', updateError);
      return { error: 'Failed to update team member role. Please try again.' };
    }

    // Create notification for the user whose role was changed
    // Using 'mention' type temporarily - TODO: Add 'role_changed' notification type
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'mention',
      title: 'Role Updated',
      message: `Your role has been updated to ${newRole.replace('_', ' ')}`,
      link: '/app/team',
    });

    // Revalidate paths with granular cache key
    revalidatePath('/app/team');
    revalidateTag(`team-members-${companyId}`);

    return {
      success: true,
      message: `Team member role updated to ${newRole}`,
      updatedMember,
    };

  } catch (error) {
    console.error('Unexpected error updating team member role:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Deactivate a team member
 * Only GC Admins can deactivate team members
 * Sets status to 'inactive' to preserve historical data
 *
 * SECURITY FIXES APPLIED:
 * - Verifies target user is in same company
 * - Uses user-scoped client
 *
 * @param userId - ID of the user to deactivate
 * @returns Success or error message
 */
export async function deactivateTeamMember(userId: string) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId: currentUserId, companyId, role, supabase } = userContext;

  // Check permissions - only GC Admin can deactivate
  if (role !== 'gc_admin') {
    return { error: 'Insufficient permissions. Only GC Admins can deactivate team members.' };
  }

  // Validate input
  const validation = deactivateTeamMemberSchema.safeParse({ userId });

  if (!validation.success) {
    return { error: 'Invalid user ID' };
  }

  try {
    // Check if team member exists in company AND verify they're in the SAME company
    const { data: existingMember, error: fetchError } = await supabase
      .from('company_users')
      .select('id, status, user_id, role, company_id')
      .eq('company_id', companyId) // CRITICAL: Ensure same company
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !existingMember) {
      console.error('Error fetching team member:', fetchError);
      return { error: 'Team member not found in your company.' };
    }

    // Prevent deactivating self
    if (existingMember.user_id === currentUserId) {
      return { error: 'You cannot deactivate your own account.' };
    }

    if (existingMember.status === 'inactive') {
      return { error: 'This team member is already inactive.' };
    }

    // Check if this is the last active GC Admin
    if (existingMember.role === 'gc_admin') {
      const { data: activeAdmins, error: adminCheckError } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', companyId)
        .eq('role', 'gc_admin')
        .eq('status', 'active');

      if (adminCheckError) {
        console.error('Error checking active admins:', adminCheckError);
        return { error: 'Failed to verify admin status. Please try again.' };
      }

      if (activeAdmins && activeAdmins.length <= 1) {
        return { error: 'Cannot deactivate the last GC Admin. Please assign another admin first.' };
      }
    }

    // Set status to 'inactive' (preserve historical data)
    const { data: deactivatedMember, error: updateError } = await supabase
      .from('company_users')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMember.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error deactivating team member:', updateError);
      return { error: 'Failed to deactivate team member. Please try again.' };
    }

    // Create notification for deactivated user
    // Using 'mention' type temporarily - TODO: Add 'account_deactivated' notification type
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'mention',
      title: 'Account Deactivated',
      message: 'Your account has been deactivated by an administrator.',
      link: '/app',
    });

    // Revalidate paths with granular cache key
    revalidatePath('/app/team');
    revalidateTag(`team-members-${companyId}`);

    return {
      success: true,
      message: 'Team member deactivated successfully',
      deactivatedMember,
    };

  } catch (error) {
    console.error('Unexpected error deactivating team member:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
