"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import {
  searchHomeDepotProducts,
  getHomeDepotProduct,
  type HomeDepotProduct,
  type HomeDepotSearchParams,
} from "@/lib/services/home-depot-api";
import type {
  MaterialsRow,
  MaterialAssignmentsRow,
} from "@/types/db/tables/materials";
import type { ProcurementStatus, MaterialCategory } from "@/types/db/enums";

type Material = MaterialsRow;
type MaterialAssignment = MaterialAssignmentsRow;

// ============================================
// Validation Schemas
// ============================================

const createMaterialSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  product_description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  category: z.enum([
    "lumber",
    "concrete",
    "electrical",
    "plumbing",
    "hvac",
    "roofing",
    "flooring",
    "paint",
    "hardware",
    "tools",
    "fixtures",
    "insulation",
    "drywall",
    "doors_windows",
    "landscaping",
    "other",
  ]),
  manufacturer: z.string().optional().nullable(),
  unit_price: z.number().min(0, "Price must be positive"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  home_depot_product_id: z.string().optional().nullable(),
  home_depot_url: z.string().url().optional().nullable(),
  product_image_url: z.string().url().optional().nullable(),
  stock_status: z.string().optional().nullable(),
  lead_time_days: z.number().int().min(0).optional().nullable(),
  specifications: z.record(z.string(), z.any()).optional().nullable(),
});

const assignMaterialSchema = z.object({
  material_id: z.string().uuid("Invalid material ID"),
  task_id: z.string().uuid("Invalid task ID"),
  project_id: z.string().uuid("Invalid project ID"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unit_cost: z.number().min(0, "Unit cost must be positive"),
  procurement_status: z
    .enum(["needed", "ordered", "delivered", "installed"])
    .optional(),
  purchaser_type: z.enum(["gc", "pm", "subcontractor"]),
  purchaser_id: z.string().uuid().optional().nullable(),
  subcontractor_id: z.string().uuid().optional().nullable(),
  estimated_delivery_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateMaterialAssignmentSchema = z.object({
  id: z.string().uuid("Invalid assignment ID"),
  quantity: z.number().min(0.01).optional(),
  procurement_status: z
    .enum(["needed", "ordered", "delivered", "installed"])
    .optional(),
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
      return { success: false, error: "Unauthorized" };
    }

    const results = await searchHomeDepotProducts(searchParams);
    return { success: true, data: results };
  } catch (error) {
    console.error("Error searching products:", error);
    return { success: false, error: "Failed to search products" };
  }
}

export async function getProductDetails(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const product = await getHomeDepotProduct(productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("Error fetching product details:", error);
    return { success: false, error: "Failed to fetch product details" };
  }
}

// ============================================
// Material CRUD Operations
// ============================================

export async function createMaterial(
  data: z.infer<typeof createMaterialSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createMaterialSchema.parse(data);
    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: "User not associated with a company" };
    }

    // Check permissions (Admin or PM)
    if (!["admin", "project_manager"].includes(companyUser.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Create material
    const { data: material, error } = await supabase
      .from("materials")
      .insert({
        ...validated,
        company_id: companyUser.company_id,
        created_by: session.user.id,
        specifications: validated.specifications || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating material:", error);
      return { success: false, error: "Failed to create material" };
    }

    revalidatePath("/app/materials");
    return { success: true, data: material };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error creating material:", error);
    return { success: false, error: "Failed to create material" };
  }
}

export async function createMaterialFromHomeDepot(product: HomeDepotProduct) {
  try {
    // Debug logging to trace product serialization
    console.log(
      "createMaterialFromHomeDepot called with product:",
      JSON.stringify(product, null, 2),
    );
    console.log("Product name:", product?.name);
    console.log("Product id:", product?.id);
    console.log("Product price:", product?.price);

    // Validate required fields
    if (!product?.name) {
      console.error("Product name is missing or undefined");
      return { success: false, error: "Product name is required" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: "User not associated with a company" };
    }

    // Map Home Depot category to our category enum
    const categoryMap: Record<string, MaterialCategory> = {
      lumber: "lumber",
      concrete: "concrete",
      electrical: "electrical",
      plumbing: "plumbing",
      hvac: "hvac",
      roofing: "roofing",
      flooring: "flooring",
      paint: "paint",
      hardware: "hardware",
      drywall: "drywall",
      tools: "tools",
      fixtures: "fixtures",
      insulation: "insulation",
      doors_windows: "doors_windows",
      landscaping: "landscaping",
    };

    const category = categoryMap[product.category] || "other";

    // Check if material already exists
    const { data: existingMaterial } = await supabase
      .from("materials")
      .select("id")
      .eq("company_id", companyUser.company_id)
      .eq("home_depot_product_id", product.id)
      .single();

    if (existingMaterial) {
      return { success: true, data: existingMaterial, alreadyExists: true };
    }

    // Create material from Home Depot product
    const { data: material, error } = await supabase
      .from("materials")
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
      console.error("Error creating material from Home Depot:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return {
        success: false,
        error: `Failed to create material: ${error.message || error.code || "Unknown error"}`,
      };
    }

    revalidatePath("/app/materials");
    return { success: true, data: material };
  } catch (error) {
    console.error("Error creating material from Home Depot:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to create material: ${errorMessage}`,
    };
  }
}

export async function getMaterialsByCompany() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get user's company_id for proper data isolation
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (companyError || !companyUser) {
      return { success: true, data: [] };
    }

    const { data: materials, error } = await supabase
      .from("materials")
      .select("*")
      .eq("company_id", companyUser.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching materials:", error);
      return { success: false, error: "Failed to fetch materials" };
    }

    return { success: true, data: materials };
  } catch (error) {
    console.error("Error fetching materials:", error);
    return { success: false, error: "Failed to fetch materials" };
  }
}

