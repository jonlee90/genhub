'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import {
  searchHomeDepotProducts,
  getHomeDepotProduct,
  type HomeDepotProduct,
  type HomeDepotSearchParams
} from '@/lib/services/home-depot-api';
import type { Database } from '@/types/database.types';

type Material = Database['public']['Tables']['materials']['Row'];
type MaterialInsert = Database['public']['Tables']['materials']['Insert'];
type MaterialUpdate = Database['public']['Tables']['materials']['Update'];
type MaterialAssignment = Database['public']['Tables']['material_assignments']['Row'];
type MaterialAssignmentInsert = Database['public']['Tables']['material_assignments']['Insert'];
type MaterialAssignmentUpdate = Database['public']['Tables']['material_assignments']['Update'];
type ProcurementStatus = Database['public']['Enums']['procurement_status'];
type MaterialCategory = Database['public']['Enums']['material_category'];
type PurchaserType = Database['public']['Enums']['purchaser_type'];

// ============================================
// Validation Schemas
// ============================================

const createMaterialSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  product_description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  category: z.enum([
    'lumber', 'concrete', 'electrical', 'plumbing', 'hvac', 'roofing',
    'flooring', 'paint', 'hardware', 'tools', 'fixtures', 'insulation',
    'drywall', 'doors_windows', 'landscaping', 'other'
  ]),
  manufacturer: z.string().optional().nullable(),
  unit_price: z.number().min(0, 'Price must be positive'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  home_depot_product_id: z.string().optional().nullable(),
  home_depot_url: z.string().url().optional().nullable(),
  product_image_url: z.string().url().optional().nullable(),
  stock_status: z.string().optional().nullable(),
  lead_time_days: z.number().int().min(0).optional().nullable(),
  specifications: z.record(z.string(), z.any()).optional().nullable(),
});

const assignMaterialSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  task_id: z.string().uuid('Invalid task ID'),
  project_id: z.string().uuid('Invalid project ID'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  unit_cost: z.number().min(0, 'Unit cost must be positive'),
  procurement_status: z.enum(['needed', 'ordered', 'delivered', 'installed']).optional(),
  purchaser_type: z.enum(['gc', 'pm', 'subcontractor']),
  purchaser_id: z.string().uuid().optional().nullable(),
  subcontractor_id: z.string().uuid().optional().nullable(),
  estimated_delivery_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateMaterialAssignmentSchema = z.object({
  id: z.string().uuid('Invalid assignment ID'),
  quantity: z.number().min(0.01).optional(),
  procurement_status: z.enum(['needed', 'ordered', 'delivered', 'installed']).optional(),
  ordered_date: z.string().optional().nullable(),
  estimated_delivery_date: z.string().optional().nullable(),
  delivered_date: z.string().optional().nullable(),
  installed_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ============================================
// Home Depot Product Search
// ============================================

export async function searchProducts(searchParams: HomeDepotSearchParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const results = await searchHomeDepotProducts(searchParams);
    return { success: true, data: results };
  } catch (error) {
    console.error('Error searching products:', error);
    return { success: false, error: 'Failed to search products' };
  }
}

export async function getProductDetails(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const product = await getHomeDepotProduct(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return { success: false, error: 'Failed to fetch product details' };
  }
}

// ============================================
// Material CRUD Operations
// ============================================

export async function createMaterial(data: z.infer<typeof createMaterialSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = createMaterialSchema.parse(data);
    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: 'User not associated with a company' };
    }

    // Check permissions (GC Admin or PM)
    if (!['gc_admin', 'project_manager'].includes(companyUser.role)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Create material
    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        ...validated,
        company_id: companyUser.company_id,
        created_by: session.user.id,
        specifications: validated.specifications || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating material:', error);
      return { success: false, error: 'Failed to create material' };
    }

    revalidatePath('/app/materials');
    return { success: true, data: material };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('Error creating material:', error);
    return { success: false, error: 'Failed to create material' };
  }
}

