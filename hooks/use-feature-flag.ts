'use client'

/**
 * Client-side feature flag hook
 *
 * Usage:
 * const { enabled, loading } = useFeatureFlag('spatial_viewer_enabled')
 *
 * if (loading) return <Spinner />
 * if (!enabled) return <FeatureUnavailable />
 * return <SpatialViewer />
 */

import { useState, useEffect } from 'react'
import { FeatureFlag, isFeatureFlagEnabled } from '@/lib/feature-flags'

interface UseFeatureFlagResult {
  enabled: boolean
  loading: boolean
}

/**
 * Hook to check feature flag status on client
 *
 * @param flag - Feature flag name
 * @returns { enabled: boolean, loading: boolean }
 */
export function useFeatureFlag(flag: FeatureFlag): UseFeatureFlagResult {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check environment variable (synchronous)
    const isEnabled = isFeatureFlagEnabled(flag)
    setEnabled(isEnabled)
    setLoading(false)
  }, [flag])

  return { enabled, loading }
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param flags - Array of feature flag names
 * @returns Record<FeatureFlag, boolean>
 */
export function useFeatureFlags(flags: FeatureFlag[]): {
  flags: Record<string, boolean>
  loading: boolean
} {
  const [flagStates, setFlagStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const states: Record<string, boolean> = {}
    for (const flag of flags) {
      states[flag] = isFeatureFlagEnabled(flag)
    }
    setFlagStates(states)
    setLoading(false)
  }, [flags])

  return { flags: flagStates, loading }
}