// ============================================
// Material Assignment Operations
// ============================================

export async function assignMaterialToTask(
  data: z.infer<typeof assignMaterialSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = assignMaterialSchema.parse(data);
    const supabase = await createClient();

    // Validate purchaser_type and subcontractor_id match
    if (
      validated.purchaser_type === "subcontractor" &&
      !validated.subcontractor_id
    ) {
      return {
        success: false,
        error: "Subcontractor ID required when purchaser type is subcontractor",
      };
    }

    // Create assignment - simplified select to avoid relation errors
    const { data: assignment, error } = await supabase
      .from("material_assignments")
      .insert({
        ...validated,
        assigned_by: session.user.id,
        procurement_status: validated.procurement_status || "needed",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error assigning material:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return {
        success: false,
        error: `Failed to assign material: ${error.message || error.code || "Unknown error"}`,
      };
    }

    // Create notification for purchaser
    if (validated.purchaser_id) {
      await supabase.from("notifications").insert({
        user_id: validated.purchaser_id,
        type: "material_assigned",
        title: "Material Assigned",
        message: `You've been assigned to purchase materials for a task`,
        link: `/app/tasks/${validated.task_id}`,
      });
    }

    revalidatePath(`/app/tasks/${validated.task_id}`);
    revalidatePath(`/app/projects/${validated.project_id}`);
    revalidatePath("/app/materials");

    return { success: true, data: assignment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", error.issues);
      return {
        success: false,
        error: `Validation error: ${error.issues[0].message}`,
      };
    }
    console.error("Error assigning material:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to assign material: ${errorMessage}`,
    };
  }
}

export async function updateMaterialAssignment(
  data: z.infer<typeof updateMaterialAssignmentSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateMaterialAssignmentSchema.parse(data);
    const supabase = await createClient();

    // Get current assignment
    const { data: currentAssignment } = await supabase
      .from("material_assignments")
      .select("procurement_status, task_id, project_id, purchaser_id")
      .eq("id", validated.id)
      .single();

    // Update assignment
    const { data: assignment, error } = await supabase
      .from("material_assignments")
      .update(validated)
      .eq("id", validated.id)
      .select(
        `
        *,
        material:materials(*),
        task:tasks(id, title)
      `,
      )
      .single();

    if (error) {
      console.error("Error updating material assignment:", error);
      return { success: false, error: "Failed to update material assignment" };
    }

    // Send notification on status change
    if (
      currentAssignment &&
      validated.procurement_status &&
      validated.procurement_status !== currentAssignment.procurement_status
    ) {
      if (currentAssignment.purchaser_id) {
        const statusMessages: Record<ProcurementStatus, string> = {
          needed: "Material marked as needed",
          ordered: "Material has been ordered",
          delivered: "Material has been delivered",
          installed: "Material has been installed",
        };

        await supabase.from("notifications").insert({
          user_id: currentAssignment.purchaser_id,
          type:
            validated.procurement_status === "delivered"
              ? "material_delivered"
              : "material_ordered",
          title: "Material Status Updated",
          message: statusMessages[validated.procurement_status],
          link: `/app/tasks/${currentAssignment.task_id}`,
        });
      }
    }

    if (currentAssignment) {
      revalidatePath(`/app/tasks/${currentAssignment.task_id}`);
      revalidatePath(`/app/projects/${currentAssignment.project_id}`);
    }
    revalidatePath("/app/materials");

    return { success: true, data: assignment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error updating material assignment:", error);
    return { success: false, error: "Failed to update material assignment" };
  }
}

