'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { ProjectPhotosRow } from '@/types/db/tables/projects';
import type { PhotoCategory } from '@/types/db/enums';

type ProjectPhoto = ProjectPhotosRow;
type PhotoFilters = {
  category?: PhotoCategory[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: ('upload' | 'task_receipt' | 'expense_receipt')[];
  showReceipts?: boolean;
};

export interface UnifiedPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename: string;
  category: PhotoCategory;
  source: 'upload' | 'task_receipt' | 'expense_receipt';
  source_id?: string;
  source_title?: string;
  uploaded_by: { id: string; name: string; avatar_url?: string };
  created_at: string;
  exif_data?: any;
  is_deletable: boolean;
  is_editable: boolean;
  client_visible?: boolean;
}

// Debug: Helper to get user context (same as project-files.ts)
async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!companyUser) {
    return { error: 'No active company found' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

/**
 * Get project photos with receipt aggregation (REQ-14)
 * Aggregates:
 * - Direct uploads from project_photos table
 * - Task receipts via tasks.receipt_photo_url
 * - Expense receipts via expenses.receipt_url
 */
export async function getProjectPhotosWithReceipts(
  projectId: string,
  filters?: PhotoFilters
) {
  console.log('[getProjectPhotosWithReceipts] Fetching photos for project:', projectId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId, userId } = userContext;

  const photos: UnifiedPhoto[] = [];

  // 1. Fetch direct photo uploads
  // Note: uploaded_by references next_auth.users - can't auto-join
  if (!filters?.source || filters.source.includes('upload')) {
    let query = supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply category filter
    if (filters?.category && filters.category.length > 0) {
      query = query.in('category', filters.category);
    }

    // Apply search filter
    if (filters?.search) {
      query = query.ilike('filename', `%${filters.search}%`);
    }

    // Apply date filters
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data: uploadedPhotos } = await query;

    if (uploadedPhotos) {
      photos.push(
        ...uploadedPhotos.map((photo: any) => ({
          id: photo.id,
          url: photo.photo_url,
          thumbnail_url: photo.thumbnail_url || undefined,
          filename: photo.filename,
          category: photo.category,
          source: 'upload' as const,
          uploaded_by: photo.uploader || {
            id: photo.uploaded_by,
            name: 'Unknown',
          },
          created_at: photo.created_at,
          exif_data: photo.exif_data,
          is_deletable: photo.uploaded_by === userId,
          is_editable: photo.uploaded_by === userId,
          client_visible: photo.client_visible,
        }))
      );
    }
  }

  // 2. Fetch task receipts (if showReceipts enabled)
  if (
    filters?.showReceipts !== false &&
    (!filters?.source || filters.source.includes('task_receipt'))
  ) {
    const { data: taskReceipts } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        receipt_photo_url,
        created_at,
        created_by,
        uploader:created_by (id, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .not('receipt_photo_url', 'is', null);

    if (taskReceipts) {
      photos.push(
        ...taskReceipts.map((task: any) => ({
          id: `task-${task.id}`,
          url: task.receipt_photo_url!,
          thumbnail_url: undefined, // Tasks don't have thumbnails
          filename: `Task Receipt: ${task.title}`,
          category: 'task_receipts' as PhotoCategory,
          source: 'task_receipt' as const,
          source_id: task.id,
          source_title: task.title,
          uploaded_by: task.uploader || {
            id: task.created_by || '',
            name: 'Unknown',
          },
          created_at: task.created_at,
          is_deletable: false, // Cannot delete from gallery
          is_editable: false, // Cannot edit from gallery
        }))
      );
    }
  }

  // 3. Fetch expense receipts (if showReceipts enabled)
  if (
    filters?.showReceipts !== false &&
    (!filters?.source || filters.source.includes('expense_receipt'))
  ) {
    const { data: expenseReceipts } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        amount,
        status,
        receipt_url,
        created_at,
        submitted_by,
        uploader:submitted_by (id, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .not('receipt_url', 'is', null);

    if (expenseReceipts) {
      photos.push(
        ...expenseReceipts.map((expense: any) => ({
          id: `expense-${expense.id}`,
          url: expense.receipt_url!,
          thumbnail_url: undefined, // Expenses don't have thumbnails
          filename: `Expense Receipt: ${expense.description}`,
          category: 'expense_receipts' as PhotoCategory,
          source: 'expense_receipt' as const,
          source_id: expense.id,
          source_title: `${expense.description} ($${expense.amount})`,
          uploaded_by: expense.uploader || {
            id: expense.submitted_by || '',
            name: 'Unknown',
          },
          created_at: expense.created_at,
          is_deletable: false, // Cannot delete from gallery
          is_editable: false, // Cannot edit from gallery
        }))
      );
    }
  }

  // Sort all photos by created_at descending
  photos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  console.log('[getProjectPhotosWithReceipts] Success:', photos.length, 'total photos');
  return { data: photos };
}

/**
 * Set or clear the primary photo for a project
 * Updates projects.image_url column
 */
export async function setProjectPrimaryPhoto(
  projectId: string,
  photoUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  console.log('[setProjectPrimaryPhoto] Setting primary photo for project:', projectId);

  // 1. Validate user is authenticated
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { success: false, error: userContext.error };
  }

  const { supabase, userId, companyId } = userContext;

  // 2. Validate projectId format (basic UUID check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    return { success: false, error: 'Invalid project ID format' };
  }

  // 3. Verify user has access to project (company_id check or project_team membership)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { success: false, error: 'Project not found' };
  }

  // Check company access
  if (project.company_id !== companyId) {
    // Check project_team membership as fallback
    const { data: teamMember } = await supabase
      .from('project_team')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (!teamMember) {
      return { success: false, error: "You don't have permission to edit this project" };
    }
  }

  // 4. Validate photoUrl format if provided
  if (photoUrl !== null) {
    // Basic URL validation
    try {
      new URL(photoUrl);
    } catch {
      return { success: false, error: 'Invalid photo URL format' };
    }

    // Verify the photo exists in project_photos for this project (prevents arbitrary URL injection)
    const { data: existingPhoto, error: photoError } = await supabase
      .from('project_photos')
      .select('id, photo_url')
      .eq('project_id', projectId)
      .eq('photo_url', photoUrl)
      .is('deleted_at', null)
      .single();

    if (photoError || !existingPhoto) {
      return { success: false, error: 'Photo not found or has been deleted' };
    }
  }

  // 5. Update projects.image_url
  const { error: updateError } = await supabase
    .from('projects')
    .update({ image_url: photoUrl, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (updateError) {
    console.error('[setProjectPrimaryPhoto] Error:', updateError);
    return { success: false, error: 'Failed to update cover photo. Please try again.' };
  }

  // 6. Revalidate paths
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath('/app/projects');

  console.log('[setProjectPrimaryPhoto] Success - imageUrl:', photoUrl ? 'set' : 'cleared');
  return { success: true };
}

/**
 * Delete project photo (soft delete)
 */
export async function deleteProjectPhoto(photoId: string) {
  console.log('[deleteProjectPhoto] Deleting photo:', photoId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get photo to verify ownership and log audit
  const { data: photo, error: fetchError } = await supabase
    .from('project_photos')
    .select('*')
    .eq('id', photoId)
    .eq('company_id', companyId)
    .single();

  if (fetchError || !photo) {
    return { error: 'Photo not found or access denied' };
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from('project_photos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', photoId);

  if (deleteError) {
    console.error('[deleteProjectPhoto] Error:', deleteError);
    return { error: deleteError.message };
  }

  // Log audit trail
  await supabase.from('file_audit_log').insert({
    company_id: companyId,
    file_id: photoId,
    file_type: 'photo',
    action: 'delete',
    performed_by: userId,
    previous_state: photo,
    new_state: { ...photo, deleted_at: new Date().toISOString() },
  });

  console.log('[deleteProjectPhoto] Success');
  revalidatePath(`/app/projects/${photo.project_id}`);
  return { success: true };
}
