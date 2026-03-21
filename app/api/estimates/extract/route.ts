import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { extractVectorPage } from "@/lib/extraction/vector-parser";
import { detectScale } from "@/lib/extraction/scale-detector";
import { classifyGeometry } from "@/lib/extraction/geometry-classifier";
import { calculateQuantities } from "@/lib/extraction/quantity-calculator";
import { normalizeTakeoffItem } from "@/lib/ai/normalize-takeoff";
import { classifySheet } from "@/lib/extraction/sheet-classifier";
import type { ScaleInfo, SheetClassification } from "@/lib/extraction/types";

// ---------------------------------------------------------------------------
// VEC-007.2: Vector engine processing for a single page
// ---------------------------------------------------------------------------

/**
 * Run the vector extraction pipeline on one PDF page and write takeoff_items
 * plus an ai_usage_log row to Supabase.
 *
 * @param pdfBytes    - Raw PDF bytes fetched from Supabase storage
 * @param pageNumber  - 1-based page number
 * @param planUploadId - UUID of the plan upload record
 * @param planPageId  - UUID of the plan_pages row for this page
 * @param companyId   - Company UUID (server-side, never from client)
 * @param supabase    - Admin Supabase client
 * @returns engineUsed indicator and count of items written
 */
async function runVectorEngine(
  pdfBytes: Buffer,
  pageNumber: number,
  planUploadId: string,
  planPageId: string,
  companyId: string,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ engineUsed: "vector"; itemsWritten: number }> {
  // Step 1: Extract vector elements from page
  const vectorPage = await extractVectorPage(pdfBytes, pageNumber);

  // Step 2: Detect scale — default to 1/4"=1' if detection fails
  const detectedScale = await detectScale(vectorPage);
  const scale: ScaleInfo = detectedScale ?? {
    factor: 48,
    confidence: "inferred",
  };

  // Step 3: Classify geometry (walls, doors, windows, rooms)
  const classificationResult = await classifyGeometry(vectorPage, scale);

  // Step 4: Calculate quantities from classified geometry
  const quantities = calculateQuantities(
    classificationResult.rooms,
    classificationResult.walls,
    classificationResult.doors,
    classificationResult.windows,
    scale,
  );

  // Step 5: Convert quantities to takeoff_items rows
  // Map QuantityResult fields to TakeoffItemAI shape for normalization
  type TakeoffItemAIShape = {
    id?: string;
    category:
      | "architectural"
      | "structural"
      | "mechanical"
      | "electrical"
      | "plumbing"
      | "painting"
      | "site"
      | "general";
    sub_type: string;
    quantity: number;
    unit: string;
    confidence: number;
    extraction_method: "labeled" | "calculated" | "inferred" | "manual";
    source_region?: { x: number; y: number; width: number; height: number };
    notes?: string;
  };

  const rawItems: TakeoffItemAIShape[] = [
    quantities.drywallSf > 0 && {
      category: "architectural" as const,
      sub_type: "drywall",
      quantity: quantities.drywallSf,
      unit: "SF",
      confidence: scale.confidence === "explicit" ? 0.9 : 0.75,
      extraction_method: "calculated" as const,
      notes: `Vector engine — scale: ${scale.confidence}`,
    },
    quantities.flooringSf > 0 && {
      category: "architectural" as const,
      sub_type: "flooring",
      quantity: quantities.flooringSf,
      unit: "SF",
      confidence: scale.confidence === "explicit" ? 0.9 : 0.75,
      extraction_method: "calculated" as const,
      notes: `Vector engine — scale: ${scale.confidence}`,
    },
    quantities.baseboardLf > 0 && {
      category: "architectural" as const,
      sub_type: "baseboard",
      quantity: quantities.baseboardLf,
      unit: "LF",
      confidence: scale.confidence === "explicit" ? 0.85 : 0.7,
      extraction_method: "calculated" as const,
      notes: `Vector engine — scale: ${scale.confidence}`,
    },
    quantities.ceilingSf > 0 && {
      category: "architectural" as const,
      sub_type: "ceiling",
      quantity: quantities.ceilingSf,
      unit: "SF",
      confidence: scale.confidence === "explicit" ? 0.9 : 0.75,
      extraction_method: "calculated" as const,
      notes: `Vector engine — scale: ${scale.confidence}`,
    },
    quantities.paintSf > 0 && {
      category: "painting" as const,
      sub_type: "interior paint",
      quantity: quantities.paintSf,
      unit: "SF",
      confidence: scale.confidence === "explicit" ? 0.85 : 0.7,
      extraction_method: "calculated" as const,
      notes: `Vector engine — scale: ${scale.confidence}`,
    },
    quantities.demoDrywallSf > 0 && {
      category: "architectural" as const,
      sub_type: "demo drywall",
      quantity: quantities.demoDrywallSf,
      unit: "SF",
      confidence: 0.8,
      extraction_method: "calculated" as const,
      notes: `Vector engine — demolition`,
    },
    quantities.demoFramingLf > 0 && {
      category: "structural" as const,
      sub_type: "demo framing",
      quantity: quantities.demoFramingLf,
      unit: "LF",
      confidence: 0.8,
      extraction_method: "calculated" as const,
      notes: `Vector engine — demolition`,
    },
  ].filter(Boolean) as TakeoffItemAIShape[];

  if (rawItems.length === 0) {
    // Nothing to write — log zero-cost usage and return
    await supabase.from("ai_usage_log").insert({
      plan_upload_id: planUploadId,
      plan_page_id: planPageId,
      company_id: companyId,
      model: "vector-engine-v1",
      tokens_used: 0,
      cost: 0,
      action: "extract_page",
    } as any);

    return { engineUsed: "vector", itemsWritten: 0 };
  }

  // Normalize items (applies trade inference, waste factors, review flags)
  const normalizedItems = rawItems.map((item) => normalizeTakeoffItem(item));

  // Build DB insert rows for takeoff_items
  const insertRows = normalizedItems.map((item) => ({
    plan_upload_id: planUploadId,
    plan_page_id: planPageId,
    company_id: companyId,
    category: item.category,
    trade: item.trade,
    sub_type: item.sub_type,
    quantity: item.quantity,
    unit: item.unit,
    waste_factor: item.waste_factor,
    adjusted_quantity: item.adjusted_quantity,
    extraction_method: item.extraction_method,
    confidence: item.confidence,
    source_region: item.source_region ?? null,
    needs_review: item.needs_review,
    review_status: item.review_status,
    notes: item.notes,
    ai_item_id: item.ai_item_id,
  }));

  const { error: insertError } = await supabase
    .from("takeoff_items")
    .insert(insertRows as any);

  if (insertError) {
    throw insertError;
  }

  // Write ai_usage_log with zero cost for vector engine
  await supabase.from("ai_usage_log").insert({
    plan_upload_id: planUploadId,
    plan_page_id: planPageId,
    company_id: companyId,
    model: "vector-engine-v1",
    tokens_used: 0,
    cost: 0,
    action: "extract_page",
  } as any);

  return { engineUsed: "vector", itemsWritten: insertRows.length };
}