export async function deleteMaterialAssignment(assignmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get assignment details before deleting
    const { data: assignment } = await supabase
      .from("material_assignments")
      .select("task_id, project_id")
      .eq("id", assignmentId)
      .single();

    const { error } = await supabase
      .from("material_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      console.error("Error deleting material assignment:", error);
      return { success: false, error: "Failed to delete material assignment" };
    }

    if (assignment) {
      revalidatePath(`/app/tasks/${assignment.task_id}`);
      revalidatePath(`/app/projects/${assignment.project_id}`);
    }
    revalidatePath("/app/materials");

    return { success: true };
  } catch (error) {
    console.error("Error deleting material assignment:", error);
    return { success: false, error: "Failed to delete material assignment" };
  }
}

export async function getMaterialAssignmentsByTask(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from("material_assignments")
      .select(
        `
        *,
        material:materials(*)
      `,
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Error fetching material assignments:",
        error.message,
        error.details,
        error.hint,
      );
      return {
        success: false,
        error: `Failed to fetch material assignments: ${error.message}`,
      };
    }

    return { success: true, data: assignments };
  } catch (error) {
    console.error("Error fetching material assignments:", error);
    return { success: false, error: "Failed to fetch material assignments" };
  }
}

export async function getMaterialAssignmentsByProject(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from("material_assignments")
      .select(
        `
        *,
        material:materials(*),
        task:tasks(id, title),
        purchaser:purchaser_id(id, name, email),
        subcontractor:subcontractors(id, company_name)
      `,
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching material assignments:", error);
      return { success: false, error: "Failed to fetch material assignments" };
    }

    return { success: true, data: assignments };
  } catch (error) {
    console.error("Error fetching material assignments:", error);
    return { success: false, error: "Failed to fetch material assignments" };
  }
}

// ============================================
// Material Dashboard & Analytics
// ============================================

export async function getProjectMaterialSummary(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Call the database function
    const { data, error } = await supabase.rpc("get_project_material_summary", {
      project_uuid: projectId,
    });

    if (error) {
      console.error("Error fetching material summary:", error);
      return { success: false, error: "Failed to fetch material summary" };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error fetching material summary:", error);
    return { success: false, error: "Failed to fetch material summary" };
  }
}

export async function getMaterialsByCategory(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from("material_assignments")
      .select(
        `
        total_cost,
        material:materials(category)
      `,
      )
      .eq("project_id", projectId);

    if (error) {
      console.error("Error fetching materials by category:", error);
      return { success: false, error: "Failed to fetch materials by category" };
    }

    // Group by category
    const categoryTotals: Record<string, number> = {};
    assignments?.forEach((assignment: any) => {
      const category = assignment.material?.category || "other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(assignment.total_cost);
    });

    return { success: true, data: categoryTotals };
  } catch (error) {
    console.error("Error fetching materials by category:", error);
    return { success: false, error: "Failed to fetch materials by category" };
  }
}

// ============================================
// Project Phases and Tasks for Assignment Modal
// ============================================

export async function getProjectPhases(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: phases, error } = await supabase
      .from("project_phases")
      .select("id, name")
      .eq("project_id", projectId)
      .order("order_index");

    if (error) {
      console.error("Error fetching project phases:", error);
      return { success: false, error: "Failed to fetch project phases" };
    }

    return { success: true, data: phases };
  } catch (error) {
    console.error("Error fetching project phases:", error);
    return { success: false, error: "Failed to fetch project phases" };
  }
}

