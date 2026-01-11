import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

interface DemoProject {
  name: string
  project_type: 'residential' | 'restaurant' | 'cafe' | 'commercial_office' | 'industrial'
  address: string
  city: string
  state: string
  zip_code: string
  client_name: string
  client_email: string
  client_phone: string
  budget: number
  status: 'active' | 'on_hold' | 'completed' | 'archived'
  health_score: number
  completion_percentage: number
  start_date: string
  end_date: string
}

const demoProjects: DemoProject[] = [
  // Residential (2)
  {
    name: 'Sunset Villa Residence',
    project_type: 'residential',
    address: '1234 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zip_code: '90028',
    client_name: 'Robert Anderson',
    client_email: 'r.anderson@email.com',
    client_phone: '(310) 555-0123',
    budget: 850000,
    status: 'active',
    health_score: 92,
    completion_percentage: 45,
    start_date: '2025-09-15',
    end_date: '2026-03-15'
  },
  {
    name: 'Oakwood Family Home',
    project_type: 'residential',
    address: '5678 Oak Street',
    city: 'Portland',
    state: 'OR',
    zip_code: '97201',
    client_name: 'Jennifer Martinez',
    client_email: 'j.martinez@email.com',
    client_phone: '(503) 555-0456',
    budget: 650000,
    status: 'active',
    health_score: 88,
    completion_percentage: 62,
    start_date: '2025-08-01',
    end_date: '2026-02-01'
  },
  // Restaurant (2)
  {
    name: 'Downtown Bistro',
    project_type: 'restaurant',
    address: '234 Pike Place',
    city: 'Seattle',
    state: 'WA',
    zip_code: '98101',
    client_name: 'Michael Chen',
    client_email: 'm.chen@downtownbistro.com',
    client_phone: '(206) 555-0789',
    budget: 450000,
    status: 'active',
    health_score: 85,
    completion_percentage: 38,
    start_date: '2025-10-01',
    end_date: '2026-04-01'
  },
  {
    name: 'Harbor View Seafood',
    project_type: 'restaurant',
    address: '890 Harbor Drive',
    city: 'San Diego',
    state: 'CA',
    zip_code: '92101',
    client_name: 'Sarah Johnson',
    client_email: 's.johnson@harborview.com',
    client_phone: '(619) 555-0234',
    budget: 680000,
    status: 'active',
    health_score: 91,
    completion_percentage: 55,
    start_date: '2025-09-01',
    end_date: '2026-03-01'
  },
  // Cafe (2)
  {
    name: 'Artisan Coffee Co',
    project_type: 'cafe',
    address: '456 South Congress Ave',
    city: 'Austin',
    state: 'TX',
    zip_code: '78704',
    client_name: 'David Wilson',
    client_email: 'd.wilson@artisancoffee.com',
    client_phone: '(512) 555-0567',
    budget: 145000,
    status: 'active',
    health_score: 94,
    completion_percentage: 72,
    start_date: '2025-11-01',
    end_date: '2026-01-15'
  },
  {
    name: 'Campus Corner Cafe',
    project_type: 'cafe',
    address: '789 Telegraph Ave',
    city: 'Berkeley',
    state: 'CA',
    zip_code: '94704',
    client_name: 'Emily Thompson',
    client_email: 'e.thompson@campuscorner.com',
    client_phone: '(510) 555-0890',
    budget: 180000,
    status: 'active',
    health_score: 87,
    completion_percentage: 58,
    start_date: '2025-10-15',
    end_date: '2026-02-15'
  },
  // Commercial Office (2)
  {
    name: 'Tech Hub Office Buildout',
    project_type: 'commercial_office',
    address: '101 Market Street, Suite 500',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    client_name: 'TechStart Ventures LLC',
    client_email: 'facilities@techstart.com',
    client_phone: '(415) 555-0123',
    budget: 1200000,
    status: 'active',
    health_score: 89,
    completion_percentage: 28,
    start_date: '2025-11-15',
    end_date: '2026-05-15'
  },
  {
    name: 'Financial District Suite',
    project_type: 'commercial_office',
    address: '250 Wall Street, Floor 12',
    city: 'New York',
    state: 'NY',
    zip_code: '10005',
    client_name: 'Capital Partners Group',
    client_email: 'office@capitalpartners.com',
    client_phone: '(212) 555-0456',
    budget: 890000,
    status: 'active',
    health_score: 93,
    completion_percentage: 41,
    start_date: '2025-10-01',
    end_date: '2026-04-01'
  },
  // Industrial (2)
  {
    name: 'Riverside Distribution Center',
    project_type: 'industrial',
    address: '3500 Industrial Parkway',
    city: 'Houston',
    state: 'TX',
    zip_code: '77032',
    client_name: 'Logistics Pro Inc',
    client_email: 'projects@logisticspro.com',
    client_phone: '(713) 555-0789',
    budget: 2800000,
    status: 'active',
    health_score: 86,
    completion_percentage: 19,
    start_date: '2025-12-01',
    end_date: '2026-08-01'
  },
  {
    name: 'Metro Manufacturing Plant',
    project_type: 'industrial',
    address: '8900 Manufacturing Drive',
    city: 'Detroit',
    state: 'MI',
    zip_code: '48201',
    client_name: 'Metro Industrial Solutions',
    client_email: 'construction@metroindustrial.com',
    client_phone: '(313) 555-0234',
    budget: 3500000,
    status: 'active',
    health_score: 90,
    completion_percentage: 15,
    start_date: '2025-11-20',
    end_date: '2026-09-20'
  }
]

