/**
 * Price Update Cron Job
 *
 * Runs daily at 2 AM UTC to sync material prices from Home Depot API
 *
 * Protected with CRON_SECRET - only Vercel Cron can call this endpoint
 *
 * Logic:
 * 1. Verify cron secret in Authorization header
 * 2. Get admin Supabase client (service role, bypasses RLS)
 * 3. Query materials with home_depot_product_id IS NOT NULL
 * 4. For each material:
 *    - Fetch current price from Home Depot API
 *    - If price changed:
 *      - Update materials.unit_price and stock_status
 *      - Insert into material_price_history
 *    - Handle errors gracefully (continue processing)
 *    - Add 100ms delay between requests (rate limiting)
 * 5. Return summary: { success: true, updated: N, errors: N, total: N }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getHomeDepotProduct } from '@/lib/services/home-depot-api';
import type { Database } from '@/types/database.types';

// Use Node.js runtime (not edge) because we need nodemailer compatibility
export const dynamic = 'force-dynamic';

// Create admin Supabase client directly (bypasses RLS)
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

interface PriceUpdateSummary {
  success: boolean;
  updated: number;
  errors: number;
  total: number;
  errorDetails?: Array<{ materialId: string; error: string }>;
}

export async function GET(request: Request): Promise<NextResponse<PriceUpdateSummary>> {
  console.log('[Cron] Starting material price update job');

  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not configured');
    return NextResponse.json(
      { success: false, updated: 0, errors: 0, total: 0 },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized access attempt');
    return NextResponse.json(
      { success: false, updated: 0, errors: 0, total: 0 },
      { status: 401 }
    );
  }

  // 2. Get admin client (bypasses RLS)
  const supabase = createAdminClient();

  // 3. Query materials with Home Depot product IDs
  const { data: materials, error: queryError } = await supabase
    .from('materials')
    .select('id, company_id, home_depot_product_id, unit_price, stock_status')
    .not('home_depot_product_id', 'is', null);

  if (queryError) {
    console.error('[Cron] Failed to query materials:', queryError);
    return NextResponse.json(
      { success: false, updated: 0, errors: 1, total: 0 },
      { status: 500 }
    );
  }

  if (!materials || materials.length === 0) {
    console.log('[Cron] No materials with Home Depot product IDs found');
    return NextResponse.json({
      success: true,
      updated: 0,
      errors: 0,
      total: 0,
    });
  }

  console.log(`[Cron] Found ${materials.length} materials to update`);

  let updated = 0;
  let errors = 0;
  const errorDetails: Array<{ materialId: string; error: string }> = [];

  // 4. Process each material
  for (const material of materials) {
    try {
      // Fetch current price from Home Depot API
      const product = await getHomeDepotProduct(material.home_depot_product_id!);

      if (!product) {
        console.warn(
          `[Cron] No product data found for material ${material.id} (Home Depot ID: ${material.home_depot_product_id})`
        );
        errors++;
        errorDetails.push({
          materialId: material.id,
          error: 'Product not found in Home Depot API',
        });
        continue;
      }

      // Check if price has changed
      const newPrice = product.price;
      const currentPrice = material.unit_price;
      const newStockStatus = product.stockStatus || 'unknown';

      if (newPrice !== currentPrice) {
        console.log(
          `[Cron] Price changed for material ${material.id}: ${currentPrice} -> ${newPrice}`
        );

        // Update material
        const { error: updateError } = await supabase
          .from('materials')
          .update({
            unit_price: newPrice,
            stock_status: newStockStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', material.id);

        if (updateError) {
          console.error(`[Cron] Failed to update material ${material.id}:`, updateError);
          errors++;
          errorDetails.push({
            materialId: material.id,
            error: `Update failed: ${updateError.message}`,
          });
          continue;
        }

        // Insert price history
        const { error: historyError } = await supabase
          .from('material_price_history')
          .insert({
            company_id: material.company_id,
            material_id: material.id,
            price: newPrice,
            source: 'home_depot_api',
          });

        if (historyError) {
          console.error(
            `[Cron] Failed to insert price history for material ${material.id}:`,
            historyError
          );
          // Don't increment errors counter - material was updated successfully
        }

        updated++;
      } else if (newStockStatus !== material.stock_status) {
        // Stock status changed but price didn't
        console.log(
          `[Cron] Stock status changed for material ${material.id}: ${material.stock_status} -> ${newStockStatus}`
        );

        const { error: updateError } = await supabase
          .from('materials')
          .update({
            stock_status: newStockStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', material.id);

        if (updateError) {
          console.error(`[Cron] Failed to update stock status for material ${material.id}:`, updateError);
          errors++;
          errorDetails.push({
            materialId: material.id,
            error: `Stock status update failed: ${updateError.message}`,
          });
        }
      }

      // Rate limiting delay (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[Cron] Failed to process material ${material.id}:`, error);
      errors++;
      errorDetails.push({
        materialId: material.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const summary: PriceUpdateSummary = {
    success: true,
    updated,
    errors,
    total: materials.length,
  };

  // Include error details if there were errors (but limit to first 10 to avoid large responses)
  if (errorDetails.length > 0) {
    summary.errorDetails = errorDetails.slice(0, 10);
  }

  console.log(
    `[Cron] Price update job complete: ${updated} updated, ${errors} errors, ${materials.length} total`
  );

  return NextResponse.json(summary);
}