export async function createMaterialFromHomeDepot(product: HomeDepotProduct) {
  try {
    // Debug logging to trace product serialization
    console.log('createMaterialFromHomeDepot called with product:', JSON.stringify(product, null, 2));
    console.log('Product name:', product?.name);
    console.log('Product id:', product?.id);
    console.log('Product price:', product?.price);

    // Validate required fields
    if (!product?.name) {
      console.error('Product name is missing or undefined');
      return { success: false, error: 'Product name is required' };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: 'User not associated with a company' };
    }

    // Map Home Depot category to our category enum
    const categoryMap: Record<string, MaterialCategory> = {
      'lumber': 'lumber',
      'concrete': 'concrete',
      'electrical': 'electrical',
      'plumbing': 'plumbing',
      'hvac': 'hvac',
      'roofing': 'roofing',
      'flooring': 'flooring',
      'paint': 'paint',
      'hardware': 'hardware',
      'drywall': 'drywall',
      'tools': 'tools',
      'fixtures': 'fixtures',
      'insulation': 'insulation',
      'doors_windows': 'doors_windows',
      'landscaping': 'landscaping',
    };

    const category = categoryMap[product.category] || 'other';

    // Check if material already exists
    const { data: existingMaterial } = await supabase
      .from('materials')
      .select('id')
      .eq('company_id', companyUser.company_id)
      .eq('home_depot_product_id', product.id)
      .single();

    if (existingMaterial) {
      return { success: true, data: existingMaterial, alreadyExists: true };
    }

    // Create material from Home Depot product
    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        company_id: companyUser.company_id,
        product_name: product.name,
        product_description: product.description,
        sku: product.sku,
        category,
        manufacturer: product.manufacturer,
        unit_price: product.price,
        unit_of_measure: product.unitOfMeasure,
        home_depot_product_id: product.id,
        home_depot_url: product.productUrl,
        product_image_url: product.imageUrl,
        stock_status: product.stockStatus,
        lead_time_days: product.leadTimeDays,
        specifications: product.specifications,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating material from Home Depot:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error: `Failed to create material: ${error.message || error.code || 'Unknown error'}` };
    }

    revalidatePath('/app/materials');
    return { success: true, data: material };
  } catch (error) {
    console.error('Error creating material from Home Depot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to create material: ${errorMessage}` };
  }
}

export async function getMaterialsByCompany() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching materials:', error);
      return { success: false, error: 'Failed to fetch materials' };
    }

    return { success: true, data: materials };
  } catch (error) {
    console.error('Error fetching materials:', error);
    return { success: false, error: 'Failed to fetch materials' };
  }
}

// ============================================
// Material Assignment Operations
// ============================================

export async function assignMaterialToTask(data: z.infer<typeof assignMaterialSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = assignMaterialSchema.parse(data);
    const supabase = await createClient();

    // Validate purchaser_type and subcontractor_id match
    if (validated.purchaser_type === 'subcontractor' && !validated.subcontractor_id) {
      return { success: false, error: 'Subcontractor ID required when purchaser type is subcontractor' };
    }

    // Create assignment - simplified select to avoid relation errors
    const { data: assignment, error } = await supabase
      .from('material_assignments')
      .insert({
        ...validated,
        assigned_by: session.user.id,
        procurement_status: validated.procurement_status || 'needed',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error assigning material:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error: `Failed to assign material: ${error.message || error.code || 'Unknown error'}` };
    }

    // Create notification for purchaser
    if (validated.purchaser_id) {
      await supabase.from('notifications').insert({
        user_id: validated.purchaser_id,
        type: 'material_assigned',
        title: 'Material Assigned',
        message: `You've been assigned to purchase materials for a task`,
        link: `/app/tasks/${validated.task_id}`,
      });
    }

    revalidatePath(`/app/tasks/${validated.task_id}`);
    revalidatePath(`/app/projects/${validated.project_id}`);
    revalidatePath('/app/materials');

    return { success: true, data: assignment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues);
      return { success: false, error: `Validation error: ${error.issues[0].message}` };
    }
    console.error('Error assigning material:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to assign material: ${errorMessage}` };
  }
}

