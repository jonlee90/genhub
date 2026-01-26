-- Migration: Update existing phase_templates with icon_name
-- Author: backend-engineer
-- Date: 2026-01-25
-- Purpose: Set icon_name for existing phase templates based on phase name

-- Update icons based on standard phase names
UPDATE public.phase_templates
SET icon_name = CASE
  WHEN name ILIKE '%site%set%up%' OR name ILIKE '%site%setup%' THEN 'ClipboardCheck'
  WHEN name ILIKE '%framing%' THEN 'Layers'
  WHEN name ILIKE '%mep%' OR name ILIKE '%rough%in%' OR name ILIKE '%rough-in%' THEN 'Wrench'
  WHEN name ILIKE '%fire%life%' OR name ILIKE '%fire%safety%' OR name ILIKE '%life%safety%' THEN 'HardHat'
  WHEN name ILIKE '%finishes%' OR name ILIKE '%finish%' THEN 'Rocket'
  -- Legacy phase names (fallback for old templates)
  WHEN name ILIKE '%initiation%' THEN 'Rocket'
  WHEN name ILIKE '%pre%construction%' OR name ILIKE '%site%prep%' THEN 'ClipboardCheck'
  WHEN name ILIKE '%procurement%' OR name ILIKE '%ordering%' OR name ILIKE '%purchasing%' THEN 'ShoppingCart'
  WHEN name ILIKE '%construction%' THEN 'FolderKanban'
  WHEN name ILIKE '%post%construction%' OR name ILIKE '%closeout%' OR name ILIKE '%completion%' THEN 'CheckCircle2'
  ELSE 'Layers' -- Default for unrecognized phases
END
WHERE icon_name IS NULL;

-- Add comment
COMMENT ON COLUMN public.phase_templates.icon_name IS
  'Lucide icon name for display (e.g., ClipboardCheck, Layers, Wrench, HardHat, Rocket)';
