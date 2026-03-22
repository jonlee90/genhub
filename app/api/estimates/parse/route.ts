import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import sharp from "sharp";
import {
  ParseResponseSchema,
  PARSE_SYSTEM_PROMPT,
  PARSE_USER_PROMPT,
} from "@/lib/ai/parse-prompt";
import {
  getPromptForContentType,
  type PromptConfig,
} from "@/lib/ai/construction-prompts";
import { normalizeTakeoffItem } from "@/lib/ai/normalize-takeoff";
import { ScheduleExtractionResultSchema } from "@/lib/extraction/schedule-types";
import { convertScheduleToTakeoffItems } from "@/lib/extraction/schedule-to-takeoff";
import { createHash } from "crypto";

const SCHEDULE_CONTENT_TYPES = new Set([
  "door_schedule",
  "window_schedule",
  "finish_schedule",
  "fixture_schedule",
  "equipment_schedule",
  "panel_schedule",
]);

const OPENAI_MODEL = "gpt-4o";
const OPENAI_PRICING = {
  prompt: 0.0025 / 1000, // $0.0025 per 1K tokens
  completion: 0.01 / 1000, // $0.01 per 1K tokens
};

const GEMINI_MODEL = "gemini-2.5-pro-preview-05-06";
const GEMINI_PRICING = {
  prompt: 0.00125 / 1000,
  completion: 0.01 / 1000,
};