export async function getPhaseTasks(phaseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title, phase_id")
      .eq("phase_id", phaseId)
      .order("created_at");

    if (error) {
      console.error("Error fetching phase tasks:", error);
      return { success: false, error: "Failed to fetch phase tasks" };
    }

    return { success: true, data: tasks };
  } catch (error) {
    console.error("Error fetching phase tasks:", error);
    return { success: false, error: "Failed to fetch phase tasks" };
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
  console.log("[getTaskMaterials] Fetching materials for task:", taskId);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log("[getTaskMaterials] Unauthorized - no session");
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from("material_assignments")
      .select(
        `
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
      `,
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getTaskMaterials] Error:", error.message, error.details);
      return {
        success: false,
        error: `Failed to fetch task materials: ${error.message}`,
      };
    }

    console.log(
      "[getTaskMaterials] Found",
      assignments?.length || 0,
      "materials",
    );
    return { success: true, data: assignments || [] };
  } catch (error) {
    console.error("[getTaskMaterials] Unexpected error:", error);
    return { success: false, error: "Failed to fetch task materials" };
  }
}

/**
 * Remove a material assignment from a task
 * Called from TaskMaterialsList component
 */
export async function removeMaterialFromTask(assignmentId: string) {
  console.log("[removeMaterialFromTask] Removing assignment:", assignmentId);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get assignment details before deleting for path revalidation
    const { data: assignment, error: fetchError } = await supabase
      .from("material_assignments")
      .select("task_id, project_id")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      console.error(
        "[removeMaterialFromTask] Assignment not found:",
        fetchError,
      );
      return { success: false, error: "Material assignment not found" };
    }

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from("material_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("[removeMaterialFromTask] Delete error:", deleteError);
      return { success: false, error: "Failed to remove material from task" };
    }

    // Revalidate relevant paths
    revalidatePath(`/app/tasks/${assignment.task_id}`);
    revalidatePath(`/app/projects/${assignment.project_id}`);
    revalidatePath("/app/materials");

    console.log("[removeMaterialFromTask] Successfully removed assignment");
    return { success: true };
  } catch (error) {
    console.error("[removeMaterialFromTask] Unexpected error:", error);
    return { success: false, error: "Failed to remove material from task" };
  }
}

/**
 * Update the quantity of a material assignment
 * Called from TaskMaterialsList component when user edits quantity
 */
export async function updateMaterialQuantity(
  assignmentId: string,
  quantity: number,
) {
  console.log(
    "[updateMaterialQuantity] Updating assignment:",
    assignmentId,
    "to quantity:",
    quantity,
  );

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }

    const supabase = await createClient();

    // Update quantity (total_cost is auto-calculated via GENERATED column)
    const { data: assignment, error } = await supabase
      .from("material_assignments")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .select(
        `
        id,
        quantity,
        unit_cost,
        total_cost,
        task_id,
        project_id
      `,
      )
      .single();

    if (error) {
      console.error("[updateMaterialQuantity] Update error:", error);
      return { success: false, error: "Failed to update material quantity" };
    }

    // Revalidate relevant paths
    if (assignment) {
      revalidatePath(`/app/tasks/${assignment.task_id}`);
      revalidatePath(`/app/projects/${assignment.project_id}`);
    }
    revalidatePath("/app/materials");

    console.log("[updateMaterialQuantity] Successfully updated quantity");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("[updateMaterialQuantity] Unexpected error:", error);
    return { success: false, error: "Failed to update material quantity" };
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
  quantity: number,
) {
  console.log("[addProductToTask] Adding product to task:", {
    productId: product.id,
    productName: product.name,
    taskId,
    projectId,
    quantity,
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }

    // First, create or get the material record
    const materialResult = await createMaterialFromHomeDepot(product);

    if (!materialResult.success || !materialResult.data) {
      console.error(
        "[addProductToTask] Failed to create/get material:",
        materialResult.error,
      );
      return {
        success: false,
        error: materialResult.error || "Failed to create material",
      };
    }

    const materialId = materialResult.data.id;
    console.log(
      "[addProductToTask] Material ID:",
      materialId,
      "alreadyExists:",
      materialResult.alreadyExists,
    );

    // Check if this material is already assigned to this task
    const supabase = await createClient();
    const { data: existingAssignment } = await supabase
      .from("material_assignments")
      .select("id, quantity")
      .eq("material_id", materialId)
      .eq("task_id", taskId)
      .single();

    if (existingAssignment) {
      // Update quantity instead of creating duplicate
      console.log(
        "[addProductToTask] Material already assigned, updating quantity",
      );
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
      purchaser_type: "gc",
      procurement_status: "needed",
    });

    if (!assignmentResult.success) {
      console.error(
        "[addProductToTask] Failed to assign material:",
        assignmentResult.error,
      );
      return {
        success: false,
        error: assignmentResult.error || "Failed to assign material to task",
      };
    }

    console.log("[addProductToTask] Successfully added product to task");
    return { success: true, data: assignmentResult.data };
  } catch (error) {
    console.error("[addProductToTask] Unexpected error:", error);
    return { success: false, error: "Failed to add product to task" };
  }
}

