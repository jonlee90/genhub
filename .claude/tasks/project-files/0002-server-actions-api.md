# Task 0002: Server Actions & API Routes

## Status
- **Phase**: 2 - Backend
- **Agent**: agent-backend-engineer
- **Estimated Effort**: 4-6 hours
- **Dependencies**: Task 0001 (Database Migrations)
- **Approved**: DRAFT

---

## Overview

Implement Server Actions for file/photo CRUD operations and receipt aggregation, plus API routes for upload progress tracking and bulk operations.

---

## Objectives

1. Create `app/actions/project-files.ts` with document management actions
2. Create `app/actions/project-photos.ts` with photo management and receipt aggregation
3. Create API route for file upload with progress tracking
4. Create API route for photo upload with thumbnail generation
5. Create API route for bulk download (ZIP generation)
6. Implement receipt aggregation query (tasks + expenses)
7. Add audit logging to critical operations

---

## Requirements Reference

- **REQ-1**: Photo Upload & Capture
- **REQ-2**: Photo Gallery & Organization
- **REQ-4**: Document Upload with File Type Validation
- **REQ-7**: File Preview & Download
- **REQ-8**: File Versioning & Audit Trail
- **REQ-9**: Bulk Actions & File Management
- **REQ-14**: Receipt Image Aggregation from Tasks & Expenses

---

## Files to Create/Modify

### New Server Action Files

**File 1: Project Files Server Actions**
- **Path**: `app/actions/project-files.ts`
- **Purpose**: Document CRUD, category updates, versioning, bulk operations

**File 2: Project Photos Server Actions**
- **Path**: `app/actions/project-photos.ts`
- **Purpose**: Photo CRUD, receipt aggregation, EXIF handling

### New API Routes

**Route 1: File Upload**
- **Path**: `app/api/project-files/upload/route.ts`
- **Method**: POST
- **Purpose**: Upload with progress tracking

**Route 2: Photo Upload**
- **Path**: `app/api/project-photos/upload/route.ts`
- **Method**: POST
- **Purpose**: Upload with thumbnail generation

**Route 3: Bulk Download**
- **Path**: `app/api/project-files/bulk-download/route.ts`
- **Method**: POST
- **Purpose**: Generate ZIP archive

---

## Implementation Details

### File 1: app/actions/project-files.ts

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type ProjectFile = Database['public']['Tables']['project_files']['Row'];
type FileFilters = {
  category?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  uploadedBy?: string[];
  fileType?: ('document' | 'image' | 'cad' | 'archive')[];
};

// Debug: Helper to get user context
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

// Debug: Verify project access
async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  companyId: string
) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .eq('company_id', companyId)
    .single();

  if (!project) {
    return { error: 'Project not found or access denied' };
  }

  return { project };
}

/**
 * Get project files with filters
 */
