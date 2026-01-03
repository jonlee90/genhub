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
 * DEVELOPMENT MODE: This is a mock implementation that returns the original IFC URL
 * In production, this should trigger actual IFC->XKT conversion
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
    // PRODUCTION IMPLEMENTATION:
    // 1. Download IFC file from Supabase Storage
    // 2. Run xeokit-convert CLI or call conversion service
    // 3. Upload XKT file to Supabase Storage
    // 4. Return XKT URL

    // DEVELOPMENT MOCK:
    // For now, we'll use the IFC file directly and mark it as ready
    // This allows testing the UI without full conversion pipeline

    console.log('[IFCConverter] MOCK: Using IFC file directly (production needs XKT conversion)');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, this would be the uploaded XKT file URL
    // For now, return the IFC URL (xeokit can attempt to load it)
    const xktUrl = ifcUrl;

    // Mock metadata (in production, extracted during conversion)
    const elementCount = 150; // Sample house elements
    const bounds = {
      minX: -10,
      minY: 0,
      minZ: -10,
      maxX: 10,
      maxY: 8,
      maxZ: 10,
    };

    console.log('[IFCConverter] Conversion complete (mock)', { xktUrl, elementCount });

    return {
      success: true,
      xktUrl,
      elementCount,
      bounds,
    };
  } catch (error) {
    console.error('[IFCConverter] Conversion failed:', error);
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