// ============================================
// P4.5 - SPATIAL MARKER INTEGRATION
// ============================================

/**
 * Link a material assignment to a spatial marker
 * @param assignmentId - Material assignment UUID
 * @param markerId - Spatial marker UUID
 */
export async function linkMaterialToMarker(
  assignmentId: string,
  markerId: string,
) {
  console.log(
    "[linkMaterialToMarker] Linking material assignment:",
    assignmentId,
    "to marker:",
    markerId,
  );

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Verify assignment exists and get its project
    const { data: assignment, error: assignmentError } = await supabase
      .from("material_assignments")
      .select("id, project_id")
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return { success: false, error: "Material assignment not found" };
    }

    // Verify marker exists and belongs to same project
    const { data: marker, error: markerError } = await supabase
      .from("spatial_markers")
      .select("id, project_id")
      .eq("id", markerId)
      .single();

    if (markerError || !marker) {
      return { success: false, error: "Spatial marker not found" };
    }

    if (marker.project_id !== assignment.project_id) {
      return {
        success: false,
        error: "Material assignment and marker must belong to the same project",
      };
    }

    // Update assignment with spatial_marker_id
    const { data: updatedAssignment, error: updateError } = await supabase
      .from("material_assignments")
      .update({ spatial_marker_id: markerId })
      .eq("id", assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error("[linkMaterialToMarker] Error:", updateError);
      return { success: false, error: "Failed to link material to marker" };
    }

    // Revalidate paths
    revalidatePath("/app/materials");
    revalidatePath(`/app/projects/${assignment.project_id}`);
    revalidatePath(`/app/projects/${assignment.project_id}/spatial`);

    console.log("[linkMaterialToMarker] Material linked successfully");
    return { success: true, data: updatedAssignment };
  } catch (error) {
    console.error("[linkMaterialToMarker] Unexpected error:", error);
    return { success: false, error: "Failed to link material to marker" };
  }
}

/**
 * Get all material assignments linked to a spatial marker
 * @param markerId - Spatial marker UUID
 */
export async function getMaterialsByMarker(markerId: string) {
  console.log(
    "[getMaterialsByMarker] Fetching materials for marker:",
    markerId,
  );

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Verify marker access by checking project access
    const { data: marker, error: markerError } = await supabase
      .from("spatial_markers")
      .select("id, project_id")
      .eq("id", markerId)
      .single();

    if (markerError || !marker) {
      return { success: false, error: "Spatial marker not found" };
    }

    // Get user's company to verify project access
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (!companyUser) {
      return { success: false, error: "No active company found" };
    }

    // Verify project belongs to user's company
    const { data: project } = await supabase
      .from("projects")
      .select("id, company_id")
      .eq("id", marker.project_id)
      .eq("company_id", companyUser.company_id)
      .single();

    if (!project) {
      return { success: false, error: "Project not found or access denied" };
    }

    // Fetch material assignments linked to this marker
    const { data: assignments, error } = await supabase
      .from("material_assignments")
      .select(
        `
        *,
        material:materials (
          id,
          product_name,
          product_description,
          sku,
          category,
          unit_price,
          unit_of_measure,
          product_image_url,
          stock_status,
          home_depot_product_id
        ),
        task:tasks (
          id,
          title,
          status
        )
      `,
      )
      .eq("spatial_marker_id", markerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getMaterialsByMarker] Error:", error);
      return { success: false, error: "Failed to fetch materials" };
    }

    console.log(
      "[getMaterialsByMarker] Found",
      assignments?.length || 0,
      "material assignments",
    );
    return { success: true, data: assignments || [] };
  } catch (error) {
    console.error("[getMaterialsByMarker] Unexpected error:", error);
    return { success: false, error: "Failed to fetch materials" };
  }
}

