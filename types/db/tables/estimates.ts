import type { Database } from "@/types/database.types";

// Base table types (auto-generated references)
export type PlanUpload = Database["public"]["Tables"]["plan_uploads"]["Row"];
export type PlanUploadInsert =
  Database["public"]["Tables"]["plan_uploads"]["Insert"];
export type PlanUploadUpdate =
  Database["public"]["Tables"]["plan_uploads"]["Update"];

export type PlanPage = Database["public"]["Tables"]["plan_pages"]["Row"];
export type PlanPageInsert =
  Database["public"]["Tables"]["plan_pages"]["Insert"];
export type PlanPageUpdate =
  Database["public"]["Tables"]["plan_pages"]["Update"];

export type PlanParseResult =
  Database["public"]["Tables"]["plan_parse_results"]["Row"];
export type PlanParseResultInsert =
  Database["public"]["Tables"]["plan_parse_results"]["Insert"];
export type PlanParseResultUpdate =
  Database["public"]["Tables"]["plan_parse_results"]["Update"];

export type TakeoffItem = Database["public"]["Tables"]["takeoff_items"]["Row"];
export type TakeoffItemInsert =
  Database["public"]["Tables"]["takeoff_items"]["Insert"];
export type TakeoffItemUpdate =
  Database["public"]["Tables"]["takeoff_items"]["Update"];

export type Estimate = Database["public"]["Tables"]["estimates"]["Row"];
export type EstimateInsert =
  Database["public"]["Tables"]["estimates"]["Insert"];
export type EstimateUpdate =
  Database["public"]["Tables"]["estimates"]["Update"];

export type EstimateLineItem =
  Database["public"]["Tables"]["estimate_line_items"]["Row"];
export type EstimateLineItemInsert =
  Database["public"]["Tables"]["estimate_line_items"]["Insert"];
export type EstimateLineItemUpdate =
  Database["public"]["Tables"]["estimate_line_items"]["Update"];

export type PricingTemplate =
  Database["public"]["Tables"]["pricing_templates"]["Row"];
export type PricingTemplateInsert =
  Database["public"]["Tables"]["pricing_templates"]["Insert"];
export type PricingTemplateUpdate =
  Database["public"]["Tables"]["pricing_templates"]["Update"];

export type PricingTemplateItem =
  Database["public"]["Tables"]["pricing_template_items"]["Row"];
export type PricingTemplateItemInsert =
  Database["public"]["Tables"]["pricing_template_items"]["Insert"];
export type PricingTemplateItemUpdate =
  Database["public"]["Tables"]["pricing_template_items"]["Update"];

export type AiUsageLog = Database["public"]["Tables"]["ai_usage_log"]["Row"];
export type AiUsageLogInsert =
  Database["public"]["Tables"]["ai_usage_log"]["Insert"];
export type AiUsageLogUpdate =
  Database["public"]["Tables"]["ai_usage_log"]["Update"];

// Enum types
export type PlanUploadStatus =
  Database["public"]["Enums"]["plan_upload_status"];
export type PlanPageParseStatus =
  Database["public"]["Enums"]["plan_page_parse_status"];
export type EstimateStatus = Database["public"]["Enums"]["estimate_status"];
export type TakeoffCategory = Database["public"]["Enums"]["takeoff_category"];
export type ExtractionMethod = Database["public"]["Enums"]["extraction_method"];
export type ReviewStatus = Database["public"]["Enums"]["review_status"];

// Joined types
export type EstimateWithLineItems = Estimate & {
  lineItems: EstimateLineItem[];
};

export type PricingTemplateWithItems = PricingTemplate & {
  items: PricingTemplateItem[];
};

export type PlanUploadWithPages = PlanUpload & {
  pages: PlanPage[];
};

export type PlanPageWithParseResult = PlanPage & {
  parseResult?: PlanParseResult;
  signedUrl?: string | null;
};

export type TakeoffItemWithPage = TakeoffItem & {
  page: PlanPage;
};

// Input types for server actions
export type CreateEstimateInput = {
  projectId: string;
  planUploadId?: string;
  name: string;
  description?: string;
  overheadPct?: number;
  markupPct?: number;
  lineItems: {
    takeoffItemId?: string;
    trade: string;
    category: TakeoffCategory;
    subType: string;
    description?: string;
    quantity: number;
    unit: string;
    materialCost?: number;
    laborCost?: number;
    equipmentCost?: number;
    unitCost: number;
  }[];
};

export type UpdateEstimateInput = {
  estimateId: string;
  name?: string;
  description?: string;
  overheadPct?: number;
  markupPct?: number;
};

export type ReviewTakeoffItemInput = {
  itemId: string;
  reviewStatus: ReviewStatus;
  notes?: string;
};

export type ManualTakeoffInput = {
  planUploadId: string;
  planPageId: string;
  category: TakeoffCategory;
  subType: string;
  quantity: number;
  unit: string;
  trade: string;
  notes?: string;
};

export type CreatePricingTemplateInput = {
  name: string;
  description?: string;
  isDefault?: boolean;
  items: {
    trade: string;
    category: TakeoffCategory;
    subType: string;
    materialCost?: number;
    laborCost?: number;
    equipmentCost?: number;
    unitCost: number;
    unit: string;
  }[];
};

// AI response types
export type AiTakeoffItem = {
  id: string;
  category: TakeoffCategory;
  sub_type: string;
  quantity: number;
  unit: string;
  confidence: number;
  extraction_method: ExtractionMethod;
  source_region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  notes?: string;
};

export type AiParseResponse = {
  page_type?: string;
  items: AiTakeoffItem[];
  raw_notes?: string;
  warnings?: string[];
};
