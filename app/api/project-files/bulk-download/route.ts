import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  console.log('[POST /api/project-files/bulk-download] Download request');

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

    // Parse request body
    const { fileIds, projectId } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid fileIds' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Fetch file metadata to verify access
    const { data: files, error: fetchError } = await supabase
      .from('project_files')
      .select('id, filename, file_url, project_id, company_id')
      .in('id', fileIds)
      .eq('company_id', companyUser.company_id)
      .eq('project_id', projectId)
      .is('deleted_at', null);

    if (fetchError || !files || files.length === 0) {
      return NextResponse.json({ error: 'No accessible files found' }, { status: 404 });
    }

    if (files.length !== fileIds.length) {
      console.warn('[POST /api/project-files/bulk-download] Some files not found or access denied');
    }

    // Create ZIP archive
    const zip = new JSZip();

    for (const file of files) {
      try {
        // Download file from Vercel Blob using fetch
        const response = await fetch(file.file_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        zip.file(file.filename, arrayBuffer);
      } catch (error) {
        console.error('[POST /api/project-files/bulk-download] Failed to fetch file:', file.id, error);
        // Continue with other files, don't fail entire download
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Log audit trail
    await supabase.from('file_audit_log').insert({
      company_id: companyUser.company_id,
      file_id: null, // Bulk action - no single file
      file_type: 'document',
      action: 'bulk_download',
      performed_by: session.user.id,
      new_state: { fileIds, fileCount: files.length },
    });

    console.log('[POST /api/project-files/bulk-download] Success:', files.length, 'files');

    // Return ZIP as download
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="project-files-${Date.now()}.zip"`,
      },
    });
  } catch (error) {
    console.error('[POST /api/project-files/bulk-download] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk download failed' },
      { status: 500 }
    );
  }
}