// ============================================
// TASK 0051 - MATERIALS ENHANCEMENT
// ============================================

// TypeScript interfaces for new server actions
export interface MaterialWithStats {
  material_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  stock_status: string;
  product_image_url?: string;
  total_quantity: number;
  task_count: number;
  is_tracked: boolean;
}

export interface TrackedMaterial {
  material_id: string;
  product_name: string;
  sku: string;
  current_price: number;
  previous_price: number | null;
  price_change_percent: number | null;
  product_image_url: string | null;
  stock_status: string;
  tracked_at: string;
}

export interface MaterialSummaryStats {
  total_materials_linked: number;
  total_estimated_cost: number;
  price_increases_last_7_days: number;
  average_lead_time_days: number;
}

const toggleTrackingSchema = z.object({
  material_id: z.string().uuid("Invalid material ID"),
  track: z.boolean(),
});

const updateLeadTimeSchema = z.object({
  material_id: z.string().uuid("Invalid material ID"),
  lead_time_days: z
    .number()
    .int()
    .min(0)
    .max(365, "Lead time must be between 0 and 365 days"),
});

/**
 * Get paginated list of task-linked materials sorted by quantity
 * @param page - Page number (1-based)
 * @param limit - Items per page (6-24, default 12)
 */
export async function getTaskLinkedMaterials(
  page: number = 1,
  limit: number = 12,
) {
  console.log("[getTaskLinkedMaterials] Fetching page:", page, "limit:", limit);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate pagination params
    if (page < 1) {
      return { success: false, error: "Page must be >= 1" };
    }
    if (limit < 6 || limit > 24) {
      return { success: false, error: "Limit must be between 6 and 24" };
    }

    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: "User not associated with a company" };
    }

    // Get all material assignments for the company
    const { data: assignments, error: assignmentsError } = await supabase
      .from("material_assignments")
      .select(
        `
        material_id,
        quantity,
        task_id,
        material:materials!inner (
          id,
          product_name,
          sku,
          unit_price,
          stock_status,
          product_image_url,
          home_depot_product_id,
          company_id
        )
      `,
      )
      .eq("material.company_id", companyUser.company_id);

    if (assignmentsError) {
      console.error(
        "[getTaskLinkedMaterials] Assignments error:",
        assignmentsError,
      );
      return { success: false, error: "Failed to fetch material assignments" };
    }

    // Aggregate by material_id
    const materialMap = new Map<string, MaterialWithStats>();

    for (const assignment of assignments || []) {
      const material = assignment.material as any;
      const materialId = assignment.material_id;

      if (!materialMap.has(materialId)) {
        materialMap.set(materialId, {
          material_id: materialId,
          product_name: material.product_name,
          sku: material.sku,
          unit_price: material.unit_price,
          stock_status: material.stock_status,
          product_image_url: material.product_image_url,
          total_quantity: 0,
          task_count: 0,
          is_tracked: false,
        });
      }

      const stats = materialMap.get(materialId)!;
      stats.total_quantity += assignment.quantity;
      stats.task_count++;
    }

    // Get tracking status for each material
    const { data: trackedMaterials } = await supabase
      .from("tracked_materials")
      .select("material_id")
      .eq("user_id", session.user.id);

    const trackedIds = new Set(
      (trackedMaterials || []).map((t) => t.material_id),
    );

    // Convert Map to array and mark tracked materials
    const materialsArray = Array.from(materialMap.values());

    for (const stats of materialsArray) {
      stats.is_tracked = trackedIds.has(stats.material_id);
    }

    // Sort by total_quantity DESC
    const sortedMaterials = materialsArray.sort(
      (a, b) => b.total_quantity - a.total_quantity,
    );

    // Paginate
    const total = sortedMaterials.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedMaterials = sortedMaterials.slice(offset, offset + limit);

    console.log(
      "[getTaskLinkedMaterials] Found",
      paginatedMaterials.length,
      "materials, total:",
      total,
    );
    return {
      success: true,
      data: {
        materials: paginatedMaterials,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error("[getTaskLinkedMaterials] Unexpected error:", error);
    return { success: false, error: "Failed to fetch task-linked materials" };
  }
}

