"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const SendChatMessageSchema = z.object({
  estimateId: z.string().uuid(),
  message: z.string().min(1),
});

// ============================================
// TYPES
// ============================================

interface PlanReference {
  pageNumber: number;
  region?: { x: number; y: number; width: number; height: number };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan_references: PlanReference[];
  created_at: string;
  created_by: string | null;
}

// ============================================
// AI PLAN CHAT ACTIONS
// ============================================

/**
 * Get chat history for an estimate
 * P2.1: AI Plan Chat Backend (EST-P2-001)
 */
export async function getChatHistory(estimateId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Validate estimate belongs to company
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select("id")
      .eq("id", estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimateError || !estimate) {
      return { success: false, error: "Estimate not found" };
    }

    // Get chat messages
    const { data, error } = await context.supabase
      .from("estimate_chat_messages" as any)
      .select("*")
      .eq("estimate_id", estimateId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as unknown as ChatMessage[] };
  } catch (error) {
    console.error("[getChatHistory] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch chat history",
    };
  }
}

/**
 * Send chat message and get AI response
 * P2.1: AI Plan Chat Backend (EST-P2-001)
 */
export async function sendChatMessage(
  input: z.infer<typeof SendChatMessageSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = SendChatMessageSchema.parse(input);

    // Validate estimate belongs to company
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select(
        `
        id,
        name,
        project_id,
        plan_upload_id,
        projects (
          id,
          name
        )
      `,
      )
      .eq("id", validated.estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimateError || !estimate) {
      return { success: false, error: "Estimate not found" };
    }

    // Get plan extraction results for context
    let planContext = "";
    if (estimate.plan_upload_id) {
      const { data: planResults } = await context.supabase
        .from("plan_parse_results" as any)
        .select("result")
        .eq("plan_upload_id", estimate.plan_upload_id)
        .limit(1)
        .single();

      if ((planResults as any)?.result) {
        planContext = JSON.stringify((planResults as any).result);
      }
    }

    // Get takeoff items for context
    const { data: takeoffItems } = await context.supabase
      .from("takeoff_items")
      .select("trade, category, sub_type, description, quantity, unit")
      .eq("plan_upload_id", estimate.plan_upload_id || "")
      .limit(50);

    // Insert user message
    const { error: userMsgError } = await context.supabase
      .from("estimate_chat_messages" as any)
      .insert({
        company_id: context.companyId,
        estimate_id: validated.estimateId,
        role: "user",
        content: validated.message,
        plan_references: [],
        created_by: context.userId,
      });

    if (userMsgError) throw userMsgError;

    // Call OpenAI for AI response
    const aiResponse = await generateAIResponse({
      userMessage: validated.message,
      planContext,
      takeoffItems: (takeoffItems || []) as any[],
      estimateName: estimate.name,
    });

    // Insert AI message
    const { data: aiMessage, error: aiMsgError } = await context.supabase
      .from("estimate_chat_messages" as any)
      .insert({
        company_id: context.companyId,
        estimate_id: validated.estimateId,
        role: "assistant",
        content: aiResponse.content,
        plan_references: aiResponse.references,
      })
      .select()
      .single();

    if (aiMsgError) throw aiMsgError;

    revalidatePath(`/projects/${estimate.project_id}`);

    return { success: true, data: aiMessage };
  } catch (error) {
    console.error("[sendChatMessage] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send chat message",
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function generateAIResponse(params: {
  userMessage: string;
  planContext: string;
  takeoffItems: Array<{
    trade: string;
    category: string;
    sub_type: string;
    description: string;
    quantity: number;
    unit: string;
  }>;
  estimateName: string;
}): Promise<{ content: string; references: PlanReference[] }> {
  const { userMessage, planContext, takeoffItems, estimateName } = params;

  // Build context for AI
  const systemPrompt = `You are an AI assistant helping with construction plan analysis for the estimate "${estimateName}".

You have access to:
1. Plan extraction results (if available)
2. Takeoff items with quantities

Answer questions concisely and reference specific plan elements when possible.
Format references as [Page X, Region Y] when applicable.`;

  const userPrompt = `Plan Context: ${planContext.substring(0, 2000)}

Takeoff Items (first 50):
${takeoffItems
  .map(
    (item) =>
      `- ${item.trade}: ${item.description} (${item.quantity} ${item.unit})`,
  )
  .join("\n")}

User Question: ${userMessage}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content =
      data.choices[0]?.message?.content || "I couldn't generate a response.";

    // Extract references from AI response (simple regex for [Page X] format)
    const references: PlanReference[] = [];
    const referencePattern = /\[Page (\d+)(?:, Region ([A-Z]\d+))?\]/gi;
    let match;

    while ((match = referencePattern.exec(content)) !== null) {
      references.push({
        pageNumber: parseInt(match[1], 10),
        region: match[2] ? undefined : undefined,
      });
    }

    return { content, references };
  } catch (error) {
    console.error("[generateAIResponse] Error:", error);
    return {
      content:
        "I encountered an error processing your request. Please try again.",
      references: [],
    };
  }
}
