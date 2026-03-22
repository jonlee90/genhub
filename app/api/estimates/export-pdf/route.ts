import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth-context";
import { renderToStream } from "@react-pdf/renderer";
import { EstimatePdfDocument } from "@/lib/pdf/EstimatePdfDocument";

/**
 * GET /api/estimates/export-pdf?estimateId={id}&options={json}
 *
 * Task: EST-P2-005 PDF Export with Company Branding
 *
 * Query Parameters:
 * - estimateId (required): Estimate ID to export
 * - options (optional): JSON object with export options:
 *   - includeTrades: string[] - Filter specific trades
 *   - detailLevel: "summary" | "detailed" - Detail level
 *   - includePlans: boolean - Include plan thumbnails
 *
 * Returns: PDF blob with Content-Disposition header
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const estimateId = searchParams.get("estimateId");

    if (!estimateId) {
      return NextResponse.json(
        { error: "estimateId is required" },
        { status: 400 },
      );
    }

    // Get user context
    const context = await getUserContext();
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: 401 });
    }

    // Parse export options
    const optionsParam = searchParams.get("options");
    const options = optionsParam ? JSON.parse(optionsParam) : {};

    // Fetch estimate with line items and related data
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select(
        `
        *,
        project:projects!inner(id, name, address, city, state),
        created_by_user:users!estimates_created_by_fkey(id, name, email)
      `,
      )
      .eq("id", estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 },
      );
    }

    // Fetch line items
    const { data: lineItems, error: lineItemsError } = await context.supabase
      .from("estimate_line_items")
      .select("*")
      .eq("estimate_id", estimateId)
      .eq("company_id", context.companyId)
      .order("sort_order", { ascending: true });

    if (lineItemsError) {
      throw lineItemsError;
    }

    // Fetch company details for branding
    const { data: company, error: companyError } = await context.supabase
      .from("companies")
      .select("id, name, logo_url")
      .eq("id", context.companyId)
      .single();

    if (companyError) {
      throw companyError;
    }

    // Fetch plan pages if includePlans option is true
    let planPages = null;
    if (options.includePlans && estimate.plan_upload_id) {
      const { data: pages } = await context.supabase
        .from("plan_pages")
        .select("id, page_number, image_path")
        .eq("plan_upload_id", estimate.plan_upload_id)
        .eq("company_id", context.companyId)
        .order("page_number", { ascending: true })
        .limit(3); // Max 3 thumbnails

      if (pages && pages.length > 0) {
        // Generate signed URLs for thumbnails
        planPages = await Promise.all(
          pages.map(async (page) => {
            const { data: signedUrl } = await context.supabase.storage
              .from("plan-pages")
              .createSignedUrl(page.image_path, 3600);

            return {
              pageNumber: page.page_number,
              url: signedUrl?.signedUrl || null,
            };
          }),
        );
      }
    }

    // Filter line items by trade if specified
    const filteredLineItems = options.includeTrades
      ? lineItems?.filter((item) => options.includeTrades.includes(item.trade))
      : lineItems;

    // Generate PDF document
    const pdfDocument = EstimatePdfDocument({
      estimate,
      lineItems: filteredLineItems || [],
      company,
      project: estimate.project as any,
      createdBy: estimate.created_by_user as any,
      options: {
        detailLevel: options.detailLevel || "detailed",
        includePlans: options.includePlans || false,
        planPages: planPages || [],
      },
    });

    // Render to stream
    const stream = await renderToStream(pdfDocument);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Uint8Array);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF with proper headers
    return new NextResponse(buffer as unknown as Uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="estimate-${estimate.name.replace(/[^a-z0-9]/gi, "-")}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[export-pdf] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 },
    );
  }
}
