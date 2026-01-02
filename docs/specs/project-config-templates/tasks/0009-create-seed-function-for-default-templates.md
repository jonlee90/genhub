# Task 1.9: Create seed function for default templates

## Objective
Create a seeding function that populates default project types, task types, phase templates, and task templates for a company.

## References
- Requirements §1.8, 2.6, 3.9, 4.9 (Seeding defaults)
- Design Migration 5
- `lib/default-project-templates.ts` (reference for default data)

## Implementation Details

### Files to Create
- `supabase/migrations/039_seed_default_templates.sql`

### Seeding Function

Create function: `seed_company_templates(p_company_id uuid)`

**Function should insert:**

1. **4 Default Project Types:**
   - Residential (Home icon, #001B51 color)
   - Restaurant/Cafe (UtensilsCrossed icon, #001B51 color)
   - Commercial Office (Building2 icon, #001B51 color)
   - Industrial (Factory icon, #001B51 color)

2. **4 Default Task Types:**
   - work (Hammer icon, #3b82f6 color, is_default = true)
   - purchase (ShoppingCart icon, #10b981 color, is_default = true)
   - approval (ClipboardCheck icon, #f59e0b color, is_default = true)
   - admin (FileText icon, #6b7280 color, is_default = true)

3. **Phase Templates** for each project type:
   - Initiation
   - Pre-construction
   - Procurement
   - Construction
   - Post-construction

4. **Task Templates** for each phase (based on DEFAULT_PROJECT_TEMPLATES)

**Idempotency:**
- Use `ON CONFLICT (company_id, name) DO NOTHING` for project types and task types
- Check if templates already exist before inserting

**Trigger:**
- Create trigger `on_company_created_seed_templates`
- Fires AFTER INSERT on `companies` table
- Automatically calls `seed_company_templates(NEW.id)`

## Acceptance Criteria
- ✅ Function runs without errors
- ✅ Creates all 4 project types
- ✅ Creates all 4 task types
- ✅ Creates phase templates for each project type
- ✅ Creates task templates for each phase
- ✅ Function is idempotent (can run multiple times safely)
- ✅ Trigger fires on new company creation
- ✅ Migration file saved locally

## SQL Template Structure

```sql
-- Create seeding function
CREATE OR REPLACE FUNCTION seed_company_templates(p_company_id UUID)
RETURNS VOID AS $$
DECLARE
    v_project_type_id UUID;
    v_phase_id UUID;
BEGIN
    -- Insert project types
    -- Insert task types
    -- For each project type:
    --   Insert phase templates
    --   For each phase:
    --     Insert task templates
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_company_created_seed_templates
    AFTER INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION seed_company_templates(NEW.id);
```
