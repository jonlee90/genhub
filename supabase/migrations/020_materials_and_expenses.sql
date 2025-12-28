-- ============================================
-- Materials Management and Expense Tracking
-- Migration 020
-- Requirements 19-21: Materials with Home Depot Integration, AI OCR Expenses, Materials Dashboard
-- ============================================

-- ============================================
-- Part 1: Enums
-- ============================================

-- Material procurement status
CREATE TYPE public.procurement_status AS ENUM (
  'needed',
  'ordered',
  'delivered',
  'installed'
);

-- Material category (aligned with Home Depot categories)
CREATE TYPE public.material_category AS ENUM (
  'lumber',
  'concrete',
  'electrical',
  'plumbing',
  'hvac',
  'roofing',
  'flooring',
  'paint',
  'hardware',
  'tools',
  'fixtures',
  'insulation',
  'drywall',
  'doors_windows',
  'landscaping',
  'other'
);

-- Purchaser type
CREATE TYPE public.purchaser_type AS ENUM (
  'gc',
  'pm',
  'subcontractor'
);

-- Expense status
CREATE TYPE public.expense_status AS ENUM (
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'paid'
);

-- Expense category
CREATE TYPE public.expense_category AS ENUM (
  'materials',
  'labor',
  'equipment',
  'permits',
  'transportation',
  'meals',
  'lodging',
  'other'
);

-- ============================================
-- Part 2: Materials Tables
-- ============================================

-- Materials table (products from Home Depot or manual entry)
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Product information (from Home Depot or manual)
  product_name text NOT NULL,
  product_description text,
  sku text, -- Home Depot SKU or internal SKU
  category public.material_category NOT NULL DEFAULT 'other',
  manufacturer text,

  -- Pricing and availability
  unit_price numeric(10,2) NOT NULL,
  unit_of_measure text NOT NULL DEFAULT 'each', -- each, box, ft, sq ft, etc.

  -- Home Depot specific data
  home_depot_product_id text, -- Home Depot API product ID
  home_depot_url text,
  product_image_url text,
  stock_status text, -- 'in_stock', 'low_stock', 'out_of_stock', 'special_order'
  lead_time_days integer DEFAULT 0,

  -- Product specs (JSON for flexibility)
  specifications jsonb DEFAULT '{}',

  -- Metadata
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS materials_company_idx ON public.materials(company_id);
CREATE INDEX IF NOT EXISTS materials_category_idx ON public.materials(category);
CREATE INDEX IF NOT EXISTS materials_sku_idx ON public.materials(sku);
CREATE INDEX IF NOT EXISTS materials_home_depot_id_idx ON public.materials(home_depot_product_id);

COMMENT ON TABLE public.materials IS 'Materials and products from Home Depot or manual entry for project procurement';

