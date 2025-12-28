// Project type templates with suggested tasks and configurations
// These templates provide starting points for different construction project types

export const PROJECT_TYPE_TEMPLATES = {
  residential: {
    name: 'Residential',
    description: 'Single-family homes, apartments, condos',
    phases: [
      'Initiation',
      'Pre-Construction',
      'Procurement',
      'Construction',
      'Post-Construction',
    ],
    suggestedTasks: {
      'Initiation': [
        'Initial client meeting',
        'Site assessment',
        'Preliminary budget review',
        'Contract preparation',
      ],
      'Pre-Construction': [
        'Obtain building permits',
        'Finalize architectural plans',
        'Create detailed schedule',
        'Order long-lead materials',
      ],
      'Procurement': [
        'Finalize subcontractor bids',
        'Order materials',
        'Schedule equipment delivery',
        'Confirm utility connections',
      ],
      'Construction': [
        'Site preparation',
        'Foundation work',
        'Framing',
        'Mechanical/Electrical/Plumbing rough-in',
        'Insulation and drywall',
        'Interior finishes',
        'Exterior work',
      ],
      'Post-Construction': [
        'Final inspections',
        'Punch list completion',
        'Client walkthrough',
        'Warranty documentation',
        'Project closeout',
      ],
    },
    defaultBudgetRange: { min: 50000, max: 500000 },
    estimatedDuration: '3-12 months',
  },

  restaurant_cafe: {
    name: 'Restaurant/Cafe',
    description: 'Restaurants, cafes, food service establishments',
    phases: [
      'Initiation',
      'Pre-Construction',
      'Procurement',
      'Construction',
      'Post-Construction',
    ],
    suggestedTasks: {
      'Initiation': [
        'Initial client meeting',
        'Concept development',
        'Health department pre-consultation',
        'Preliminary budget review',
      ],
      'Pre-Construction': [
        'Obtain building permits',
        'Health department approval',
        'Kitchen equipment planning',
        'HVAC requirements assessment',
        'Finalize design plans',
      ],
      'Procurement': [
        'Kitchen equipment ordering',
        'Furniture procurement',
        'Specialty finishes selection',
        'Point of sale system setup',
      ],
      'Construction': [
        'Demolition (if applicable)',
        'Electrical upgrade for kitchen',
        'Plumbing for food service',
        'HVAC installation',
        'Kitchen hood and fire suppression',
        'Floor drainage installation',
        'Walk-in cooler installation',
        'Interior buildout',
      ],
      'Post-Construction': [
        'Health department final inspection',
        'Fire marshal inspection',
        'Equipment testing',
        'Staff training coordination',
        'Grand opening preparation',
      ],
    },
    defaultBudgetRange: { min: 100000, max: 1000000 },
    estimatedDuration: '2-6 months',
  },

  commercial_office: {
    name: 'Commercial Office',
    description: 'Office buildings, retail spaces, commercial properties',
    phases: [
      'Initiation',
      'Pre-Construction',
      'Procurement',
      'Construction',
      'Post-Construction',
    ],
    suggestedTasks: {
      'Initiation': [
        'Initial client meeting',
        'Space planning consultation',
        'Lease review (if applicable)',
        'Budget development',
      ],
      'Pre-Construction': [
        'Obtain permits',
        'ADA compliance review',
        'Fire safety planning',
        'IT infrastructure planning',
        'HVAC assessment',
      ],
      'Procurement': [
        'Office furniture ordering',
        'IT equipment procurement',
        'Specialty finishes',
        'Security system selection',
      ],
      'Construction': [
        'Demolition (if applicable)',
        'Partition walls',
        'Electrical distribution',
        'Data cabling',
        'HVAC modifications',
        'Ceiling and lighting',
        'Flooring installation',
        'Painting and finishes',
      ],
      'Post-Construction': [
        'Final inspections',
        'Certificate of occupancy',
        'IT systems testing',
        'Security system activation',
        'Move-in coordination',
      ],
    },
    defaultBudgetRange: { min: 75000, max: 2000000 },
    estimatedDuration: '1-4 months',
  },

  industrial: {
    name: 'Industrial',
    description: 'Warehouses, factories, manufacturing facilities',
    phases: [
      'Initiation',
      'Pre-Construction',
      'Procurement',
      'Construction',
      'Post-Construction',
    ],
    suggestedTasks: {
      'Initiation': [
        'Initial client meeting',
        'Production flow analysis',
        'Environmental assessment',
        'Budget development',
      ],
      'Pre-Construction': [
        'Obtain permits',
        'Environmental permits (if required)',
        'Heavy equipment planning',
        'Utility capacity assessment',
        'Safety planning',
      ],
      'Procurement': [
        'Industrial equipment ordering',
        'Racking systems',
        'Specialty flooring',
        'Loading dock equipment',
      ],
      'Construction': [
        'Site preparation',
        'Foundation and slab work',
        'Steel erection',
        'Roofing',
        'High-voltage electrical',
        'Industrial plumbing',
        'Concrete flooring',
        'Loading dock installation',
        'Equipment installation',
      ],
      'Post-Construction': [
        'Equipment commissioning',
        'Safety certifications',
        'Fire marshal inspection',
        'Environmental compliance verification',
        'Staff safety training',
      ],
    },
    defaultBudgetRange: { min: 500000, max: 10000000 },
    estimatedDuration: '6-18 months',
  },
};

// Helper function to get template by project type
export function getProjectTemplate(projectType: keyof typeof PROJECT_TYPE_TEMPLATES) {
  return PROJECT_TYPE_TEMPLATES[projectType] || PROJECT_TYPE_TEMPLATES.residential;
}

// Get suggested tasks for a specific phase and project type
export function getSuggestedTasks(
  projectType: keyof typeof PROJECT_TYPE_TEMPLATES,
  phaseName: string
): string[] {
  const template = PROJECT_TYPE_TEMPLATES[projectType];
  if (!template || !template.suggestedTasks) return [];
  return template.suggestedTasks[phaseName as keyof typeof template.suggestedTasks] || [];
}
