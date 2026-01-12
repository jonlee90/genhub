/**
 * Material Types - Shared type definitions for material components
 *
 * These types extend the database types with joined relations
 * commonly used in UI components.
 */

import type { Database } from './database.types';

// Base types from database
export type MaterialRow = Database['public']['Tables']['materials']['Row'];
export type MaterialAssignmentRow = Database['public']['Tables']['material_assignments']['Row'];

// Re-export MaterialWithStats from actions for consistency
export type { MaterialWithStats } from '@/app/actions/materials';

/**
 * Project selection option for material assignment
 */
export interface MaterialProject {
  id: string;
  name: string;
}

/**
 * Task selection option for material assignment
 */
export interface MaterialTask {
  id: string;
  title: string;
  phase_id: string | null;
}

/**
 * Phase selection option for material assignment
 */
export interface MaterialPhase {
  id: string;
  name: string;
  tasks?: MaterialTask[];
}

/**
 * Purchaser type for material assignments
 */
export type PurchaserType = 'gc' | 'pm' | 'subcontractor';

/**
 * Props for AssignMaterialModal component
 */
export interface AssignMaterialModalProps {
  product: {
    id: string;
    sku: string;
    name: string;
    description: string;
    category: string;
    manufacturer: string;
    price: number;
    unitOfMeasure: string;
    imageUrl: string;
    productUrl: string;
    stockStatus: 'in_stock' | 'out_of_stock' | 'limited' | 'special_order';
    stockQuantity?: number;
    leadTimeDays?: number;
    specifications?: Record<string, string>;
    rating?: number;
    reviewCount?: number;
  };
  projects: MaterialProject[];
  onClose: () => void;
}
