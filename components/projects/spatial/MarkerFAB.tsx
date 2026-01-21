'use client';

// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Plus from 'lucide-react/icons/plus';;
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

/**
 * MarkerFAB - Floating Action Button for adding markers in mobile view
 *
 * Positioned bottom-right, above the bottom navigation.
 * Only visible on mobile devices (< 768px).
 * 56px circle following Material Design FAB sizing (exceeds 44px minimum).
 */
export interface MarkerFABProps {
  /** Click handler for marker creation */
  onClick: () => void;
  /** Disables the FAB when marker creation is not allowed */
  disabled?: boolean;
}

export function MarkerFAB({ onClick, disabled = false }: MarkerFABProps) {
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Add marker"
      className={cn(
        // Size: 56px circle (standard FAB, exceeds 44px minimum)
        'w-14 h-14 rounded-full',
        // Fixed positioning: bottom-right, above bottom nav
        'fixed bottom-20 right-4 z-50',
        // Safe area: add padding for devices with home indicators
        'mb-[env(safe-area-inset-bottom)]',
        // Primary color scheme
        'bg-construction-blue text-white',
        // Flexbox centering for icon
        'flex items-center justify-center',
        // Shadow for elevation
        'shadow-lg',
        // Touch feedback
        'active:scale-[0.98] active:bg-construction-blue/90',
        // Smooth transitions
        'transition-all duration-150',
        // Disabled state
        'disabled:opacity-50 disabled:pointer-events-none'
      )}
    >
      <Plus className="w-6 h-6" aria-hidden="true" />
    </button>
  );
}

export default MarkerFAB;
