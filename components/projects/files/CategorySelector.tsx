/**
 * CategorySelector Component
 * - Dropdown for category selection during upload
 * - Switches between document/photo categories
 */

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CategorySelectorProps {
  type: 'document' | 'photo';
  value: string;
  onChange: (value: string) => void;
}

const DOCUMENT_CATEGORIES = [
  { value: 'contracts', label: 'Contracts & Agreements' },
  { value: 'permits', label: 'Permits & Approvals' },
  { value: 'drawings', label: 'Drawings & Blueprints' },
  { value: 'reports', label: 'Reports' },
  { value: 'financial', label: 'Financial' },
  { value: 'safety', label: 'Safety & Compliance' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'specifications', label: 'Specifications' },
  { value: 'general', label: 'General' },
];

const PHOTO_CATEGORIES = [
  { value: 'site_progress', label: 'Site Progress' },
  { value: 'safety_documentation', label: 'Safety Documentation' },
  { value: 'permits_approvals', label: 'Permits & Approvals' },
  { value: 'inspection_reports', label: 'Inspection Reports' },
  { value: 'material_receipts', label: 'Material Receipts' },
  { value: 'change_orders', label: 'Change Orders' },
  { value: 'defects_issues', label: 'Defects/Issues' },
  { value: 'before_after', label: 'Before/After' },
  { value: 'general', label: 'General' },
];

export function CategorySelector({ type, value, onChange }: CategorySelectorProps) {
  const categories = type === 'document' ? DOCUMENT_CATEGORIES : PHOTO_CATEGORIES;

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-gray-500 uppercase">Category</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
