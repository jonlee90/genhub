/**
 * API Route: Upload Photo to Marker
 * - Accepts multipart/form-data with photo file and markerId
 * - Generates thumbnail
 * - Extracts EXIF data
 * - Uploads to Vercel Blob
 * - Creates marker_content record
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/utils/supabase/server'
import { generateThumbnail, extractExif, applyOrientation } from '@/lib/image-processing'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  console.log('[upload-photo] POST request received')

  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[upload-photo] Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const markerId = formData.get('markerId') as string | null

    if (!file || !markerId) {
      console.log('[upload-photo] Missing file or markerId')
      return NextResponse.json({ error: 'Missing file or markerId' }, { status: 400 })
    }

    console.log('[upload-photo] File:', file.name, file.type, file.size)
    console.log('[upload-photo] Marker ID:', markerId)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    // Apply orientation correction
    buffer = await applyOrientation(buffer)

    // Generate thumbnail
    const { thumbnail } = await generateThumbnail(buffer)

    // Extract EXIF data
    const exifData = await extractExif(buffer)

    // Generate unique filename
    const photoId = crypto.randomUUID()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${photoId}.${extension}`
    const thumbFilename = `${photoId}_thumb.${extension}`

    // Upload original to Vercel Blob
    console.log('[upload-photo] Uploading original to Vercel Blob')
    const originalBlob = await put(`markers/${markerId}/photos/${filename}`, buffer, {
      access: 'public',
      contentType: file.type,
    })

    // Upload thumbnail to Vercel Blob
    console.log('[upload-photo] Uploading thumbnail to Vercel Blob')
    const thumbnailBlob = await put(`markers/${markerId}/photos/${thumbFilename}`, thumbnail, {
      access: 'public',
      contentType: file.type,
    })

    // Create marker_content record
    console.log('[upload-photo] Creating marker_content record')
    const { data: content, error: dbError } = await supabase
      .from('marker_content')
      .insert({
        marker_id: parseInt(markerId, 10),
        type: 'photo',
        url: originalBlob.url,
        thumbnail_url: thumbnailBlob.url,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        metadata: exifData || {},
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[upload-photo] Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 })
    }

    console.log('[upload-photo] Success:', content.id)

    return NextResponse.json({
      success: true,
      content,
    })
  } catch (error) {
    console.error('[upload-photo] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
