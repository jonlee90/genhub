/**
 * IFC to XKT Conversion Service
 *
 * This module handles conversion of IFC files to XKT format for xeokit viewer.
 *
 * PRODUCTION NOTE:
 * The actual IFC->XKT conversion requires @xeokit/xeokit-convert CLI tool
 * and native dependencies (IfcOpenShell). For production deployment:
 *
 * Option 1: Use a dedicated conversion service (Docker container)
 * Option 2: Use serverless with custom runtime (AWS Lambda with layers)
 * Option 3: Use a cloud-based conversion API
 *
 * For development, this provides a mock implementation.
 */

import { createClient } from '@/utils/supabase/server';

export interface ConversionResult {
  success: boolean;
  xktUrl?: string;
  error?: string;
  elementCount?: number;
  bounds?: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  };
}

/**
 * Convert IFC file to XKT format
 *
 * CURRENT LIMITATION: xeokit v2.6.x does not support native IFC loading.
 * IFC files must be converted to XKT format before visualization.
 *
 * TODO - Implement IFC to XKT conversion using:
 * - web-ifc library for parsing IFC files
 * - @xeokit/xeokit-convert for XKT creation
 * - Or use a cloud conversion service (e.g., BIM Collab, Convert Online)
 *
 * @param ifcUrl - URL of the uploaded IFC file
 * @param modelId - Database ID of the model record
 */
export async function convertIFCToXKT(
  ifcUrl: string,
  modelId: string
): Promise<ConversionResult> {
  console.log('[IFCConverter] Starting conversion', { ifcUrl, modelId });

  try {
    // TODO: Implement one of these approaches:
    //
    // Option 1: Client-side conversion (web-ifc + three.js export)
    // - Download IFC file
    // - Parse using web-ifc library
    // - Extract geometry and properties
    // - Create XKT structure
    // - Upload to Supabase Storage
    //
    // Option 2: Server-side conversion (@xeokit/xeokit-convert)
    // - Download IFC file
    // - Use xeokit-convert CLI
    // - Requires native dependencies (IfcOpenShell)
    // - Upload XKT to Supabase Storage
    //
    // Option 3: Cloud conversion API
    // - Send IFC to conversion service (Convert Online, BIM Collab, etc.)
    // - Retrieve converted XKT
    // - Upload to Supabase Storage

    console.warn('[IFCConverter] IFC conversion not yet implemented');
    console.log('[IFCConverter] The 3D viewer will show a placeholder model');
    console.log('[IFCConverter] To use your actual IFC model, please convert it to XKT format using an online tool');
    console.log('[IFCConverter] Recommended: https://convert.babylonjs.com or similar XKT conversion service');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For now, return a failure status
    // The viewer will show placeholder model instead
    return {
      success: false,
      error:
        'IFC conversion not yet implemented. ' +
        'Please convert your IFC file to XKT format using https://convert.babylonjs.com ' +
        'and re-upload the converted file. ' +
        'This will be automated in a future update.',
    };
  } catch (error) {
    console.error('[IFCConverter] Conversion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
    };
  }
}

/**
 * Process uploaded IFC file: convert and update model record
 *
 * @param modelId - Database ID of the model to process
 */
export async function processIFCFile(modelId: string): Promise<void> {
  console.log('[IFCConverter] Processing IFC file for model:', modelId);

  const supabase = await createClient();

  try {
    // Get model record
    const { data: model, error: fetchError } = await supabase
      .from('projects_3d_models')
      .select('id, original_file_url, project_id')
      .eq('id', modelId)
      .single();

    if (fetchError || !model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Update status to processing
    await supabase
      .from('projects_3d_models')
      .update({ processing_status: 'processing' })
      .eq('id', modelId);

    console.log('[IFCConverter] Status updated to processing');

    // Convert IFC to XKT
    const result = await convertIFCToXKT(model.original_file_url, modelId);

    if (result.success && result.xktUrl) {
      // Update model with XKT URL and metadata
      const { error: updateError } = await supabase
        .from('projects_3d_models')
        .update({
          processing_status: 'ready',
          xkt_file_url: result.xktUrl,
          element_count: result.elementCount,
          bounds: result.bounds,
          is_active: true, // Automatically activate the first successful conversion
        })
        .eq('id', modelId);

      if (updateError) {
        throw updateError;
      }

      console.log('[IFCConverter] Model updated successfully:', modelId);
    } else {
      // Conversion failed
      await supabase
        .from('projects_3d_models')
        .update({
          processing_status: 'failed',
          processing_error: result.error || 'Conversion failed',
        })
        .eq('id', modelId);

      console.error('[IFCConverter] Conversion failed:', result.error);
    }
  } catch (error) {
    console.error('[IFCConverter] Processing error:', error);
    console.error('[IFCConverter] Error type:', typeof error);
    console.error('[IFCConverter] Error details:', JSON.stringify(error, null, 2));

    // Update model status to failed
    const errorMessage = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null && 'message' in error)
        ? String((error as any).message)
        : 'Unknown error';

    console.error('[IFCConverter] Storing error message:', errorMessage);

    await supabase
      .from('projects_3d_models')
      .update({
        processing_status: 'failed',
        processing_error: errorMessage,
      })
      .eq('id', modelId);
  }
}

/**
 * Queue-based processing for background conversion
 * In production, this would use a job queue (Bull, BullMQ, etc.)
 * or serverless functions triggered by storage events
 */
export async function queueIFCConversion(modelId: string): Promise<void> {
  console.log('[IFCConverter] Queueing conversion for model:', modelId);

  // PRODUCTION: Add to job queue
  // await jobQueue.add('convert-ifc', { modelId });

  // DEVELOPMENT: Process immediately in background
  // Don't await - let it run in background
  processIFCFile(modelId).catch((error) => {
    console.error('[IFCConverter] Background processing error:', error);
  });
}