export async function updateMaterialAssignment(data: z.infer<typeof updateMaterialAssignmentSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = updateMaterialAssignmentSchema.parse(data);
    const supabase = await createClient();

    // Get current assignment
    const { data: currentAssignment } = await supabase
      .from('material_assignments')
      .select('procurement_status, task_id, project_id, purchaser_id')
      .eq('id', validated.id)
      .single();

    // Update assignment
    const { data: assignment, error } = await supabase
      .from('material_assignments')
      .update(validated)
      .eq('id', validated.id)
      .select(`
        *,
        material:materials(*),
        task:tasks(id, title)
      `)
      .single();

    if (error) {
      console.error('Error updating material assignment:', error);
      return { success: false, error: 'Failed to update material assignment' };
    }

    // Send notification on status change
    if (
      currentAssignment &&
      validated.procurement_status &&
      validated.procurement_status !== currentAssignment.procurement_status
    ) {
      if (currentAssignment.purchaser_id) {
        const statusMessages: Record<ProcurementStatus, string> = {
          needed: 'Material marked as needed',
          ordered: 'Material has been ordered',
          delivered: 'Material has been delivered',
          installed: 'Material has been installed',
        };

        await supabase.from('notifications').insert({
          user_id: currentAssignment.purchaser_id,
          type: validated.procurement_status === 'delivered' ? 'material_delivered' : 'material_ordered',
          title: 'Material Status Updated',
          message: statusMessages[validated.procurement_status],
          link: `/app/tasks/${currentAssignment.task_id}`,
        });
      }
    }

    if (currentAssignment) {
      revalidatePath(`/app/tasks/${currentAssignment.task_id}`);
      revalidatePath(`/app/projects/${currentAssignment.project_id}`);
    }
    revalidatePath('/app/materials');

    return { success: true, data: assignment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('Error updating material assignment:', error);
    return { success: false, error: 'Failed to update material assignment' };
  }
}

export async function deleteMaterialAssignment(assignmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Get assignment details before deleting
    const { data: assignment } = await supabase
      .from('material_assignments')
      .select('task_id, project_id')
      .eq('id', assignmentId)
      .single();

    const { error } = await supabase
      .from('material_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting material assignment:', error);
      return { success: false, error: 'Failed to delete material assignment' };
    }

    if (assignment) {
      revalidatePath(`/app/tasks/${assignment.task_id}`);
      revalidatePath(`/app/projects/${assignment.project_id}`);
    }
    revalidatePath('/app/materials');

    return { success: true };
  } catch (error) {
    console.error('Error deleting material assignment:', error);
    return { success: false, error: 'Failed to delete material assignment' };
  }
}

export async function getMaterialAssignmentsByTask(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from('material_assignments')
      .select(`
        *,
        material:materials(*)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching material assignments:', error.message, error.details, error.hint);
      return { success: false, error: `Failed to fetch material assignments: ${error.message}` };
    }

    return { success: true, data: assignments };
  } catch (error) {
    console.error('Error fetching material assignments:', error);
    return { success: false, error: 'Failed to fetch material assignments' };
  }
}

export async function getMaterialAssignmentsByProject(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from('material_assignments')
      .select(`
        *,
        material:materials(*),
        task:tasks(id, title),
        purchaser:purchaser_id(id, name, email),
        subcontractor:subcontractors(id, company_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching material assignments:', error);
      return { success: false, error: 'Failed to fetch material assignments' };
    }

    return { success: true, data: assignments };
  } catch (error) {
    console.error('Error fetching material assignments:', error);
    return { success: false, error: 'Failed to fetch material assignments' };
  }
}

