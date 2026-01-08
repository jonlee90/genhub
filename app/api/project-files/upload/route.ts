import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
        category: (category || 'general') as any,
        tags: tagsJson ? JSON.parse(tagsJson) : [],
        client_visible: clientVisible,
      } as any)
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

    // Revalidate the project page to refresh file list
    revalidatePath(`/app/projects/${projectId}`);

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
