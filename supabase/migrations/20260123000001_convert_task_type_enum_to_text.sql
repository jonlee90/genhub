DROP FUNCTION IF EXISTS create_phases_and_tasks_from_templates() CASCADE;
DROP FUNCTION IF EXISTS seed_company_templates(uuid) CASCADE;
DROP FUNCTION IF EXISTS seed_default_configs_for_company() CASCADE;

DROP INDEX IF EXISTS idx_tasks_type;

ALTER TABLE task_templates DROP COLUMN default_task_type;
ALTER TABLE task_templates ADD COLUMN default_task_type text DEFAULT 'work';

ALTER TABLE tasks DROP COLUMN task_type;
ALTER TABLE tasks ADD COLUMN task_type text NOT NULL DEFAULT 'work';

CREATE INDEX idx_tasks_type ON tasks(task_type);

DROP TYPE task_type CASCADE;

CREATE OR REPLACE FUNCTION public.seed_default_configs_for_company()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.project_type_configs (company_id, name, description, icon_name, color, is_default, order_index)
  VALUES
    (NEW.id, 'Residential', 'Homes & apartments', 'Home', '#3b82f6', true, 1),
    (NEW.id, 'Restaurant', 'Full-service dining', 'UtensilsCrossed', '#10b981', false, 2),
    (NEW.id, 'Cafe', 'Coffee & eateries', 'Coffee', '#f59e0b', false, 3),
    (NEW.id, 'Commercial Office', 'Office & retail', 'Building2', '#64748b', false, 4),
    (NEW.id, 'Industrial', 'Warehouse & factory', 'Factory', '#8b5cf6', false, 5);

  INSERT INTO public.task_type_configs (company_id, name, description, icon_name, color, is_default)
  VALUES
    (NEW.id, 'Work', 'Standard labor and construction tasks', 'Hammer', '#3b82f6', true),
    (NEW.id, 'Purchase', 'Materials, equipment, and supplies', 'ShoppingCart', '#10b981', false),
    (NEW.id, 'Approval', 'Permits, sign-offs, and inspections', 'ClipboardCheck', '#f59e0b', false),
    (NEW.id, 'Admin', 'Administrative and overhead tasks', 'FileText', '#64748b', false);

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS seed_configs_on_company_create ON public.companies;
CREATE TRIGGER seed_configs_on_company_create
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_configs_for_company();
