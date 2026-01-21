'use client'

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode
} from 'react'

/**
 * Theme preference types
 */
export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/**
 * ThemeContext interface
 */
export interface ThemeContextType {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

/**
 * LocalStorage key and data structure
 */
const STORAGE_KEY = 'genhub-theme-preference'

interface StoredThemeData {
  preference: ThemePreference
  timestamp: number
}

/**
 * Create Theme Context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * ThemeProvider Props
 */
interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Detect system theme preference via matchMedia
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch (error) {
    console.warn('Failed to detect system theme:', error)
    return 'light'
  }
}

/**
 * Read saved preference from localStorage
 */
function getSavedPreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    const parsed: StoredThemeData = JSON.parse(saved)

    // Validate preference value
    if (
      parsed.preference === 'light' ||
      parsed.preference === 'dark' ||
      parsed.preference === 'system'
    ) {
      return parsed.preference
    }

    return null
  } catch (error) {
    console.warn('Failed to read saved theme preference:', error)
    return null
  }
}

/**
 * Save preference to localStorage
 */
function savePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return

  try {
    const data: StoredThemeData = {
      preference,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save theme preference:', error)
  }
}

/**
 * Resolve preference to actual theme
 */
function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme()
  }
  return preference
}

/**
 * Apply theme to DOM by toggling .dark class on <html>
 */
function applyTheme(theme: ResolvedTheme): void {
  if (typeof window === 'undefined') return

  const html = document.documentElement

  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

/**
 * ThemeProvider Component
 *
 * Manages theme state and applies theme to DOM.
 * Uses useLayoutEffect to apply theme BEFORE React paint (prevents FOUC on rehydration).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with system preference (will be overridden by saved preference in useLayoutEffect)
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') return 'light'
    return getSystemTheme()
  })

  /**
   * useLayoutEffect runs BEFORE React paint, preventing FOUC during rehydration
   */
  useLayoutEffect(() => {
    // 1. Read saved preference from localStorage
    const saved = getSavedPreference()
    const initialPreference = saved || 'system'

    // 2. Resolve to actual theme
    const theme = resolveTheme(initialPreference)

    // 3. Update state
    setPreferenceState(initialPreference)
    setResolvedTheme(theme)

    // 4. Apply to DOM
    applyTheme(theme)

    // 5. Listen for system theme changes (when preference is 'system')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setPreferenceState(current => {
        // Only update if current preference is 'system'
        if (current === 'system') {
          const newTheme = e.matches ? 'dark' : 'light'
          setResolvedTheme(newTheme)
          applyTheme(newTheme)
        }
        return current
      })
    }

    // Use addEventListener for modern browsers
    try {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } catch (error) {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange)
    }

    // Cleanup
    return () => {
      try {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } catch (error) {
        // Fallback for older browsers
        mediaQuery.removeListener(handleSystemThemeChange)
      }
    }
  }, [])

  /**
   * Set theme preference (stable reference with useCallback)
   */
  const setPreference = useCallback((newPreference: ThemePreference) => {
    // 1. Resolve to actual theme
    const theme = resolveTheme(newPreference)

    // 2. Update state
    setPreferenceState(newPreference)
    setResolvedTheme(theme)

    // 3. Apply to DOM
    applyTheme(theme)

    // 4. Save to localStorage
    savePreference(newPreference)
  }, [])

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<ThemeContextType>(
    () => ({
      preference,
      resolvedTheme,
      setPreference
    }),
    [preference, resolvedTheme, setPreference]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 *
 * Access theme context. Must be used within ThemeProvider.
 *
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
