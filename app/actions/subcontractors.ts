'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createUserClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';
import { put, del } from '@vercel/blob';

type TradeType = Database['public']['Enums']['trade_type'];
type Subcontractor = Database['public']['Tables']['subcontractors']['Row'];
type SubcontractorInsert = Database['public']['Tables']['subcontractors']['Insert'];
type SubcontractorUpdate = Database['public']['Tables']['subcontractors']['Update'];

// ============================================
// Validation Schemas
// ============================================

const createSubcontractorSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200).transform((v) => v.trim()),
  trade_specialization: z.enum([
    'general',
    'electrical',
    'plumbing',
    'hvac',
    'carpentry',
    'masonry',
    'roofing',
    'flooring',
    'painting',
    'drywall',
    'concrete',
    'landscaping',
    'demolition',
    'steel_work',
    'glass_glazing',
    'fire_protection',
    'insulation',
    'other',
  ]),
  contact_name: z.string().min(1, 'Contact name is required').max(200).transform((v) => v.trim()),
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase().trim()),
  phone: z.string().optional().transform((v) => v ? v.trim() : v),
  address: z.string().optional().transform((v) => v ? v.trim() : v),
  license_number: z.string().optional().transform((v) => v ? v.trim() : v),
  license_expiry: z.string().optional(), // ISO date string
  insurance_provider: z.string().optional().transform((v) => v ? v.trim() : v),
  insurance_expiry: z.string().optional(), // ISO date string
  performance_rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional().transform((v) => v ? v.trim() : v),
});

const updateSubcontractorSchema = z.object({
  id: z.string().uuid('Invalid subcontractor ID'),
  company_name: z.string().min(1, 'Company name is required').max(200).transform((v) => v.trim()).optional(),
  trade_specialization: z.enum([
    'general',
    'electrical',
    'plumbing',
    'hvac',
    'carpentry',
    'masonry',
    'roofing',
    'flooring',
    'painting',
    'drywall',
    'concrete',
    'landscaping',
    'demolition',
    'steel_work',
    'glass_glazing',
    'fire_protection',
    'insulation',
    'other',
  ]).optional(),
  contact_name: z.string().min(1, 'Contact name is required').max(200).transform((v) => v.trim()).optional(),
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase().trim()).optional(),
  phone: z.string().optional().transform((v) => v ? v.trim() : v),
  address: z.string().optional().transform((v) => v ? v.trim() : v),
  license_number: z.string().optional().transform((v) => v ? v.trim() : v),
  license_expiry: z.string().optional(),
  insurance_provider: z.string().optional().transform((v) => v ? v.trim() : v),
  insurance_expiry: z.string().optional(),
  performance_rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional().transform((v) => v ? v.trim() : v),
});

const deactivateSubcontractorSchema = z.object({
  id: z.string().uuid('Invalid subcontractor ID'),
});

