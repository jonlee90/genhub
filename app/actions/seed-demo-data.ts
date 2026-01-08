'use server';

/**
 * Seed Demo Data Server Action
 *
 * This action will:
 * 1. Delete all existing projects and related data
 * 2. Create 10 new realistic construction projects (2 per project type)
 * 3. Create phases and tasks for each project based on templates
 * 4. Link projects to default 3D models
 */

import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface DemoProject {
  name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  project_type: 'residential' | 'restaurant' | 'cafe' | 'commercial_office' | 'industrial';
  status: 'active' | 'in_progress' | 'planning';
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  actual_cost: number;
  health_score: number;
  completion_percentage: number;
}

const DEMO_PROJECTS: DemoProject[] = [
  // RESIDENTIAL (2)
  {
    name: 'Sunset Villa Residence',
    client_name: 'John & Sarah Martinez',
    client_email: 'john.martinez@email.com',
    client_phone: '555-0101',
    address: '1245 Sunset Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    zip_code: '90028',
    project_type: 'residential',
    status: 'active',
    description: 'Luxury 2-story custom home with modern amenities and smart home integration',
    start_date: '2026-01-15',
    end_date: '2026-08-30',
    budget: 850000.00,
    actual_cost: 325000.00,
    health_score: 88,
    completion_percentage: 35
  },
  {
    name: 'Oakwood Family Home',
    client_name: 'Michael & Emma Chen',
    client_email: 'emma.chen@email.com',
    client_phone: '555-0102',
    address: '789 Oakwood Drive',
    city: 'Portland',
    state: 'OR',
    zip_code: '97201',
    project_type: 'residential',
    status: 'in_progress',
    description: 'Traditional 2-story family home with basement and attached garage',
    start_date: '2025-11-01',
    end_date: '2026-06-15',
    budget: 620000.00,
    actual_cost: 480000.00,
    health_score: 92,
    completion_percentage: 65
  },
  // RESTAURANT (2)
  {
    name: 'Downtown Bistro',
    client_name: 'Restaurant Group LLC',
    client_email: 'contact@restaurantgroup.com',
    client_phone: '555-0201',
    address: '456 Main Street',
    city: 'Seattle',
    state: 'WA',
    zip_code: '98101',
    project_type: 'restaurant',
    status: 'active',
    description: 'Upscale French bistro with open kitchen, bar, and dining for 80 guests',
    start_date: '2026-02-01',
    end_date: '2026-07-15',
    budget: 720000.00,
    actual_cost: 280000.00,
    health_score: 85,
    completion_percentage: 40
  },
  {
    name: 'Harbor View Seafood',
    client_name: 'Coast Dining Inc',
    client_email: 'info@coastdining.com',
    client_phone: '555-0202',
    address: '2100 Waterfront Way',
    city: 'San Diego',
    state: 'CA',
    zip_code: '92101',
    project_type: 'restaurant',
    status: 'in_progress',
    description: 'Waterfront seafood restaurant with outdoor patio and full bar',
    start_date: '2025-10-15',
    end_date: '2026-05-30',
    budget: 980000.00,
    actual_cost: 720000.00,
    health_score: 78,
    completion_percentage: 72
  },
  // CAFE (2)
  {
    name: 'Artisan Coffee Co',
    client_name: 'Emily Johnson',
    client_email: 'emily@artisancoffee.com',
    client_phone: '555-0301',
    address: '123 Elm Street',
    city: 'Austin',
    state: 'TX',
    zip_code: '78701',
    project_type: 'cafe',
    status: 'active',
    description: 'Boutique coffee shop with espresso bar, pastry display, and cozy seating',
    start_date: '2026-01-20',
    end_date: '2026-04-30',
    budget: 185000.00,
    actual_cost: 92000.00,
    health_score: 90,
    completion_percentage: 48
  },
  {
    name: 'Campus Corner Cafe',
    client_name: 'University Plaza LLC',
    client_email: 'leasing@universityplaza.com',
    client_phone: '555-0302',
    address: '890 College Avenue',
    city: 'Berkeley',
    state: 'CA',
    zip_code: '94704',
    project_type: 'cafe',
    status: 'planning',
    description: 'Student-focused cafe with study areas, WiFi, and grab-and-go options',
    start_date: '2026-03-01',
    end_date: '2026-06-15',
    budget: 145000.00,
    actual_cost: 15000.00,
    health_score: 95,
    completion_percentage: 12
  },
  // COMMERCIAL OFFICE (2)
  {
    name: 'Tech Hub Office Buildout',
    client_name: 'Innovate Tech Corp',
    client_email: 'facilities@innovatetech.com',
    client_phone: '555-0401',
    address: '5000 Innovation Drive',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    project_type: 'commercial_office',
    status: 'active',
    description: 'Modern 3-floor tech office with open workspace, conference rooms, and amenities',
    start_date: '2026-01-05',
    end_date: '2026-09-20',
    budget: 1250000.00,
    actual_cost: 580000.00,
    health_score: 82,
    completion_percentage: 45
  },
  {
    name: 'Financial District Suite',
    client_name: 'Capital Advisors Group',
    client_email: 'ops@capitaladvisors.com',
    client_phone: '555-0402',
    address: '1200 Wall Street',
    city: 'New York',
    state: 'NY',
    zip_code: '10005',
    project_type: 'commercial_office',
    status: 'in_progress',
    description: 'Executive office suite with private offices, reception, and client meeting spaces',
    start_date: '2025-12-01',
    end_date: '2026-05-15',
    budget: 875000.00,
    actual_cost: 680000.00,
    health_score: 88,
    completion_percentage: 76
  },
  // INDUSTRIAL (2)
  {
    name: 'Riverside Distribution Center',
    client_name: 'Logistics Solutions Inc',
    client_email: 'pm@logisticssolutions.com',
    client_phone: '555-0501',
    address: '7500 Industrial Parkway',
    city: 'Houston',
    state: 'TX',
    zip_code: '77032',
    project_type: 'industrial',
    status: 'active',
    description: 'Large warehouse facility with loading docks, machinery area, and office section',
    start_date: '2026-02-15',
    end_date: '2026-11-30',
    budget: 2100000.00,
    actual_cost: 750000.00,
    health_score: 80,
    completion_percentage: 35
  },
  {
    name: 'Metro Manufacturing Plant',
    client_name: 'Advanced Manufacturing LLC',
    client_email: 'construction@advmfg.com',
    client_phone: '555-0502',
    address: '9200 Factory Road',
    city: 'Detroit',
    state: 'MI',
    zip_code: '48201',
    project_type: 'industrial',
    status: 'in_progress',
    description: 'Manufacturing facility with production floor, quality control lab, and utilities',
    start_date: '2025-09-01',
    end_date: '2026-08-31',
    budget: 3500000.00,
    actual_cost: 2800000.00,
    health_score: 75,
    completion_percentage: 78
  }
];

