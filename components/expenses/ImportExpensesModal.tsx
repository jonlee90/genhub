"use client";

import { useState, useRef } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { parseExpenseXlsx } from "@/lib/expense-import/parse-xlsx";
import {
  resolveImportRows,
  importExpenses,
} from "@/app/actions/expense-import";
import type {
  ParsedExpenseRow,
  ResolvedRow,
} from "@/app/actions/expense-import";

type Step = "upload" | "preview" | "done";

interface ImportExpensesModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportExpensesModal({
  onClose,
  onSuccess,
}: ImportExpensesModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedExpenseRow[]>([]);
  const [resolvedRows, setResolvedRows] = useState<ResolvedRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFileName(file.name);
    setIsLoading(true);

    const result = await parseExpenseXlsx(file);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      setParsedRows([]);
      return;
    }

    setParsedRows(result.data);
  }

  async function handlePreview() {
    if (parsedRows.length === 0) return;

    setIsLoading(true);
    setError(null);

    const result = await resolveImportRows(parsedRows);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setResolvedRows(result.data);
    setStep("preview");
  }

  async function handleImport() {
    setIsLoading(true);
    setError(null);

    const result = await importExpenses(resolvedRows);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setImportedCount(result.data.imported);
    setImportErrors(result.data.errors);
    setStep("done");
  }

  function handleClose() {
    onClose();
  }

  function handleSuccessClose() {
    onSuccess?.();
    onClose();
  }

  const newSubcontractorCount = resolvedRows.filter(
    (r) => r.subcontractor_match_status === "new",
  ).length;

  const stepTitles: Record<Step, string> = {
    upload: "Import Expenses",
    preview: "Preview Import",
    done: "Import Complete",
  };

  return (
    <ResponsiveModal
      isOpen
      onClose={handleClose}
      icon={FileSpreadsheet}
      title={stepTitles[step]}
      onBack={step === "preview" ? () => setStep("upload") : undefined}
    >
      <div className="p-4 space-y-4">
        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload an Excel file with columns:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                PROJECT, TASK, DESCRIPTION, AMOUNT, CATEGORY, DATE, VENDOR NAME
              </span>
            </p>

            {/* Drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[120px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#001B51] dark:hover:border-blue-400 active:scale-[0.98] transition-all cursor-pointer bg-gray-50 dark:bg-gray-800/50"
            >
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              {selectedFileName ? (
                <span className="text-sm font-medium text-[#001B51] dark:text-blue-400">
                  {selectedFileName}
                </span>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Tap to select .xlsx file
                </span>
              )}
              {parsedRows.length > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {parsedRows.length} rows ready to import
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Parsing file...</span>
              </div>
            )}

            <Button
              onClick={handlePreview}
              disabled={parsedRows.length === 0 || isLoading}
              className="w-full min-h-[44px] bg-[#001B51] hover:bg-[#001B51]/90 active:bg-[#001B51]/80 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-800 text-white font-semibold transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                "Preview Import"
              )}
            </Button>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                {resolvedRows.length} expenses to import
              </span>
              {newSubcontractorCount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">
                  {newSubcontractorCount} new subcontractors to create
                </span>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      VENDOR
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      DESCRIPTION
                    </th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      AMOUNT
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      DATE
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      TASK
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      SUBCONTRACTOR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {resolvedRows.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-[100px] truncate">
                        {row.vendor_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[140px] truncate">
                        {row.description}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                        $
                        {row.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                        {row.task_match_status === "matched"
                          ? row.task_name
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row.subcontractor_match_status === null ? (
                          <span className="text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        ) : row.subcontractor_match_status === "matched" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="flex-1 min-h-[44px] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-all"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading}
                className="flex-1 min-h-[44px] bg-[#001B51] hover:bg-[#001B51]/90 active:bg-[#001B51]/80 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-800 text-white font-semibold transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Done */}
        {step === "done" && (
          <div className="space-y-4">
            {importErrors.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {importedCount} expense{importedCount !== 1 ? "s" : ""}{" "}
                  imported successfully
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Import completed with errors
                  </p>
                  {importedCount > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {importedCount} expense{importedCount !== 1 ? "s" : ""}{" "}
                      imported
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  {importErrors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={importedCount > 0 ? handleSuccessClose : handleClose}
              className="w-full min-h-[44px] bg-[#001B51] hover:bg-[#001B51]/90 active:bg-[#001B51]/80 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-800 text-white font-semibold transition-all"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
