import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// Debug: API route to fetch users from a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  console.log('[GET /api/companies/:companyId/users] Starting request');
  const { companyId } = await params;
  console.log('[GET /api/companies/:companyId/users] Company ID:', companyId);

  try {
    // Get NextAuth session
    const session = await auth();

    if (!session?.user?.id) {
      console.error('[GET /api/companies/:companyId/users] Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[GET /api/companies/:companyId/users] User ID:', session.user.id);

    // Create Supabase client
    const supabase = await createClient();

    // Verify user has access to this company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id, role, status')
      .eq('user_id', session.user.id)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .maybeSingle();

    if (companyError) {
      console.error('[GET /api/companies/:companyId/users] Company user query error:', companyError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!companyUser) {
      console.error('[GET /api/companies/:companyId/users] User not part of company');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('[GET /api/companies/:companyId/users] User role in company:', companyUser.role);

    // Fetch all active users in this company
    const { data: companyUsers, error: usersError } = await supabase
      .from('company_users')
      .select(`
        user_id,
        role,
        user_profiles!company_users_user_profile_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (usersError) {
      console.error('[GET /api/companies/:companyId/users] Users query error:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log('[GET /api/companies/:companyId/users] Found users:', companyUsers?.length || 0);

    // Transform data to include user profiles
    const users = (companyUsers || [])
      .filter((cu) => cu.user_profiles) // Filter out any entries without profiles
      .map((cu) => ({
        id: cu.user_profiles!.id,
        name: cu.user_profiles!.name,
        email: cu.user_profiles!.email,
        avatar_url: cu.user_profiles!.avatar_url,
        role: cu.role,
      }));

    console.log('[GET /api/companies/:companyId/users] Returning users:', users.length);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[GET /api/companies/:companyId/users] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
