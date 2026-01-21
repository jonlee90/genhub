'use client'

import React, { memo } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/lib/context/ThemeContext'

/**
 * ThemeToggle Component
 *
 * Mobile-first theme toggle button that cycles through theme preferences.
 * Cycle order: light → system → dark → light
 *
 * Features:
 * - Touch-friendly: 44px minimum tap target
 * - Shows appropriate icon: Moon (light), Sun (dark), Monitor (system)
 * - Accessible: aria-label and title attributes
 * - Memoized to prevent unnecessary re-renders
 * - Smooth color transitions (150ms)
 * - SSR-safe
 *
 * @example
 * ```tsx
 * import { ThemeToggle } from '@/components/theme/ThemeToggle'
 *
 * function Header() {
 *   return (
 *     <header>
 *       <ThemeToggle />
 *     </header>
 *   )
 * }
 * ```
 */
function ThemeToggleComponent() {
  const { preference, setPreference } = useTheme()

  /**
   * Cycle through theme preferences
   * light → system → dark → light
   */
  const handleToggle = () => {
    const nextPreference: Record<ThemePreference, ThemePreference> = {
      light: 'system',
      system: 'dark',
      dark: 'light'
    }

    setPreference(nextPreference[preference])
  }

  /**
   * Get icon component based on current preference
   */
  const IconComponent = {
    light: Moon,
    dark: Sun,
    system: Monitor
  }[preference]

  /**
   * Get label text for accessibility
   */
  const label = {
    light: 'Switch to system theme',
    dark: 'Switch to light theme',
    system: 'Switch to dark theme'
  }[preference]

  /**
   * Get title text showing current preference
   */
  const title = {
    light: 'Theme: Light',
    dark: 'Theme: Dark',
    system: 'Theme: System'
  }[preference]

  return (
    <button
      onClick={handleToggle}
      className="
        relative flex items-center justify-center
        min-w-[44px] min-h-[44px] w-10 h-10
        rounded-lg
        text-gray-700 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-800
        active:scale-95 active:bg-gray-200 dark:active:bg-gray-700
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-construction-primary focus:ring-offset-2
      "
      aria-label={label}
      title={title}
      type="button"
    >
      <IconComponent
        size={20}
        className="transition-colors duration-150"
        aria-hidden="true"
      />
    </button>
  )
}

/**
 * Export memoized version to prevent re-renders on parent updates
 */
export const ThemeToggle = memo(ThemeToggleComponent)
