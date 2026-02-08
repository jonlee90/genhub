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
import { normalizeTakeoffItem } from "@/lib/ai/normalize-takeoff";
import { createHash } from "crypto";

const OPENAI_MODEL = "gpt-4o";
const OPENAI_PRICING = {
  prompt: 0.0025 / 1000, // $0.0025 per 1K tokens
  completion: 0.01 / 1000, // $0.01 per 1K tokens
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

    const { planUploadId, pageIds } = body;

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
          const resizedImage = await sharp(imageBuffer)
            .resize(2048, null, { withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

          const base64Image = resizedImage.toString("base64");

          let retryCount = 0;
          let success = false;

          while (!success && retryCount < 2) {
            try {
              const response = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                  {
                    role: "system",
                    content: PARSE_SYSTEM_PROMPT,
                  },
                  {
                    role: "user",
                    content: [
                      { type: "text", text: PARSE_USER_PROMPT },
                      {
                        type: "image_url",
                        image_url: {
                          url: `data:image/jpeg;base64,${base64Image}`,
                        },
                      },
                    ],
                  },
                ],
                response_format: { type: "json_object" },
                max_tokens: 2000,
              });

              parseResult = JSON.parse(
                response.choices[0].message.content || "{}",
              );
              tokenUsage = response.usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
              };
              cost =
                tokenUsage.prompt_tokens * OPENAI_PRICING.prompt +
                tokenUsage.completion_tokens * OPENAI_PRICING.completion;

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

        // Validate response
        const validated = ParseResponseSchema.parse(parseResult);

        // Store parse result
        const { data: storedResult, error: resultError } = await supabase
          .from("plan_parse_results")
          .insert({
            plan_page_id: page.id,
            raw_response: validated as any,
            page_type: validated.page_type || "unknown",
            model: OPENAI_MODEL,
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

        // Log AI usage
        await supabase.from("ai_usage_log").insert({
          company_id: companyId,
          user_id: session.user.id,
          page_id: page.id,
          model: OPENAI_MODEL,
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