export async function POST(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([auth(), request.json()]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[parse] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 },
      );
    }

    const { planUploadId, pageIds, sheetContentType } = body;

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

    // Verify plan upload belongs to company
    const { data: planUpload } = await supabase
      .from("plan_uploads")
      .select("id, company_id")
      .eq("id", planUploadId)
      .eq("company_id", companyId)
      .single();

    if (!planUpload) {
      return NextResponse.json(
        { error: "Plan upload not found or access denied" },
        { status: 404 },
      );
    }

    // Get company budget
    const { data: company } = await supabase
      .from("companies")
      .select("ai_monthly_budget")
      .eq("id", companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 500 });
    }

    // Check current month spend
    const { data: usageData } = await supabase
      .from("ai_usage_log")
      .select("cost")
      .eq("company_id", companyId)
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString(),
      );

    const currentSpend =
      usageData?.reduce((sum, log) => sum + Number(log.cost), 0) || 0;

    if (currentSpend >= company.ai_monthly_budget) {
      return NextResponse.json(
        {
          error: "Monthly AI budget exceeded",
          currentSpend,
          budget: company.ai_monthly_budget,
        },
        { status: 402 },
      );
    }

    const budgetWarning = currentSpend >= 0.8 * company.ai_monthly_budget;

    // Get pages to parse
    let pagesQuery = supabase
      .from("plan_pages")
      .select("*")
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", companyId);

    if (pageIds && Array.isArray(pageIds) && pageIds.length > 0) {
      pagesQuery = pagesQuery.in("id", pageIds);
    }

    const { data: pages } = await pagesQuery;

    if (!pages || pages.length === 0) {
      return NextResponse.json(
        { error: "No pages found to parse" },
        { status: 404 },
      );
    }

    // Fetch extraction job classifications for these pages to use specialized prompts
    const { data: extractionJobs } = await supabase
      .from("extraction_jobs" as any)
      .select("page_number, result")
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", companyId);

    // Build page_number → sheetContentType map from job results
    const pageContentTypeMap = new Map<number, string>();
    for (const job of (extractionJobs as any[]) ?? []) {
      const jobResult = job.result as { sheetContentType?: string } | null;
      if (jobResult?.sheetContentType) {
        pageContentTypeMap.set(job.page_number, jobResult.sheetContentType);
      }
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
    });

    let parsed = 0;
    let failed = 0;
    const warnings: string[] = [];

    if (budgetWarning) {
      warnings.push(
        `Budget warning: ${Math.round((currentSpend / company.ai_monthly_budget) * 100)}% of monthly budget used`,
      );
    }

    for (const page of pages) {
      try {
        // Update status to parsing
        await supabase
          .from("plan_pages")
          .update({ parse_status: "parsing" })
          .eq("id", page.id);

        // Download image from storage
        const { data: imageData, error: downloadError } = await supabase.storage
          .from("plan-pages")
          .download(page.image_path);

        if (downloadError || !imageData) {
          throw new Error("Failed to download page image");
        }

        const imageBuffer = Buffer.from(await imageData.arrayBuffer());

        // Compute SHA-256 hash
        const hash = createHash("sha256").update(imageBuffer).digest("hex");

        // Update hash in database
        await supabase
          .from("plan_pages")
          .update({ image_hash_sha256: hash })
          .eq("id", page.id);

        // Check cache by joining plan_pages
        const { data: cachedResults } = await supabase
          .from("plan_parse_results")
          .select("*, plan_pages!inner(image_hash_sha256)")
          .eq("company_id", companyId)
          .eq("plan_pages.image_hash_sha256", hash)
          .order("created_at", { ascending: false })
          .limit(1);

        const cachedResult =
          cachedResults && cachedResults.length > 0 ? cachedResults[0] : null;

        let parseResult: any;
        let tokenUsage: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        } = {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };
        let cost: number = 0;
        let cached = false;
        let modelUsed = OPENAI_MODEL;

        // Determine content type for this page (needed for both cache and non-cache paths)
        const pageContentType =
          pageContentTypeMap.get(page.page_number) ?? sheetContentType;
        const isSchedulePage =
          !!pageContentType && SCHEDULE_CONTENT_TYPES.has(pageContentType);

        if (cachedResult) {
          // Cache hit - reuse existing result
          parseResult = cachedResult.raw_response;
          tokenUsage = {
            prompt_tokens: cachedResult.prompt_tokens,
            completion_tokens: cachedResult.completion_tokens,
            total_tokens: cachedResult.total_tokens,
          };
          cost = Number(cachedResult.cost);
          cached = true;
        } else {
          // Cache miss - call OpenAI
          // Convert to JPEG but keep original resolution for better OCR
          // OpenAI will handle resizing internally while preserving text readability
          const optimizedImage = await sharp(imageBuffer)
            .jpeg({ quality: 95, mozjpeg: true })
            .toBuffer();

          const base64Image = optimizedImage.toString("base64");

          // Use per-page content type from extraction job classification,
          // falling back to request-level sheetContentType, then generic
          const specializedPrompt: PromptConfig | null = pageContentType
            ? getPromptForContentType(pageContentType)
            : null;
          const systemPrompt =
            specializedPrompt?.systemPrompt ?? PARSE_SYSTEM_PROMPT;
          const userPrompt = specializedPrompt?.userPrompt ?? PARSE_USER_PROMPT;
          const maxTokens = specializedPrompt?.maxTokens ?? 2000;
          const imageDetail = specializedPrompt?.imageDetail ?? "high";

          if (specializedPrompt) {
            console.log(
              `[parse] Using specialized prompt for ${pageContentType}, maxTokens=${maxTokens}, detail=${imageDetail}`,
            );
          }

          let retryCount = 0;
          let success = false;

          const useGemini =
            specializedPrompt?.preferredModel === "gemini-2.5-pro" &&
            !!process.env.GOOGLE_AI_API_KEY;

          while (!success && retryCount < 2) {
            try {
              if (useGemini) {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { GoogleGenerativeAI } = await import(
                    // @ts-expect-error @google/generative-ai may not be installed
                    "@google/generative-ai"
                  );
                  const genai = new GoogleGenerativeAI(
                    process.env.GOOGLE_AI_API_KEY!,
                  );
                  const geminiModel = genai.getGenerativeModel({
                    model: GEMINI_MODEL,
                  });

                  const result = await geminiModel.generateContent({
                    contents: [
                      {
                        role: "user",
                        parts: [
                          { text: systemPrompt + "\n\n" + userPrompt },
                          {
                            inlineData: {
                              mimeType: "image/jpeg",
                              data: base64Image,
                            },
                          },
                        ],
                      },
                    ],
                    generationConfig: {
                      responseMimeType: "application/json",
                      maxOutputTokens: maxTokens,
                      temperature: 0.0,
                    },
                  });

                  const rawContent = result.response.text();
                  parseResult = JSON.parse(rawContent);

                  // Gemini doesn't return token counts the same way — estimate from chars
                  const estimatedTokens = Math.ceil(rawContent.length / 4);
                  tokenUsage = {
                    prompt_tokens: estimatedTokens,
                    completion_tokens: estimatedTokens,
                    total_tokens: estimatedTokens * 2,
                  };
                  cost =
                    tokenUsage.prompt_tokens * GEMINI_PRICING.prompt +
                    tokenUsage.completion_tokens * GEMINI_PRICING.completion;
                  modelUsed = GEMINI_MODEL;

                  console.log(`[parse] Gemini response for page ${page.id}:`, {
                    page_type: parseResult.page_type,
                    item_count: parseResult.items?.length || 0,
                    estimated_tokens: estimatedTokens,
                    cost: cost.toFixed(4),
                  });
                } catch (geminiError: any) {
                  if (
                    geminiError?.code === "MODULE_NOT_FOUND" ||
                    geminiError?.message?.includes("Cannot find module")
                  ) {
                    console.warn(
                      "[parse] @google/generative-ai not installed — falling back to OpenAI",
                    );
                  } else {
                    throw geminiError;
                  }

                  // Fallback to OpenAI
                  const response = await openai.chat.completions.create({
                    model: OPENAI_MODEL,
                    messages: [
                      { role: "system", content: systemPrompt },
                      {
                        role: "user",
                        content: [
                          { type: "text", text: userPrompt },
                          {
                            type: "image_url",
                            image_url: {
                              url: `data:image/jpeg;base64,${base64Image}`,
                              detail: imageDetail,
                            },
                          },
                        ],
                      },
                    ],
                    response_format: { type: "json_object" },
                    max_tokens: maxTokens,
                  });

                  const rawContent =
                    response.choices[0].message.content || "{}";
                  parseResult = JSON.parse(rawContent);
                  tokenUsage = response.usage || {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                  };
                  cost =
                    tokenUsage.prompt_tokens * OPENAI_PRICING.prompt +
                    tokenUsage.completion_tokens * OPENAI_PRICING.completion;
                  modelUsed = OPENAI_MODEL;

                  console.log(
                    `[parse] OpenAI fallback response for page ${page.id}:`,
                    {
                      page_type: parseResult.page_type,
                      item_count: parseResult.items?.length || 0,
                      tokens: tokenUsage.total_tokens,
                      cost: cost.toFixed(4),
                    },
                  );
                }
              } else {
                const response = await openai.chat.completions.create({
                  model: OPENAI_MODEL,
                  messages: [
                    {
                      role: "system",
                      content: systemPrompt,
                    },
                    {
                      role: "user",
                      content: [
                        { type: "text", text: userPrompt },
                        {
                          type: "image_url",
                          image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`,
                            detail: imageDetail,
                          },
                        },
                      ],
                    },
                  ],
                  response_format: { type: "json_object" },
                  max_tokens: maxTokens,
                });

                const rawContent = response.choices[0].message.content || "{}";
                parseResult = JSON.parse(rawContent);

                tokenUsage = response.usage || {
                  prompt_tokens: 0,
                  completion_tokens: 0,
                  total_tokens: 0,
                };
                cost =
                  tokenUsage.prompt_tokens * OPENAI_PRICING.prompt +
                  tokenUsage.completion_tokens * OPENAI_PRICING.completion;
                modelUsed = OPENAI_MODEL;

                // Debug logging
                console.log(`[parse] OpenAI response for page ${page.id}:`, {
                  page_type: parseResult.page_type,
                  item_count: parseResult.items?.length || 0,
                  has_warnings: !!parseResult.warnings,
                  has_notes: !!parseResult.raw_notes,
                  tokens: tokenUsage.total_tokens,
                  cost: cost.toFixed(4),
                });
              }

              success = true;
            } catch (apiError: any) {
              retryCount++;
              if (
                retryCount >= 2 ||
                (apiError.status !== 429 && apiError.status !== 500)
              ) {
                throw apiError;
              }
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount),
              );
            }
          }
        }

        // Validate response and insert takeoff items
        if (isSchedulePage) {
          // Schedule path: validate with schedule schema
          const scheduleResult =
            ScheduleExtractionResultSchema.parse(parseResult);
          const scheduleItems = convertScheduleToTakeoffItems(scheduleResult);

          // Store parse result
          const { data: storedResult, error: resultError } = await supabase
            .from("plan_parse_results")
            .insert({
              company_id: companyId,
              plan_page_id: page.id,
              raw_response: scheduleResult as any,
              page_type: scheduleResult.scheduleType,
              model: modelUsed,
              prompt_tokens: tokenUsage.prompt_tokens,
              completion_tokens: tokenUsage.completion_tokens,
              total_tokens: tokenUsage.total_tokens,
              cost,
              cached,
            } as any)
            .select()
            .single();

          if (resultError || !storedResult) {
            throw new Error("Failed to store parse result");
          }

          // Delete existing takeoff items for this page
          await supabase
            .from("takeoff_items")
            .delete()
            .eq("plan_page_id", page.id)
            .eq("company_id", companyId);

          if (scheduleItems.length > 0) {
            const insertRows = scheduleItems.map((item) => ({
              company_id: companyId,
              plan_page_id: page.id,
              plan_upload_id: planUploadId,
              category: item.category,
              sub_type: item.sub_type,
              trade: item.trade,
              quantity: item.quantity,
              unit: item.unit,
              confidence: item.confidence,
              extraction_method: item.extraction_method,
              needs_review: item.needs_review,
              notes: item.notes,
              waste_factor: 0,
              adjusted_quantity: item.quantity,
              review_status: "pending",
            }));
            const { error: itemsError } = await supabase
              .from("takeoff_items")
              .insert(insertRows as any);
            if (itemsError) {
              console.error(
                "[parse] Failed to insert schedule takeoff items:",
                itemsError,
              );
            }
          }
        } else {
          // Generic floor plan / MEP path
          const validated = ParseResponseSchema.parse(parseResult);

          // Store parse result
          const { data: storedResult, error: resultError } = await supabase
            .from("plan_parse_results")
            .insert({
              company_id: companyId,
              plan_page_id: page.id,
              raw_response: validated as any,
              page_type: validated.page_type || "unknown",
              model: modelUsed,
              prompt_tokens: tokenUsage.prompt_tokens,
              completion_tokens: tokenUsage.completion_tokens,
              total_tokens: tokenUsage.total_tokens,
              cost,
              cached,
            } as any)
            .select()
            .single();

          if (resultError || !storedResult) {
            throw new Error("Failed to store parse result");
          }

          // Delete existing takeoff items for this page to avoid duplicates
          await supabase
            .from("takeoff_items")
            .delete()
            .eq("plan_page_id", page.id)
            .eq("company_id", companyId);

          // Normalize and insert takeoff items
          const takeoffItems = validated.items.map((item) => ({
            ...normalizeTakeoffItem(item),
            company_id: companyId,
            plan_page_id: page.id,
            plan_upload_id: planUploadId,
          }));

          if (takeoffItems.length > 0) {
            const { error: itemsError } = await supabase
              .from("takeoff_items")
              .insert(takeoffItems);

            if (itemsError) {
              console.error(
                "[parse] Failed to insert takeoff items:",
                itemsError,
              );
            }
          }
        }

        // Log AI usage
        await supabase.from("ai_usage_log").insert({
          company_id: companyId,
          user_id: session.user.id,
          page_id: page.id,
          model: modelUsed,
          prompt_tokens: tokenUsage.prompt_tokens,
          completion_tokens: tokenUsage.completion_tokens,
          total_tokens: tokenUsage.total_tokens,
          cost,
          cached,
        } as any);

        // Update page status
        await supabase
          .from("plan_pages")
          .update({
            parse_status: "parsed",
            parsed_at: new Date().toISOString(),
          })
          .eq("id", page.id);

        parsed++;
      } catch (pageError: any) {
        console.error("[parse] Page parse error:", pageError);

        await supabase
          .from("plan_pages")
          .update({ parse_status: "parse_failed" })
          .eq("id", page.id);

        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPages: pages.length,
        parsed,
        failed,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    });
  } catch (error) {
    console.error("[parse] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Parse failed" },
      { status: 500 },
    );
  }
}
