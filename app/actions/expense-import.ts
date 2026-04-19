"use server";

import { getUserContext } from "@/lib/auth-context";
import { createClient } from "@/utils/supabase/server";
import { inferTrade } from "@/lib/expense-import/trade-mapper";
import type { ExpenseCategory } from "@/types/db/enums";
import type { Database } from "@/types/db/helpers";

type TradeType = Database["public"]["Enums"]["trade_type"];

// ============================================
// Types
// ============================================

export type ParsedExpenseRow = {
  project_name: string;
  task_name: string | null;
  description: string;
  amount: number;
  category_raw: string; // e.g. "SUBCONTRACTOR"
  date: string; // ISO date string YYYY-MM-DD
  vendor_name: string | null;
};

export type SubcontractorMatchStatus = "matched" | "new";
export type TaskMatchStatus = "matched" | "unmatched";

export type ResolvedRow = ParsedExpenseRow & {
  project_id: string; // always 155ccb55-458d-4ec3-bc75-e880ce610ebc
  task_id: string | null;
  task_match_status: TaskMatchStatus;
  subcontractor_id: string | null; // null if new
  subcontractor_match_status: SubcontractorMatchStatus | null; // null if no vendor
  inferred_trade: string; // trade_specialization for new subcontractors
};

export type ImportResult = {
  success: boolean;
  imported: number;
  errors: string[];
};

// ============================================
// Constants
// ============================================

const TARGET_PROJECT_ID = "155ccb55-458d-4ec3-bc75-e880ce610ebc";

// ============================================
// Helpers
// ============================================

function mapCategory(categoryRaw: string): ExpenseCategory {
  const normalized = categoryRaw.toUpperCase().trim();
  if (normalized === "SUBCONTRACTOR") return "labor";
  return "other";
}

/**
 * Normalize a company name for fuzzy matching:
 * lowercase, strip punctuation/extra spaces, remove common business suffixes.
 */
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // strip punctuation
    .replace(/\b(inc|llc|ltd|corp|co|company|and|&)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fuzzy match: returns true if the normalized forms are equal,
 * or if one contains the other (handles "Globe Fire Protection " vs "Globe Fire Protection").
 */
function fuzzyMatchCompany(a: string, b: string): boolean {
  const na = normalizeCompanyName(a);
  const nb = normalizeCompanyName(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Token overlap with prefix stemming (first 7 chars):
  // handles "Fabrication" vs "Fabricator", "Protection" vs "Protector", etc.
  const tokensA = na.split(" ").filter(Boolean);
  const tokensB = nb.split(" ").filter(Boolean);
  const [shorter, longer] =
    tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const stem = (t: string) => t.slice(0, 7);
  const longerStems = longer.map(stem);
  if (
    shorter.length >= 2 &&
    shorter.every((t) => longerStems.includes(stem(t)))
  )
    return true;
  return false;
}

// ============================================
// resolveImportRows
// ============================================

export async function resolveImportRows(
  rows: ParsedExpenseRow[],
): Promise<
  { success: true; data: ResolvedRow[] } | { success: false; error: string }
> {
  const ctx = await getUserContext();
  if ("error" in ctx || !ctx.userId || !ctx.companyId) {
    return { success: false, error: "Unauthorized" };
  }
  const { companyId } = ctx;

  try {
    const supabase = await createClient();

    // Load tasks for the target project
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("project_id", TARGET_PROJECT_ID);

    if (tasksError) {
      return { success: false, error: tasksError.message };
    }

    // Load active subcontractors for the company
    const { data: subcontractors, error: subsError } = await supabase
      .from("subcontractors")
      .select("id, company_name")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (subsError) {
      return { success: false, error: subsError.message };
    }

    const resolvedRows: ResolvedRow[] = rows.map((row) => {
      // Task matching
      const matchedTask = tasks?.find(
        (t) =>
          t.title.toLowerCase().trim() ===
          (row.task_name?.toLowerCase().trim() ?? ""),
      );
      const task_id = matchedTask?.id ?? null;
      const task_match_status: TaskMatchStatus = matchedTask
        ? "matched"
        : "unmatched";

      // Subcontractor matching
      let subcontractor_id: string | null = null;
      let subcontractor_match_status: SubcontractorMatchStatus | null = null;

      if (row.vendor_name) {
        const matchedSub = subcontractors?.find((s) =>
          fuzzyMatchCompany(s.company_name, row.vendor_name!),
        );
        if (matchedSub) {
          subcontractor_id = matchedSub.id;
          subcontractor_match_status = "matched";
        } else {
          subcontractor_match_status = "new";
        }
      }

      const inferred_trade = inferTrade(row.vendor_name, row.task_name);

      return {
        ...row,
        project_id: TARGET_PROJECT_ID,
        task_id,
        task_match_status,
        subcontractor_id,
        subcontractor_match_status,
        inferred_trade,
      };
    });

    return { success: true, data: resolvedRows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ============================================
// importExpenses
// ============================================

export async function importExpenses(
  resolvedRows: ResolvedRow[],
): Promise<
  { success: true; data: ImportResult } | { success: false; error: string }
> {
  const ctx = await getUserContext();
  if ("error" in ctx || !ctx.userId || !ctx.companyId) {
    return { success: false, error: "Unauthorized" };
  }
  const { userId, companyId } = ctx;

  if (!resolvedRows || resolvedRows.length === 0) {
    return { success: false, error: "No rows to import" };
  }

  try {
    const supabase = await createClient();

    // Step 1: Insert new subcontractors
    const newSubMap = new Map<string, string>(); // vendor_name_lower → new id

    const uniqueNewVendors = Array.from(
      new Map(
        resolvedRows
          .filter(
            (r) =>
              r.subcontractor_match_status === "new" && r.vendor_name != null,
          )
          .map((r) => [r.vendor_name!.toLowerCase().trim(), r]),
      ).values(),
    );

    for (const row of uniqueNewVendors) {
      const { data: newSub, error: subError } = await supabase
        .from("subcontractors")
        .insert({
          company_id: companyId,
          company_name: row.vendor_name!,
          contact_name: row.vendor_name!,
          trade_specialization: row.inferred_trade as TradeType,
          is_active: true,
        })
        .select("id")
        .single();

      if (subError) {
        return { success: false, error: subError.message };
      }

      newSubMap.set(row.vendor_name!.toLowerCase().trim(), newSub.id);
    }

    // Step 2: Bulk insert expenses
    const expenseRows = resolvedRows.map((row) => {
      // Resolve subcontractor_id for newly inserted subs
      const resolvedSubId =
        row.subcontractor_match_status === "new" && row.vendor_name
          ? (newSubMap.get(row.vendor_name.toLowerCase().trim()) ?? null)
          : row.subcontractor_id;

      return {
        company_id: companyId,
        project_id: row.project_id,
        task_id: row.task_id,
        description: row.description,
        amount: row.amount,
        category: mapCategory(row.category_raw),
        expense_date: row.date,
        vendor_name: row.vendor_name,
        submitted_by: userId,
        ocr_processed: false,
        // attach subcontractor reference if available
        ...(resolvedSubId ? { subcontractor_id: resolvedSubId } : {}),
      };
    });

    const { error: insertError } = await supabase
      .from("expenses")
      .insert(expenseRows);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      data: { success: true, imported: expenseRows.length, errors: [] },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