/**
 * Get user's tracked materials (max 10) with price change indicators
 */
export async function getTrackedMaterials() {
  console.log("[getTrackedMaterials] Fetching tracked materials");

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get tracked materials with current and previous prices
    const { data: tracked, error } = await supabase
      .from("tracked_materials")
      .select(
        `
        material_id,
        tracked_at,
        material:materials (
          id,
          product_name,
          sku,
          unit_price,
          product_image_url,
          stock_status
        )
      `,
      )
      .eq("user_id", session.user.id)
      .order("tracked_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[getTrackedMaterials] Error:", error);
      return { success: false, error: "Failed to fetch tracked materials" };
    }

    // Calculate price changes
    const materialsWithPriceChange: TrackedMaterial[] = await Promise.all(
      (tracked || []).map(async (item: any) => {
        const material = item.material;
        const currentPrice = material.unit_price;

        // Get price from 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: priceHistory } = await supabase
          .from("material_price_history")
          .select("price")
          .eq("material_id", item.material_id)
          .lte("recorded_at", sevenDaysAgo.toISOString())
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();

        const previousPrice = priceHistory?.price || null;
        let priceChangePercent = null;

        if (previousPrice && previousPrice > 0) {
          priceChangePercent =
            ((currentPrice - previousPrice) / previousPrice) * 100;
        }

        return {
          material_id: item.material_id,
          product_name: material.product_name,
          sku: material.sku,
          current_price: currentPrice,
          previous_price: previousPrice,
          price_change_percent: priceChangePercent,
          product_image_url: material.product_image_url,
          stock_status: material.stock_status,
          tracked_at: item.tracked_at,
        };
      }),
    );

    console.log(
      "[getTrackedMaterials] Found",
      materialsWithPriceChange.length,
      "tracked materials",
    );
    return { success: true, data: materialsWithPriceChange };
  } catch (error) {
    console.error("[getTrackedMaterials] Unexpected error:", error);
    return { success: false, error: "Failed to fetch tracked materials" };
  }
}

/**
 * Toggle material tracking (add/remove from watchlist, max 10)
 * @param material_id - Material UUID
 * @param track - true to track, false to untrack
 */
export async function toggleTracking(material_id: string, track: boolean) {
  console.log("[toggleTracking] Material:", material_id, "track:", track);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = toggleTrackingSchema.parse({ material_id, track });
    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: "User not associated with a company" };
    }

    if (track) {
      // Check current count (trigger will also enforce, but provide better UX)
      const { count } = await supabase
        .from("tracked_materials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (count && count >= 10) {
        return {
          success: false,
          error:
            "Maximum 10 tracked materials allowed. Untrack one to add another.",
        };
      }

      // Verify material exists in user's company
      const { data: material, error: materialError } = await supabase
        .from("materials")
        .select("id, unit_price")
        .eq("id", material_id)
        .eq("company_id", companyUser.company_id)
        .single();

      if (materialError || !material) {
        return { success: false, error: "Material not found" };
      }

      // Insert tracking record
      const { error: trackError } = await supabase
        .from("tracked_materials")
        .insert({
          company_id: companyUser.company_id,
          user_id: session.user.id,
          material_id,
        });

      if (trackError) {
        // Handle duplicate tracking error
        if (trackError.code === "23505") {
          return { success: false, error: "Material is already being tracked" };
        }
        console.error("[toggleTracking] Track error:", trackError);
        return { success: false, error: "Failed to track material" };
      }

      // Note: Baseline price recording will be handled by scheduled job
      // RLS policy prevents regular users from inserting into material_price_history
      // Only service role can insert (for price sync jobs)

      console.log("[toggleTracking] Material tracked successfully");
    } else {
      // Untrack material
      const { error: untrackError } = await supabase
        .from("tracked_materials")
        .delete()
        .eq("user_id", session.user.id)
        .eq("material_id", material_id);

      if (untrackError) {
        console.error("[toggleTracking] Untrack error:", untrackError);
        return { success: false, error: "Failed to untrack material" };
      }

      console.log("[toggleTracking] Material untracked successfully");
    }

    revalidatePath("/app/materials");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[toggleTracking] Unexpected error:", error);
    return { success: false, error: "Failed to toggle material tracking" };
  }
}

/**
 * Get material summary statistics for dashboard
 */