const uploadDocumentSchema = z.object({
  subcontractor_id: z.string().uuid('Invalid subcontractor ID'),
  document_type: z.enum(['license', 'insurance'], {
    message: 'Document type must be "license" or "insurance"'
  }),
});

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Create user-scoped Supabase client
  const supabase = await createUserClient();

  // Get user's company and role using NextAuth user ID
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    return { error: 'No active company found for user' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new subcontractor
 * Only GC Admins and Project Managers can create subcontractors
 *
 * @param formData - Form data containing subcontractor details
 * @returns Success with subcontractor data or error message
 */
export async function createSubcontractor(formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('User context error:', userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only GC Admin and Project Manager can create
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return {
      success: false,
      error: 'Insufficient permissions. Only GC Admins and Project Managers can create subcontractors.'
    };
  }

  // Parse and validate form data
  const rawData = {
    company_name: formData.get('company_name'),
    trade_specialization: formData.get('trade_specialization'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    address: formData.get('address') || undefined,
    license_number: formData.get('license_number') || undefined,
    license_expiry: formData.get('license_expiry') || undefined,
    insurance_provider: formData.get('insurance_provider') || undefined,
    insurance_expiry: formData.get('insurance_expiry') || undefined,
    performance_rating: formData.get('performance_rating')
      ? Number(formData.get('performance_rating'))
      : undefined,
    notes: formData.get('notes') || undefined,
  };

  const validation = createSubcontractorSchema.safeParse(rawData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { success: false, error: 'Validation failed', fieldErrors: errors };
  }

  const data = validation.data;

  try {
    // Check if subcontractor with same email already exists in this company
    const { data: existingSubcontractor, error: checkError } = await supabase
      .from('subcontractors')
      .select('id, company_name, email, is_active')
      .eq('company_id', companyId)
      .eq('email', data.email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing subcontractor:', checkError);
      return { success: false, error: 'Failed to check existing subcontractor. Please try again.' };
    }

    if (existingSubcontractor) {
      if (existingSubcontractor.is_active) {
        return {
          success: false,
          error: `A subcontractor with email ${data.email} already exists in your company.`
        };
      } else {
        return {
          success: false,
          error: `A deactivated subcontractor with email ${data.email} exists. Please contact support to reactivate.`
        };
      }
    }

    // Create subcontractor
    const subcontractorInsert: SubcontractorInsert = {
      company_id: companyId,
      company_name: data.company_name,
      trade_specialization: data.trade_specialization as TradeType,
      contact_name: data.contact_name,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      license_number: data.license_number || null,
      license_expiry: data.license_expiry || null,
      insurance_provider: data.insurance_provider || null,
      insurance_expiry: data.insurance_expiry || null,
      performance_rating: data.performance_rating || null,
      notes: data.notes || null,
      is_active: true,
    };

    const { data: newSubcontractor, error: insertError } = await supabase
      .from('subcontractors')
      .insert(subcontractorInsert)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating subcontractor:', insertError);

      // Handle unique constraint violation (duplicate email)
      if (insertError.code === '23505') {
        return {
          success: false,
          error: `A subcontractor with email ${data.email} already exists in your company.`
        };
      }

      return { success: false, error: 'Failed to create subcontractor. Please try again.' };
    }

    // Revalidate paths
    revalidatePath('/app/team/subcontractors');
    revalidateTag(`subcontractors-${companyId}`);

    return {
      success: true,
      message: `Subcontractor ${data.company_name} created successfully`,
      data: newSubcontractor,
    };

  } catch (error) {
    console.error('Unexpected error creating subcontractor:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Update an existing subcontractor
 * Only GC Admins and Project Managers can update subcontractors
 *
 * @param data - Object containing subcontractor ID and fields to update
 * @returns Success with updated subcontractor data or error message
 */
export async function updateSubcontractor(data: {
  id: string;
  company_name?: string;
  trade_specialization?: TradeType;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  license_number?: string;
  license_expiry?: string;
  insurance_provider?: string;
  insurance_expiry?: string;
  performance_rating?: number;
  notes?: string;
}) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('User context error:', userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only GC Admin and Project Manager can update
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return {
      success: false,
      error: 'Insufficient permissions. Only GC Admins and Project Managers can update subcontractors.'
    };
  }

  // Validate input
  const validation = updateSubcontractorSchema.safeParse(data);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { success: false, error: 'Validation failed', fieldErrors: errors };
  }

  const validatedData = validation.data;
  const { id, ...updateFields } = validatedData;

  try {
    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from('subcontractors')
      .select('id, company_id, company_name, email, is_active')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error('Error fetching subcontractor:', fetchError);
      return { success: false, error: 'Subcontractor not found in your company.' };
    }

    if (!existingSubcontractor.is_active) {
      return { success: false, error: 'Cannot update an inactive subcontractor.' };
    }

    // If email is being updated, check for conflicts
    if (updateFields.email && updateFields.email !== existingSubcontractor.email) {
      const { data: emailConflict, error: emailCheckError } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', updateFields.email)
        .neq('id', id)
        .maybeSingle();

      if (emailCheckError) {
        console.error('Error checking email conflict:', emailCheckError);
        return { success: false, error: 'Failed to validate email. Please try again.' };
      }

      if (emailConflict) {
        return {
          success: false,
          error: `Another subcontractor with email ${updateFields.email} already exists.`
        };
      }
    }

    // Build update object (only include fields that were provided)
    const subcontractorUpdate: SubcontractorUpdate = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    // Update subcontractor
    const { data: updatedSubcontractor, error: updateError } = await supabase
      .from('subcontractors')
      .update(subcontractorUpdate)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subcontractor:', updateError);

      // Handle unique constraint violation (duplicate email)
      if (updateError.code === '23505') {
        return {
          success: false,
          error: `Another subcontractor with email ${updateFields.email} already exists in your company.`
        };
      }

      return { success: false, error: 'Failed to update subcontractor. Please try again.' };
    }

    // Revalidate paths
    revalidatePath('/app/team/subcontractors');
    revalidateTag(`subcontractors-${companyId}`);
    revalidateTag(`subcontractor-${id}`);

    return {
      success: true,
      message: 'Subcontractor updated successfully',
      data: updatedSubcontractor,
    };

  } catch (error) {
    console.error('Unexpected error updating subcontractor:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Deactivate a subcontractor (soft delete)
 * Only GC Admins can deactivate subcontractors
 *
 * @param id - ID of the subcontractor to deactivate
 * @returns Success or error message
 */
export async function deactivateSubcontractor(id: string) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('User context error:', userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only GC Admin can deactivate
  if (role !== 'gc_admin') {
    return {
      success: false,
      error: 'Insufficient permissions. Only GC Admins can deactivate subcontractors.'
    };
  }

  // Validate input
  const validation = deactivateSubcontractorSchema.safeParse({ id });

  if (!validation.success) {
    return { success: false, error: 'Invalid subcontractor ID' };
  }

  try {
    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from('subcontractors')
      .select('id, company_id, company_name, email, is_active')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error('Error fetching subcontractor:', fetchError);
      return { success: false, error: 'Subcontractor not found in your company.' };
    }

    if (!existingSubcontractor.is_active) {
      return { success: false, error: 'This subcontractor is already inactive.' };
    }

    // Check if subcontractor is assigned to any active projects
    // SECURITY: Fail-closed - if check fails, don't allow deactivation
    const { data: activeAssignments, error: assignmentError } = await supabase
      .from('project_team')
      .select('project_id, projects!inner(status)')
      .eq('subcontractor_id', id)
      .in('projects.status', ['active', 'on_hold']);

    if (assignmentError) {
      console.error('Error checking active assignments:', assignmentError);
      return {
        success: false,
        error: 'Failed to verify project assignments. Please try again or contact support.'
      };
    }

    if (activeAssignments && activeAssignments.length > 0) {
      return {
        success: false,
        error: `Cannot deactivate subcontractor. They are assigned to ${activeAssignments.length} active project(s). Please remove them from projects first.`
      };
    }

    // Deactivate subcontractor (soft delete)
    const { data: deactivatedSubcontractor, error: updateError } = await supabase
      .from('subcontractors')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error deactivating subcontractor:', updateError);
      return { success: false, error: 'Failed to deactivate subcontractor. Please try again.' };
    }

    // Revalidate paths
    revalidatePath('/app/team/subcontractors');
    revalidateTag(`subcontractors-${companyId}`);
    revalidateTag(`subcontractor-${id}`);

    return {
      success: true,
      message: `Subcontractor ${existingSubcontractor.company_name} deactivated successfully`,
      data: deactivatedSubcontractor,
    };

  } catch (error) {
    console.error('Unexpected error deactivating subcontractor:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Upload document for subcontractor (license or insurance)
 * Only GC Admins and Project Managers can upload documents
 *
 * @param formData - Form data containing file and document type
 * @returns Success with file URL or error message
 */
export async function uploadSubcontractorDocument(formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('User context error:', userContext.error);
    return { success: false, error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions - only GC Admin and Project Manager can upload
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return {
      success: false,
      error: 'Insufficient permissions. Only GC Admins and Project Managers can upload documents.'
    };
  }

  try {
    const subcontractorId = formData.get('subcontractor_id') as string;
    const documentType = formData.get('document_type') as string;
    const file = formData.get('file') as File;

    // Validate required fields
    if (!subcontractorId || !documentType || !file) {
      return { success: false, error: 'Missing required fields: subcontractor_id, document_type, or file' };
    }

    // Validate subcontractor_id and document_type with Zod
    const validation = uploadDocumentSchema.safeParse({
      subcontractor_id: subcontractorId,
      document_type: documentType,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, error: 'Validation failed', fieldErrors: errors };
    }

    const validatedDocumentType = validation.data.document_type;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 5MB limit' };
    }

    // Validate file type (PDF, images)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only PDF and images (JPEG, PNG) are allowed' };
    }

    // Check if subcontractor exists and belongs to user's company
    const { data: existingSubcontractor, error: fetchError } = await supabase
      .from('subcontractors')
      .select('id, company_id, company_name, is_active')
      .eq('id', subcontractorId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (fetchError || !existingSubcontractor) {
      console.error('Error fetching subcontractor:', fetchError);
      return { success: false, error: 'Subcontractor not found in your company.' };
    }

    if (!existingSubcontractor.is_active) {
      return { success: false, error: 'Cannot upload documents for inactive subcontractor.' };
    }

    // TODO: Implement document storage - currently no document_url columns in subcontractors table
    // const oldDocumentUrl = validatedDocumentType === 'license'
    //   ? existingSubcontractor.license_document_url
    //   : existingSubcontractor.insurance_document_url;

    const oldDocumentUrl = null; // Placeholder until document_url columns are added
    if (oldDocumentUrl) {
      try {
        await del(oldDocumentUrl);
      } catch (deleteError) {
        console.warn('Failed to delete old document:', deleteError);
        // Continue anyway - non-critical error
      }
    }

    // Upload file to Vercel Blob
    const fileName = `subcontractors/${companyId}/${subcontractorId}/${validatedDocumentType}_${Date.now()}_${file.name}`;

    let blob;
    try {
      blob = await put(fileName, file, {
        access: 'public',
        addRandomSuffix: false,
      });
    } catch (uploadError) {
      console.error('Error uploading to Vercel Blob:', uploadError);
      return { success: false, error: 'Failed to upload document. Please try again.' };
    }

    // Update subcontractor with document URL
    const updateData: SubcontractorUpdate = {
      updated_at: new Date().toISOString(),
    };

    // TODO: Store the URL in the dedicated column based on document type
    // These columns don't exist yet in the subcontractors table
    if (validatedDocumentType === 'license') {
      const licenseNumber = formData.get('license_number') as string;
      const licenseExpiry = formData.get('license_expiry') as string;

      // updateData.license_document_url = blob.url;
      if (licenseNumber) updateData.license_number = licenseNumber.trim();
      if (licenseExpiry) updateData.license_expiry = licenseExpiry;
    } else {
      const insuranceProvider = formData.get('insurance_provider') as string;
      const insuranceExpiry = formData.get('insurance_expiry') as string;

      // updateData.insurance_document_url = blob.url;
      if (insuranceProvider) updateData.insurance_provider = insuranceProvider.trim();
      if (insuranceExpiry) updateData.insurance_expiry = insuranceExpiry;
    }

    const { data: updatedSubcontractor, error: updateError } = await supabase
      .from('subcontractors')
      .update(updateData)
      .eq('id', subcontractorId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subcontractor with document:', updateError);
      return { success: false, error: 'Failed to save document reference. Please try again.' };
    }

    // Revalidate paths
    revalidatePath('/app/team/subcontractors');
    revalidateTag(`subcontractors-${companyId}`);
    revalidateTag(`subcontractor-${subcontractorId}`);

    return {
      success: true,
      message: `${validatedDocumentType === 'license' ? 'License' : 'Insurance'} document uploaded successfully`,
      data: {
        url: blob.url,
        subcontractor: updatedSubcontractor,
      },
    };

  } catch (error) {
    console.error('Unexpected error uploading document:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
