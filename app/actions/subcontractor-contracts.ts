"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";

// ============================================
// Types
// ============================================

export type ComplianceField =
  | "insurance_received"
  | "contract_executed"
  | "ntp_issued"
  | "schedule_received"
  | "punchlist_complete";

export interface SubPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

export interface ContractWithPayments {
  id: string;
  subcontractor: {
    id: string;
    company_name: string;
    contact_name: string;
  };
  contractAmount: number;
  phase: string | null;
  status: string;
  insurance_received: boolean;
  contract_executed: boolean;
  ntp_issued: boolean;
  schedule_received: boolean;
  punchlist_complete: boolean;
  paidToDate: number;
  unpaidBalance: number;
  payments: SubPayment[];
  notes: string | null;
  created_at: string;
}

// ============================================
// Validation Schemas
// ============================================

const createContractSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  subcontractorId: z.string().uuid("Invalid subcontractor ID"),
  contractAmount: z.number().positive("Contract amount must be positive"),
  phase: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateContractSchema = z.object({
  contractId: z.string().uuid("Invalid contract ID"),
  contractAmount: z.number().positive().optional(),
  phase: z.string().optional().nullable(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  notes: z.string().optional().nullable(),
});

const complianceFieldEnum = z.enum([
  "insurance_received",
  "contract_executed",
  "ntp_issued",
  "schedule_received",
  "punchlist_complete",
]);

// ============================================
// Contract Actions
// ============================================

/**
 * Create a new subcontractor contract for a project
 */
export async function createContract(
  input: z.infer<typeof createContractSchema>,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createContractSchema.parse(input);

    const { data: contract, error } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .insert({
        company_id: userContext.companyId,
        project_id: validated.projectId,
        subcontractor_id: validated.subcontractorId,
        contract_amount: validated.contractAmount,
        phase: validated.phase ?? null,
        notes: validated.notes ?? null,
        status: "active",
        created_by: userContext.userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createContract] Insert error:", error);
      return { success: false, error: "Failed to create contract" };
    }

    revalidatePath(`/app/projects/${validated.projectId}`);

    return { success: true, data: { id: (contract as any).id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[createContract] Unexpected error:", error);
    return { success: false, error: "Failed to create contract" };
  }
}

/**
 * Get all contracts for a project, with subcontractor info and payment totals
 */
export async function getContractsByProject(projectId: string): Promise<{
  success: boolean;
  data?: ContractWithPayments[];
  error?: string;
}> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: contracts, error } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .select(
        `
        *,
        subcontractors (
          id,
          company_name,
          contact_name
        ),
        subcontractor_payments (
          id,
          amount,
          payment_date,
          payment_method,
          notes,
          created_at
        )
      `,
      )
      .eq("project_id", projectId)
      .eq("company_id", userContext.companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getContractsByProject] Query error:", error);
      return { success: false, error: "Failed to fetch contracts" };
    }

    const result: ContractWithPayments[] = ((contracts as any[]) || []).map(
      (c: any) => {
        const sub = c.subcontractors as {
          id: string;
          company_name: string;
          contact_name: string;
        } | null;

        const payments = (
          c.subcontractor_payments as Array<{
            id: string;
            amount: number;
            payment_date: string;
            payment_method: string;
            notes: string | null;
            created_at: string;
          }>
        )
          .sort(
            (a, b) =>
              new Date(b.payment_date).getTime() -
              new Date(a.payment_date).getTime(),
          )
          .map((p) => ({
            id: p.id,
            amount: p.amount,
            payment_date: p.payment_date,
            payment_method: p.payment_method,
            notes: p.notes,
            created_at: p.created_at,
          }));

        const paidToDate = payments.reduce((sum, p) => sum + p.amount, 0);

        return {
          id: c.id,
          subcontractor: sub ?? {
            id: c.subcontractor_id,
            company_name: "Unknown",
            contact_name: "",
          },
          contractAmount: c.contract_amount,
          phase: c.phase,
          status: c.status,
          insurance_received: c.insurance_received,
          contract_executed: c.contract_executed,
          ntp_issued: c.ntp_issued,
          schedule_received: c.schedule_received,
          punchlist_complete: c.punchlist_complete,
          paidToDate,
          unpaidBalance: c.contract_amount - paidToDate,
          payments,
          notes: c.notes,
          created_at: c.created_at,
        };
      },
    );

    return { success: true, data: result };
  } catch (error) {
    console.error("[getContractsByProject] Unexpected error:", error);
    return { success: false, error: "Failed to fetch contracts" };
  }
}

/**
 * Update contract amount, phase, status, or notes
 */
export async function updateContract(
  input: z.infer<typeof updateContractSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateContractSchema.parse(input);

    const updates: Record<string, unknown> = {};
    if (validated.contractAmount !== undefined)
      updates.contract_amount = validated.contractAmount;
    if (validated.phase !== undefined) updates.phase = validated.phase;
    if (validated.status !== undefined) updates.status = validated.status;
    if (validated.notes !== undefined) updates.notes = validated.notes;

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    // Fetch contract to verify ownership and get project_id
    const { data: contract } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .select("project_id, company_id")
      .eq("id", validated.contractId)
      .eq("company_id", userContext.companyId)
      .single();

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const { error } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .update(updates)
      .eq("id", validated.contractId)
      .eq("company_id", userContext.companyId);

    if (error) {
      console.error("[updateContract] Update error:", error);
      return { success: false, error: "Failed to update contract" };
    }

    revalidatePath(`/app/projects/${(contract as any).project_id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[updateContract] Unexpected error:", error);
    return { success: false, error: "Failed to update contract" };
  }
}

/**
 * Toggle a single compliance boolean field on a contract
 * Designed for optimistic UI updates — returns fast
 */
export async function updateCompliance(
  contractId: string,
  field: ComplianceField,
  value: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate field name to prevent injection
    complianceFieldEnum.parse(field);

    const { data: contract } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .select("project_id")
      .eq("id", contractId)
      .eq("company_id", userContext.companyId)
      .single();

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const { error } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .update({ [field]: value })
      .eq("id", contractId)
      .eq("company_id", userContext.companyId);

    if (error) {
      console.error("[updateCompliance] Update error:", error);
      return { success: false, error: "Failed to update compliance status" };
    }

    revalidatePath(`/app/projects/${(contract as any).project_id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid compliance field" };
    }
    console.error("[updateCompliance] Unexpected error:", error);
    return { success: false, error: "Failed to update compliance status" };
  }
}

/**
 * Delete a contract — blocked if payments exist
 */
export async function deleteContract(
  contractId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch contract to verify ownership
    const { data: contract } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .select("project_id, company_id")
      .eq("id", contractId)
      .eq("company_id", userContext.companyId)
      .single();

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    // Check for existing payments
    const { count: paymentCount } = await userContext.supabase
      .from("subcontractor_payments" as any)
      .select("id", { count: "exact", head: true })
      .eq("contract_id", contractId);

    if (paymentCount && paymentCount > 0) {
      return {
        success: false,
        error:
          "Cannot delete contract with existing payments. Delete payments first.",
      };
    }

    const { error } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .delete()
      .eq("id", contractId)
      .eq("company_id", userContext.companyId);

    if (error) {
      console.error("[deleteContract] Delete error:", error);
      return { success: false, error: "Failed to delete contract" };
    }

    revalidatePath(`/app/projects/${(contract as any).project_id}`);

    return { success: true };
  } catch (error) {
    console.error("[deleteContract] Unexpected error:", error);
    return { success: false, error: "Failed to delete contract" };
  }
}
