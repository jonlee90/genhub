"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";

// ============================================
// Validation Schemas
// ============================================

const createPaymentSchema = z.object({
  contractId: z.string().uuid("Invalid contract ID"),
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().optional().nullable(),
});

// ============================================
// Payment Actions
// ============================================

/**
 * Record a payment against a subcontractor contract
 * Warns but allows overpayment (amount + existing > contract)
 */
export async function createPayment(
  input: z.infer<typeof createPaymentSchema>,
): Promise<{
  success: boolean;
  data?: { id: string; isOverpayment: boolean };
  error?: string;
}> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createPaymentSchema.parse(input);

    // Fetch contract to verify ownership and get project_id
    const { data: contract, error: contractError } = await userContext.supabase
      .from("subcontractor_contracts" as any)
      .select("id, project_id, company_id, contract_amount")
      .eq("id", validated.contractId)
      .eq("company_id", userContext.companyId)
      .single();

    if (contractError || !contract) {
      return { success: false, error: "Contract not found" };
    }

    // Check existing payments to determine if this would be an overpayment
    const { data: existingPayments } = await userContext.supabase
      .from("subcontractor_payments" as any)
      .select("amount")
      .eq("contract_id", validated.contractId);

    const alreadyPaid = ((existingPayments as any[]) || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0,
    );
    const isOverpayment =
      alreadyPaid + validated.amount > (contract as any).contract_amount;

    // Insert payment regardless of overpayment (caller warned via return flag)
    const { data: payment, error } = await userContext.supabase
      .from("subcontractor_payments" as any)
      .insert({
        company_id: userContext.companyId,
        contract_id: validated.contractId,
        amount: validated.amount,
        payment_date: validated.paymentDate,
        payment_method: validated.paymentMethod,
        notes: validated.notes ?? null,
        created_by: userContext.userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createPayment] Insert error:", error);
      return { success: false, error: "Failed to record payment" };
    }

    revalidatePath(`/app/projects/${(contract as any).project_id}`);

    return { success: true, data: { id: (payment as any).id, isOverpayment } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[createPayment] Unexpected error:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

/**
 * Get all payments for a contract, sorted by date DESC
 */
export async function getPaymentsByContract(contractId: string): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    notes: string | null;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await userContext.supabase
      .from("subcontractor_payments" as any)
      .select("id, amount, payment_date, payment_method, notes, created_at")
      .eq("contract_id", contractId)
      .eq("company_id", userContext.companyId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("[getPaymentsByContract] Query error:", error);
      return { success: false, error: "Failed to fetch payments" };
    }

    return { success: true, data: (data as any[]) || [] };
  } catch (error) {
    console.error("[getPaymentsByContract] Unexpected error:", error);
    return { success: false, error: "Failed to fetch payments" };
  }
}

/**
 * Delete a single payment record
 */
export async function deletePayment(
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch payment to get project_id for revalidation
    const { data: payment } = await userContext.supabase
      .from("subcontractor_payments" as any)
      .select(
        "id, contract_id, subcontractor_contracts!inner(project_id, company_id)",
      )
      .eq("id", paymentId)
      .eq("company_id", userContext.companyId)
      .single();

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    const { error } = await userContext.supabase
      .from("subcontractor_payments" as any)
      .delete()
      .eq("id", paymentId)
      .eq("company_id", userContext.companyId);

    if (error) {
      console.error("[deletePayment] Delete error:", error);
      return { success: false, error: "Failed to delete payment" };
    }

    const contract = (payment as any).subcontractor_contracts as {
      project_id: string;
      company_id: string;
    };
    revalidatePath(`/app/projects/${contract.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("[deletePayment] Unexpected error:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}