const projectPhases = [
  { name: 'Initiation', order_index: 1, duration_days: 14 },
  { name: 'Planning', order_index: 2, duration_days: 21 },
  { name: 'Execution', order_index: 3, duration_days: 90 },
  { name: 'Monitoring', order_index: 4, duration_days: 30 },
  { name: 'Closeout', order_index: 5, duration_days: 14 }
]

const taskTemplates = {
  Initiation: [
    { title: 'Project Charter Development', priority: 'high', estimated_hours: 16 },
    { title: 'Stakeholder Identification', priority: 'high', estimated_hours: 8 },
    { title: 'Initial Site Survey', priority: 'medium', estimated_hours: 12 },
    { title: 'Feasibility Analysis', priority: 'medium', estimated_hours: 20 }
  ],
  Planning: [
    { title: 'Detailed Project Plan', priority: 'high', estimated_hours: 40 },
    { title: 'Budget Finalization', priority: 'high', estimated_hours: 24 },
    { title: 'Resource Allocation', priority: 'medium', estimated_hours: 16 },
    { title: 'Risk Assessment', priority: 'medium', estimated_hours: 12 },
    { title: 'Permit Applications', priority: 'high', estimated_hours: 20 }
  ],
  Execution: [
    { title: 'Site Preparation', priority: 'high', estimated_hours: 80 },
    { title: 'Foundation Work', priority: 'high', estimated_hours: 120 },
    { title: 'Structural Framing', priority: 'high', estimated_hours: 160 },
    { title: 'MEP Installation', priority: 'medium', estimated_hours: 200 },
    { title: 'Interior Finishes', priority: 'medium', estimated_hours: 180 },
    { title: 'Exterior Completion', priority: 'medium', estimated_hours: 100 }
  ],
  Monitoring: [
    { title: 'Quality Inspections', priority: 'high', estimated_hours: 40 },
    { title: 'Progress Reviews', priority: 'medium', estimated_hours: 32 },
    { title: 'Budget Tracking', priority: 'high', estimated_hours: 24 }
  ],
  Closeout: [
    { title: 'Final Inspections', priority: 'high', estimated_hours: 16 },
    { title: 'Client Walkthrough', priority: 'high', estimated_hours: 8 },
    { title: 'Documentation Handoff', priority: 'medium', estimated_hours: 12 },
    { title: 'Project Review', priority: 'low', estimated_hours: 8 }
  ]
}

async function getPhaseStatus(projectCompletion: number, phaseIndex: number): Promise<string> {
  const phaseCompletion = (projectCompletion / 100) * 5 // 5 phases total
  if (phaseCompletion > phaseIndex + 1) return 'completed'
  if (phaseCompletion > phaseIndex) return 'in_progress'
  return 'not_started'
}

async function getTaskStatus(phaseStatus: string, taskIndex: number, totalTasks: number): Promise<string> {
  if (phaseStatus === 'completed') return 'completed'
  if (phaseStatus === 'not_started') return 'todo'

  // For in_progress phases, make some tasks completed, some in_progress, some todo
  const progress = Math.random()
  if (taskIndex < totalTasks * 0.4) return 'completed'
  if (taskIndex < totalTasks * 0.7) return 'in_progress'
  return 'todo'
}

