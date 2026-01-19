import type { LucideIcon } from "lucide-react";
import type { Session } from "next-auth";

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