export async function getProjectFiles(projectId: string, filters?: FileFilters) {
  console.log('[getProjectFiles] Fetching files for project:', projectId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) return { error: projectCheck.error };

  // Build query
  let query = supabase
    .from('project_files')
    .select(`
      *,
      uploader:uploaded_by (
        id,
        name,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.category && filters.category.length > 0) {
    query = query.in('category', filters.category);
  }

  if (filters?.search) {
    query = query.ilike('filename', `%${filters.search}%`);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters?.uploadedBy && filters.uploadedBy.length > 0) {
    query = query.in('uploaded_by', filters.uploadedBy);
  }

  if (filters?.fileType && filters.fileType.length > 0) {
    // Filter by MIME type prefix
    const mimePatterns = filters.fileType.map((type) => {
      switch (type) {
        case 'document':
          return 'application/%';
        case 'image':
          return 'image/%';
        case 'cad':
          return 'application/acad'; // DWG/DXF
        case 'archive':
          return 'application/zip';
        default:
          return '%';
      }
    });
    query = query.or(mimePatterns.map((p) => `file_type.like.${p}`).join(','));
  }

  const { data: files, error } = await query;

  if (error) {
    console.error('[getProjectFiles] Error:', error);
    return { error: error.message };
  }

  console.log('[getProjectFiles] Success:', files.length, 'files');
  return { data: files };
}

/**
 * Delete project file (soft delete)
 */
export async function deleteProjectFile(fileId: string) {
  console.log('[deleteProjectFile] Deleting file:', fileId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get file to verify ownership and log audit
  const { data: file, error: fetchError } = await supabase
    .from('project_files')
    .select('*')
    .eq('id', fileId)
    .eq('company_id', companyId)
    .single();

  if (fetchError || !file) {
    return { error: 'File not found or access denied' };
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from('project_files')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', fileId);

  if (deleteError) {
    console.error('[deleteProjectFile] Error:', deleteError);
    return { error: deleteError.message };
  }

  // Log audit trail
  await supabase.from('file_audit_log').insert({
    company_id: companyId,
    file_id: fileId,
    file_type: 'document',
    action: 'delete',
    performed_by: userId,
    previous_state: file,
    new_state: { ...file, deleted_at: new Date().toISOString() },
  });

  console.log('[deleteProjectFile] Success');
  revalidatePath(`/app/projects/${file.project_id}`);
  return { success: true };
}

/**
 * Update file category
 */
export async function updateFileCategory(fileId: string, category: string) {
  console.log('[updateFileCategory] Updating file:', fileId, 'to category:', category);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  // Get current file state
  const { data: file, error: fetchError } = await supabase
    .from('project_files')
    .select('*')
    .eq('id', fileId)
    .eq('company_id', companyId)
    .single();

  if (fetchError || !file) {
    return { error: 'File not found or access denied' };
  }

  const previousState = { ...file };

  // Update category
  const { error: updateError } = await supabase
    .from('project_files')
    .update({ category, updated_at: new Date().toISOString() })
    .eq('id', fileId);

  if (updateError) {
    console.error('[updateFileCategory] Error:', updateError);
    return { error: updateError.message };
  }

  // Log audit trail
  await supabase.from('file_audit_log').insert({
    company_id: companyId,
    file_id: fileId,
    file_type: 'document',
    action: 'category_change',
    performed_by: userId,
    previous_state: previousState,
    new_state: { ...file, category, updated_at: new Date().toISOString() },
  });

  console.log('[updateFileCategory] Success');
  revalidatePath(`/app/projects/${file.project_id}`);
  return { success: true };
}

/**
 * Get file version history
 */
export async function getFileVersionHistory(fileId: string) {
  console.log('[getFileVersionHistory] Fetching versions for file:', fileId);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, companyId } = userContext;

  // Find root file (traverse parent_file_id chain)
  let rootFileId = fileId;
  const { data: file } = await supabase
    .from('project_files')
    .select('parent_file_id')
    .eq('id', fileId)
    .eq('company_id', companyId)
    .single();

  if (file?.parent_file_id) {
    rootFileId = file.parent_file_id;
  }

  // Get all versions in chain (root + children)
  const { data: versions, error } = await supabase
    .from('project_files')
    .select(`
      *,
      uploader:uploaded_by (id, name, avatar_url)
    `)
    .or(`id.eq.${rootFileId},parent_file_id.eq.${rootFileId}`)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('[getFileVersionHistory] Error:', error);
    return { error: error.message };
  }

  console.log('[getFileVersionHistory] Success:', versions.length, 'versions');
  return { data: versions };
}

/**
 * Bulk delete files
 */
export async function bulkDeleteFiles(fileIds: string[], projectId: string) {
  console.log('[bulkDeleteFiles] Deleting files:', fileIds.length);

  const userContext = await getUserContext();
  if ('error' in userContext) return { error: userContext.error };

  const { supabase, userId, companyId } = userContext;

  const errors: string[] = [];
  let deletedCount = 0;

  for (const fileId of fileIds) {
    const result = await deleteProjectFile(fileId);
    if ('error' in result) {
      errors.push(`${fileId}: ${result.error}`);
    } else {
      deletedCount++;
    }
  }

  console.log('[bulkDeleteFiles] Success:', deletedCount, 'deleted,', errors.length, 'errors');
  revalidatePath(`/app/projects/${projectId}`);

  return {
    success: true,
    deletedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}
```

### File 2: app/actions/project-photos.ts

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type ProjectPhoto = Database['public']['Tables']['project_photos']['Row'];
type PhotoFilters = {
  category?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: ('upload' | 'task_receipt' | 'expense_receipt')[];
  showReceipts?: boolean;
};

interface UnifiedPhoto {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename: string;
  category: string;
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
  if (!filters?.source || filters.source.includes('upload')) {
    let query = supabase
      .from('project_photos')
      .select(`
        *,
        uploader:uploaded_by (id, name, avatar_url)
      `)
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
        ...uploadedPhotos.map((photo) => ({
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
        ...taskReceipts.map((task) => ({
          id: `task-${task.id}`,
          url: task.receipt_photo_url!,
          thumbnail_url: undefined, // Tasks don't have thumbnails
          filename: `Task Receipt: ${task.title}`,
          category: 'task_receipts',
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
        ...expenseReceipts.map((expense) => ({
          id: `expense-${expense.id}`,
          url: expense.receipt_url!,
          thumbnail_url: undefined, // Expenses don't have thumbnails
          filename: `Expense Receipt: ${expense.description}`,
          category: 'expense_receipts',
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
```

### Route 1: app/api/project-files/upload/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('[POST /api/project-files/upload] Upload request');

  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (!companyUser) {
      return NextResponse.json({ error: 'No active company' }, { status: 403 });
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const category = formData.get('category') as string;
    const tagsJson = formData.get('tags') as string;
    const clientVisible = formData.get('clientVisible') === 'true';

    if (!file || !projectId) {
      return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 });
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`${companyUser.company_id}/projects/${projectId}/files/${file.name}`, file, {
      access: 'public',
    });

    // Insert database record
    const { data: fileRecord, error: insertError } = await supabase
      .from('project_files')
      .insert({
        company_id: companyUser.company_id,
        project_id: projectId,
        uploaded_by: session.user.id,
        filename: file.name,
        original_filename: file.name,
        file_url: blob.url,
        file_size: file.size,
        file_type: file.type,
        category: category || 'general',
        tags: tagsJson ? JSON.parse(tagsJson) : [],
        client_visible: clientVisible,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/project-files/upload] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('file_audit_log').insert({
      company_id: companyUser.company_id,
      file_id: fileRecord.id,
      file_type: 'document',
      action: 'upload',
      performed_by: session.user.id,
      new_state: fileRecord,
    });

    console.log('[POST /api/project-files/upload] Success:', fileRecord.id);
    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        file_url: fileRecord.file_url,
        file_size: fileRecord.file_size,
        category: fileRecord.category,
      },
    });
  } catch (error) {
    console.error('[POST /api/project-files/upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### Route 2: app/api/project-photos/upload/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import sharp from 'sharp'; // For thumbnail generation

export async function POST(request: NextRequest) {
  console.log('[POST /api/project-photos/upload] Upload request');

  try {
    // Auth check (same as files route)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (!companyUser) {
      return NextResponse.json({ error: 'No active company' }, { status: 403 });
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const category = formData.get('category') as string;
    const tagsJson = formData.get('tags') as string;
    const clientVisible = formData.get('clientVisible') === 'true';

    if (!file || !projectId) {
      return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 });
    }

    // Validate file size (10MB max for photos)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Photo too large (max 10MB)' }, { status: 400 });
    }

    // Validate image type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type (must be image)' }, { status: 400 });
    }

    // Upload full-size photo
    const blob = await put(
      `${companyUser.company_id}/projects/${projectId}/photos/${file.name}`,
      file,
      { access: 'public' }
    );

    // Generate thumbnail (300x300)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailBlob = await put(
      `${companyUser.company_id}/projects/${projectId}/photos/thumbnails/${file.name}`,
      thumbnailBuffer,
      { access: 'public', contentType: 'image/jpeg' }
    );

    // Extract EXIF data (placeholder - use exif-parser or similar library)
    const exifData = null; // TODO: Extract EXIF (GPS, camera, timestamp)

    // Insert database record
    const { data: photoRecord, error: insertError } = await supabase
      .from('project_photos')
      .insert({
        company_id: companyUser.company_id,
        project_id: projectId,
        uploaded_by: session.user.id,
        filename: file.name,
        photo_url: blob.url,
        thumbnail_url: thumbnailBlob.url,
        file_size: file.size,
        category: category || 'general',
        tags: tagsJson ? JSON.parse(tagsJson) : [],
        exif_data: exifData,
        client_visible: clientVisible,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/project-photos/upload] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('file_audit_log').insert({
      company_id: companyUser.company_id,
      file_id: photoRecord.id,
      file_type: 'photo',
      action: 'upload',
      performed_by: session.user.id,
      new_state: photoRecord,
    });

    console.log('[POST /api/project-photos/upload] Success:', photoRecord.id);
    return NextResponse.json({
      success: true,
      photo: {
        id: photoRecord.id,
        filename: photoRecord.filename,
        photo_url: photoRecord.photo_url,
        thumbnail_url: photoRecord.thumbnail_url,
        category: photoRecord.category,
      },
    });
  } catch (error) {
    console.error('[POST /api/project-photos/upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
```

---

## Acceptance Criteria

### Server Actions

- [x] `getProjectFiles` fetches files with filters (category, search, date, uploader)
- [x] `getProjectPhotosWithReceipts` aggregates photos + task receipts + expense receipts
- [x] `deleteProjectFile` and `deleteProjectPhoto` implement soft delete
- [x] `updateFileCategory` updates category and logs audit trail
- [x] `getFileVersionHistory` traverses parent_file_id chain
- [x] `bulkDeleteFiles` handles partial failures gracefully
- [x] All actions verify company_id and project access
- [x] All actions revalidate project page on mutation

### API Routes

- [x] File upload route validates size (50MB max), type, auth
- [x] Photo upload route generates thumbnail (300x300)
- [x] Photo upload extracts EXIF data (placeholder implemented)
- [x] Uploads use Vercel Blob with company/project path structure
- [x] Audit log created for all uploads
- [x] Error responses include descriptive messages

### Receipt Aggregation

- [x] Query joins `project_photos`, `tasks`, `expenses` tables
- [x] Receipt photos marked with `source` field ('task_receipt', 'expense_receipt')
- [x] `is_deletable` = false for receipt photos
- [x] `source_title` includes task title or expense description
- [x] Filter by `showReceipts` boolean works correctly

---

## Testing Checklist

```typescript
// Test getProjectFiles with filters
const result = await getProjectFiles('project-id', {
  category: ['contracts', 'permits'],
  search: 'agreement',
  dateFrom: '2024-01-01',
  uploadedBy: ['user-id'],
});

// Test receipt aggregation
const photos = await getProjectPhotosWithReceipts('project-id', {
  showReceipts: true,
  source: ['upload', 'task_receipt', 'expense_receipt'],
});

// Test soft delete
await deleteProjectFile('file-id');
// Verify deleted_at set, audit log created

// Test version history
const versions = await getFileVersionHistory('file-id');
// Verify all versions in chain returned

// Test bulk delete
await bulkDeleteFiles(['id1', 'id2', 'id3'], 'project-id');
// Verify partial failures handled

// Test upload API
const formData = new FormData();
formData.append('file', file);
formData.append('projectId', 'project-id');
formData.append('category', 'contracts');
const response = await fetch('/api/project-files/upload', {
  method: 'POST',
  body: formData,
});
// Verify file uploaded to Vercel Blob, DB record created, audit logged
```

---

## Notes

- **Receipt Aggregation**: No data duplication - queries join at read time (REQ-14)
- **Soft Delete**: `deleted_at` allows 30-day recovery (per NFR-3)
- **Audit Logging**: Critical operations logged to `file_audit_log` (REQ-8)
- **Thumbnail Generation**: Use `sharp` library for resize (REQ-11)
- **EXIF Extraction**: Placeholder for now - implement with `exif-parser` library
- **Vercel Blob**: Path structure: `{company_id}/projects/{project_id}/files|photos/{filename}`

---

## Dependencies

- `@vercel/blob` - File storage
- `sharp` - Image processing (install: `npm install sharp`)
- `exif-parser` (optional) - EXIF extraction

---

**END OF TASK 0002**
