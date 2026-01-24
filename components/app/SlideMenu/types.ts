import type { LucideIcon } from "lucide-react";
import type { Session } from "next-auth";
import type { ThemePreference } from "@/lib/context/ThemeContext";

export interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}

export interface SlideMenuNavItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export interface SlideMenuBackdropProps {
  onClick: () => void;
}

export interface SlideMenuPanelProps {
  children: React.ReactNode;
  onClose: () => void;
}

export interface SlideMenuUserSectionProps {
  user: Session["user"];
  onClose: () => void;
}

export interface SlideMenuListProps {
  items: SlideMenuNavItem[];
  onClose: () => void;
  currentPath: string;
}

export interface SlideMenuListItemProps {
  item: SlideMenuNavItem;
  isActive: boolean;
  onClose: () => void;
  index?: number;
}

/**
 * Theme Toggle Props
 * Used for the animated sun/moon/monitor toggle in the SlideMenu
 */
export interface SlideMenuThemeToggleProps {
  /** Current theme preference */
  preference: ThemePreference;
  /** Callback when theme is toggled */
  onToggle: () => void;
  /** Optional class name */
  className?: string;
}

/**
 * Role badge mapping for user section
 */
export type UserRole = "contractor" | "owner" | "admin" | "client" | "subcontractor";

export interface RoleBadgeConfig {
  label: string;
  bgClass: string;
  textClass: string;
}
