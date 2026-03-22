-- Migration: Add material_id to estimate_line_items for Material Catalog Integration
-- Task: EST-P2-008 - Material Catalog Integration
-- Description: Add foreign key to materials table for catalog linking

-- Add material_id column
ALTER TABLE public.estimate_line_items
ADD COLUMN material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL;

-- Create index for faster lookups of line items by material
CREATE INDEX idx_estimate_line_items_material_id
ON public.estimate_line_items(material_id)
WHERE material_id IS NOT NULL;

-- Create index for finding unlinked items (for bulk matching)
CREATE INDEX idx_estimate_line_items_unlinked
ON public.estimate_line_items(estimate_id)
WHERE material_id IS NULL;

COMMENT ON COLUMN public.estimate_line_items.material_id IS 'Optional link to materials catalog for automatic price updates';