async function main() {
  try {
    console.log('🚀 Starting demo project creation...\n')

    // Step 1: Get the first user's information (for demo purposes)
    console.log('📋 Step 1: Getting user information...')

    // Get first company_user record
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('user_id, company_id')
      .limit(1)
      .single()

    if (companyError || !companyUser) {
      console.error('❌ Error getting company user:', companyError)
      return
    }

    const userId = companyUser.user_id
    const companyId = companyUser.company_id
    console.log(`✅ User ID: ${userId}`)
    console.log(`✅ Company ID: ${companyId}\n`)

    // Step 2: Delete existing projects and related data (cascade will handle most, but chat_rooms needs manual deletion)
    console.log('🗑️  Step 2: Deleting existing projects...')

    // First get all project IDs for this company
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('company_id', companyId)

    if (existingProjects && existingProjects.length > 0) {
      const projectIds = existingProjects.map(p => p.id)

      // Delete chat_rooms first (has FK constraint)
      await supabase
        .from('chat_rooms')
        .delete()
        .in('project_id', projectIds)

      // Now delete projects (cascade will handle the rest)
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('company_id', companyId)

      if (deleteError) {
        console.error('❌ Error deleting projects:', deleteError)
      } else {
        console.log(`✅ Deleted ${existingProjects.length} existing projects\n`)
      }
    } else {
      console.log('✅ No existing projects to delete\n')
    }

    // Step 3: Create demo projects
    console.log('🏗️  Step 3: Creating demo projects...\n')

    let projectCount = 0
    let phaseCount = 0
    let taskCount = 0

    for (const projectData of demoProjects) {
      console.log(`  Creating: ${projectData.name}...`)

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          client_name: projectData.client_name,
          client_email: projectData.client_email,
          client_phone: projectData.client_phone,
          address: projectData.address,
          city: projectData.city,
          state: projectData.state,
          zip_code: projectData.zip_code,
          project_type: projectData.project_type,
          description: `Demo ${projectData.project_type} project in ${projectData.city}, ${projectData.state}`,
          status: projectData.status,
          health_score: projectData.health_score,
          completion_percentage: projectData.completion_percentage,
          budget: projectData.budget,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          company_id: companyId,
          created_by: userId
        })
        .select()
        .single()

      if (projectError) {
        console.error(`    ❌ Error creating project:`, projectError)
        continue
      }

      projectCount++
      console.log(`    ✅ Project created (ID: ${project.id})`)

      // Create phases for this project
      for (let i = 0; i < projectPhases.length; i++) {
        const phaseTemplate = projectPhases[i]
        const phaseStatus = await getPhaseStatus(projectData.completion_percentage, i)

        const { data: phase, error: phaseError } = await supabase
          .from('project_phases')
          .insert({
            project_id: project.id,
            name: phaseTemplate.name,
            description: `${phaseTemplate.name} phase for ${projectData.name}`,
            status: phaseStatus as "not_started" | "in_progress" | "completed" | "on_hold",
            order_index: phaseTemplate.order_index,
            completion_percentage: phaseStatus === 'completed' ? 100 : (phaseStatus === 'in_progress' ? 50 : 0),
            start_date: phaseStatus !== 'not_started' ? projectData.start_date : null,
            end_date: phaseStatus === 'completed' ? new Date(new Date(projectData.start_date).getTime() + phaseTemplate.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
          })
          .select()
          .single()

        if (phaseError) {
          console.error(`      ❌ Error creating phase:`, phaseError)
          continue
        }

        phaseCount++

        // Create tasks for this phase
        const phaseTasks = taskTemplates[phaseTemplate.name as keyof typeof taskTemplates] || []

        for (let j = 0; j < phaseTasks.length; j++) {
          const taskTemplate = phaseTasks[j]
          const taskStatus = await getTaskStatus(phaseStatus, j, phaseTasks.length)

          const { error: taskError } = await supabase
            .from('tasks')
            .insert({
              title: taskTemplate.title,
              description: `${taskTemplate.title} for ${phaseTemplate.name} phase`,
              status: taskStatus as "todo" | "in_progress" | "review" | "blocked" | "completed",
              priority: taskTemplate.priority as "low" | "medium" | "high" | "critical",
              project_id: project.id,
              phase_id: phase.id,
              estimated_hours: taskTemplate.estimated_hours,
              assignee_id: taskStatus !== 'todo' ? userId : null,
              due_date: new Date(new Date(projectData.start_date).getTime() + (i * 30 + j * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })

          if (taskError) {
            console.error(`        ❌ Error creating task:`, taskError)
          } else {
            taskCount++
          }
        }
      }

      console.log(`    ✅ Created ${projectPhases.length} phases with tasks\n`)
    }

    console.log('\n✅ Demo project creation complete!')
    console.log(`\n📊 Summary:`)
    console.log(`   • Projects created: ${projectCount}`)
    console.log(`   • Phases created: ${phaseCount}`)
    console.log(`   • Tasks created: ${taskCount}`)
    console.log(`\n🎉 Ready to use!`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

main()