// ============================================
// Material Dashboard & Analytics
// ============================================

export async function getProjectMaterialSummary(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Call the database function
    const { data, error } = await supabase
      .rpc('get_project_material_summary', { project_uuid: projectId });

    if (error) {
      console.error('Error fetching material summary:', error);
      return { success: false, error: 'Failed to fetch material summary' };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error fetching material summary:', error);
    return { success: false, error: 'Failed to fetch material summary' };
  }
}

export async function getMaterialsByCategory(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from('material_assignments')
      .select(`
        total_cost,
        material:materials(category)
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching materials by category:', error);
      return { success: false, error: 'Failed to fetch materials by category' };
    }

    // Group by category
    const categoryTotals: Record<string, number> = {};
    assignments?.forEach((assignment: any) => {
      const category = assignment.material?.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(assignment.total_cost);
    });

    return { success: true, data: categoryTotals };
  } catch (error) {
    console.error('Error fetching materials by category:', error);
    return { success: false, error: 'Failed to fetch materials by category' };
  }
}

// ============================================
// Project Phases and Tasks for Assignment Modal
// ============================================

export async function getProjectPhases(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: phases, error } = await supabase
      .from('project_phases')
      .select('id, name')
      .eq('project_id', projectId)
      .order('order_index');

    if (error) {
      console.error('Error fetching project phases:', error);
      return { success: false, error: 'Failed to fetch project phases' };
    }

    return { success: true, data: phases };
  } catch (error) {
    console.error('Error fetching project phases:', error);
    return { success: false, error: 'Failed to fetch project phases' };
  }
}

export async function getPhaseTasks(phaseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, phase_id')
      .eq('phase_id', phaseId)
      .order('created_at');

    if (error) {
      console.error('Error fetching phase tasks:', error);
      return { success: false, error: 'Failed to fetch phase tasks' };
    }

    return { success: true, data: tasks };
  } catch (error) {
    console.error('Error fetching phase tasks:', error);
    return { success: false, error: 'Failed to fetch phase tasks' };
  }
}

// ============================================
// Task Materials Management (In-Modal)
// ============================================

/**
 * Get materials assigned to a specific task with full material details
 * Used by TaskMaterialsManager component
 */
export async function getTaskMaterials(taskId: string) {
  console.log('[getTaskMaterials] Fetching materials for task:', taskId);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('[getTaskMaterials] Unauthorized - no session');
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from('material_assignments')
      .select(`
        id,
        quantity,
        unit_cost,
        total_cost,
        procurement_status,
        purchaser_type,
        notes,
        created_at,
        material:materials(
          id,
          product_name,
          sku,
          category,
          unit_of_measure,
          product_image_url,
          stock_status,
          home_depot_product_id
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getTaskMaterials] Error:', error.message, error.details);
      return { success: false, error: `Failed to fetch task materials: ${error.message}` };
    }

    console.log('[getTaskMaterials] Found', assignments?.length || 0, 'materials');
    return { success: true, data: assignments || [] };
  } catch (error) {
    console.error('[getTaskMaterials] Unexpected error:', error);
    return { success: false, error: 'Failed to fetch task materials' };
  }
}

/**
 * Remove a material assignment from a task
 * Called from TaskMaterialsList component
 */
export async function removeMaterialFromTask(assignmentId: string) {
  console.log('[removeMaterialFromTask] Removing assignment:', assignmentId);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Get assignment details before deleting for path revalidation
    const { data: assignment, error: fetchError } = await supabase
      .from('material_assignments')
      .select('task_id, project_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      console.error('[removeMaterialFromTask] Assignment not found:', fetchError);
      return { success: false, error: 'Material assignment not found' };
    }

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from('material_assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      console.error('[removeMaterialFromTask] Delete error:', deleteError);
      return { success: false, error: 'Failed to remove material from task' };
    }

    // Revalidate relevant paths
    revalidatePath(`/app/tasks/${assignment.task_id}`);
    revalidatePath(`/app/projects/${assignment.project_id}`);
    revalidatePath('/app/materials');

    console.log('[removeMaterialFromTask] Successfully removed assignment');
    return { success: true };
  } catch (error) {
    console.error('[removeMaterialFromTask] Unexpected error:', error);
    return { success: false, error: 'Failed to remove material from task' };
  }
}

