/**
 * Project Type Display Configuration
 *
 * UI display settings for project types (icons, colors, labels).
 * Used in ProjectTypeSelector and project creation forms.
 */

import {
  Building2,
  Home,
  Factory,
  UtensilsCrossed,
  Coffee,
  Store,
  Warehouse,
  HardHat,
  Hammer,
  Wrench,
  Zap,
  Droplet,
  Drill,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Icon mapping for all available project type icons
 * Used when converting database project type configs to display format
 */
export const PROJECT_TYPE_ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Home,
  Factory,
  UtensilsCrossed,
  Coffee,
  Store,
  Warehouse,
  HardHat,
  Hammer,
  Wrench,
  Zap,
  Droplet,
  Drill,
};
