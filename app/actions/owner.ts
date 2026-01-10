'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type Owner = Database['public']['Tables']['owners']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type AdminInvitation = Database['public']['Tables']['admin_invitations']['Row'];
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type CompanyUser = Database['public']['Tables']['company_users']['Row'];

// ============================================
// Validation Schemas
// ============================================

const inviteAdminSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase().trim()),
  name: z.string().min(1, 'Name is required').max(200).transform((v) => v.trim()).optional(),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Get owner context - returns owner info if user is an owner
 */
async function getOwnerContext() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Use admin client to check owners table (bypasses RLS)
  const supabase = await createAdminClient();

  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (ownerError || !owner) {
    return { error: 'Not authorized as owner' };
  }

  return {
    userId: session.user.id,
    owner,
    supabase,
  };
}

// ============================================
// Server Actions
// ============================================

/**
 * Check if current user is an owner
 */
export async function isOwner(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const supabase = await createAdminClient();
  const { data: owner } = await supabase
    .from('owners')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  return !!owner;
}

/**
 * Get all companies (owner only)
 */
export async function getAllCompanies(): Promise<{
  data?: (Company & { user_count: number; project_count: number })[];
  error?: string;
}> {
  const ctx = await getOwnerContext();
  if ('error' in ctx) {
    return { error: ctx.error };
  }

  const { supabase } = ctx;

  // Get all companies with user and project counts
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_users!company_users_company_id_fkey(count),
      projects!projects_company_id_fkey(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllCompanies] Error:', error);
    return { error: 'Failed to fetch companies' };
  }

  // Transform the count objects
  const companiesWithCounts = companies?.map((company: any) => ({
    ...company,
    user_count: company.company_users?.[0]?.count || 0,
    project_count: company.projects?.[0]?.count || 0,
    company_users: undefined,
    projects: undefined,
  })) || [];

  return { data: companiesWithCounts };
}

/**
 * Get all users across all companies (owner only)
 */
export async function getAllUsers(): Promise<{
  data?: (UserProfile & {
    company_name?: string;
    role?: string;
    status?: string;
  })[];
  error?: string;
}> {
  const ctx = await getOwnerContext();
  if ('error' in ctx) {
    return { error: ctx.error };
  }

  const { supabase } = ctx;

  // Get all users with their company info
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      company_users!company_users_user_profile_fkey(
        role,
        status,
        companies!company_users_company_id_fkey(name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllUsers] Error:', error);
    return { error: 'Failed to fetch users' };
  }

  // Transform the data
  const usersWithCompanies = users?.map((user: any) => {
    const companyUser = user.company_users?.[0];
    return {
      ...user,
      company_name: companyUser?.companies?.name || null,
      role: companyUser?.role || null,
      status: companyUser?.status || null,
      company_users: undefined,
    };
  }) || [];

  return { data: usersWithCompanies };
}

/**
 * Send admin invitation (owner only)
 * Creates an invitation that allows a new user to sign up and create their own company
 */
export async function inviteAdmin(
  email: string,
  name?: string
): Promise<{
  success: boolean;
  invitationLink?: string;
  error?: string;
}> {
  const ctx = await getOwnerContext();
  if ('error' in ctx) {
    return { success: false, error: ctx.error };
  }

  const { owner, supabase } = ctx;

  // Validate input
  const validated = inviteAdminSchema.safeParse({ email, name });
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || 'Invalid input'
    };
  }

  const { email: validatedEmail, name: validatedName } = validated.data;

  // Check if email already has an active invitation
  const { data: existingInvite } = await supabase
    .from('admin_invitations')
    .select('id, expires_at, used_at')
    .eq('email', validatedEmail)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return {
      success: false,
      error: 'An active invitation already exists for this email',
    };
  }

  // Check if email already has an account
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', validatedEmail)
    .maybeSingle();

  if (existingUser) {
    return {
      success: false,
      error: 'A user with this email already exists',
    };
  }

  // Create the invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('admin_invitations')
    .insert({
      email: validatedEmail,
      name: validatedName,
      invited_by: owner.id,
    })
    .select()
    .single();

  if (inviteError || !invitation) {
    console.error('[inviteAdmin] Error creating invitation:', inviteError);
    return { success: false, error: 'Failed to create invitation' };
  }

  // Generate invitation link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const invitationLink = `${baseUrl}/admin-invite?token=${invitation.invitation_token}`;

  console.log('[inviteAdmin] Invitation created:', {
    email: validatedEmail,
    token: invitation.invitation_token,
    link: invitationLink,
  });

  revalidatePath('/app/owner/invites');

  return {
    success: true,
    invitationLink,
  };
}

/**
 * Get pending admin invitations (owner only)
 */
export async function getPendingAdminInvitations(): Promise<{
  data?: (AdminInvitation & { inviter_name?: string })[];
  error?: string;
}> {
  const ctx = await getOwnerContext();
  if ('error' in ctx) {
    return { error: ctx.error };
  }

  const { supabase } = ctx;

  const { data: invitations, error } = await supabase
    .from('admin_invitations')
    .select(`
      *,
      owners!admin_invitations_invited_by_fkey(name)
    `)
    .is('used_at', null)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('[getPendingAdminInvitations] Error:', error);
    return { error: 'Failed to fetch invitations' };
  }

  const invitationsWithInviterName = invitations?.map((inv: any) => ({
    ...inv,
    inviter_name: inv.owners?.name || 'Unknown',
    owners: undefined,
  })) || [];

  return { data: invitationsWithInviterName };
}

/**
 * Revoke admin invitation (owner only)
 */
export async function revokeAdminInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getOwnerContext();
  if ('error' in ctx) {
    return { success: false, error: ctx.error };
  }

  const { supabase } = ctx;

  // Verify invitation exists and is not used
  const { data: invitation, error: fetchError } = await supabase
    .from('admin_invitations')
    .select('id, used_at')
    .eq('id', invitationId)
    .single();

  if (fetchError || !invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invitation.used_at) {
    return { success: false, error: 'Cannot revoke a used invitation' };
  }

  // Delete the invitation
  const { error: deleteError } = await supabase
    .from('admin_invitations')
    .delete()
    .eq('id', invitationId);

  if (deleteError) {
    console.error('[revokeAdminInvitation] Error:', deleteError);
    return { success: false, error: 'Failed to revoke invitation' };
  }

  revalidatePath('/app/owner/invites');

  return { success: true };
}

/**
 * Get owner dashboard stats
 */
export async function getOwnerDashboardStats(): Promise<{
  data?: {
    totalCompanies: number;
    totalUsers: number;
    totalProjects: number;
    pendingInvitations: number;
  };
  error?: string;
}> {
  const ctx = await getOwnerContext();
  if ('error' in ctx) {
    return { error: ctx.error };
  }

  const { supabase } = ctx;

  // Get counts in parallel
  const [companiesResult, usersResult, projectsResult, invitesResult] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase
      .from('admin_invitations')
      .select('id', { count: 'exact', head: true })
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString()),
  ]);

  return {
    data: {
      totalCompanies: companiesResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalProjects: projectsResult.count || 0,
      pendingInvitations: invitesResult.count || 0,
    },
  };
}
