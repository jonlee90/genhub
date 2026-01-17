/**
 * Type declarations for lucide-react individual icon imports
 * Enables tree-shakeable imports from lucide-react/icons/*
 */

declare module 'lucide-react/icons/*' {
  import { LucideIcon } from 'lucide-react';
  const Icon: LucideIcon;
  export default Icon;
}