export async function getMaterialSummaryStats() {
  console.log("[getMaterialSummaryStats] Fetching summary stats");

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: "User not associated with a company" };
    }

    // Get basic stats (total materials, total cost, avg lead time)
    const { data: basicStats, error: basicError } = await supabase
      .from("material_assignments")
      .select(
        `
        material_id,
        total_cost,
        material:materials (
          lead_time_days
        )
      `,
      )
      .in(
        "material_id",
        await supabase
          .from("materials")
          .select("id")
          .eq("company_id", companyUser.company_id)
          .then(({ data }) => data?.map((m) => m.id) || []),
      );

    if (basicError) {
      console.error("[getMaterialSummaryStats] Basic stats error:", basicError);
      return { success: false, error: "Failed to fetch material stats" };
    }

    // Calculate unique materials and total cost
    const uniqueMaterials = new Set(
      (basicStats || []).map((a: any) => a.material_id),
    );
    const totalMaterialsLinked = uniqueMaterials.size;
    const totalEstimatedCost = (basicStats || []).reduce(
      (sum: number, a: any) => sum + Number(a.total_cost || 0),
      0,
    );

    // Calculate average lead time (only for materials with assignments)
    const leadTimes = (basicStats || [])
      .map((a: any) => a.material?.lead_time_days)
      .filter((lt: any) => lt !== null && lt !== undefined);
    const averageLeadTimeDays =
      leadTimes.length > 0
        ? leadTimes.reduce((sum: number, lt: number) => sum + lt, 0) /
          leadTimes.length
        : 0;

    // Get price increases in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: materialsWithPrices, error: pricesError } = await supabase
      .from("materials")
      .select("id, unit_price")
      .eq("company_id", companyUser.company_id)
      .in("id", Array.from(uniqueMaterials));

    if (pricesError) {
      console.error("[getMaterialSummaryStats] Prices error:", pricesError);
    }

    let priceIncreasesLast7Days = 0;

    if (materialsWithPrices) {
      await Promise.all(
        materialsWithPrices.map(async (material: any) => {
          const { data: oldPrice } = await supabase
            .from("material_price_history")
            .select("price")
            .eq("material_id", material.id)
            .lte("recorded_at", sevenDaysAgo.toISOString())
            .order("recorded_at", { ascending: false })
            .limit(1)
            .single();

          if (oldPrice && oldPrice.price < material.unit_price) {
            priceIncreasesLast7Days++;
          }
        }),
      );
    }

    const stats: MaterialSummaryStats = {
      total_materials_linked: totalMaterialsLinked,
      total_estimated_cost: totalEstimatedCost,
      price_increases_last_7_days: priceIncreasesLast7Days,
      average_lead_time_days: Math.round(averageLeadTimeDays),
    };

    console.log("[getMaterialSummaryStats] Stats:", stats);
    return { success: true, data: stats };
  } catch (error) {
    console.error("[getMaterialSummaryStats] Unexpected error:", error);
    return { success: false, error: "Failed to fetch material summary stats" };
  }
}

/**
 * Manually update material lead time
 * @param material_id - Material UUID
 * @param lead_time_days - Lead time in days (0-365)
 */
export async function updateMaterialLeadTime(
  material_id: string,
  lead_time_days: number,
) {
  console.log(
    "[updateMaterialLeadTime] Material:",
    material_id,
    "lead time:",
    lead_time_days,
  );

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateLeadTimeSchema.parse({
      material_id,
      lead_time_days,
    });
    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: "User not associated with a company" };
    }

    // Update lead time
    const { data: material, error: updateError } = await supabase
      .from("materials")
      .update({ lead_time_days: validated.lead_time_days })
      .eq("id", validated.material_id)
      .eq("company_id", companyUser.company_id)
      .select("id, product_name, lead_time_days")
      .single();

    if (updateError) {
      console.error("[updateMaterialLeadTime] Update error:", updateError);
      return { success: false, error: "Failed to update material lead time" };
    }

    if (!material) {
      return { success: false, error: "Material not found" };
    }

    revalidatePath("/app/materials");
    console.log("[updateMaterialLeadTime] Lead time updated successfully");
    return { success: true, data: material };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[updateMaterialLeadTime] Unexpected error:", error);
    return { success: false, error: "Failed to update material lead time" };
  }
}
