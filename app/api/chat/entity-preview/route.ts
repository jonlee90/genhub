import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// Debug: API route for fetching entity preview data
// GET /api/chat/entity-preview?type=project&id=uuid
export async function GET(request: NextRequest) {
  console.log('[API entity-preview] Fetching entity preview data');

  try {
    // Get auth session
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[API entity-preview] No authenticated user');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('type');
    const entityId = searchParams.get('id');

    console.log('[API entity-preview] Type:', entityType, 'ID:', entityId);

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing type or id parameter' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (companyError || !companyUser) {
      console.error('[API entity-preview] No active company found:', companyError);
      return NextResponse.json({ error: 'No active company found' }, { status: 403 });
    }

    const companyId = companyUser.company_id;
    console.log('[API entity-preview] Company ID:', companyId);

    // Fetch entity data based on type
    let entityData = null;

    switch (entityType) {
      case 'project': {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, status, health_score, completion_percentage')
          .eq('id', entityId)
          .eq('company_id', companyId)
          .single();

        if (error) {
          console.error('[API entity-preview] Error fetching project:', error);
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        entityData = data;
        break;
      }

      case 'task': {
        // Join with projects to ensure user has access via company
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            status,
            priority,
            due_date,
            assignee:user_profiles!tasks_assignee_id_fkey (
              id,
              name,
              avatar_url
            ),
            projects!inner (company_id)
          `)
          .eq('id', entityId)
          .eq('projects.company_id', companyId)
          .single();

        if (error) {
          console.error('[API entity-preview] Error fetching task:', error);
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Remove the joined projects field
        const { projects, ...taskData } = data as any;
        entityData = taskData;
        break;
      }

      case 'material': {
        const { data, error } = await supabase
          .from('materials')
          .select('id, product_name, unit_price, stock_status, product_image_url')
          .eq('id', entityId)
          .eq('company_id', companyId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('[API entity-preview] Error fetching material:', error);
          return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        entityData = data;
        break;
      }

      case 'expense': {
        const { data, error } = await supabase
          .from('expenses')
          .select('id, description, amount, status, vendor_name')
          .eq('id', entityId)
          .eq('company_id', companyId)
          .single();

        if (error) {
          console.error('[API entity-preview] Error fetching expense:', error);
          return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        entityData = data;
        break;
      }

      case 'user': {
        // For user previews, check if the user is in the same company
        const { data, error } = await supabase
          .from('user_profiles')
          .select(`
            id,
            name,
            email,
            avatar_url,
            company_users!inner (
              company_id,
              role,
              status
            )
          `)
          .eq('id', entityId)
          .eq('company_users.company_id', companyId)
          .eq('company_users.status', 'active')
          .single();

        if (error) {
          console.error('[API entity-preview] Error fetching user:', error);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Extract role from company_users
        const companyUsers = (data as any).company_users;
        const role = Array.isArray(companyUsers) ? companyUsers[0]?.role : companyUsers?.role;

        entityData = {
          id: data.id,
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url,
          role: role || 'member',
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    console.log('[API entity-preview] Entity data fetched successfully');

    return NextResponse.json(entityData, { status: 200 });
  } catch (error: any) {
    console.error('[API entity-preview] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
