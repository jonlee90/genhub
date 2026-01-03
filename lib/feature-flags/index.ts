/**
 * Feature Flag System
 *
 * Supports:
 * - Environment-based flags (MVP)
 * - Server-side checking with isFeatureEnabled()
 * - Client-side hook with useFeatureFlag()
 * - User-level overrides (future)
 * - Graceful degradation
 */

import { cache } from 'react'

/**
 * Available feature flags
 */
export type FeatureFlag =
  | 'spatial_viewer_enabled'
  | 'spatial_viewer_beta'
  | 'client_portal_3d'
  | 'offline_mode_enabled'
  | '2d_floor_plan_mode'
  | 'ifc_upload_enabled'
  | 'marker_clustering'
  | 'marker_search'
  | 'marker_filters'
  | 'model_lod_switching'

/**
 * Feature flag configuration
 */
interface FeatureFlagConfig {
  flag: FeatureFlag
  envVar: string
  defaultValue: boolean
  description: string
}

const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  spatial_viewer_enabled: {
    flag: 'spatial_viewer_enabled',
    envVar: 'NEXT_PUBLIC_SPATIAL_VIEWER_ENABLED',
    defaultValue: true,
    description: 'Enable 3D spatial viewer feature',
  },
  spatial_viewer_beta: {
    flag: 'spatial_viewer_beta',
    envVar: 'NEXT_PUBLIC_SPATIAL_VIEWER_BETA',
    defaultValue: false,
    description: 'Enable beta features in spatial viewer',
  },
  client_portal_3d: {
    flag: 'client_portal_3d',
    envVar: 'NEXT_PUBLIC_CLIENT_PORTAL_3D',
    defaultValue: true,
    description: 'Allow clients to view 3D models',
  },
  offline_mode_enabled: {
    flag: 'offline_mode_enabled',
    envVar: 'NEXT_PUBLIC_OFFLINE_MODE_ENABLED',
    defaultValue: false,
    description: 'Enable offline mode with service worker',
  },
  '2d_floor_plan_mode': {
    flag: '2d_floor_plan_mode',
    envVar: 'NEXT_PUBLIC_2D_FLOOR_PLAN_MODE',
    defaultValue: false,
    description: 'Enable 2D floor plan view mode',
  },
  ifc_upload_enabled: {
    flag: 'ifc_upload_enabled',
    envVar: 'NEXT_PUBLIC_IFC_UPLOAD_ENABLED',
    defaultValue: true,
    description: 'Allow IFC file uploads',
  },
  marker_clustering: {
    flag: 'marker_clustering',
    envVar: 'NEXT_PUBLIC_MARKER_CLUSTERING',
    defaultValue: true,
    description: 'Enable marker clustering for performance',
  },
  marker_search: {
    flag: 'marker_search',
    envVar: 'NEXT_PUBLIC_MARKER_SEARCH',
    defaultValue: true,
    description: 'Enable marker search functionality',
  },
  marker_filters: {
    flag: 'marker_filters',
    envVar: 'NEXT_PUBLIC_MARKER_FILTERS',
    defaultValue: true,
    description: 'Enable marker filtering by type/status/phase',
  },
  model_lod_switching: {
    flag: 'model_lod_switching',
    envVar: 'NEXT_PUBLIC_MODEL_LOD_SWITCHING',
    defaultValue: false,
    description: 'Enable automatic LOD switching for performance',
  },
}

/**
 * Get feature flag value from environment
 */
function getEnvFlag(flag: FeatureFlag): boolean {
  const config = FEATURE_FLAGS[flag]
  const envValue = process.env[config.envVar]

  if (envValue === undefined) {
    return config.defaultValue
  }

  return envValue === 'true' || envValue === '1'
}

/**
 * Server-side feature flag check (cached per request)
 *
 * @param flag - Feature flag name
 * @param userId - Optional user ID for user-specific overrides (future)
 * @returns Promise<boolean>
 *
 * @example
 * const isEnabled = await isFeatureEnabled('spatial_viewer_enabled')
 * if (!isEnabled) {
 *   return <FeatureUnavailable />
 * }
 */
export const isFeatureEnabled = cache(async (
  flag: FeatureFlag,
  userId?: string
): Promise<boolean> => {
  // MVP: Check environment variable
  const envEnabled = getEnvFlag(flag)

  // Future: Check database for user-specific overrides
  // if (userId) {
  //   const override = await getUserFeatureFlagOverride(userId, flag)
  //   if (override !== null) return override
  // }

  return envEnabled
})

/**
 * Synchronous client-side feature flag check
 * Only works with NEXT_PUBLIC_ environment variables
 *
 * @param flag - Feature flag name
 * @returns boolean
 */
export function isFeatureFlagEnabled(flag: FeatureFlag): boolean {
  return getEnvFlag(flag)
}

/**
 * Get all feature flags (for debugging/admin panel)
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return Object.keys(FEATURE_FLAGS).reduce((acc, key) => {
    acc[key as FeatureFlag] = getEnvFlag(key as FeatureFlag)
    return acc
  }, {} as Record<FeatureFlag, boolean>)
}

/**
 * Get feature flag metadata
 */
export function getFeatureFlagConfig(flag: FeatureFlag): FeatureFlagConfig {
  return FEATURE_FLAGS[flag]
}

/**
 * Check if user has access to feature (considers role + flag)
 *
 * @param flag - Feature flag name
 * @param userRole - User role (client, worker, pm, gc_admin)
 * @returns boolean
 */
export async function canUserAccessFeature(
  flag: FeatureFlag,
  userRole: 'client' | 'worker' | 'pm' | 'gc_admin'
): Promise<boolean> {
  const flagEnabled = await isFeatureEnabled(flag)
  if (!flagEnabled) return false

  // Special handling for client-specific flags
  if (flag === 'client_portal_3d') {
    return userRole === 'client'
  }

  // GC admin and PM have access to beta features
  if (flag === 'spatial_viewer_beta') {
    return userRole === 'gc_admin' || userRole === 'pm'
  }

  return true
}
