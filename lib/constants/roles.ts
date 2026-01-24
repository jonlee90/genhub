/**
 * Role and Status Display Constants
 *
 * Shared constants for user role and status display across owner admin pages.
 */

import { CheckCircle, Mail, AlertCircle } from 'lucide-react';

// Role display mapping
export const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-construction-blue text-white' },
  project_manager: { label: 'PM', color: 'bg-blue-600 text-white' },
  foreman: { label: 'Foreman', color: 'bg-construction-gray text-white' },
  field_worker: { label: 'Field', color: 'bg-gray-600 text-white' },
  subcontractor: {
    label: 'Sub',
    color: 'bg-construction-gray-light text-white',
  },
  client: { label: 'Client', color: 'bg-gray-500 text-white' },
};

// Status display mapping
export const STATUS_DISPLAY: Record<
  string,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  active: {
    label: 'Active',
    icon: CheckCircle,
    color: 'text-construction-green',
  },
  invited: { label: 'Invited', icon: Mail, color: 'text-yellow-600' },
  inactive: { label: 'Inactive', icon: AlertCircle, color: 'text-gray-400' },
};
