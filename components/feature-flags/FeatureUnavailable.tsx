'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface FeatureUnavailableProps {
  featureName?: string
  message?: string
  showBackButton?: boolean
}

/**
 * Component shown when a feature is disabled via feature flag
 *
 * Usage:
 * if (!enabled) return <FeatureUnavailable featureName="3D Spatial Viewer" />
 */
export function FeatureUnavailable({
  featureName = 'This feature',
  message,
  showBackButton = true,
}: FeatureUnavailableProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-gray-100">
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Feature Unavailable
          </h2>
          <p className="text-gray-600">
            {message || `${featureName} is currently not available.`}
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator for more information.
          </p>
        </div>

        {showBackButton && (
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            <Button onClick={() => router.push('/app')}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