/**
 * Update the quantity of a material assignment
 * Called from TaskMaterialsList component when user edits quantity
 */
export async function updateMaterialQuantity(
  assignmentId: string,
  quantity: number
) {
  console.log('[updateMaterialQuantity] Updating assignment:', assignmentId, 'to quantity:', quantity);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (quantity <= 0) {
      return { success: false, error: 'Quantity must be greater than 0' };
    }

    const supabase = await createClient();

    // Update quantity (total_cost is auto-calculated via GENERATED column)
    const { data: assignment, error } = await supabase
      .from('material_assignments')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select(`
        id,
        quantity,
        unit_cost,
        total_cost,
        task_id,
        project_id
      `)
      .single();

    if (error) {
      console.error('[updateMaterialQuantity] Update error:', error);
      return { success: false, error: 'Failed to update material quantity' };
    }

    // Revalidate relevant paths
    if (assignment) {
      revalidatePath(`/app/tasks/${assignment.task_id}`);
      revalidatePath(`/app/projects/${assignment.project_id}`);
    }
    revalidatePath('/app/materials');

    console.log('[updateMaterialQuantity] Successfully updated quantity');
    return { success: true, data: assignment };
  } catch (error) {
    console.error('[updateMaterialQuantity] Unexpected error:', error);
    return { success: false, error: 'Failed to update material quantity' };
  }
}

/**
 * Add a Home Depot product to a task as a material
 * Creates material record if needed, then creates assignment
 */
export async function addProductToTask(
  product: HomeDepotProduct,
  taskId: string,
  projectId: string,
  quantity: number
) {
  console.log('[addProductToTask] Adding product to task:', {
    productId: product.id,
    productName: product.name,
    taskId,
    projectId,
    quantity
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (quantity <= 0) {
      return { success: false, error: 'Quantity must be greater than 0' };
    }

    // First, create or get the material record
    const materialResult = await createMaterialFromHomeDepot(product);

    if (!materialResult.success || !materialResult.data) {
      console.error('[addProductToTask] Failed to create/get material:', materialResult.error);
      return { success: false, error: materialResult.error || 'Failed to create material' };
    }

    const materialId = materialResult.data.id;
    console.log('[addProductToTask] Material ID:', materialId, 'alreadyExists:', materialResult.alreadyExists);

    // Check if this material is already assigned to this task
    const supabase = await createClient();
    const { data: existingAssignment } = await supabase
      .from('material_assignments')
      .select('id, quantity')
      .eq('material_id', materialId)
      .eq('task_id', taskId)
      .single();

    if (existingAssignment) {
      // Update quantity instead of creating duplicate
      console.log('[addProductToTask] Material already assigned, updating quantity');
      const newQuantity = existingAssignment.quantity + quantity;
      return await updateMaterialQuantity(existingAssignment.id, newQuantity);
    }

    // Create new assignment
    const assignmentResult = await assignMaterialToTask({
      material_id: materialId,
      task_id: taskId,
      project_id: projectId,
      quantity,
      unit_cost: product.price,
      purchaser_type: 'gc',
      procurement_status: 'needed',
    });

    if (!assignmentResult.success) {
      console.error('[addProductToTask] Failed to assign material:', assignmentResult.error);
      return { success: false, error: assignmentResult.error || 'Failed to assign material to task' };
    }

    console.log('[addProductToTask] Successfully added product to task');
    return { success: true, data: assignmentResult.data };
  } catch (error) {
    console.error('[addProductToTask] Unexpected error:', error);
    return { success: false, error: 'Failed to add product to task' };
  }
}
