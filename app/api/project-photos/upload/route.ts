import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import sharp from 'sharp'; // For thumbnail generation
import { revalidatePath } from 'next/cache';

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

    // Generate unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const photoPath = `${companyUser.company_id}/projects/${projectId}/photos/${timestamp}_${sanitizedName}`;
    const thumbnailPath = `${companyUser.company_id}/projects/${projectId}/photos/thumbnails/${timestamp}_${sanitizedName}`;

    // Issue PERF-006: Streaming upload to reduce memory usage
    // Strategy: Upload File directly (streaming), then read once for thumbnail only
    // Memory impact: 10MB photo now uses ~20MB RAM instead of ~40MB

    // Upload full-size photo to Supabase Storage (File object supports streaming)
    const { error: photoError } = await supabase.storage
      .from('project-files')
      .upload(photoPath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (photoError) {
      console.error('[POST /api/project-photos/upload] Storage error:', photoError);
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }

    // Generate thumbnail (300x300) - must read file into buffer for sharp processing
    // This is the only unavoidable memory allocation for image processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload thumbnail to Supabase Storage
    const { error: thumbError } = await supabase.storage
      .from('project-files')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (thumbError) {
      console.error('[POST /api/project-photos/upload] Thumbnail storage error:', thumbError);
      // Continue even if thumbnail fails - we still have the main photo
    }

    // Get public URLs
    const { data: { publicUrl: photoUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(photoPath);

    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(thumbnailPath);

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
        photo_url: photoUrl,
        thumbnail_url: thumbnailUrl,
        file_size: file.size,
        category: (category || 'general') as any,
        tags: tagsJson ? JSON.parse(tagsJson) : [],
        exif_data: exifData,
        client_visible: clientVisible,
      } as any)
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

    // Revalidate the project page to refresh photo gallery
    revalidatePath(`/app/projects/${projectId}`);

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
