-- GenHub PWA: Database Triggers and Functions
-- Auto-update timestamps, create default phases, update completion percentages
-- Created: 2025-12-04

-- ============================================
-- 1. Updated At Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON public.company_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractors_updated_at
  BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Auto-Create Default Project Phases
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_project_phases()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the 5 universal phases for new projects
  INSERT INTO public.project_phases (project_id, name, display_order, status)
  VALUES
    (NEW.id, 'Initiation', 1, 'not_started'),
    (NEW.id, 'Pre-Construction', 2, 'not_started'),
    (NEW.id, 'Procurement', 3, 'not_started'),
    (NEW.id, 'Construction', 4, 'not_started'),
    (NEW.id, 'Post-Construction', 5, 'not_started');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_phases_on_project_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_default_project_phases();

-- ============================================
-- 3. Update Phase Completion Percentage
-- ============================================

CREATE OR REPLACE FUNCTION public.update_phase_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_percentage integer;
  phase_id_to_update uuid;
BEGIN
  -- Determine which phase to update
  IF TG_OP = 'DELETE' THEN
    phase_id_to_update := OLD.phase_id;
  ELSE
    phase_id_to_update := NEW.phase_id;
  END IF;

  -- Skip if no phase assigned
  IF phase_id_to_update IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count tasks in phase
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_tasks, completed_tasks
  FROM public.tasks
  WHERE phase_id = phase_id_to_update;

  -- Calculate percentage
  IF total_tasks > 0 THEN
    new_percentage := (completed_tasks * 100) / total_tasks;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update phase
  UPDATE public.project_phases
  SET
    completion_percentage = new_percentage,
    status = CASE
      WHEN new_percentage = 100 THEN 'completed'::public.phase_status
      WHEN new_percentage > 0 THEN 'in_progress'::public.phase_status
      ELSE 'not_started'::public.phase_status
    END
  WHERE id = phase_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_phase_completion_on_task_change
  AFTER INSERT OR UPDATE OF status, phase_id OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_phase_completion();

-- ============================================
-- 4. Update Project Completion Percentage
-- ============================================

CREATE OR REPLACE FUNCTION public.update_project_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_phases integer;
  total_percentage integer;
  new_percentage integer;
  project_id_to_update uuid;
BEGIN
  -- Determine which project to update
  IF TG_OP = 'DELETE' THEN
    project_id_to_update := OLD.project_id;
  ELSE
    project_id_to_update := NEW.project_id;
  END IF;

  -- Calculate average completion across phases
  SELECT COUNT(*), COALESCE(SUM(completion_percentage), 0)
  INTO total_phases, total_percentage
  FROM public.project_phases
  WHERE project_id = project_id_to_update;

  -- Calculate percentage
  IF total_phases > 0 THEN
    new_percentage := total_percentage / total_phases;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update project
  UPDATE public.projects
  SET
    completion_percentage = new_percentage,
    status = CASE
      WHEN new_percentage = 100 THEN 'completed'::public.project_status
      ELSE status -- Keep current status if not 100%
    END
  WHERE id = project_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_project_completion_on_phase_change
  AFTER UPDATE OF completion_percentage OR DELETE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_project_completion();

-- ============================================
-- 5. Set Task Completed At Timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_completed_at_on_task_complete
  BEFORE UPDATE OF status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_completed_at();
