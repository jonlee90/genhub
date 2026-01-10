'use server';

import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type AdminInvitation = Database['public']['Tables']['admin_invitations']['Row'];

// ============================================
// Types
// ============================================

export interface AdminInvitationData {
  id: string;
  email: string;
  name: string | null;
  inviter_name: string;
  expires_at: string;
}

export interface ValidateAdminInvitationResult {
  valid: boolean;
  invitation?: AdminInvitationData;
  error?: string;
}

export interface AcceptAdminInvitationResult {
  success: boolean;
  companyId?: string;
  error?: string;
}

// ============================================
// Validation Schemas
// ============================================

const companyDataSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200).transform((v) => v.trim()),
  address: z.string().max(500).optional().transform((v) => v?.trim()),
  phone: z.string().max(50).optional().transform((v) => v?.trim()),
  email: z.string().email('Invalid email').optional().transform((v) => v?.toLowerCase().trim()),
});

const userDataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).transform((v) => v.trim()),
});

// ============================================
// Server Actions
// ============================================

/**
 * Validate admin invitation token
 * Called on the /admin-invite page to check if token is valid
 */
export async function validateAdminInvitationToken(
  token: string
): Promise<ValidateAdminInvitationResult> {
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  const supabase = await createAdminClient();

  // Fetch invitation with inviter info
  const { data: invitation, error } = await supabase
    .from('admin_invitations')
    .select(`
      *,
      owners!admin_invitations_invited_by_fkey(name)
    `)
    .eq('invitation_token', token)
    .maybeSingle();

  if (error || !invitation) {
    console.error('[validateAdminInvitationToken] Error or not found:', error);
    return { valid: false, error: 'Invalid invitation token' };
  }

  // Check if already used
  if (invitation.used_at) {
    return { valid: false, error: 'This invitation has already been used' };
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: 'This invitation has expired' };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      inviter_name: (invitation as any).owners?.name || 'Platform Owner',
      expires_at: invitation.expires_at,
    },
  };
}

/**
 * Accept admin invitation
 * Creates a new user profile, company, and company_users entry
 * Called after user signs in via NextAuth
 */
export async function acceptAdminInvitation(
  token: string,
  userData: { name: string },
  companyData: { name: string; address?: string; phone?: string; email?: string }
): Promise<AcceptAdminInvitationResult> {
  // Get authenticated session
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return { success: false, error: 'You must be signed in to accept this invitation' };
  }

  const supabase = await createAdminClient();

  // Validate user data
  const userValidated = userDataSchema.safeParse(userData);
  if (!userValidated.success) {
    return {
      success: false,
      error: userValidated.error.issues[0]?.message || 'Invalid user data',
    };
  }

  // Validate company data
  const companyValidated = companyDataSchema.safeParse(companyData);
  if (!companyValidated.success) {
    return {
      success: false,
      error: companyValidated.error.issues[0]?.message || 'Invalid company data',
    };
  }

  // Fetch and validate invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('admin_invitations')
    .select('*')
    .eq('invitation_token', token)
    .maybeSingle();

  if (fetchError || !invitation) {
    return { success: false, error: 'Invalid invitation token' };
  }

  if (invitation.used_at) {
    return { success: false, error: 'This invitation has already been used' };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: 'This invitation has expired' };
  }

  // Verify email matches
  if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return {
      success: false,
      error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
    };
  }

  // Check if user already has a company
  const { data: existingCompanyUser } = await supabase
    .from('company_users')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingCompanyUser) {
    return {
      success: false,
      error: 'You already belong to a company. Contact support if you need to join a different company.',
    };
  }

  try {
    // Start transaction-like operations
    // 1. Create user profile (if doesn't exist)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: session.user.id,
        email: session.user.email,
        name: userValidated.data.name,
        avatar_url: session.user.image || null,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[acceptAdminInvitation] Profile error:', profileError);
      return { success: false, error: 'Failed to create user profile' };
    }

    // 2. Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyValidated.data.name,
        address: companyValidated.data.address || null,
        phone: companyValidated.data.phone || null,
        email: companyValidated.data.email || session.user.email,
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error('[acceptAdminInvitation] Company error:', companyError);
      return { success: false, error: 'Failed to create company' };
    }

    // 3. Create company_users entry with admin role
    const { error: companyUserError } = await supabase
      .from('company_users')
      .insert({
        company_id: company.id,
        user_id: session.user.id,
        role: 'admin',
        status: 'active',
        activated_at: new Date().toISOString(),
      });

    if (companyUserError) {
      console.error('[acceptAdminInvitation] Company user error:', companyUserError);
      // Try to cleanup company
      await supabase.from('companies').delete().eq('id', company.id);
      return { success: false, error: 'Failed to assign admin role' };
    }

    // 4. Mark invitation as used (atomic update)
    const { error: updateError } = await supabase
      .from('admin_invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invitation.id)
      .is('used_at', null); // Only update if not already used

    if (updateError) {
      console.error('[acceptAdminInvitation] Update invitation error:', updateError);
      // Don't fail the whole operation for this
    }

    console.log('[acceptAdminInvitation] Success:', {
      userId: session.user.id,
      companyId: company.id,
      invitationId: invitation.id,
    });

    return { success: true, companyId: company.id };
  } catch (error) {
    console.error('[acceptAdminInvitation] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
