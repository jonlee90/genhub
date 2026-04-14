"use client";

import { read, utils } from "xlsx";
import type { ParsedExpenseRow } from "@/app/actions/expense-import";

const EXPECTED_HEADERS = [
  "PROJECT",
  "TASK",
  "DESCRIPTION",
  "AMOUNT",
  "CATEGORY",
  "DATE",
  "VENDOR NAME",
] as const;

function formatDate(value: unknown): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value === "string") {
    // Already ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Try to parse MM/DD/YYYY or similar
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  return String(value ?? "");
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function parseExpenseXlsx(
  file: File,
): Promise<
  | { success: true; data: ParsedExpenseRow[] }
  | { success: false; error: string }
> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: "array", cellDates: true });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, error: "Excel file has no sheets." };
    }

    const ws = workbook.Sheets[firstSheetName];
    const rawRows = utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
    });

    if (rawRows.length < 2) {
      return {
        success: false,
        error: "File must have a header row and at least one data row.",
      };
    }

    // Build header index map (case-insensitive)
    const headerRow = rawRows[0] as string[];
    const headerIndex: Record<string, number> = {};
    headerRow.forEach((h, i) => {
      if (typeof h === "string") {
        headerIndex[h.toUpperCase().trim()] = i;
      }
    });

    // Check required headers exist
    const missing = EXPECTED_HEADERS.filter(
      (h) => headerIndex[h] === undefined,
    );
    if (missing.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missing.join(", ")}`,
      };
    }

    const rows: ParsedExpenseRow[] = [];

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i] as unknown[];

      const description = String(row[headerIndex["DESCRIPTION"]] ?? "").trim();
      const amountRaw = row[headerIndex["AMOUNT"]];
      const amount = parseAmount(amountRaw);

      // Skip blank rows
      if (!description && amount === 0) continue;

      const projectName = String(row[headerIndex["PROJECT"]] ?? "").trim();
      const taskNameRaw = String(row[headerIndex["TASK"]] ?? "").trim();
      const categoryRaw = String(row[headerIndex["CATEGORY"]] ?? "").trim();
      const dateRaw = row[headerIndex["DATE"]];
      const vendorRaw = String(row[headerIndex["VENDOR NAME"]] ?? "").trim();

      rows.push({
        project_name: projectName,
        task_name: taskNameRaw || null,
        description,
        amount,
        category_raw: categoryRaw,
        date: formatDate(dateRaw),
        vendor_name: vendorRaw || null,
      });
    }

    if (rows.length === 0) {
      return { success: false, error: "No valid rows found in the file." };
    }

    return { success: true, data: rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse file";
    return { success: false, error: message };
  }
}