-- Material assignments (linking materials to tasks)
CREATE TABLE IF NOT EXISTS public.material_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Assignment details
  quantity numeric(10,2) NOT NULL,
  unit_cost numeric(10,2) NOT NULL, -- Cost at time of assignment (may differ from current material.unit_price)
  total_cost numeric(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Procurement details
  procurement_status public.procurement_status NOT NULL DEFAULT 'needed',
  purchaser_type public.purchaser_type NOT NULL DEFAULT 'gc',
  purchaser_id uuid REFERENCES next_auth.users(id), -- Who is responsible for purchasing
  subcontractor_id uuid REFERENCES public.subcontractors(id), -- If purchased by subcontractor

  -- Tracking
  ordered_date timestamptz,
  estimated_delivery_date timestamptz,
  delivered_date timestamptz,
  installed_date timestamptz,

  -- Notes
  notes text,

  -- Metadata
  assigned_by uuid REFERENCES next_auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT material_assignments_purchaser_check CHECK (
    (purchaser_type = 'subcontractor' AND subcontractor_id IS NOT NULL) OR
    (purchaser_type != 'subcontractor' AND subcontractor_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS material_assignments_material_idx ON public.material_assignments(material_id);
CREATE INDEX IF NOT EXISTS material_assignments_task_idx ON public.material_assignments(task_id);
CREATE INDEX IF NOT EXISTS material_assignments_project_idx ON public.material_assignments(project_id);
CREATE INDEX IF NOT EXISTS material_assignments_status_idx ON public.material_assignments(procurement_status);
CREATE INDEX IF NOT EXISTS material_assignments_purchaser_idx ON public.material_assignments(purchaser_id);
CREATE INDEX IF NOT EXISTS material_assignments_subcontractor_idx ON public.material_assignments(subcontractor_id);

COMMENT ON TABLE public.material_assignments IS 'Links materials to tasks with procurement tracking and cost management';

-- ============================================
-- Part 3: Expense Tables
-- ============================================

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,

  -- Expense details
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  category public.expense_category NOT NULL DEFAULT 'other',
  expense_date date NOT NULL,

  -- Vendor information
  vendor_name text,
  vendor_address text,

  -- Receipt information
  receipt_url text, -- Stored in Supabase Storage
  receipt_ocr_data jsonb DEFAULT '{}', -- Extracted OCR data from AI
  ocr_confidence_score numeric(3,2), -- 0.00 to 1.00
  ocr_processed boolean NOT NULL DEFAULT false,

  -- Workflow
  status public.expense_status NOT NULL DEFAULT 'submitted',
  submitted_by uuid NOT NULL REFERENCES next_auth.users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES next_auth.users(id),
  reviewed_at timestamptz,
  approval_notes text,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_company_idx ON public.expenses(company_id);
CREATE INDEX IF NOT EXISTS expenses_project_idx ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS expenses_task_idx ON public.expenses(task_id);
CREATE INDEX IF NOT EXISTS expenses_status_idx ON public.expenses(status);
CREATE INDEX IF NOT EXISTS expenses_submitted_by_idx ON public.expenses(submitted_by);
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON public.expenses(expense_date DESC);

COMMENT ON TABLE public.expenses IS 'Expense tracking with AI OCR receipt processing and approval workflow';

-- Expense line items (extracted from receipts or manual entry)
CREATE TABLE IF NOT EXISTS public.expense_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL, -- Matched material from catalog
  material_assignment_id uuid REFERENCES public.material_assignments(id) ON DELETE SET NULL, -- Matched to specific assignment

  -- Line item details
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  -- AI matching
  matched_by_ai boolean NOT NULL DEFAULT false,
  match_confidence_score numeric(3,2), -- 0.00 to 1.00
  manually_matched boolean NOT NULL DEFAULT false,

  -- Extracted data from OCR
  ocr_extracted_data jsonb DEFAULT '{}',

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expense_line_items_expense_idx ON public.expense_line_items(expense_id);
CREATE INDEX IF NOT EXISTS expense_line_items_material_idx ON public.expense_line_items(material_id);
CREATE INDEX IF NOT EXISTS expense_line_items_assignment_idx ON public.expense_line_items(material_assignment_id);

COMMENT ON TABLE public.expense_line_items IS 'Individual line items from expense receipts with AI-powered material matching';

-- ============================================
-- Part 4: Update Enums for Notifications and Attachments
-- ============================================

-- Add new notification types for materials and expenses
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'material_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'material_delivered';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'material_ordered';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'expense_submitted';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'expense_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'expense_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'budget_overrun';

-- Add new attachment entity types
ALTER TYPE public.attachment_entity_type ADD VALUE IF NOT EXISTS 'material';
ALTER TYPE public.attachment_entity_type ADD VALUE IF NOT EXISTS 'expense';

-- ============================================
-- Part 5: Triggers for Updated_at
-- ============================================

-- Trigger for materials
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for material_assignments
CREATE TRIGGER update_material_assignments_updated_at
  BEFORE UPDATE ON public.material_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for expenses
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for expense_line_items
CREATE TRIGGER update_expense_line_items_updated_at
  BEFORE UPDATE ON public.expense_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Part 6: Automatic Budget Update Function
-- ============================================

-- Function to update task actual_cost when materials or expenses change
CREATE OR REPLACE FUNCTION update_task_costs()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the task's actual_cost by summing all material assignments and expenses
  UPDATE public.tasks t
  SET actual_cost = COALESCE(
    (SELECT SUM(total_cost)
     FROM public.material_assignments ma
     WHERE ma.task_id = t.id),
    0
  ) + COALESCE(
    (SELECT SUM(e.amount)
     FROM public.expenses e
     WHERE e.task_id = t.id AND e.status = 'approved'),
    0
  )
  WHERE t.id = COALESCE(NEW.task_id, OLD.task_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on material_assignments
CREATE TRIGGER update_task_costs_on_material_assignment
  AFTER INSERT OR UPDATE OR DELETE ON public.material_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_costs();

-- Trigger on expenses
CREATE TRIGGER update_task_costs_on_expense
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_task_costs();

-- ============================================
-- Part 7: Helper Functions
-- ============================================

-- Function to get project material summary
CREATE OR REPLACE FUNCTION get_project_material_summary(project_uuid uuid)
RETURNS TABLE (
  total_materials_cost numeric,
  materials_needed_count bigint,
  materials_ordered_count bigint,
  materials_delivered_count bigint,
  materials_installed_count bigint,
  total_expense_amount numeric,
  approved_expense_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ma.total_cost), 0) as total_materials_cost,
    COUNT(*) FILTER (WHERE ma.procurement_status = 'needed') as materials_needed_count,
    COUNT(*) FILTER (WHERE ma.procurement_status = 'ordered') as materials_ordered_count,
    COUNT(*) FILTER (WHERE ma.procurement_status = 'delivered') as materials_delivered_count,
    COUNT(*) FILTER (WHERE ma.procurement_status = 'installed') as materials_installed_count,
    COALESCE((SELECT SUM(e.amount) FROM public.expenses e WHERE e.project_id = project_uuid), 0) as total_expense_amount,
    COALESCE((SELECT SUM(e.amount) FROM public.expenses e WHERE e.project_id = project_uuid AND e.status = 'approved'), 0) as approved_expense_amount
  FROM public.material_assignments ma
  WHERE ma.project_id = project_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_project_material_summary IS 'Returns comprehensive material and expense summary for a project';