// Per-page timeout for the vector engine (15s). Complex/large pages that
// exceed this fall back to an OpenAI background job instead of failing.
const VECTOR_PAGE_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`vector_timeout_${ms}ms`)), ms),
    ),
  ]);
}

// ---------------------------------------------------------------------------
// POST: Create extraction jobs (with VEC-007.1 engine routing)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([auth(), request.json()]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planUploadId, pageIds } = body as {
      planUploadId: string;
      pageIds?: number[];
    };

    if (!planUploadId) {
      return NextResponse.json(
        { error: "Missing planUploadId" },
        { status: 400 },
      );
    }

    // VEC-007.1: Determine extraction engine from environment variable
    const extractionEngine = (process.env.EXTRACTION_ENGINE ?? "auto") as
      | "auto"
      | "vector"
      | "openai";

    const supabase = createAdminClient();

    // Get user's company
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (!companyUser) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const companyId = companyUser.company_id;

    // Validate plan upload belongs to company and get file_path for vector engine
    const { data: planUpload } = await supabase
      .from("plan_uploads")
      .select("id, company_id, total_pages, file_path")
      .eq("id", planUploadId)
      .eq("company_id", companyId)
      .single();

    if (!planUpload) {
      return NextResponse.json(
        { error: "Plan upload not found or access denied" },
        { status: 404 },
      );
    }

    // Get pages to process
    let query = supabase
      .from("plan_pages")
      .select("id, page_number")
      .eq("plan_upload_id", planUploadId);

    if (pageIds && pageIds.length > 0) {
      query = query.in("page_number", pageIds);
    }

    const { data: pages, error: pagesError } = await query;

    if (pagesError) {
      throw pagesError;
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: "No pages found" }, { status: 404 });
    }

    // Check for existing jobs (background processing support)
    const { data: existingJobs } = await supabase
      .from("extraction_jobs" as any) // TODO: Remove after VEC-013 types are regenerated
      .select("page_number, status")
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", companyId);

    const existingPageNumbers = new Set(
      existingJobs?.map((j: any) => j.page_number) || [],
    );

    // ---------------------------------------------------------------------------
    // VEC-007.1: Engine routing per page
    // ---------------------------------------------------------------------------

    // Fetch PDF bytes once if vector engine may be used (reused across all pages)
    let pdfBytes: Buffer | null = null;

    const needsVectorEngine =
      extractionEngine === "vector" || extractionEngine === "auto";

    if (needsVectorEngine && planUpload.file_path) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("plan-files")
        .download(planUpload.file_path);

      if (!downloadError && fileData) {
        pdfBytes = Buffer.from(await fileData.arrayBuffer());
      } else {
        console.warn(
          "[extract] Could not download PDF for vector engine:",
          downloadError,
        );
      }
    }

    const jobs = [];
    const vectorResults: Array<{
      pageNumber: number;
      engineUsed: "vector" | "openai" | "skipped";
      itemsWritten?: number;
    }> = [];

    for (const page of pages) {
      // Determine engine for this page
      let pageEngine: "vector" | "openai" = "openai";
      let pageContentType: string | undefined;

      if (extractionEngine === "vector") {
        pageEngine = "vector";
      } else if (extractionEngine === "auto") {
        // In auto mode: use sheet classifier for smart routing
        if (pdfBytes) {
          try {
            const vectorPagePreview = await extractVectorPage(
              pdfBytes,
              page.page_number,
            );
            const pageClassification = vectorPagePreview.pageClassification;

            // Run enhanced sheet classifier for fine-grained routing
            const sheetClassification: SheetClassification =
              classifySheet(vectorPagePreview);

            // Route based on sheet classification
            switch (sheetClassification.extractionEngine) {
              case "vector":
              case "vector_ceiling":
                if (pageClassification === "raster") {
                  // Raster pages can't use vector engine even if classified as floor plan
                  pageEngine = "openai";
                } else {
                  pageEngine = "vector";
                }
                break;
              case "skip":
                // Skip sheets with no extractable quantities (code, ADA, cover)
                vectorResults.push({
                  pageNumber: page.page_number,
                  engineUsed: "skipped",
                });
                console.log(
                  `[extract] Page ${page.page_number}: ${sheetClassification.contentType} → skipped (no quantities)`,
                );
                continue; // Skip to next page
              case "schedule_extractor":
              case "mep_engine":
              case "ai_vision":
              case "ai_vision_specialized":
                // These all route to OpenAI for now (specialized engines not yet implemented)
                pageEngine = "openai";
                break;
              default:
                pageEngine = "openai";
            }

            pageContentType = sheetClassification.contentType;

            console.log(
              `[extract] Page ${page.page_number}: ${sheetClassification.sheetNumber ?? "?"} → ${sheetClassification.contentType} (${sheetClassification.discipline}) → engine=${pageEngine} [confidence=${sheetClassification.confidence.toFixed(2)}]`,
            );
          } catch (classifyErr) {
            console.warn(
              `[extract] Could not classify page ${page.page_number}, falling back to openai:`,
              classifyErr,
            );
            pageEngine = "openai";
          }
        } else {
          // No PDF bytes available — fall back to OpenAI
          pageEngine = "openai";
        }
      }

      // VEC-007.2: Run vector engine inline for vector pages
      if (pageEngine === "vector" && pdfBytes) {
        try {
          const result = await withTimeout(
            runVectorEngine(
              pdfBytes,
              page.page_number,
              planUploadId,
              page.id,
              companyId,
              supabase,
            ),
            VECTOR_PAGE_TIMEOUT_MS,
          );

          vectorResults.push({
            pageNumber: page.page_number,
            engineUsed: result.engineUsed,
            itemsWritten: result.itemsWritten,
          });

          // Store routing decision in job metadata
          if (!existingPageNumbers.has(page.page_number)) {
            jobs.push({
              company_id: companyId,
              plan_upload_id: planUploadId,
              page_number: page.page_number,
              stage: "extract_vectors" as const,
              status: "completed" as const,
              depends_on: [],
              result: {
                engineUsed: "vector" as const,
                itemsWritten: result.itemsWritten,
              },
            });
          }
        } catch (vectorErr) {
          const isTimeout =
            vectorErr instanceof Error &&
            (vectorErr.message.startsWith("vector_timeout_") ||
              vectorErr.name === "TimeoutError" ||
              (vectorErr as { code?: number }).code === 23);

          if (isTimeout) {
            console.warn(
              `[extract] Vector engine timed out on page ${page.page_number}, falling back to OpenAI`,
            );
          } else {
            console.error(
              `[extract] Vector engine failed for page ${page.page_number}:`,
              vectorErr,
            );
          }

          // Fall back to OpenAI background job rather than marking as failed
          if (!existingPageNumbers.has(page.page_number)) {
            jobs.push({
              company_id: companyId,
              plan_upload_id: planUploadId,
              page_number: page.page_number,
              stage: "extract_vectors" as const,
              status: "pending" as const,
              depends_on: [],
              result: { engineUsed: "openai" as const },
            });
          }

          vectorResults.push({
            pageNumber: page.page_number,
            engineUsed: "openai",
          });
        }
      } else if (pageEngine === "openai") {
        // OpenAI path: create a pending job for background processing
        // Include contentType so the parse route can use specialized prompts
        if (!existingPageNumbers.has(page.page_number)) {
          jobs.push({
            company_id: companyId,
            plan_upload_id: planUploadId,
            page_number: page.page_number,
            stage: "extract_vectors" as const,
            status: "pending" as const,
            depends_on: [],
            result: {
              engineUsed: "openai" as const,
              ...(pageContentType && { sheetContentType: pageContentType }),
            },
          });
        }

        vectorResults.push({
          pageNumber: page.page_number,
          engineUsed: "openai",
        });
      }
    }

    let createdJobs = null;
    if (jobs.length > 0) {
      const { data, error: jobsError } = await supabase
        .from("extraction_jobs" as any) // TODO: Remove after VEC-013 types are regenerated
        .insert(jobs as any)
        .select("id");

      if (jobsError) {
        throw jobsError;
      }

      createdJobs = data;
    }

    return NextResponse.json({
      success: true,
      data: {
        jobCount: createdJobs?.length || 0,
        totalJobs: pages.length,
        existingJobs: existingJobs?.length || 0,
        planUploadId,
        engineMode: extractionEngine,
        pageResults: vectorResults,
      },
    });
  } catch (error) {
    console.error("[extract] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 },
    );
  }
}

