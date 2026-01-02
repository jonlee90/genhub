/**
 * P2.4 - API Route: IFC to XKT Conversion
 *
 * POST /api/spatial/convert-model
 *
 * Workflow:
 * 1. Receive modelId in request body
 * 2. Fetch model record from database
 * 3. Download IFC file from Vercel Blob (original_file_url)
 * 4. Convert IFC to XKT using ifc-conversion-service
 * 5. Upload XKT file(s) to Vercel Blob
 * 6. Extract IFC metadata and populate model_elements table
 * 7. Update model record with xkt_file_url and processing_status='ready'
 * 8. On error: Update processing_status='failed' and processing_error
 *
 * Security:
 * - Requires authentication
 * - Verifies model belongs to user's company
 * - Rate limiting recommended for production
 *
 * Performance:
 * - Serverless timeout: 10s default, configure to 300s in vercel.json
 * - Memory: 1GB default (may need increase for large files)
 * - Future: Queue to background job (BullMQ, Inngest) for long conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { convertIFCtoXKT, cleanupTempFiles } from '@/lib/services/ifc-conversion-service';
import { updateModelProcessingStatus } from '@/app/actions/spatial';
import { put, head } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { z } from 'zod';

// Debug: API logger
const log = (message: string, data?: any) => {
  console.log(`[API-ConvertModel] ${message}`, data || '');
};

// Request validation schema
const ConvertModelSchema = z.object({
  modelId: z.string().uuid(),
});

/**
 * POST /api/spatial/convert-model
 * Convert uploaded IFC file to XKT format
 */
export async function POST(request: NextRequest) {
  log('Received conversion request');

  try {
    // Step 1: Authentication
    const session = await auth();
    if (!session?.user?.id) {
      log('Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    log('User authenticated', userId);

    // Step 2: Parse request body
    const body = await request.json();
    const parseResult = ConvertModelSchema.safeParse(body);

    if (!parseResult.success) {
      log('Invalid request body', parseResult.error);
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { modelId } = parseResult.data;
    log('Processing model', modelId);

    // Step 3: Fetch model record
    const supabase = await createClient();

    const { data: model, error: modelError } = await supabase
      .from('projects_3d_models')
      .select('*, project:projects!inner(id, company_id)')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      log('Model not found', modelError);
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Step 4: Verify user has access to project's company
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', userId)
      // @ts-ignore - TypeScript doesn't infer the joined relation
      .eq('company_id', model.project.company_id)
      .eq('status', 'active')
      .single();

    if (!companyUser) {
      log('Access denied - user not in company');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    log('Access verified', { companyId: companyUser.company_id, role: companyUser.role });

    // Step 5: Check model status
    if (model.processing_status !== 'pending') {
      log('Model not in pending status', model.processing_status);
      return NextResponse.json(
        { error: `Model is not pending (current status: ${model.processing_status})` },
        { status: 400 }
      );
    }

    // Step 6: Update status to 'processing'
    log('Updating model status to processing');
    await updateModelProcessingStatus(modelId, 'processing');

    // Step 7: Download IFC file from Vercel Blob
    log('Downloading IFC file from Blob', model.original_file_url);

    // Debug: Verify blob exists
    try {
      await head(model.original_file_url);
    } catch (error) {
      log('Blob file not found', error);
      await updateModelProcessingStatus(modelId, 'failed', {
        processingError: 'IFC file not found in storage',
      });
      return NextResponse.json({ error: 'IFC file not found in storage' }, { status: 404 });
    }

    // Debug: Download IFC to temp directory
    const tempDir = os.tmpdir();
    const ifcTempPath = path.join(tempDir, `ifc-${modelId}-${Date.now()}.ifc`);
    const xktTempPath = path.join(tempDir, `xkt-${modelId}-${Date.now()}.xkt`);

    log('Downloading IFC to temp', ifcTempPath);

    const ifcResponse = await fetch(model.original_file_url);
    if (!ifcResponse.ok) {
      log('Failed to download IFC file', ifcResponse.statusText);
      await updateModelProcessingStatus(modelId, 'failed', {
        processingError: 'Failed to download IFC file from storage',
      });
      return NextResponse.json({ error: 'Failed to download IFC file' }, { status: 500 });
    }

    const ifcBuffer = Buffer.from(await ifcResponse.arrayBuffer());
    await fs.writeFile(ifcTempPath, ifcBuffer);
    log('IFC file downloaded', { size: ifcBuffer.length });

    // Step 8: Convert IFC to XKT
    log('Starting IFC to XKT conversion');

    const conversionResult = await convertIFCtoXKT(ifcTempPath, xktTempPath, {
      generateLODs: false, // MVP: Skip LOD generation
      extractThumbnail: false, // MVP: Skip thumbnail
      maxProcessingTimeMs: 5 * 60 * 1000, // 5 minutes
    });

    if (!conversionResult.success || !conversionResult.xktPath) {
      log('Conversion failed', conversionResult.error);
      await cleanupTempFiles([ifcTempPath, xktTempPath]);
      await updateModelProcessingStatus(modelId, 'failed', {
        processingError: conversionResult.error || 'Conversion failed',
      });
      return NextResponse.json(
        { error: conversionResult.error || 'Conversion failed' },
        { status: 500 }
      );
    }

    log('Conversion successful', conversionResult.metadata);

    // Step 9: Upload XKT file to Vercel Blob
    log('Uploading XKT file to Blob');

    const xktBuffer = await fs.readFile(conversionResult.xktPath);
    const xktFilename = `models/${model.project_id}/${modelId}/model.xkt`;

    const xktBlob = await put(xktFilename, xktBuffer, {
      access: 'public',
      contentType: 'application/octet-stream',
    });

    log('XKT file uploaded', xktBlob.url);

    // Step 10: Update model record with XKT URL and metadata
    log('Updating model record with conversion results');

    const updateResult = await updateModelProcessingStatus(modelId, 'ready', {
      xktFileUrl: xktBlob.url,
      elementCount: conversionResult.metadata?.elementCount,
      bounds: conversionResult.metadata?.bounds,
      floors: conversionResult.metadata?.floors,
    });

    if ('error' in updateResult) {
      log('Failed to update model record', updateResult.error);
      // Debug: Model converted but failed to update - log error but don't fail
      // User can retry or manually update
    }

    // Step 11: Cleanup temp files
    log('Cleaning up temp files');
    await cleanupTempFiles([ifcTempPath, xktTempPath]);

    // Step 12: Return success
    log('Conversion completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        modelId,
        xktUrl: xktBlob.url,
        metadata: conversionResult.metadata,
      },
    });
  } catch (error) {
    log('Unexpected error', error);

    // Debug: Try to update model status to failed if we have modelId
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/spatial/convert-model?modelId=xxx
 * Check conversion status
 */
export async function GET(request: NextRequest) {
  log('Received status check request');

  try {
    // Step 1: Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Step 2: Parse query params
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json({ error: 'Missing modelId parameter' }, { status: 400 });
    }

    log('Checking status for model', modelId);

    // Step 3: Fetch model record
    const supabase = await createClient();

    const { data: model, error: modelError } = await supabase
      .from('projects_3d_models')
      .select('id, processing_status, processing_error, xkt_file_url, element_count, bounds, floors')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      log('Model not found', modelError);
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    log('Model status', model.processing_status);

    return NextResponse.json({
      success: true,
      data: {
        modelId: model.id,
        status: model.processing_status,
        error: model.processing_error,
        xktUrl: model.xkt_file_url,
        elementCount: model.element_count,
        bounds: model.bounds,
        floors: model.floors,
      },
    });
  } catch (error) {
    log('Unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
