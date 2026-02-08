"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getUserContextWithUserClient as getUserContext } from "@/lib/auth-context";
import type {
  SubcontractorsInsert,
  SubcontractorsUpdate,
} from "@/types/db/tables/companies";

type SubcontractorInsert = SubcontractorsInsert;
type SubcontractorUpdate = SubcontractorsUpdate;

// ============================================
// Validation Schemas
// ============================================

const tradeTypeValues = [
  "general",
  "electrical",
  "plumbing",
  "hvac",
  "carpentry",
  "masonry",
  "roofing",
  "flooring",
  "painting",
  "drywall",
  "concrete",
  "landscaping",
  "demolition",
  "steel_work",
  "glass_glazing",
  "fire_protection",
  "insulation",
  "framing",
  "other",
] as const;

const createSubcontractorSchema = z.object({
  company_name: z
    .string()
    .min(1, "Company name is required")
    .max(200)
    .transform((v) => v.trim()),
  contact_name: z
    .string()
    .min(1, "Contact name is required")
    .max(200)
    .transform((v) => v.trim()),
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim())
    .optional(),
  phone: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  address: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  trade_specialization: z.enum(tradeTypeValues, {
    errorMap: () => ({ message: "Please select a trade specialization" }),
  }),
  license_number: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  license_expiry: z.string().optional(), // ISO date string
  insurance_provider: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  insurance_expiry: z.string().optional(), // ISO date string
  performance_rating: z.number().min(0).max(5).optional(),
  notes: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
});

const updateSubcontractorSchema = z.object({
  id: z.string().uuid("Invalid subcontractor ID"),
  company_name: z
    .string()
    .min(1, "Company name is required")
    .max(200)
    .transform((v) => v.trim())
    .optional(),
  contact_name: z
    .string()
    .min(1, "Contact name is required")
    .max(200)
    .transform((v) => v.trim())
    .optional(),
  // Email can be string (update), null (clear), or undefined (don't change)
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim())
    .nullable()
    .optional(),
  // Phone can be string (update), null (clear), or undefined (don't change)
  phone: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  // Address can be string (update), null (clear), or undefined (don't change)
  address: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  trade_specialization: z.enum(tradeTypeValues).optional(),
  license_number: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  license_expiry: z.string().nullable().optional(),
  insurance_provider: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  insurance_expiry: z.string().nullable().optional(),
  performance_rating: z.number().min(0).max(5).nullable().optional(),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? v.trim() : v)),
  certificate_of_insurance: z.string().nullable().optional(),
});

const deactivateSubcontractorSchema = z.object({
  id: z.string().uuid("Invalid subcontractor ID"),
});

const deleteSubcontractorSchema = z.object({
  id: z.string().uuid("Invalid subcontractor ID"),
});

const uploadDocumentSchema = z.object({
  subcontractor_id: z.string().uuid("Invalid subcontractor ID"),
  document_type: z.enum(["license", "insurance", "coi"], {
    message: 'Document type must be "license", "insurance", or "coi"',
  }),
});

// ============================================
// Helper Functions
// ============================================

// ============================================
// Server Actions
// ============================================

/**
 * Create a new subcontractor
 * Only Admins and Project Managers can create subcontractors
 *
 * @param formData - Form data containing subcontractor details
 * @returns Success with subcontractor data or error message
 */
