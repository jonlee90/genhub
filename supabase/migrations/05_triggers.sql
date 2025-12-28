-- ============================================
-- Part 5: Triggers and Functions
-- Run this FIFTH (last)
-- ============================================

-- ============================================
-- Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
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
-- Auto-create Project Phases Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_project_phases()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the 5 universal phases for every new project
  INSERT INTO public.project_phases (project_id, name, order_index, status)
  VALUES
    (NEW.id, 'Initiation', 0, 'not_started'),
    (NEW.id, 'Pre-Construction', 1, 'not_started'),
    (NEW.id, 'Procurement', 2, 'not_started'),
    (NEW.id, 'Construction', 3, 'not_started'),
    (NEW.id, 'Post-Construction', 4, 'not_started');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_project_phases
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_default_project_phases();

-- ============================================
-- Auto-update Phase Completion Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_phase_completion()
RETURNS TRIGGER AS $$
DECLARE
  phase_total integer;
  phase_completed integer;
  new_percentage integer;
BEGIN
  -- Get task counts for the affected phase
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO phase_total, phase_completed
  FROM public.tasks
  WHERE phase_id = COALESCE(NEW.phase_id, OLD.phase_id);

  -- Calculate new percentage
  IF phase_total > 0 THEN
    new_percentage := (phase_completed * 100) / phase_total;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update phase completion percentage
  UPDATE public.project_phases
  SET
    completion_percentage = new_percentage,
    status = CASE
      WHEN new_percentage = 100 THEN 'completed'::public.phase_status
      WHEN new_percentage > 0 THEN 'in_progress'::public.phase_status
      ELSE 'not_started'::public.phase_status
    END,
    completed_at = CASE
      WHEN new_percentage = 100 THEN now()
      ELSE NULL
    END
  WHERE id = COALESCE(NEW.phase_id, OLD.phase_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phase_completion_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_phase_completion();

-- ============================================
-- Auto-update Project Completion Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_project_completion()
RETURNS TRIGGER AS $$
DECLARE
  proj_id uuid;
  total_phases integer;
  completed_phases integer;
  total_completion integer;
  new_percentage integer;
BEGIN
  -- Get project_id from phase
  proj_id := COALESCE(NEW.project_id, OLD.project_id);

  -- Get phase stats
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COALESCE(SUM(completion_percentage), 0)
  INTO total_phases, completed_phases, total_completion
  FROM public.project_phases
  WHERE project_id = proj_id;

  -- Calculate new project percentage
  IF total_phases > 0 THEN
    new_percentage := total_completion / total_phases;
  ELSE
    new_percentage := 0;
  END IF;

  -- Update project completion percentage
  UPDATE public.projects
  SET
    completion_percentage = new_percentage,
    status = CASE
      WHEN new_percentage = 100 THEN 'completed'::public.project_status
      ELSE status
    END
  WHERE id = proj_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_completion_on_phase_change
  AFTER UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_project_completion();

-- ============================================
-- Auto-set Task Completed At Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at := now();
  -- Clear completed_at when status changes from completed
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completed_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_completed_at();
