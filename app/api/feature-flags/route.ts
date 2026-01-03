/**
 * Feature Flags API Route
 *
 * GET /api/feature-flags - Get all feature flags
 * GET /api/feature-flags?flag=spatial_viewer_enabled - Get specific flag
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllFeatureFlags,
  isFeatureEnabled,
  FeatureFlag,
  getFeatureFlagConfig,
} from '@/lib/feature-flags'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const flag = searchParams.get('flag') as FeatureFlag | null

    // Get specific flag
    if (flag) {
      const enabled = await isFeatureEnabled(flag, session.user.id)
      const config = getFeatureFlagConfig(flag)

      return NextResponse.json({
        flag,
        enabled,
        description: config.description,
      })
    }

    // Get all flags
    const flags = getAllFeatureFlags()
    const flagsWithMetadata = Object.entries(flags).map(([key, enabled]) => {
      const config = getFeatureFlagConfig(key as FeatureFlag)
      return {
        flag: key,
        enabled,
        description: config.description,
      }
    })

    return NextResponse.json({ flags: flagsWithMetadata })
  } catch (error) {
    console.error('Feature flags API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