// Retry failed extraction jobs for specific pages
export async function PATCH(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([auth(), request.json()]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planUploadId, pageIds } = body as {
      planUploadId: string;
      pageIds: number[];
    };

    if (!planUploadId || !pageIds || pageIds.length === 0) {
      return NextResponse.json(
        { error: "Missing planUploadId or pageIds" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Get user's company
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (!companyUser) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const companyId = companyUser.company_id;

    // Reset failed jobs to pending
    const { data: retriedJobs, error: retryError } = await supabase
      .from("extraction_jobs" as any)
      .update({
        status: "pending" as any,
        error: null,
        attempt: 0,
        claimed_at: null,
        heartbeat_at: null,
      } as any)
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", companyId)
      .in("page_number", pageIds)
      .eq("status", "failed" as any)
      .select("id");

    if (retryError) {
      throw retryError;
    }

    return NextResponse.json({
      success: true,
      data: {
        retriedJobCount: retriedJobs?.length || 0,
      },
    });
  } catch (error) {
    console.error("[extract-retry] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Retry failed" },
      { status: 500 },
    );
  }
}

// Cancel extraction jobs for a plan upload
// P2.3: Multi-Page Batch Operations Backend (EST-P2-003)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const planUploadId = url.searchParams.get("planUploadId");

    if (!planUploadId) {
      return NextResponse.json(
        { error: "Missing planUploadId" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Get user's company
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (!companyUser) {
      return NextResponse.json({ error: "No active company" }, { status: 403 });
    }

    const companyId = companyUser.company_id;

    // Cancel all pending and claimed jobs
    const { data: canceledJobs, error: cancelError } = await supabase
      .from("extraction_jobs" as any)
      .update({ status: "failed" as any, error: "Canceled by user" } as any)
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", companyId)
      .in("status", ["pending" as any, "claimed" as any])
      .select("id");

    if (cancelError) {
      throw cancelError;
    }

    return NextResponse.json({
      success: true,
      data: {
        canceledJobCount: canceledJobs?.length || 0,
      },
    });
  } catch (error) {
    console.error("[extract-cancel] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cancel failed" },
      { status: 500 },
    );
  }
}
