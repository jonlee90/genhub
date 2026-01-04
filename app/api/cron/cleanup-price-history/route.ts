/**
 * Cleanup Price History Cron Job
 *
 * Runs daily at 3 AM UTC to delete price history records older than 90 days
 *
 * Protected with CRON_SECRET - only Vercel Cron can call this endpoint
 *
 * Logic:
 * 1. Verify cron secret in Authorization header
 * 2. Get admin Supabase client (service role, bypasses RLS)
 * 3. Delete records with recorded_at < NOW() - INTERVAL '90 days'
 * 4. Return summary: { success: true, deleted: N }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Use Node.js runtime (not edge) because we need compatibility with other server modules
export const dynamic = 'force-dynamic';

// Create admin Supabase client directly (bypasses RLS)
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

interface CleanupSummary {
  success: boolean;
  deleted: number;
  error?: string;
}

export async function GET(request: Request): Promise<NextResponse<CleanupSummary>> {
  console.log('[Cron] Starting price history cleanup job');

  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not configured');
    return NextResponse.json(
      { success: false, deleted: 0, error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized access attempt');
    return NextResponse.json(
      { success: false, deleted: 0, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Get admin client (bypasses RLS)
  const supabase = createAdminClient();

  // 3. Calculate cutoff date (90 days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoffIso = cutoffDate.toISOString();

  console.log(`[Cron] Deleting price history records older than ${cutoffIso}`);

  // 4. Delete old records
  const { count, error } = await supabase
    .from('material_price_history')
    .delete({ count: 'exact' })
    .lt('recorded_at', cutoffIso);

  if (error) {
    console.error('[Cron] Cleanup failed:', error);
    return NextResponse.json(
      {
        success: false,
        deleted: 0,
        error: error.message,
      },
      { status: 500 }
    );
  }

  const deletedCount = count || 0;

  console.log(`[Cron] Cleanup job complete: ${deletedCount} records deleted`);

  return NextResponse.json({
    success: true,
    deleted: deletedCount,
  });
}