export async function createSubcontractor(formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only Admin and Project Manager can create
  if (role !== "admin" && role !== "project_manager") {
    return {
      success: false,
      error:
        "Insufficient permissions. Only Admins and Project Managers can create subcontractors.",
    };
  }

  // Parse and validate form data
  const rawData = {
    company_name: formData.get("company_name"),
    contact_name: formData.get("contact_name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    trade_specialization: formData.get("trade_specialization"),
    license_number: formData.get("license_number") || undefined,
    license_expiry: formData.get("license_expiry") || undefined,
    insurance_provider: formData.get("insurance_provider") || undefined,
    insurance_expiry: formData.get("insurance_expiry") || undefined,
    performance_rating: formData.get("performance_rating")
      ? Number(formData.get("performance_rating"))
      : undefined,
    notes: formData.get("notes") || undefined,
  };

  const validation = createSubcontractorSchema.safeParse(rawData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { success: false, error: "Validation failed", fieldErrors: errors };
  }

  const data = validation.data;

  try {
    // Check if subcontractor with same email already exists in this company (only if email provided)
    if (data.email) {
      const { data: existingSubcontractor, error: checkError } = await supabase
        .from("subcontractors")
        .select("id, company_name, email, is_active")
        .eq("company_id", companyId)
        .eq("email", data.email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing subcontractor:", checkError);
        return {
          success: false,
          error: "Failed to check existing subcontractor. Please try again.",
        };
      }

      if (existingSubcontractor) {
        if (existingSubcontractor.is_active) {
          return {
            success: false,
            error: `A subcontractor with email ${data.email} already exists in your company.`,
          };
        } else {
          return {
            success: false,
            error: `A deactivated subcontractor with email ${data.email} exists. Please contact support to reactivate.`,
          };
        }
      }
    }

    // Create subcontractor
    const subcontractorInsert: SubcontractorInsert = {
      company_id: companyId,
      company_name: data.company_name,
      contact_name: data.contact_name,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      trade_specialization: data.trade_specialization || "general",
      license_number: data.license_number || null,
      license_expiry: data.license_expiry || null,
      insurance_provider: data.insurance_provider || null,
      insurance_expiry: data.insurance_expiry || null,
      performance_rating: data.performance_rating || null,
      notes: data.notes || null,
      is_active: true,
    };

    const { data: newSubcontractor, error: insertError } = await supabase
      .from("subcontractors")
      .insert(subcontractorInsert)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating subcontractor:", insertError);

      // Handle unique constraint violation (duplicate email)
      if (insertError.code === "23505") {
        return {
          success: false,
          error: `A subcontractor with email ${data.email} already exists in your company.`,
        };
      }

      return {
        success: false,
        error: "Failed to create subcontractor. Please try again.",
      };
    }

    // Revalidate paths
    revalidatePath("/app/team/subcontractors");
    revalidateTag(`subcontractors-${companyId}`, "max");

    return {
      success: true,
      message: `Subcontractor ${data.company_name} created successfully`,
      data: newSubcontractor,
    };
  } catch (error) {
    console.error("Unexpected error creating subcontractor:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Update an existing subcontractor
 * Only Admins and Project Managers can update subcontractors
 *
 * @param data - Object containing subcontractor ID and fields to update
 * @returns Success with updated subcontractor data or error message
 */
export async function updateSubcontractor(data: {
  id: string;
  company_name?: string;
  contact_name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  trade_specialization?: string;
  license_number?: string | null;
  license_expiry?: string | null;
  insurance_provider?: string | null;
  insurance_expiry?: string | null;
  performance_rating?: number | null;
  notes?: string | null;
}) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only Admin and Project Manager can update
  if (role !== "admin" && role !== "project_manager") {
    return {
      success: false,
      error:
        "Insufficient permissions. Only Admins and Project Managers can update subcontractors.",
    };
  }

  // Validate input
  const validation = updateSubcontractorSchema.safeParse(data);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { success: false, error: "Validation failed", fieldErrors: errors };
  }

  const validatedData = validation.data;
  const { id, ...updateFields } = validatedData;

  try {
    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from("subcontractors")
      .select("id, company_id, company_name, email, is_active")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error("Error fetching subcontractor:", fetchError);
      return {
        success: false,
        error: "Subcontractor not found in your company.",
      };
    }

    if (!existingSubcontractor.is_active) {
      return {
        success: false,
        error: "Cannot update an inactive subcontractor.",
      };
    }

    // Note: Email uniqueness is enforced by database constraint
    // Error code 23505 (unique violation) is handled below on line 415

    // Build update object (only include fields that were provided)
    const subcontractorUpdate: SubcontractorUpdate = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    // Update subcontractor
    const { data: updatedSubcontractor, error: updateError } = await supabase
      .from("subcontractors")
      .update(subcontractorUpdate)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating subcontractor:", updateError);

      // Handle unique constraint violation (duplicate email)
      if (updateError.code === "23505") {
        return {
          success: false,
          error: `Another subcontractor with email ${updateFields.email} already exists in your company.`,
        };
      }

      return {
        success: false,
        error: "Failed to update subcontractor. Please try again.",
      };
    }

    // Revalidate paths
    revalidatePath("/app/team/subcontractors");
    revalidateTag(`subcontractors-${companyId}`, "max");
    revalidateTag(`subcontractor-${id}`, "max");

    return {
      success: true,
      message: "Subcontractor updated successfully",
      data: updatedSubcontractor,
    };
  } catch (error) {
    console.error("Unexpected error updating subcontractor:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Deactivate a subcontractor (soft delete)
 * Only Admins can deactivate subcontractors
 *
 * @param id - ID of the subcontractor to deactivate
 * @returns Success or error message
 */
export async function deactivateSubcontractor(id: string) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only Admin can deactivate
  if (role !== "admin") {
    return {
      success: false,
      error:
        "Insufficient permissions. Only Admins can deactivate subcontractors.",
    };
  }

  // Validate input
  const validation = deactivateSubcontractorSchema.safeParse({ id });

  if (!validation.success) {
    return { success: false, error: "Invalid subcontractor ID" };
  }

  try {
    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from("subcontractors")
      .select("id, company_id, company_name, email, is_active")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error("Error fetching subcontractor:", fetchError);
      return {
        success: false,
        error: "Subcontractor not found in your company.",
      };
    }

    if (!existingSubcontractor.is_active) {
      return {
        success: false,
        error: "This subcontractor is already inactive.",
      };
    }

    // Check if subcontractor is assigned to any active projects
    // SECURITY: Fail-closed - if check fails, don't allow deactivation
    const { data: activeAssignments, error: assignmentError } = await supabase
      .from("project_team")
      .select("project_id, projects!inner(status)")
      .eq("subcontractor_id", id)
      .in("projects.status", ["active", "on_hold"]);

    if (assignmentError) {
      console.error("Error checking active assignments:", assignmentError);
      return {
        success: false,
        error:
          "Failed to verify project assignments. Please try again or contact support.",
      };
    }

    if (activeAssignments && activeAssignments.length > 0) {
      return {
        success: false,
        error: `Cannot deactivate subcontractor. They are assigned to ${activeAssignments.length} active project(s). Please remove them from projects first.`,
      };
    }

    // Deactivate subcontractor (soft delete)
    const { data: deactivatedSubcontractor, error: updateError } =
      await supabase
        .from("subcontractors")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
      console.error("Error deactivating subcontractor:", updateError);
      return {
        success: false,
        error: "Failed to deactivate subcontractor. Please try again.",
      };
    }

    // Revalidate paths
    revalidatePath("/app/team/subcontractors");
    revalidateTag(`subcontractors-${companyId}`, "max");
    revalidateTag(`subcontractor-${id}`, "max");

    return {
      success: true,
      message: `Subcontractor ${existingSubcontractor.company_name} deactivated successfully`,
      data: deactivatedSubcontractor,
    };
  } catch (error) {
    console.error("Unexpected error deactivating subcontractor:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Reactivate an inactive subcontractor
 * Only Admins can reactivate subcontractors
 *
 * @param id - ID of the subcontractor to reactivate
 * @returns Success or error message
 */
export async function reactivateSubcontractor(id: string) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only Admin can reactivate
  if (role !== "admin") {
    return {
      success: false,
      error:
        "Insufficient permissions. Only Admins can reactivate subcontractors.",
    };
  }

  // Validate input
  const validation = deactivateSubcontractorSchema.safeParse({ id });

  if (!validation.success) {
    return { success: false, error: "Invalid subcontractor ID" };
  }

  try {
    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from("subcontractors")
      .select("id, company_id, company_name, is_active")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error("Error fetching subcontractor:", fetchError);
      return {
        success: false,
        error: "Subcontractor not found in your company.",
      };
    }

    if (existingSubcontractor.is_active) {
      return {
        success: false,
        error: "This subcontractor is already active.",
      };
    }

    // Reactivate subcontractor
    const { data: reactivatedSubcontractor, error: updateError } =
      await supabase
        .from("subcontractors")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
      console.error("Error reactivating subcontractor:", updateError);
      return {
        success: false,
        error: "Failed to reactivate subcontractor. Please try again.",
      };
    }

    // Revalidate paths
    revalidatePath("/app/team/subcontractors");
    revalidateTag(`subcontractors-${companyId}`, "max");
    revalidateTag(`subcontractor-${id}`, "max");

    return {
      success: true,
      message: `Subcontractor ${existingSubcontractor.company_name} reactivated successfully`,
      data: reactivatedSubcontractor,
    };
  } catch (error) {
    console.error("Unexpected error reactivating subcontractor:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Permanently delete a subcontractor (hard delete)
 * Only Admins can permanently delete subcontractors
 * Subcontractor must be inactive (deactivated) first
 *
 * @param id - ID of the subcontractor to delete
 * @returns Success or error message
 */
export async function deleteSubcontractor(id: string) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only Admin can permanently delete
  if (role !== "admin") {
    return {
      success: false,
      error:
        "Insufficient permissions. Only Admins can permanently delete subcontractors.",
    };
  }

  // Validate input
  const validation = deleteSubcontractorSchema.safeParse({ id });

  if (!validation.success) {
    return { success: false, error: "Invalid subcontractor ID" };
  }

  try {
    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from("subcontractors")
      .select("id, company_id, company_name, is_active")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error("Error fetching subcontractor:", fetchError);
      return {
        success: false,
        error: "Subcontractor not found in your company.",
      };
    }

    // Must be inactive before permanent deletion
    if (existingSubcontractor.is_active) {
      return {
        success: false,
        error:
          "Cannot permanently delete an active subcontractor. Please deactivate first.",
      };
    }

    // Permanently delete the subcontractor
    const { error: deleteError } = await supabase
      .from("subcontractors")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting subcontractor:", deleteError);
      return {
        success: false,
        error: "Failed to delete subcontractor. Please try again.",
      };
    }

    // Revalidate paths
    revalidatePath("/app/team/subcontractors");
    revalidateTag(`subcontractors-${companyId}`, "max");

    return {
      success: true,
      message: `Subcontractor ${existingSubcontractor.company_name} permanently deleted`,
    };
  } catch (error) {
    console.error("Unexpected error deleting subcontractor:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Upload document for subcontractor (license or insurance)
 * Only Admins and Project Managers can upload documents
 *
 * @param formData - Form data containing file and document type
 * @returns Success with file URL or error message
 */
export async function uploadSubcontractorDocument(formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only Admin and Project Manager can upload
  if (role !== "admin" && role !== "project_manager") {
    return {
      success: false,
      error:
        "Insufficient permissions. Only Admins and Project Managers can upload documents.",
    };
  }

  try {
    const subcontractorId = formData.get("subcontractor_id") as string;
    const documentType = formData.get("document_type") as string;
    const file = formData.get("file") as File;

    // Validate required fields
    if (!subcontractorId || !documentType || !file) {
      return {
        success: false,
        error:
          "Missing required fields: subcontractor_id, document_type, or file",
      };
    }

    // Validate subcontractor_id and document_type with Zod
    const validation = uploadDocumentSchema.safeParse({
      subcontractor_id: subcontractorId,
      document_type: documentType,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: errors,
      };
    }

    const validatedDocumentType = validation.data.document_type;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: "File size exceeds 5MB limit" };
    }

    // Validate file type (PDF, images)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only PDF and images (JPEG, PNG) are allowed",
      };
    }

    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from("subcontractors")
      .select(
        "id, company_id, company_name, is_active, certificate_of_insurance",
      )
      .eq("id", subcontractorId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error("Error fetching subcontractor:", fetchError);
      return {
        success: false,
        error: "Subcontractor not found in your company.",
      };
    }

    if (!existingSubcontractor.is_active) {
      return {
        success: false,
        error: "Cannot upload documents for inactive subcontractor.",
      };
    }

    // Delete old document if it exists
    const oldDocumentUrl =
      validatedDocumentType === "coi"
        ? existingSubcontractor.certificate_of_insurance
        : null;

    if (oldDocumentUrl) {
      try {
        // Extract path from URL if it's a Supabase Storage URL
        const urlPath = oldDocumentUrl.split("/storage/v1/object/public/")[1];
        if (urlPath) {
          const [bucket, ...pathParts] = urlPath.split("/");
          const filePath = pathParts.join("/");
          await supabase.storage.from(bucket).remove([filePath]);
        }
      } catch (deleteError) {
        console.warn("Failed to delete old document:", deleteError);
        // Continue anyway - non-critical error
      }
    }

    // Upload file to Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${companyId}/subcontractors/${subcontractorId}/${validatedDocumentType}_${timestamp}_${sanitizedFileName}`;

    let publicUrl: string;
    try {
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading to Supabase Storage:", uploadError);
        return {
          success: false,
          error: "Failed to upload document. Please try again.",
        };
      }

      // Get public URL
      const {
        data: { publicUrl: url },
      } = supabase.storage.from("project-files").getPublicUrl(storagePath);

      publicUrl = url;
    } catch (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError);
      return {
        success: false,
        error: "Failed to upload document. Please try again.",
      };
    }

    // Update subcontractor with document URL
    const updateData: SubcontractorUpdate = {
      updated_at: new Date().toISOString(),
    };

    // Store the URL in the dedicated column based on document type
    if (validatedDocumentType === "license") {
      const licenseNumber = formData.get("license_number") as string;
      const licenseExpiry = formData.get("license_expiry") as string;

      // updateData.license_document_url = publicUrl; // TODO: Add this column
      if (licenseNumber) updateData.license_number = licenseNumber.trim();
      if (licenseExpiry) updateData.license_expiry = licenseExpiry;
    } else if (validatedDocumentType === "insurance") {
      const insuranceProvider = formData.get("insurance_provider") as string;
      const insuranceExpiry = formData.get("insurance_expiry") as string;

      // updateData.insurance_document_url = publicUrl; // TODO: Add this column
      if (insuranceProvider)
        updateData.insurance_provider = insuranceProvider.trim();
      if (insuranceExpiry) updateData.insurance_expiry = insuranceExpiry;
    } else if (validatedDocumentType === "coi") {
      // Certificate of Insurance
      updateData.certificate_of_insurance = publicUrl;
    }

    const { data: updatedSubcontractor, error: updateError } = await supabase
      .from("subcontractors")
      .update(updateData)
      .eq("id", subcontractorId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating subcontractor with document:", updateError);
      return {
        success: false,
        error: "Failed to save document reference. Please try again.",
      };
    }

    // Revalidate paths
    revalidatePath("/app/team/subcontractors");
    revalidateTag(`subcontractors-${companyId}`, "max");
    revalidateTag(`subcontractor-${subcontractorId}`, "max");

    const documentLabel =
      validatedDocumentType === "license"
        ? "License"
        : validatedDocumentType === "insurance"
          ? "Insurance"
          : "Certificate of Insurance";

    return {
      success: true,
      message: `${documentLabel} document uploaded successfully`,
      data: {
        url: publicUrl,
        subcontractor: updatedSubcontractor,
      },
    };
  } catch (error) {
    console.error("Unexpected error uploading document:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Delete subcontractor document (COI)
 * Removes file from storage and clears database reference
 */
export async function deleteSubcontractorDocument(
  subcontractorId: string,
  documentType: "coi",
) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only Admin and Project Manager can delete
  if (role !== "admin" && role !== "project_manager") {
    return {
      success: false,
      error:
        "Insufficient permissions. Only Admins and Project Managers can delete documents.",
    };
  }

  try {
    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from("subcontractors")
      .select("id, company_id, certificate_of_insurance")
      .eq("id", subcontractorId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error("Error fetching subcontractor:", fetchError);
      return {
        success: false,
        error: "Subcontractor not found in your company.",
      };
    }

    const documentUrl =
      documentType === "coi"
        ? existingSubcontractor.certificate_of_insurance
        : null;

    // Delete file from storage if it exists
    if (documentUrl) {
      try {
        // Extract path from URL if it's a Supabase Storage URL
        const urlPath = documentUrl.split("/storage/v1/object/public/")[1];
        if (urlPath) {
          const [bucket, ...pathParts] = urlPath.split("/");
          const filePath = pathParts.join("/");
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (deleteError) {
            console.warn("Failed to delete file from storage:", deleteError);
            // Continue anyway - we'll still clear the database reference
          }
        }
      } catch (deleteError) {
        console.warn("Failed to delete file from storage:", deleteError);
        // Continue anyway - we'll still clear the database reference
      }
    }

    // Update database to clear the document reference
    const updateData: SubcontractorUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (documentType === "coi") {
      updateData.certificate_of_insurance = null;
    }

    const { error: updateError } = await supabase
      .from("subcontractors")
      .update(updateData)
      .eq("id", subcontractorId);

    if (updateError) {
      console.error("Error clearing document reference:", updateError);
      return {
        success: false,
        error: "Failed to delete document reference. Please try again.",
      };
    }

    // Revalidate paths
    revalidatePath("/app/team/subcontractors");
    revalidateTag(`subcontractors-${companyId}`, "max");
    revalidateTag(`subcontractor-${subcontractorId}`, "max");

    return {
      success: true,
      message: "Certificate of Insurance deleted successfully",
    };
  } catch (error) {
    console.error("Unexpected error deleting document:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