export async function seedDemoData() {
  try {
    // Get current user from NextAuth
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in to seed demo data' };
    }

    const userId = session.user.id;
    console.log('🔄 Seeding demo data for user:', userId);

    // Get Supabase admin client for database operations
    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (companyError || !companyUser) {
      console.error('❌ Company error:', companyError);
      return { error: 'You must belong to a company to seed demo data' };
    }

    const companyId = companyUser.company_id;
    console.log('✅ Found company:', companyId);

    // Step 1: Delete all existing projects (will cascade to phases, tasks, etc.)
    console.log('🗑️  Deleting existing projects...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { error: `Failed to delete existing projects: ${deleteError.message}` };
    }
    console.log('✅ Deleted all existing projects');

    // Step 2: Create 10 new projects
    console.log('📦 Creating 10 new demo projects...');
    const projectsToInsert = DEMO_PROJECTS.map(p => ({
      ...p,
      company_id: companyId,
      created_by: userId
    }));

    const { data: createdProjects, error: createError } = await supabase
      .from('projects')
      .insert(projectsToInsert)
      .select('id, name, project_type');

    if (createError || !createdProjects) {
      console.error('Create error:', createError);
      return { error: `Failed to create projects: ${createError?.message}` };
    }
    console.log(`✅ Created ${createdProjects.length} projects`);

    // Step 3: Get project type configs
    const { data: projectTypeConfigs, error: configError } = await supabase
      .from('project_type_configs')
      .select('id, name')
      .eq('company_id', companyId);

    if (configError || !projectTypeConfigs) {
      return { error: 'Failed to fetch project type configs' };
    }

    // Map project type names
    const configMap: Record<string, string> = {};
    projectTypeConfigs.forEach(config => {
      if (config.name === 'Residential') configMap['residential'] = config.id;
      if (config.name === 'Restaurant') configMap['restaurant'] = config.id;
      if (config.name === 'Cafe') configMap['cafe'] = config.id;
      if (config.name === 'Commercial Office') configMap['commercial_office'] = config.id;
      if (config.name === 'Industrial') configMap['industrial'] = config.id;
    });

    // Step 4: Create phases and tasks for each project
    console.log('📋 Creating phases and tasks...');
    for (const project of createdProjects) {
      const configId = configMap[project.project_type];
      if (!configId) {
        console.warn(`No config found for project type: ${project.project_type}`);
        continue;
      }

      // Get phase templates
      const { data: phaseTemplates, error: phaseError } = await supabase
        .from('phase_templates')
        .select('id, name, description, order_index')
        .eq('project_type_config_id', configId)
        .order('order_index', { ascending: true });

      if (phaseError || !phaseTemplates) {
        console.error(`Failed to fetch phase templates for ${project.name}`);
        continue;
      }

      // Create phases
      const phasesToInsert = phaseTemplates.map((template, index) => ({
        project_id: project.id,
        name: template.name,
        order_index: template.order_index,
        notes: template.description,
        status: index === 0 ? 'completed' : index === 1 ? 'in_progress' : 'not_started',
        completion_percentage: index === 0 ? 100 : index === 1 ? 45 : 0
      }));

      const { data: createdPhases, error: createPhaseError } = await supabase
        .from('project_phases')
        .insert(phasesToInsert as any)
        .select('id');

      if (createPhaseError || !createdPhases) {
        console.error(`Failed to create phases for ${project.name}`);
        continue;
      }

      // Create tasks for each phase
      for (let i = 0; i < phaseTemplates.length; i++) {
        const phaseTemplate = phaseTemplates[i];
        const createdPhase = createdPhases[i];

        // Get task templates
        const { data: taskTemplates, error: taskError } = await supabase
          .from('task_templates')
          .select('id, title, order_index')
          .eq('phase_template_id', phaseTemplate.id)
          .order('order_index', { ascending: true });

        if (taskError || !taskTemplates) {
          console.error(`Failed to fetch task templates for phase ${phaseTemplate.name}`);
          continue;
        }

        // Create tasks
        const tasksToInsert = taskTemplates.map((template, taskIndex) => {
          // Vary task statuses
          let status = 'todo';
          if (taskIndex % 5 === 0) status = 'completed';
          else if (taskIndex % 5 === 1) status = 'in_progress';
          else if (taskIndex % 5 === 2) status = 'blocked';

          // Vary priorities
          let priority = 'normal';
          if (taskIndex % 3 === 0) priority = 'high';
          else if (taskIndex % 3 === 2) priority = 'low';

          // Calculate due date (3 days apart)
          const daysFromNow = taskIndex * 3;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + daysFromNow);

          return {
            project_id: project.id,
            phase_id: createdPhase.id,
            title: template.title,
            status,
            priority,
            assignee_id: userId,
            due_date: dueDate.toISOString().split('T')[0],
            created_by: userId
          };
        });

        const { error: createTaskError } = await supabase
          .from('tasks')
          .insert(tasksToInsert as any);

        if (createTaskError) {
          console.error(`Failed to create tasks for phase ${phaseTemplate.name}`);
        }
      }

      console.log(`  ✅ Created phases and tasks for: ${project.name}`);
    }

    // Step 5: Link projects to default 3D models
    console.log('🎨 Linking projects to default 3D models...');
    const { data: defaultModels, error: modelsError } = await supabase
      .from('default_3d_models')
      .select('*')
      .eq('is_active', true);

    if (modelsError || !defaultModels) {
      console.error('Failed to fetch default models');
    } else {
      const modelMap: Record<string, any> = {};
      defaultModels.forEach(model => {
        modelMap[model.project_type] = model;
      });

      const project3DModelsToInsert = createdProjects.map(project => {
        const defaultModel = modelMap[project.project_type];
        if (!defaultModel) return null;

        return {
          project_id: project.id,
          version: 1,
          file_name: defaultModel.name,
          original_file_url: defaultModel.original_file_url,
          xkt_file_url: defaultModel.xkt_file_url,
          file_size_bytes: defaultModel.file_size_bytes,
          element_count: defaultModel.element_count,
          bounds: defaultModel.bounds,
          floors: defaultModel.floors,
          is_active: true,
          processing_status: 'ready'
        };
      }).filter(Boolean);

      if (project3DModelsToInsert.length > 0) {
        const { error: link3DError } = await supabase
          .from('projects_3d_models')
          .insert(project3DModelsToInsert as any);

        if (link3DError) {
          console.error('Failed to link 3D models:', link3DError);
        } else {
          console.log(`✅ Linked ${project3DModelsToInsert.length} projects to default 3D models`);
        }
      }
    }

    // Revalidate cache
    revalidatePath('/app/projects');
    revalidatePath('/app');

    console.log('🎉 Demo data seeding completed successfully!');

    return {
      success: true,
      message: `Successfully created ${createdProjects.length} demo projects with phases, tasks, and 3D models`
    };

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { error: `Unexpected error: ${error.message}` };
  }
}
