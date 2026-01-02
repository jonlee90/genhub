/**
 * Default Project Templates
 *
 * This file contains the default phases and tasks for each project type.
 * When a new project is created, these templates are used to automatically
 * populate the project with standard phases and tasks.
 */

export type ProjectType = 'residential' | 'restaurant' | 'cafe' | 'commercial_office' | 'industrial';

export interface DefaultTask {
  title: string;
  description?: string;
}

export interface DefaultPhase {
  name: string;
  description: string;
  order_index: number;
  tasks: DefaultTask[];
}

export interface ProjectTemplate {
  phases: DefaultPhase[];
}

/**
 * Default project templates by project type
 */
export const DEFAULT_PROJECT_TEMPLATES: Record<ProjectType, ProjectTemplate> = {
  residential: {
    phases: [
      {
        name: 'Initiation',
        description: 'Project kickoff and initial planning',
        order_index: 0,
        tasks: [
          { title: 'Site Assessment' },
          { title: 'Preliminary Estimating' },
          { title: 'Proposal Submission' },
          { title: 'Sign Prime Contract' },
          { title: 'Concept Design' },
        ],
      },
      {
        name: 'Pre-construction',
        description: 'Planning and preparation before construction begins',
        order_index: 1,
        tasks: [
          { title: 'Permitting' },
          { title: 'Utility Setup' },
          { title: 'Site Logistics' },
          { title: 'Create Construction Schedule' },
        ],
      },
      {
        name: 'Procurement',
        description: 'Material and equipment procurement',
        order_index: 2,
        tasks: [
          { title: 'Material Takeoffs' },
          { title: 'Purchase Orders' },
        ],
      },
      {
        name: 'Construction',
        description: 'Active construction phase',
        order_index: 3,
        tasks: [
          { title: 'Foundation Inspection' },
          { title: 'Framing Walkthrough with Client' },
          { title: 'Insulation & Drywall Inspection' },
          { title: 'Quality Control Checks' },
          { title: 'Inspection Coordination' },
        ],
      },
      {
        name: 'Post-construction',
        description: 'Final inspections and project closeout',
        order_index: 4,
        tasks: [
          { title: '"Blue Tape" Walkthrough' },
          { title: 'Final Cleaning' },
          { title: 'Demobilization' },
          { title: 'Certificate of Occupancy' },
        ],
      },
    ],
  },
  restaurant: {
    phases: [
      {
        name: 'Initiation',
        description: 'Project kickoff and initial planning',
        order_index: 0,
        tasks: [
          { title: 'Site Assessment' },
          { title: 'Preliminary Estimating' },
          { title: 'Proposal Submission' },
          { title: 'Sign Prime Contract' },
          { title: 'Concept Design' },
        ],
      },
      {
        name: 'Pre-construction',
        description: 'Planning and preparation before construction begins',
        order_index: 1,
        tasks: [
          { title: 'Permitting' },
          { title: 'Health Dept Review' },
          { title: 'Fire Code Compliance' },
          { title: 'Utility Setup' },
          { title: 'Site Logistics' },
          { title: 'Create Construction Schedule' },
        ],
      },
      {
        name: 'Procurement',
        description: 'Material and equipment procurement',
        order_index: 2,
        tasks: [
          { title: 'Commercial Kitchen Equipment' },
          { title: 'Refrigeration Units' },
          { title: 'Cooking Ranges' },
          { title: 'Order Light Fixtures & Furniture' },
          { title: 'Award MEP Subcontractors' },
        ],
      },
      {
        name: 'Construction',
        description: 'Active construction phase',
        order_index: 3,
        tasks: [
          { title: 'Under-Slab Plumbing Inspection' },
          { title: 'Grease Trap Installation' },
          { title: 'Hood & Fire Suppression Install' },
          { title: 'Kitchen Wall Cover Inspection' },
          { title: 'Quality Control Checks' },
          { title: 'Inspection Coordination' },
        ],
      },
      {
        name: 'Post-construction',
        description: 'Final inspections and project closeout',
        order_index: 4,
        tasks: [
          { title: 'Equipment Commissioning' },
          { title: 'Health Sign-off' },
          { title: 'Final Fire Inspection' },
        ],
      },
    ],
  },
  cafe: {
    phases: [
      {
        name: 'Initiation',
        description: 'Project kickoff and initial planning',
        order_index: 0,
        tasks: [
          { title: 'Site Assessment' },
          { title: 'Preliminary Estimating' },
          { title: 'Proposal Submission' },
          { title: 'Sign Prime Contract' },
          { title: 'Concept Design' },
        ],
      },
      {
        name: 'Pre-construction',
        description: 'Planning and preparation before construction begins',
        order_index: 1,
        tasks: [
          { title: 'Permitting' },
          { title: 'Water Line Upgrades' },
          { title: 'Site Logistics' },
          { title: 'Create Construction Schedule' },
        ],
      },
      {
        name: 'Procurement',
        description: 'Material and equipment procurement',
        order_index: 2,
        tasks: [
          { title: 'Espresso Machine & Grinder' },
          { title: 'Coffee Brewing Equipment' },
          { title: 'Pastry Display Case' },
          { title: 'Order Light Fixtures & Furniture' },
          { title: 'Award MEP Subcontractors' },
        ],
      },
      {
        name: 'Construction',
        description: 'Active construction phase',
        order_index: 3,
        tasks: [
          { title: 'Coffee Bar Plumbing' },
          { title: 'Electrical for Espresso Equipment' },
          { title: 'Quality Control Checks' },
          { title: 'Inspection Coordination' },
        ],
      },
      {
        name: 'Post-construction',
        description: 'Final inspections and project closeout',
        order_index: 4,
        tasks: [
          { title: 'Espresso Machine Installation' },
          { title: 'Barista Equipment Training' },
          { title: 'Final Cleaning' },
        ],
      },
    ],
  },
  commercial_office: {
    phases: [
      {
        name: 'Initiation',
        description: 'Project kickoff and initial planning',
        order_index: 0,
        tasks: [
          { title: 'Site Assessment' },
          { title: 'Preliminary Estimating' },
          { title: 'Proposal Submission' },
          { title: 'Sign Prime Contract' },
          { title: 'Concept Design' },
        ],
      },
      {
        name: 'Pre-construction',
        description: 'Planning and preparation before construction begins',
        order_index: 1,
        tasks: [
          { title: 'Permitting' },
          { title: 'Health Dept Review' },
          { title: 'Utility Setup' },
          { title: 'Site Logistics' },
          { title: 'Create Construction Schedule' },
        ],
      },
      {
        name: 'Procurement',
        description: 'Material and equipment procurement',
        order_index: 2,
        tasks: [
          { title: 'Order Light Fixtures & Furniture' },
          { title: 'Award MEP Subcontractors' },
        ],
      },
      {
        name: 'Construction',
        description: 'Active construction phase',
        order_index: 3,
        tasks: [
          { title: 'Framing & Glazing' },
          { title: 'MEP Modifications' },
          { title: 'Quality Control Checks' },
          { title: 'Inspection Coordination' },
        ],
      },
      {
        name: 'Post-construction',
        description: 'Final inspections and project closeout',
        order_index: 4,
        tasks: [
          { title: 'Equipment Commissioning' },
          { title: 'Final Cleaning' },
        ],
      },
    ],
  },
  industrial: {
    phases: [
      {
        name: 'Initiation',
        description: 'Project kickoff and initial planning',
        order_index: 0,
        tasks: [
          { title: 'Site Assessment' },
          { title: 'Soil Report Review' },
          { title: 'Preliminary Estimating' },
          { title: 'Proposal Submission' },
          { title: 'Sign Prime Contract' },
          { title: 'Concept Design' },
        ],
      },
      {
        name: 'Pre-construction',
        description: 'Planning and preparation before construction begins',
        order_index: 1,
        tasks: [
          { title: 'Permitting' },
          { title: 'Utility Setup' },
          { title: 'Site Logistics' },
          { title: 'Create Construction Schedule' },
        ],
      },
      {
        name: 'Procurement',
        description: 'Material and equipment procurement',
        order_index: 2,
        tasks: [
          { title: 'Order Dock Equipment' },
          { title: 'Order Fire Sprinkler Pump/System' },
        ],
      },
      {
        name: 'Construction',
        description: 'Active construction phase',
        order_index: 3,
        tasks: [
          { title: 'Manage Mass Grading & Excavation' },
          { title: 'Foundation/Slab Pour' },
          { title: 'Quality Control Checks' },
          { title: 'Inspection Coordination' },
        ],
      },
      {
        name: 'Post-construction',
        description: 'Final inspections and project closeout',
        order_index: 4,
        tasks: [
          { title: 'Fire Marshall System Test' },
          { title: 'Flush & Pressure Test Water Lines' },
          { title: 'Final Cleaning' },
        ],
      },
    ],
  },
};

/**
 * Get the default template for a project type
 */
export function getProjectTemplate(projectType: ProjectType): ProjectTemplate {
  return DEFAULT_PROJECT_TEMPLATES[projectType];
}
